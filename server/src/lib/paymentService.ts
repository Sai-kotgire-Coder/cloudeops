import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from './prisma.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export interface CreateOrderRequest {
  userId: string;
  amount: number;
  planType: string;
  planDurationDays: number;
}

export interface VerifyPaymentRequest {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  order?: any;
  payment?: any;
}

/**
 * Create a payment order with Razorpay
 */
export async function createPaymentOrder(request: CreateOrderRequest): Promise<PaymentResponse> {
  try {
    const { userId, amount, planType, planDurationDays } = request;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: `${userId.substring(0, 8)}-${Date.now().toString().slice(-8)}`,
      notes: {
        userId,
        planType,
        planDurationDays
      }
    });

    // Store payment record in DB
    const payment = await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: razorpayOrder.id,
        amount,
        currency: 'INR',
        status: 'created',
        planType,
        planDurationDays
      }
    });

    return {
      success: true,
      message: 'Order created successfully',
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      }
    };
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    return {
      success: false,
      message: `Failed to create order: ${error.message}`
    };
  }
}

/**
 * Verify payment signature and update user plan
 */
export async function verifyPayment(request: VerifyPaymentRequest): Promise<PaymentResponse> {
  try {
    const { userId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = request;

    // Generate signature to verify
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpaySignature) {
      return {
        success: false,
        message: 'Payment signature verification failed'
      };
    }

    // Fetch payment from DB
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId }
    });

    if (!payment) {
      return {
        success: false,
        message: 'Payment record not found'
      };
    }

    if (payment.userId !== userId) {
      return {
        success: false,
        message: 'Payment user mismatch'
      };
    }

    // Fetch Razorpay payment details to verify
    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

    if (razorpayPayment.status !== 'captured') {
      return {
        success: false,
        message: 'Payment not captured'
      };
    }

    // Calculate plan expiry
    const planExpiry = new Date();
    planExpiry.setDate(planExpiry.getDate() + payment.planDurationDays);

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        status: 'completed',
        signature: razorpaySignature
      }
    });

    // Update user plan
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isPro: true,
        planType: 'pro',
        planExpiry
      }
    });

    return {
      success: true,
      message: 'Payment verified and user upgraded to Pro',
      payment: {
        status: 'completed',
        planExpiry
      }
    };
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      message: `Payment verification failed: ${error.message}`
    };
  }
}

/**
 * Get current user plan details
 */
export async function getUserPlanDetails(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isPro: true,
        planType: true,
        planExpiry: true
      }
    });

    if (!user) {
      return null;
    }

    // Check if plan expired
    let isExpired = false;
    if (user.isPro && user.planExpiry) {
      isExpired = new Date() > user.planExpiry;
      
      // If expired, downgrade user
      if (isExpired) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: false,
            planType: 'free',
            planExpiry: null
          }
        });
        
        return {
          ...user,
          isPro: false,
          planType: 'free',
          isExpired: true
        };
      }
    }

    return {
      ...user,
      isExpired: false
    };
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return null;
  }
}

/**
 * Check if user can access a feature based on plan
 */
export async function canAccessFeature(userId: string, featureName: string): Promise<boolean> {
  try {
    const plan = await getUserPlanDetails(userId);

    if (!plan) {
      return false;
    }

    // Define feature restrictions
    const freeFeatures = [
      'view_dashboard',
      'basic_monitoring',
      'read_docs'
    ];

    // Pro users can access all features
    if (plan.isPro) {
      return true;
    }

    // Free users can only access free features
    return freeFeatures.includes(featureName);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

// Re-exported for existing callers -- the actual implementation moved to
// planLimits.ts so it can be unit tested without pulling in the Razorpay
// SDK (this module constructs a Razorpay client at import time, which
// throws without real credentials).
export { getUsageLimits } from './planLimits.js';

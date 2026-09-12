import React, { useCallback, useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

interface PaymentHandlerProps {
  onPaymentSuccess?: (paymentDetails: any) => void;
  onPaymentError?: (error: string) => void;
  amount?: number;
  planDurationDays?: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const usePaymentHandler = ({
  onPaymentSuccess,
  onPaymentError,
  amount = 9900, // ₹99 in paise
  planDurationDays = 30,
}: PaymentHandlerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const initializePayment = useCallback(async () => {
    try {
      setIsLoading(true);

      // Step 1: Create order on backend
      const { order } = await apiClient.createPaymentOrder(amount, planDurationDays);

      // Step 2: Open Razorpay payment modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_YOUR_KEY_ID',
        amount: order.amount,
        currency: 'INR',
        order_id: order.id,
        name: 'CloudOps Simulator',
        description: `Pro Plan - ${planDurationDays} days`,
        image: '/logo.svg',
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment on backend
            const verifyData = await apiClient.verifyPayment(
              order.id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            toast({
              title: 'Success! 🎉',
              description: 'You have been upgraded to Pro plan',
            });

            onPaymentSuccess?.(verifyData);
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: 'Error',
              description: 'Payment verification failed',
              variant: 'destructive',
            });
            onPaymentError?.(error.message);
          }
        },
        prefill: {
          email: 'user@example.com', // Should be fetched from user context
        },
        notes: {
          planType: 'pro',
          planDurationDays,
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response);
        toast({
          title: 'Payment Failed',
          description: response.error.description || 'An error occurred',
          variant: 'destructive',
        });
        onPaymentError?.(response.error.description);
      });

      rzp.open();
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize payment',
        variant: 'destructive',
      });
      onPaymentError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [amount, planDurationDays, toast, onPaymentSuccess, onPaymentError]);

  return { initializePayment, isLoading };
};

export default usePaymentHandler;

# SaaS Pro Plan + Payment Gateway Implementation Guide

## ✅ What's Been Implemented

### 1. **Database Schema Updates**
- Added plan management fields to User model:
  - `isPro`: boolean (default false)
  - `planType`: string ("free" or "pro")
  - `planExpiry`: DateTime (plan expiration date)
- Created Payment model to track all transactions:
  - Razorpay order IDs, payment IDs, signatures
  - Payment status (created, pending, completed, failed)
  - Plan details and amounts

### 2. **Backend Payment Service** (`server/src/lib/paymentService.ts`)
Features:
- ✅ Create Razorpay payment orders
- ✅ Verify payment signatures (cryptographic security)
- ✅ Update user to Pro after successful payment
- ✅ Check plan expiry and downgrade if needed
- ✅ Get usage limits based on plan
- ✅ Define feature restrictions per plan

### 3. **Payment API Endpoints** (`server/src/routes/payment.ts`)
Endpoints:
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify and process payment
- `GET /api/payment/plan` - Get user's current plan
- `GET /api/payment/usage` - Get resource usage stats
- `GET /api/payment/pricing` - Get pricing information

### 4. **Feature Gating Implementation**
Applied to:
- **Instances**: Free users can create 1, Pro users unlimited
- **Applications**: Free users can create 1, Pro users unlimited
- **Pipelines**: Free users can create 2, Pro users unlimited
- **Containers**: Free users can create 3, Pro users unlimited

Usage limits automatically enforced when creating resources.

### 5. **Frontend Components**

#### **UpgradeModal** (`src/components/payment/UpgradeModal.tsx`)
- Shows when users hit resource limits
- Displays feature benefits
- Triggers upgrade flow

#### **PricingPage** (`src/components/payment/PricingPage.tsx`)
- Full pricing page with both Free and Pro plans
- Shows limits and features
- Handles upgrade button
- FAQ section

#### **FeatureLock** (`src/components/payment/FeatureLock.tsx`)
- `<FeatureLock>` - Gray out pro-only features
- `<ProBadge>` - Show "Pro" badge on features
- `<UpgradeCTA>` - Show upgrade call-to-action

#### **Hooks**
- `usePaymentHandler` - Handle Razorpay payment flow
- `usePlanCheck` - Check user plan and resource usage

### 6. **Usage Limits Per Plan**
```
Free Plan:
  - Instances: 1
  - Applications: 1
  - Pipelines: 2
  - Containers: 3
  - Scenarios: 1
  - Tickets: 5
  - Storage: 5GB

Pro Plan:
  - Instances: Unlimited
  - Applications: Unlimited
  - Pipelines: Unlimited
  - Containers: Unlimited
  - Scenarios: Unlimited
  - Tickets: Unlimited
  - Storage: 100GB
```

---

## 🔧 Setup Instructions

### Step 1: Create Razorpay Account
1. Go to [razorpay.com](https://razorpay.com)
2. Sign up and create an account
3. Complete KYC verification
4. Go to Settings > API Keys
5. Copy your **Key ID** (public) and **Key Secret** (private)

### Step 2: Update Environment Variables

**`server/.env`:**
```env
# Existing config...

# Razorpay Configuration
RAZORPAY_KEY_ID="rzp_live_YOUR_KEY_ID"
RAZORPAY_KEY_SECRET="YOUR_KEY_SECRET"
RAZORPAY_WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"

# Pro Plan Configuration
PRO_PLAN_AMOUNT=99900  # ₹999 in paise
PRO_PLAN_CURRENCY="INR"
PRO_PLAN_DURATION_DAYS=30
```

### Step 3: Install Dependencies

**Backend:**
```bash
cd server
npm install razorpay
npm run db:push  # Push schema changes to DB
```

**Frontend:**
Add to `.env`:
```env
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
```

### Step 4: Run Database Migration

```bash
cd server
npm run db:push
```

This creates:
- Plan fields on users table
- New payments table
- Proper indexes for performance

### Step 5: Add Pricing Page Route

In your frontend routing (`src/pages/` or similar):

```typescript
import { PricingPage } from '@/components/payment/PricingPage';

// Add route
<Route path="/pricing" element={<PricingPage />} />
```

Add link in navigation:
```jsx
<a href="/pricing" className="text-blue-600 hover:underline">
  Pricing 🚀
</a>
```

---

## 📝 Usage Examples

### Example 1: Check User's Plan and Usage

```typescript
import { usePlanCheck } from '@/components/payment';

function MyComponent() {
  const {
    plan,
    usage,
    isPro,
    canCreateResource,
    getRemainCount,
    isApproachingLimit,
  } = usePlanCheck();

  if (plan?.isPro) {
    return <div>Welcome Pro User! 🚀</div>;
  }

  // Show warning if approaching limit
  if (isApproachingLimit('instances', 80)) {
    return <div>You're using 80% of your instance limit</div>;
  }

  // Get remaining resources
  const remainInstances = getRemainCount('instances');
  return <div>You can create {remainInstances} more instance(s)</div>;
}
```

### Example 2: Handle Resource Creation with Gating

```typescript
import { UpgradeModal } from '@/components/payment';
import { usePaymentHandler } from '@/components/payment';
import { usePlanCheck } from '@/components/payment';

function CreateInstancePage() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { isPro, canCreateResource, usage } = usePlanCheck();
  const { initializePayment, isLoading } = usePaymentHandler();

  const handleCreateInstance = async () => {
    // Check if can create
    if (!canCreateResource('instances')) {
      setShowUpgrade(true);
      return;
    }

    // Proceed with creation
    const response = await fetch('/api/instances', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Instance' }),
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403) {
      // Backend also enforces limits
      setShowUpgrade(true);
    }
  };

  return (
    <>
      <button onClick={handleCreateInstance}>Create Instance</button>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={initializePayment}
        resourceType="instances"
        current={usage?.usage.instances.current || 0}
        limit={usage?.usage.instances.limit || 1}
        features={[
          'Unlimited instances',
          'Advanced monitoring',
          'Priority support',
        ]}
        isLoading={isLoading}
      />
    </>
  );
}
```

### Example 3: Lock Pro-Only Features

```typescript
import { FeatureLock, ProBadge } from '@/components/payment';

function AdvancedSettings() {
  const { isPro } = usePlanCheck();

  return (
    <div>
      <h2>Advanced Settings <ProBadge size="md" /></h2>

      <FeatureLock
        isLocked={!isPro}
        featureName="Custom Monitoring"
        onUpgradeClick={() => navigate('/pricing')}
      >
        <div className="p-4 border rounded">
          <label>
            <input type="checkbox" /> Enable custom metrics
          </label>
        </div>
      </FeatureLock>
    </div>
  );
}
```

---

## 🔐 Security Notes

### ✅ What's Secure
1. **Signature Verification**: All payments verified using HMAC-SHA256
2. **Backend Enforcement**: Limits checked on every API call
3. **Token Validation**: JWT tokens verified for all endpoints
4. **Plan Expiry Checks**: Auto-downgrades expired plans

### ⚠️ Important
- **API Keys**: Never commit `.env` files with actual keys
- **Signature Secret**: Used only on backend, never sent to frontend
- **Payment Verification**: Always verify on backend, never trust frontend
- **HTTPS Only**: Use HTTPS in production for all payment endpoints

---

## 🧪 Testing the Payment Flow

### Local Testing

1. **Create Test Order:**
```bash
curl -X POST http://localhost:3002/api/payment/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 99900, "planDurationDays": 30}'
```

2. **Test Razorpay UI**:
- Razorpay provides test credit cards
- See: https://razorpay.com/docs/payments/payments-gateway/test-card-details/

### Test Cards:
- **Visa**: 4111111111111111 (Exp: any future date, CVV: any 3 digits)
- **MasterCard**: 5555555555554444
- Result: Success (gets captured immediately in test mode)

---

## 📊 Monitoring Payment Health

### Check Payment Status:
```typescript
// Fetch a specific payment
GET /api/payment/plan

Response: {
  id: "user-id",
  email: "user@example.com",
  isPro: true,
  planType: "pro",
  planExpiry: "2026-05-07T00:00:00Z",
  limits: {...}
}
```

### Get User Usage:
```typescript
GET /api/payment/usage

Response: {
  plan: "pro",
  usage: {
    instances: { current: 5, limit: Infinity },
    applications: { current: 2, limit: Infinity },
    ...
  }
}
```

---

## 🚀 Next Steps (Optional)

### 1. Subscription Management
```typescript
// Add endpoint for renewing/changing plan
POST /api/payment/renew
POST /api/payment/change-plan
DELETE /api/payment/cancel
```

### 2. Invoice Generation
```typescript
// Send invoices after payment
POST /api/payment/send-invoice
GET /api/payment/invoices
```

### 3. Webhook Handling
```typescript
// Handle Razorpay webhooks
POST /api/payment/webhook
// Re-verify payments, handle refunds, etc.
```

### 4. Analytics
```typescript
// Track conversion rates, MRR, etc.
GET /api/admin/payment-analytics
```

### 5. Pro Plan Features
- Custom dashboards
- Team management
- API access
- Advanced reporting
- Dedicated support

---

## 🐛 Troubleshooting

### Issue: "Razorpay not defined"
**Solution**: Ensure Razorpay script is loaded in `index.html`

### Issue: Signature verification failed
**Solution**: 
1. Verify `RAZORPAY_KEY_SECRET` is correct
2. Check webhook secret is configured
3. Ensure timestamps are in sync

### Issue: Payment order creation fails
**Solution**:
1. Verify API keys in `.env`
2. Check Razorpay account is active
3. Ensure sufficient permissions on API keys

### Issue: User not upgraded after payment
**Solution**:
1. Check payment status is "completed"
2. Verify database migrations ran (`npm run db:push`)
3. Check logs for errors during verification

---

## 📞 Support

For issues or questions:
1. Check Razorpay docs: https://razorpay.com/docs
2. Review payment service code: `server/src/lib/paymentService.ts`
3. Check API responses for error messages
4. Enable request logging in payment routes

---

## 🎯 Success Metrics

Track these to measure implementation success:

1. **Signup Rate**: Free → Pro conversion
2. **Payment Success Rate**: Target > 95%
3. **Average Plan Duration**: Track upgrades
4. **Feature Usage**: Track Pro feature adoption
5. **Customer Support**: Monitor payment-related tickets

---

**Implementation Date**: April 2026
**Version**: 1.0
**Payment Provider**: Razorpay (India-friendly)

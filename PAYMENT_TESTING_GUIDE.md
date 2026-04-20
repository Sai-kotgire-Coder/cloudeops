# 🔧 Payment Integration - Quick Troubleshooting & Testing

## ✅ Issues Fixed

1. **❌ PRO_PLAN_AMOUNT was 9.0** → ✅ Fixed to 99900 (₹999 in paise)
2. **❌ Custom verifyToken middleware** → ✅ Changed to use standard authMiddleware
3. **❌ userId undefined errors** → ✅ Fixed JWT token parsing

## 🧪 Testing Payment Flow

### Prerequisites
- Backend running on http://localhost:3002 ✅
- Frontend running on http://localhost:5173 
- User logged in with valid auth token

### Step 1: Get Your Auth Token
After login, check browser localStorage:
```javascript
// In browser console
localStorage.getItem('auth_token')
```

### Step 2: Test Payment Endpoints

#### Test Get Plan Endpoint
```bash
curl -X GET http://localhost:3002/api/payment/plan \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Expected Response (200 OK):
```json
{
  "id": "user-id-here",
  "email": "user@example.com",
  "isPro": false,
  "planType": "free",
  "planExpiry": null,
  "limits": {
    "maxInstances": 1,
    "maxApplications": 1,
    "maxPipelines": 2,
    "maxContainers": 3
  }
}
```

#### Test Create Order Endpoint
```bash
curl -X POST http://localhost:3002/api/payment/create-order \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99900,
    "planDurationDays": 30
  }'
```

Expected Response (201 Created):
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": "order_1234567890",
    "amount": 99900,
    "currency": "INR"
  }
}
```

#### Test Pricing Endpoint (No Auth Required)
```bash
curl -X GET http://localhost:3002/api/payment/pricing
```

Expected Response:
```json
{
  "free": {
    "name": "Free Plan",
    "price": 0,
    "features": [...],
    "limits": {...}
  },
  "pro": {
    "name": "Pro Plan",
    "price": 999,
    "features": [...],
    "limits": {...}
  }
}
```

---

## 🔍 Debugging Errors

### ❌ Error: 401 Unauthorized
**Cause:** Auth token not sent or invalid
**Solution:**
1. Make sure you're logged in
2. Check token in localStorage: `localStorage.auth_token`
3. Include full Bearer token: `Authorization: Bearer {token}`

### ❌ Error: 404 Not Found
**Cause:** Routes not mounted properly
**Solution:**
1. Check `server/src/app.ts` has: `app.use('/api/payment', paymentRoutes);`
2. Restart server

### ❌ Error: "Argument where of type UserWhereUniqueInput needs at least one of id or email"
**Cause:** userId is undefined - JWT not parsed correctly
**Solution:**
1. Verify authMiddleware is being used ✅ (Just fixed)
2. Check JWT_SECRET in .env matches
3. Restart server

### ❌ Error: "RAZORPAY_KEY_ID is not configured"
**Cause:** Environment variables not loaded
**Solution:**
```bash
# Verify .env file
cat server/.env | grep RAZORPAY

# Should show:
# RAZORPAY_KEY_ID="rzp_live_SfgNQPt4hhp1AF"
# RAZORPAY_KEY_SECRET="OIf0I3ccYukKpwaTO2d7Qye2"

# Restart server if changed
```

---

## 🎯 Full Payment Flow Test

### 1. Frontend - Register/Login
```
1. Go to http://localhost:5173/register
2. Create account
3. Verify OTP
4. Login
```

### 2. Frontend - Check Auth Token
```javascript
// Browser console
const token = localStorage.getItem('auth_token');
console.log('Token:', token);
```

### 3. Backend - Verify Payment Plan
```bash
TOKEN="your_token_here"
curl -s -X GET http://localhost:3002/api/payment/plan \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 4. Frontend - Navigate to Pricing
```
1. After login, go to /pricing
2. Should see pricing cards
3. Click "Upgrade to Pro"
```

### 5. Razorpay Checkout - Complete Payment
```
1. Modal opens
2. Enter payment details
3. Complete payment
4. Verification happens automatically
```

### 6. Verify Upgrade Success
```javascript
// Browser console
fetch('/api/payment/plan', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
})
.then(r => r.json())
.then(data => console.log('Plan:', data))

// Should show: "isPro": true
```

---

## ✅ What's Working Now

- [x] Razorpay credentials configured
- [x] Payment routes mounted correctly  
- [x] Auth middleware properly set up
- [x] JWT token verification working
- [x] Backend endpoints responding
- [x] Database models ready (User, Payment)
- [x] Plan limits configured

---

## 🚀 Ready for Testing

All backend issues are fixed. Ready to:
1. Test payment flow manually
2. Verify Razorpay integration
3. Test resource limits by plan

**Start with:** Go to http://localhost:5173/pricing and click "Upgrade to Pro"

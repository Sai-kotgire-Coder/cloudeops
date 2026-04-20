# ✅ Vercel Deployment Checklist

## 🎯 Quick Summary

You need to add **12 environment variables** to Vercel's dashboard.

---

## 📋 Environment Variables to Add

Copy these into Vercel Settings → Environment Variables:

```
DATABASE_URL=postgres://avnadmin:AVNS_uBKLm0E_NuYqJ4Hn-bH@cloudops-saikotgire9-45cd.g.aivencloud.com:10087/qadb?sslmode=require

JWT_SECRET=416a078e7975ee5de98935ac4e5990f723cc2ea05855b01eccde731575285e77

NODE_ENV=production

CORS_ORIGIN=https://your-project.vercel.app

EMAIL_USER=saikotgire9@gmail.com

EMAIL_APP_PASSWORD=yqqzakhkcbkzmryk

EMAIL_FROM=CloudOps Simulator <saikotgire9@gmail.com>

RAZORPAY_KEY_ID=rzp_live_SfgNQPt4hhp1AF

RAZORPAY_KEY_SECRET=OIf0I3ccYukKpwaTO2d7Qye2

PRO_PLAN_AMOUNT=9900

PRO_PLAN_CURRENCY=INR

PRO_PLAN_DURATION_DAYS=30
```

---

## 🚀 3-Step Deployment

### **Step 1: Add Environment Variables**
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. **Settings → Environment Variables**
4. Add each variable from above
5. ⚠️ **IMPORTANT:** Update `CORS_ORIGIN` to your actual Vercel URL after first deploy

### **Step 2: Push Code to GitHub**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### **Step 3: Deploy**
Vercel automatically deploys on push!

Or manually:
```bash
vercel --prod
```

---

## ⚠️ Critical: Update CORS After First Deploy

Your Vercel URL will be `https://your-project-name.vercel.app`

After first deploy:
1. Copy your Vercel URL
2. Go to Vercel Settings → Environment Variables
3. Update `CORS_ORIGIN` to that URL
4. Redeploy: `vercel --prod`

---

## 🧪 Test After Deployment

**Test backend:**
```bash
curl https://your-domain.vercel.app/health
```

**Test payment pricing:**
```bash
curl https://your-domain.vercel.app/api/payment/pricing
```

---

## 📚 Full Details

See [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) for detailed instructions.

---

## ✨ That's It!

Your app will be live on Vercel with:
- ✅ Razorpay payments (Live)
- ✅ Database persistence
- ✅ Email verification
- ✅ ₹99/month Pro plan
- ✅ Strong password requirements

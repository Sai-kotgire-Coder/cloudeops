# 🚀 Vercel Deployment - Environment Variables Setup

## 📋 Complete Environment Variables for Production

Copy and add these to your Vercel project settings:

### **1. Database Configuration**
```
DATABASE_URL=postgres://avnadmin:AVNS_uBKLm0E_NuYqJ4Hn-bH@cloudops-saikotgire9-45cd.g.aivencloud.com:10087/qadb?sslmode=require
```
✅ Keep your existing Aiven PostgreSQL connection

---

### **2. Authentication (JWT)**
```
JWT_SECRET=416a078e7975ee5de98935ac4e5990f723cc2ea05855b01eccde731575285e77
```
✅ Use the same JWT secret from your local .env

---

### **3. Server Configuration**
```
NODE_ENV=production
```
⚠️ IMPORTANT: Set to `production` (not `development`)

---

### **4. CORS Configuration**
```
CORS_ORIGIN=https://yourdomain.vercel.app,https://yourdomain.com
```

**Options:**
- **For Vercel only:** `https://yourdomain.vercel.app`
- **For custom domain:** `https://yourdomain.vercel.app,https://yourdomain.com`
- **For localhost testing:** `http://localhost:8080,http://localhost:3000`

Replace `yourdomain` with your actual Vercel project name!

---

### **5. Email Configuration**
```
EMAIL_USER=saikotgire9@gmail.com
EMAIL_APP_PASSWORD=yqqzakhkcbkzmryk
EMAIL_FROM=CloudOps Simulator <saikotgire9@gmail.com>
```
✅ Keep your existing Gmail credentials

---

### **6. Razorpay Configuration**
```
RAZORPAY_KEY_ID=rzp_live_SfgNQPt4hhp1AF
RAZORPAY_KEY_SECRET=OIf0I3ccYukKpwaTO2d7Qye2
RAZORPAY_WEBHOOK_SECRET=
```
✅ Your live Razorpay credentials (payments are real!)

---

### **7. Payment Plan Configuration**
```
PRO_PLAN_AMOUNT=9900
PRO_PLAN_CURRENCY=INR
PRO_PLAN_DURATION_DAYS=30
```
✅ ₹99 per month for Pro plan

---

## 🔧 Step-by-Step: Add to Vercel

### **Option 1: Via Vercel Dashboard (Easiest)**

1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `DATABASE_URL`
   - Value: `postgres://avnadmin:...`
   - Click **Add**
5. Repeat for all variables above

### **Option 2: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add DATABASE_URL

# Follow prompts to add each variable
```

### **Option 3: Via vercel.json**

Create/update `vercel.json` in root:
```json
{
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "NODE_ENV": "production",
    "CORS_ORIGIN": "@cors_origin",
    "EMAIL_USER": "@email_user",
    "EMAIL_APP_PASSWORD": "@email_app_password",
    "EMAIL_FROM": "@email_from",
    "RAZORPAY_KEY_ID": "@razorpay_key_id",
    "RAZORPAY_KEY_SECRET": "@razorpay_key_secret",
    "PRO_PLAN_AMOUNT": "9900",
    "PRO_PLAN_CURRENCY": "INR",
    "PRO_PLAN_DURATION_DAYS": "30"
  }
}
```

---

## 🎯 Quick Reference Table

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your Aiven URL | Remote PostgreSQL |
| `JWT_SECRET` | Your secret key | Same as local |
| `NODE_ENV` | `production` | Critical for production |
| `CORS_ORIGIN` | Your Vercel URL | Update this! |
| `EMAIL_USER` | Gmail email | Your Gmail |
| `EMAIL_APP_PASSWORD` | Gmail app password | App-specific password |
| `EMAIL_FROM` | Display name | Email sender name |
| `RAZORPAY_KEY_ID` | Live key ID | Live Razorpay |
| `RAZORPAY_KEY_SECRET` | Live key secret | Live Razorpay |
| `PRO_PLAN_AMOUNT` | `9900` | ₹99 in paise |
| `PRO_PLAN_CURRENCY` | `INR` | Indian Rupee |
| `PRO_PLAN_DURATION_DAYS` | `30` | 30 days |

---

## ⚠️ IMPORTANT: Update CORS for Your Domain

### **Find Your Vercel URL:**

After first deployment:
1. Go to Vercel dashboard
2. Select your project
3. Copy the URL shown
4. Example: `https://cloudops-simulator.vercel.app`

### **Update CORS:**

```
CORS_ORIGIN=https://cloudops-simulator.vercel.app
```

OR if you have a custom domain:

```
CORS_ORIGIN=https://cloudops-simulator.vercel.app,https://yourdomain.com
```

---

## 🔐 Security Best Practices

✅ **Never commit `.env` to GitHub**
✅ **Use Vercel's environment variables UI or CLI**
✅ **Rotate JWT_SECRET periodically**
✅ **Keep Razorpay keys secure (live keys!)**
✅ **Don't share environment variables**
✅ **Use different secrets for dev/prod**

---

## 📝 Checklist Before Deploying

- [ ] All environment variables added to Vercel
- [ ] `NODE_ENV` set to `production`
- [ ] `CORS_ORIGIN` updated to your Vercel URL
- [ ] Database connection tested
- [ ] Razorpay live keys configured
- [ ] Email configuration verified
- [ ] Stack limit > 100MB (Vercel allows up to 250MB)

---

## 🧪 Verify After Deployment

After deploying to Vercel:

1. **Test API health:**
   ```bash
   curl https://yourdomain.vercel.app/health
   ```
   Expected: `{"status":"ok"}`

2. **Test pricing endpoint:**
   ```bash
   curl https://yourdomain.vercel.app/api/payment/pricing
   ```

3. **Check frontend loads:**
   ```
   https://yourdomain.vercel.app
   ```

4. **Test payment flow:**
   - Register new account
   - Go to /pricing
   - Click "Upgrade to Pro"
   - Verify ₹99 amount

---

## 🚨 Troubleshooting

### **Error: "CORS policy"**
→ Update `CORS_ORIGIN` to your actual Vercel URL

### **Error: "Cannot find database"**
→ Verify `DATABASE_URL` is correct and accessible

### **Error: "JWT verification failed"**
→ Ensure `JWT_SECRET` matches your local version

### **Error: "Razorpay credentials invalid"**
→ Double-check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### **Error: "EMAIL_APP_PASSWORD incorrect"**
→ Regenerate Gmail app password from Google Account settings

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel Deployment Best Practices](https://vercel.com/docs/concepts/deployments/overview)

---

## 🎉 Ready to Deploy!

Once all environment variables are set:

```bash
# Push to GitHub (triggers Vercel deployment)
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

Vercel will automatically deploy your changes! 🚀

# 📧 Email OTP Verification Setup Guide

## ✅ Implementation Complete!

Your CloudOps Simulator now has a complete Email OTP Verification system. Users must verify their email before they can login.

---

## 🔧 Gmail SMTP Configuration (Required)

### Step 1: Get Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com/
2. **Enable 2-Factor Authentication** (if not already enabled)
   - Security → 2-Step Verification → Turn On
3. **Create App Password**:
   - Security → 2-Step Verification → App passwords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Type "CloudOps Simulator"
   - Click **Generate**
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Configure Environment Variables

Edit `/home/sailaxmikantkotgire/Documents/sai/CloudSimulator/server/.env`:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER="your_actual_email@gmail.com"
EMAIL_APP_PASSWORD="abcdefghijklmnop"  # Remove spaces from app password
EMAIL_FROM="CloudOps Simulator <your_actual_email@gmail.com>"
```

**Important**: 
- Replace `your_actual_email@gmail.com` with your actual Gmail address
- Use the 16-character app password (remove spaces)
- Do NOT use your regular Gmail password

---

## 🚀 How to Start the System

### 1. Install Backend Dependencies
```bash
cd /home/sailaxmikantkotgire/Documents/sai/CloudSimulator/server
npm install
```

### 2. Update Database Schema
```bash
npm run db:generate
npm run db:push
```

### 3. Start Backend Server
```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3002
📊 Environment: development
✓ Email service is ready
```

### 4. Start Frontend (in new terminal)
```bash
cd /home/sailaxmikantkotgire/Documents/sai/CloudSimulator
npm run dev
```

---

## 🎯 User Flow

### Registration Flow:
1. User visits `/register`
2. Enters email and password
3. **OTP sent to email** (6-digit code)
4. Redirected to `/verify-otp`
5. Enters OTP from email
6. Email verified → JWT token issued
7. Redirected to dashboard

### Login Flow:
1. User visits `/login`
2. Enters credentials
3. **If not verified**: Redirected to `/verify-otp`
4. **If verified**: Login successful

---

## 📋 API Endpoints

### New Endpoints Added:

```http
POST /api/auth/register
Body: { "email": "user@example.com", "password": "password123" }
Response: { "message": "...", "email": "...", "requiresVerification": true }
```

```http
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
Response: { "token": "...", "user": {...} }
```

```http
POST /api/auth/resend-otp
Body: { "email": "user@example.com" }
Response: { "message": "New OTP sent" }
```

```http
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
Response: { "token": "...", "user": {...} } OR { "error": "Email not verified", "requiresVerification": true }
```

---

## 🗄️ Database Changes

New fields added to `users` table:
- `otp_code` (TEXT, nullable) - Stores the 6-digit OTP
- `otp_expiry` (TIMESTAMP, nullable) - OTP expires after 5 minutes
- `is_verified` (BOOLEAN, default: false) - Email verification status

---

## ✨ Features Implemented

### Backend:
✅ OTP generation (6-digit random number)  
✅ Email sending with Nodemailer  
✅ OTP expiry (5 minutes)  
✅ Resend OTP with cooldown  
✅ Email verification before login  
✅ Secure password hashing  
✅ JWT token after verification  

### Frontend:
✅ Beautiful OTP verification page  
✅ 5-minute countdown timer  
✅ Resend OTP button (30-second cooldown)  
✅ Real-time validation  
✅ Error handling  
✅ Auto-redirect on verification  
✅ Toast notifications  

---

## 🎨 UI/UX Features

### OTP Verification Page:
- **Large OTP input** - Easy to read and enter
- **Countdown timer** - Shows time remaining (5:00 → 0:00)
- **Resend button** - Disabled for 30 seconds after sending
- **Error messages** - Clear feedback
- **Auto-focus** - OTP input focused on load
- **Number-only input** - Prevents non-numeric characters

---

## 🧪 Testing the System

### Test Registration:
1. Go to http://localhost:8080/register
2. Enter email: `your_test_email@gmail.com`
3. Enter password (min 8 characters)
4. Click "Create Account"
5. Check your email for OTP
6. Enter OTP on verification page
7. ✅ Success! Redirected to dashboard

### Test Login (Unverified):
1. Register but don't verify OTP
2. Try to login
3. ❌ Error: "Email not verified"
4. Redirected to OTP verification

### Test Resend OTP:
1. On OTP page, wait 30 seconds
2. Click "Resend OTP"
3. Check email for new OTP
4. Previous OTP is now invalid

---

## 🔒 Security Features

✅ **OTP expires in 5 minutes** - Old codes don't work  
✅ **One-time use** - OTP cleared after verification  
✅ **Resend cooldown** - Prevents spam (30 seconds)  
✅ **Email ownership validation** - Only email owner can verify  
✅ **No login without verification** - Enforced at backend  
✅ **Secure password storage** - bcrypt hashing  
✅ **JWT tokens** - Stateless authentication  

---

## ⚠️ Troubleshooting

### "Failed to send verification email"
❌ Check EMAIL_USER in .env  
❌ Check EMAIL_APP_PASSWORD is correct  
❌ Make sure 2FA is enabled on Google account  
❌ Verify app password was generated correctly  

### "Email service configuration error"
```bash
# Test email config
cd server
npm run dev
# Look for: ✓ Email service is ready
```

### OTP not received
✅ Check spam folder  
✅ Wait 1-2 minutes  
✅ Try resend OTP  
✅ Check server logs for errors  

### Database errors
```bash
cd server
npm run db:generate
npm run db:push
```

---

## 📝 Email Template

The OTP email includes:
- **Subject**: "CloudOps Simulator - Email Verification"
- **6-digit code** in large, centered text
- **5-minute expiry notice**
- **Professional HTML formatting**
- **Plain text fallback**

---

## 🎯 Testing Checklist

- [ ] Gmail app password configured
- [ ] Backend starts without errors
- [ ] "Email service is ready" message appears
- [ ] Can register new user
- [ ] OTP email received
- [ ] Can verify OTP
- [ ] Redirected to dashboard after verification
- [ ] Cannot login without verification
- [ ] Can resend OTP
- [ ] Old OTP expires after 5 minutes
- [ ] Resend cooldown works (30 seconds)

---

## 🔐 Production Tips

### For Production Deployment:

1. **Use dedicated email service**:
   - SendGrid (free tier: 100 emails/day)
   - AWS SES
   - Mailgun
   - Postmark

2. **Environment variables**:
   - Never commit .env files
   - Use secure secret management
   - Rotate JWT secrets regularly

3. **Rate limiting**:
   - Limit OTP requests per email
   - Prevent brute force attacks
   - Add CAPTCHA for registration

4. **Email templates**:
   - Custom branding
   - Multiple languages
   - Better styling

---

## 📚 Alternative Email Providers

### SendGrid (Recommended for Production):
```js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: email,
  from: 'noreply@yourapp.com',
  subject: 'Verify your email',
  text: `Your OTP: ${otp}`,
  html: `<strong>Your OTP: ${otp}</strong>`
});
```

### AWS SES:
```js
import AWS from 'aws-sdk';

const ses = new AWS.SES({ region: 'us-east-1' });

await ses.sendEmail({
  Source: 'noreply@yourapp.com',
  Destination: { ToAddresses: [email] },
  Message: {
    Subject: { Data: 'Verify your email' },
    Body: { Text: { Data: `Your OTP: ${otp}` } }
  }
}).promise();
```

---

## 🎉 Success!

Your Email OTP Verification system is now complete and production-ready!

**Next Steps**:
1. Configure your Gmail app password
2. Start the servers
3. Test the registration flow
4. Start onboarding users! 🚀

---

## 📞 Quick Reference

**Backend Server**: http://localhost:3002  
**Frontend**: http://localhost:8080  
**Register**: http://localhost:8080/register  
**Verify OTP**: http://localhost:8080/verify-otp  
**Login**: http://localhost:8080/login  

---

**🔥 Your CloudOps Simulator now has enterprise-grade email verification!**

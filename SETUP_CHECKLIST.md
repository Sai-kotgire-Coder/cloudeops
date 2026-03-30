# ✅ Setup Checklist - Get Your System Running

Follow these steps in order to get your full-stack authentication system running.

---

## 📋 Pre-Setup Checklist

- [ ] PostgreSQL installed on your system
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager available
- [ ] Code editor ready (VS Code recommended)
- [ ] Terminal/command line access

---

## 🔧 Setup Steps

### Step 1: Install PostgreSQL (if not installed)

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib -y
sudo service postgresql start
```

#### macOS:
```bash
brew install postgresql
brew services start postgresql
```

#### Windows:
Download from: https://www.postgresql.org/download/windows/

- [ ] PostgreSQL installed
- [ ] PostgreSQL service running

---

### Step 2: Create Database

```bash
# Access PostgreSQL (password may be required)
psql -U postgres

# Create the database
CREATE DATABASE cloudops_simulator;

# Verify it was created
\l

# Exit
\q
```

- [ ] Database `cloudops_simulator` created
- [ ] Can connect to database

---

### Step 3: Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install
```

**Expected output**: All packages installed successfully

- [ ] Server dependencies installed

---

### Step 4: Configure Backend Environment

```bash
# Still in server directory
cp .env.example .env

# Edit the .env file
nano .env  # or use your preferred editor
```

**Update these values in `.env`:**

```env
# Change 'password' to your PostgreSQL password
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/cloudops_simulator?schema=public"

# Change to a strong random string (32+ characters)
JWT_SECRET="replace-with-strong-random-string-min-32-chars"

# Keep these as-is for development
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**Generate strong JWT_SECRET (optional):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] `.env` file created
- [ ] DATABASE_URL configured with correct password
- [ ] JWT_SECRET set to strong value
- [ ] Other variables configured

---

### Step 5: Initialize Database Schema

```bash
# Still in server directory

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

**Expected output:**
- Prisma client generated
- Schema pushed successfully
- Tables created in database

**Verify tables created:**
```bash
# Optional: Open Prisma Studio to view database
npm run db:studio
```

- [ ] Prisma client generated
- [ ] Database schema pushed
- [ ] Can see tables in database

---

### Step 6: Start Backend Server

```bash
# Still in server directory
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:3001
📊 Environment: development
```

**Test the server:**
```bash
# In a new terminal window
curl http://localhost:3001/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"..."}
```

- [ ] Backend server running
- [ ] Health check returns OK
- [ ] No errors in console

---

### Step 7: Frontend Setup

```bash
# Open a NEW terminal window
# Navigate to project root (not server directory)
cd /path/to/CloudSimulator

# Install dependencies (if not already done)
npm install
```

- [ ] Frontend dependencies installed

---

### Step 8: Configure Frontend Environment

```bash
# In project root
cp .env.example .env

# Edit if needed (default should work)
nano .env
```

**Default `.env` content:**
```env
VITE_API_URL=http://localhost:3001/api
```

- [ ] Frontend `.env` file created
- [ ] VITE_API_URL configured

---

### Step 9: Start Frontend

```bash
# In project root
npm run dev
```

**Expected output:**
```
VITE v8.0.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

- [ ] Frontend running on http://localhost:5173
- [ ] No errors in console

---

## 🧪 Testing the System

### Test 1: Access Login Page

1. Open browser: http://localhost:5173
2. Should redirect to `/login` automatically
3. See login form

- [ ] Redirects to login
- [ ] Login page displays correctly
- [ ] No console errors

---

### Test 2: Register New User

1. Click "Create account" link
2. Enter email: `test@example.com`
3. Enter password: `testpass123` (min 8 chars)
4. Confirm password: `testpass123`
5. Click "Create Account"

**Expected:**
- Account created successfully
- Automatically logged in
- Redirected to dashboard

- [ ] Registration form works
- [ ] User created successfully
- [ ] Redirected to dashboard

---

### Test 3: Verify Login Persistence

1. Refresh the page (F5 or Cmd+R)
2. Check that you're still logged in
3. See your email in the sidebar

- [ ] Still logged in after refresh
- [ ] Session persisted

---

### Test 4: Test Data Creation

1. Navigate to Applications page
2. Create a new application
3. Refresh the page
4. Application still there

- [ ] Can create application
- [ ] Data persists after refresh

---

### Test 5: Logout and Login

1. Click your email in sidebar
2. Click "Logout"
3. Should return to login page
4. Login with same credentials
5. Your data should still be there

- [ ] Logout works
- [ ] Can login again
- [ ] Data persisted

---

### Test 6: Multi-User Support

1. Logout
2. Register a second user (different email)
3. Create different data
4. Logout
5. Login as first user
6. Check that only first user's data shows

- [ ] Can create multiple users
- [ ] Each user has isolated data
- [ ] No data leakage between users

---

## ✅ Final Verification

### Backend Checklist
- [ ] PostgreSQL running
- [ ] Database created
- [ ] Server running on port 3001
- [ ] Health endpoint responds
- [ ] No errors in server logs

### Frontend Checklist
- [ ] Vite dev server running
- [ ] App loads without errors
- [ ] Can access login page
- [ ] No console errors

### Authentication Checklist
- [ ] Can register new users
- [ ] Can login with credentials
- [ ] Token stored in localStorage
- [ ] Session persists on refresh
- [ ] Can logout successfully
- [ ] Protected routes work

### Data Persistence Checklist
- [ ] Can create applications
- [ ] Can create instances
- [ ] Can create containers
- [ ] Data saves to PostgreSQL
- [ ] Data persists after refresh
- [ ] Users see only their own data

---

## 🎉 You're Done!

If all checkboxes are marked, your system is fully operational!

### What You Have Now:

✅ Production-ready authentication  
✅ PostgreSQL data persistence  
✅ Multi-user support  
✅ Secure JWT authentication  
✅ Beautiful UI  
✅ Session management  

---

## 🆘 Troubleshooting

### Backend won't start

**Check PostgreSQL:**
```bash
sudo service postgresql status
sudo service postgresql start
```

**Check database exists:**
```bash
psql -U postgres -l | grep cloudops_simulator
```

**Regenerate Prisma client:**
```bash
cd server
npm run db:generate
```

---

### Frontend can't connect

**Verify backend is running:**
```bash
curl http://localhost:3001/health
```

**Check .env file:**
```bash
cat .env
# Should show: VITE_API_URL=http://localhost:3001/api
```

**Check browser console:**
- Open DevTools (F12)
- Look for CORS or network errors

---

### Login not working

**Check server logs:**
- Look for errors in the terminal running `npm run dev`

**Check JWT_SECRET:**
```bash
cat server/.env | grep JWT_SECRET
# Should be set to a non-empty string
```

**Clear localStorage:**
```javascript
// In browser console:
localStorage.clear()
// Refresh page
```

---

## 📚 Additional Resources

- [Full Setup Guide](AUTHENTICATION_SETUP_GUIDE.md) - Detailed documentation
- [Quick Start](QUICK_START_AUTH.md) - 5-minute setup guide
- [Implementation Summary](IMPLEMENTATION_COMPLETE.md) - What was built
- [Backend README](server/README.md) - Server documentation

---

## 🚀 Next Steps

Now that your system is running:

1. **Explore the features**
   - Create applications
   - Spin up instances
   - Build containers
   - Run CI/CD pipelines

2. **Customize**
   - Add profile page
   - Implement password reset
   - Add more user fields

3. **Deploy** (when ready)
   - Set up production database
   - Configure environment variables
   - Deploy to cloud provider

---

**Happy coding! 🎊**

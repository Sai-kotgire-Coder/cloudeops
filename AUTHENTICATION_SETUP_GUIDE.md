# 🔐 User Authentication & Data Persistence Implementation Guide

## ✅ Implementation Complete

This document describes the full-stack user authentication system with PostgreSQL data persistence.

---

## 🏗️ Architecture Overview

### Backend
- **Framework**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs (10 rounds)

### Frontend
- **Framework**: React + TypeScript
- **State Management**: Zustand (with persistence)
- **API Communication**: Custom API client with axios-like patterns
- **Routing**: React Router v6
- **Protected Routes**: HOC-based route protection

---

## 📦 What Was Implemented

### ✅ Backend Features

1. **Database Schema** (`server/prisma/schema.prisma`)
   - Users table (id, email, password_hash, timestamps)
   - Applications table (user-scoped)
   - Instances table (user-scoped)
   - Containers table (user-scoped)
   - Pipelines table (user-scoped)
   - DockerImages table (user-scoped)
   - UserProgress table (learning progress tracking)
   - All tables have cascading deletes for data cleanup

2. **Authentication APIs** (`server/src/routes/auth.ts`)
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/login` - User login
   - `GET /api/auth/me` - Get current user info

3. **Protected API Routes** (All require JWT token)
   - `/api/applications` - Full CRUD for applications
   - `/api/instances` - Full CRUD for instances
   - `/api/containers` - Full CRUD for containers
   - `/api/pipelines` - Full CRUD for CI/CD pipelines
   - `/api/images` - Manage Docker images
   - `/api/progress` - Track learning progress

4. **Security Middleware** (`server/src/middleware/auth.ts`)
   - JWT token validation
   - Request user ID injection
   - Error handling for invalid/expired tokens

### ✅ Frontend Features

1. **Authentication Store** (`src/store/authStore.ts`)
   - Login/Register actions
   - Session restoration on app load
   - Token persistence in localStorage
   - Error handling

2. **API Client** (`src/lib/apiClient.ts`)
   - Centralized API communication
   - Automatic token attachment
   - Type-safe API methods
   - Error handling

3. **Auth Pages**
   - Login page (`src/pages/LoginPage.tsx`)
   - Register page (`src/pages/RegisterPage.tsx`)
   - Beautiful UI with validation
   - Loading states and error messages

4. **Route Protection** (`src/components/auth/ProtectedRoute.tsx`)
   - HOC for protecting routes
   - Automatic redirect to login
   - Loading state during session check

5. **User Interface Updates**
   - Logout button in sidebar
   - User email display
   - Session persistence across page refreshes

---

## 🚀 Setup & Installation

### Prerequisites

1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS (with Homebrew)
brew install postgresql

# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql # macOS
```

2. Create Database
```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cloudops_simulator;

# Exit
\q
```

### Backend Setup

1. Navigate to server directory and install dependencies:
```bash
cd server
npm install
```

2. Configure environment variables:
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Required environment variables:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/cloudops_simulator?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

⚠️ **IMPORTANT**: Change `JWT_SECRET` to a strong random string in production!

3. Generate Prisma client and push schema:
```bash
npm run db:generate
npm run db:push
```

4. Start the backend server:
```bash
npm run dev
```

Server will run on **http://localhost:3001**

### Frontend Setup

1. Return to root directory and create `.env`:
```bash
cd ..
cp .env.example .env
```

Configure:
```env
VITE_API_URL=http://localhost:3001/api
```

2. Install frontend dependencies (if not already done):
```bash
npm install
```

3. Start the frontend:
```bash
npm run dev
```

Frontend will run on **http://localhost:5173**

---

## 🧪 Testing the System

### 1. Register a New User
1. Navigate to http://localhost:5173
2. You'll be redirected to `/login`
3. Click "Create account"
4. Enter email and password (min 8 characters)
5. Click "Create Account"

### 2. Login
1. Go to http://localhost:5173/login
2. Enter your credentials
3. Click "Sign In"
4. You'll be redirected to the dashboard

### 3. Test Data Persistence
1. Create some applications, instances, or containers
2. Refresh the page
3. Data persists! ✅
4. Try logging out and back in
5. Your data is still there! ✅

### 4. Test User Isolation
1. Register a second user
2. Create different data
3. Log back into first user
4. Each user only sees their own data! ✅

---

## 🔒 Security Features

### ✅ Implemented

1. **Password Security**
   - Passwords hashed with bcrypt (10 rounds)
   - Plain passwords never stored
   - Hashing happens before DB storage

2. **JWT Tokens**
   - Stateless authentication
   - 7-day expiration
   - Signed with secret key
   - Verified on every protected request

3. **User Data Isolation**
   - All queries scoped by `userId`
   - Users can only access their own data
   - Cascading deletes prevent orphaned data

4. **Input Validation**
   - Zod schemas for request validation
   - Email format validation
   - Password length requirements
   - Type-safe API boundaries

5. **CORS Protection**
   - Configured origins
   - Credentials support
   - Pre-flight handling

### ⚠️ Production Recommendations

1. **Environment Variables**
   - Use strong, random JWT_SECRET (32+ characters)
   - Don't commit .env files
   - Use environment-specific configs

2. **Database**
   - Use connection pooling
   - Enable SSL for connections
   - Regular backups
   - Implement rate limiting

3. **Authentication Enhancements** (Optional)
   - Add refresh tokens
   - Implement password reset
   - Add email verification
   - Enable 2FA

4. **API Security** (Optional)
   - Rate limiting (e.g., express-rate-limit)
   - Request size limits
   - Helmet.js for security headers
   - API request logging

---

## 📊 Database Schema Reference

### Users
```sql
- id: UUID (Primary Key)
- email: String (Unique)
- password_hash: String
- created_at: DateTime
- updated_at: DateTime
```

### Applications
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- name: String
- type: String (Optional)
- status: String (Default: "running")
- created_at: DateTime
- updated_at: DateTime
```

### Instances
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- name: String
- type: String
- status: String
- cpu: Integer (Default: 2)
- memory: Integer (Default: 4)
- region: String (Default: "us-east-1")
- created_at: DateTime
- updated_at: DateTime
```

### Containers
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- name: String
- image: String
- status: String
- port: String (Optional)
- cpu_usage: Float
- memory_usage: Float
- created_at: DateTime
- updated_at: DateTime
```

### Pipelines
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- name: String
- status: String
- branch: String (Default: "main")
- steps: JSON
- logs: Text
- created_at: DateTime
- updated_at: DateTime
```

### UserProgress
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- module: String (docker, k8s, cicd, etc.)
- progress_json: JSON
- completed: Boolean
- created_at: DateTime
- updated_at: DateTime
- Unique: (user_id, module)
```

---

## 🔧 API Reference

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: {
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "timestamp"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: Same as register
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}

Response: {
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "timestamp"
  }
}
```

### Protected Endpoints

All protected endpoints require:
```http
Authorization: Bearer {your-jwt-token}
```

#### Applications
- `GET /api/applications` - List all user applications
- `POST /api/applications` - Create application
- `GET /api/applications/:id` - Get single application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

#### Instances
- `GET /api/instances` - List all user instances
- `POST /api/instances` - Create instance
- `PUT /api/instances/:id` - Update instance
- `DELETE /api/instances/:id` - Delete instance

#### Containers
- `GET /api/containers` - List all user containers
- `POST /api/containers` - Create container
- `PUT /api/containers/:id` - Update container
- `DELETE /api/containers/:id` - Delete container

---

## 📝 Development Scripts

### Backend
```bash
cd server

npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database (development)
npm run db:migrate   # Create and run migrations (production)
npm run db:studio    # Open Prisma Studio (DB GUI)
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 🎯 User Experience Flow

### New User Journey
1. User visits site → Redirected to `/login`
2. Clicks "Create account" → Goes to `/register`
3. Fills form and submits → Account created
4. Automatically logged in → Redirected to dashboard
5. Token stored in localStorage
6. Creates apps/instances/containers
7. Closes browser
8. Returns later → Still logged in (token valid)
9. Data persists across sessions ✅

### Existing User Journey
1. User visits site
2. Token validated automatically
3. Session restored
4. Dashboard loads with their data
5. Full access to all features

### Logout Flow
1. User clicks logout button (in sidebar)
2. Token removed from localStorage
3. Auth state cleared
4. Redirected to `/login`
5. Protected routes inaccessible

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Check database exists
psql -U postgres -l | grep cloudops_simulator

# Regenerate Prisma client
cd server
npm run db:generate
```

### Frontend can't connect to backend
```bash
# Check .env file has correct API URL
cat .env

# Verify backend is running
curl http://localhost:3001/health

# Check browser console for CORS errors
```

### Login/Register not working
```bash
# Check JWT_SECRET is set in server/.env
cat server/.env | grep JWT_SECRET

# Verify database connection
cd server
npm run db:studio

# Check server logs for errors
```

### "Invalid token" errors
- Token may have expired (7-day limit)
- JWT_SECRET may have changed
- Solution: Logout and login again

---

## 🚀 Next Steps & Enhancements

### Recommended Additions

1. **Password Reset**
   - Forgot password link
   - Email-based reset flow
   - Token expiration

2. **Email Verification**
   - Send verification email on register
   - Verify email before full access
   - Resend verification option

3. **OAuth Integration**
   - Google login
   - GitHub login
   - Microsoft login

4. **Multi-Tenancy**
   - Organizations/Teams
   - Role-based access control (RBAC)
   - Team collaboration

5. **Advanced Security**
   - Refresh tokens
   - Token rotation
   - Session management
   - IP-based restrictions

6. **Monitoring**
   - Error tracking (Sentry)
   - Analytics
   - Performance monitoring
   - API usage metrics

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `cd server && npm run dev`
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

## ✅ Success Criteria Met

✅ Users can register with email/password  
✅ Users can login securely  
✅ JWT tokens implemented with 7-day expiration  
✅ All passwords hashed with bcrypt  
✅ User data isolated per user  
✅ Data persists in PostgreSQL  
✅ Session restores on page refresh  
✅ Protected routes redirect to login  
✅ Logout functionality works  
✅ Multi-user support enabled  
✅ Production-ready architecture  
✅ Platform feels like real SaaS  

---

**🎉 Your CloudOps Simulator now has a complete, production-ready authentication and data persistence system!**

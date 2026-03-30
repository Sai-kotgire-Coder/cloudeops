# 🚀 Quick Start - Authentication System

## ⚡ Fast Setup (5 minutes)

### 1️⃣ Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get install postgresql -y
sudo service postgresql start

# macOS
brew install postgresql
brew services start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE cloudops_simulator;"
```

### 2️⃣ Setup Backend

```bash
cd server
npm install
cp .env.example .env

# Edit .env - Set your PostgreSQL password and a secure JWT secret
nano .env

# Initialize database
npm run db:generate
npm run db:push

# Start server
npm run dev
```

### 3️⃣ Setup Frontend

```bash
cd ..
cp .env.example .env

# Start frontend
npm run dev
```

### 4️⃣ Test It!

1. Open http://localhost:5173
2. Click "Create account"
3. Register with any email/password
4. Start creating apps, instances, containers!
5. Refresh page - data persists! ✅

---

## 🔑 Default Configuration

### Backend (server/.env)
environment
DATABASE_URL="postgresql://postgres:password@localhost:5432/cloudops_simulator"
JWT_SECRET="change-this-to-random-string-in-production"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## ✅ What You Get

- ✅ User registration & login
- ✅ Secure JWT authentication
- ✅ PostgreSQL data persistence
- ✅ User data isolation
- ✅ Session persistence
- ✅ Protected routes
- ✅ Logout functionality
- ✅ Beautiful UI

---

## 🎯 Key Files Created

**Backend:**
- `server/` - Express + Prisma server
- `server/prisma/schema.prisma` - Database schema
- `server/src/routes/auth.ts` - Auth endpoints
- `server/src/middleware/auth.ts` - JWT validation

**Frontend:**
- `src/store/authStore.ts` - Auth state management
- `src/lib/apiClient.ts` - API communication
- `src/pages/LoginPage.tsx` - Login UI
- `src/pages/RegisterPage.tsx` - Register UI
- `src/components/auth/ProtectedRoute.tsx` - Route protection

---

## 📚 Full Documentation

See [AUTHENTICATION_SETUP_GUIDE.md](AUTHENTICATION_SETUP_GUIDE.md) for complete details.

---

## 🆘 Quick Troubleshooting

**Can't connect to database?**
```bash
sudo service postgresql start
psql -U postgres -c "CREATE DATABASE cloudops_simulator;"
```

**Backend won't start?**
```bash
cd server
npm run db:generate
rm -rf node_modules && npm install
```

**Frontend can't reach backend?**
- Check `server/.env` has correct DATABASE_URL
- Verify backend is running: `curl http://localhost:3001/health`
- Check `.env` has `VITE_API_URL=http://localhost:3001/api`

---

**Ready to code? Start the servers and visit http://localhost:5173!** 🎉

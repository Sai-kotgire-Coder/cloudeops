# CloudOps Simulator - Backend Server

Production-ready backend with PostgreSQL database and JWT authentication.

## 🚀 Quick Start

### 1. Install Dependencies
this si just to push the code from coder account 
```bash
cd server
npm install
```

### 2. Setup PostgreSQL Database

```bash
# Install PostgreSQL (if not already installed)
# Ubuntu/Debian:
sudo apt-get install postgresql

# macOS with Homebrew:
brew install postgresql

# Start PostgreSQL service
sudo service postgresql start  # Linux
brew services start postgresql  # macOS

# Create database
psql -U postgres
CREATE DATABASE cloudops_simulator;
\q
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/cloudops_simulator"
```

### 4. Generate Prisma Client & Setup Database

```bash
npm run db:generate
npm run db:push
```

### 5. Start Server

```bash
npm run dev
```

Server will run on http://localhost:3001

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Applications (Protected)

- `GET /api/applications` - Get all user applications
- `POST /api/applications` - Create application
- `GET /api/applications/:id` - Get specific application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

### Instances (Protected)

- `GET /api/instances` - Get all user instances
- `POST /api/instances` - Create instance
- `PUT /api/instances/:id` - Update instance
- `DELETE /api/instances/:id` - Delete instance

### Containers (Protected)

- `GET /api/containers` - Get all user containers
- `POST /api/containers` - Create container
- `PUT /api/containers/:id` - Update container
- `DELETE /api/containers/:id` - Delete container

### Pipelines (Protected)

- `GET /api/pipelines` - Get all user pipelines
- `POST /api/pipelines` - Create pipeline
- `PUT /api/pipelines/:id` - Update pipeline
- `DELETE /api/pipelines/:id` - Delete pipeline

### Docker Images (Protected)

- `GET /api/images` - Get all user images
- `POST /api/images` - Build/save image
- `DELETE /api/images/:id` - Delete image

### Progress (Protected)

- `GET /api/progress` - Get all progress
- `GET /api/progress/:module` - Get specific module progress
- `PUT /api/progress/:module` - Update module progress

## 🔒 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## 🛠️ Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## 📊 Database Schema

See [prisma/schema.prisma](prisma/schema.prisma) for the complete database schema.

## 🔐 Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- User data isolation (all queries scoped by userId)
- Input validation with Zod
- CORS configuration
- Cascading deletes for data cleanup

## 🚨 Environment Variables

Required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (use strong random string)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode
- `CORS_ORIGIN` - Allowed frontend origin

## 📝 Notes

- All user data is isolated by userId
- Deleting a user cascades to all related data
- JWT tokens are stateless (no server-side session storage)
- Progress data stored as JSON for flexibility

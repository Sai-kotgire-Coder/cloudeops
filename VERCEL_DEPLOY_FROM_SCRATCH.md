# CloudOps Simulator on Vercel

This project should be deployed as two Vercel projects:

1. Frontend project from the repository root.
2. Backend project from the `server` directory.

This is the most reliable setup for the current codebase because the frontend is a Vite static app and the backend is an Express API using Prisma.

## What you get

- A public frontend URL like `https://cloud-simulator.vercel.app`
- A public backend URL like `https://cloud-simulator-api.vercel.app`
- No custom domain required

## Important security step first

If any real secrets were committed locally, rotate them before connecting the repository to Vercel.

At minimum rotate:

- Database password / connection URL
- JWT secret
- Email app password

## Prerequisites

- Vercel account
- GitHub repository for this project
- PostgreSQL database URL
- Email SMTP credentials if you want OTP email verification to work

## Deployment order

Deploy the backend first, then the frontend.

## 1. Push the code to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Prepare Vercel deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

If the repository already exists, just commit and push your latest changes.

## 2. Deploy the backend on Vercel

In Vercel:

1. Click `Add New...`.
2. Click `Project`.
3. Import your GitHub repository.
4. Set the `Root Directory` to `server`.
5. Keep the detected project as a Node.js project.
6. Deploy.

### Backend environment variables

Add these in the backend Vercel project settings before the final production deploy:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `EMAIL_USER`
- `EMAIL_APP_PASSWORD`
- `EMAIL_FROM`
- `NODE_ENV=production`

If you have not deployed the frontend yet, set `CORS_ORIGIN` to a wildcard pattern that matches your future Vercel frontend project name.

For your repository/project name, this is a good first value:

```bash
https://cloudeops*.vercel.app
```

This will allow both:

- `https://cloudeops.vercel.app`
- Vercel preview URLs such as `https://cloudeops-git-main-...vercel.app`

After the frontend is deployed, you can keep that wildcard or tighten it to the exact production URL.

Exact example:

```bash
https://cloud-simulator.vercel.app
```

### Backend URL

After deployment, Vercel gives a URL such as:

```bash
https://cloud-simulator-api.vercel.app
```

Your API base URL will be:

```bash
https://cloud-simulator-api.vercel.app/api
```

## 3. Prepare the database

This repository currently has a Prisma schema but no committed Prisma migration files.

That means you have two options for the first database setup:

1. Fastest path: run `prisma db push` once against the empty PostgreSQL database.
2. Better long-term path: create and commit an initial Prisma migration, then use `prisma migrate deploy` in production.

If you send me the PostgreSQL URL, I can run the first setup step for you.

## 4. Deploy the frontend on Vercel

In Vercel:

1. Click `Add New...`.
2. Click `Project`.
3. Import the same GitHub repository again.
4. Keep the `Root Directory` as the repository root.
5. Framework preset should detect Vite.
6. Add the frontend environment variable below.
7. Deploy.

### Frontend environment variable

Add this variable in the frontend Vercel project settings:

```bash
VITE_API_URL=https://cloud-simulator-api.vercel.app/api
```

Replace the URL with your actual backend Vercel URL.

## 5. Verify the deployment

Check these URLs after deployment:

- Frontend: `https://your-frontend-project.vercel.app`
- Backend health endpoint: `https://your-backend-project.vercel.app/health`

If the backend health endpoint returns JSON with `status: ok`, the API is live.

## 6. Optional single-origin setup later

If you want the frontend to call `/api` on the same frontend domain, add a Vercel rewrite in the frontend project after the backend URL is known.

That is optional. The app can work correctly without it by using `VITE_API_URL`.

## 7. Database migration step with me

When you send the PostgreSQL connection string, I can do one of these for you:

1. Connect and initialize the schema with Prisma.
2. Tell you exactly which command I ran.
3. Confirm whether the database is ready for the Vercel backend.

## Recommended first deploy values

Backend project:

- Root Directory: `server`
- Install Command: leave default
- Build Command: leave default
- Output Directory: leave empty

Frontend project:

- Root Directory: repository root
- Build Command: `npm run build`
- Output Directory: `dist`

## Notes

- You do not need to buy a domain name. Vercel gives you a public `*.vercel.app` URL automatically.
- OTP email verification will fail until valid email credentials are configured.
- If you want, I can also prepare a same-domain `/api` rewrite after your backend URL exists.
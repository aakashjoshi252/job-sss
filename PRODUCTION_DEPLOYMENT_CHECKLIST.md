# Production Deployment Checklist

Use this before every business launch or production redeploy.

## 1. Environment

- Set `NODE_ENV=production` on the backend.
- Set a strong `JWT_SECRET` with at least 32 characters.
- Set `JWT_EXPIRE` and optionally `JWT_COOKIE_MAX_AGE_MS` to match the session policy.
- Configure one MongoDB variable: `MONGO_URL` or `MONGODB_URI`.
- Use MongoDB Atlas or another TLS-enabled production MongoDB service.
- Set `CLIENT_URL`, `FRONTEND_URL`, `PRODUCTION_URL`, and `ALLOWED_ORIGINS` to real HTTPS frontend origins only.
- Set frontend build variables:
  - `VITE_API_URL=https://your-api-domain/api/v1`
  - `VITE_SOCKET_URL=https://your-api-domain`
  - `VITE_RAZORPAY_KEY_ID=rzp_live_...`
  - `VITE_DEBUG_MODE=false`

## 2. Payments

- Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
- Use live Razorpay keys only after completing test-mode checkout.
- Verify the four production plans are active:
  - INR 599: 10 job posts per month
  - INR 1199: 50 job posts per month
  - INR 4999: unlimited job posts for 6 months
  - INR 12999: unlimited job posts for 1 year
- Confirm `/api/v1/subscription/verify-payment` rejects invalid signatures.
- Confirm webhook delivery points to `/api/v1/subscription/webhook`.

## 3. Security

- Run `npm run validate-env` in `server`.
- Run `npm run production-check` in `server`.
- Confirm admin routes require an admin token.
- Confirm recruiter job posting is blocked without an active subscription.
- Confirm candidate recommended jobs are limited to the candidate `jobProfession`.
- Confirm CORS rejects unapproved origins.
- Confirm file uploads reject unsupported MIME types and extensions.
- Confirm chat downloads work only for chat participants.

## 4. Data And Performance

- Run `node scripts/create-indexes.js` against production MongoDB before launch.
- Confirm paginated list pages load quickly for jobs, users, applications, blogs, and subscriptions.
- Confirm static assets are cached by the frontend host or Nginx.
- Confirm Cloudinary credentials are present for profile, company, blog, and chat assets.
- Confirm Socket.IO works over websocket behind the deployed reverse proxy.

## 5. Build And Test

From `server`:

```bash
npm ci
npm test
npm run validate-env
npm run production-check
```

From `client`:

```bash
npm ci
npm run build
```

With the deployed backend running:

```bash
API_AUDIT_BASE_URL=https://your-api-domain npm run audit:api
```

## 6. Render

- Backend root directory: `server`
- Backend build command: `npm ci --omit=dev`
- Backend start command: `npm start`
- Backend health check path: `/health`
- Frontend root directory: `client`
- Frontend build command: `npm ci && npm run build`
- Frontend publish directory: `dist`
- Frontend rewrite: `/* -> /index.html`

## 7. Docker

- Copy `.env.example` to `.env`.
- Replace every placeholder secret.
- Keep `VITE_API_URL=/api/v1` for same-origin Nginx deployments.
- Run:

```bash
docker compose build
docker compose up -d
docker compose ps
```

## 8. Launch Smoke Test

- Register and verify a candidate.
- Register and verify a recruiter.
- Create a recruiter company profile.
- Buy a Razorpay test subscription.
- Post jobs until plan limits are enforced.
- Log in as candidate and confirm recommendations match `jobProfession`.
- Apply to a job.
- Move the application through recruiter ATS statuses.
- Schedule an interview.
- Send chat text and an attachment.
- Create, publish, like, bookmark, and comment on a blog.
- Export admin reports to CSV, Excel, and PDF.

## 9. Rollback

- Keep the previous frontend build artifact or Render deploy available.
- Keep the previous backend deploy available.
- Take a MongoDB backup before schema/index changes.
- If payment verification breaks, disable subscription purchase UI and leave existing subscriptions active while rolling back.

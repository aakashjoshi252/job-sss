# Docker Production Setup for Jewelcancy

Domain: `www.jewelcancy.com`

Support email: `support@jewelcancy.com`

This setup runs the MERN Job Placement platform with:

- `router`: public Nginx reverse proxy on ports `80` and `443`
- `frontend`: React/Vite build served by an internal Nginx container
- `backend`: Node.js/Express API and Socket.IO server on internal port `3000`
- `mongodb`: internal MongoDB container
- `certbot`: Let's Encrypt renewal sidecar

Only the router is exposed publicly. The backend and MongoDB are private Docker network services.

## Production Files

```text
.
|-- docker-compose.prod.yml
|-- docker-compose.yml
|-- .env.example
|-- .dockerignore
|-- nginx/
|   |-- nginx.conf
|   `-- conf.d/default.conf
|-- client/
|   |-- Dockerfile
|   |-- nginx.conf
|   `-- .env.production.example
`-- server/
    |-- Dockerfile
    `-- .dockerignore
```

## Routing Flow

Browser traffic enters through the `router` container:

```text
https://www.jewelcancy.com
  -> router:443
  -> frontend:8080
  -> React/Vite app
```

API traffic stays on the same domain:

```text
https://www.jewelcancy.com/api/v1/*
  -> router:443
  -> backend:3000/api/v1/*
```

Socket.IO traffic uses the same origin and path:

```text
https://www.jewelcancy.com/socket.io/*
  -> router:443
  -> backend:3000/socket.io/*
```

MongoDB is only reachable inside Docker:

```text
backend:3000 -> mongodb:27017
```

## Redirects

The router redirects all public variants to the canonical HTTPS www domain:

```text
http://www.jewelcancy.com  -> https://www.jewelcancy.com
http://jewelcancy.com      -> https://www.jewelcancy.com
https://jewelcancy.com     -> https://www.jewelcancy.com
```

## React Router Refresh

The frontend Nginx config rewrites unknown browser routes to `index.html`, so refresh works for:

- `/candidate/dashboard`
- `/recruiter/dashboard`
- `/admin/dashboard`
- `/blog/:slug`

## Environment Setup

Create a production `.env` from the template:

```bash
cp .env.example .env
```

Required production values:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/jobplacements
JWT_SECRET=replace_with_a_random_64_character_secret
CLIENT_URL=https://www.jewelcancy.com
FRONTEND_URL=https://www.jewelcancy.com
PRODUCTION_URL=https://www.jewelcancy.com
SUPPORT_EMAIL=support@jewelcancy.com
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
VITE_API_URL=https://www.jewelcancy.com/api/v1
VITE_SOCKET_URL=https://www.jewelcancy.com
VITE_RAZORPAY_KEY_ID=
VITE_SUPPORT_EMAIL=support@jewelcancy.com
```

Do not put backend secrets into frontend `VITE_*` variables. Only `VITE_RAZORPAY_KEY_ID` is public.

## DNS Setup

Point both apex and www to the VPS public IP.

Option A:

```text
Type: A
Host: @
Value: VPS_PUBLIC_IP

Type: A
Host: www
Value: VPS_PUBLIC_IP
```

Option B:

```text
Type: A
Host: @
Value: VPS_PUBLIC_IP

Type: CNAME
Host: www
Value: jewelcancy.com
```

Wait until DNS resolves before requesting the Let's Encrypt certificate:

```bash
nslookup jewelcancy.com
nslookup www.jewelcancy.com
```

## Build and Run

Build:

```bash
docker compose -f docker-compose.prod.yml build
```

Run:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Restart:

```bash
docker compose -f docker-compose.prod.yml restart
```

Stop:

```bash
docker compose -f docker-compose.prod.yml down
```

Check router config:

```bash
docker compose -f docker-compose.prod.yml exec router nginx -t
```

## Let's Encrypt First-Time Certificate

On first startup, the router creates a one-day self-signed certificate so Nginx can start. After DNS points to the VPS and the stack is running, replace it with a real Let's Encrypt certificate:

```bash
docker compose -f docker-compose.prod.yml run --rm --entrypoint sh certbot -c "rm -rf /etc/letsencrypt/live/www.jewelcancy.com /etc/letsencrypt/archive/www.jewelcancy.com /etc/letsencrypt/renewal/www.jewelcancy.com.conf && certbot certonly --webroot --webroot-path /var/www/certbot --email support@jewelcancy.com --agree-tos --no-eff-email --force-renewal -d www.jewelcancy.com -d jewelcancy.com"
```

Reload the router after the certificate is issued:

```bash
docker compose -f docker-compose.prod.yml exec router nginx -s reload
```

The `certbot` service checks renewal every 12 hours. The router reloads every 6 hours so renewed certificates are picked up automatically.

Manual renewal test:

```bash
docker compose -f docker-compose.prod.yml run --rm --entrypoint certbot certbot renew --dry-run
```

## Health Checks

Router:

```bash
curl http://localhost/router-health
```

Backend through router:

```bash
curl https://www.jewelcancy.com/health
curl https://www.jewelcancy.com/backend-health
```

Docker services:

```bash
docker compose -f docker-compose.prod.yml ps
```

## Security Notes

- HTTPS is enforced at the router.
- Apex domain traffic redirects to `https://www.jewelcancy.com`.
- Backend and MongoDB are not published to the host in production.
- Nginx forwards `X-Forwarded-*` headers and the backend enables `trust proxy` in production.
- CORS allows `https://www.jewelcancy.com`, `https://jewelcancy.com`, and `http://localhost:5173`.
- API requests are rate limited at Nginx and again in Express.
- Socket.IO supports websocket upgrade and polling fallback through `/socket.io/`.
- `client_max_body_size` is `25M` for resumes, profile images, chat attachments, documents, and blog images.
- Static frontend assets are cached for one year with immutable cache headers.
- `.env` is ignored by git; do not commit secrets.

## Troubleshooting

If the router keeps restarting, check whether the certificate files exist:

```bash
docker compose -f docker-compose.prod.yml logs router
```

If Let's Encrypt fails, confirm:

- DNS points to the VPS public IP.
- Ports `80` and `443` are open in the VPS firewall/security group.
- No other service is using ports `80` or `443`.
- `http://www.jewelcancy.com/.well-known/acme-challenge/test` reaches the router.

If frontend API calls fail, rebuild after changing `VITE_*` values:

```bash
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend router
```

If Socket.IO fails, check browser devtools and router logs for `/socket.io/` requests. The router forwards `Upgrade`, `Connection`, `Authorization`, credentials, and `X-Forwarded-*` headers.

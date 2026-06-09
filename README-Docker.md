# Docker Setup

This project is containerized as a MERN stack with:

- `frontend`: React/Vite production build served by Nginx
- `backend`: Node.js/Express API and Socket.IO server
- `mongodb`: MongoDB 7 with persistent volumes
- optional `redis`: commented in `docker-compose.yml` for future cache/session use

## Files

```text
.
├── .env
├── .env.example
├── .dockerignore
├── docker-compose.yml
├── docker-compose.dev.yml
├── README-Docker.md
├── client/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── nginx.conf
└── server/
    ├── Dockerfile
    └── .dockerignore
```

## Architecture

Production traffic flow:

```text
Browser
  -> frontend container on host port 80
  -> Nginx serves React files
  -> Nginx proxies /api, /health, /uploads, /socket.io to backend:5000
  -> backend connects to mongodb:27017 over the Docker network
```

The frontend uses `VITE_API_URL=/api/v1` by default, so API calls stay same-origin through Nginx. Socket.IO uses the same origin and Nginx proxies websocket upgrades at `/socket.io/`.

## Environment Setup

Use `.env.example` as the template for `.env`.

Important production values to replace:

- `JWT_SECRET`: use a random secret of at least 32 characters
- `MONGO_INITDB_ROOT_PASSWORD`: use a strong password before first MongoDB startup
- `CLIENT_URL` and `FRONTEND_URL`: public frontend URL, for example `https://jobs.example.com`
- `ALLOWED_ORIGINS`: comma-separated allowed browser origins
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `VITE_RAZORPAY_KEY_ID`: public Razorpay key used by the browser

For same-domain production through Nginx, keep:

```env
VITE_API_URL=/api/v1
VITE_SOCKET_URL=
```

For separate API and frontend domains, set:

```env
VITE_API_URL=https://api.example.com/api/v1
VITE_SOCKET_URL=https://api.example.com
CLIENT_URL=https://jobs.example.com
FRONTEND_URL=https://jobs.example.com
ALLOWED_ORIGINS=https://jobs.example.com
```

## Production Commands

Build images:

```bash
docker compose build
```

Start:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

Restart:

```bash
docker compose restart
```

Logs:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

Check health:

```bash
docker compose ps
curl http://localhost/health
curl http://localhost/backend-health
curl http://localhost/nginx-health
```

Remove containers but keep MongoDB data:

```bash
docker compose down
```

Remove containers and MongoDB volumes:

```bash
docker compose down -v
```

## Development Commands

The dev compose file runs Vite hot reload and Nodemon with source bind mounts:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- MongoDB: `localhost:27017`

Stop dev:

```bash
docker compose -f docker-compose.dev.yml down
```

## Ports

Production defaults:

- Frontend/Nginx: host `80` -> container `8080`
- Backend/API/Socket.IO: host `5000` -> container `5000`
- MongoDB: host `27017` -> container `27017`

Override host ports in `.env`:

```env
FRONTEND_PORT=8080
BACKEND_PORT=5000
MONGODB_PORT=27017
```

## Volumes and Persistence

MongoDB data is stored in named volumes:

- `mongodb_data`
- `mongodb_config`

Backend upload and log folders are bind-mounted:

- `./server/uploads:/app/uploads`
- `./server/logs:/app/logs`

Cloudinary uploads use memory storage and Cloudinary credentials, so no local upload persistence is required for Cloudinary-backed assets. Local static files under `server/uploads` remain available through the bind mount.

## MongoDB Backup

Create a compressed backup:

```bash
docker compose exec mongodb mongodump \
  -u "$MONGO_INITDB_ROOT_USERNAME" \
  -p "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --archive=/tmp/jobplacements.archive \
  --gzip

docker compose cp mongodb:/tmp/jobplacements.archive ./jobplacements.archive
```

Restore:

```bash
docker compose cp ./jobplacements.archive mongodb:/tmp/jobplacements.archive
docker compose exec mongodb mongorestore \
  -u "$MONGO_INITDB_ROOT_USERNAME" \
  -p "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --archive=/tmp/jobplacements.archive \
  --gzip \
  --drop
```

## Socket.IO Notes

Nginx proxies websocket upgrades at `/socket.io/` with:

- `Upgrade`
- `Connection`
- `X-Forwarded-*`
- extended read/send timeouts

The backend already listens on `0.0.0.0`, enables websocket and polling transports, and uses CORS from `CLIENT_URL`, `FRONTEND_URL`, and `ALLOWED_ORIGINS`.

## Security Notes

- Backend runs as the non-root `node` user.
- Frontend uses the unprivileged Nginx image and maps host port `80` to container port `8080`.
- Docker build contexts exclude `node_modules`, `dist`, `build`, logs, uploads, `.git`, and env files.
- Nginx adds security headers and immutable caching for static assets.
- Secrets are loaded from `.env`, which is ignored by git.
- Replace all placeholder secrets before using production payment, auth, email, or upload features.

## CI/CD Image Tagging

Use commit SHA or release tags:

```bash
IMAGE_TAG=$(git rev-parse --short HEAD) docker compose build
IMAGE_TAG=$(git rev-parse --short HEAD) docker compose push
```

Suggested tags:

- `latest` for local builds only
- Git SHA for every CI build
- Semver release tag for production releases, for example `v1.4.0`

The Dockerfiles copy `package*.json` before source files so dependency layers are cached unless dependencies change.

## VPS Deployment Checklist

1. Install Docker Engine and Docker Compose plugin on Ubuntu.
2. Clone the repository.
3. Create `.env` from `.env.example`.
4. Set real domain URLs and secrets.
5. Open firewall ports `80`, optionally `443`, and only expose `5000`/`27017` if you explicitly need remote access.
6. Run `docker compose build`.
7. Run `docker compose up -d`.
8. Check `docker compose ps` and `docker compose logs -f`.
9. Put TLS in front of the frontend with a host reverse proxy, load balancer, or a companion certificate proxy.

This setup works on VPS, AWS EC2, DigitalOcean Droplets, Azure VM, Google Cloud VM, and any Linux host with Docker Compose.

## Troubleshooting

If the backend exits immediately, check:

```bash
docker compose logs backend
```

Common causes:

- `JWT_SECRET` is shorter than 32 characters in production
- Razorpay production credentials are missing
- Mongo credentials in `.env` were changed after the MongoDB volume was already initialized

If Mongo auth fails after changing credentials, recreate the MongoDB volumes:

```bash
docker compose down -v
docker compose up -d
```

If frontend API calls go to the wrong URL, rebuild the frontend after changing `VITE_*` values:

```bash
docker compose build frontend
docker compose up -d frontend
```

If Socket.IO fails behind a cloud firewall or reverse proxy, make sure `/socket.io/` supports websocket upgrades and forwards `Upgrade` and `Connection` headers.

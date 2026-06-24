# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

WORKDIR /app

ENV PORT=3000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apk add --no-cache \
    chromium \
    dumb-init \
    font-noto \
    freetype \
    harfbuzz \
    nss \
    ttf-freefont

COPY package*.json ./

FROM base AS production-deps
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS development
ENV NODE_ENV=development
RUN npm ci && npm cache clean --force
COPY --chown=node:node . .
RUN mkdir -p uploads logs && chown -R node:node /app
USER node
EXPOSE 5000
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV=production
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p uploads logs && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3000;const req=http.get({host:'127.0.0.1',port,path:'/health',timeout:3000},res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1);});"
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM deps AS development
ENV HOST=0.0.0.0
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM deps AS build
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=
ARG VITE_RAZORPAY_KEY_ID=
ARG VITE_DEBUG_MODE=false
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_SOCKET_URL=${VITE_SOCKET_URL} \
    VITE_RAZORPAY_KEY_ID=${VITE_RAZORPAY_KEY_ID} \
    VITE_DEBUG_MODE=${VITE_DEBUG_MODE}
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/nginx-health || exit 1
CMD ["nginx", "-g", "daemon off;"]

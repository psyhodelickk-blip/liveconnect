# liveconnect-frontend/Dockerfile

# ---------- BUILDER ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Mirror i otpornija mrežna podešavanja (bez zastarelog "timeout")
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN npm config set registry ${NPM_REGISTRY} \
 && npm config set fetch-retries 6 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 600000 \
 && npm config set prefer-online true \
 && npm config set audit false \
 && npm config set fund false

# Iskoristi keš za dependencije
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    (npm ci || (sleep 5 && npm ci) || (sleep 10 && npm ci))

# Build (CRA pravi /build)
COPY . .
RUN npm run build

# ---------- RUNTIME (NGINX) ----------
FROM nginx:alpine AS runtime
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# CRA output je /app/build
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

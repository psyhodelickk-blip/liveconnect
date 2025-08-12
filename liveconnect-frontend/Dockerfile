# syntax=docker/dockerfile:1.7

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Stabilniji npm (bez CI varijable!)
ENV npm_config_loglevel=warn \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_registry=https://registry.npmjs.org/

COPY package*.json ./
# Cache npm folder tokom builda (zahteva BuildKit)
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

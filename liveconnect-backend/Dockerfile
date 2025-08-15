# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

# Potrebno za Prisma + TLS
RUN apk add --no-cache ca-certificates openssl curl

# NPM robusnost (retries/timeouts) – pomaže i @prisma/engines postinstall-u
ENV npm_config_fetch_retries=6 \
    npm_config_fetch_retry_factor=2 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=180000 \
    npm_config_network_timeout=180000

# Kopiraj package fajlove i .npmrc pre npm ci (radi cache)
COPY package*.json ./
COPY .npmrc .npmrc

# Ako mreža pukne – ponovi
RUN npm ci || (sleep 5 && npm ci) || (sleep 10 && npm ci)

# Prisma klijent pre full koda (da ranije skine engine-ove)
COPY prisma ./prisma
RUN npx prisma generate || (sleep 5 && npx prisma generate)

# Ostatak aplikacije
COPY . .

# Ako imaš entrypoint skriptu koja radi migrate deploy + start
# obavezno je učini izvršnom ovde (posle COPY . .)
RUN chmod +x ./docker-entrypoint.sh || true
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 4000

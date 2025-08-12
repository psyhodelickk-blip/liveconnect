# Backend Dockerfile (Prisma + OpenSSL fix)
FROM node:20-bullseye-slim

# libssl1.1 je potreban nekim Prisma engine-ima na linuxu
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends libssl1.1 openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Deps
COPY package*.json ./
RUN npm ci

# Prisma client (generišemo u istom okruženju gde će raditi)
COPY prisma ./prisma
RUN npx prisma generate

# Source
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# Server start radi kroz docker-compose (vidi dole "command:")
CMD ["node", "server.js"]

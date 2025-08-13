# syntax=docker/dockerfile:1.7
FROM node:20-bullseye-slim

# OpenSSL 1.1 za Prisma engines + certs
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends libssl1.1 openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instaliraj deps (uklj. dev deps jer koristimo prisma CLI u runtime-u)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Prisma client build time (da ne generišemo pri startu)
COPY prisma ./prisma
RUN npx prisma generate

# Ostatak koda
COPY . .

# Entry skripta + skidanje CRLF ako si sa Windows-a
RUN chmod +x docker-entrypoint.sh && sed -i 's/\r$//' docker-entrypoint.sh

EXPOSE 4000
CMD ["./docker-entrypoint.sh"]

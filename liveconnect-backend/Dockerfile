# --- build/runtime u jednom (dev-friendly) ---
FROM node:20-alpine

# sistemske alatke
RUN apk add --no-cache bash openssl ca-certificates curl

WORKDIR /app

# prvo samo package fajlove da keš radi
COPY package*.json ./

# čist install
RUN npm ci

# kopiramo ostatak koda (prisma, src, sve)
COPY . .

# generiši Prisma klijenta
RUN npx prisma generate

# entrypoint koji će pustiti migracije pa start
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 4000

CMD ["/bin/sh", "/app/docker-entrypoint.sh"]

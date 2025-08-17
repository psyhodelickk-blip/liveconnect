#!/bin/sh
set -e

echo "==> Waiting a bit for DB..."
sleep 2

echo "==> Running Prisma migrations (dev)..."
# Ako ima unapred definisanih migracija, primeni ih; ako nema, napravi init na licu mesta
npx prisma migrate deploy || npx prisma migrate dev --name init || npx prisma db push

echo "==> Starting server..."
node server.js

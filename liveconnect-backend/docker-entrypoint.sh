#!/bin/sh
set -e

echo "-> DATABASE_URL: $DATABASE_URL"
echo "-> Running prisma migrate deploy..."
# pokušaj migracije; ako nema migracija ili fail, probaj db push (dev-friendly)
npx prisma migrate deploy || npx prisma db push

echo "-> Starting server..."
node server.js

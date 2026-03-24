#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma migrate deploy
fi

exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3000}"

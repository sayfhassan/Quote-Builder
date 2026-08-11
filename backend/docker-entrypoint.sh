#!/bin/sh
set -e

if [ ! -f "$DATABASE_PATH" ]; then
  echo "No database found at $DATABASE_PATH — seeding..."
  node dist/seed/seed.js
fi

exec node dist/main.js

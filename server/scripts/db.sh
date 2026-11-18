#!/usr/bin/env bash
# 本地开发用的 PostgreSQL：数据放在 server/.pgdata，端口 54329，不碰本机已有的库。
# 用法：scripts/db.sh up | down | status | psql
set -euo pipefail

cd "$(dirname "$0")/.."
PGBIN="${PGBIN:-$(dirname "$(command -v pg_ctl 2>/dev/null || echo /opt/homebrew/opt/postgresql@17/bin/pg_ctl)")}"
DATA="$PWD/.pgdata"
# macOS 上 postmaster 启动需要有效的 LC_ALL，否则报 "became multithreaded during startup"
export LC_ALL=C
PORT="${PGPORT:-54329}"
USER_NAME=stellar
PASSWORD=stellar

if [ ! -x "$PGBIN/pg_ctl" ]; then
  echo "找不到 PostgreSQL（pg_ctl）。macOS 可用 brew install postgresql@17，或设置 PGBIN，或直接在 .env 里填自己的 DATABASE_URL。" >&2
  exit 1
fi

case "${1:-up}" in
  up)
    if [ ! -f "$DATA/PG_VERSION" ]; then
      pwfile="$(mktemp)"; printf '%s' "$PASSWORD" > "$pwfile"
      "$PGBIN/initdb" -D "$DATA" -U "$USER_NAME" --pwfile="$pwfile" --auth=scram-sha-256 -E UTF8 --locale=C >/dev/null
      rm -f "$pwfile"
      echo "已初始化本地数据库目录 $DATA"
    fi
    if ! "$PGBIN/pg_ctl" -D "$DATA" status >/dev/null 2>&1; then
      "$PGBIN/pg_ctl" -D "$DATA" -l "$DATA/server.log" -o "-p $PORT -k $DATA -c listen_addresses=127.0.0.1" -w start >/dev/null
    fi
    for db in stellar_notes stellar_notes_test; do
      PGPASSWORD="$PASSWORD" "$PGBIN/psql" -h 127.0.0.1 -p "$PORT" -U "$USER_NAME" -d postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1 \
        || PGPASSWORD="$PASSWORD" "$PGBIN/createdb" -h 127.0.0.1 -p "$PORT" -U "$USER_NAME" "$db"
    done
    echo "PostgreSQL 已就绪：postgres://$USER_NAME:$PASSWORD@127.0.0.1:$PORT/stellar_notes"
    ;;
  down)
    "$PGBIN/pg_ctl" -D "$DATA" -m fast stop
    ;;
  status)
    "$PGBIN/pg_ctl" -D "$DATA" status
    ;;
  psql)
    PGPASSWORD="$PASSWORD" exec "$PGBIN/psql" -h 127.0.0.1 -p "$PORT" -U "$USER_NAME" -d "${2:-stellar_notes}"
    ;;
  *)
    echo "用法：$0 up | down | status | psql [库名]" >&2
    exit 1
    ;;
esac

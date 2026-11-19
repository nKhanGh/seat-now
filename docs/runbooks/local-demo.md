# SeatNow local demo runbook

All commands below run from the repository root in PowerShell unless noted.
Use fictional demo data only. The Docker Compose database is bound to localhost.

## Start and verify

```powershell
docker compose -f infra/compose.yaml up -d
Copy-Item backend/.env.example backend/.env
cd backend
npm ci
npm run build
npm run seed:demo
npm run start:dev
```

In a second terminal, run `cd frontend; npm ci; npm run dev`. Open
`http://localhost:5173`. `GET http://localhost:3000/api/v1/health` must return
`{"data":{"status":"ok","database":"ok"}}`. The map should show fictional
venues around District 1, Ho Chi Minh City. Select a venue to see seat and
parking information. The demo snapshots expire after ten minutes; run
`npm run seed:demo` again in `backend` to make them fresh.

The static OpenAPI contract is at `contracts/openapi/seatnow.json`. The
Socket.IO contract is at `contracts/events/live.md`.

## Quality gate

```powershell
cd backend
npm run typecheck
npm run build
npm test
$env:MONGODB_TEST_URI='mongodb://127.0.0.1:27017/seatnow'
npm run test:integration
cd ../frontend
npm run typecheck
npm run build
```

Integration tests create and remove uniquely named `seatnow_test_*` databases.
They do not modify the `seatnow` demo database. `npm test` skips those tests
when `MONGODB_TEST_URI` is unset; run both commands above.

## Restore projections after an interrupted update

From `backend`, run `npm run rebuild:projections`. It reads venue profiles
and the newest immutable venue and parking snapshots, then updates the public
map and latest availability projections without replacing a newer version.
It can run again safely. It does not fetch new real-world data; expired
snapshots remain stale.

## Backup and restore local demo data

Create a backup before resetting or restoring the local database:

```powershell
$mongoContainer = docker compose -f infra/compose.yaml ps -q mongodb
New-Item -ItemType Directory -Force backups | Out-Null
docker exec $mongoContainer mongodump --db seatnow --archive=/tmp/seatnow.archive
docker cp "${mongoContainer}:/tmp/seatnow.archive" backups/seatnow.archive
```

To restore that backup, stop the API, then run the commands below. `--drop`
replaces collections in the local `seatnow` database, including local users.

```powershell
$mongoContainer = docker compose -f infra/compose.yaml ps -q mongodb
docker cp backups/seatnow.archive "${mongoContainer}:/tmp/seatnow.archive"
docker exec $mongoContainer mongorestore --drop --nsInclude='seatnow.*' --archive=/tmp/seatnow.archive
cd backend
npm run rebuild:projections
```

To reset only fictional venue/parking demo records, running `seed:demo` updates
those records and adds fresh snapshots. It does not erase user accounts or
snapshot history. To remove the whole local database, use MongoDB tools only
after taking the backup above and explicitly deciding that local accounts and
history can be discarded.

## Production limits

This release has no live POS, cinema or parking data provider. The seed and
Premium fixture commands are disabled in production. Before public signup,
add email verification and password recovery. Before multi-instance deploy,
add a shared Socket.IO adapter and a durable event delivery strategy. Set
`PUBLIC_ORIGIN` to the actual HTTPS origin, `MONGODB_URI` to the production
database and keep `AVAILABILITY_INGEST_TOKEN` in a secret manager.

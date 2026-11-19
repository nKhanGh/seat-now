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

The static OpenAPI contracts are at `contracts/openapi/seatnow.json` and
`contracts/openapi/community.json`. The
Socket.IO contract is at `contracts/events/live.md`.

## Community demo and moderation

Sign in to save a venue, check in while physically near it, write a short
review with one optional photo, follow a public profile or propose a venue.
Check-ins require browser geolocation, reported accuracy within 100 m and a
position within 150 m of the venue. The server does not retain submitted
coordinates. The count is self-reported and never replaces seat availability.

Set a strong `COMMUNITY_MODERATION_TOKEN` only in the backend environment.
The token is separate from `AVAILABILITY_INGEST_TOKEN` and must not be included
in frontend variables. A proposed venue needs three confirmations from users
other than its creator before approval. Review reports and proposals can be
inspected and acted on from the operator terminal:

```powershell
$base = 'http://localhost:3000/api/v1'
$headers = @{ Authorization = "Bearer $env:COMMUNITY_MODERATION_TOKEN" }
Invoke-RestMethod "$base/internal/community/review-reports" -Headers $headers
Invoke-RestMethod "$base/community/proposals?status=READY_FOR_REVIEW"
# After inspecting the content, replace the placeholder with the actual ID:
Invoke-RestMethod "$base/internal/community/reviews/<reviewId>/hide" -Method Post -Headers $headers
Invoke-RestMethod "$base/internal/community/proposals/<proposalId>/approve" -Method Post -Headers $headers
# To reject an invalid proposal instead:
Invoke-RestMethod "$base/internal/community/proposals/<proposalId>/reject" -Method Post -Headers $headers
```

Hiding a review removes it and its photo from public reads. Proposal approval
publishes the venue profile and map projection; repeat approval is idempotent.
There is no public moderation dashboard in this demo.

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
npm test
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
database and keep `AVAILABILITY_INGEST_TOKEN` and
`COMMUNITY_MODERATION_TOKEN` in a secret manager. Public signup also needs
an explicit retention/deletion policy and an operated moderation process.

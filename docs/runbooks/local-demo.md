# SeatNow local demo runbook

All commands below run from the repository root in PowerShell unless noted.
Use fictional demo data only. The Docker Compose database is bound to localhost.

## Start and verify

```powershell
docker compose -f infra/compose.yaml up -d
Copy-Item backend/.env.example backend/.env
# Đặt JWT_SECRET dài ít nhất 32 ký tự trong backend/.env và giữ cố định giữa các lần khởi động.
cd backend
npm ci
npm run build
npm run seed:demo
npm run start:dev
```

In a second terminal, run `cd frontend; npm ci; npm run dev`. Open
`http://localhost:5173`. `GET http://localhost:3000/api/v1/health` must return
`{"data":{"status":"ok","database":"ok"}}`. The map should show 100 fictional
venues across Ho Chi Minh City. Select a venue to see seat and
parking information. The demo snapshots expire after ten minutes; run
`npm run seed:demo` again in `backend` to make them fresh.
Click **Vị trí của tôi** on localhost or HTTPS and allow location access to see
the blue position dot. Pan the map to verify that venue pins remain visible.
Sign in, choose a venue, submit a star rating (comment optional), and check
that its displayed rating changes. A new venue submitted at `/proposals` stays
off the map until three other users confirm it and an operator approves it.

The static OpenAPI contracts are at `contracts/openapi/seatnow.json`,
`contracts/openapi/community.json`, `contracts/openapi/business.json` and
`contracts/openapi/booking.json`. The
Socket.IO contract is at `contracts/events/live.md`.

## Business owner demo

Open `/business` after signing in. Use **Yêu cầu quyền** (`/business/claims`)
to submit a management request for an existing venue, including evidence for
operator review. Set a strong
`BUSINESS_ADMIN_TOKEN` only in the backend environment. The operator reviews
the claim and approves or rejects it; a slug alone never grants edit access.

For browser review, create a separate admin account once. Put `ADMIN_EMAIL`
and a random password of at least 20 characters in ignored `backend/.env.admin`,
then run `cd backend; npm run build; npm run admin:create`. The command refuses
an email that already belongs to a normal account. Sign in with that account,
open `/admin`, inspect applicant identity, evidence and any attached image,
then choose **Duyệt** or **Từ chối** and confirm. A normal user cannot call the
admin endpoints. The owner refreshes `/business` to see the outcome. The token
commands below remain available for operator scripts.

```powershell
$base = 'http://localhost:3000/api/v1'
$headers = @{ Authorization = "Bearer $env:BUSINESS_ADMIN_TOKEN" }
Invoke-RestMethod "$base/internal/business/claims" -Headers $headers
# If hasDocument is true, inspect the private attachment before deciding:
Invoke-WebRequest "$base/internal/business/claims/<claimId>/document" -Headers $headers -OutFile claim-document.webp
# After reviewing evidence, replace the placeholder with the actual claim ID:
Invoke-RestMethod "$base/internal/business/claims/<claimId>/approve" -Method Post -Headers $headers
# Or reject invalid ownership evidence:
Invoke-RestMethod "$base/internal/business/claims/<claimId>/reject" -Method Post -Headers $headers
```

An approved owner uses the header to switch between **Đặt bàn**, **Tương tác**
and **Hồ sơ** pages. The **Chi nhánh** selector switches venues without scrolling
through a long page. The owner can edit the venue profile and upload a logo on the Basic
plan. For a time-limited Premium demo, use the internal plan endpoint. This
does not charge anyone or create a payment subscription:

```powershell
$base = 'http://localhost:3000/api/v1'
$headers = @{ Authorization = "Bearer $env:BUSINESS_ADMIN_TOKEN"; 'Content-Type' = 'application/json' }
$expires = (Get-Date).ToUniversalTime().AddDays(7).ToString('o')
$body = @{ plan = 'PREMIUM'; premiumExpiresAt = $expires } | ConvertTo-Json
Invoke-RestMethod "$base/internal/business/venues/<venueSlug>/plan" -Method Put -Headers $headers -Body $body
```

Premium owners use the separate **Chỗ trống**, **Thống kê** and **Ưu đãi** pages
to update seats manually, see a seven-day dashboard and schedule an in-app offer;
the cover image is uploaded on **Hồ sơ**. Operator snapshots
expire after ten minutes. Sponsored results are labeled and sorted first in
map search. Offers and covers stop appearing when Premium expires. The
dashboard counts detail requests, not unique people, and occupancy averages
snapshot values including demo data. There is no push notification or voucher
redemption flow in this demo.

## Booking request demo

After the operator approves a business claim, the owner opens `/business`,
chooses **Đặt bàn** on the header and checks **Nhận yêu cầu đặt bàn** for a restaurant or cafe.
This opt-in is off by
default; cinema table bookings are not supported. Another signed-in user opens
that venue on the map, chooses a start time at least one hour and at most fourteen
days ahead, an end time 30 minutes to four hours later, and sends a request for 1–12 guests. The request appears as
**Chờ xác nhận** on `/bookings`; the owner's `/business` queue shows it with the
guest's display name. The owner confirms or declines; the guest sees the
updated state on `/bookings` (which refreshes every 30 seconds). The owner
keeps seeing upcoming confirmed bookings and the guest may cancel one. To test
the full-capacity case, set a venue snapshot to one total table, send two
overlapping requests from different accounts, and confirm the first. Confirming
the second returns 409; an adjacent non-overlapping request can be confirmed.
Current empty tables are only a snapshot, so future requests remain pending
until the owner confirms capacity.

To verify priority, activate a local Premium fixture for a second user with
`SEED_PREMIUM_EMAIL` and `npm run seed:premium` from `backend`, then send a
request from that account. Premium pending requests appear above ordinary
pending requests. The priority flag is assigned by the backend; it does not
automatically hold a table or guarantee acceptance.

## Community demo and moderation

Sign in to save a venue, check in while physically near it, submit a star rating
with an optional comment and photo, follow a public profile or propose a venue.
Check-ins require browser geolocation, reported accuracy within 100 m and a
position within 150 m of the venue. The server does not retain submitted
coordinates. The count is self-reported and never replaces seat availability.

Set a strong `COMMUNITY_MODERATION_TOKEN` only in the backend environment.
The token is separate from `AVAILABILITY_INGEST_TOKEN` and must not be included
in frontend variables. A proposed venue needs three confirmations from users
other than its creator before approval. Review reports and proposals can be
inspected and acted on from the operator terminal:

The submitter can track pending confirmations, operator review, approval or
rejection under **Đề xuất của tôi**. After approval, the venue appears on the map.
An admin can also sign in at `/admin`, open **Quán cộng đồng**, inspect the
applicant, description, address and coordinates, then approve or reject with
a confirmation step. Only proposals with three confirmations enter this queue.
To manage an existing venue, submit an ownership claim at `/business`.

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
The admin proposal queue is private; review-report moderation remains terminal-only.

## Quality gate

```powershell
npm ci
npm run format:check
npm run lint
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
database, set a stable `JWT_SECRET` of at least 32 characters and keep `AVAILABILITY_INGEST_TOKEN`,
`COMMUNITY_MODERATION_TOKEN` and `BUSINESS_ADMIN_TOKEN` in a secret manager. Public signup also needs
an explicit retention/deletion policy and an operated moderation process.

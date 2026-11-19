# Kế hoạch triển khai SeatNow

Phiên bản 1.5 — 19/11/2026. Trạng thái: **MVP demo F00–F04 và nhóm cộng đồng F05 chạy được; hardening M6 chưa hoàn tất**. API, UI, Socket.IO, MongoDB integration test, OpenAPI tĩnh, health check và runbook demo đã có. POS/parking data connector thật, lint/CI, E2E browser automation và vận hành production còn ở M6.

[Quy chuẩn chung](COMMON.md) · [ADR stack](../adr/001-stack-and-architecture.md) · [README dự án](../../README.md)

Authentication decision: [ADR 002 — first-party auth](../adr/002-first-party-auth.md).

## 1. Mục tiêu release đầu tiên

Release đầu tiên phải chứng minh được một vertical slice hoàn chỉnh:

```text
MongoDB geospatial query
  → NestJS REST contract
  → React map/list/filter
  → availability update
  → Socket.IO event
  → UI cập nhật và tự phục hồi bằng REST
```

Người dùng có thể mở app, cấp hoặc từ chối quyền vị trí, tìm địa điểm quanh một tâm bản đồ, lọc cơ bản, xem độ đông/chỗ còn trống/thời gian chờ, rồi xem bãi đỗ xe phù hợp gần địa điểm. UI phải nói rõ dữ liệu mới hay cũ và đến từ nguồn nào.

## 2. Phạm vi theo mức ưu tiên

| Ưu tiên | Feature | Phạm vi release đầu | Không nằm trong release đầu |
|---:|---|---|---|
| P0 | Nền tảng | Monorepo, NestJS, React, MongoDB, OpenAPI, response/error contract, test/CI, seed data | Kubernetes, microservices, event broker |
| P0 | [F00 Đăng nhập](features/F00-auth.md) | Tài khoản demo, đăng nhập, phiên cookie, đăng xuất, `/me`, guard | Social login, reset mật khẩu/email public launch |
| P1 | [F01 Bản đồ realtime](features/F01-realtime-map.md) | Map/list, geolocation fallback, tìm theo vùng, filter khoảng cách/loại/giá/đánh giá/độ đông/chỗ trống, detail drawer | Review/community, recommendation AI |
| P1 | [F02 Chỗ ngồi](features/F02-seat-availability.md) | Latest snapshot, bàn/chỗ trống, crowd level, wait time, freshness/confidence, realtime update | Đặt bàn, POS connector production |
| P2 | [F03 Bãi đỗ xe](features/F03-parking.md) | Bãi của quán và bãi lân cận, khoảng cách, giá, latest spaces, stale state | Giữ chỗ/đặt chỗ xe, thanh toán |
| P2 | [F04 Gói người dùng](features/F04-user-subscription.md) | FREE/PREMIUM, subscription state, entitlement resolver, màn hình so sánh gói | Payment gateway, voucher, AI nâng cao, quảng cáo thật |
| Done demo | [F05 Cộng đồng](features/F05-community.md) | Check-in, review/ảnh/báo cáo, favorite, follow/share, đề xuất địa điểm và duyệt nội bộ | Cần quy trình kiểm duyệt và chính sách dữ liệu trước public launch |
| Later | Business | Hồ sơ/chủ quán, xác thực, dashboard, ads, flash voucher, chuỗi chi nhánh | Chỉ giữ internal ingestion tối thiểu để tạo dữ liệu MVP |

Theo quyết định ngày 19/11/2026, nhóm [F05 cộng đồng](features/F05-community.md) được thực hiện sau MVP demo; tính năng chủ quán là nhóm tiếp theo.

## 3. Thứ tự triển khai theo vertical slice

### M0 — Khóa contract và bootstrap

- Tạo `backend`, `frontend`, `contracts`, `infra`, `docs` theo [COMMON](COMMON.md).
- Khóa phiên bản runtime bằng `.nvmrc`/`engines`, lockfile và image MongoDB có version; không dùng `latest`.
- Thiết lập ESLint type-aware, Prettier, TypeScript strict, Husky/lint-staged nếu team dùng Git hook.
- Docker Compose MongoDB; seed một vùng demo nhỏ có venue, availability và parking.
- Thiết lập response envelope, error contract, Swagger/OpenAPI, request ID và health endpoint.
- Gate: backend/frontend build, lint và test mẫu đều chạy từ máy sạch.

Hiện có TypeScript strict, lockfile, build và test; lint/format gate còn phải thiết lập.

### M1 — F01 bản đồ tĩnh có dữ liệu thật từ API

- Tạo `venues` collection và `2dsphere` index.
- Hoàn thiện `GET /api/v1/map/venues` với radius/bounds và filter allowlist.
- React render map + synchronized result list; filter nằm trong URL.
- Hỗ trợ loading, empty, error, denied-location, retry, desktop/mobile.
- Gate: query geospatial được test trên MongoDB thật; pan/zoom không tạo request storm.

### M2 — F02 availability qua REST

- Tạo snapshot model, latest projection và ingestion endpoint nội bộ.
- Trả `availability`, `freshness`, `source`, `capturedAt`, `expiresAt`, `confidence` trong map/detail DTO.
- UI không suy diễn “còn bàn” khi snapshot thiếu hoặc hết hạn.
- Gate: cập nhật có idempotency/version guard; refresh trang giữ kết quả đúng.

### M3 — F02 realtime end-to-end

- Socket handshake, map/venue room subscription và authorization phù hợp.
- Publish `venue.availability.updated`; frontend patch cache hoặc invalidate đúng key.
- Reconnect/backoff, resubscribe và REST refetch để bù event bị mất.
- Gate: update từ ingestion xuất hiện trên client trong mục tiêu latency staging; duplicate/out-of-order không làm lùi dữ liệu.

### M4 — F03 parking

- Tạo parking facility + parking snapshot, geospatial query gần venue/tâm bản đồ.
- Hiển thị relation (`VENUE`, `PARTNER`, `PUBLIC`), walking distance, pricing summary và availability freshness.
- Publish `parking.availability.updated`; UI có stale/unknown state.
- Gate: không trộn “số chỗ tổng” với “số chỗ hiện có”; giá luôn có đơn vị và quy tắc.

### M5 — F04 user plans

- Hoàn tất F00 auth/session và tạo user subscription, entitlement resolver phía backend.
- `GET /api/v1/me/subscription` và `GET /api/v1/me/entitlements` yêu cầu đăng nhập.
- Mọi quyền hiện tại của F01–F03 vẫn thuộc FREE; Premium chỉ hiển thị capability roadmap rõ ràng.
- Gate: backend là nguồn quyết định quyền; UI chỉ ẩn/hiện affordance, không tự cấp quyền.

### M6 — Hardening và demo release

- E2E các hành trình quan trọng, accessibility keyboard, responsive, offline/reconnect.
- Rate limit ingestion; logs có request ID nhưng không log token/PII.
- Load test geospatial query và fan-out realtime bằng dataset gần kích thước demo mục tiêu.
- Viết runbook seed/reset/backup/restore và bằng chứng nghiệm thu.

## 4. Task registry

Đây là nơi duy nhất định nghĩa dependency của task. Feature file chỉ liên kết về task, không tạo backlog mâu thuẫn.

| ID | Task | Phụ thuộc | Đầu ra nghiệm thu |
|---|---|---|---|
| T01 | Bootstrap monorepo + tooling | — | build/lint/test scripts và lockfiles |
| T02 | Local MongoDB + config validation | T01 | compose, healthcheck, env example, seed profile |
| T03 | Common HTTP/error/OpenAPI | T01 | envelope/error code/validation/Swagger tests |
| T04 | Venue schema + geospatial indexes | T02 | migration/index bootstrap và integration test |
| T05 | Map query contract | T03,T04 | REST filters, cursor, validation, OpenAPI |
| T06 | React app shell + map/list | T01,T05 | URL filters, states, responsive UI |
| T07 | Availability model + ingestion | T03,T04 | idempotent write, latest projection, audit metadata |
| T08 | Availability REST/read model | T05,T07 | map/detail DTO không N+1 |
| T09 | Realtime gateway + client | T07,T08 | room subscription, ordering, reconnect/refetch |
| T10 | Parking facility/query | T04,T05 | near-venue/near-center queries và pricing DTO |
| T11 | Parking availability realtime | T07,T09,T10 | snapshot + event + stale UI |
| T12 | First-party auth/session | T01,T02,T03 | Argon2id, user/session MongoDB models, register/login/logout/me, cookie/CSRF/rate limit, API tests |
| T13 | Subscription + entitlement | T12 | FREE/PREMIUM state machine và guard/decorator |
| T14 | Contract/E2E/accessibility | T06,T08,T09,T11,T13 | critical scenarios pass |
| T15 | Observability/performance/runbook | T14 | metrics/log/load evidence và operator docs |

## 5. Definition of Ready

Một task chỉ bắt đầu khi:

- Scope và out-of-scope rõ.
- Request/response/event schema đã có ví dụ.
- Dependency đã hoàn tất hoặc có fixture/mock contract ổn định.
- Acceptance scenario và failure path được ghi.
- Chưa có quyết định kiến trúc mở làm thay đổi lớn kết quả.

## 6. Definition of Done

Một task chỉ được đánh dấu DONE khi:

- Code production, validation, error state và security boundary đúng scope.
- Unit/integration/UI test liên quan pass; không thay MongoDB integration bằng mock rồi báo pass.
- Lint, typecheck, build pass.
- OpenAPI/event contract và docs được cập nhật cùng code.
- Có evidence chạy được và hướng dẫn kiểm tra lại.
- Không commit secret, dữ liệu cá nhân thật hoặc trạng thái build/generated không cần thiết.

## 7. Điều kiện chuyển sang feature tiếp theo

- F01 → F02: map query ổn định và UI state hoàn chỉnh.
- F02 REST → realtime: snapshot semantics/freshness đã khóa; không realtime hóa dữ liệu chưa hiểu nghĩa.
- F02 → F03: venue availability event/reconnect đã chứng minh được.
- F03 → F04: không bắt buộc về kỹ thuật, nhưng làm sau ba core slice để tránh subscription lấn át giá trị chính.
- MVP → check-in/review: cần theo dõi tỷ lệ snapshot `FRESH/STALE/UNKNOWN`; check-in chỉ có ý nghĩa khi đóng được khoảng trống dữ liệu.

## 8. Các quyết định cần xác nhận trước production

- Nhà cung cấp tile/geocoding và điều khoản sử dụng; local/demo dùng adapter cấu hình được, không hardcode provider vào domain.
- Nguồn cập nhật availability thực tế: POS, chủ quán, sensor, check-in hay mô hình ước lượng.
- Ngưỡng `FRESH/STALE`, công thức crowd level và cách công bố confidence.
- Nhà cung cấp payment cho Premium; MVP không tự nhận tiền.
- Email delivery/verification và reset mật khẩu trước khi mở đăng ký công khai; demo dùng tài khoản seed/test.
- Chính sách lưu lịch sử vị trí, retention và quyền riêng tư.

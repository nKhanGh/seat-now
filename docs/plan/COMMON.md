# Quy chuẩn chung — SeatNow

Phiên bản 1.0 — 19/11/2026. Mọi feature plan kế thừa file này. Nếu code và tài liệu khác nhau, phải sửa một trong hai trong cùng thay đổi; không để convention tồn tại ở nhiều nơi.

## 1. Kiến trúc đích của MVP

```text
React/Vite
  ├─ REST /api/v1/* ───────────────┐
  └─ Socket.IO subscribe/events ───┤
                                   v
                         NestJS modular monolith
                         ├─ map / venues
                         ├─ availability
                         ├─ parking
                         ├─ users / subscription
                         ├─ realtime
                         └─ common technical layer
                                   │
                                   v
                         MongoDB + geospatial indexes
```

Map provider/geocoder là external adapter. Core domain chỉ biết tọa độ GeoJSON và normalized address; không để DTO của provider rò vào schema/API public.

### Module ownership

| Module | Sở hữu | Không sở hữu |
|---|---|---|
| `venues` | Venue identity/profile, category, location, hours, status | Latest availability, parking inventory |
| `map` | Read/query composition cho viewport/radius | Ghi venue hay snapshot |
| `availability` | Venue availability snapshot, latest projection, freshness policy, ingestion | Venue profile |
| `parking` | Parking facility, pricing rules, parking snapshot/latest projection | Seat/table availability |
| `live` | Public Socket.IO room lifecycle và event transport | Business rule tạo snapshot |
| `auth` | Credential hash, session, đăng ký/đăng nhập/đăng xuất, session guard | Subscription entitlement |
| `users` | User profile tối thiểu | Credential/session |
| `subscriptions` | Subscription state và entitlement resolution | Payment transaction ở MVP |

Module khác chỉ tham chiếu ID hoặc gọi public service/interface của owner. Không import Mongoose model xuyên module để query tắt.

## 2. Baseline công nghệ

Version cụ thể phải được pin tại lúc bootstrap sau khi chạy compatibility build; plan không dùng version “mới nhất”.

| Lớp | Lựa chọn |
|---|---|
| Runtime | Node.js LTS được pin, npm lockfile |
| Backend | NestJS, TypeScript strict, class-validator/class-transformer, Swagger |
| Persistence | MongoDB, Mongoose, GeoJSON `Point`, `2dsphere` |
| Realtime | Socket.IO server/client |
| Frontend | React, Vite, React Router, TanStack Query |
| Map | MapLibre GL qua adapter/config; tile/geocoding provider được cấu hình |
| Identity | First-party NestJS auth; Argon2id + opaque cookie session trong MongoDB |
| UI | CSS theo feature/app, có nhãn và trạng thái truy cập được; Tailwind chưa dùng |
| Client state | TanStack Query cho server state; URL cho filter; local state/Zustand chỉ cho UI state thật sự dùng chung |
| Test | Jest + MongoDB Docker integration, Vitest component rendering và kiểm tra browser thủ công; API/Playwright E2E còn ở M6 |
| Local | Docker Compose |

Redis chưa là dependency bắt buộc. Chỉ thêm khi cần multi-instance Socket.IO adapter, distributed rate limit/cache hoặc job queue có bằng chứng.

## 3. Cấu trúc repository

```text
seat-now/
  backend/
    src/
      main.ts
      app.module.ts
      common/
        config/ decorators/ filters/ guards/ interceptors/ types/
      venues/
        controllers/ dto/ schemas/ services/ tests/
      map/
        controllers/ dto/ services/ tests/
      availability/
        controllers/ dto/ enums/ schemas/ services/ tests/
      auth/
        controllers/ dto/ guards/ schemas/ services/ tests/
      parking/
        controllers/ dto/ enums/ schemas/ services/ tests/
      realtime/
        gateways/ events/ services/ tests/
      users/
      subscriptions/
    test/
  frontend/
    src/
      app/
        layouts/ navigation/ providers/
      features/
        map/ venues/ availability/ parking/ subscription/
      shared/
        components/ui/ lib/ types/
      assets/
    tests/
  contracts/
    openapi/
    events/
    examples/
  infra/
    compose.yaml
  docs/
    plan/ adr/ runbooks/
```

Chỉ tạo folder khi có file thật. Không dựng cây rỗng “cho đẹp”.

## 4. Backend conventions

### 4.1 Luồng phụ thuộc

`controller/gateway → service → Mongoose model/external adapter`.

- Controller bind/validate input, chọn HTTP status và gọi service; không chứa business rule hoặc query model trực tiếp.
- Service xử lý use case, invariant, authorization theo resource, mapping và orchestration.
- Schema định nghĩa persistence, indexes và constraints; không dùng schema document làm public DTO.
- DTO request/response tách riêng; không trả raw Mongoose document, `_id`, `__v` hoặc field nội bộ.
- Chỉ tạo repository abstraction khi có nhiều persistence implementation hoặc query phức tạp cần cô lập; không tạo generic CRUD repository/base service.
- Constructor injection; field `private readonly` khi phù hợp.
- Không `catch (Exception)` rồi trả success; lỗi lập trình không được đổi thành lỗi nghiệp vụ giả.

### 4.2 Naming và TypeScript

- File: `kebab-case` với suffix rõ (`venue.schema.ts`, `map-query.dto.ts`, `availability.service.ts`).
- Class/type: `PascalCase`; function/property: `camelCase`; constant/event map: `UPPER_SNAKE_CASE` hoặc object `as const` thống nhất trong module.
- MongoDB field và JSON field dùng `camelCase`.
- Enum value public dùng `UPPER_SNAKE_CASE` và được version qua contract.
- Bật `strictNullChecks`, `noImplicitAny`, `noFallthroughCasesInSwitch`, casing check; không dùng `any` trong code mới. `unknown` phải được narrow.
- Thời gian truyền qua API là ISO-8601 UTC; lưu `Date` trong MongoDB. Không lưu local timezone string.
- Distance API dùng mét; tiền dùng integer minor unit + currency, không dùng float.

### 4.3 Validation và config

- Global `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- Trim string ở boundary; giới hạn length, radius, page size, polygon/viewport.
- Environment config được parse/validate khi startup; thiếu secret/URI thì fail fast.
- CORS allowlist từ config, không hardcode wildcard với credentials.
- `helmet`, compression, request ID và structured log bật ở app bootstrap.

### 4.4 HTTP contract

Prefix: `/api/v1`.

Success hiện tại:

```json
{
  "data": {},
  "meta": { "nextCursor": null }
}
```

Error validation hiện tại:

```json
{
  "statusCode": 400,
  "code": "MAP_INVALID_RADIUS",
  "message": ["radiusM must be between 100 and 20000"]
}
```

- HTTP status phản ánh kết quả; không trả mọi lỗi bằng 200.
- Client phân nhánh bằng `code`, không parse message.
- `404` không tiết lộ resource riêng tư có tồn tại.
- List lớn dùng cursor ổn định. Map viewport có hard limit số marker và trả `meta.truncated`/cluster strategy rõ ràng.
- OpenAPI tĩnh tại `contracts/openapi/seatnow.json` phải được cập nhật cùng DTO/API. Swagger tự sinh và contract gate còn ở M6.
- Mutation nhận `Idempotency-Key` khi có khả năng provider gửi lại, đặc biệt ingestion.

### 4.5 MongoDB conventions

- GeoJSON luôn theo thứ tự `[longitude, latitude]`.
- Tạo index bằng bootstrap/migration script có version; không dựa vào auto-index ở production.
- Mọi list/query phải có sort ổn định với tie-break `_id`.
- Không tạo compound index cho mọi tổ hợp filter. Bắt đầu từ query shape đo được, dùng `explain()` trước khi thêm.
- Snapshot là immutable. Latest projection có thể upsert bằng điều kiện `incoming.version > current.version` hoặc `capturedAt` mới hơn.
- Ingestion lưu `source`, `sourceRecordId`/idempotency key, `capturedAt`, `receivedAt`, `expiresAt`, `confidence`, `version`.
- Dedup snapshot bằng unique compound index `{ source, sourceRecordId }`; không giả định ID của hai provider khác nhau cùng namespace.
- TTL chỉ dùng cho history đã có retention được duyệt; không TTL latest projection hoặc dữ liệu audit cần giữ.
- Transaction chỉ dùng khi invariant thật sự qua nhiều document và MongoDB chạy replica set; không dùng transaction để che data model chưa rõ.

## 5. Dữ liệu cốt lõi

### 5.1 Venue

```text
Venue
  id, name, slug, status
  category, cuisineTypes[], priceTier, ratingSummary
  location: { type: Point, coordinates: [lng, lat] }
  address, operatingHours, timezone
  mediaSummary, createdAt, updatedAt
```

Indexes ban đầu:

- `location: 2dsphere`
- unique `slug`
- query index theo `status/category/priceTier` chỉ sau khi xác nhận shape thực tế

### 5.2 VenueAvailabilitySnapshot

```text
venueId
tables: { total, available } | null
seats: { total, available } | null
occupancyRate | null
crowdLevel: QUIET | MODERATE | BUSY | FULL | UNKNOWN
estimatedWaitMinutes | null
acceptingGuests: boolean | null
source: BUSINESS_MANUAL | POS | SENSOR | COMMUNITY_ESTIMATE | DEMO
sourceRecordId, confidence, capturedAt, receivedAt, expiresAt, version
```

`availability_latest` là read projection theo `venueId`; map query không lookup toàn bộ history. API tính `freshness: FRESH | STALE | UNKNOWN`, không lưu một cờ dễ lỗi thời.

`venue_map_views` là projection dành riêng cho F01, denormalize field filter/sort từ Venue và latest availability: `venueId`, public profile summary, `location`, category/cuisine/price/rating, availability summary/version/expiresAt và `projectedAt`. Map API query trực tiếp collection này để filter/paginate đúng; không lấy một page venue rồi mới loại theo availability. Projection phải có rebuild command từ owner collections và metric độ trễ.

### 5.3 ParkingFacility và snapshot

```text
ParkingFacility
  id, name, status, relation: VENUE | PARTNER | PUBLIC
  venueIds[]
  location: GeoJSON Point
  address, entranceNote, vehicleTypes[]
  totalSpaces | null
  pricingRules[], openingHours, timezone

ParkingAvailabilitySnapshot
  parkingFacilityId, availableSpaces | null, occupiedSpaces | null
  source, sourceRecordId, confidence
  capturedAt, receivedAt, expiresAt, version
```

Trong MVP, `parking_facilities` chứa public profile và latest snapshot denormalized để query geospatial + filter `hasAvailability` trước phân trang. Read projection có thể trễ và mang version/timestamp; `rebuild:projections` phục hồi từ snapshots.

Khoảng cách thẳng dùng geospatial query; walking distance chỉ được gọi như vậy khi có routing provider. Nếu chưa có provider, UI ghi “cách khoảng X m” thay vì “đi bộ X phút”.

### 5.4 Subscription

```text
UserSubscription
  userId
  plan: FREE | PREMIUM
  status: ACTIVE | PAST_DUE | CANCELED | EXPIRED
  provider, providerCustomerId, providerSubscriptionId
  currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd
  version, createdAt, updatedAt
```

MVP không cho client ghi trực tiếp `plan`. Entitlement được resolve server-side từ plan/status/config; subscription webhook/payment chỉ thêm ở release có payment provider.

## 6. Realtime contract

### 6.1 Room và event

- Client subscribe theo `venue:{id}` khi mở detail.
- Map subscribe theo vùng chuẩn hóa/geo cell hoặc tập venue đang hiển thị; không tạo room từ raw floating bounds vô hạn.
- Server events:
  - `venue.availability.updated.v1`
  - `parking.availability.updated.v1`
- Client events:
  - `map.subscribe.v1`, `map.unsubscribe.v1`
  - `venue.subscribe.v1`, `venue.unsubscribe.v1`

Event payload hiện tại:

```json
{
  "eventId": "uuid",
  "slug": "demo-cafe-nguyen-hue",
  "version": 12
}
```

- Client refetch REST sau event, không áp payload event thành availability; DB projection chặn version cũ.
- Event chỉ là tín hiệu/update nhỏ, không thay REST snapshot đầy đủ vô hạn.
- Sau reconnect: resubscribe rồi invalidate/refetch REST.
- Duplicate, missing và out-of-order là trạng thái bình thường cần test.
- Guest có thể subscribe dữ liệu public; ingestion/admin event không được public.

## 7. Frontend conventions

- Code theo feature như `document-hub`: `types.ts`, `services/`, `api/`, `hooks/`, `components/`, `pages/`, `index.ts` public exports.
- Component/page không gọi `fetch`/Axios trực tiếp. Service giữ HTTP call; `api/*Queries.ts` giữ query keys/hooks.
- TanStack Query là source of truth của server state; socket hook patch/invalidate đúng query key.
- Filter map nằm trong URL để reload/back/share giữ state. Viewport tạm thời có thể local state và debounce trước khi sync.
- Không lưu session token trong localStorage/sessionStorage. Browser gửi opaque session cookie HttpOnly tự động trên cùng origin. `AuthProvider` gọi `/api/v1/auth/me` khi app khởi động.
- Vite proxy `/api` và `/socket.io` về NestJS trong local; bản demo NestJS phục vụ React build cùng origin để browser không cần third-party cookies.
- Shared UI chỉ chứa primitive thật sự dùng lại; business component ở feature.
- Component phải có loading/empty/error/stale/disabled state và keyboard/focus behavior.
- Marker không chỉ dựa vào màu; crowd/freshness có text/icon/accessible label.
- Mobile ưu tiên bottom sheet + map; desktop split map/list. Không mount hàng trăm DOM marker/list rows cùng lúc.

Naming frontend:

- Component: `PascalCase.tsx`.
- Hook: `useThing.ts`.
- Service/query/utils: `camelCase` hoặc convention suffix hiện hữu, chọn một kiểu khi bootstrap và formatter enforce.
- Query key factory theo feature, ví dụ `venueQueryKeys.map(filters)`; không dùng string rời rạc.

## 8. Free/Premium và authorization

Ba feature F01–F03 là FREE. Quyền Premium tương lai được mô hình hóa:

| Entitlement | FREE | PREMIUM | MVP xử lý |
|---|---:|---:|---|
| `map.basic` | Có | Có | Có |
| `availability.read` | Có | Có | Có |
| `parking.read` | Có | Có | Có |
| `ads.hidden` | Không | Có | Model/UI preview, chưa có ad network |
| `booking.priority` | Không | Có | Planned |
| `parking.reserve` | Không | Có | Planned |
| `voucher.exclusive` | Không | Có | Planned |
| `recommendation.advanced` | Không | Có | Planned |

- Backend guard/policy là nguồn quyết định quyền.
- Frontend `useEntitlements` chỉ điều khiển trải nghiệm; không thay authorization.
- Không hardcode `plan === PREMIUM` ở nhiều nơi; gọi resolver theo entitlement key.
- Upgrade screen không tuyên bố capability đã chạy nếu backend chưa implement.

## 9. Security và privacy

- API public map chỉ trả field public; không trả thông tin liên hệ riêng, internal note hay source credential.
- Mật khẩu băm Argon2id với salt riêng; MongoDB chỉ lưu hash của session verifier, không lưu token thô. Cookie `HttpOnly`, `Secure` trên HTTPS, `SameSite=Lax`, `Path=/` và host-only. Session có server-side expiry/revocation.
- Mutation xác thực bằng cookie kiểm tra `Origin`/CSRF token theo deployment; SameSite không thay thế hoàn toàn CSRF defense. Login/register có rate limit, generic error cho credential sai và audit không chứa mật khẩu.
- Ingestion endpoint dùng service credential/role, rate limit và audit; không chung guard với public read.
- Validate lat/lng/radius để tránh query quá rộng và abuse.
- Không lưu lịch sử vị trí chính xác của người dùng trong MVP nếu không cần. Geolocation ở browser dùng cho query và được giải thích quyền.
- Log không chứa password, session token, raw provider payload nhạy cảm hoặc tọa độ lịch sử gắn với user.
- Secret chỉ qua environment/secret manager; `.env.example` chỉ có placeholder.
- Đăng ký public chỉ mở sau email verification và recovery flow; demo có thể dùng tài khoản seed/test. Xem [F00](features/F00-auth.md) và [ADR 002](../adr/002-first-party-auth.md).
- Dependency/security scan thuộc CI; upload/community content chưa mở trong scope nên không dựng pipeline giả.

## 10. Test strategy và quality gates

### Backend

- Unit: freshness policy, filter mapping, entitlement resolver, version/idempotency rule.
- Integration bằng MongoDB thật/Testcontainers: `2dsphere`, filter + sort + cursor, unique indexes, conditional update.
- API/Supertest: validation, envelope/error, public/private boundary, stale/unknown behavior.
- Auth API: register/login/logout/me, session expiry/revocation, cookie flags, CSRF/origin, rate limit và account enumeration behavior.
- Socket: handshake, room isolation, duplicate/out-of-order, reconnect strategy contract.

### Frontend

- Vitest/Testing Library: filter URL state, marker/list sync, stale badge, denied location, entitlement UI.
- MSW cho REST fixtures; socket adapter mock theo event contract, không mock internal hook implementation.
- Playwright: map discovery, live availability update, parking detail, reload/reconnect, mobile bottom sheet.
- Accessibility: keyboard, focus, label/contrast; map có list alternative.

### CI gate

```text
backend: format check → lint → typecheck/build → unit → integration
frontend: format check → lint → typecheck → unit → build → critical E2E
contracts: OpenAPI lint/breaking-change check + event schema examples
```

Không báo PASS nếu test cần Docker/provider mà chưa chạy; ghi rõ NOT RUN và lý do.

## 11. Mục tiêu đo ban đầu

Đây là budget để đo, không phải cam kết production trước load test:

- Map API p95 dưới 500 ms trên staging dataset mục tiêu và radius cho phép.
- Realtime update từ accepted ingestion đến connected client p95 dưới 2 giây trong staging.
- Không quá một request map đang active cho mỗi client; request cũ bị cancel khi viewport đổi.
- Event duplicate/out-of-order không làm projection hoặc UI lùi version.
- UI luôn phân biệt `FRESH`, `STALE`, `UNKNOWN`.

Nếu không đạt, lưu query plan/metrics trước khi thêm cache, index hoặc tách service.

## 12. Workflow thay đổi

1. Chọn một use case nhỏ và acceptance scenario.
2. Cập nhật contract/example trước hoặc cùng code.
3. Làm backend/frontend độc lập trên fixture contract nếu cần.
4. Integration thật với MongoDB/socket.
5. Chạy quality gate và lưu evidence.
6. Cập nhật trạng thái plan; file tồn tại không đồng nghĩa feature DONE.

Mọi thay đổi về stack, envelope, naming, security, test gate hoặc entitlement sửa ở `COMMON.md`/ADR. Nghiệp vụ riêng sửa ở feature file tương ứng.

# F03 — Thông tin bãi đỗ xe

Ưu tiên: **P2**. Trạng thái: **MVP demo chạy được — geospatial + filter + cursor + availability + Socket.IO + UI; chưa có nguồn bãi xe thật**.

[← Lộ trình](../README.md) · [Quy chuẩn chung](../COMMON.md) · [F01 Map](F01-realtime-map.md)

## 1. Mục tiêu và phạm vi

Người dùng xem bãi của địa điểm hoặc bãi công cộng/đối tác gần đó, gồm khoảng cách, loại xe, giờ hoạt động, cách tính giá và tình trạng chỗ trống gần nhất.

Trong scope:

- query parking quanh venue hoặc tọa độ;
- phân biệt `VENUE`, `PARTNER`, `PUBLIC`;
- geospatial distance;
- pricing summary có currency/unit;
- latest availability + freshness/confidence;
- realtime update;
- entrance note và vehicle types.

Ngoài scope: giữ chỗ, thanh toán, navigation turn-by-turn, xác minh pháp lý bãi, rating/review parking.

## 2. Use case

1. Từ venue detail, user chọn “Bãi đỗ xe gần đây”.
2. API trả bãi liên kết trực tiếp trước, sau đó bãi lân cận theo khoảng cách/chính sách ranking.
3. User lọc loại xe, đang mở, còn chỗ, miễn phí/trả phí.
4. Chọn bãi để xem entrance, pricing và timestamp availability.
5. Client subscribe parking room khi detail mở; reconnect sẽ refetch.

## 3. API logical contract

```http
GET /api/v1/venues/{slug}/parking
  ?vehicleType=CAR
  &open24h=true
  &hasAvailability=true
  &radiusM=1500
  &cursor=...

GET /api/v1/parking-facilities
  ?lat=10.7769&lng=106.7009&radiusM=1500
  &vehicleType=MOTORBIKE

GET /api/v1/parking-facilities/{slug}
GET /api/v1/parking-facilities/{slug}/availability  # kế hoạch, chưa có route riêng
```

Internal ingestion tương tự F02:

```http
POST /api/v1/internal/parking-facilities/{slug}/availability-snapshots
Authorization: Bearer <AVAILABILITY_INGEST_TOKEN>
```

List item:

```text
id, name, relation, location, distanceM
vehicleTypes, isOpenNow, entranceNote
pricing { kind, amountMinor, currency, unit, note }
availability { availableSpaces, totalSpaces, freshness,
  confidence, capturedAt }
```

Hiện tại client nhận `parking.availability.updated.v1` qua namespace `/live` sau khi `watch` `parkingSlugs[]`, rồi refetch REST. `isOpenNow` chỉ là `true` với bãi khai báo mở 24 giờ; nếu không có giờ mở cửa đáng tin thì trả `null`.

## 4. Quy tắc dữ liệu

- Facility có location riêng; không mặc định dùng tọa độ venue.
- `venueSlugs[]` thể hiện liên kết, không có nghĩa bãi chỉ phục vụ các venue đó.
- `availableSpaces=null` là unknown; khác `0` là full.
- `totalSpaces` profile và snapshot phải có quy tắc owner. Nếu snapshot gửi total mới, service validate/cập nhật theo contract, không âm thầm đổi profile.
- Pricing không chỉ là một số: `FREE`, `FLAT`, `HOURLY`, `TIERED`, `UNKNOWN`; amount dùng minor unit/currency.
- Nếu chỉ có khoảng cách đường chim bay, label là “cách khoảng”; không gọi là walking distance/time.
- `hasAvailability=true` chỉ nhận `FRESH` và available > 0 theo policy đã khóa.
- Ranking không cho bãi trả tiền tự leo top nếu chưa có Sponsored feature/label.

Indexes ban đầu: `location: 2dsphere`, `venueIds`, status; snapshot theo facility/version/idempotency như F02.

Query có filter availability chạy trực tiếp trên `parking_facilities`, nơi lưu public profile và latest snapshot denormalized, trước khi sort/cursor/limit. Không query một page rồi mới bỏ bãi stale/full ở application memory. Projection có version, `expiresAt` và command rebuild.

## 5. UI và state

- Venue detail có preview 1–3 bãi gần nhất và link xem tất cả.
- Desktop: map pins khác hình với venue + side list. Mobile: bottom sheet.
- Badge cho relation, vehicle types, open/closed, price, fresh/stale/unknown.
- Parking FULL không làm venue FULL và ngược lại.
- Empty state phân biệt “không có bãi trong bán kính” và “có bãi nhưng chưa có availability”.
- Entrance note phải được sanitize; URL/navigation link chỉ tạo từ tọa độ an toàn.

## 6. Failure paths

- Venue không có parking trực tiếp: fallback bãi lân cận nếu user cho phép radius.
- Pricing thiếu: hiển thị “Chưa có thông tin giá”, không suy ra miễn phí.
- Availability stale: vẫn hiển thị facility nhưng không thỏa filter “còn chỗ hiện tại”.
- Provider routing lỗi: giữ geospatial distance và nói rõ loại khoảng cách.
- Event out-of-order/duplicate: bỏ theo version; reconnect refetch.
- Facility inactive/deleted: không xuất hiện public, event cũ không làm sống lại.

## 7. Nghiệm thu

- Given venue có bãi riêng và bãi công cộng gần đó, then relation được hiển thị đúng và sort ổn định.
- Given `availableSpaces=null`, then UI nói unknown; given `0`, UI nói hết chỗ.
- Given parking snapshot stale, then filter `hasAvailability=true` không nhận bãi đó.
- Given chỉ có straight-line distance, then UI không hiển thị thời gian đi bộ giả.
- Given giá theo giờ, then API/UI luôn có amount minor, currency, unit.
- Given realtime event version thấp hơn cache, then UI không lùi số chỗ.

## 8. Công việc và evidence

Task registry: T10, T11, T14, T15 trong [lộ trình](../README.md#4-task-registry).

Evidence DONE gồm geospatial integration test, pricing mapping tests, stale/unknown UI, OpenAPI/event example và E2E từ venue → parking detail → realtime update.


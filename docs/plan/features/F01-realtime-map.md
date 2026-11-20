# F01 — Bản đồ địa điểm thời gian thực

Ưu tiên: **P1**. Trạng thái: **MVP demo chạy được — geospatial API, map/list, filter, cursor, detail và realtime đã có; nguồn availability thật và E2E automation chưa có**.

[← Lộ trình](../README.md) · [Quy chuẩn chung](../COMMON.md) · [F02 Availability](F02-seat-availability.md)

## 1. Mục tiêu và phạm vi

Guest hoặc user đăng nhập có thể tìm địa điểm quanh vị trí hiện tại hoặc một tâm bản đồ, xem kết quả đồng bộ giữa marker và danh sách, rồi lọc theo:

- khoảng cách/radius;
- loại địa điểm/món;
- mức giá;
- đánh giá tối thiểu;
- mức độ đông;
- có chỗ trống đã được xác nhận/ước lượng.

F01 sở hữu trải nghiệm tìm kiếm/bản đồ. Số liệu availability lấy từ F02; khi F02 chưa hoàn tất, fixture phải tuân cùng DTO.

Chi tiết địa điểm hiển thị tối đa bốn gợi ý lân cận từ các địa điểm đã tải trên bản đồ, trong bán kính 2 km theo đường chim bay. Gợi ý được xếp theo khoảng cách, không dùng khẩu vị cá nhân hay dữ liệu AI; chọn một gợi ý sẽ mở chi tiết địa điểm đó.

Ô tìm theo tên/địa chỉ lọc tức thì danh sách đã tải ở client và lưu từ khóa trong URL. Sau 300 ms, `GET /map/search` tìm thêm trong toàn bộ projection địa điểm công khai bằng so khớp không phân biệt dấu/chữ hoa; mỗi lần trả tối đa 12 kết quả và cờ `truncated`. Chọn kết quả ngoài vùng sẽ đưa bản đồ tới tọa độ quán và bỏ các bộ lọc loại/giá/chỗ trống có thể che quán. Truy vấn regex phù hợp dataset demo; cần index tìm kiếm chuyên dụng trước khi tăng quy mô dữ liệu.

Ngoài scope: recommendation cá nhân hóa, review/community, favorite, sponsored ranking, route navigation và booking.

## 2. Màn hình và hành vi

Desktop:

```text
[Logo] [Search location/place________] [Plan/Profile]
[Category] [Distance] [Price] [Rating] [Crowd] [Available] [More]
┌──────────── Result list ────────────┬──────────── Map ────────────┐
│ Venue card + freshness             │ clustered/individual pins   │
│ Venue card + freshness             │ selected pin + small card   │
│ cursor/load more                   │ locate-me / zoom controls   │
└────────────────────────────────────┴──────────────────────────────┘
```

Mobile: map toàn màn hình, filter chips ở trên, result/detail trong bottom sheet. Danh sách là alternative bắt buộc cho accessibility, không chỉ có marker.

State bắt buộc:

- xin quyền vị trí, được cấp, bị từ chối và browser không hỗ trợ;
- loading/skeleton, empty, API error + retry, offline;
- selected venue, stale/unknown availability;
- quá nhiều kết quả: cluster hoặc yêu cầu zoom, không render vô hạn.

## 3. Luồng chính

1. App thử lấy geolocation sau hành động/giải thích phù hợp; nếu bị từ chối dùng tâm mặc định hoặc tìm địa chỉ.
2. Client chuẩn hóa viewport/radius và URL filters.
3. TanStack Query gọi map API; request cũ được cancel/debounce khi user kéo map liên tục.
4. API validate bounds/radius, chạy geospatial query + filter allowlist và trả marker summary.
5. Chọn marker sẽ chọn đúng card và mở preview; chọn card pan/highlight marker.
6. Mở venue detail mới subscribe room của venue; quay lại giữ viewport/filter.

## 4. API logical contract

```http
GET /api/v1/map/venues
  ?lat=10.7769
  &lng=106.7009
  &radiusM=3000
  &categories=RESTAURANT,CAFE
  &cuisines=VIETNAMESE
  &priceTiers=1,2
  &ratingGte=4
  &crowdLevels=QUIET,MODERATE
  &hasAvailability=true
  &cursor=...
  &limit=50

GET /api/v1/venues/{venueId}
```

Map item tối thiểu:

```text
id, name, slug, category, location, distanceM
priceTier, ratingSummary, thumbnailUrl
availabilitySummary { crowdLevel, tablesAvailable, seatsAvailable,
  estimatedWaitMinutes, freshness, confidence, capturedAt }
```

Rules:

- `lat [-90,90]`, `lng [-180,180]`; radius mặc định/cực đại do config.
- Sort mặc định theo distance rồi `_id`; sort/ranking khác phải có allowlist.
- `hasAvailability=true` chỉ nhận snapshot còn đủ điều kiện theo policy; không coi `UNKNOWN` là false positive.
- Query trực tiếp `venue_map_views`, một geospatial read projection đã denormalize public venue fields + latest availability. Không lấy một page venue rồi mới filter availability vì sẽ làm sai cursor/tổng kết quả.
- Projection mang availability version/expiry và có đường rebuild; venue detail vẫn đọc owner data.
- Response có `meta.nextCursor`, `meta.truncated`, `meta.queryCenter`.

## 5. Nhánh lỗi và phục hồi

- Vị trí bị từ chối: hiển thị search/tâm demo, không chặn app.
- Geocoder/tile lỗi: list + API result vẫn dùng được; thông báo map degraded.
- F02 down/không có snapshot: venue vẫn xuất hiện nếu filter availability không yêu cầu; trạng thái `UNKNOWN`.
- Socket down: giữ last REST result, hiển thị trạng thái kết nối và refetch theo focus/reconnect.
- Cursor/filter không hợp lệ: 400 stable error code, không silently bỏ filter.
- Venue đóng cửa vẫn có thể hiển thị nếu filter cho phép, với `isOpenNow=false`; không giả là FULL.

## 6. Nghiệm thu

- Given user từ chối location, when mở app, then vẫn tìm được quanh tâm mặc định/địa chỉ.
- Given venue ngoài radius, then API và UI không hiển thị.
- Given filters trong URL, when reload/back, then kết quả và controls tương đương.
- Given marker được chọn bằng keyboard/list, then venue detail có thể mở mà không cần thao tác pointer trên map.
- Given availability stale, then pin/card không hiển thị như “còn bàn realtime”.
- Given kéo map nhanh nhiều lần, then request cũ bị hủy/bỏ kết quả và UI không nhảy về viewport cũ.

## 7. Công việc liên quan

Task registry: T04, T05, T06, T08, T09, T14 trong [lộ trình](../README.md#4-task-registry).

Thứ tự lát cắt: venue seed/index → REST map query → list/map UI → availability projection → realtime subscription → E2E.

## 8. Evidence để chuyển DONE

- OpenAPI + example cho query/response/error.
- MongoDB integration test chứng minh `2dsphere`, filter và cursor.
- Screenshot/video desktop/mobile cho happy/empty/error/location-denied.
- Playwright critical flow và kết quả lint/typecheck/build.

Evidence hiện tại: MongoDB `2dsphere` integration test pass cho radius, cuisine, availability và cursor; API local trả địa điểm trong 3 km. Bản đồ OpenFreeMap, cụm ghim ở mức zoom thấp, ghim/logo riêng khi phóng gần, detail và bộ lọc đã được kiểm tra trực tiếp trên browser. Frontend có unit test cho stale/unknown. Chưa có Playwright automation hoặc nguồn availability thật.


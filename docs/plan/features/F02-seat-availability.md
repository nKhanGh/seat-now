# F02 — Tình trạng bàn/chỗ ngồi

Ưu tiên: **P1**. Trạng thái: **PLANNED**.

[← Lộ trình](../README.md) · [Quy chuẩn chung](../COMMON.md) · [F01 Map](F01-realtime-map.md)

## 1. Mục tiêu và định nghĩa đúng

Người dùng thấy số bàn/chỗ còn trống, mức độ đông và thời gian chờ dự kiến trước khi di chuyển. Mỗi giá trị phải đi kèm freshness/source/confidence phù hợp.

F02 không được tuyên bố “realtime” nếu chưa có nguồn cập nhật. MVP cung cấp:

- seed/simulator cho demo;
- internal ingestion contract đã bảo vệ để sau này nối chủ quán/POS/sensor;
- snapshot immutable + latest projection;
- Socket.IO push sau khi snapshot được chấp nhận.

Check-in cộng đồng và dashboard chủ quán chưa thuộc scope; `COMMUNITY_ESTIMATE` chỉ được dùng khi có thuật toán/nguồn thật ở release sau.

## 2. Quy tắc nghiệp vụ

- `available <= total`; giá trị âm bị từ chối.
- `tables` và `seats` có thể `null` độc lập. Không suy ra số bàn từ số ghế.
- `FULL` không đồng nghĩa địa điểm đóng cửa. `isOpenNow` thuộc venue hours; `acceptingGuests` thuộc snapshot.
- `occupancyRate` có thể tính server-side khi numerator/denominator đáng tin; công thức và rounding chỉ có một nơi.
- `estimatedWaitMinutes` là estimate, không biến thành cam kết đặt chỗ.
- Freshness tính tại thời điểm đọc:
  - `FRESH`: `now <= expiresAt` và snapshot hợp lệ;
  - `STALE`: có snapshot nhưng đã hết hạn;
  - `UNKNOWN`: chưa có snapshot usable.
- Snapshot đến trễ vẫn có thể lưu history nhưng không ghi đè latest nếu version/capturedAt cũ hơn.
- Duplicate `source + sourceRecordId` trả kết quả idempotent, không phát event lần hai.

## 3. Luồng ghi và đọc

```text
Provider/demo ingestion
  → authenticate + validate + rate limit
  → deduplicate/version check
  → insert immutable snapshot
  → conditional upsert latest projection
  → update venue_map_views với cùng accepted version
  → publish venue.availability.updated.v1
  → connected client patch/invalidate cache
  → reconnect luôn REST refetch
```

Không publish event nếu latest projection không đổi.

## 4. API và event

Public read:

```http
GET /api/v1/venues/{venueId}/availability
GET /api/v1/venues/{venueId}/availability/history?from=...&to=...  # không thuộc MVP public; giữ internal/admin nếu cần debug
```

Internal write:

```http
POST /api/v1/internal/venues/{venueId}/availability-snapshots
Idempotency-Key: provider-record-id
Authorization: service/operator credential
```

Payload tối thiểu:

```json
{
  "tables": { "total": 30, "available": 8 },
  "seats": { "total": 120, "available": 26 },
  "crowdLevel": "MODERATE",
  "estimatedWaitMinutes": 10,
  "acceptingGuests": true,
  "source": "DEMO",
  "sourceRecordId": "demo-venue-1-00012",
  "confidence": 0.95,
  "capturedAt": "2026-11-19T10:00:00.000Z",
  "expiresAt": "2026-11-19T10:05:00.000Z",
  "version": 12
}
```

Public response thêm `freshness`, `receivedAt` và không trả internal credential/raw payload.

Event `venue.availability.updated.v1` theo envelope ở COMMON, data chứa snapshot summary đã sanitize.

## 5. UI

- Card/map pin: crowd level + freshness; chỉ hiện con số nếu có.
- Venue detail: bàn còn trống, ghế còn trống, wait estimate, “cập nhật X phút trước”, nguồn ở mức user hiểu được.
- `STALE`: giảm emphasis, ghi “Dữ liệu cũ — cập nhật lần cuối…”.
- `UNKNOWN`: “Chưa có dữ liệu chỗ ngồi gần đây”, không hiện `0`.
- Realtime connection mất: badge nhỏ, không xóa last known; refetch khi reconnect/focus.
- Không dùng màu duy nhất để phân biệt quiet/busy/full.

## 6. Nhánh lỗi

- Venue không tồn tại/inactive: ingestion 404/409 theo rule, không tự tạo venue.
- Payload mâu thuẫn: 422 stable code, không tự clamp số liệu.
- Snapshot tương lai quá ngưỡng hoặc `expiresAt <= capturedAt`: từ chối.
- Duplicate: trả snapshot đã accepted; không duplicate history/event.
- Out-of-order: lưu history theo policy nhưng response ghi `latestUpdated=false`.
- Socket publish lỗi sau DB commit: REST vẫn đúng; log/metric và client polling/refetch phục hồi. Nếu `venue_map_views` update lỗi, reconciliation/rebuild sửa projection và metric phải báo độ trễ. Nếu production yêu cầu delivery bền vững, thêm outbox bằng ADR sau, không tuyên bố exactly-once.

## 7. Nghiệm thu

- Given snapshot version 12 rồi version 11, then latest vẫn là 12.
- Given cùng idempotency key gửi hai lần, then chỉ có một snapshot và tối đa một event accepted.
- Given snapshot hết hạn, then API trả `STALE`, UI không nói “còn 8 bàn realtime”.
- Given chưa có snapshot, then API/UI trả `UNKNOWN`, không trả available bằng 0.
- Given connected client đúng room, when accepted update, then UI đổi và giữ version mới qua refetch.
- Given client reconnect sau khi bỏ lỡ event, then REST refetch đưa về latest đúng.

## 8. Công việc và evidence

Task registry: T07, T08, T09, T14, T15 trong [lộ trình](../README.md#4-task-registry).

Evidence DONE gồm schema/index, unit freshness/version, MongoDB integration idempotency, socket room test, OpenAPI/event example và E2E update/reconnect.


# F04 — Gói Free/Premium dành cho người dùng

Ưu tiên: **P2 foundation**. Trạng thái: **DEMO — resolver, API, guard, trang gói, ưu tiên đặt bàn, bản đồ không quảng cáo, gợi ý theo quy tắc, voucher demo và yêu cầu giữ xe tại bãi của quán. Chưa có thanh toán hay tích hợp dịch vụ thật**.

[← Lộ trình](../README.md) · [Quy chuẩn chung](../COMMON.md)

## 1. Phạm vi

SeatNow trước mắt chỉ phân gói phía người dùng. F04 tạo nền tảng subscription/entitlement đủ sạch để các feature sau dùng, nhưng không giả lập payment hay đánh dấu capability chưa có là đã hoạt động.

MVP F04:

- plan `FREE`/`PREMIUM`;
- subscription status state machine;
- entitlement resolver server-side;
- API `me` cho subscription/entitlements;
- màn hình so sánh gói và trạng thái hiện tại;
- guard/decorator/policy reusable;
- seed/test account để demo, không client tự nâng plan.

Ngoài scope:

- checkout/payment/webhook thực;
- giữ xe tại bãi công cộng/đối tác độc lập;
- voucher áp dụng ngoài đời;
- mô hình AI bên ngoài;
- ad network.

## 2. Ma trận gói

| Capability | Free | Premium | Trạng thái release này |
|---|---:|---:|---|
| Bản đồ realtime + filter cơ bản | Có | Có | Implement qua F01 |
| Xem chỗ ngồi/wait time | Có | Có | Implement qua F02 |
| Xem bãi xe | Có | Có | Implement qua F03 |
| Check-in/review/favorite/contribute | Có | Có | F05 demo |
| Gửi yêu cầu đặt bàn tại quán đối tác | Có | Có | F07 demo, chờ chủ quán xác nhận |
| Không quảng cáo | Không | Có | Bản đồ bỏ thứ tự tài trợ, nhãn ghim và nội dung quảng cáo; server kiểm tra entitlement |
| Ưu tiên hàng chờ yêu cầu đặt bàn | Không | Có | F07 demo, không bảo đảm có bàn |
| Yêu cầu giữ xe tại bãi của quán | Không | Có | Demo, chủ quán xác nhận và đối chiếu chỗ trống |
| Voucher độc quyền | Không | Có | Demo, admin tạo, người dùng nhận, chủ quán xác nhận mã dùng một lần |
| Gợi ý theo sở thích | Không | Có | Demo xếp hạng theo quy tắc; chưa có mô hình AI |

UI ghi rõ tính chất demo; không dùng CTA thanh toán thật hoặc khẳng định có dữ liệu bãi xe ngoài đời.

## 3. State machine

```text
FREE (không có subscription record active)
  → ACTIVE PREMIUM
  → PAST_DUE       (grace policy cần quyết định)
  → CANCELED       (có thể còn quyền đến currentPeriodEnd)
  → EXPIRED        (quay về FREE entitlements)
```

- Plan hiệu lực được resolve từ status + period + server time, không tin field UI.
- `cancelAtPeriodEnd=true` vẫn có quyền đến hết kỳ nếu status active và period hợp lệ.
- Webhook/payment tương lai phải idempotent, verify signature và chống event out-of-order.
- Admin có thể cấp/thu hồi Premium demo cho tài khoản người dùng qua `/admin`; script fixture chỉ bật trong local/test.

## 4. API logical contract

```http
GET /api/v1/me/subscription
GET /api/v1/me/entitlements
```

Response entitlement:

```json
{
  "data": {
    "plan": "FREE",
    "entitlements": {
      "map.basic": true,
      "availability.read": true,
      "parking.read": true,
      "ads.hidden": false,
      "booking.priority": false,
      "parking.reserve": false,
      "voucher.exclusive": false,
      "recommendation.advanced": false
    },
    "evaluatedAt": "2026-11-19T10:00:00.000Z"
  }
}
```

Future mutation/payment API không được thiết kế giả trước khi chọn provider. Internal local seed không đưa vào public production route.

`backend/src/seed-premium.ts` vẫn là CLI fixture local/test theo `SEED_PREMIUM_EMAIL`, bị khóa trong production. Admin có thể cấp/thu hồi gói demo qua giao diện; không có cổng thanh toán. Các API Premium mới kiểm tra entitlement phía server: `GET /me/recommendations`, `GET/POST /premium/vouchers`, `POST /venues/:slug/parking/:facilitySlug/reservations`. Chủ quán xác nhận yêu cầu giữ xe và mã voucher qua API riêng.

## 5. Backend/frontend convention

- `EntitlementService.can(userId, entitlement)` là nguồn chung.
- Guard/decorator dùng entitlement key, không dùng `PremiumGuard` cho mọi use case.
- Entitlement key là allowlist typed constant; thay đổi cần contract test.
- Frontend có `subscriptionService`, query keys và `useEntitlements`; component không tự đọc raw plan để quyết định quyền nhạy cảm.
- Backend vẫn authorize khi feature Premium được thêm; hidden button không phải security.
- Cache entitlement nếu cần phải có TTL/invalidation theo subscription version; MVP ưu tiên correctness.

## 6. Failure paths

- User chưa đăng nhập: `me` trả 401; các quyền public F01–F03 vẫn dùng được qua public endpoint.
- Không có subscription record: resolve FREE, không 500.
- Record hỏng/status lạ: fail safe về quyền FREE và tạo log/metric; không tự cấp Premium.
- Clock/period boundary: test bằng injected clock, không gọi `new Date()` rải rác.
- Subscription service tạm lỗi khi đọc feature public: public map/availability/parking không bị chặn.

## 7. Nghiệm thu

- Given user không có record, then entitlements đúng FREE.
- Given active Premium còn hạn, then Premium entitlements true.
- Given expired/past end, then Premium entitlement false.
- Given client sửa response/local state, then protected backend endpoint vẫn từ chối.
- Given user chưa login, then vẫn dùng được ba core feature public.
- Upgrade page phân biệt capability đang có và “Sắp ra mắt”.

## 8. Công việc và evidence

Task registry: T12, T13, T14 trong [lộ trình](../README.md#4-task-registry).

Evidence DONE gồm state-machine unit tests với fixed clock, API auth tests, entitlement guard test, subscription page states và contract examples. Payment không phải điều kiện DONE của foundation này.

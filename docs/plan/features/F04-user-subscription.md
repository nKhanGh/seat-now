# F04 — Gói Free/Premium dành cho người dùng

Ưu tiên: **P2 foundation; Premium capabilities PLANNED**. Trạng thái: **PARTIAL — resolver, API, guard và trang gói đã chạy; payment/capabilities chưa triển khai**.

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
- đặt bàn ưu tiên;
- giữ chỗ xe;
- voucher;
- AI nâng cao;
- ad network.

## 2. Ma trận gói

| Capability | Free | Premium | Trạng thái release này |
|---|---:|---:|---|
| Bản đồ realtime + filter cơ bản | Có | Có | Implement qua F01 |
| Xem chỗ ngồi/wait time | Có | Có | Implement qua F02 |
| Xem bãi xe | Có | Có | Implement qua F03 |
| Check-in/review/favorite/contribute | Có | Có | Later core |
| Không quảng cáo | Không | Có | Entitlement/UI preview; chưa có ads |
| Đặt bàn ưu tiên | Không | Có | Later |
| Giữ chỗ xe | Không | Có | Later |
| Voucher độc quyền | Không | Có | Later |
| AI gợi ý nâng cao | Không | Có | Later |

UI phải dùng nhãn “Sắp ra mắt” cho capability Later, không dùng CTA thanh toán thật.

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
- MVP seed/admin fixture chỉ bật trong local/test profile.

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

Hiện tại `backend/src/seed-premium.ts` là CLI fixture local/test theo `SEED_PREMIUM_EMAIL`, bị khóa trong production. Trang `/plans` không có nút thanh toán hoặc nâng cấp giả.

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

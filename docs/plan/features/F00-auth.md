# F00 — Đăng nhập và phiên người dùng

Ưu tiên: **P0 cho gói người dùng**. Trạng thái: **MVP demo chạy được — backend register/login/me/logout, React form và MongoDB integration test đã có; public-launch flow chưa xong**.

[← Lộ trình](../README.md) · [Quy chuẩn chung](../COMMON.md) · [ADR 002](../../adr/002-first-party-auth.md)

## 1. Phạm vi

SeatNow tự triển khai đăng ký, đăng nhập, đọc tài khoản hiện tại và đăng xuất bằng NestJS + MongoDB. Guest vẫn xem map, chỗ ngồi và parking. Đăng nhập cần thiết cho `/me/subscription`, entitlement và các tính năng cá nhân về sau.

Lát cắt demo dùng tài khoản seed/test hoặc đăng ký với chính sách rõ là chưa xác minh email. Trước public launch cần email verification, reset password, chống abuse và quan sát vận hành. Không tuyên bố đã sẵn sàng nhận tài khoản người dùng thật khi các flow đó chưa có.

## 2. Data model

```text
User
  id, emailNormalized (unique), passwordHash (Argon2id)
  displayName, status: ACTIVE | DISABLED
  emailVerifiedAt | null, createdAt, updatedAt

Session
  id/selector (unique), userId
  verifierHash, expiresAt, revokedAt | null
  createdAt, updatedAt
```

- Session cookie chứa JWT ký HS256; database lưu hash JWT và mã phiên `sid` để có thể thu hồi ngay. So sánh hash bằng constant-time comparison.
- `emailNormalized` unique ở MongoDB; DTO chỉ nhận email/displayName/password, không cho client đặt role, plan hay `emailVerifiedAt`.
- Index cho session selector và userId; TTL cleanup theo `expiresAt` chỉ là dọn rác, guard vẫn tự kiểm tra thời hạn.
- Argon2id parameters được benchmark trên máy deploy thực tế; không dùng SHA-256/bcrypt mặc định chỉ vì dễ code.

## 3. API contract

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

Request register: `{ email, password, displayName }`. Giao diện yêu cầu xác nhận mật khẩu trước khi gửi. Login: `{ email, password }`. Thành công trả public user DTO, server set JWT cookie. `/me` trả `{ id, email, displayName, emailVerified }`; chưa đăng nhập trả 401. Logout revoke session server-side, clear cookie và trả 204.

Liên kết đăng nhập/đăng ký trong app giữ đường dẫn nội bộ hiện tại bằng router state. Sau khi xác thực, người dùng quay lại màn hình và quán đã chọn; client từ chối đích ngoài origin hoặc quay vòng vào trang auth. Luồng này đã được kiểm tra trên browser local bằng tài khoản thử rồi dọn tài khoản đó.

Email trùng và credential sai dùng response an toàn, không lộ password hash hay chi tiết nội bộ. Nếu bật public registration có email verification, response đăng ký không tiết lộ email đã tồn tại; demo seed flow có thể trả lỗi email trùng rõ cho nhóm phát triển nhưng phải thay trước public launch.

## 4. Cookie, CSRF và realtime

- Production HTTPS: cookie host-only với `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`; `__Host-` prefix nếu cấu hình phù hợp. Local HTTP dùng cookie dev riêng, không được deploy cấu hình dev.
- React gọi API cùng origin, `credentials: include`. Vite dev proxy `/api` và `/socket.io` về NestJS. NestJS có thể serve React build trên Render.
- Các mutation dùng cookie kiểm tra `Origin` hợp lệ, áp dụng CSRF token cho action nhạy cảm. CORS không cấp wildcard credentials.
- Socket.IO xác thực session ở handshake nếu subscribe room riêng; room venue/map public không cần session. Không đưa session token vào query string hay client-side event payload.
- Session có thời hạn tuyệt đối; logout revoke ở database. Thay đổi mật khẩu/disable user về sau revoke mọi session của user.

## 5. UI và state

- Form đăng ký/đăng nhập có label, validate cơ bản, pending/error và keyboard/focus state.
- App khởi động gọi `/auth/me`; 401 hiển thị guest, lỗi mạng hiển thị trạng thái chưa xác định và cho retry.
- Sau login quay về route trước đó; logout clear query cache chứa dữ liệu cá nhân.
- Session hết hạn trong lúc xem app: API protected trả 401, UI chuyển guest và giữ map public đang mở.
- Không dùng localStorage/sessionStorage cho credential.

## 6. Nhánh lỗi

- Sai mật khẩu: generic credential error, rate limit theo IP/account và không log mật khẩu.
- Hai đăng ký cùng email: unique index chặn duplicate; map duplicate key thành domain error phù hợp.
- Cookie giả/đã revoke/hết hạn: 401, không tạo session mới.
- Logout lặp: an toàn, không hồi sinh session.
- MongoDB lỗi: đăng nhập thất bại rõ; không fallback sang in-memory auth ở production.
- Deploy frontend/API khác origin: cookie policy phải được thiết kế lại; plan deploy demo chọn cùng origin.

## 7. Nghiệm thu

- Given đăng ký hợp lệ, then database chỉ có `passwordHash`, không có raw password.
- Given login đúng, then cookie có flags production và `/me` trả public DTO.
- Given login sai nhiều lần, then rate limit chặn với status rõ.
- Given logout hoặc session hết hạn, then `/me` trả 401 kể cả cookie cũ còn được gửi.
- Given user disabled, then login và authenticated request bị từ chối.
- Given guest, then F01–F03 vẫn hoạt động, `/me/subscription` trả 401.
- Given refresh browser, then session vẫn hợp lệ cho tới server-side expiry.
- Given socket room riêng, then handshake không có session hợp lệ bị từ chối.

## 8. Công việc và evidence

Task T12 trong [registry](../README.md#4-task-registry). Chia thành schema/index → auth service → controller/guard → frontend forms/provider → socket integration → API/E2E tests. Chỉ chuyển DONE khi code, test và chạy local thực sự đạt; tài liệu này không phải implementation.

Evidence hiện tại: backend typecheck/build, unit và MongoDB integration tests, frontend build và kiểm tra browser thủ công đã chạy. Rate limit hiện là in-memory theo IP (phù hợp một Render instance demo), chưa có per-account policy.

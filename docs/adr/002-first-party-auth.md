# ADR 002 — SeatNow tự quản lý đăng nhập

- Trạng thái: Accepted for planning
- Ngày: 19/11/2026
- Thay thế phần authentication của [ADR 001](001-stack-and-architecture.md)

## Bối cảnh

Nhóm muốn tự viết chức năng đăng nhập bằng stack NestJS + MongoDB đã chọn. Dùng Clerk/Auth0 hoặc tự host Keycloak làm phức tạp deploy demo và tách trải nghiệm đăng nhập ra khỏi SeatNow.

## Quyết định

- NestJS `auth` module sở hữu đăng ký, đăng nhập, phiên, đăng xuất và `/me`.
- Mật khẩu băm bằng Argon2id với salt riêng; không lưu mật khẩu gốc, không dùng SHA-256 để băm mật khẩu.
- Theo yêu cầu nhóm, dùng JWT ký HS256 chứa `sub` và mã phiên `sid`, thời hạn 7 ngày. Browser chỉ nhận cookie `HttpOnly`, `Secure`, `SameSite=Lax` trên HTTPS; MongoDB chỉ lưu hash JWT, thời hạn và trạng thái thu hồi. Backend xác minh chữ ký, thuật toán, issuer, audience và phiên MongoDB trên mỗi request; logout thu hồi phiên ngay. `JWT_SECRET` phải có ít nhất 32 ký tự ở production.
- Frontend và API dùng **cùng origin** khi deploy demo: NestJS phục vụ React build tại Render. Nhờ vậy cookie không phụ thuộc third-party cookie giữa Cloudflare Pages và Render. Local dùng Vite proxy `/api` và `/socket.io`.
- Socket.IO kiểm tra cùng session cookie trong handshake; room public vẫn đọc được với guest, room cá nhân yêu cầu session.
- Trước khi mở đăng ký công khai, phải bổ sung xác minh email, quên/reset mật khẩu, rate limit có kiểm chứng và giám sát abuse. Demo nhóm có thể dùng tài khoản seed/test.

## Trade-off

Nhóm sở hữu bảo mật đăng nhập, khôi phục tài khoản và vận hành phiên. Kiến trúc này phù hợp MVP/demo và một Render Free service, nhưng phải hoàn tất các điều kiện public launch ở trên trước khi nhận người dùng thật.

## Nguồn bảo mật

- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

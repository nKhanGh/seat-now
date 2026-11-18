# ADR 001 — Stack và kiến trúc MVP

- Trạng thái: Superseded by [ADR 002](002-first-party-auth.md) for authentication; other decisions remain accepted
- Ngày: 19/11/2026

## Bối cảnh

SeatNow cần MongoDB, geospatial query, cập nhật availability gần thời gian thực và React. Repository mới chưa có code. Các project lân cận có hai convention mạnh: `document-hub` dùng NestJS/MongoDB/Socket.IO/React Vite; `e-commerce` dùng Spring/React nhưng thiên về PostgreSQL và microservices.

## Quyết định

1. Dùng **NestJS + TypeScript** cho backend MVP.
2. Dùng **React + Vite + TypeScript** cho frontend.
3. Dùng **MongoDB** với GeoJSON/`2dsphere`; lịch sử snapshot và latest projection tách nghĩa rõ ràng.
4. Dùng **Socket.IO** cho notification realtime; REST là nguồn đọc và phục hồi sau reconnect.
5. Bắt đầu bằng **modular monolith** trong monorepo, module theo feature.
6. Dùng entitlement resolver cho FREE/PREMIUM; không rải điều kiện plan trong controller/component.
7. Authentication decision superseded by ADR 002 after the team chose to implement login in SeatNow.

## Lý do

- Đây là đường ngắn nhất để follow convention đã chạy trong workspace mà không đổi database người dùng yêu cầu.
- Một ngôn ngữ TypeScript xuyên frontend/backend giúp team nhỏ chia sẻ contract và giảm context switching.
- Modular monolith giữ transaction/query đơn giản cho MVP. Tách microservice trước khi có traffic profile sẽ làm tăng chi phí deployment, tracing, event delivery và consistency.
- Socket event có thể mất hoặc trùng; REST refetch sau reconnect giúp correctness không phụ thuộc kết nối liên tục.

## Hệ quả

- Cần kỷ luật module boundary và không inject model của module khác tùy tiện.
- Khi chạy nhiều backend instance, Socket.IO cần Redis adapter hoặc một cơ chế pub/sub tương đương.
- Nếu availability ingestion tăng độc lập đáng kể, có thể tách `availability` thành service sau khi có đo đạc. Contract và event name phải giữ version.
- Map tile/geocoding nằm sau adapter cấu hình để có thể đổi provider.

## Khi nào xem xét lại

- P95 map query hoặc write throughput không đạt sau khi đã tối ưu index/read model.
- Availability ingestion cần scale/deploy độc lập.
- Team/production platform chuẩn hóa Spring bắt buộc.
- MongoDB không còn phù hợp với truy vấn/transaction/reporting đã quan sát thực tế.

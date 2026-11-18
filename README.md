# SeatNow

SeatNow là ứng dụng giúp người dùng tìm địa điểm và bãi đỗ xe gần đó, xem mức độ đông/vắng cùng số chỗ còn trống gần thời gian thực, rồi ra quyết định trước khi di chuyển.

Repository hiện đã có **đăng nhập và bản đồ địa điểm cơ bản**. Availability realtime và parking còn trong kế hoạch. Phạm vi MVP được khóa theo đúng thứ tự ưu tiên:

1. Bản đồ địa điểm thời gian thực và bộ lọc cơ bản.
2. Tình trạng bàn/chỗ ngồi và thời gian chờ dự kiến.
3. Bãi đỗ xe gần địa điểm và tình trạng chỗ trống.
4. Nền tảng gói Free/Premium dành cho người dùng; các quyền Premium ngoài ba chức năng trên được triển khai ở release sau.

## Quyết định kỹ thuật hiện tại

- Backend: Node.js + NestJS + TypeScript strict.
- Database: MongoDB, dùng GeoJSON và `2dsphere` index.
- Realtime: Socket.IO; REST luôn là đường phục hồi và nguồn đồng bộ lại.
- Frontend: React + Vite + TypeScript, React Router, TanStack Query, MapLibre GL.
- Kiến trúc: modular monolith theo feature để ra MVP nhanh, nhưng giữ boundary đủ rõ để tách service khi có dữ liệu tải thực tế.
- Local infrastructure: Docker Compose cho MongoDB; Redis chỉ thêm khi cần scale nhiều API instance hoặc rate limit phân tán.
- Đăng nhập: NestJS + MongoDB tự quản lý user/session; xem [ADR 002](docs/adr/002-first-party-auth.md). Dockerfile phục vụ React và API cùng origin để cookie hoạt động ổn định.

## Chạy lát cắt đăng nhập local

Yêu cầu: Node.js 20.19+, npm, Docker Desktop.

```powershell
docker compose -f infra/compose.yaml up -d
Copy-Item backend/.env.example backend/.env
cd backend
npm ci
npm run build
npm run seed:demo
npm run start:dev
```

Terminal thứ hai:

```powershell
cd frontend
npm ci
npm run dev
```

Mở `http://localhost:5173` để xem bản đồ demo, lọc địa điểm và đăng ký/đăng nhập. Backend ở `http://localhost:3000/api/v1/auth/*` và `/api/v1/map/venues`. Khi gọi POST bằng curl, gửi header `Origin: http://localhost:5173`; browser tự gửi header này. `seed:demo` chỉ chạy ở local/test và tạo 5 địa điểm hư cấu ở TP.HCM; số bàn mẫu hết hạn sau 10 phút và không phải số liệu trực tiếp.

Kiểm tra nhanh: `cd backend; npm test; npm run typecheck; npm run build`. Integration test cần MongoDB: đặt `MONGODB_TEST_URI=mongodb://127.0.0.1:27017/seatnow` rồi chạy `npm run test:integration`. Test tạo và xóa database tạm `seatnow_test_*`. Frontend: `cd frontend; npm run build`.

Dockerfile ở root build cả hai app và chạy cùng một origin. Khi deploy Render, đặt `MONGODB_URI` bằng MongoDB Atlas và `PUBLIC_ORIGIN` bằng URL HTTPS thực của service. Nếu dùng map style/tiles khác, đặt `VITE_MAP_STYLE_URL` lúc build frontend và `MAP_ASSET_ORIGINS` (danh sách origin phân cách dấu phẩy) cho Content Security Policy.

Lát cắt auth hiện mới là demo: chưa có xác minh email, khôi phục mật khẩu và integration test với MongoDB thật. Không mở đăng ký công khai cho người dùng thật trước khi hoàn thiện các flow đó.

Chi tiết lựa chọn stack và trade-off nằm tại [ADR 001](docs/adr/001-stack-and-architecture.md).

## Đọc tài liệu theo thứ tự

1. [Lộ trình triển khai](docs/plan/README.md)
2. [Quy chuẩn chung](docs/plan/COMMON.md)
3. [F00 — Đăng nhập và phiên](docs/plan/features/F00-auth.md)
4. [F01 — Bản đồ thời gian thực](docs/plan/features/F01-realtime-map.md)
5. [F02 — Tình trạng chỗ ngồi](docs/plan/features/F02-seat-availability.md)
6. [F03 — Bãi đỗ xe](docs/plan/features/F03-parking.md)
7. [F04 — Gói dịch vụ người dùng](docs/plan/features/F04-user-subscription.md)

## Nguồn convention đã đối chiếu

Plan này tham khảo trực tiếp các project lân cận:

- `document-hub`: NestJS module theo feature, DTO validation, Mongoose schema/index, response interceptor, exception filter, Swagger, Socket.IO và frontend React chia theo `features`.
- `e-commerce`: cách tổ chức `docs/plan/COMMON.md`, feature plan, task dependency, acceptance scenario, quality gate và triển khai theo vertical slice.
- `e-learning`: cách tách frontend/backend và tài liệu chạy local; không chọn Spring cho MVP vì MongoDB + realtime đã có convention NestJS gần yêu cầu hơn trong workspace.

Không sao chép nguyên xi kiến trúc microservices của project khác. SeatNow chưa có bằng chứng tải để trả chi phí vận hành đó.

## Nguyên tắc sản phẩm quan trọng

“Realtime” không có nghĩa mọi số liệu đều chính xác tuyệt đối. Mỗi trạng thái phải hiển thị nguồn, thời điểm cập nhật và độ tin cậy. Khi dữ liệu hết hạn, UI chuyển sang `STALE`/“chưa có dữ liệu mới”, không tiếp tục hiển thị như số liệu trực tiếp.

Ba tính năng MVP là quyền Free. Premium được mô hình hóa bằng entitlement ngay từ đầu để tránh rải `if (plan === ...)` khắp code, nhưng đặt bàn ưu tiên, giữ chỗ xe, voucher và AI nâng cao chưa thuộc MVP này.

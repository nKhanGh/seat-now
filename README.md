# SeatNow

SeatNow là ứng dụng giúp người dùng tìm địa điểm và bãi đỗ xe gần đó, xem mức độ đông/vắng cùng số chỗ còn trống gần thời gian thực, rồi ra quyết định trước khi di chuyển.

Repository hiện có **đăng nhập, bản đồ, tình trạng chỗ ngồi, bãi đỗ xe, gói người dùng, cộng đồng, quản lý chủ quán và yêu cầu đặt bàn**. Dữ liệu địa điểm/chỗ trống mặc định là mô phỏng; chưa có kết nối POS hay nguồn bãi xe thực. Phạm vi MVP được triển khai theo đúng thứ tự ưu tiên:

1. Bản đồ địa điểm thời gian thực và bộ lọc cơ bản.
2. Tình trạng bàn/chỗ ngồi và thời gian chờ dự kiến.
3. Bãi đỗ xe gần địa điểm và tình trạng chỗ trống.
4. Nền tảng gói Free/Premium dành cho người dùng; ưu tiên xử lý yêu cầu đặt bàn đã có ở bản demo, các quyền Premium khác thuộc release sau.

Sau MVP, nhóm cộng đồng có check-in gần quán, lưu quán, review kèm ảnh và báo cáo, theo dõi thành viên, chia sẻ địa điểm, đề xuất quán với ba lượt xác nhận và duyệt nội bộ. Nhóm chủ quán có yêu cầu nhận quản lý, hồ sơ/logo miễn phí và gói Premium demo gồm chỗ trống thủ công, dashboard, ảnh bìa, ưu đãi hẹn giờ và vị trí tài trợ. Kết nối dữ liệu thực và thanh toán vẫn thuộc release sau.

## Quyết định kỹ thuật hiện tại

- Backend: Node.js + NestJS + TypeScript strict.
- Database: MongoDB, dùng GeoJSON và `2dsphere` index.
- Realtime: Socket.IO; REST luôn là đường phục hồi và nguồn đồng bộ lại.
- Frontend: React + Vite + TypeScript, React Router, TanStack Query, MapLibre GL.
- Kiến trúc: modular monolith theo feature để ra MVP nhanh, nhưng giữ boundary đủ rõ để tách service khi có dữ liệu tải thực tế.
- Local infrastructure: Docker Compose cho MongoDB; Redis chỉ thêm khi cần scale nhiều API instance hoặc rate limit phân tán.
- Đăng nhập: NestJS + MongoDB tự quản lý user/session; xem [ADR 002](docs/adr/002-first-party-auth.md). Dockerfile phục vụ React và API cùng origin để cookie hoạt động ổn định.

## Chạy demo local

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

Mở `http://localhost:5173` để xem bản đồ, chọn địa điểm để xem bàn/ghế, bãi xe, check-in, review và chia sẻ. Sau đăng nhập có thể mở `/favorites`, `/following`, `/proposals`, `/business`, `/bookings` và `/plans`. Backend ở `http://localhost:3000/api/v1`. Khi gọi POST đăng nhập bằng curl, gửi header `Origin: http://localhost:5173`; browser tự gửi header này.

`seed:demo` chỉ chạy ở local/test, tạo 5 địa điểm và 4 bãi xe hư cấu tại TP.HCM. Snapshot mẫu hết hạn sau 10 phút; chạy lại `npm run seed:demo` trong `backend` để làm mới. Khi hết hạn, UI ghi **Dữ liệu cũ** và không coi số chỗ đó là còn trống hiện tại.

Public API chính:

- `GET /health` (kiểm tra API và MongoDB)
- `GET /map/venues?lat=10.7769&lng=106.7009&radiusM=3000`
- `GET /venues/:slug` (chi tiết địa điểm)
- `GET /venues/:slug/availability`
- `GET /venues/:slug/parking` hoặc `GET /parking-facilities?lat=...&lng=...`
- `GET /me/subscription` và `GET /me/entitlements` (cần đăng nhập)

Danh sách địa điểm và bãi xe đều có `meta.nextCursor` để tải tiếp. Contract REST ở [OpenAPI MVP](contracts/openapi/seatnow.json), [OpenAPI cộng đồng](contracts/openapi/community.json), [OpenAPI chủ quán](contracts/openapi/business.json) và [OpenAPI đặt bàn](contracts/openapi/booking.json); contract Socket.IO ở [live events](contracts/events/live.md). Quy trình chạy, kiểm tra, kiểm duyệt, backup/restore và dựng lại projection ở [runbook demo](docs/runbooks/local-demo.md).

Các POST nội bộ `/internal/venues/:slug/availability-snapshots` và `/internal/parking-facilities/:slug/availability-snapshots` cần `Authorization: Bearer <AVAILABILITY_INGEST_TOKEN>`. Chỉ cấu hình token trong môi trường chạy API; không đưa vào frontend. Snapshot mới được đẩy qua Socket.IO `/live`; client refetch REST khi kết nối lại và định kỳ 30 giây. Giao diện chủ quán đã có; POS connector và nguồn bãi xe thật chưa có.

Để thử trạng thái Premium mà không tạo luồng thanh toán giả, đăng ký tài khoản local rồi chạy trong `backend`:

```powershell
$env:SEED_PREMIUM_EMAIL='email-cua-tai-khoan-demo@example.com'
npm run seed:premium
```

Script này bị khóa trong `NODE_ENV=production`. Trang `/plans` phân biệt chức năng hiện có với chức năng **Sắp ra mắt**; chưa mở bán Premium.

Kiểm tra nhanh: tại thư mục gốc chạy `npm ci; npm run format:check; npm run lint`. Backend: `cd backend; npm test; npm run typecheck; npm run build`. Integration test cần MongoDB: đặt `MONGODB_TEST_URI=mongodb://127.0.0.1:27017/seatnow` rồi chạy `npm run test:integration`. Test tạo và xóa database tạm `seatnow_test_*`. Frontend: `cd frontend; npm test; npm run build`. CI tại `.github/workflows/ci.yml` chạy các bước này với MongoDB 8.0. Nếu projection bị ngắt giữa chừng, chạy `npm run rebuild:projections` trong `backend`.

Đặt bàn demo: chủ quán đã được duyệt quyền quản lý mở trang `/business` và bật nhận yêu cầu cho quán ăn/cà phê. Người dùng đăng nhập mở quán trên bản đồ, gửi yêu cầu và theo dõi tại `/bookings`; chủ quán xác nhận hoặc từ chối trong hàng chờ. Yêu cầu đang chờ chưa giữ bàn. [Chi tiết F07](docs/plan/features/F07-booking.md).

Dockerfile ở root build cả hai app và chạy cùng một origin. Khi deploy Render, đặt `MONGODB_URI` bằng MongoDB Atlas và `PUBLIC_ORIGIN` bằng URL HTTPS thực của service. Nếu dùng map style/tiles khác, đặt `VITE_MAP_STYLE_URL` lúc build frontend và `MAP_ASSET_ORIGINS` (danh sách origin phân cách dấu phẩy) cho Content Security Policy.

Lát cắt auth hiện mới là demo: chưa có xác minh email và khôi phục mật khẩu. Không mở đăng ký công khai cho người dùng thật trước khi hoàn thiện các flow đó. Realtime hiện chạy trên một API instance; nếu scale ngang cần adapter Socket.IO dùng chung và cơ chế phát sự kiện bền vững.

Chi tiết lựa chọn stack và trade-off nằm tại [ADR 001](docs/adr/001-stack-and-architecture.md).

## Đọc tài liệu theo thứ tự

1. [Lộ trình triển khai](docs/plan/README.md)
2. [Quy chuẩn chung](docs/plan/COMMON.md)
3. [F00 — Đăng nhập và phiên](docs/plan/features/F00-auth.md)
4. [F01 — Bản đồ thời gian thực](docs/plan/features/F01-realtime-map.md)
5. [F02 — Tình trạng chỗ ngồi](docs/plan/features/F02-seat-availability.md)
6. [F03 — Bãi đỗ xe](docs/plan/features/F03-parking.md)
7. [F04 — Gói dịch vụ người dùng](docs/plan/features/F04-user-subscription.md)
8. [F05 — Cộng đồng địa điểm](docs/plan/features/F05-community.md)
9. [F06 — Quản lý địa điểm cho chủ quán](docs/plan/features/F06-business.md)
10. [F07 — Yêu cầu đặt bàn](docs/plan/features/F07-booking.md)

## Nguồn convention đã đối chiếu

Plan này tham khảo trực tiếp các project lân cận:

- `document-hub`: NestJS module theo feature, DTO validation, Mongoose schema/index, response interceptor, exception filter, Swagger, Socket.IO và frontend React chia theo `features`.
- `e-commerce`: cách tổ chức `docs/plan/COMMON.md`, feature plan, task dependency, acceptance scenario, quality gate và triển khai theo vertical slice.
- `e-learning`: cách tách frontend/backend và tài liệu chạy local; không chọn Spring cho MVP vì MongoDB + realtime đã có convention NestJS gần yêu cầu hơn trong workspace.

Không sao chép nguyên xi kiến trúc microservices của project khác. SeatNow chưa có bằng chứng tải để trả chi phí vận hành đó.

## Nguyên tắc sản phẩm quan trọng

“Realtime” không có nghĩa mọi số liệu đều chính xác tuyệt đối. Mỗi trạng thái phải hiển thị nguồn, thời điểm cập nhật và độ tin cậy. Khi dữ liệu hết hạn, UI chuyển sang `STALE`/“chưa có dữ liệu mới”, không tiếp tục hiển thị như số liệu trực tiếp.

Ba tính năng MVP là quyền Free. Premium được mô hình hóa bằng entitlement phía backend. Quyền ưu tiên xử lý yêu cầu đặt bàn đã có trong F07 demo; giữ chỗ xe, voucher và AI nâng cao chưa triển khai.

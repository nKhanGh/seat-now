# SeatNow

[Hướng dẫn sử dụng chi tiết](docs/USER_GUIDE.md) · [Kiểm kê tính năng](docs/FEATURES.md) · [Cách chạy local](#chạy-demo-local)

SeatNow là ứng dụng giúp người dùng tìm địa điểm và bãi đỗ xe gần đó, xem mức độ đông/vắng cùng số chỗ còn trống gần thời gian thực, rồi ra quyết định trước khi di chuyển.

Repository hiện có **đăng nhập, bản đồ và tìm quán theo tên/địa chỉ, tình trạng chỗ ngồi, bãi đỗ xe, gói người dùng, cộng đồng, quản lý chủ quán và yêu cầu đặt bàn**. Dữ liệu địa điểm/chỗ trống mặc định là mô phỏng; chưa có kết nối POS hay nguồn bãi xe thực. Phạm vi MVP được triển khai theo đúng thứ tự ưu tiên:

1. Bản đồ địa điểm thời gian thực và bộ lọc cơ bản.
2. Tình trạng bàn/chỗ ngồi và thời gian chờ dự kiến.
3. Bãi đỗ xe gần địa điểm và tình trạng chỗ trống.
4. Gói Free/Premium demo dành cho người dùng: ưu tiên yêu cầu đặt bàn, ẩn quảng cáo, gợi ý theo sở thích, voucher mẫu và yêu cầu giữ xe tại bãi của quán.

Sau MVP, nhóm cộng đồng có check-in gần quán, lưu quán, review kèm ảnh và báo cáo, theo dõi thành viên, chia sẻ địa điểm, đề xuất quán với ba lượt xác nhận và trang admin xét duyệt. Nhóm chủ quán có yêu cầu nhận quản lý, hồ sơ/logo và mục tương tác khách hàng miễn phí; gói Premium demo gồm chỗ trống thủ công, dashboard, ảnh bìa, ưu đãi hẹn giờ và vị trí tài trợ. Kết nối dữ liệu thực và thanh toán vẫn thuộc release sau.

## Quyết định kỹ thuật hiện tại

- Backend: Node.js + NestJS + TypeScript strict.
- Database: MongoDB, dùng GeoJSON và `2dsphere` index.
- Realtime: Socket.IO; REST luôn là đường phục hồi và nguồn đồng bộ lại.
- Frontend: React + Vite + TypeScript, React Router, TanStack Query, MapLibre GL.
- Kiến trúc: modular monolith theo feature để ra MVP nhanh, nhưng giữ boundary đủ rõ để tách service khi có dữ liệu tải thực tế.
- Local infrastructure: Docker Compose cho MongoDB; Redis chỉ thêm khi cần scale nhiều API instance hoặc rate limit phân tán.
- Đăng nhập: NestJS cấp JWT trong cookie HttpOnly; MongoDB giữ phiên để thu hồi ngay khi đăng xuất. Xem [ADR 002](docs/adr/002-first-party-auth.md). Dockerfile phục vụ React và API cùng origin để cookie hoạt động ổn định.

## Chạy demo local

Yêu cầu: Node.js 20.19+, npm, Docker Desktop.

```powershell
docker compose -f infra/compose.yaml up -d
Copy-Item backend/.env.example backend/.env
# Đặt JWT_SECRET dài ít nhất 32 ký tự trong backend/.env và giữ cố định.
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

Mở `http://localhost:5173` để xem bản đồ, chọn địa điểm để xem bàn/ghế, bãi xe, check-in, review và chia sẻ. Chi tiết quán còn gợi ý tối đa bốn địa điểm trong bán kính 2 km, ưu tiên nhiều loại địa điểm rồi xếp theo khoảng cách đường chim bay; chạm vào gợi ý để chuyển quán. Sau đăng nhập có thể mở `/favorites`, `/following`, `/proposals`, `/business`, `/bookings` và `/plans`. Backend ở `http://localhost:3000/api/v1`. Khi gọi POST đăng nhập bằng curl, gửi header `Origin: http://localhost:5173`; browser tự gửi header này.

Để xét duyệt, tạo tài khoản admin một lần sau khi build backend. Đặt `ADMIN_EMAIL` và mật khẩu ngẫu nhiên dài ít nhất 20 ký tự vào `backend/.env.admin` (tệp này được Git bỏ qua), rồi chạy `npm run admin:create` trong `backend`. Đăng nhập bằng tài khoản đó và mở `/admin` hoặc chọn **Xét duyệt** trên thanh đầu trang. Tab **Chủ quán** hiện bằng chứng nhận quản lý; tab **Quán cộng đồng** hiện các đề xuất đủ ba lượt xác nhận. Kiểm tra rồi chọn **Duyệt** hoặc **Từ chối** và xác nhận. Tài khoản đăng ký trong app luôn là người dùng thường; script từ chối chuyển email đã tồn tại thành admin. Không đưa mật khẩu admin vào repository hay biến `VITE_*`.

`seed:demo` chỉ chạy ở local/test, tạo 100 địa điểm hư cấu với tên quán đa dạng (chủ yếu quán ăn/cà phê ở nhiều quận TP.HCM) và 4 bãi xe. Slug cố định nên chạy lại cập nhật tên và trạng thái mà không nhân đôi quán. Snapshot mẫu có hiệu lực 7 ngày để dễ thử bộ lọc **Còn bàn**; chạy lại `npm run seed:demo` trong `backend` để làm mới. Nguồn `DEMO` vẫn là số liệu mô phỏng, không dùng để quyết định di chuyển thật. Snapshot chủ quán và POS vẫn có thời hạn riêng.

Public API chính:

- `GET /health` (kiểm tra API và MongoDB)
- `GET /map/venues?lat=10.7769&lng=106.7009&radiusM=3000`
- `GET /map/search?q=ben%20thanh` (tìm quán công khai theo tên/địa chỉ, tối đa 12 kết quả)
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

Script này bị khóa trong `NODE_ENV=production`. Admin cũng có thể cấp/thu hồi Premium demo tại `/admin` → **Premium demo**, rồi tạo ưu đãi tại tab **Voucher**. Người dùng mở `/recommendations` để nhận gợi ý theo quy tắc, `/vouchers` để lấy mã, hoặc gửi yêu cầu giữ xe tại bãi của quán. Chủ quán cập nhật chỗ xe và xác nhận yêu cầu tại `/business` → **Giữ xe**. Trang `/plans` nêu rõ phạm vi demo; chưa mở bán Premium hoặc có mô hình AI.

Kiểm tra nhanh: tại thư mục gốc chạy `npm ci; npm run format:check; npm run lint`. Backend: `cd backend; npm test; npm run typecheck; npm run build`. Integration test cần MongoDB: đặt `MONGODB_TEST_URI=mongodb://127.0.0.1:27017/seatnow` rồi chạy `npm run test:integration`. Test tạo và xóa database tạm `seatnow_test_*`. Frontend: `cd frontend; npm test; npm run build`. CI tại `.github/workflows/ci.yml` chạy các bước này với MongoDB 8.0. Nếu projection bị ngắt giữa chừng, chạy `npm run rebuild:projections` trong `backend`.

Đặt bàn demo: chủ quán đã được duyệt quyền quản lý mở trang `/business` và bật nhận yêu cầu cho quán ăn/cà phê. Người dùng đăng nhập mở quán trên bản đồ, gửi yêu cầu và theo dõi tại `/bookings`; chủ quán xác nhận hoặc từ chối trong hàng chờ. Yêu cầu đang chờ chưa giữ bàn. [Chi tiết F07](docs/plan/features/F07-booking.md).

Dockerfile ở root build cả hai app và chạy cùng một origin. Khi deploy Render, đặt `MONGODB_URI` bằng MongoDB Atlas, `PUBLIC_ORIGIN` bằng URL HTTPS thực của service và `JWT_SECRET` dài ít nhất 32 ký tự. Nếu dùng map style/tiles khác, đặt `VITE_MAP_STYLE_URL` lúc build frontend và `MAP_ASSET_ORIGINS` (danh sách origin phân cách dấu phẩy) cho Content Security Policy.

Tài liệu để chia sẻ: [Hướng dẫn sử dụng theo 3 vai trò (PDF)](output/pdf/seatnow-role-guide.pdf), [Hướng dẫn sử dụng đầy đủ (PDF)](output/pdf/seatnow-user-guide.pdf) và [Hướng dẫn deploy (PDF)](output/pdf/seatnow-deploy-guide.pdf). Bản nguồn có thể cập nhật tại [ROLE_GUIDE.md](docs/ROLE_GUIDE.md), [USER_GUIDE.md](docs/USER_GUIDE.md) và [DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md); chạy `scripts/build_pdf_guides.py` bằng Python có ReportLab để xuất lại PDF.

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

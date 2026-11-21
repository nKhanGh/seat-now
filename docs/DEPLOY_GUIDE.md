# SeatNow - Hướng dẫn deploy bản demo

Cập nhật: 21/11/2026. Tài liệu này dành cho dự án học tập, triển khai React và NestJS trên **cùng một origin** bằng Dockerfile ở thư mục gốc, MongoDB Atlas làm cơ sở dữ liệu. Các bước giao diện của Render/Atlas có thể đổi theo thời gian; kiểm tra liên kết chính thức ở cuối tài liệu.

## 1. Trước khi bắt đầu

- Có repository SeatNow trên GitHub, tài khoản Render và tài khoản MongoDB Atlas.
- Đã chạy `npm run lint`, `npm run format:check`, `npm test` và `npm run build` ở các app tương ứng.
- Không commit `backend/.env`, `.env.admin`, mật khẩu, URI MongoDB hoặc token vận hành.
- Ứng dụng demo chưa có xác minh email/khôi phục mật khẩu. Chỉ dùng dữ liệu và tài khoản thử nghiệm; không công bố dữ liệu thật của quán hoặc khách.

### Kiểm tra Docker image ở máy local

Từ thư mục gốc, khởi động MongoDB local và build đúng image sẽ dùng để deploy:

```powershell
docker compose -f infra/compose.yaml up -d
docker build -t seatnow-local-check .
docker run --rm --network infra_default -p 127.0.0.1:3100:3000 -e NODE_ENV=development -e MONGODB_URI=mongodb://mongodb:27017/seatnow -e PUBLIC_ORIGIN=http://localhost:3100 -e JWT_SECRET=local-docker-smoke-test-secret-32-characters seatnow-local-check
```

Trong terminal thứ hai, mở `http://localhost:3100/api/v1/health` và `http://localhost:3100/`. Dừng container bằng **Ctrl+C**; `--rm` tự xóa container tạm. Lệnh này dùng `NODE_ENV=development` vì URL local là HTTP; bản deploy trên Render giữ `NODE_ENV=production` và dùng HTTPS.

## 2. Chuẩn bị MongoDB Atlas

1. Trong Atlas, tạo project và **Free cluster (M0)**. Chọn provider/region có hỗ trợ Free.
2. Tạo **Database User** với mật khẩu mạnh, lưu lại tên đăng nhập và mật khẩu ở nơi riêng.
3. Vào **Connect > Drivers**, sao chép URI `mongodb+srv://...`. Thay tên người dùng, mật khẩu và thêm database `seatnow` vào URI. Nếu mật khẩu có ký tự đặc biệt, mã hóa URL cho phần mật khẩu.
4. Atlas chỉ cho phép IP trong **IP Access List**. Sau khi tạo service Render, mở **Connect > Outbound** của service để lấy các dải IP đi ra rồi thêm các dải đó vào IP Access List của Atlas. Thêm IP máy bạn nếu muốn chạy script seed/admin từ máy local. Tránh mở `0.0.0.0/0` lâu dài.
5. Không đưa URI vào frontend hoặc biến `VITE_*`; chỉ đặt trong môi trường backend ở Render.

## 3. Tạo Web Service trên Render

1. Trong Render chọn **New > Web Service**, kết nối repository GitHub chứa SeatNow.
2. Chọn **Language: Docker**. Giữ root/build context ở thư mục gốc; Dockerfile path là `./Dockerfile`. Dockerfile đã build React, NestJS và phục vụ frontend từ backend, nên **không cần tạo static site riêng**. Chọn branch `develop` để thử tính năng mới, hoặc `main` sau khi merge PR.
3. Chọn plan **Free** cho demo nếu còn khả dụng trong tài khoản. Đặt tên service, ví dụ `seatnow-demo`. Render cấp URL HTTPS dạng `https://...onrender.com`.
4. Trong **Environment**, đặt các biến sau:

   Có thể sao chép [`render.env.example`](../render.env.example) thành `.env.render` ở thư mục gốc, điền các giá trị rồi dán nội dung vào **Add from .env** trên Render. File `.env.render` được Git bỏ qua. Chỉ dùng ba biến bắt buộc trong mẫu; Dockerfile đã đặt `NODE_ENV=production`, còn Render có thể cấp `PORT` khi chạy.

| Biến | Giá trị |
| --- | --- |
| `MONGODB_URI` | URI Atlas của database `seatnow`; giữ bí mật. |
| `JWT_SECRET` | Chuỗi ngẫu nhiên dài ít nhất 32 ký tự; giữ cố định qua các lần deploy. |
| `PUBLIC_ORIGIN` | URL HTTPS thực của service, **không có dấu `/` cuối**. |
| `PORT` | `10000` hoặc để Render cấp biến `PORT`; backend đọc biến này và bind `0.0.0.0`. |
| `NODE_ENV` | Dockerfile đã đặt `production`; không cần đổi. |
| `MAP_ASSET_ORIGINS` | Tùy chọn, mặc định cho OpenFreeMap. Chỉ chỉnh nếu đổi nguồn tile/style. |

5. Nếu URL thực chưa biết khi tạo service, tạo service trước, sao chép URL được cấp, sửa `PUBLIC_ORIGIN` cho khớp rồi **Save and deploy**. Origin sai sẽ gây lỗi 403 khi đăng nhập, đăng ký hoặc gửi form. File `.env.render` trên máy không tự đồng bộ lên Render; phải nhập các biến trong trang **Environment** của service.
6. Thêm dải outbound IP của Render vào Atlas như bước 2.4. Chọn **Manual Deploy > Deploy latest commit** nếu lần khởi động đầu lỗi kết nối MongoDB.
7. Đợi log báo Nest application started và service Live. Mở `https://TEN-SERVICE.onrender.com/api/v1/health`; mong đợi `data.status = ok` và `data.database = ok`. Sau đó mở `/` để kiểm tra bản đồ.

## 4. Chuẩn bị dữ liệu demo và admin

Web Service Free không có shell chạy lệnh một lần, và script `seed:demo` cố ý bị khóa khi `NODE_ENV=production`. Nếu muốn có 100 quán mô phỏng trên bản deploy, chạy script **từ máy local** kết nối đến Atlas bằng IP máy đã được cho phép:

```powershell
cd backend
npm ci
npm run build
$env:MONGODB_URI = 'mongodb+srv://USER:PASSWORD@CLUSTER/seatnow?...'
$env:NODE_ENV = 'development'
npm run seed:demo
```

Chỉ dùng URI thật trong terminal riêng, không chép vào tài liệu/commit. Dữ liệu seed là hư cấu và có thể ghi lại các slug demo khi chạy lại. Sau khi chạy, xóa biến môi trường khỏi terminal hoặc đóng terminal.

Để có trang xét duyệt `/admin`, dùng tài khoản admin **riêng**. Điền `ADMIN_EMAIL` và `ADMIN_PASSWORD` (ít nhất 20 ký tự) trong `backend/.env.admin` được Git bỏ qua, giữ `MONGODB_URI` trỏ tới Atlas trong môi trường terminal, rồi chạy:

```powershell
cd backend
npm run admin:create
```

Script sẽ từ chối email đã thuộc tài khoản thường. Không đặt mật khẩu admin mẫu trong repository. Sau khi đăng nhập, admin vào `/admin` để duyệt yêu cầu quyền quản lý quán và đề xuất quán cộng đồng.

## 5. Kiểm tra sau deploy

1. Mở `/api/v1/health`; kiểm tra MongoDB và API đều `ok`.
2. Mở `/`; kiểm tra tile bản đồ và các quán seed. Nếu trống, kiểm tra seed, URI và log Render.
3. Đăng ký tài khoản thử, đăng nhập rồi tải lại trang. Kiểm tra cookie phiên và không có lỗi 403.
4. Mở trực tiếp `/business`, `/business/claims`, `/bookings` và tải lại các URL để kiểm tra SPA fallback.
5. Chọn quán để xem tình trạng bàn, bãi xe và gửi yêu cầu đặt bàn nếu quán đã bật nhận yêu cầu.
6. Kiểm tra WebSocket/realtime; sau khi service Free ngủ do không có truy cập, lần mở đầu có thể chậm.

## 6. Sự cố thường gặp

| Triệu chứng | Cách kiểm tra |
| --- | --- |
| Build Docker thất bại | Xem build log, chạy `npm ci` và `npm run build` trong `frontend` và `backend` ở local. |
| API không kết nối MongoDB | Kiểm tra URI Atlas, Database User, IP Access List và dải outbound của Render. |
| Đăng nhập/form trả 403 | `PUBLIC_ORIGIN` phải khớp chính xác URL HTTPS trên thanh địa chỉ, không có `/` cuối. |
| Trang trắng khi tải lại URL con | Kiểm tra đã deploy commit có SPA fallback cho `/business/*` và frontend build được copy vào image. |
| Health `database: ok` nhưng không có quán, admin cũ đăng nhập 401 | Backend đã kết nối MongoDB nhưng có thể đang dùng sai database. Kiểm tra URI trong Render có `/seatnow` sau `.mongodb.net`, lưu bằng **Save and deploy**. So API `/api/v1/map/venues` với Atlas `seatnow` trước khi seed lại để tránh bản ghi trùng. |
| Không có quán trên bản đồ sau khi chọn đúng database | Kiểm tra Atlas `seatnow` có dữ liệu hay chưa; chỉ seed demo từ local nếu database thật sự trống. Kiểm tra bộ lọc/bán kính trên bản đồ. |
| Bản đồ nền không hiện | Kiểm tra mạng tải tile và `MAP_ASSET_ORIGINS` trong Content Security Policy. |
| Lần mở đầu chậm | Render Free có thể ngủ sau thời gian không truy cập và cần thời gian khởi động lại. |

## 7. Giới hạn của bản deploy học tập

- Render Free có thể ngủ sau 15 phút không có lưu lượng và có giới hạn tài nguyên. Không dùng như cam kết uptime cho người dùng thật.
- Ảnh review, logo và ảnh bìa được lưu trong MongoDB nên không phụ thuộc filesystem tạm của Render; cần theo dõi dung lượng Atlas Free.
- Realtime và khóa xác nhận đặt bàn hiện phù hợp **một API instance**. Scale nhiều instance cần cơ chế đồng bộ chung.
- Bản demo chưa có POS, thanh toán, thông báo push, xác minh email và khôi phục mật khẩu.

## Tài liệu chính thức

- Render Docker: https://render.com/docs/docker
- Render Web Services và biến `PORT`: https://render.com/docs/web-services
- Render Free: https://render.com/docs/free
- Render outbound IP: https://render.com/docs/outbound-ip-addresses
- MongoDB Atlas Free cluster: https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- MongoDB Atlas IP Access List: https://www.mongodb.com/docs/atlas/security/ip-access-list/
- MongoDB Atlas connection: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/

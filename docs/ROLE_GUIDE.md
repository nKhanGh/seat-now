# Hướng dẫn sử dụng SeatNow theo 3 vai trò

Tài liệu cho bản demo học tập - cập nhật 21/11/2026. Các nút và đường dẫn được đối chiếu với giao diện hiện tại. Bản web dùng [https://seat-now.onrender.com](https://seat-now.onrender.com) sau khi cấu hình Render đúng; khi chạy local bằng Vite, mở `http://localhost:5173`, hoặc `http://localhost:3000` nếu backend phục vụ cả frontend.

## Trước khi thử ba vai trò

1. Mở trang chủ và xác nhận có danh sách quán. Nếu danh sách trống, kiểm tra `/api/v1/health`, rồi thử `/api/v1/map/venues?lat=10.7769&lng=106.7009&radiusM=20000&limit=20`. Health OK nhưng bản đồ trống có thể là Render đang dùng URI trỏ tới database khác; Atlas của bản demo dùng tên `/seatnow`.
2. Chuẩn bị tài khoản người dùng thường, tài khoản được duyệt quản lý quán và tài khoản admin riêng. Không dùng cùng một phiên trình duyệt cho nhiều vai trò; đăng xuất trước khi đổi tài khoản hoặc dùng cửa sổ riêng tư.
3. Bản Render cần deploy branch chứa các tính năng mới. Nếu đang chọn `main` cũ, dùng `develop` để thử hoặc merge PR rồi deploy `main`.

## 1. Ba vai trò trong ứng dụng

| Vai trò | Cách có quyền | Trang bắt đầu | Công việc chính |
| --- | --- | --- | --- |
| Người dùng | Đăng ký tại `/register`. Khách chưa đăng nhập vẫn xem bản đồ. | `/` | Tìm quán, xem chỗ ngồi/bãi xe, check-in, đánh giá, lưu quán, đề xuất quán và gửi yêu cầu đặt bàn. |
| Chủ quán | Đăng ký tài khoản người dùng, gửi yêu cầu quản lý quán; admin duyệt đúng tài khoản đó. | `/business` | Quản lý hồ sơ, logo, yêu cầu đặt bàn và tương tác khách hàng của quán được cấp quyền. |
| Admin | Người vận hành tạo tài khoản riêng bằng script; không thể tự chọn vai trò admin khi đăng ký. | `/admin` | Xét duyệt quyền chủ quán và đề xuất quán đủ lượt xác nhận. |

**Lưu ý về quyền:** trong dữ liệu đăng nhập, chủ quán vẫn là tài khoản người dùng; quyền quản lý gắn với từng quán đã được duyệt. Một tài khoản có thể quản lý nhiều quán. Đăng nhập trực tiếp sẽ chuyển admin sang `/admin`, chủ quán có quán được duyệt sang `/business`, người dùng thường về bản đồ.

## 2. Thao tác chung: tài khoản và điều hướng

1. Trên trang chủ, bấm **Đăng ký** để nhập tên hiển thị, email, mật khẩu ít nhất 12 ký tự và xác nhận mật khẩu. Biểu tượng mắt cho phép hiện/ẩn mật khẩu.
2. Bấm **Đăng nhập** để vào bằng email/mật khẩu. Nếu vừa mở một quán rồi được yêu cầu đăng nhập, app có thể đưa bạn quay lại vị trí trước đó.
3. Bấm **Đăng xuất** trên header bản đồ. Hộp thoại có **Ở lại** và **Xác nhận đăng xuất**; chọn xác nhận để kết thúc phiên.
4. Thanh header có **Gói người dùng**, **Đề xuất quán**, **Quản lý quán**; sau khi đăng nhập có thêm các lối vào **Quán đã lưu**, **Đặt bàn của tôi**, **Đang theo dõi**. Admin thấy **Xét duyệt**. Trên màn hình nhỏ, có thể cuộn ngang thanh liên kết.

## 3. Vai trò người dùng

### 3.1. Tìm địa điểm trên bản đồ

1. Mở `/`. Bản đồ và danh sách quán mặc định quanh trung tâm TP.HCM. Bấm thẻ quán hoặc ghim để mở chi tiết; bấm **Đóng** để đóng.
2. Dùng ô tìm tên/địa chỉ; chọn bộ lọc loại địa điểm, loại món, bán kính, mức giá, đánh giá, độ đông và **Còn bàn**. Tăng bán kính hoặc bỏ bớt lọc nếu không thấy quán.
3. Bấm **Vị trí của tôi**, cho phép trình duyệt dùng vị trí để xem chấm xanh và chuyển khu vực tìm kiếm. Kéo bản đồ để khám phá vùng khác; ghim quán đã tải vẫn ở trên bản đồ.
4. Trong chi tiết, đọc số bàn/ghế còn trống, thời điểm cập nhật, độ tin cậy, thời gian chờ và lịch sử 24 giờ. Dữ liệu cũ hoặc không rõ được ghi nhãn; đây là số liệu quan sát, không bảo đảm còn bàn khi đến nơi.
5. Kéo xuống phần bãi xe để xem khoảng cách, giá, loại xe, giờ mở cửa và chỗ trống. Bấm **Chỉ đường đến bãi xe** nếu muốn mở bản đồ chỉ đường.

### 3.2. Check-in, đánh giá và theo dõi

1. Chọn một quán thật đang có tọa độ đúng; tới gần quán, bật GPS rồi bấm **Check-in tại đây**. Trình duyệt cần báo độ chính xác trong 100 m và vị trí trong 150 m so với quán. Các quán seed hư cấu chỉ dùng để thử bản đồ, không phù hợp để check-in thực địa.
2. Chọn số sao và bấm **Gửi đánh giá**; có thể nhập nhận xét ngắn và tải ảnh JPEG/PNG/WebP tối đa 2 MB. Sau khi gửi, kiểm tra đánh giá công khai trong chi tiết quán.
3. Bấm **Lưu quán** để đưa quán vào `/favorites`; bấm **Bỏ lưu** để gỡ. **Chia sẻ địa điểm** sao chép liên kết quán.
4. Bấm tên người viết review để mở hồ sơ công khai rồi chọn **Theo dõi**. Trang `/following` cho biết các tài khoản đang theo dõi và review gần đây.

### 3.3. Gửi yêu cầu đặt bàn

1. Mở nhà hàng hoặc quán cà phê đã bật nhận yêu cầu. Trong chi tiết chọn **Bắt đầu (giờ đến)** từ 1 giờ đến 14 ngày tới; chọn **Kết thúc (giờ rời quán)** sau giờ bắt đầu 30 phút đến 4 giờ. Điền 1-12 khách và ghi chú nếu cần.
2. Bấm **Gửi yêu cầu**. Trạng thái ban đầu là **Chờ xác nhận**; quán chưa giữ bàn. Số bàn trống hiển thị ở chi tiết là hiện tại, không phải dự báo cho khung giờ bạn đặt.
3. Mở `/bookings` hoặc **Đặt bàn của tôi** để theo dõi. **Đã xác nhận** nghĩa là chủ quán chấp nhận; **Quán từ chối** hoặc **Đã hủy** là yêu cầu không còn hiệu lực. Khi cần, bấm **Hủy yêu cầu** rồi **Xác nhận hủy** đối với yêu cầu đang chờ/đã xác nhận.
4. Rạp phim chưa có luồng yêu cầu đặt bàn này. Nếu quán chưa bật nhận yêu cầu, form sẽ giải thích và chỉ chủ quán đến trang quản lý.

### 3.4. Đề xuất quán và gói người dùng

1. Mở `/proposals`, chọn **Đề xuất quán**, điền loại địa điểm, tên, địa chỉ, tọa độ, loại món, mức giá và mô tả. Có thể dùng **Dùng vị trí của tôi** nếu đang ở tại quán.
2. Đề xuất cần **ba tài khoản khác** xác nhận trước khi admin xem xét. Theo dõi trạng thái trong **Đề xuất của tôi**; quán chỉ xuất hiện trên bản đồ sau khi admin duyệt.
3. Mở `/plans` để xem Free và Premium. Bản demo chưa có thanh toán. Premium user do người vận hành cấp thử: yêu cầu đặt bàn có nhãn ưu tiên và bản đồ ẩn quảng cáo; giữ chỗ xe, voucher thật và AI cá nhân hóa vẫn chưa mở.

## 4. Vai trò chủ quán

### 4.1. Nhận quyền quản lý quán

1. Đăng nhập bằng đúng tài khoản muốn dùng làm chủ quán. Trên bản đồ mở quán đã tồn tại, bấm **Bạn là chủ quán này?** để đến `/business/claims` với slug được điền sẵn. Cũng có thể vào **Quản lý quán** rồi chọn **Yêu cầu quyền**.
2. Viết thông tin chứng minh quyền quản lý từ 20-300 ký tự. Có thể đính kèm ảnh JPEG/PNG/WebP tối đa 3 MB; ảnh này chỉ admin xem để xét duyệt.
3. Bấm **Gửi yêu cầu**. Xem **Yêu cầu của tôi** để biết **Chờ duyệt**, **Đã duyệt** hoặc **Từ chối**. Chỉ biết slug quán không đủ để có quyền sửa.
4. Sau khi admin duyệt, mở `/business`, bấm **Cập nhật trạng thái** nếu trang đang mở sẵn. Kiểm tra email hiển thị và danh sách **Địa điểm đang quản lý**.

### 4.2. Làm việc trên các trang riêng

Header quản lý có **Tổng quan**, **Yêu cầu quyền** và, khi đã có quán, các mục **Đặt bàn**, **Tương tác**, **Hồ sơ**. Nếu quản lý nhiều quán, chọn **Chi nhánh** trước khi thao tác. Nút **Về trang chính** trở lại bản đồ.

| Trang | Thao tác |
| --- | --- |
| **Đặt bàn** | Bật **Nhận yêu cầu đặt bàn** rồi bấm **Lưu cài đặt**. Xem khung giờ đến-rời, số khách, tên người gửi; bấm **Xác nhận** hoặc **Từ chối**. Sau khi đón khách, bấm **Đánh dấu đã đón khách** và xác nhận lần nữa. |
| **Tương tác** | Xem lượt check-in gần đây và review công khai kèm ảnh; bấm **Làm mới** để lấy dữ liệu mới. |
| **Hồ sơ** | Chỉnh tên, địa chỉ, mô tả, giờ mở cửa, menu tóm tắt, mức giá rồi **Lưu hồ sơ**. Tải logo tối đa 2 MB bằng **Cập nhật logo**. |

Nếu các lượt đã xác nhận chồng giờ dùng hết tổng bàn/ghế được ghi nhận, thao tác **Xác nhận** sẽ báo hết chỗ ngay ở yêu cầu đó. Hãy kiểm tra khả năng phục vụ thực tế và từ chối hoặc trao đổi giờ khác. Yêu cầu **Chờ xác nhận** chưa tự trừ số bàn trống trên bản đồ.

### 4.3. Công cụ Premium Business demo

Khi người vận hành cấp gói Premium còn hiệu lực cho **quán**, header có thêm **Chỗ trống**, **Thống kê**, **Ưu đãi**. Trong **Chỗ trống**, nhập tổng/còn trống bàn/ghế, độ đông, thời gian chờ và trạng thái nhận khách rồi bấm **Cập nhật chỗ trống**. Snapshot chủ quán nhập sẽ cũ sau 10 phút. **Thống kê** hiển thị lượt mở chi tiết và tỷ lệ lấp đầy từ snapshot. **Ưu đãi** cho phép hẹn nội dung và thời gian xuất hiện trong app. Ảnh bìa được tải tại **Hồ sơ**. Premium Business và Premium User là hai gói khác nhau.

## 5. Vai trò admin

### 5.1. Vào trang xét duyệt

Admin được người vận hành tạo riêng bằng `npm run admin:create` với email mới và mật khẩu ít nhất 20 ký tự trong `backend/.env.admin` (được Git bỏ qua). Không dùng tài khoản người dùng thường để tự nâng quyền. Sau khi đăng nhập trực tiếp, app chuyển tới `/admin`; cũng có thể bấm **Xét duyệt** trên header. Người dùng thường mở `/admin` sẽ thấy thông báo không có quyền.

### 5.2. Duyệt yêu cầu chủ quán

1. Chọn tab **Chủ quán** rồi **Làm mới**. Mỗi thẻ cho biết tên/slug quán, người gửi, email, thông tin chứng minh và ảnh riêng tư nếu có.
2. Đối chiếu quyền quản lý ngoài hệ thống. Chọn **Duyệt** hoặc **Từ chối**. Đọc hộp xác nhận rồi bấm **Xác nhận**; chọn **Hủy** nếu chưa muốn quyết định.
3. Sau khi duyệt, chủ quán đăng nhập bằng **đúng email đã gửi**, mở `/business` và cập nhật trạng thái. Ảnh chứng minh không được công khai trên trang quán.

### 5.3. Duyệt quán cộng đồng

1. Chọn tab **Quán cộng đồng**. Chỉ đề xuất đã đủ ba lượt xác nhận từ ba tài khoản khác người gửi mới xuất hiện.
2. Đọc tên, địa chỉ, loại quán, người đề xuất, mô tả và tọa độ. Bấm **Kiểm tra vị trí** để đối chiếu trên Google Maps.
3. Chọn **Duyệt** hoặc **Từ chối** rồi **Xác nhận**. Sau khi duyệt, quán xuất hiện trên bản đồ; người đề xuất xem trạng thái trong `/proposals`.

Trang admin có nút **Về bản đồ**. Hàng chờ báo cáo review hiện chưa có trên giao diện admin; người vận hành xử lý qua API nội bộ.

## 6. Kịch bản demo nhanh với 3 vai trò

1. **Người dùng/chủ quán tương lai:** mở một quán ăn trên bản đồ, chọn **Bạn là chủ quán này?**, gửi yêu cầu quyền kèm chứng minh.
2. **Admin:** đăng nhập `/admin`, mở tab **Chủ quán**, đối chiếu và **Duyệt** yêu cầu.
3. **Chủ quán:** đăng nhập lại tài khoản ở bước 1, vào `/business` > **Đặt bàn**, bật nhận yêu cầu và **Lưu cài đặt**; có thể sửa **Hồ sơ** và logo.
4. **Khách khác:** đăng nhập, mở quán đó, chọn giờ bắt đầu/kết thúc và bấm **Gửi yêu cầu**; kiểm tra `/bookings` đang **Chờ xác nhận**.
5. **Chủ quán:** trong **Đặt bàn**, bấm **Xác nhận**. **Khách:** tải lại `/bookings` để thấy **Đã xác nhận**.
6. **Người dùng:** đề xuất quán mới; ba tài khoản khác xác nhận. **Admin:** mở tab **Quán cộng đồng** để duyệt quán lên bản đồ.

## 7. Khi có lỗi

| Hiện tượng | Cách xử lý |
| --- | --- |
| Bản đồ trống | Kiểm tra mạng tile, bỏ bộ lọc và mở `/api/v1/health`; dữ liệu demo cần chạy `seed:demo`. |
| Render health OK nhưng quán trống, admin cũ đăng nhập 401 | Kiểm tra `MONGODB_URI` của service có `/seatnow` sau `.mongodb.net`; file env local không tự cập nhật Render. Lưu bằng **Save and deploy**. |
| Tính năng mới không xuất hiện trên Render | Kiểm tra Web Service đã chọn `develop` hoặc `main` sau khi merge PR. |
| Không check-in được | Cần vị trí thật gần quán, quyền GPS và độ chính xác đủ tốt; quán seed là hư cấu. |
| Không có form đặt bàn | Chỉ nhà hàng/cà phê được chủ quán bật nhận yêu cầu mới có form. |
| Đã gửi đặt bàn nhưng chưa có bàn | **Chờ xác nhận** chưa giữ bàn; chờ chủ quán quyết định trong trang **Đặt bàn**. |
| Chủ quán không thấy quán sau duyệt | Kiểm tra email đăng nhập, vào `/business` và bấm **Cập nhật trạng thái**. |
| Tab quán cộng đồng của admin trống | Đề xuất chưa đủ ba lượt xác nhận hợp lệ. |

SeatNow hiện là bản demo: chưa kết nối POS, chưa có thanh toán, giữ chỗ xe, voucher thật, push notification hay xác minh email/khôi phục mật khẩu. Dữ liệu chỗ ngồi demo không phải cam kết chỗ thực tế.

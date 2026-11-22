# Hướng dẫn sử dụng SeatNow

Bản cập nhật **22/11/2026** cho dự án học tập SeatNow. App đang dùng dữ liệu mẫu ở TP.HCM; tên quán, tọa độ, tình trạng bàn và chỗ xe có thể là hư cấu. Không dùng dữ liệu demo để quyết định đi lại hoặc đặt chỗ ngoài đời.

**Mở app:** [https://seat-now.onrender.com](https://seat-now.onrender.com). Khi chạy local, dùng `http://localhost:5173` với Vite hoặc `http://localhost:3000` khi backend phục vụ bản đã build. Bản Render Free có thể khởi động chậm ở lần mở đầu.

| Vai trò | Trang chính | Việc có thể thử |
| --- | --- | --- |
| Khách chưa đăng nhập | `/` | Xem bản đồ, lọc địa điểm, chỗ ngồi, bãi xe và review công khai. |
| Người dùng Free | `/`, `/bookings`, `/proposals` | Check-in đúng vị trí, review/ảnh, lưu quán, theo dõi, đề xuất quán và gửi yêu cầu đặt bàn. |
| Người dùng Premium demo | Các trang Free, `/recommendations`, `/vouchers`, `/parking-reservations` | Yêu cầu đặt bàn ưu tiên, ẩn nội dung tài trợ, gợi ý theo sở thích, voucher demo và yêu cầu giữ xe. Admin cấp gói; chưa có thanh toán. |
| Chủ quán được duyệt | `/business` | Quản lý hồ sơ, logo, tương tác, yêu cầu đặt bàn, bãi xe và voucher. Công cụ Premium Business phụ thuộc gói của từng quán. |
| Admin | `/admin` | Duyệt yêu cầu nhận quán/đề xuất, cấp hoặc thu hồi Premium demo và quản lý voucher. |

## 1. Tài khoản và điều hướng

### Đăng ký, đăng nhập

1. Trên bản đồ, chọn **Đăng ký** hoặc **Đăng nhập**. Trên màn hình hẹp, bấm nút **menu** cạnh logo để mở các đường dẫn.
2. Đăng ký bằng tên hiển thị, email, mật khẩu từ 12 ký tự và ô xác nhận mật khẩu. Biểu tượng mắt hiện/ẩn mật khẩu.
3. Đăng nhập bằng email và mật khẩu. Nếu bạn đến form từ một thao tác đang làm, app quay về thao tác đó. Nếu đăng nhập trực tiếp, admin đến `/admin`, chủ quán có quyền quản lý đến `/business`, tài khoản thường về bản đồ.
4. Chọn **Đăng xuất** và xác nhận trong hộp thoại. Nếu muốn giữ phiên, bấm **Ở lại**.

Tài khoản admin được tạo bởi người vận hành, không đăng ký qua form công khai. App hiện chưa có xác minh email và khôi phục mật khẩu.

### Thanh điều hướng

Header có **Gói người dùng**, **Dành cho bạn**, **Voucher**, **Chỗ xe của tôi**, **Đề xuất quán**, **Quản lý quán**. Sau đăng nhập còn có **Quán đã lưu**, **Đặt bàn của tôi**, **Đang theo dõi**; admin có **Xét duyệt**. Trên điện thoại, các mục này nằm trong menu; bấm một mục để mở trang và đóng menu.

## 2. Khám phá bản đồ

1. Mở trang chủ `/`. Trên máy tính, danh sách ở trái và bản đồ ở phải. Trên điện thoại, bản đồ nằm ngay dưới hai nút **Hiện danh sách** và **Hiện bộ lọc**.
2. Bấm **Hiện danh sách / Thu gọn danh sách** để dành thêm chỗ cho bản đồ. Bấm **Hiện bộ lọc / Ẩn bộ lọc** để mở hoặc gập điều kiện tìm kiếm.
3. Kéo bản đồ để đổi **tâm tìm kiếm**. Bấm ghim hoặc thẻ quán để mở chi tiết; bấm **Đóng** để tắt. Nhiều quán gần nhau được gom thành vòng tròn; bấm vòng tròn để phóng gần.
4. Bấm **Vị trí của tôi**, cho phép trình duyệt dùng vị trí để thấy chấm xanh và chuyển tâm bản đồ. Thao tác này không phải check-in. Trình duyệt cần `localhost` hoặc HTTPS để cấp quyền vị trí.
5. Trong chi tiết, **Chỉ đường** mở Google Maps; tọa độ demo có thể không trùng quán thật.

### Tìm và lọc

Nhập tên hoặc địa chỉ vào ô tìm kiếm; có thể gõ tiếng Việt không dấu. Các bộ lọc gồm loại địa điểm, loại món, **bán kính 1/3/5/10 km**, mức giá, điểm đánh giá, độ đông, **Còn bàn**, sắp xếp và **Chỉ quán đã lưu**.

Mức giá 1–4 là nhóm giá tương đối (từ bình dân đến rất cao), không phải giá của một món cụ thể.

**Bán kính tính từ tâm bản đồ đang xem, không mặc định tính từ vị trí GPS của bạn.** Ghim và danh sách đều dùng phạm vi này; nhãn trên bản đồ cho biết bán kính hiện tại. Đổi bán kính hoặc kéo bản đồ sẽ cập nhật địa điểm phù hợp. Nếu muốn lọc quanh nơi bạn đứng, bấm **Vị trí của tôi** trước. **Xóa bộ lọc** bỏ các điều kiện nhưng giữ khu vực đang xem.

**Còn bàn** chỉ nhận quán có snapshot còn hiệu lực, đang nhận khách và còn bàn hoặc ghế. Nếu kết quả trống, tăng bán kính, bỏ bớt điều kiện hoặc thử khu vực khác. Dữ liệu chỗ ngồi demo không phải dữ liệu trực tiếp từ quán.

### Chỗ ngồi và bãi xe

- Chi tiết quán ghi **mức đông**, số bàn/ghế còn trống, thời gian chờ ước tính, nguồn và thời điểm cập nhật. Bấm **Xem lịch sử chỗ ngồi 24 giờ** để xem các bản ghi gần đây. Snapshot cũ hoặc thiếu dữ liệu được gắn nhãn riêng.
- Trong **Bãi đỗ xe gần đây**, xem loại bãi, khoảng cách, giá, loại xe, số chỗ và thời điểm cập nhật. Lọc theo loại xe, còn chỗ mới, mở 24 giờ hoặc miễn phí; bấm **Chỉ đường** khi cần.
- Khoảng cách trong app là đường chim bay. Check-in và yêu cầu đặt bàn không tự trừ số bàn/ghế của snapshot.

## 3. Tính năng người dùng Free

### Check-in

1. Đăng nhập, mở một quán rồi đến mục **Check-in cộng đồng**.
2. Bấm **Check-in tại đây** và cho phép truy cập vị trí. Thành công sẽ báo đã ghi nhận và cập nhật tín hiệu cộng đồng.
3. Backend chỉ nhận khi GPS chính xác không quá **100 m** và thiết bị ở trong **150 m** từ tọa độ quán. Mỗi tài khoản chỉ được tính một lần cho cùng quán trong ba giờ.

Nếu app báo **Bạn cần ở gần địa điểm**, lượt check-in chưa được ghi. Quán seed thường dùng tọa độ mô phỏng nên khó thử check-in thật. Tín hiệu cộng đồng không thay số bàn trống.

### Review, ảnh và cộng đồng

1. Mở **Review cộng đồng**, chọn 1–5 sao, viết nhận xét ngắn và tùy chọn một ảnh JPEG/PNG/WebP tối đa 2 MB. Bấm **Gửi đánh giá**.
2. Mỗi tài khoản có một review cho mỗi quán. Mở lại để sửa; chọn ảnh mới để thay ảnh cũ, hoặc xóa review bằng hộp xác nhận. Nếu tải ảnh lỗi sau khi lưu chữ/sao, chọn ảnh hợp lệ và cập nhật review cũ.
3. **Lưu quán** để thêm vào `/favorites`; **Chia sẻ địa điểm** để sao chép liên kết. Bấm tên tác giả review để mở hồ sơ, **Theo dõi** rồi xem hoạt động ở `/following`.

Ảnh review, logo, ảnh bìa và ảnh chứng minh quyền quản lý được backend chuyển thành WebP và lưu trong MongoDB; ảnh chứng minh chỉ admin xem được và bị xóa sau khi xét duyệt. Ảnh không nằm trong `frontend/public`.

### Đề xuất địa điểm mới

1. Mở **Đề xuất quán** (`/proposals`), nhập tên, loại, địa chỉ, mô tả, mức giá và chọn tọa độ trên bản đồ nhỏ.
2. Bấm **Gửi đề xuất**. Đề xuất mới chưa hiện trên bản đồ.
3. Ba tài khoản **khác người gửi** xác nhận. Khi đủ ba lượt, admin kiểm tra và duyệt/từ chối tại `/admin`.
4. Người gửi theo dõi trạng thái trong **Đề xuất của tôi**; sau khi duyệt có thể mở quán trên bản đồ.

Nếu quán đã tồn tại và bạn muốn quản lý hồ sơ, dùng **Bạn là chủ quán này?** thay vì đề xuất quán trùng.

### Yêu cầu đặt bàn

1. Mở nhà hàng hoặc cà phê đã bật nhận yêu cầu. Trong chi tiết, tìm **Yêu cầu đặt bàn**. Rạp phim và quán chưa bật nhận không có form gửi.
2. Chọn **giờ bắt đầu** (ít nhất 1 giờ tới, tối đa 14 ngày), **giờ kết thúc** (lượt dài 30 phút–4 giờ), số khách 1–12 và ghi chú nếu cần. Bấm **Gửi yêu cầu**.
3. Yêu cầu ban đầu là **Chờ xác nhận**, chưa phải bàn đã giữ. Mở **Đặt bàn của tôi** (`/bookings`) để theo dõi hoặc hủy có xác nhận.
4. Chủ quán xác nhận hoặc từ chối. Khi đã xác nhận, app kiểm tra các lượt đặt trùng giờ so với tổng bàn/ghế đã ghi nhận; chủ quán vẫn phải kiểm tra khả năng phục vụ thực tế.

Premium demo được xếp ưu tiên trong hàng chờ nhưng không bảo đảm quán xác nhận. App chưa gửi email/SMS khi trạng thái đổi.

## 4. Premium dành cho người dùng

Mở **Gói người dùng** (`/plans`) để xem gói hiện tại. Admin cấp hoặc thu hồi Premium demo tại `/admin`; app chưa thu tiền và chưa cho tự mua gói. Khi quyền Premium được tải thành công, header có **Premium của tôi**.

- **Dành cho bạn:** chọn khẩu vị, mức giá và số người tại `/recommendations`. Kết quả dựa trên quy tắc và lịch sử lưu/review, chưa phải AI.
- **Voucher:** vào `/vouchers`, bấm **Nhận voucher** khi còn lượt. Mã dùng một lần được liệt kê trong **Voucher của tôi**; chủ quán xác nhận mã ở trang quản lý. Voucher demo không có giá trị tại quán thật.
- **Giữ xe:** mở bãi **thuộc quán** có snapshot mới còn chỗ, chọn loại xe và giờ đến/rời, rồi gửi yêu cầu. Chủ quán phải xác nhận. Theo dõi/hủy tại **Chỗ xe của tôi** (`/parking-reservations`). Chưa hỗ trợ bãi công cộng độc lập.
- **Bản đồ không quảng cáo và ưu tiên đặt bàn:** nội dung tài trợ được ẩn khi quyền được xác minh; yêu cầu đặt bàn Premium xếp trước.

Nếu trang **Gói người dùng** báo không kiểm tra được quyền, bấm **Thử lại**. Bản đồ Free vẫn dùng được trong lúc API gói gặp lỗi; quyền Premium chỉ áp dụng khi được xác minh.

## 5. Chủ quán

### Xin quyền quản lý

1. Đăng nhập bằng tài khoản sẽ quản lý quán. Trong chi tiết, bấm **Bạn là chủ quán này?** hoặc mở `/business/claims`.
2. Điền slug quán, mô tả cách chứng minh quyền quản lý (20–300 ký tự) và có thể tải ảnh JPEG/PNG/WebP tối đa 3 MB.
3. Bấm **Gửi yêu cầu**. Admin kiểm tra nội dung và ảnh, rồi duyệt hoặc từ chối. Chỉ sau khi duyệt, quán mới hiện ở **Địa điểm đang quản lý** trong `/business`.
4. Nếu vừa được duyệt mà chưa thấy quán, bấm **Cập nhật trạng thái**, kiểm tra đúng email đã gửi yêu cầu rồi tải lại trang.

### Các trang quản lý

Header khu vực `/business` tách thành các trang. Dùng **Chi nhánh** để chuyển quán và **Về trang chính** để quay về bản đồ.

| Trang | Tác vụ |
| --- | --- |
| **Tổng quan** | Xem các quán được cấp quyền và đi đến công việc cần làm. |
| **Hồ sơ** | Sửa tên, địa chỉ, mô tả, giờ mở, menu, giá; bấm **Lưu hồ sơ**. Tải và cập nhật logo. |
| **Tương tác** | Xem check-in gần đây, review và ảnh công khai; bấm **Làm mới** khi cần. |
| **Đặt bàn** | Bật **Nhận yêu cầu đặt bàn** rồi **Lưu cài đặt**; xác nhận/từ chối yêu cầu, đánh dấu đã đón khách. |
| **Giữ xe** | Cập nhật chỗ xe của bãi thuộc quán, xác nhận/từ chối yêu cầu giữ xe. |
| **Voucher** | Nhập mã khách đưa để xác nhận sử dụng một lần. |

Gói **Premium Business demo** của từng quán có thêm cập nhật chỗ trống thủ công, thống kê 7 ngày, ảnh bìa, ưu đãi theo lịch và vị trí tài trợ có nhãn. Snapshot chủ quán nhập tự cũ sau 10 phút. Chưa tích hợp POS, thông báo đẩy hoặc quản lý nhân viên chuỗi nhiều vai trò.

## 6. Admin

Đăng nhập tài khoản admin do người vận hành tạo; app đưa thẳng đến `/admin`. Dùng các tab:

1. **Chủ quán:** kiểm tra slug, người gửi, nội dung và ảnh chứng minh riêng tư; chọn **Duyệt** hoặc **Từ chối**, sau đó xác nhận thao tác.
2. **Quán cộng đồng:** chỉ thấy đề xuất đủ ba xác nhận. Kiểm tra thông tin và vị trí rồi duyệt/từ chối. Quán được duyệt mới lên bản đồ.
3. **Premium demo:** xem danh sách người dùng, tìm theo tên/email, cấp 1–30 ngày hoặc thu hồi. Người dùng tải lại trang để nhận trạng thái mới.
4. **Voucher:** tạo ưu đãi demo cho slug quán, số lượt và hạn dùng; tắt voucher khi cần.

Không dùng tài khoản admin thường để thử luồng khách/chủ quán; nên tạo tài khoản riêng cho từng vai trò.

## 7. Chạy local và xử lý lỗi

### Chạy app

Xem [README](../README.md) để cài Node.js, MongoDB và seed dữ liệu. Khi phát triển hai server, mở frontend ở `http://localhost:5173`. Nếu muốn cả app trên cổng 3000, từ thư mục gốc chạy:

```powershell
npm run preview:local
```

Lệnh này build lại React và NestJS rồi chạy backend. Dừng backend cũ đang chiếm cổng 3000 trước; sau đó tải lại trang bằng **Ctrl+F5**. Trên mobile, header bản mới có nút menu cạnh logo. Nếu vẫn thấy dải trắng phía trên bản đồ và header cuộn ngang, bạn đang xem frontend build cũ hoặc server chạy ở thư mục khác.

### Kiểm tra nhanh

| Hiện tượng | Cách xử lý |
| --- | --- |
| Bản đồ nền trống nhưng danh sách vẫn có quán | Kiểm tra mạng và tile style; tải lại trang. Danh sách vẫn dùng được khi tile lỗi. |
| Không có quán | Bỏ bộ lọc, tăng bán kính, chuyển tâm về TP.HCM. Kiểm tra `/api/v1/health` và MongoDB đúng database `seatnow`. |
| **Còn bàn** không trả kết quả | Chỉ snapshot còn hiệu lực, đang nhận khách và còn chỗ mới được tính; thử bỏ điều kiện khác. |
| Không thấy chấm vị trí hoặc check-in thất bại | Cấp Location trên `localhost`/HTTPS, kiểm tra GPS và khoảng cách tới tọa độ quán. |
| Không thấy form đặt bàn | Chỉ nhà hàng/cà phê đã được chủ quán bật **Nhận yêu cầu đặt bàn** và bấm **Lưu cài đặt** mới có form. |
| Yêu cầu đặt bàn đã gửi nhưng chưa có bàn | Trạng thái **Chờ xác nhận** cần chủ quán xử lý. |
| Quyền Premium báo lỗi | Vào `/plans`, đọc mã lỗi và bấm **Thử lại**; kiểm tra phiên đăng nhập và API nếu lỗi lặp lại. |
| Admin hoặc chủ quán không thấy trang của mình | Kiểm tra email, quyền đã được duyệt và đăng nhập lại. |
| Bản deploy thiếu tính năng mới | Kiểm tra commit/branch service Render và deploy mới nhất; frontend local không tự cập nhật bản Render. |

Mẫu thu ý kiến người thử nằm trong [file Excel phản hồi](../outputs/01a1efba-d6bc-7490-9bea-097fc453b639/SeatNow_Feedback.xlsx): mỗi dòng là một lượt thử tính năng, có vai trò, thiết bị, kết quả, điểm 1–5, vấn đề và góp ý.

Hướng dẫn triển khai nằm tại [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md); phạm vi tính năng và giới hạn nằm tại [FEATURES.md](FEATURES.md).

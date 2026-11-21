# Hướng dẫn sử dụng SeatNow

Tài liệu cho **bản demo phục vụ học tập**, cập nhật ngày 21/11/2026. [Danh sách tính năng và giới hạn](FEATURES.md) · [README kỹ thuật](../README.md) · [runbook vận hành](runbooks/local-demo.md).

> **Dữ liệu mẫu:** Khoảng 100 địa điểm và 4 bãi xe được tạo để thử giao diện, tập trung ở TP.HCM. Tên, địa chỉ, tọa độ và số chỗ có thể là hư cấu. Đừng dùng chúng để quyết định đi đến địa điểm thật.

## Mục lục

1. [Mở app và vai trò tài khoản](#1-mở-app-và-vai-trò-tài-khoản)
2. [Đăng ký, đăng nhập, đăng xuất](#2-đăng-ký-đăng-nhập-đăng-xuất)
3. [Bản đồ, tìm kiếm và bộ lọc](#3-bản-đồ-tìm-kiếm-và-bộ-lọc)
4. [Đọc tình trạng bàn, ghế và lịch sử](#4-đọc-tình-trạng-bàn-ghế-và-lịch-sử)
5. [Tìm bãi đỗ xe](#5-tìm-bãi-đỗ-xe)
6. [Check-in và tín hiệu cộng đồng](#6-check-in-và-tín-hiệu-cộng-đồng)
7. [Review, ảnh, lưu quán và theo dõi](#7-review-ảnh-lưu-quán-và-theo-dõi)
8. [Đề xuất địa điểm mới](#8-đề-xuất-địa-điểm-mới)
9. [Gửi và theo dõi yêu cầu đặt bàn](#9-gửi-và-theo-dõi-yêu-cầu-đặt-bàn)
10. [Trang dành cho chủ quán](#10-trang-dành-cho-chủ-quán)
11. [Trang xét duyệt admin](#11-trang-xét-duyệt-admin)
12. [Gói người dùng và quyền Premium demo](#12-gói-người-dùng-và-quyền-premium-demo)
13. [Kịch bản demo từ đầu đến cuối](#13-kịch-bản-demo-từ-đầu-đến-cuối)
14. [Xử lý lỗi thường gặp](#14-xử-lý-lỗi-thường-gặp)
15. [Khởi động và chuẩn bị dữ liệu local](#15-khởi-động-và-chuẩn-bị-dữ-liệu-local)

## 1. Mở app và vai trò tài khoản

Khi nhóm chạy hai server phát triển, mở **http://localhost:5173**. Nếu đã build frontend và để backend phục vụ cả app, mở **http://localhost:3000**. API nằm dưới `/api/v1`. Trang chính `/` là bản đồ; mọi vai trò đều có thể xem bản đồ, chỗ ngồi và bãi xe mà không cần đăng nhập.

| Vai trò                 | Có thể làm gì                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Khách chưa đăng nhập    | Xem bản đồ, tìm/lọc quán, tình trạng chỗ ngồi, bãi xe, review công khai và trang gói.                                              |
| Người dùng Free         | Check-in khi thực sự ở gần quán, review/ảnh, lưu và chia sẻ quán, theo dõi, đề xuất địa điểm, gửi yêu cầu đặt bàn tại quán hỗ trợ. |
| Người dùng Premium demo | Có toàn bộ quyền Free; yêu cầu đặt bàn xếp ưu tiên trong hàng chờ và bản đồ ẩn quảng cáo. Chưa thể tự mua gói.                     |
| Chủ quán đã được duyệt  | Quản lý quán được cấp quyền tại `/business`; quyền Basic và Premium doanh nghiệp ở mục 10.                                         |
| Admin                   | Xét duyệt quyền quản lý quán và đề xuất địa điểm tại `/admin`. Tài khoản này do người vận hành tạo bằng script.                    |

Thanh đầu trang bản đồ có **Gói người dùng**, **Đề xuất quán**, **Quản lý quán**. Khi đăng nhập còn có **Quán đã lưu**, **Đặt bàn của tôi**, **Đang theo dõi**; admin thấy thêm **Xét duyệt**. Trên điện thoại, các liên kết có thể cuộn ngang.

## 2. Đăng ký, đăng nhập, đăng xuất

### Tạo tài khoản

1. Chọn **Đăng ký** trên thanh đầu trang hoặc mở `/register`.
2. Nhập **Tên hiển thị** (sẽ xuất hiện cạnh review), **Email**, **Mật khẩu** dài ít nhất 12 ký tự và **Xác nhận mật khẩu** giống hệt.
3. Chọn biểu tượng mắt trong ô mật khẩu để hiện/ẩn ký tự ở cả ô mật khẩu và xác nhận.
4. Chọn **Tạo tài khoản**. Nếu hai mật khẩu khác nhau, form báo lỗi trước khi gửi. Email đã dùng hoặc dữ liệu sai sẽ hiện lỗi dưới form.

### Đăng nhập và chuyển trang

1. Chọn **Đăng nhập**, nhập email/mật khẩu rồi bấm **Đăng nhập**.
2. Nếu vào form từ một quán hay thao tác cần tài khoản, app quay lại trang đó. Khi đăng nhập trực tiếp, admin đi tới `/admin`; người quản lý ít nhất một quán đi tới `/business`; tài khoản thường về bản đồ.
3. Nếu chủ quán vừa được duyệt nhưng vẫn ở trang cũ, mở **Quản lý quán**, chọn **Cập nhật trạng thái** và kiểm tra email đang đăng nhập.

### Đăng xuất

Chọn **Đăng xuất** ở đầu trang bản đồ. Hộp thoại hỏi lại: **Ở lại** để hủy, **Xác nhận đăng xuất** để kết thúc phiên. Backend thu hồi phiên khi đăng xuất. Hiện chưa có xác minh email hoặc quên/đặt lại mật khẩu.

## 3. Bản đồ, tìm kiếm và bộ lọc

### Di chuyển và mở quán

1. Tại `/`, danh sách bên trái và bản đồ bên phải mặc định hiển thị quanh trung tâm Quận 1, TP.HCM.
2. Bấm thẻ quán hoặc ghim để mở chi tiết: địa chỉ, giá, số bàn/ghế, bãi xe, check-in, review và gợi ý lân cận. Bấm **Đóng** một lần để đóng.
3. Kéo bản đồ để chuyển khu vực. Địa điểm đã tải vẫn giữ ghim; bấm **Xem thêm địa điểm** để lấy trang kế tiếp. Khi thu nhỏ, nhiều ghim gom vào vòng tròn; bấm vòng tròn để phóng gần.
4. Bấm **Vị trí của tôi** để xin quyền GPS, đánh dấu vị trí bằng chấm xanh và chuyển tâm tìm kiếm. Nếu từ chối quyền, bản đồ vẫn dùng được. Nút này **không** tự check-in.
5. **Chỉ đường đến địa điểm** mở Google Maps ở tab khác. Nếu đã lấy vị trí của mình, tọa độ đó được dùng làm điểm bắt đầu; nếu chưa, Google Maps hỏi điểm bắt đầu.
6. **Gợi ý quanh đây** hiện tối đa bốn địa điểm trong phạm vi 2 km theo đường chim bay; bấm để mở quán khác. Đây chưa phải AI cá nhân hóa.

### Tìm kiếm

Nhập tên hoặc địa chỉ ở ô **Tìm tên quán, địa chỉ…**. App lọc quán đã tải và tìm thêm trong toàn hệ thống ở **Quán khác trên hệ thống**. Tìm không phân biệt hoa/thường và dấu tiếng Việt; ví dụ nhập `ben thanh`. Bấm một kết quả để mở quán trên bản đồ.

### Bộ lọc và sắp xếp

| Điều khiển            | Tác dụng                                                                              |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Tất cả loại**       | Nhà hàng, cà phê, rạp phim.                                                           |
| **Tất cả món**        | Món Việt, món Âu, cà phê, tráng miệng.                                                |
| **Bán kính**          | 1, 3, 5 hoặc 10 km quanh tâm tìm kiếm.                                                |
| **Mọi mức giá**       | Bậc ₫ đến ₫₫₫₫; không phải giá món cụ thể.                                            |
| **Mọi đánh giá**      | Không lọc, từ 4 sao hoặc từ 4,5 sao. Điểm 0 hiện **Chưa có đánh giá**.                |
| **Mọi độ đông**       | Vắng, vừa, đông hoặc đầy theo snapshot chỗ ngồi.                                      |
| **Còn bàn**           | Chỉ quán có bàn/ghế trống, đang nhận khách và snapshot còn hiệu lực.                  |
| **Sắp xếp danh sách** | Gần nhất, đánh giá cao, giá thấp; khi tìm từ khóa, thứ tự khớp tìm kiếm được ưu tiên. |
| **Chỉ quán đã lưu**   | Chỉ hiện quán yêu thích trong dữ liệu bản đồ đã tải; cần đăng nhập.                   |

Chọn **Xóa bộ lọc** để xóa từ khóa và điều kiện mà vẫn giữ khu vực bản đồ. Nếu không thấy quán, bỏ bớt điều kiện, tăng bán kính hoặc chuyển về TP.HCM. Quán tài trợ có nhãn **Được tài trợ** và có thể được xếp trước trong chế độ mặc định; bản đồ Premium demo ẩn nội dung tài trợ.

## 4. Đọc tình trạng bàn, ghế và lịch sử

1. Mở quán và đọc **Độ đông**, **bàn/ghế còn trống**, **Thời gian chờ ước tính**. Rạp phim chỉ có ghế.
2. Đọc dòng nguồn: **Dữ liệu mô phỏng**, **Chủ địa điểm cập nhật** hoặc **Hệ thống quản lý cập nhật**, thời điểm và độ tin cậy nếu có.
3. **Dữ liệu chỗ ngồi đã cũ** nghĩa là snapshot hết hạn; số bên cạnh là lần ghi nhận trước. **Chưa có dữ liệu chỗ ngồi** nghĩa là app chưa biết. **Hiện chưa nhận thêm khách** nghĩa là quán tắt nhận khách trong snapshot.
4. Chọn **Xem lịch sử chỗ ngồi 24 giờ** để mở tối đa 10 bản ghi gần nhất, mỗi dòng có thời điểm, độ đông, số chỗ và nguồn; chọn **Ẩn lịch sử chỗ ngồi** để thu gọn. Lịch sử không dự báo tương lai.

Snapshot chủ quán nhập thủ công hết hiệu lực sau 10 phút. Snapshot demo có hạn dài hơn để thử bộ lọc. Số bàn/ghế không tự bị trừ khi khách đặt bàn hoặc check-in.

## 5. Tìm bãi đỗ xe

1. Mở chi tiết quán và kéo đến **Bãi đỗ xe gần đây**. App tìm bãi trong phạm vi 1,5 km; nếu không có kết quả sẽ hiện thông báo.
2. Mỗi thẻ ghi bãi của địa điểm/đối tác/công cộng, khoảng cách, xe máy/ô tô, giá theo giờ/lượt hoặc miễn phí, số chỗ và độ mới dữ liệu.
3. Dùng **Mọi loại xe**, **Còn chỗ mới**, **Mở 24 giờ**, **Miễn phí**. **Còn chỗ mới** loại bản ghi cũ hoặc không rõ số chỗ.
4. Bấm một bãi để xem ghi chú lối vào và thời điểm cập nhật. Nếu có nhiều bãi, bấm **Xem tất cả** hoặc **Thu gọn**.
5. Chọn **Chỉ đường đến bãi xe** để mở Google Maps. Khoảng cách trong SeatNow là đường chim bay, không phải quãng đường lái xe.

App chưa nhận đặt/giữ chỗ gửi xe. Bãi seed cũng là dữ liệu mô phỏng.

## 6. Check-in và tín hiệu cộng đồng

Check-in xác nhận **bạn đang gần tọa độ quán**. Nó khác nút **Vị trí của tôi**, và khác dữ liệu bàn/ghế do quán cung cấp.

1. Đăng nhập, mở chi tiết địa điểm và kéo đến **Check-in cộng đồng**.
2. Bấm **Check-in tại đây**, cho phép trình duyệt truy cập vị trí và chờ GPS. App không lưu tọa độ bạn gửi trong bản ghi check-in.
3. Backend chỉ chấp nhận khi độ chính xác GPS **không quá 100 m** và vị trí cách tọa độ quán **không quá 150 m**. Thành công sẽ hiện **Đã ghi nhận check-in của bạn**; số tài khoản trong giờ qua được tải lại.
4. Mỗi tài khoản chỉ được ghi một lần tại cùng quán trong một cửa sổ ba giờ. Bấm lại có thể được xem là ghi trùng, nên số người không tăng.
5. Tín hiệu từ số tài khoản duy nhất trong giờ qua: **chưa có dữ liệu** (0), **ít** (1–2), **vừa** (3–5), **nhiều** (từ 6). Đây là tự báo cáo, không đại diện chắc chắn cho tổng số khách và **không sửa số bàn trống**.

**Nếu bấm rồi thấy “Bạn cần ở gần địa điểm để check-in”:** thao tác đã gửi lên API nhưng bị từ chối vì GPS cách tọa độ quán quá 150 m; số check-in không đổi. Với phần lớn quán seed hư cấu ở TP.HCM, bạn sẽ gặp tình huống này dù đang ở một quán thật có tên tương tự. Hiện app **chưa có chế độ check-in mô phỏng không cần GPS**. Để kiểm thử thành công, dùng địa điểm có tọa độ thật gần thiết bị và đã được admin duyệt, hoặc chạy integration test check-in trên cơ sở dữ liệu test riêng. Không nhập/chỉnh GPS giả rồi trình bày như check-in thật.

Nếu trình duyệt báo không lấy được vị trí, kiểm tra quyền Location cho trang, dùng `localhost` hoặc HTTPS và thử ở nơi GPS ổn định. Nếu báo vị trí chưa đủ chính xác, đợi GPS ổn định hơn rồi thử lại.

## 7. Review, ảnh, lưu quán và theo dõi

### Viết, sửa, xóa review

1. Đăng nhập, mở quán và kéo đến **Review cộng đồng**.
2. Chọn **Đánh giá** từ 1 đến 5 sao. **Nhận xét** có thể bỏ trống, tối đa 500 ký tự.
3. Có thể chọn **Ảnh thực tế** JPEG, PNG hoặc WebP, tối đa 2 MB. Bấm **Gửi đánh giá**. Điểm quán cập nhật từ review công khai.
4. Mỗi tài khoản có một review tại mỗi quán. Khi mở lại, form điền điểm và nội dung cũ; chỉnh rồi bấm **Cập nhật đánh giá**. Chọn ảnh mới để thay ảnh cũ; nếu không chọn, ảnh cũ giữ nguyên.
5. Để xóa, bấm **Xóa đánh giá của tôi** rồi **Xác nhận xóa**. **Giữ đánh giá** hủy thao tác. Xóa review cũng xóa ảnh.
6. Review công khai ở dưới form có tác giả, sao, nội dung, ảnh và ngày đăng. Bấm **Xem thêm review** để tải tiếp. Bấm **Báo cáo review** của người khác để gửi báo cáo; báo cáo không tự ẩn review.

Nếu review lưu thành công nhưng tải ảnh lỗi, app hiện thông báo riêng. Khi đó review chữ/sao đã tồn tại; chọn ảnh hợp lệ và cập nhật lại, không tạo review thứ hai.

### Ảnh được lưu ở đâu?

Ảnh tải lên được backend chuyển thành **WebP** và lưu trực tiếp trong **MongoDB**, không ghi vào `frontend/public` hay thư mục upload trên máy. Ảnh review ở collection `review_photos` (gắn với review), logo ở `venue_logos`, ảnh bìa ở `venue_covers`. Ảnh chứng minh quyền quản lý nằm tạm trong `business_claims`, chỉ admin đọc được và bị xóa sau khi duyệt hoặc từ chối. Khi trình duyệt cần ảnh, backend trả qua URL API `/api/v1/reviews/:id/photo`, `/api/v1/venues/:slug/logo` hoặc `/api/v1/venues/:slug/cover`. Bản đồ nền lấy tile từ dịch vụ bản đồ cấu hình riêng; seed 100 quán không tự tạo ảnh quán.

### Lưu, chia sẻ, theo dõi

- Trong chi tiết quán, chọn **Lưu quán** hoặc **Bỏ lưu**. Mở **Quán đã lưu** ở header để xem mọi quán đã lưu, kể cả ngoài khu vực bản đồ đang tải; từ đây có thể **Xem trên bản đồ** hoặc **Bỏ lưu**.
- Chọn **Chia sẻ địa điểm** để sao chép liên kết mở đúng quán/tọa độ. Dán liên kết vào trình duyệt khác để thử. Trình duyệt cần cho phép Clipboard; nếu không app báo lỗi.
- Bấm tên tác giả review để mở hồ sơ công khai `/users/:id`; hồ sơ có tên, số người theo dõi và review công khai, không hiện email. Bấm **Theo dõi** hoặc **Bỏ theo dõi** khi đã đăng nhập.
- Trang **Đang theo dõi** hiện danh sách tài khoản và tối đa 20 review công khai mới nhất từ tối đa 100 tài khoản được theo dõi gần đây. Bấm **Xem quán trên bản đồ** ở thẻ review để trở lại quán.

## 8. Đề xuất địa điểm mới

Luồng này dành cho **quán chưa có trên hệ thống**. Nếu quán đã có và bạn muốn sửa hồ sơ, xem mục 10 để gửi yêu cầu nhận quản lý.

1. Đăng nhập và chọn **Đề xuất quán** trên header hoặc mở `/proposals`.
2. Trong **Thêm địa điểm**, nhập tên (3–100 ký tự), loại nhà hàng/cà phê/rạp phim, loại món nếu phù hợp, địa chỉ (5–200 ký tự), mô tả (10–500 ký tự), mức giá ₫–₫₫₫₫.
3. Chọn tọa độ bằng cách bấm bản đồ nhỏ, kéo ghim, bấm **Dùng vị trí của tôi** hoặc nhập **Vĩ độ/Kinh độ**. Kiểm tra ghim trước khi gửi; tọa độ được dùng để hiển thị và kiểm tra check-in.
4. Chọn **Gửi đề xuất**. Thành công nghĩa là đề xuất đã lưu, **chưa xuất hiện trên bản đồ**. Một tài khoản gửi tối đa năm đề xuất trong 24 giờ.
5. Xem **Đề xuất của tôi**: **Chờ cộng đồng xác nhận (0/3, 1/3, 2/3)** → **Đủ xác nhận, chờ người vận hành duyệt** → **Đã duyệt và lên bản đồ** hoặc **Đã bị từ chối**.
6. Ba tài khoản **khác người đề xuất** mở **Đang chờ xác nhận** và bấm **Xác nhận địa điểm này**. Mỗi tài khoản chỉ được tính một lượt. Sau lượt thứ ba, đề xuất vào tab **Quán cộng đồng** của admin.
7. Admin kiểm tra và duyệt; người gửi quay lại **Đề xuất của tôi**, rồi bấm **Xem trên bản đồ**. Nếu admin từ chối, quán không xuất hiện trên bản đồ.

Ba lượt xác nhận là tín hiệu cộng đồng, chưa chứng minh địa chỉ đúng hoặc quán đang hoạt động. Người vận hành cần kiểm tra thông tin trước khi duyệt.

## 9. Gửi và theo dõi yêu cầu đặt bàn

### Người dùng gửi yêu cầu

1. Đăng nhập, mở **nhà hàng hoặc quán cà phê** rồi kéo trong chi tiết xuống **Yêu cầu đặt bàn**, ngay sau phần tình trạng/lịch sử chỗ ngồi và trước check-in. Chỉ quán đã được chủ quán bật **Nhận yêu cầu đặt bàn** mới hiện form và nút **Gửi yêu cầu**; rạp phim không có form. Nếu quán chưa bật, phần này giải thích rõ **Quán này chưa mở nhận yêu cầu đặt bàn** và dẫn chủ quán đến trang quản lý.
2. Chọn **Bắt đầu (giờ đến)** từ ít nhất một giờ tới và không quá 14 ngày. Ô **Kết thúc (giờ rời quán)** được gợi ý sau 2 giờ; có thể chỉnh để lượt kéo dài 30 phút đến 4 giờ. Chọn **Số khách** 1–12 và **Ghi chú** nếu cần (tối đa 500 ký tự).
3. Chọn **Gửi yêu cầu**. Trạng thái đầu tiên là **Chờ xác nhận**. Đây **chưa phải bàn đã giữ**; chủ quán xác nhận hoặc từ chối thủ công. Một tài khoản không gửi trùng giờ bắt đầu tại cùng quán. Nếu quán hiện hết bàn, app cảnh báo; bạn vẫn có thể xin giờ khác vì số bàn hiện tại không dự báo chỗ trong tương lai.
4. Mở **Đặt bàn của tôi** hoặc `/bookings` để xem giờ bắt đầu–kết thúc, tên quán, số khách, ghi chú, nhãn **Ưu tiên Premium** nếu có. Dùng **Tất cả**, **Chờ xác nhận**, **Đã xác nhận**, **Đã kết thúc** để lọc. Chọn **Xem quán trên bản đồ** để trở lại quán.
5. Nếu yêu cầu đang chờ hoặc đã xác nhận và cần hủy, bấm **Hủy yêu cầu** → **Xác nhận hủy**. **Giữ yêu cầu** quay lại. Yêu cầu đã đón khách/từ chối/đã hủy không thể hủy tiếp.

| Trạng thái       | Ý nghĩa                                              |
| ---------------- | ---------------------------------------------------- |
| **Chờ xác nhận** | Quán chưa quyết định, chưa giữ bàn.                  |
| **Đã xác nhận**  | Chủ quán chấp nhận; app chặn vượt tổng bàn/ghế đã biết do các lượt đặt trùng giờ trong app, nhưng chưa đồng bộ số bàn thực tế. |
| **Quán từ chối** | Quán không nhận yêu cầu.                             |
| **Đã hủy**       | Người dùng đã xác nhận hủy.                          |
| **Đã đón khách** | Chủ quán đã ghi nhận khách đến; không thể hủy.       |

Premium demo chỉ giúp yêu cầu xếp trước trong hàng chờ, không bảo đảm quán nhận. App chưa gửi email/SMS/push khi trạng thái đổi, nên mở **Đặt bàn của tôi** để kiểm tra.

## 10. Trang dành cho chủ quán

### Xin quyền quản lý quán có sẵn

1. Đăng nhập bằng tài khoản sẽ dùng để quản lý. Mở quán trên bản đồ và bấm **Bạn là chủ quán này?**; app tới `/business/claims` và điền sẵn **Slug địa điểm**. Bạn cũng có thể mở **Quản lý quán** trên header, rồi chọn **Yêu cầu quyền**.
2. Trong **Yêu cầu quản lý quán**, viết **Thông tin chứng minh quyền quản lý** từ 20–300 ký tự: cách người vận hành đối chiếu bạn với quán, giấy tờ hoặc thông tin liên hệ.
3. Có thể chọn **Ảnh giấy tờ hoặc hình chứng minh** JPEG/PNG/WebP tối đa 3 MB. Ảnh chỉ dành cho người vận hành, không hiện công khai; sau khi duyệt/từ chối sẽ bị xóa khỏi yêu cầu.
4. Bấm **Gửi yêu cầu**. Xem **Yêu cầu của tôi**: **Chờ duyệt**, **Đã duyệt** hoặc **Từ chối**. Chỉ biết slug không đủ để sửa quán.
5. Sau khi admin duyệt, vào lại `/business`, bấm **Cập nhật trạng thái** nếu cần. Kiểm tra dòng **Đang đăng nhập**: quyền gắn với **đúng email đã gửi yêu cầu**. Quán được duyệt ở **Địa điểm đang quản lý**; chọn **Đặt bàn**, **Tương tác** hoặc **Hồ sơ** để mở trang tương ứng.

### Điều hướng khu vực chủ quán

- Header của `/business` có **Tổng quan** và **Yêu cầu quyền**. Khi tài khoản đã được duyệt, header thêm các nút theo quán đang chọn: **Đặt bàn**, **Tương tác**, **Hồ sơ**. Gói Premium có thêm **Chỗ trống**, **Thống kê**, **Ưu đãi**. Mỗi nút mở một trang riêng; có thể lưu URL hoặc tải lại trang.
- Nếu quản lý nhiều quán, dùng **Chi nhánh** trên header để đổi quán. App giữ cùng mục đang xem nếu quán mới hỗ trợ mục đó. Trang **Tổng quan** liệt kê các quán và có nút đi thẳng đến từng công việc.
- **Về trang chính** quay lại bản đồ. Yêu cầu nhận quyền mới luôn nằm ở **Yêu cầu quyền**, không nằm cuối trang quản lý quán.

### Công cụ gói Cơ bản (Free Business)

- **Tương tác khách hàng:** số tài khoản check-in trong giờ qua, tín hiệu tự báo cáo, năm review công khai gần nhất và ảnh. Chọn **Làm mới**; bấm **Xem trang quán và tất cả đánh giá** để xem hết.
- **Hồ sơ quán:** sửa tên, địa chỉ, mô tả, giờ mở cửa, menu tóm tắt, mức giá; bấm **Lưu hồ sơ**. Thông tin mới hiện công khai sau khi tải lại.
- **Logo:** chọn JPEG/PNG/WebP tối đa 2 MB rồi bấm **Cập nhật logo**. Logo hiện ở thẻ quán, chi tiết và ghim khi dữ liệu cập nhật.
- **Yêu cầu đặt bàn:** mở **Đặt bàn** của nhà hàng/cà phê trên header. Chọn **Nhận yêu cầu đặt bàn** rồi bấm **Lưu cài đặt**; đổi checkbox mà chưa lưu thì khách vẫn chưa thấy form gửi. Hàng chờ hiện giờ đến–rời; bấm **Xác nhận** hoặc **Từ chối**. Nếu các lượt đã xác nhận chồng giờ dùng hết tổng bàn/ghế được ghi nhận, nút xác nhận báo hết chỗ; hãy từ chối hoặc trao đổi giờ khác. Khi khách thực sự tới, bấm **Đánh dấu đã đón khách** → **Xác nhận đã đón**; **Chưa đón khách** hủy bước này. Kiểm tra khả năng phục vụ thực tế vì snapshot bàn trống chưa phải inventory đặt bàn.
- Một tài khoản có thể quản lý nhiều quán đã được duyệt, chọn **Chi nhánh** để chuyển quán.

### Công cụ Premium Business trong bản demo

Người vận hành cấp gói cho từng quán bằng API nội bộ, có ngày hết hạn; chưa có nút mua gói. Khi còn Premium, header quản lý hiện thêm các trang:

1. **Cập nhật chỗ trống:** nhập tổng/còn trống bàn và ghế, độ đông, thời gian chờ 0–240 phút, trạng thái **Đang nhận khách**, rồi bấm **Cập nhật chỗ trống**. Rạp phim chỉ nhập ghế. Số liệu có nguồn **Chủ địa điểm cập nhật** và tự cũ sau 10 phút.
2. **Thống kê:** lượt mở trang chi tiết 7 ngày, tỷ lệ lấp đầy trung bình và khung giờ lấp đầy cao. Lượt mở không phải số người duy nhất; tỷ lệ lấy từ snapshot, có thể gồm dữ liệu mẫu.
3. **Ảnh bìa:** chọn JPEG/PNG/WebP tối đa 2 MB rồi bấm **Cập nhật ảnh bìa**.
4. **Ưu đãi giờ vắng:** nhập nội dung ít nhất 10 ký tự, giờ bắt đầu/kết thúc, tùy chọn **Đẩy lên đầu danh sách được tài trợ**, rồi bấm **Lên lịch ưu đãi**. Nội dung hiện trong app đúng lịch và có nhãn **Được tài trợ** nếu đẩy vị trí. Bấm **Tắt ưu đãi hiện tại** để gỡ.
5. **Huy hiệu xác thực:** xuất hiện với quán có quyền quản lý đã duyệt và gói Premium còn hiệu lực.

App chưa tự phát push “còn nhiều bàn trống”, chưa có mã voucher thật, tích hợp POS hoặc hệ thống nhân viên/chuỗi nhiều vai trò. Dòng **Còn nhiều bàn trống** trên thẻ quán chỉ hiện khi snapshot phù hợp và còn mới.

## 11. Trang xét duyệt admin

Tài khoản admin được tạo riêng bằng lệnh ở mục 15. Sau khi đăng nhập trực tiếp, app đưa đến `/admin`; hoặc chọn **Xét duyệt** ở header. Người dùng thường mở đường dẫn này sẽ thấy không có quyền.

### Tab Chủ quán

1. Mở tab **Chủ quán**, bấm **Làm mới** nếu người gửi vừa tạo yêu cầu.
2. Đọc tên/slug quán, tên và email người gửi, nội dung chứng minh, ảnh đính kèm riêng tư nếu có. Đối chiếu ngoài hệ thống trước khi cấp quyền.
3. Bấm **Duyệt** hoặc **Từ chối**. Đọc câu xác nhận rồi bấm **Xác nhận**; **Hủy** trở về thẻ mà không quyết định.
4. Yêu cầu rời hàng chờ. Chủ quán đăng nhập lại bằng email đã gửi, vào `/business` và bấm **Cập nhật trạng thái** nếu trang đã mở sẵn.

### Tab Quán cộng đồng

1. Chỉ đề xuất **đã đủ ba tài khoản khác xác nhận** xuất hiện ở tab này. Nếu trống, kiểm tra **Đang chờ xác nhận** trên `/proposals`; admin không thể duyệt đề xuất chưa đủ lượt qua giao diện.
2. Đọc loại quán, tên, địa chỉ, người gửi, email, loại món, mức giá, mô tả và số lượt xác nhận. Bấm **Kiểm tra vị trí** để mở tọa độ trên Google Maps.
3. Sau khi đối chiếu, bấm **Duyệt** hoặc **Từ chối** rồi **Xác nhận**. Quán được duyệt lên bản đồ; người gửi thấy trạng thái ở **Đề xuất của tôi**.

Nút **Về bản đồ** ở đầu trang đưa về trang chính. Trang admin hiện chưa có hàng chờ báo cáo review; phần đó xử lý qua API nội bộ theo [runbook](runbooks/local-demo.md).

## 12. Gói người dùng và quyền Premium demo

Chọn **Gói người dùng** hoặc mở `/plans`. Trang so sánh Free và Premium, và khi đã đăng nhập hiện **Gói hiện tại**.

- **Free đang dùng được:** bản đồ/lọc, tình trạng chỗ ngồi, bãi xe, check-in, review, lưu quán và gửi yêu cầu đặt bàn ở quán hỗ trợ.
- **Premium demo đang dùng được:** yêu cầu đặt bàn có nhãn ưu tiên và xếp trước trong hàng chờ của chủ quán; bản đồ ẩn quảng cáo/vị trí tài trợ.
- **Chưa dùng được:** giữ chỗ gửi xe trước, voucher độc quyền và AI gợi ý nâng cao. Trang ghi **Sắp ra mắt**. Premium **chưa mở bán** và không có thanh toán.

Người vận hành có thể cấp Premium cho **tài khoản người dùng** bằng script local `seed:premium` và cho **quán** bằng API nội bộ; đây là hai gói khác nhau. Cấp Premium user không tự nâng gói quán, và ngược lại.

## 13. Kịch bản demo từ đầu đến cuối

### A. Khám phá và đánh giá (một tài khoản)

1. Mở bản đồ, chọn quán tại TP.HCM. Thử lọc **Cà phê**, **3 km**, **Còn bàn**; xem nguồn và thời điểm snapshot.
2. Mở bãi xe, lọc **Xe máy**, bấm một bãi để xem giá và số chỗ.
3. Đăng ký tài khoản thử, chọn **Lưu quán**, viết review 4–5 sao và ảnh nhỏ hơn 2 MB. Mở **Quán đã lưu** để kiểm tra.
4. Bấm tên người viết review khác, **Theo dõi** và kiểm tra **Đang theo dõi**.

### B. Chủ quán nhận quyền và đặt bàn (tài khoản khách, chủ quán, admin)

1. Chủ quán đăng nhập, mở quán ăn/cà phê trên bản đồ, bấm **Bạn là chủ quán này?**, gửi yêu cầu kèm thông tin chứng minh.
2. Admin vào `/admin` → **Chủ quán**, kiểm tra rồi duyệt. Chủ quán mở `/business`, bấm **Cập nhật trạng thái**, chọn **Đặt bàn** trên header, bật **Nhận yêu cầu đặt bàn** rồi bấm **Lưu cài đặt**; chọn **Hồ sơ** để sửa thông tin/logo.
3. Khách đăng nhập tài khoản khác, mở quán đó, chọn giờ và số khách, bấm **Gửi yêu cầu**. Kiểm tra **Đặt bàn của tôi** đang **Chờ xác nhận**.
4. Chủ quán vào hàng chờ, bấm **Xác nhận**. Khách tải lại danh sách để thấy **Đã xác nhận**. Chủ quán chỉ ghi nhận **Đã đón khách** sau khi khách tới.

### C. Đề xuất quán mới (ít nhất bốn tài khoản thường và admin)

1. Tài khoản A gửi địa điểm tại `/proposals`, xác nhận tọa độ và xem trạng thái 0/3.
2. Tài khoản B, C, D lần lượt bấm **Xác nhận địa điểm này**. A không thể tự xác nhận; mỗi người chỉ được tính một lượt.
3. Admin mở `/admin` → **Quán cộng đồng**, kiểm tra nội dung/vị trí rồi duyệt.
4. A mở **Đề xuất của tôi** → **Xem trên bản đồ**. Quán mới lên bản đồ, nhưng chỗ ngồi/bãi xe có thể chưa có dữ liệu.

### D. Kiểm thử check-in

Chỉ demo check-in thành công với địa điểm thật có tọa độ đã lưu trong SeatNow và thiết bị đang ở gần. 100 quán seed dùng thử bản đồ/bộ lọc/review/đặt bàn, **không phải địa điểm để đi tới check-in**. Với demo kỹ thuật không cần GPS thật, chạy integration test trên database test riêng; đừng trình bày lượt check-in giả là tín hiệu ngoài đời.

## 14. Xử lý lỗi thường gặp

| Hiện tượng                                                | Cách kiểm tra và xử lý                                                                                                                                                                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bản đồ chỉ có màu nền, danh sách quán vẫn hiện            | Tải lại trang. Kiểm tra mạng/tile style (`VITE_MAP_STYLE_URL`) và `MAP_ASSET_ORIGINS`; nếu tile không truy cập được, vẫn dùng danh sách quán.                                                                                                      |
| Không có quán sau khi bật **Còn bàn**                     | Bỏ bộ lọc khác, tăng bán kính, chuyển tâm về TP.HCM. Bộ lọc chỉ nhận snapshot còn hiệu lực và đang nhận khách; nếu demo cũ, chạy lại `seed:demo`.                                                                                                  |
| Bấm **Vị trí của tôi** không có chấm xanh                 | Cấp quyền Location cho `localhost`/HTTPS, kiểm tra GPS, rồi bấm lại. Thông báo dưới bộ lọc cho biết lỗi quyền hoặc timeout.                                                                                                                        |
| Bấm **Check-in tại đây** rồi báo “Bạn cần ở gần địa điểm” | API từ chối vì cách tọa độ quán hơn 150 m. Số check-in không đổi. Quán seed thường hư cấu; đọc mục 6.                                                                                                                                              |
| Check-in báo GPS chưa đủ chính xác                        | Độ chính xác trình duyệt báo lớn hơn 100 m. Đợi GPS ổn định rồi thử.                                                                                                                                                                               |
| Chủ quán đã được duyệt nhưng chưa thấy quán               | Mở `/business`, bấm **Cập nhật trạng thái**, kiểm tra email đang đăng nhập có đúng email gửi yêu cầu không; tải lại trang nếu cần.                                                                                                                 |
| Không thấy nút **Gửi yêu cầu** trong chi tiết quán        | Rạp phim không hỗ trợ đặt bàn. Với nhà hàng/cà phê, phần **Yêu cầu đặt bàn** sẽ báo nếu chủ quán chưa bật **Nhận yêu cầu đặt bàn**. Chủ quán đã được admin duyệt mở `/business`, chọn **Đặt bàn** trên header, bật ô này và bấm **Lưu cài đặt**; sau đó khách tải lại chi tiết. |
| Gửi yêu cầu đặt bàn rồi chưa có bàn                       | **Chờ xác nhận** là yêu cầu, chưa giữ inventory. Chờ chủ quán xác nhận trên `/business`.                                                                                                                                                           |
| Tab admin **Quán cộng đồng** trống                        | Chưa có đề xuất đủ ba lượt xác nhận của ba tài khoản khác người gửi.                                                                                                                                                                               |
| Review có sao/chữ nhưng chưa có ảnh                       | Ảnh tải riêng sau review; nếu bước ảnh lỗi, chọn lại JPEG/PNG/WebP dưới 2 MB và cập nhật đánh giá.                                                                                                                                                 |
| Phiên đăng nhập mất sau khi khởi động lại API             | Đăng nhập lại; giữ `JWT_SECRET` cố định trong `backend/.env` khi chạy local.                                                                                                                                                                       |
| Có thông báo không tải được dữ liệu                       | Bấm **Thử lại** nếu có; kiểm tra API tại `http://localhost:3000/health`, MongoDB Docker và tab Network của trình duyệt.                                                                                                                            |

## 15. Khởi động và chuẩn bị dữ liệu local

Yêu cầu **Node.js 20.19+**, npm và Docker Desktop. Chạy từ thư mục gốc của repository trong PowerShell. Chỉ sao chép `.env.example` **lần đầu**; nếu đã có `backend/.env` thì giữ cấu hình hiện tại, đặc biệt `JWT_SECRET`.

```powershell
docker compose -f infra/compose.yaml up -d
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
# Chỉnh JWT_SECRET trong backend/.env thành chuỗi ngẫu nhiên dài ít nhất 32 ký tự.
cd backend
npm ci
npm run build
npm run seed:demo
npm run start:dev
```

Mở terminal thứ hai ở thư mục gốc:

```powershell
cd frontend
npm ci
npm run dev
```

Mở **http://localhost:5173**. Nếu muốn dùng một cổng sau khi build frontend, chạy `npm run build` ở `frontend`, rồi `npm start` ở `backend`; mở **http://localhost:3000**. Đừng chạy hai backend cùng chiếm cổng 3000.

### Tạo tài khoản admin cho demo

Trong `backend/.env.admin` (được Git bỏ qua), đặt `ADMIN_EMAIL` và `ADMIN_PASSWORD` ngẫu nhiên dài ít nhất 20 ký tự. Từ thư mục `backend`, chạy `npm run build` rồi `npm run admin:create`. Đăng nhập bằng email/mật khẩu đó. Script không biến tài khoản thường đã tồn tại thành admin; dùng email riêng. Không chép mật khẩu vào README, ảnh chụp màn hình hoặc commit.

### Cấp Premium demo

Cho **người dùng**, sau khi đăng ký tài khoản local:

```powershell
cd backend
$env:SEED_PREMIUM_EMAIL='email-tai-khoan-thu@example.com'
npm run seed:premium
```

Cho **quán đã được admin duyệt quyền quản lý**, cấu hình `BUSINESS_ADMIN_TOKEN` ở backend và dùng endpoint nội bộ như [runbook](runbooks/local-demo.md#business-owner-demo). Script `seed:premium` chỉ dành cho local/test và bị khóa ở production.

### Kiểm tra nhanh sau khi chạy

1. Mở `http://localhost:3000/health` để kiểm tra API/MongoDB; mở trang chủ để thấy bản đồ và danh sách quán.
2. Chọn quán, xem tình trạng chỗ ngồi, bãi xe và review.
3. Đăng ký tài khoản thử, lưu quán và viết review. Kiểm tra review xuất hiện sau khi gửi.
4. Nếu cần test tự động, xem lệnh trong [README](../README.md#chạy-demo-local). Integration test dùng database `seatnow_test_*` và xóa database tạm sau khi chạy.

Phần vận hành nâng cao như dựng lại projection, ingest snapshot, backup/restore và kiểm duyệt báo cáo review nằm trong [runbook local](runbooks/local-demo.md).

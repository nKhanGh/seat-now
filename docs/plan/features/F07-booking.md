# F07 — Yêu cầu đặt bàn tại quán đối tác

Trạng thái: **demo** ngày 19/11/2026. [OpenAPI](../../../contracts/openapi/booking.json), React UI và MongoDB integration test đã có.

## Luồng

1. Chủ quán đã được duyệt quyền quản lý bật “Nhận yêu cầu đặt bàn” cho từng nhà hàng/quán cà phê. Mặc định tắt. Rạp phim không hỗ trợ luồng đặt bàn này.
2. Người dùng đăng nhập chọn giờ bắt đầu từ 1 giờ đến 14 ngày tới, giờ kết thúc sau đó 30 phút đến 4 giờ, số khách 1–12 và ghi chú tùy chọn. Hệ thống tạo yêu cầu `PENDING`; một tài khoản không thể gửi trùng giờ bắt đầu tại cùng quán. Yêu cầu cũ chưa có giờ kết thúc được hiển thị như lượt 2 giờ.
3. Yêu cầu của người dùng Premium được gắn `priority` theo entitlement backend và đứng trước trong hàng chờ chủ quán. Tài khoản Free vẫn gửi được yêu cầu thường.
4. Chủ quán xác nhận hoặc từ chối thủ công. Trước khi xác nhận, backend đếm các lượt `CONFIRMED`/`COMPLETED` chồng khung giờ; nếu đã dùng hết tổng bàn hoặc tổng ghế trong snapshot gần nhất, API trả 409 và chủ quán cần từ chối hoặc trao đổi giờ khác. Hủy lượt đã xác nhận giải phóng sức chứa cho khung giờ. Sau khi thực sự đón khách, chủ quán đánh dấu `CONFIRMED → COMPLETED` qua bước xác nhận trong UI. Người dùng xem trạng thái trong “Đặt bàn của tôi” và có thể hủy yêu cầu đang chờ hoặc đã xác nhận, nhưng không thể hủy khi đã hoàn tất.
5. Danh sách của người dùng trả thêm tên và tọa độ quán bằng một truy vấn theo các slug đã đặt, để hiển thị tên dễ nhận biết và mở lại đúng quán trên bản đồ. Nếu quán đã bị xóa, danh sách vẫn giữ slug làm thông tin dự phòng.
6. UI cho người dùng lọc danh sách đã tải theo tất cả, chờ xác nhận, đã xác nhận hoặc đã kết thúc (`COMPLETED`, `CANCELED`, `DECLINED`); lỗi tải có nút thử lại. Giờ đến không tự đổi trạng thái.
7. Hủy từ UI cần một bước xác nhận tại đúng thẻ đặt bàn để tránh thao tác nhầm; API vẫn xác thực chủ sở hữu yêu cầu và chỉ cho hủy `PENDING`/`CONFIRMED`.
8. Hàng chờ chủ quán giữ yêu cầu `PENDING` tối đa 2 giờ sau giờ đến và `CONFIRMED` tối đa 24 giờ sau giờ đến, để chủ quán còn thời gian ghi nhận đã đón khách. Việc chuyển trạng thái được kiểm tra nguyên tử trong MongoDB; chỉ chủ quán được duyệt mới có quyền.

## Giới hạn demo

- Yêu cầu `PENDING` chưa giữ bàn. Số bàn còn trống hiện tại từ F02 là snapshot tham khảo, không dự báo sức chứa ở giờ đặt trong tương lai. UI cảnh báo nếu hiện đã hết bàn nhưng vẫn cho gửi yêu cầu giờ khác. Bước xác nhận dùng **tổng bàn/ghế** gần nhất để chặn vượt sức chứa do các lượt trong app; nếu chưa có tổng sức chứa, chủ quán phải tự kiểm tra.
- Kiểm tra đồng thời chỉ được tuần tự hóa trong một tiến trình API. Nhiều instance backend, thay đổi sức chứa, khách vãng lai và POS chưa được đồng bộ; đây chưa phải inventory bảo đảm cho môi trường production.
- Chưa có thông báo push/email/SMS, thanh toán, đặt chỗ xe hay chính sách no-show. Người dùng theo dõi trạng thái trong app.
- Gói Premium demo được operator cấp theo F04, chưa mở thanh toán. `priority` chỉ thay đổi thứ tự hàng chờ, không bảo đảm chủ quán chấp nhận.

# F07 — Yêu cầu đặt bàn tại quán đối tác

Trạng thái: **demo** ngày 19/11/2026. [OpenAPI](../../../contracts/openapi/booking.json), React UI và MongoDB integration test đã có.

## Luồng

1. Chủ quán đã được duyệt quyền quản lý bật “Nhận yêu cầu đặt bàn” cho từng nhà hàng/quán cà phê. Mặc định tắt. Rạp phim không hỗ trợ luồng đặt bàn này.
2. Người dùng đăng nhập chọn thời gian từ 1 giờ đến 14 ngày tới, số khách 1–12 và ghi chú tùy chọn. Hệ thống tạo yêu cầu `PENDING`; một tài khoản không thể gửi trùng thời gian tại cùng quán.
3. Yêu cầu của người dùng Premium được gắn `priority` theo entitlement backend và đứng trước trong hàng chờ chủ quán. Tài khoản Free vẫn gửi được yêu cầu thường.
4. Chủ quán xác nhận hoặc từ chối thủ công. Sau khi thực sự đón khách, chủ quán đánh dấu `CONFIRMED → COMPLETED` qua bước xác nhận trong UI. Người dùng xem trạng thái trong “Đặt bàn của tôi” và có thể hủy yêu cầu đang chờ hoặc đã xác nhận, nhưng không thể hủy khi đã hoàn tất.
5. Danh sách của người dùng trả thêm tên và tọa độ quán bằng một truy vấn theo các slug đã đặt, để hiển thị tên dễ nhận biết và mở lại đúng quán trên bản đồ. Nếu quán đã bị xóa, danh sách vẫn giữ slug làm thông tin dự phòng.
6. UI cho người dùng lọc danh sách đã tải theo tất cả, chờ xác nhận, đã xác nhận hoặc đã kết thúc (`COMPLETED`, `CANCELED`, `DECLINED`); lỗi tải có nút thử lại. Giờ đến không tự đổi trạng thái.
7. Hủy từ UI cần một bước xác nhận tại đúng thẻ đặt bàn để tránh thao tác nhầm; API vẫn xác thực chủ sở hữu yêu cầu và chỉ cho hủy `PENDING`/`CONFIRMED`.
8. Hàng chờ chủ quán giữ yêu cầu `PENDING` tối đa 2 giờ sau giờ đến và `CONFIRMED` tối đa 24 giờ sau giờ đến, để chủ quán còn thời gian ghi nhận đã đón khách. Việc chuyển trạng thái được kiểm tra nguyên tử trong MongoDB; chỉ chủ quán được duyệt mới có quyền.

## Giới hạn demo

- Yêu cầu `PENDING` chưa giữ bàn. Số bàn còn trống từ F02 là snapshot tham khảo, không phải inventory đặt bàn. Chủ quán phải kiểm tra khả năng phục vụ trước khi xác nhận; chưa có đồng bộ POS hay tự động chống overbooking.
- Chưa có thông báo push/email/SMS, thanh toán, đặt chỗ xe hay chính sách no-show. Người dùng theo dõi trạng thái trong app.
- Gói Premium demo được operator cấp theo F04, chưa mở thanh toán. `priority` chỉ thay đổi thứ tự hàng chờ, không bảo đảm chủ quán chấp nhận.

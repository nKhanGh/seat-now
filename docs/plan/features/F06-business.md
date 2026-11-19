# F06 — Quản lý địa điểm cho chủ quán

Trạng thái: **IN PROGRESS**. Triển khai sau F05 theo yêu cầu tiếp tục ngày 19/11/2026.

## Thứ tự triển khai

1. Xác minh quyền quản lý: tài khoản gửi yêu cầu quản lý venue; chỉ người vận hành dùng token nội bộ mới duyệt. Không cho tự nhận quyền bằng cách biết slug. Một venue có một chủ quản lý trong bản đầu.
2. Gói Basic: chủ quán xem danh sách venue của mình, cập nhật mô tả, giờ mở cửa, menu và khoảng giá; tải logo đã được kiểm tra và chuyển định dạng an toàn. Logo và hồ sơ xuất hiện công khai trên bản đồ/chi tiết.
3. Gói Premium: cấp gói bằng tác vụ nội bộ cho demo, không giả lập thanh toán. Chủ quán được cập nhật chỗ trống thủ công; nguồn dữ liệu hiển thị là `OPERATOR`, có thời điểm hết hạn. Huy hiệu xác thực chỉ xuất hiện nếu quyền quản lý đã duyệt và gói đang Premium.
4. Dashboard: số lượt xem trang quán, check-in và thống kê khung giờ từ dữ liệu đã được phép thu thập. Không suy ra occupancy chính xác từ lượt xem/check-in.
5. Sponsored và giờ vắng: nhãn quảng cáo rõ ràng, voucher có thời hạn và do chủ quán bật; không tự động gửi push trước khi có opt-in và hạ tầng thông báo.
6. Chuỗi đa chi nhánh: nhiều venue cùng chủ, danh sách tập trung; branding nâng cao được cấu hình theo từng chi nhánh.

## Quy tắc

- API chủ quán yêu cầu cookie session và kiểm tra owner ở backend cho từng venue.
- Claim, nâng gói và huy hiệu phải do operator duyệt; token nội bộ không xuất hiện trong frontend.
- API công khai chỉ trả dữ liệu hồ sơ cần hiển thị, không tiết lộ thông tin tài khoản chủ quán.
- Snapshot thủ công dùng ingestion hiện có, có nguồn, version, độ tin cậy và thời gian hết hạn; không ghi đè snapshot mới hơn.
- Mỗi lát cắt có MongoDB integration test, OpenAPI và hướng dẫn demo.

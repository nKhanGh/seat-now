# F05 — Cộng đồng địa điểm

Trạng thái: **IN PROGRESS**. Bắt đầu sau MVP F00–F04 theo yêu cầu mở rộng phạm vi ngày 19/11/2026.

## Thứ tự triển khai

1. Check-in tại venue: user đăng nhập, browser gửi vị trí khi bấm nút, server kiểm tra gần venue; lưu user/venue/thời điểm, không lưu tọa độ người dùng. Giới hạn một check-in mỗi venue trong cửa sổ ba giờ. Public summary chỉ đếm người dùng duy nhất trong giờ qua, ghi rõ nguồn tự báo cáo; không tự sửa `tablesAvailable` hoặc `crowdLevel` từ POS/chủ quán.
2. Favorites: user đăng nhập có thể lưu/bỏ lưu venue, xem danh sách của chính mình. Không để user khác đọc danh sách riêng.
3. Review ngắn và ảnh thực tế: nội dung có giới hạn, ảnh có kiểm tra loại/kích thước và lưu bền vững; có báo cáo/ẩn nội dung trước khi công bố rộng.
4. Theo dõi tài khoản và chia sẻ địa điểm: link chia sẻ công khai không chứa dữ liệu riêng; follow phải có kiểm soát spam và quyền riêng tư.
5. Đề xuất venue: lưu ở trạng thái chờ xác nhận; vote của cộng đồng không tự đưa venue lên bản đồ trước khi đạt ngưỡng/kiểm duyệt.

## Quy tắc chung

- Các API đọc bản đồ, chỗ ngồi và bãi xe vẫn thuộc gói FREE và không yêu cầu đăng nhập.
- Mutation cộng đồng yêu cầu phiên cookie; backend xác thực quyền và giới hạn tần suất.
- Không công bố lịch sử vị trí chính xác. User có thể xóa nội dung mình tạo theo chính sách retention sẽ chốt trước public launch.
- Dữ liệu cộng đồng phải phân biệt với dữ liệu cập nhật bởi chủ quán/POS; không dùng từ “realtime còn bàn” cho một check-in.
- Mỗi phần có MongoDB integration test, trạng thái loading/error/empty trên UI và contract API cập nhật cùng code.

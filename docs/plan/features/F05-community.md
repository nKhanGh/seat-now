# F05 — Cộng đồng địa điểm

Trạng thái: **DEMO COMPLETE** ngày 19/11/2026. Các chức năng cộng đồng đã có API, giao diện và MongoDB integration test; chưa mở đăng ký công khai.

## Thứ tự triển khai

1. Check-in tại venue: user đăng nhập, browser gửi vị trí khi bấm nút, server kiểm tra gần venue; lưu user/venue/thời điểm, không lưu tọa độ người dùng. Giới hạn một check-in mỗi venue trong cửa sổ ba giờ. Public summary chỉ đếm người dùng duy nhất trong giờ qua, ghi rõ nguồn tự báo cáo; không tự sửa `tablesAvailable` hoặc `crowdLevel` từ POS/chủ quán.
2. Favorites: user đăng nhập có thể lưu/bỏ lưu venue, xem danh sách của chính mình. Không để user khác đọc danh sách riêng.
3. Chấm 1–5 sao với nhận xét tùy chọn và ảnh thực tế: tối đa một đánh giá và một ảnh cho mỗi user/venue; ảnh JPEG/PNG/WebP tối đa 2 MB được chuyển thành WebP và bỏ metadata. Điểm sao trên bản đồ cập nhật theo các đánh giá công khai. Người đăng nhập có thể báo cáo review; API nội bộ xem hàng đợi và ẩn review/ảnh.
4. Theo dõi tài khoản và chia sẻ địa điểm: link chia sẻ công khai không chứa dữ liệu riêng; follow phải có kiểm soát spam và quyền riêng tư.
5. Đề xuất venue: lưu ở trạng thái chờ xác nhận; vote của cộng đồng không tự đưa venue lên bản đồ trước khi đạt ngưỡng/kiểm duyệt.

## Đầu ra đã triển khai

- Check-in xác thực khoảng cách trong 150 m và độ chính xác vị trí trong 100 m; chỉ giữ user/venue/thời gian trong 7 ngày. Số lượt một giờ là tín hiệu tự báo cáo, không tác động trực tiếp đến số bàn trống.
- Danh sách quán đã lưu chỉ cho chủ tài khoản đọc; review công khai có phân trang cursor và người viết tự xóa được.
- Hồ sơ công khai chỉ gồm tên hiển thị và số người theo dõi, không gồm email. Link chia sẻ dùng tọa độ venue công khai và slug.
- Đề xuất cần ba tài khoản khác nhau xác nhận, sau đó người vận hành duyệt bằng token nội bộ mới xuất hiện trên bản đồ. Người gửi theo dõi tiến độ và kết quả trong “Đề xuất của tôi”.
- Contract API: [community.json](../../../contracts/openapi/community.json). Quy trình kiểm duyệt: [local-demo.md](../../runbooks/local-demo.md).

## Quy tắc chung

- Các API đọc bản đồ, chỗ ngồi và bãi xe vẫn thuộc gói FREE và không yêu cầu đăng nhập.
- Mutation cộng đồng yêu cầu phiên cookie; backend xác thực quyền và giới hạn tần suất.
- Không công bố lịch sử vị trí chính xác. User có thể xóa nội dung mình tạo theo chính sách retention sẽ chốt trước public launch.
- Dữ liệu cộng đồng phải phân biệt với dữ liệu cập nhật bởi chủ quán/POS; không dùng từ “realtime còn bàn” cho một check-in.
- Mỗi phần có MongoDB integration test, trạng thái loading/error/empty trên UI và contract API cập nhật cùng code.
- Trước public launch cần quy định SLA kiểm duyệt, cách xử lý báo cáo sai và chính sách lưu/xóa nội dung; demo hiện duyệt qua API nội bộ.

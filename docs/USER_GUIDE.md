# Hướng dẫn sử dụng SeatNow

Tài liệu này mô tả **bản demo hiện tại**. Địa điểm, chỗ ngồi và bãi xe được seed để thử tính năng; dữ liệu mẫu không phản ánh tình trạng thực tế. Cách khởi động dự án nằm trong [README](../README.md#chạy-demo-local).

## 1. Bắt đầu

1. Mở trang chủ SeatNow. Bản đồ và danh sách mặc định hiển thị quanh trung tâm Quận 1, TP.HCM.
2. Chọn **Đăng ký**, nhập tên hiển thị, email, mật khẩu ít nhất 12 ký tự và xác nhận mật khẩu. Biểu tượng mắt dùng để hiện hoặc ẩn mật khẩu.
3. Nếu đã có tài khoản, chọn **Đăng nhập**. Các thao tác xem bản đồ, chỗ ngồi, bãi xe và gói dịch vụ dùng được khi chưa đăng nhập.
4. Dùng **Đăng xuất** ở thanh đầu trang khi muốn kết thúc phiên.

## 2. Tìm và xem địa điểm

- Nhập tên quán hoặc địa chỉ vào ô **Tìm tên quán, địa chỉ**. Tìm kiếm không phân biệt chữ hoa và dấu tiếng Việt, trong các địa điểm đã tải; chọn kết quả để chuyển bản đồ đến quán.
- Dùng bộ lọc **loại địa điểm**, **loại món**, **bán kính**, **mức giá**, **đánh giá**, **độ đông** hoặc **Còn bàn**. Danh sách bên trái và ghim trên bản đồ cùng cập nhật theo dữ liệu đã tải.
- Kéo bản đồ để đổi khu vực tìm kiếm. Chọn **Vị trí của tôi** để xin quyền vị trí và hiển thị chấm xanh. Nếu từ chối quyền, bản đồ vẫn sử dụng được với tâm hiện tại.
- Chọn thẻ trong danh sách hoặc ghim trên bản đồ để mở chi tiết. Trong đó có địa chỉ, thông tin bàn/ghế, thời gian chờ, bãi xe, đánh giá và gợi ý địa điểm gần đó. Chọn **Đóng** một lần để đóng chi tiết.
- Chọn **Xem thêm địa điểm** để tải trang kết quả tiếp theo. Ghim của các địa điểm đã tải vẫn còn khi kéo bản đồ.
- Mục **Gợi ý quanh đây** hiển thị tối đa bốn địa điểm trong phạm vi 2 km tính theo đường chim bay; chọn một gợi ý để mở địa điểm đó. Đây là gợi ý theo vị trí, chưa cá nhân hóa bằng AI.

**Đọc tình trạng chỗ ngồi:** “Dữ liệu cũ” nghĩa là bản ghi đã hết hiệu lực; số bàn/ghế bên cạnh chỉ là lần ghi nhận trước. “Chưa có dữ liệu” nghĩa là app chưa biết tình trạng hiện tại. Bộ lọc **Còn bàn** chỉ tính bản ghi còn hạn và đang nhận khách. Dữ liệu demo hết hạn sau 10 phút.

## 3. Xem bãi đỗ xe

Mở chi tiết một địa điểm, kéo xuống phần bãi đỗ xe. Lọc theo **loại xe**, **còn chỗ mới**, **mở 24 giờ** hoặc **miễn phí**. Chọn một bãi để xem thông tin giá, khoảng cách và trạng thái chỗ; kiểm tra dấu dữ liệu cũ trước khi di chuyển. Bản demo chưa hỗ trợ giữ chỗ gửi xe.

## 4. Đặt bàn tại quán có hỗ trợ

Đăng nhập, mở một quán ăn hoặc cà phê đã bật nhận yêu cầu rồi chọn thời gian đến, số khách và **Gửi yêu cầu**. Mở **Đặt bàn của tôi** để xem trạng thái. Chủ quán sẽ xác nhận hoặc từ chối thủ công; yêu cầu đang chờ **chưa giữ bàn**. Nếu không thấy mục đặt bàn trong chi tiết, quán đó chưa bật nhận yêu cầu.

## 5. Tham gia cộng đồng

Các thao tác sau cần đăng nhập:

- **Check-in:** mở địa điểm và chọn nút check-in khi đang ở gần quán. Lượt check-in là đóng góp từ cộng đồng, không xác nhận quán còn bàn.
- **Đánh giá:** trong phần **Review cộng đồng**, chọn 1–5 sao, viết nhận xét ngắn và có thể chọn ảnh JPEG, PNG hoặc WebP tối đa 2 MB. Chọn **Gửi đánh giá**. Có thể xóa đánh giá của mình hoặc báo cáo đánh giá của người khác.
- **Lưu và chia sẻ:** chọn lưu quán trong chi tiết, xem lại ở **Quán đã lưu**, hoặc chọn **Chia sẻ địa điểm** để lấy liên kết. Chọn tên tác giả review để xem hồ sơ và theo dõi người đó; các tài khoản đang theo dõi nằm ở **Đang theo dõi**.
- **Đề xuất địa điểm:** chọn **Đề xuất quán**, nhập thông tin và tọa độ rồi gửi. Theo dõi tiến độ trong **Đề xuất của tôi**. Địa điểm cần ba tài khoản khác xác nhận, sau đó người vận hành duyệt mới xuất hiện trên bản đồ. Đây là luồng thêm quán mới; nếu quán đã có trên bản đồ và bạn là chủ quán, dùng luồng **Chủ quán**.

## 6. Dành cho chủ quán

Đăng nhập, mở quán đã có trên bản đồ rồi chọn **Bạn là chủ quán này?** để gửi yêu cầu nhận quản lý. Sau khi người vận hành duyệt, quán xuất hiện trong danh sách quản lý. Gói cơ bản cho phép sửa hồ sơ và tải logo; các chức năng Premium demo gồm cập nhật chỗ ngồi thủ công, ảnh bìa, dashboard và ưu đãi theo lịch. Chủ quán có thể bật nhận yêu cầu đặt bàn và xử lý hàng chờ. Bản demo chưa có thanh toán gói, kết nối POS hay thông báo đẩy.

## 7. Gói người dùng và giới hạn bản demo

Trang **Gói người dùng** cho biết quyền Free và các quyền Premium. Phần lớn quyền Premium như giữ bãi xe, voucher và AI cá nhân hóa đang được ghi **Sắp ra mắt**, chưa thể mua hoặc sử dụng thật. Dữ liệu quán và bãi xe mặc định là mô phỏng. Đừng dùng số chỗ mẫu để quyết định di chuyển ngoài đời.

## 8. Khi trang không hiển thị đúng

- Nếu bản đồ nền không tải, danh sách quán vẫn dùng được. Kiểm tra kết nối mạng và tải lại trang.
- Nếu không thấy quán, bỏ bớt bộ lọc, tăng bán kính hoặc kéo bản đồ sang khu vực có dữ liệu mẫu ở TP.HCM.
- Nếu chỗ ngồi hiện **Dữ liệu cũ**, người chạy demo có thể chạy lại `npm run seed:demo` trong thư mục `backend`; thao tác này làm mới snapshot mẫu nhưng không tạo trùng quán.
- Nếu đăng nhập bị mất sau khi khởi động lại API, đăng nhập lại. Khi chạy local, giữ `JWT_SECRET` cố định trong `backend/.env` để phiên không đổi ngoài ý muốn.

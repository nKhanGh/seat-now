# Hướng dẫn sử dụng SeatNow

Tài liệu này mô tả **bản demo hiện tại**. Địa điểm, chỗ ngồi và bãi xe được seed để thử tính năng; dữ liệu mẫu không phản ánh tình trạng thực tế. Cách khởi động dự án nằm trong [README](../README.md#chạy-demo-local).

## 1. Bắt đầu

1. Mở trang chủ SeatNow. Bản đồ và danh sách mặc định hiển thị quanh trung tâm Quận 1, TP.HCM.
2. Chọn **Đăng ký**, nhập tên hiển thị, email, mật khẩu ít nhất 12 ký tự và xác nhận mật khẩu. Biểu tượng mắt dùng để hiện hoặc ẩn mật khẩu.
3. Nếu đã có tài khoản, chọn **Đăng nhập**. Các thao tác xem bản đồ, chỗ ngồi, bãi xe và gói dịch vụ dùng được khi chưa đăng nhập.
4. Dùng **Đăng xuất** ở thanh đầu trang khi muốn kết thúc phiên, rồi chọn **Xác nhận đăng xuất** trong hộp thoại; chọn **Ở lại** để hủy.
5. Nếu chọn **Đăng nhập** từ một quán, review, đặt bàn hoặc danh sách cá nhân, sau đăng nhập/đăng ký app quay lại đúng màn hình và quán đang xem.

## 2. Tìm và xem địa điểm

- Nhập tên quán hoặc địa chỉ vào ô **Tìm tên quán, địa chỉ**. Danh sách hiện kết quả từ các địa điểm đã tải ngay khi gõ; sau đó app tìm thêm trong toàn bộ quán công khai và đặt kết quả chưa tải ở mục **Quán khác trên hệ thống**. Tìm kiếm không phân biệt chữ hoa và dấu tiếng Việt. Chọn kết quả để chuyển bản đồ đến quán. Nếu có nhiều kết quả, nhập từ khóa cụ thể hơn.
- Dùng bộ lọc **loại địa điểm**, **loại món**, **bán kính**, **mức giá**, **đánh giá**, **độ đông** hoặc **Còn bàn**. Danh sách bên trái và ghim trên bản đồ cùng cập nhật theo dữ liệu đã tải.
- Chọn **Sắp xếp danh sách** để xem quán đã tải theo gần nhất, đánh giá cao hoặc giá thấp. Mặc định quán được tài trợ đứng trước; khi chọn đánh giá/giá, app theo đúng thứ tự bạn chọn. Tìm bằng tên/địa chỉ giữ thứ tự khớp từ khóa, nên lựa chọn sắp xếp tạm dừng lúc đang tìm.
- Chọn **Xóa bộ lọc** để bỏ từ khóa và mọi điều kiện lọc, trong khi vẫn giữ khu vực bản đồ đang xem.
- Khi đã đăng nhập và lưu quán, bật **Chỉ quán đã lưu** để xem nhanh các quán yêu thích trong dữ liệu bản đồ đã tải. Mở **Quán đã lưu** để xem toàn bộ danh sách, kể cả quán ngoài vùng đang tải.
- Kéo bản đồ để đổi khu vực tìm kiếm. Chọn **Vị trí của tôi** để xin quyền vị trí và hiển thị chấm xanh. Nếu từ chối quyền, bản đồ vẫn sử dụng được với tâm hiện tại.
- Chọn thẻ trong danh sách hoặc ghim trên bản đồ để mở chi tiết. Trong đó có địa chỉ, thông tin bàn/ghế, thời gian chờ, bãi xe, đánh giá và gợi ý địa điểm gần đó. Chọn **Đóng** một lần để đóng chi tiết.
- Trên điện thoại, thanh liên kết ở đầu trang cuộn ngang. Khi chọn quán, trang tự đưa phần chi tiết vào tầm nhìn; kéo trong khung chi tiết để xem bãi xe và review.
- Trong chi tiết, chọn **Chỉ đường đến địa điểm** để mở Google Maps ở tab mới. Nếu đã dùng **Vị trí của tôi**, tọa độ đó được dùng làm điểm bắt đầu; nếu chưa, Google Maps sẽ tự hỏi điểm bắt đầu.
- Chọn **Xem thêm địa điểm** để tải trang kết quả tiếp theo. Ghim của các địa điểm đã tải vẫn còn khi kéo bản đồ.
- Ở mức thu nhỏ, các quán gần nhau được gom thành vòng tròn có số lượng; chọn vòng tròn để phóng gần. Khi phóng gần hơn, từng ghim quán và logo (nếu có) sẽ hiện riêng.
- Mục **Gợi ý quanh đây** hiển thị tối đa bốn địa điểm trong phạm vi 2 km tính theo đường chim bay, ưu tiên có nhiều loại địa điểm khác nhau; chọn một gợi ý để mở địa điểm đó. Đây là gợi ý theo vị trí, chưa cá nhân hóa bằng AI.

**Đọc tình trạng chỗ ngồi:** “Dữ liệu cũ” nghĩa là bản ghi đã hết hiệu lực; số bàn/ghế bên cạnh chỉ là lần ghi nhận trước. “Chưa có dữ liệu” nghĩa là app chưa biết tình trạng hiện tại. Bộ lọc **Còn bàn** chỉ tính bản ghi còn hạn và đang nhận khách. Dữ liệu demo có hiệu lực 7 ngày để tiện thử bộ lọc nhưng vẫn là số liệu hư cấu; không dùng để quyết định di chuyển thật.

Trong chi tiết quán, chọn **Xem lịch sử chỗ ngồi 24 giờ** để xem tối đa 10 lần ghi nhận gần nhất. Đây là số liệu đã xảy ra, không dự báo số bàn hiện tại hoặc thời gian tới; mỗi dòng ghi rõ nguồn dữ liệu.

Điểm đánh giá bằng `0` nghĩa là chưa còn review công khai, được hiển thị **Chưa có đánh giá** thay vì 0 sao.

## 3. Xem bãi đỗ xe

Mở chi tiết một địa điểm, kéo xuống phần bãi đỗ xe. Lọc theo **loại xe**, **còn chỗ mới**, **mở 24 giờ** hoặc **miễn phí**. Chọn một bãi để xem thông tin giá, khoảng cách và trạng thái chỗ; kiểm tra dấu dữ liệu cũ trước khi di chuyển. Chọn **Chỉ đường đến bãi xe** để mở Google Maps với tọa độ bãi đã chọn. Khoảng cách trong SeatNow là đường chim bay; quãng đường thực tế do Google Maps tính. Bản demo chưa hỗ trợ giữ chỗ gửi xe.

## 4. Đặt bàn tại quán có hỗ trợ

Đăng nhập, mở một quán ăn hoặc cà phê đã bật nhận yêu cầu rồi chọn thời gian đến, số khách và **Gửi yêu cầu**. Mở **Đặt bàn của tôi** để xem trạng thái, lọc yêu cầu đang chờ/đã xác nhận/đã kết thúc, xem tên quán và chọn **Xem quán trên bản đồ** để quay lại quán. Chủ quán sẽ xác nhận hoặc từ chối thủ công; yêu cầu đang chờ **chưa giữ bàn**. Nếu không thấy mục đặt bàn trong chi tiết, quán đó chưa bật nhận yêu cầu. Sau khi đón khách, chủ quán đánh dấu yêu cầu **Đã đón khách**; app không tự suy ra khách đã đến từ giờ đặt bàn.

Nếu cần hủy yêu cầu đang chờ hoặc đã xác nhận, chọn **Hủy yêu cầu**, đọc lại tên quán rồi chọn **Xác nhận hủy**. Chọn **Giữ yêu cầu** để thoát khỏi bước xác nhận.

## 5. Tham gia cộng đồng

Các thao tác sau cần đăng nhập:

- **Check-in:** mở địa điểm và chọn nút check-in khi đang ở gần quán. App hiện số tài khoản check-in trong giờ qua và tín hiệu hoạt động cộng đồng: chưa có dữ liệu, ít (1–2), vừa (3–5) hoặc nhiều (từ 6). Đây là ước lượng thô từ người tự báo cáo để đối chiếu mức độ đông, không xác nhận quán còn bàn và không sửa số chỗ trống.
- **Đánh giá:** trong phần **Review cộng đồng**, chọn 1–5 sao, viết nhận xét ngắn và có thể chọn ảnh JPEG, PNG hoặc WebP tối đa 2 MB. Chọn **Gửi đánh giá**. Khi mở lại quán, điểm và nhận xét của bạn được điền sẵn; sửa rồi chọn **Cập nhật đánh giá**, có thể chọn ảnh mới để thay ảnh cũ. Chọn **Xóa đánh giá của tôi** rồi **Xác nhận xóa** để xóa cả đánh giá và ảnh; hoặc báo cáo đánh giá của người khác.
- **Lưu và chia sẻ:** chọn lưu quán trong chi tiết, xem lại ở **Quán đã lưu**, hoặc chọn **Chia sẻ địa điểm** để lấy liên kết. Chọn tên tác giả review để xem hồ sơ, các đánh giá công khai của họ và theo dõi người đó. Trang **Đang theo dõi** có danh sách thành viên và tối đa 20 review công khai mới nhất của họ. Từ review trên hồ sơ hoặc bảng hoạt động, chọn **Xem quán trên bản đồ** để mở quán.
- **Đề xuất địa điểm:** chọn **Đề xuất quán**, nhập thông tin, rồi bấm bản đồ hoặc kéo ghim để đặt đúng vị trí quán. Nút **Dùng vị trí của tôi** đặt ghim theo vị trí thiết bị nếu bạn cấp quyền; các ô vĩ độ/kinh độ vẫn cho chỉnh chính xác. Gửi đề xuất và theo dõi tiến độ trong **Đề xuất của tôi**. Địa điểm cần ba tài khoản khác xác nhận, sau đó người vận hành duyệt mới xuất hiện trên bản đồ. Đây là luồng thêm quán mới; nếu quán đã có trên bản đồ và bạn là chủ quán, dùng **Quản lý quán** ở header.

## 6. Dành cho chủ quán

Đăng nhập, mở quán đã có trên bản đồ rồi chọn **Bạn là chủ quán này?** để gửi yêu cầu nhận quản lý. Mô tả cách chứng minh quyền quản lý và có thể đính kèm ảnh giấy tờ JPEG, PNG hoặc WebP tối đa 3 MB; ảnh chỉ dành cho người vận hành xét duyệt. Sau khi người vận hành duyệt, quán xuất hiện trong danh sách quản lý. Gói cơ bản cho phép sửa hồ sơ và tải logo; các chức năng Premium demo gồm cập nhật chỗ ngồi thủ công, ảnh bìa, dashboard và ưu đãi theo lịch. Chủ quán có thể bật nhận yêu cầu đặt bàn, xử lý hàng chờ và chọn **Đánh dấu đã đón khách** cho yêu cầu đã xác nhận; cần bấm **Xác nhận đã đón** ở bước tiếp theo. Yêu cầu hoàn tất rời hàng chờ, khách xem được trong **Đặt bàn của tôi** và không thể hủy. Bản demo chưa có thanh toán gói, kết nối POS hay thông báo đẩy.

Sau khi admin duyệt, đăng nhập lại bằng **đúng email đã gửi yêu cầu**. Tài khoản có quán được duyệt sẽ vào `/business` sau đăng nhập; bạn cũng có thể chọn **Quản lý quán** cạnh logo trên header bản đồ. Quán được duyệt nằm ở đầu trang **Địa điểm đang quản lý**, phía trên biểu mẫu gửi yêu cầu mới. Mục **Tương tác khách hàng** của gói Free hiện số tài khoản check-in trong giờ qua, tín hiệu cộng đồng, năm review công khai mới nhất và ảnh của khách; chọn **Làm mới** để cập nhật. Chọn **Cập nhật trạng thái** nếu trang đã mở sẵn trong lúc admin xét duyệt; dòng email ở đầu trang giúp kiểm tra tài khoản hiện tại. Nút **Về trang chính** ở đầu trang quản lý đưa bạn lại bản đồ. Gói Free cho phép sửa thông tin quán và logo; bảng thống kê, cập nhật chỗ ngồi thủ công và ưu đãi cần gói Premium demo.

### Xét duyệt yêu cầu bằng tài khoản admin

Người vận hành tạo tài khoản admin theo [README](../README.md#chạy-demo-local), đăng nhập và mở **Xét duyệt** hoặc `/admin`. Trang hiển thị yêu cầu đang chờ cùng tên, email người gửi, nội dung chứng minh và ảnh riêng tư nếu có. Sau khi đối chiếu thông tin, chọn **Duyệt** hoặc **Từ chối**, rồi bấm **Xác nhận**. Yêu cầu rời hàng chờ; chủ quán tải lại `/business` để thấy kết quả. Chỉ tài khoản admin có quyền xem bằng chứng và quyết định; ảnh chứng minh được xóa khỏi yêu cầu sau khi xử lý. Không duyệt chỉ dựa trên tên quán hoặc nội dung tự khai nếu chưa xác minh quyền quản lý.

## 7. Gói người dùng và giới hạn bản demo

Trang **Gói người dùng** cho biết quyền Free và các quyền Premium. Tài khoản Premium demo được người vận hành cấp sẽ thấy **Premium · bản đồ không quảng cáo**: quán không được đẩy lên đầu vì tài trợ và không hiện nhãn/ưu đãi quảng cáo trên bản đồ. Tài khoản Free vẫn thấy nhãn tài trợ rõ ràng. Nếu không kiểm tra được quyền Premium, app báo lỗi và dùng bản đồ thông thường cho đến khi thử lại. Giữ bãi xe, voucher và AI cá nhân hóa vẫn được ghi **Sắp ra mắt**, chưa thể mua hoặc sử dụng thật. Dữ liệu quán và bãi xe mặc định là mô phỏng. Đừng dùng số chỗ mẫu để quyết định di chuyển ngoài đời.

## 8. Khi trang không hiển thị đúng

- Nếu vùng bản đồ chỉ hiện màu trơn dù danh sách có quán, tải lại trang để nhận bản giao diện mới. Nếu vẫn trống, kiểm tra kết nối đến nguồn bản đồ hoặc `VITE_MAP_STYLE_URL`; danh sách quán vẫn dùng được.
- Nếu không thấy quán, bỏ bớt bộ lọc, tăng bán kính hoặc kéo bản đồ sang khu vực có dữ liệu mẫu ở TP.HCM.
- Nếu chỗ ngồi hiện **Dữ liệu cũ**, người chạy demo có thể chạy lại `npm run seed:demo` trong thư mục `backend`; thao tác này làm mới snapshot mẫu nhưng không tạo trùng quán.
- Nếu đăng nhập bị mất sau khi khởi động lại API, đăng nhập lại. Khi chạy local, giữ `JWT_SECRET` cố định trong `backend/.env` để phiên không đổi ngoài ý muốn.

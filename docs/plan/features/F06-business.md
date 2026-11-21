# F06 — Quản lý địa điểm cho chủ quán

Trạng thái: **DEMO COMPLETE** ngày 19/11/2026. API, React UI, MongoDB integration test và [OpenAPI](../../../contracts/openapi/business.json) đã có.

## Thứ tự triển khai

1. Xác minh quyền quản lý: tài khoản gửi yêu cầu quản lý venue; chỉ người vận hành dùng token nội bộ mới duyệt. Không cho tự nhận quyền bằng cách biết slug. Một venue có một chủ quản lý trong bản đầu.
2. Gói Basic: chủ quán xem danh sách venue của mình, cập nhật mô tả, giờ mở cửa, menu và khoảng giá; tải logo đã được kiểm tra và chuyển định dạng an toàn. Logo và hồ sơ xuất hiện công khai trên bản đồ/chi tiết. Trang quản lý hiển thị số check-in trong giờ qua, tín hiệu hoạt động cộng đồng và năm review công khai mới nhất kèm ảnh qua API Free đã có.
3. Gói Premium: cấp gói bằng tác vụ nội bộ cho demo, không giả lập thanh toán. Chủ quán được cập nhật chỗ trống thủ công; nguồn dữ liệu hiển thị là `OPERATOR`, có thời điểm hết hạn. Huy hiệu xác thực chỉ xuất hiện nếu quyền quản lý đã duyệt và gói đang Premium.
4. Dashboard: số lượt mở trang chi tiết theo giờ không lưu danh tính khách, trung bình tỷ lệ lấp đầy và khung giờ cao từ snapshot 7 ngày. Không suy ra occupancy từ lượt xem/check-in.
5. Sponsored và giờ vắng: ưu đãi trong app có thời hạn và do chủ quán bật, vị trí tài trợ được xếp trước trong API bản đồ với nhãn rõ ràng; trạng thái “còn nhiều bàn trống” chỉ hiện khi snapshot còn mới. Không tự động gửi push trước khi có opt-in và hạ tầng thông báo.
6. Chuỗi đa chi nhánh: một tài khoản có thể quản lý nhiều venue đã duyệt trong danh sách tập trung; logo và ảnh bìa cấu hình theo từng chi nhánh.

## Giới hạn demo

- Gói Premium được operator cấp với ngày hết hạn, chưa có thanh toán/billing. Ưu đãi là nội dung hiển thị; chưa có mã voucher, đổi quà hay đo chuyển đổi.
- POS connector, push notification, quản lý nhân viên theo vai trò và pháp nhân chuỗi chưa có. Internal ingestion token hiện hỗ trợ dữ liệu POS thử nghiệm nhưng chưa kết nối nhà cung cấp.
- Dashboard là số lượt mở trang, không phải khách duy nhất; tỷ lệ lấp đầy là trung bình từ snapshot, gồm cả dữ liệu mẫu nếu seed demo. Trước production cần chống gian lận lượt xem, quy trình duyệt quảng cáo và chính sách giữ dữ liệu.

## Quy tắc

- API chủ quán yêu cầu cookie session và kiểm tra owner ở backend cho từng venue.
- Claim, nâng gói và huy hiệu phải do operator duyệt; token nội bộ không xuất hiện trong frontend.
- Ảnh chứng minh quyền quản lý được chuẩn hóa WebP, chỉ trả qua API nội bộ có token xét duyệt và `Cache-Control: no-store`; danh sách yêu cầu chỉ trả cờ `hasDocument`. Ảnh được xóa khỏi claim khi duyệt hoặc từ chối.
- API công khai chỉ trả dữ liệu hồ sơ cần hiển thị, không tiết lộ thông tin tài khoản chủ quán.
- Snapshot thủ công dùng ingestion hiện có, có nguồn, version, độ tin cậy và thời gian hết hạn; không ghi đè snapshot mới hơn.
- Mỗi lát cắt có MongoDB integration test, OpenAPI và hướng dẫn demo.

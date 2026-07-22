# Open Items — bàn giao giữa các vai trò

Mỗi mục ghi rõ vai trò cần xử lý, bối cảnh, và tài liệu liên quan. Vai trò nào cũng đọc file này ở bước khởi động.

---

## Đang mở

*(không có)*

---

## Đã xử lý

### CẦN BA LÀM RÕ: Mã NFR-09 mang hai nội dung khác nhau ở hai tài liệu — *đã xử lý*
Mã NFR đồng bộ theo `brd.md`. `requirement.md` NFR-09 nay mang cùng nội dung với `brd.md` NFR-09: phần mô tả hành vi của kịch bản phải luôn khớp với hành vi được thực thi. Hai yêu cầu bị đẩy xuống: NFR-10 là hiệu năng thu thập bằng chứng, NFR-11 là ngôn ngữ tiếng Anh trong kho mã.
Quy ước đánh mã ghi ở đầu `requirement.md`: NFR-01 đến NFR-09 dùng chung giữa hai tài liệu và mang cùng nội dung; NFR-10 và NFR-11 chỉ có ở `requirement.md`. Thiết kế đang dùng mã theo `brd.md` nên không phải sửa theo.

### CẦN BA LÀM RÕ: Mức bắt buộc của ảnh chụp màn hình ở kịch bản đạt — *đã xử lý*
Hệ thống chụp một ảnh duy nhất, tại thời điểm bước hỏng của một kịch bản hỏng. Các bước khác không chụp, trừ những bước được đánh dấu tường minh là cần chụp. Kịch bản đạt không có ảnh chụp.
Thay cho ảnh của các bước trước, mỗi kịch bản có một nhật ký thực thi: các bước đã chạy theo thứ tự, kết quả từng bước, và thông báo lỗi tại bước hỏng.
Lý do: muốn có ảnh của các bước trước bước hỏng thì buộc phải chụp mọi bước ngay từ đầu, vì lúc chạy chưa biết bước nào sẽ hỏng. Mỗi lần chụp tốn từ vài trăm mili giây tới vài giây, nên chi phí này rơi vào cả các kịch bản đạt và ảnh hưởng trực tiếp SM-02. Nhật ký thực thi cho cùng thông tin điều tra với chi phí thấp hơn nhiều.
Quy tắc đi kèm: lỗi phát sinh khi chụp màn hình hoặc ghi nhật ký không được làm thay đổi trạng thái của kịch bản. Bằng chứng thực thi là thứ phụ trợ, không phải điều đang được kiểm tra.
Đã phản ánh vào thiết kế: Evidence Collector đổi trách nhiệm (`north-star.md` §2), nguyên tắc "bằng chứng thực thi là thứ phụ trợ" (§2.2), nhật ký thực thi vào hợp đồng dữ liệu (ADR-003), nội dung báo cáo (ADR-006), quy tắc mã (`coding-convention.md`).

### CẦN BA LÀM RÕ: `phase-proposal.md` vẫn tính EP-10 vào Phase 1 — *đã xử lý*
`phase-proposal.md` §Phase 1 liệt kê tường minh: EP-01, EP-02, EP-03, EP-04, EP-05, EP-06, EP-07, EP-08, EP-09, EP-17, EP-19, EP-23, EP-24, EP-25. Phase 2 và Phase 3 cũng liệt kê tường minh thay vì dùng dải mã.

### CẦN BA LÀM RÕ: `brd.md` §3.1 chưa phản ánh xác nhận về ngôn ngữ — *đã xử lý*
`brd.md` §3.1 bổ sung cột "Đọc và viết mô tả hành vi bằng tiếng Anh", bắt buộc ở cả ba phase. Thêm BC-10 và `requirement.md` NFR-11 về việc toàn bộ nội dung trong kho mã viết bằng tiếng Anh. BC-10 đã vào `north-star.md` §5.

### CẦN BA LÀM RÕ: FR-EXEC-04 chưa có trạng thái "đạt kèm tự phục hồi" — *đã xử lý*
Yêu cầu về trạng thái kịch bản nay là FR-EXEC-06, phát biểu ba giá trị: đạt, hỏng, đạt kèm tự phục hồi. Giá trị thứ ba nằm trong dữ liệu kết quả từ giai đoạn 1 dù chỉ phát sinh từ giai đoạn 2.
Mã yêu cầu trong `requirement.md` §4.2 đã đánh lại do chèn thêm ba yêu cầu về bằng chứng thực thi; self-healing nay là FR-EXEC-08 và FR-EXEC-09. Tài liệu thiết kế không tham chiếu mã FR nào, nên không có chỗ nào phải sửa theo.

### CẦN BA ĐÁNH GIÁ: Quyết định dùng Cucumber làm đổi cách mô tả "kịch bản" trong tài liệu nghiệp vụ — *đã xử lý*
Cách mô tả đã cập nhật ở `requirement.md` §3 và FR-AUTH-01, `epic-map.md` EP-03 và EP-12, `brd.md` §1: một kịch bản gồm phần mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt thực thi từng câu mô tả. Thiết kế dùng cùng cách gọi này.
Việc thu hẹp phạm vi được xác nhận: FR-AUTH-06 và EP-12 không còn là xây một chức năng hiển thị, mà là đưa phần mô tả hành vi tới QC. NFR-09 giữ ở mức nghiệp vụ để ràng buộc mọi lựa chọn thiết kế về sau, và đã vào `north-star.md` §5.

### CẦN BA LÀM RÕ: Trạng thái kết quả của một kịch bản có xảy ra tự phục hồi — *đã xử lý*
Trạng thái riêng "đạt kèm tự phục hồi", tách khỏi "đạt". Giá trị này nằm trong hợp đồng dữ liệu kết quả từ Phase 1 dù chỉ phát sinh từ Phase 2 (ADR-003, ADR-004).

### CẦN BA LÀM RÕ: Nội dung tối thiểu của báo cáo đính Jira — *đã xử lý*
Báo cáo gồm bảng tóm tắt toàn lượt chạy, và với mỗi kịch bản hỏng là ảnh chụp bước hỏng, nhật ký thực thi, tên màn hình và loại lỗi (ADR-006).

### CẦN BA LÀM RÕ: Trạng thái khởi tạo của ứng dụng trước mỗi lượt chạy — *đã xử lý*
Mỗi kịch bản tự đưa ứng dụng về trạng thái nó cần ở bước mở đầu; nền tảng không đặt lại ứng dụng giữa các lượt chạy. Device & Build Manager thu hẹp phạm vi tương ứng (`north-star.md` §2).

### CẦN BA LÀM RÕ: `docs/requirement.md` Mục 2 mâu thuẫn với `brd.md` về phạm vi Android — *đã xử lý*
`requirement.md` đã đồng bộ với `brd.md`.

### CẦN BA LÀM RÕ: Năng lực tiếng Anh của QC — *đã xử lý*
Tiếng Anh là ngôn ngữ chính của đội.

### CẦN BA LÀM RÕ: Ứng dụng thí điểm để nghiệm thu Phase 1 — *đã xử lý*
Tiêu chí nghiệm thu phát biểu theo đặc điểm ứng dụng: một ứng dụng iOS bất kỳ có luồng đăng nhập và một vài thao tác cốt lõi. Việc chọn ứng dụng cụ thể để dev kiểm chứng là quyết định kỹ thuật, xử lý ở thiết kế Phase 1.

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Cách sinh báo cáo PNG/PDF — *đã xử lý*
Reporter tự sinh báo cáo từ dữ liệu trong Result Store (ADR-006).

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Điểm đặt lớp self-healing — *đã xử lý*
Locator Resolver gọi tường minh (ADR-004).

### CẦN BA LÀM RÕ: Ai soạn kịch bản mới ở Phase 2 khi Claude không khả dụng — *đã xử lý*
Đội có người viết được mã ở mọi phase; việc phân bổ nguồn lực do đội đảm nhận. Giả định này là căn cứ của ADR-001.

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Hình dạng kịch bản và test framework — *đã xử lý*
Cucumber với tệp `.feature` và tập step definition (ADR-001, ADR-007).

### CẦN SA LÀM RÕ: Mâu thuẫn phạm vi Android — *đã xử lý*
Thiết kế Phase 1 không thêm lớp trừu tượng nào cho Android (`north-star.md` §6).

### CẦN SA LÀM RÕ: Định dạng báo cáo PNG/PDF — *đã xử lý*
ADR-006: nền tảng tự sinh báo cáo một tệp từ dữ liệu kết quả.

### CẦN SA LÀM RÕ: Tách nền tảng khỏi kịch bản của từng ứng dụng trong cùng một repo — *đã xử lý*
ADR-002: ranh giới bằng thư mục cộng luật lint chặn phụ thuộc ngược.

### CẦN SA LÀM RÕ: Thực thi trên cả thiết bị thật và simulator — *đã xử lý ở mức Giai đoạn 0*
Device & Build Manager chịu trách nhiệm cho khác biệt giữa hai loại. Ràng buộc chi tiết thuộc thiết kế Phase 1.

### CẦN SA LÀM RÕ: Biểu diễn kịch bản dưới dạng các bước bằng ngôn ngữ tự nhiên — *đã xử lý*
ADR-007: tệp `.feature` là biểu diễn ngôn ngữ tự nhiên và cũng là thứ được thực thi.

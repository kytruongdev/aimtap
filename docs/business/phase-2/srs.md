# Software Requirements Specification — Phase 2

Phase 2 bổ sung AI. Nền tảng dùng AI bằng cách **chủ động gọi một AI CLI bên ngoài (như Claude Code)**. Đặc tả ba phần: **tự phục hồi locator**, **sinh test case**, và **cách dùng AI CLI cùng môi trường**.

Từ vựng trung tâm định nghĩa ở `brd.md` §1.1. Quy tắc nghiệp vụ tham chiếu ở `business-rules.md` Phase 2.

Xác thực AI: nền tảng không giữ khóa API. AI CLI dùng một token lưu ngoài kho mã, cài một lần (BR-220).

---

## 0. Cách người dùng tương tác với nền tảng

Nền tảng chạy **cục bộ trên máy, không phụ thuộc máy chủ từ xa hay dịch vụ hosted** (NFR-01, BC-02), **không có giao diện đồ họa**. Người dùng tương tác qua dòng lệnh và file:

- **Dòng lệnh:** chạy test, xem báo cáo, và cài đặt/kiểm tra môi trường AI (BR-221).
- **Cấu hình theo từng app:** bật hoặc tắt AI; số lần thử tự phục hồi.
- **Bí mật ngoài kho mã:** token xác thực của AI CLI (cài một lần) và dữ liệu test.
- **Báo cáo:** mỗi lượt chạy sinh một file báo cáo HTML (ảnh nhúng sẵn), mở bằng trình duyệt.

Tại các điểm cần AI (tự phục hồi, sinh test case), nền tảng **chủ động gọi AI CLI bên ngoài (Claude Code)** — không nhúng khóa, không quản nhà cung cấp, không có giao diện cấu hình AI.

---

## 1. Functional Requirements

### FR-HEAL-01: Kích hoạt tự phục hồi khi locator hỏng
- Mô tả: Khi một lần tìm phần tử theo locator dự kiến thất bại trong lúc chạy một bước, và AI đang bật cho app, nền tảng gọi AI CLI (chỉ để lấy locator) tìm một cách định vị khác cho phần tử đó, dựa trên locator đã hỏng, màn hình đang thao tác và page source hiện tại.
- Input: locator dự kiến đã hỏng và định danh của nó; tên màn hình (Page Object) đang thao tác; page source hiện tại.
- Output: nền tảng gọi AI CLI để lấy locator thay thế (tối đa số lần cấu hình được, mặc định 3, cho locator hỏng đó), mỗi lần kèm page source, locator đã hỏng và tên màn hình; thử lại khi locator thay thế chưa tìm thấy phần tử, dừng khi tìm được.
- Business rule liên quan: BR-201, BR-202.

### FR-HEAL-02: Áp dụng locator thay thế và ghi nhận
- Mô tả: Nếu AI trả về một locator thay thế định vị được một phần tử trên màn hình hiện tại, nền tảng dùng phần tử đó để bước tiếp tục, và ghi một lần tự phục hồi.
- Input: locator thay thế từ AI.
- Output: bước tiếp tục với phần tử tìm được; một bản ghi lần tự phục hồi gồm locator dự kiến, locator thay thế đã dùng, màn hình (Page Object), bước, thời điểm.
- Business rule liên quan: BR-203, BR-205.

### FR-HEAL-03: Trạng thái test case khi có tự phục hồi
- Mô tả: Kết luận đạt hoặc hỏng của test case do các phép kiểm quyết định. "Đạt kèm tự phục hồi" là một **nhãn dẫn xuất**, gắn khi test case đạt và có ít nhất một lần tự phục hồi — không phải một giá trị kết luận thứ ba.
- Input: kết quả các phép kiểm của test case; số lần tự phục hồi trong test case.
- Output: kết luận test case (đạt / hỏng), kèm nhãn "đạt kèm tự phục hồi" khi đạt và có tự phục hồi.
- Business rule liên quan: BR-204.

### FR-HEAL-04: Ghi nhận tự phục hồi ở test case hỏng
- Mô tả: Nếu một test case có tự phục hồi nhưng cuối cùng hỏng, các lần tự phục hồi vẫn được ghi và hiển thị trong báo cáo.
- Input: các lần tự phục hồi trong một test case hỏng.
- Output: bản ghi các lần tự phục hồi trong báo cáo, kèm bản ghi test case hỏng.
- Business rule liên quan: BR-205, BR-206.

### FR-HEAL-05: Hiển thị lần tự phục hồi trong báo cáo
- Mô tả: Mỗi lần tự phục hồi đã áp dụng hiển thị trong báo cáo lượt chạy.
- Input: các bản ghi lần tự phục hồi của lượt chạy.
- Output: trong file báo cáo HTML, mỗi lần tự phục hồi hiện: locator dự kiến, locator thay thế đã dùng, ảnh chụp phần tử đã thao tác, màn hình, bước.
- Business rule liên quan: BR-206.

### FR-HEAL-06: Ứng xử khi không phục hồi được
- Mô tả: Nếu AI tắt cho app, AI CLI không phản hồi hoặc lỗi, hoặc hết số lần thử mà không tìm được locator thay thế dùng được, thì không có tự phục hồi; bước hỏng như Phase 1. Lỗi khi gọi AI CLI không làm dừng lượt chạy và không tự biến kết quả test case.
- Input: locator hỏng nhưng không có tự phục hồi khả dụng.
- Output: bước ghi nhận hỏng, chụp ảnh tại bước hỏng, lượt chạy tiếp tục sang test case kế.
- Business rule liên quan: BR-208.

### FR-HEAL-07: Ghi locator cũ→mới vào báo cáo để con người tự cập nhật
- Mô tả: Với mỗi lần tự phục hồi, nền tảng ghi locator cũ, locator đã dùng, và ảnh phần tử đã thao tác vào báo cáo để con người tự cập nhật Page Object. Nền tảng KHÔNG sửa file, không đụng git, không tạo pull request.
- Input: một lần tự phục hồi (locator cũ, locator đã dùng, ảnh phần tử đã thao tác).
- Output: trong báo cáo có đủ locator cũ→mới kèm ảnh; con người dùng thông tin đó để cập nhật Page Object và mở pull request thủ công khi thấy AI đoán đúng. Bản ghi lượt chạy cũ không đổi.
- Business rule liên quan: BR-203, BR-207, BR-210.

### FR-AI-01: Bật hoặc tắt AI theo từng app
- Mô tả: Việc gọi AI bật hoặc tắt được theo từng app qua cấu hình của app. Công tắc này áp cho cả tự phục hồi và sinh test case.
- Input: cấu hình bật/tắt AI của app.
- Output: bật → cho phép gọi AI khi locator hỏng và khi QC yêu cầu sinh test case; tắt → không gọi AI, app chạy và soạn test đúng như Phase 1.
- Business rule liên quan: BR-209, BR-218.

### FR-GEN-01: Sinh test case từ mô tả và page source
- Mô tả: Khi QC yêu cầu và AI đang bật cho app, nền tảng gọi AI CLI sinh một test case từ mô tả bằng lời của QC và page source của màn hình đích.
- Input: mô tả bằng lời của trường hợp cần kiểm thử; page source của màn hình đích.
- Output: một test case gồm phần mô tả hành vi (ngôn ngữ tự nhiên) và phần cài đặt; locator đặt trong Page Object; ưu tiên tái dùng câu mô tả và phần cài đặt đã có.
- Business rule liên quan: BR-211, BR-212, BR-218.

### FR-GEN-02: Xác nhận test case do AI sinh qua mô tả hành vi
- Mô tả: QC xác nhận một test case do AI sinh bằng cách đọc phần mô tả hành vi và chạy thử, đối chiếu nhật ký thực thi với điều đã mô tả — không cần đọc phần cài đặt.
- Input: phần mô tả hành vi của test case; nhật ký thực thi của lần chạy thử.
- Output: test case được xác nhận, hoặc yêu cầu sinh lại.
- Business rule liên quan: BR-213, BR-214.

### FR-GEN-03: Sinh lại sau khi điều chỉnh mô tả
- Mô tả: Nếu test case sinh ra không khớp điều QC mô tả, QC chỉnh mô tả và yêu cầu sinh lại.
- Input: mô tả đã chỉnh.
- Output: test case sinh lại.
- Business rule liên quan: BR-213.

### FR-GEN-04: Chạy xanh trước khi mở pull request
- Mô tả: Một test case do AI sinh phải chạy được trên thiết bị và đạt ít nhất một lần trước khi QC mở pull request.
- Input: test case do AI sinh đã xác nhận.
- Output: một lần chạy đạt trên thiết bị, làm điều kiện để mở pull request.
- Business rule liên quan: BR-215.

### FR-GEN-05: Đánh dấu test case do AI sinh
- Mô tả: Test case do AI sinh được đánh dấu là do AI sinh, hiển thị được khi rà soát pull request (để Reviewer phân biệt với test do người viết).
- Input: test case do AI sinh.
- Output: một nhãn "do AI sinh" gắn với test case, phân biệt được với test case do người viết.
- Business rule liên quan: BR-216, BR-217.

### FR-ENV-01: Cài đặt AI CLI và token trên máy
- Mô tả: Nền tảng cung cấp một bước cài đặt để chuẩn bị AI CLI: chọn CLI, cài hoặc kiểm tra CLI đã có, hướng dẫn lấy token một lần, lưu token ngoài kho mã.
- Input: thao tác cài đặt của người dùng; token do người dùng lấy từ CLI.
- Output: AI CLI sẵn sàng và token đã lưu; máy đủ điều kiện dùng tính năng AI.
- Business rule liên quan: BR-220, BR-221.

### FR-ENV-02: Kiểm tra tình trạng AI CLI
- Mô tả: Bước kiểm tra tình trạng của nền tảng kiểm luôn AI CLI có mặt và token hợp lệ; báo rõ nếu thiếu.
- Input: trạng thái máy (AI CLI, token).
- Output: kết quả kiểm — đủ điều kiện dùng AI hay thiếu gì; thiếu thì báo và tính năng AI không chạy (phần chạy test không dùng AI vẫn hoạt động).
- Business rule liên quan: BR-221.

---

## 2. Non-functional Requirements

### NFR-201: Bảo mật token AI CLI (chi tiết hóa NFR-04)
Nền tảng không giữ khóa API. AI CLI được xác thực bằng một token lưu ngoài kho mã, không đẩy lên Git (BR-220).

### NFR-202: Chi phí và độ trễ khi gọi AI (chi tiết hóa NFR-05)
Việc gọi AI lúc chạy kiểm soát được: chỉ gọi khi một locator hỏng (BR-201), tối đa số lần cấu hình được (mặc định 3) cho mỗi locator hỏng trong một lượt chạy (BR-202), và bật/tắt được theo từng app (BR-209).

### NFR-203: Quyền quyết định thuộc về con người (chi tiết hóa NFR-06)
Không locator tự phục hồi nào vào nhánh chính mà chưa qua rà soát. Nền tảng không tạo pull request; con người cập nhật Page Object và mở pull request được duyệt (BR-203, BR-210).

### NFR-204: Độ tin cậy của lượt chạy
Sự cố khi tự phục hồi (AI lỗi, mất mạng) không làm dừng lượt chạy và không tự đổi kết quả test case (BR-208).

### NFR-205: Thao tác không cần đọc hay viết cài đặt (chi tiết hóa NFR-08)
QC xác nhận một test case do AI sinh qua phần mô tả hành vi và nhật ký thực thi, không cần đọc phần cài đặt (BR-214).

### NFR-206: Mô tả hành vi khớp với hành vi thực thi (chi tiết hóa NFR-09)
Phần mô tả hành vi của test case do AI sinh phải khớp với hành vi được thực thi; điều kiện chạy xanh trước khi mở pull request (BR-215) giúp phát hiện lệch trước khi rà soát.

---

## 3. Giả định và câu hỏi mở

- `GIẢ ĐỊNH:` Dữ liệu hiển thị trên màn hình của app được kiểm thử không chứa dữ liệu thật nhạy cảm, nên page source gửi tới AI không bị giới hạn (kế thừa AS-02). Rủi ro này được chấp nhận cho Phase 2; cơ chế lọc/che dữ liệu và việc tắt AI theo từng test case vì lý do nhạy cảm để dành cho phase sau. Biện pháp hiện tại là bật/tắt AI theo app (BR-209). Áp dụng cho cả page source gửi khi tự phục hồi và khi sinh test case.
- `GIẢ ĐỊNH:` Để tự phục hồi, AI cần biết phần tử cần tìm là gì, không chỉ locator đã hỏng. Phase 2 giả định gửi AI locator đã hỏng + tên màn hình (Page Object) + page source là đủ để AI suy ra ý định, vì định danh của locator thường đã mang nghĩa (ví dụ `Login-button`). Nếu chạy thật cho thấy chưa đủ (ảnh hưởng SM-05 — tỷ lệ phục hồi thành công), bổ sung một mô tả ngắn dễ đọc cho từng locator trong Page Object. SA cân nhắc khi thiết kế phần tự phục hồi.
- `PHẠM VI:` Giai đoạn này nền tảng dùng **một AI CLI** (Claude Code); cấu trúc để chỗ mở cho một CLI khác về sau, nhưng không xây sẵn đa-CLI. Nền tảng không quản nhà cung cấp AI — việc đó thuộc chính AI CLI.
- `GIẢ ĐỊNH:` Người dùng là **QC automation (biết code)**; mọi thao tác qua dòng lệnh, file cấu hình và git/pull request. Nền tảng không có giao diện đồ họa ở phase này; đó là lựa chọn hợp với người dùng biết code.
- `CÂU HỎI MỞ:` Nếu công ty cần một định nghĩa chính thức về "dữ liệu nhạy cảm", định nghĩa đó do Product Owner / bên quản lý dữ liệu đặt, không thuộc phạm vi nền tảng. Chưa cần cho Phase 2.
- `CÂU HỎI MỞ:` Nền tảng có nên hiển thị số lần gọi AI CLI hoặc lượng token đã dùng (để đội theo dõi mức dùng) không? Phase 2 hiện chỉ kiểm soát bằng bật/tắt AI và giới hạn số lần thử (NFR-05), chưa hiển thị mức dùng. Cân nhắc nếu Product Owner muốn thấy.
- `GHI CHÚ ĐO LƯỜNG:` SM-04 (thời gian soạn một test case mới, so trước và sau khi có AI) cần một con số "trước khi có AI" làm mốc. Đề xuất: trước khi bật AI, QC bấm giờ soạn một mẫu 5–10 test case (từ lúc bắt đầu tới khi chạy xanh) làm mốc; sau khi có AI đo lại trên số lượng tương đương. Nền tảng không tự đo thời gian soạn. SM-05 (số lần tự phục hồi thành công) và SM-06 (tỷ lệ pull request AI sinh được duyệt) được nền tảng hỗ trợ sẵn qua ghi nhận từng lần tự phục hồi (BR-205) và nhãn đánh dấu test do AI sinh (BR-216).

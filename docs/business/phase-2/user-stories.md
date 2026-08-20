# User Stories — Phase 2

Ba phần: tự phục hồi locator và bật/tắt AI (US-201, US-202, US-203, US-205), sinh test case (US-206→209), và cài đặt AI CLI (US-210). (Không có US-204 — nó đã gộp vào US-203 khi bỏ thao tác xác nhận/bác bỏ nghi thức.)

Từ vựng trung tâm ở `brd.md` §1.1. Quy tắc nghiệp vụ ở `business-rules.md` Phase 2; use case ở `use-cases.md` Phase 2.

---

## US-201: Tự phục hồi locator hỏng để test case không dừng giữa chừng
**As a** QC
**I want to** nền tảng tìm lại một phần tử khi locator dự kiến không còn tìm thấy lúc chạy
**So that** test case chạy tiếp thay vì dừng giữa chừng khi giao diện đổi

**Acceptance Criteria:**
- [ ] Khi một locator không tìm thấy và AI bật cho app, nền tảng gọi AI CLI kèm page source hiện tại, locator đã hỏng và tên màn hình.
- [ ] Nếu AI CLI trả về locator thay thế định vị được phần tử, bước tiếp tục với phần tử đó.
- [ ] Mỗi locator hỏng được thử phục hồi tối đa số lần cấu hình được (mặc định 3); khi tìm được thì dừng thử; locator đã phục hồi được dùng lại trong cùng lượt chạy.
- [ ] Nếu AI tắt, AI CLI lỗi, hoặc không có locator thay thế dùng được, bước hỏng như Phase 1 và lượt chạy không bị dừng vì sự cố gọi AI CLI.

**Business Rules:** BR-201, BR-202, BR-203, BR-208
**Use Case:** UC-201
**Độ ưu tiên:** High
**Phase:** 2

---

## US-202: Xem mỗi lần tự phục hồi trong báo cáo lượt chạy
**As a** QC
**I want to** mở báo cáo lượt chạy và thấy rõ từng chỗ AI đã tự phục hồi, kèm ảnh chụp phần tử AI đã thao tác
**So that** tôi biết được AI bấm trúng thứ cần hay bấm nhầm (tránh đạt giả)

**Acceptance Criteria:**
- [ ] Báo cáo lượt chạy là một file HTML mở bằng trình duyệt; test nào có tự phục hồi được đánh dấu.
- [ ] Mỗi lần tự phục hồi hiện: locator cũ đã hỏng, locator AI đã dùng, ảnh chụp phần tử AI đã thao tác, màn hình, bước.
- [ ] Một test case có nhiều lần tự phục hồi thì mỗi lần hiển thị một mục riêng.
- [ ] Test đạt có tự phục hồi được gắn nhãn "đạt kèm tự phục hồi"; kết luận đạt/hỏng do các phép kiểm quyết định.
- [ ] Test hỏng nhưng có tự phục hồi vẫn hiển thị các lần đó trong báo cáo.

**Business Rules:** BR-204, BR-205, BR-206
**Use Case:** UC-201
**Độ ưu tiên:** High
**Phase:** 2

---

## US-203: Tự cập nhật locator vào Page Object sau khi xem báo cáo tự phục hồi
**As a** QC automation
**I want to** báo cáo cho tôi locator cũ→mới và ảnh phần tử AI đã dùng cho mỗi lần tự phục hồi
**So that** tôi tự cập nhật Page Object và mở pull request khi thấy AI đoán đúng, không phải tự dò tìm locator từ đầu

**Acceptance Criteria:**
- [ ] Với mỗi lần tự phục hồi, báo cáo hiện locator cũ, locator AI đã dùng, và ảnh phần tử AI đã bấm.
- [ ] Nếu AI đoán đúng, tôi dùng locator đó cập nhật Page Object và mở pull request (thủ công, theo quy trình git bình thường).
- [ ] Nếu AI đoán nhầm, tôi điền locator đúng; kết quả "đạt kèm tự phục hồi" của lượt đó không đáng tin.
- [ ] Nền tảng KHÔNG tự tạo pull request hay đụng git; locator chỉ vào nhánh chính qua pull request do con người mở và được duyệt.
- [ ] Việc này không làm thay đổi bản ghi kết quả của lượt chạy đã qua.

**Business Rules:** BR-203, BR-207, BR-210
**Use Case:** — (con người thao tác ngoài nền tảng; phần nền tảng đặc tả ở FR-HEAL-05, FR-HEAL-07)
**Độ ưu tiên:** High
**Phase:** 2

---

## US-205: Bật hoặc tắt AI theo từng app
**As a** QC / QC Lead
**I want to** bật hoặc tắt việc gọi AI theo từng app qua file cấu hình
**So that** tôi kiểm soát được chi phí và tắt AI cho app có màn hình nhạy cảm

**Acceptance Criteria:**
- [ ] Cấu hình của mỗi app bật hoặc tắt được việc gọi AI.
- [ ] App tắt AI chạy đúng như Phase 1: locator hỏng thì bước hỏng, không gọi AI.
- [ ] App bật AI thì tự phục hồi hoạt động theo US-201.

**Business Rules:** BR-209
**Use Case:** UC-201
**Độ ưu tiên:** Medium
**Phase:** 2

---

## US-206: Sinh test case từ mô tả và page source
**As a** QC
**I want to** mô tả trường hợp cần kiểm thử bằng lời và để AI sinh test case từ mô tả đó cùng page source màn hình đích
**So that** thời gian soạn một test case mới giảm

**Acceptance Criteria:**
- [ ] Khi AI bật cho app, QC cung cấp mô tả bằng lời + page source, nền tảng gọi AI CLI sinh test case.
- [ ] Kết quả sinh gồm phần mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt; locator đặt trong Page Object.
- [ ] Việc sinh ưu tiên tái dùng câu mô tả hành vi và phần cài đặt đã có, không tạo câu trùng nghĩa mới.
- [ ] Khi AI tắt cho app, không sinh qua AI; QC soạn tay như Phase 1.

**Business Rules:** BR-211, BR-212, BR-218
**Use Case:** UC-203
**Độ ưu tiên:** High
**Phase:** 2

---

## US-207: Xác nhận test case AI sinh qua mô tả hành vi
**As a** QC
**I want to** xác nhận một test case do AI sinh bằng cách đọc phần mô tả hành vi và chạy thử, không phải đọc phần cài đặt
**So that** tôi tin được test case làm đúng điều mình mô tả mà không phải đọc phần cài đặt

**Acceptance Criteria:**
- [ ] QC xác nhận test case bằng cách đọc phần mô tả hành vi và đối chiếu nhật ký thực thi với điều đã mô tả.
- [ ] Nếu nhật ký không khớp điều mô tả hoặc test case không đạt, QC chỉnh mô tả và yêu cầu sinh lại.
- [ ] Việc xác nhận không đòi hỏi QC đọc phần cài đặt.

**Business Rules:** BR-213, BR-214
**Use Case:** UC-203
**Độ ưu tiên:** High
**Phase:** 2

---

## US-208: Test case AI sinh chạy xanh trước khi mở pull request
**As a** QC
**I want to** một test case do AI sinh phải chạy đạt trên thiết bị ít nhất một lần trước khi tôi mở pull request
**So that** Reviewer không nhận những test case chưa từng chạy được

**Acceptance Criteria:**
- [ ] Một test case do AI sinh chỉ được mở pull request sau khi đã chạy đạt trên thiết bị ít nhất một lần.

**Business Rules:** BR-215
**Use Case:** UC-203
**Độ ưu tiên:** Medium
**Phase:** 2

---

## US-209: Đánh dấu test case do AI sinh để Reviewer nhận biết
**As a** Reviewer (Dev hoặc QC Lead)
**I want to** phân biệt được test case do AI sinh với test case do người viết khi rà soát
**So that** tôi rà soát phần AI sinh tương ứng và giữ quyền chấp nhận thuộc về con người

**Acceptance Criteria:**
- [ ] Test case do AI sinh được đánh dấu rõ là do AI sinh, hiển thị được khi rà soát pull request.
- [ ] Reviewer phân biệt được test case AI sinh với test case người viết.
- [ ] Mọi test case, dù AI sinh hay người viết, vào nhánh chính qua pull request được phê duyệt.

**Business Rules:** BR-216, BR-217
**Use Case:** UC-203
**Độ ưu tiên:** Medium
**Phase:** 2

---

## US-210: Cài đặt AI CLI và token trên máy
**As a** QC automation
**I want to** một bước cài đặt để chuẩn bị AI CLI và token trên máy
**So that** máy đủ điều kiện dùng tính năng AI mà không phải tự mò cấu hình

**Acceptance Criteria:**
- [ ] Có một lệnh cài đặt: chọn CLI, cài hoặc kiểm CLI đã có, hướng dẫn lấy token một lần, lưu token ngoài kho mã.
- [ ] Bước kiểm tra tình trạng báo rõ AI CLI có mặt và token hợp lệ hay không.
- [ ] Thiếu CLI hoặc token thì tính năng AI không chạy; phần chạy test không dùng AI vẫn hoạt động.

**Business Rules:** BR-220, BR-221
**Use Case:** UC-205
**Độ ưu tiên:** High
**Phase:** 2

# User Stories — Phase 2

Ba phần: tự phục hồi locator và bật/tắt AI (US-201, US-202, US-203, US-205), sinh test case (US-206→209), đa nhà cung cấp AI + giao diện (US-210→212). (Không có US-204 — nó đã gộp vào US-203 khi bỏ thao tác xác nhận/bác bỏ nghi thức.)

Từ vựng trung tâm ở `brd.md` §1.1. Quy tắc nghiệp vụ ở `business-rules.md` Phase 2; use case ở `use-cases.md` Phase 2.

---

## US-201: Tự phục hồi locator hỏng để test case không dừng giữa chừng
**As a** QC
**I want to** nền tảng tìm lại một phần tử khi locator dự kiến không còn tìm thấy lúc chạy
**So that** test case chạy tiếp thay vì dừng giữa chừng khi giao diện đổi

**Acceptance Criteria:**
- [ ] Khi một locator không tìm thấy và AI bật cho app, nền tảng gọi AI kèm page source hiện tại, locator đã hỏng và tên màn hình.
- [ ] Nếu AI trả về locator thay thế định vị được phần tử, bước tiếp tục với phần tử đó.
- [ ] Mỗi locator hỏng được thử phục hồi tối đa số lần cấu hình được (mặc định 3); khi tìm được thì dừng thử; locator đã phục hồi được dùng lại trong cùng lượt chạy.
- [ ] Nếu AI tắt, AI lỗi, hoặc không có locator thay thế dùng được, bước hỏng như Phase 1 và lượt chạy không bị dừng vì sự cố gọi AI.

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
- [ ] Test đạt có tự phục hồi mang trạng thái "đạt kèm tự phục hồi"; trạng thái đạt/hỏng do các phép kiểm quyết định.
- [ ] Test hỏng nhưng có tự phục hồi vẫn hiển thị các lần đó trong báo cáo.

**Business Rules:** BR-204, BR-205, BR-206
**Use Case:** UC-201
**Độ ưu tiên:** High
**Phase:** 2

---

## US-203: Nền tảng tạo sẵn pull request sửa locator để Reviewer chỉ cần duyệt
**As a** Reviewer (Dev hoặc QC Lead)
**I want to** nền tảng tự tạo pull request với locator đã sửa, kèm ảnh phần tử AI đã bấm
**So that** tôi rà soát và duyệt được ngay, không phải tự tìm và sửa locator bằng tay

**Acceptance Criteria:**
- [ ] Với mỗi lần tự phục hồi, nền tảng tạo sẵn một pull request thay locator cũ bằng locator AI đã dùng.
- [ ] Pull request kèm ảnh phần tử AI đã bấm để Reviewer kiểm AI bấm đúng không.
- [ ] Reviewer duyệt thì locator vào nhánh chính; nếu AI bấm nhầm thì Reviewer sửa lại hoặc đóng pull request.
- [ ] Locator chỉ vào nhánh chính sau khi pull request được duyệt; nền tảng không tự merge.
- [ ] Việc này không làm thay đổi bản ghi kết quả của lượt chạy đã qua.

**Business Rules:** BR-203, BR-207, BR-210, BR-217
**Use Case:** — (năng lực nền tảng, đặc tả ở FR-HEAL-07)
**Độ ưu tiên:** High
**Phase:** 2

---

## US-205: Bật hoặc tắt AI theo từng app
**As a** QC / QC Lead
**I want to** bật hoặc tắt việc gọi AI theo từng app qua giao diện cấu hình
**So that** tôi kiểm soát được chi phí và tắt AI cho app có màn hình nhạy cảm

**Acceptance Criteria:**
- [ ] Cấu hình của mỗi app bật hoặc tắt được việc gọi AI.
- [ ] App tắt AI chạy đúng như Phase 1: locator hỏng thì bước hỏng, không gọi AI.
- [ ] App bật AI thì tự phục hồi hoạt động theo US-201.

**Business Rules:** BR-209
**Use Case:** UC-201, UC-205
**Độ ưu tiên:** Medium
**Phase:** 2

---

## US-206: Sinh test case từ mô tả và page source
**As a** QC
**I want to** mô tả trường hợp cần kiểm thử bằng lời và để AI sinh test case từ mô tả đó cùng page source màn hình đích
**So that** thời gian soạn một test case mới giảm, và người không biết lập trình cũng soạn được

**Acceptance Criteria:**
- [ ] Khi AI bật cho app, QC cung cấp mô tả bằng lời + page source, nền tảng gọi AI sinh test case.
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
**So that** tôi tin được test case làm đúng điều mình mô tả mà không cần biết lập trình

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

## US-210: Quản lý nhà cung cấp AI và khóa qua giao diện
**As a** QC / QC Lead
**I want to** thêm hoặc bớt nhà cung cấp AI và nhập khóa cho từng cái qua giao diện
**So that** đội chọn được AI phù hợp mà không phải sửa nền tảng hay sửa file cấu hình bằng tay

**Acceptance Criteria:**
- [ ] Thêm được một nhà cung cấp (tên nhà cung cấp, model) và nhập khóa của nó qua giao diện.
- [ ] Sửa khóa hoặc gỡ một nhà cung cấp đã có.
- [ ] Khóa của mọi nhà cung cấp lưu ngoài kho mã, không nằm trong kho mã.

**Business Rules:** BR-219, BR-220, BR-222
**Use Case:** UC-205
**Độ ưu tiên:** High
**Phase:** 2

---

## US-211: Chọn nhà cung cấp AI đang dùng để test
**As a** QC / QC Lead
**I want to** chọn một nhà cung cấp AI làm cái đang dùng
**So that** tôi đổi được giữa Claude, GPT… mà không đụng nội dung test

**Acceptance Criteria:**
- [ ] Đúng một nhà cung cấp ở trạng thái "đang dùng" tại một thời điểm.
- [ ] Mọi lời gọi AI (tự phục hồi và sinh test case) dùng nhà cung cấp đang dùng.
- [ ] Đổi nhà cung cấp đang dùng không phải sửa test case hay Page Object.
- [ ] Chưa chọn nhà cung cấp nào thì tính năng AI không chạy.

**Business Rules:** BR-219, BR-221
**Use Case:** UC-205
**Độ ưu tiên:** High
**Phase:** 2

---

## US-212: Mở báo cáo lượt chạy qua giao diện
**As a** QC
**I want to** mở báo cáo của một lượt chạy từ giao diện
**So that** tôi không phải tự đi tìm file HTML trong thư mục

**Acceptance Criteria:**
- [ ] Giao diện liệt kê các lượt chạy đã có.
- [ ] Chọn một lượt chạy thì mở file HTML report của nó.
- [ ] Giao diện không sinh lại và không thay nội dung báo cáo (thống kê/biểu đồ đầy đủ ở Phase 4).

**Business Rules:** BR-223
**Use Case:** UC-206
**Độ ưu tiên:** Medium
**Phase:** 2

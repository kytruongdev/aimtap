# US-2.2: Khối bằng chứng

**Epic:** EPIC-2 — Tương tác phần tử & bằng chứng
**Business US (BA):** US-13, US-14, US-18
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1

## Mục tiêu
Có ba khối dựng bằng chứng độc lập: nhật ký thực thi trong bộ nhớ, chụp/ghi ảnh bước hỏng, và phân loại lỗi hai giá trị. Ba ticket này không phụ thuộc lẫn nhau, làm song song trong cùng PR.

## Tickets

### TICKET-013: Nhật ký thực thi
**Thiết kế liên quan:** component-design.md#Evidence-Collector (`execution-log.ts`), north-star.md#2.2 (Bằng chứng phụ trợ), coding-convention.md#Bằng-chứng-thực-thi, erd.md#Entity:-StepLog, BR-010, UC-07
**Phụ thuộc:** TICKET-002

**Chỉ dẫn code**
- `src/evidence/execution-log.ts`: cấu trúc nhật ký trong bộ nhớ cho một test case — danh sách bước với `step_order`, `step_text` (đúng câu mô tả hành vi — BR-010), `result`, `duration_ms`, `error_message?`; hàm thêm mục bước và hàm trả nhật ký hoàn chỉnh để đẩy sang Result Store. Chỉ trong bộ nhớ, không ghi tệp nhật ký rời.
- Là thao tác trong bộ nhớ, không nằm trên đường chờ của bước. Cập nhật `src/evidence/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] Nhật ký giữ đúng thứ tự bước, kết quả, thời lượng từng bước (test đơn vị).
- [ ] `step_text` giữ đúng câu mô tả hành vi được truyền vào.
- [ ] Bước hỏng mang `error_message`; bước đạt không mang.
- [ ] Không ghi tệp nhật ký rời.

### TICKET-014: Chụp và ghi ảnh bước hỏng
**Thiết kế liên quan:** component-design.md#Evidence-Collector (`screenshot-writer.ts`), north-star.md#2.2 (Bằng chứng phụ trợ, Hiệu suất), coding-convention.md#Bằng-chứng-thực-thi, erd.md#Entity:-StepLog (`screenshot_path`), BR-003, BR-004
**Phụ thuộc:** TICKET-002

**Chỉ dẫn code**
- `src/evidence/screenshot-writer.ts`: hàm chụp ảnh phiên hiện tại và ghi vào `output/<app-id>/screenshots/<run-id>/`, trả đường dẫn tương đối cho `StepLog.screenshot_path`. Chỉ chụp tại bước hỏng và bước đánh dấu tường minh (BR-003); test case đạt không sinh ảnh. Ghi tệp không nằm trên đường chờ bước kế tiếp. Bọc xử lý lỗi riêng: lỗi khi chụp/ghi trả về dạng "bằng chứng thiếu", không ném ngược (BR-004).
- Cập nhật `src/evidence/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] Ảnh ghi vào `output/<app-id>/screenshots/<run-id>/`, trả đường dẫn tương đối (test đơn vị với lớp chụp giả lập).
- [ ] Không chụp cho bước đạt không đánh dấu; chỉ chụp bước hỏng và bước đánh dấu.
- [ ] Lỗi khi chụp/ghi báo là bằng chứng thiếu, không ném ra ngoài (test đơn vị mô phỏng lỗi chụp).

### TICKET-015: Phân loại lỗi
**Thiết kế liên quan:** component-design.md#Evidence-Collector (`failure-classifier.ts`), north-star.md#2.2 (Hai nhánh lỗi), erd.md#Entity:-TestCaseResult (`failure_type`), BR-014, FR-EXEC-10, UC-07, UC-09
**Phụ thuộc:** TICKET-002

**Chỉ dẫn code**
- `src/evidence/failure-classifier.ts`: nhận lỗi tại bước hỏng, phân biệt `AppFailure`/`PlatformFailure`; ánh xạ ra `failure_type` hai giá trị (BR-014): `wrong_conclusion` (đi tới kết luận nhưng kết quả khác mong đợi), `step_not_executed` (không tìm thấy phần tử / hết thời gian chờ / mất phiên). Luôn giữ thông báo lỗi gốc `error_message` (FR-EXEC-10). Logic thuần, không chạm thiết bị.
- Cập nhật `src/evidence/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] Lỗi khẳng định sai → `wrong_conclusion`; không tìm thấy phần tử/hết thời gian chờ/mất phiên → `step_not_executed` (test đơn vị hai nhánh).
- [ ] Thông báo lỗi gốc giữ nguyên trong `error_message`.
- [ ] Logic chạy trong test đơn vị không cần thiết bị.

## Definition of Done (US)
Theo `conventions.md` §4.

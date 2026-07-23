# US-2.3: Điều phối bằng chứng

**Epic:** EPIC-2 — Tương tác phần tử & bằng chứng
**Business US (BA):** US-13, US-14, US-15
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.4, US-2.2

## Mục tiêu
Điều phối nhật ký, ảnh chụp và phân loại lỗi thành một bản ghi kết quả cho mỗi test case, đẩy sang Result Store theo một giao dịch.

## Tickets

### TICKET-016: Dựng bằng chứng và đẩy bản ghi
**Thiết kế liên quan:** component-design.md#Evidence-Collector (`evidence-collector.ts`), interface-spec.md#Evidence-Collector (`onStepEnd`, `onScenarioEnd`, `setCurrentScreen`), sequence-diagrams.md#2, erd.md (TestCaseResult, StepLog), ADR-011, BR-004, BR-014, FR-EXEC-03→06, FR-EXEC-10
**Phụ thuộc:** TICKET-007, TICKET-013, TICKET-014, TICKET-015

**Chỉ dẫn code**
- `src/evidence/evidence-collector.ts`:
  - `onStepEnd(step: { order; text; result; duration; error? })` — thêm mục vào nhật ký (`execution-log`); nếu hỏng thì chụp ảnh (`screenshot-writer`) và phân loại lỗi (`failure-classifier`).
  - `onScenarioEnd(testCase): TestCaseResult` — chốt trạng thái (`passed`/`failed`; `passed_healed` hợp lệ nhưng chỉ phát sinh từ Phase 2), dựng TestCaseResult đủ trường theo erd, đẩy TestCaseResult và StepLog sang Result Store theo một giao dịch (`saveTestCaseResult`).
  - `setCurrentScreen(name)` — Test Runner gọi khi màn hình đổi; đọc màn hình hiện tại tại bước hỏng để điền `screen` (ADR-011).
  - Lỗi chụp ảnh/ghi nhật ký bắt tại đây, đánh dấu `evidence_missing = 1`, không đổi trạng thái test case (BR-004).
- Cập nhật `src/evidence/index.ts` phơi ra collector.

**Acceptance Criteria (cấp code)**
- [ ] Test case đạt: `status=passed`, không ảnh, `screen`/`failure_type`/`error_message` rỗng.
- [ ] Test case hỏng: `status=failed` kèm `screen`, `failure_type`, `error_message`, và ảnh bước hỏng.
- [ ] Lỗi thu thập bằng chứng → `evidence_missing=1`, trạng thái test case giữ nguyên (test đơn vị).
- [ ] `onScenarioEnd` đẩy bản ghi qua repository theo một giao dịch.
- [ ] `passed_healed` nằm trong tập giá trị hợp lệ dù Phase 1 không sinh.

## Definition of Done (US)
Theo `conventions.md` §4.

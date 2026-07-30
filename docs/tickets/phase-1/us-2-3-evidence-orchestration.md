# US-2.3: Điều phối bằng chứng

**Epic:** EPIC-2 — Tương tác phần tử & bằng chứng
**Business US (BA):** US-13, US-14, US-15
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.4, US-2.2

## Mục tiêu
Điều phối nhật ký, ảnh chụp và phân loại lỗi thành một bản ghi kết quả cho mỗi test case, đẩy sang Result Store theo một giao dịch.

## Tickets

### TICKET-016: Dựng bằng chứng và đẩy bản ghi
**Thiết kế liên quan:** component-design.md#Evidence-Collector (`evidence-collector.ts`), interface-spec.md#Evidence-Collector (`onStepEnd`, `onScenarioEnd`, `setCurrentScreen`), sequence-diagrams.md#2, erd.md (TestCaseResult, StepLog), ADR-011, ADR-016, BR-003, BR-004, BR-014, FR-EXEC-03→06, FR-EXEC-10
**Phụ thuộc:** TICKET-007, TICKET-013, TICKET-014, TICKET-015

**Chỉ dẫn code**
- `src/evidence/evidence-collector.ts` — factory `createEvidenceCollector(deps)`, một collector cho mỗi lượt chạy; trạng thái theo từng test case (nhật ký, ảnh đang chờ, màn hình tại bước hỏng, phân loại) reset sau mỗi `onScenarioEnd`. Deps tiêm vào: `repository` (dùng `saveTestCaseResult`), `screenshotter`, `appId`, `runId`, `newId` (sinh id cho `TestCaseResult`/`StepLog`), `outputDir?`.
  - `onStepEnd(step: { order; text; result; duration_ms; error?; capture? }): void` — đồng bộ; thêm mục vào nhật ký (`execution-log`). Nếu bước hỏng: phân loại lỗi (`failure-classifier`), ghi lại màn hình hiện tại làm màn hình bước hỏng. Nếu bước hỏng **hoặc** `capture === true` (bước đánh dấu chụp, BR-003): kích hoạt `captureScreenshot` và giữ promise chụp đang chờ, ngoài đường chờ của bước (NFR-10). Không `await` ở đây.
  - `onScenarioEnd(info: { test_feature; test_case; started_at; duration_ms }): Promise<TestCaseResult>` — `await` mọi promise chụp đang treo để có `screenshot_path`; chốt trạng thái (`passed`/`failed` suy từ nhật ký; `passed_healed` hợp lệ trong tập nhưng chỉ phát sinh từ Phase 2); dựng `TestCaseResult` đủ trường theo erd và `StepLog[]` (điền `screenshot_path` theo `step_order`); đẩy sang Result Store theo một giao dịch (`saveTestCaseResult`), rồi reset trạng thái test case.
  - `setCurrentScreen(name): void` — Test Runner gọi khi màn hình đổi; collector giữ làm màn hình hiện tại, đọc tại bước hỏng để điền `screen` (ADR-011).
  - Lỗi chụp ảnh bắt trong `captureScreenshot` (trả `missing`); collector đặt `evidence_missing = 1` khi có ảnh thiếu, không đổi trạng thái test case (BR-004).
- Cập nhật `src/evidence/index.ts` phơi ra collector.

**Convention áp dụng:** `coding-convention.md` §Đặt tên (snake_case trên bản ghi kết quả, camelCase cho hàm/biến), §Bằng chứng thực thi, §Thực thi & style (test đơn vị).

**Acceptance Criteria (cấp code)**
- [ ] Test case đạt: `status=passed`, không ảnh, `screen`/`failure_type`/`error_message` rỗng.
- [ ] Test case hỏng: `status=failed` kèm `screen`, `failure_type`, `error_message`, và ảnh bước hỏng (`screenshot_path` trên đúng `StepLog`).
- [ ] Bước đạt được đánh dấu chụp (`capture`) sinh ảnh; bước đạt không đánh dấu không sinh ảnh (BR-003).
- [ ] Lỗi thu thập bằng chứng → `evidence_missing=1`, trạng thái test case giữ nguyên (test đơn vị).
- [ ] `onScenarioEnd` đẩy bản ghi qua repository theo một giao dịch, đóng dấu id cho `TestCaseResult` và `StepLog`.
- [ ] `passed_healed` nằm trong tập giá trị hợp lệ dù Phase 1 không sinh.

## Definition of Done (US)
Theo `conventions.md` §4.

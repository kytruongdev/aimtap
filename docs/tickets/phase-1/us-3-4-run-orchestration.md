# US-3.4: Điều phối lượt chạy

**Epic:** EPIC-3 — Thiết bị & vòng đời lượt chạy
**Business US (BA):** US-09, US-11, US-12, US-13, US-20
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.4, US-2.3, US-3.1, US-3.2, US-3.3

## Mục tiêu
Sự kiện vòng đời Cucumber chuyển thành bằng chứng, và một lượt chạy có vòng đời đầy đủ: mở phiên, probe trước mỗi test case, chạy hết tập dù có test case hỏng, gom trạng thái tổng hợp, dừng đúng khi hủy hoặc thiết bị mất.

## Tickets

### TICKET-018: Móc Cucumber → bằng chứng
**Thiết kế liên quan:** component-design.md#Test-Runner (`cucumber-hooks.ts`), interface-spec.md#Evidence-Collector, sequence-diagrams.md#2, ADR-011, UC-07
**Phụ thuộc:** TICKET-016, TICKET-017

**Chỉ dẫn code**
- `src/runner/cucumber-hooks.ts`:
  - `beforeScenario` — khởi tạo nhật ký cho test case mới.
  - `beforeStep`/`afterStep` — đo thời lượng bước, gọi `onStepEnd` với `order`, `text`, `result`, `duration`, `error?`.
  - `afterScenario` — gọi `onScenarioEnd` để chốt và đẩy bản ghi.
  - Giữ "màn hình hiện tại": cung cấp cơ chế để Locator Resolver báo `screenName` (`setCurrentScreen`) và chuyển tới Evidence Collector (ADR-011).
- Import Evidence Collector và Locator Resolver qua `index.ts`. Cập nhật `src/runner/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] Mỗi bước Cucumber sinh đúng một lời gọi `onStepEnd` với thời lượng đo được.
- [ ] `afterScenario` gọi `onScenarioEnd` đúng một lần cho mỗi test case.
- [ ] `screenName` do Locator Resolver báo được chuyển tới Evidence Collector và điền vào `screen` khi bước hỏng (ADR-011).
- [ ] Không import chéo phá ranh giới module.

### TICKET-019: Vòng đời lượt chạy
**Thiết kế liên quan:** component-design.md#Test-Runner (`run-session.ts`), sequence-diagrams.md#1, #2, #3, erd.md#Entity:-Run, ADR-010, BR-002, BR-011, BR-012, BR-018, FR-RUN-01→06
**Phụ thuộc:** TICKET-007, TICKET-009, TICKET-010, TICKET-018

**Chỉ dẫn code**
- `src/runner/run-session.ts`:
  - `startRun(scope, deviceContext)` — sinh `run-id`; `saveRunStart` ghi bối cảnh (gồm `scope_kind`/`scope_criteria`).
  - Vòng lặp test case: trước mỗi test case gọi `probeDuringRun`; `ready` thì chạy, `unavailable` thì dừng với `stop_reason = device_unavailable` (BR-018, ADR-010).
  - Test case `failed` không dừng lượt chạy; chuyển test case kế tiếp không phụ thuộc loại lỗi (BR-002).
  - Hủy bởi QC: dừng với `stop_reason = cancelled_by_qc`.
  - Dừng bất thường: `finalizeRun` với `completion = incomplete`, `not_run_count`; test case chưa chạy không sinh bản ghi (BR-012). Chạy hết: `completion = completed`, tính `aggregate_result` (BR-011) trên tập đã chọn.
  - Áp tập chọn (US-12 BA) lên danh sách test case: theo test feature, tên test case, hoặc nhãn.
  - Phát sự kiện tiến trình (test case đang chạy, số đã hoàn tất/tổng, trạng thái từng test case) cho lớp hiển thị (US-4.3).
- Import Device, Store, Evidence/hooks qua `index.ts`. Cập nhật `src/runner/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] Test case hỏng không dừng lượt chạy; test case kế tiếp vẫn chạy (test đơn vị với runner giả lập).
- [ ] `probeDuringRun` trả `unavailable` làm lượt chạy dừng với `stop_reason = device_unavailable`, đánh dấu `incomplete`, ghi `not_run_count`.
- [ ] Hủy bởi QC dừng với `stop_reason = cancelled_by_qc`, giữ kết quả đã chạy.
- [ ] `aggregate_result` tính trên tập đã chọn, `passed` chỉ khi mọi test case ở `passed`/`passed_healed` (BR-011).
- [ ] Test case chưa chạy không sinh bản ghi kết quả.
- [ ] Phát đủ sự kiện tiến trình cho lớp hiển thị.

## Definition of Done (US)
Theo `conventions.md` §4.

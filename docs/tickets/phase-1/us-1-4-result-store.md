# US-1.4: Result Store

**Epic:** EPIC-1 — Nền tảng lõi
**Business US (BA):** US-15, US-11, US-02
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1

## Mục tiêu
Mỗi ứng dụng có một tệp SQLite kết quả tại `output/<app-id>/results.db` với schema ba bảng theo ERD, và repository ghi/đọc chỉ chèn thêm, ghi mỗi test case theo một giao dịch.

## Tickets

### TICKET-006: Mở SQLite, migration khởi tạo, models
**Thiết kế liên quan:** component-design.md#Result-Store, erd.md (Run, TestCaseResult, StepLog, chỉ mục), north-star.md#2.2 (Hiệu suất — WAL, câu lệnh chuẩn bị), coding-convention.md#Truy-cập-dữ-liệu-kết-quả, ADR-003
**Phụ thuộc:** TICKET-002

**Chỉ dẫn code**
- `src/store/database.ts`: mở SQLite qua `better-sqlite3` tại `output/<app-id>/results.db`, bật WAL, chạy migration lúc khởi động, chuẩn bị câu lệnh dùng lại.
- `src/store/migrations/001-initial.ts`: tạo ba bảng đúng `erd.md` — `Run` (đủ trường gồm `completion`, `aggregate_result`, `scope_kind`, `scope_criteria`, `not_run_count`, `stop_reason`, `schema_version`), `TestCaseResult` (`status` `passed`|`failed`|`passed_healed`, `failure_type` `wrong_conclusion`|`step_not_executed`, `screen`, `error_message`, `evidence_missing`; FK `run_id`), `StepLog` (`step_order`, `step_text`, `result`, `duration_ms`, `error_message?`, `screenshot_path?`; FK `test_case_result_id`). Chỉ mục Phase 3: `(app_id, test_feature, test_case)`, `(app_id, screen)` trên TestCaseResult; `(app_id, started_at)` trên Run.
- Migration đánh số, chạy tuần tự lúc khởi động; không sửa migration đã phát hành.
- `src/store/models.ts`: kiểu bản ghi khớp `erd.md` và interface-spec §Hợp đồng dữ liệu; tên trường `snake_case`.
- `src/store/index.ts` phơi ra hàm mở database và kiểu models.

**Acceptance Criteria (cấp code)**
- [ ] Chạy migration trên database rỗng tạo đủ ba bảng, ràng buộc và chỉ mục theo ERD (test đơn vị trên SQLite tạm).
- [ ] Mỗi `<app-id>` có tệp `results.db` riêng dưới `output/<app-id>/`.
- [ ] WAL bật; câu lệnh dùng lại được chuẩn bị sẵn.
- [ ] Kiểu models khớp danh sách trường bắt buộc ở interface-spec §Hợp đồng dữ liệu.

### TICKET-007: Repository ghi/đọc lượt chạy
**Thiết kế liên quan:** component-design.md#Result-Store, interface-spec.md#Result-Store-(repository), erd.md#Quan-hệ, FR-DATA-01→05, BR-009, BR-011, BR-012, ADR-003
**Phụ thuộc:** TICKET-006

**Chỉ dẫn code**
- `src/store/run-repository.ts`:
  - `saveRunStart(run)` — chèn hàng Run với bối cảnh lúc mở (định danh, thời điểm bắt đầu, ứng dụng, phiên bản, thiết bị, loại thiết bị, OS, `scope_kind`/`scope_criteria`, `schema_version`) ở trạng thái chưa hoàn tất, để khóa ngoại của TestCaseResult phân giải được trong lúc chạy.
  - `finalizeRun(summary)` — hoàn tất hàng tổng hợp của chính lượt chạy đó: `ended_at`, `total_duration_ms`, `completion`, `not_run_count`, `stop_reason`, và `aggregate_result` suy từ các TestCaseResult đã lưu (BR-011). Hoàn tất đúng một lần: gọi lần hai, hoặc gọi cho một lượt chạy không tồn tại, ném `PlatformFailure`.
  - `saveTestCaseResult(result, steps[])` — một giao dịch cho mỗi test case: chèn TestCaseResult + các StepLog.
  - `getRunModel(runId)` — đọc `{ run; results[]; steps[] }` cho Reporter.
  - Bản ghi kết quả (TestCaseResult, StepLog) chỉ chèn thêm — không có đường cập nhật hay xóa; một lượt chạy mới không ghi đè dữ liệu của lượt chạy trước (FR-DATA-05, BR-009).
- Mọi truy cập DB đi qua repository này. Cập nhật `src/store/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] Ghi một test case là một giao dịch (test đơn vị mô phỏng lỗi giữa chừng).
- [ ] Bản ghi kết quả chỉ chèn thêm: không có đường cập nhật/xóa cho TestCaseResult và StepLog; ghi đè một lượt chạy đã tồn tại bị chặn.
- [ ] Hàng tổng hợp của lượt chạy được hoàn tất đúng một lần bằng `finalizeRun`; gọi lần hai hoặc gọi cho `run_id` không tồn tại ném `PlatformFailure`.
- [ ] `getRunModel` trả đủ `run`, `results[]`, `steps[]`.
- [ ] `aggregate_result = passed` chỉ khi mọi test case ở `passed`/`passed_healed` (test đơn vị).
- [ ] Lượt chạy bị ngắt vẫn còn dữ liệu test case đã hoàn tất (BR-012).

## Definition of Done (US)
Theo `conventions.md` §4.

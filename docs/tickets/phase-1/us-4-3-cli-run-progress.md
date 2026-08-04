# US-4.3: CLI `run` + tiến trình

**Epic:** EPIC-4 — Báo cáo & CLI
**Business US (BA):** US-09, US-10, US-12
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.2, US-1.3, US-3.1, US-3.4, US-4.1, US-4.2

## Mục tiêu
QC khởi chạy một lượt chạy bằng `aimtap run <app-id>`: kiểm tra đủ tiền điều kiện rồi mở lượt chạy hoặc từ chối kèm lý do; hỗ trợ chọn tập con; hiển thị tiến trình trong lúc chạy.

## Tickets

### TICKET-021: `aimtap run` + chuỗi tiền điều kiện + chọn tập
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/run.ts`), interface-spec.md (loadAppConfig, verifyTestDataComplete, ensureReadyBeforeRun, installBuild), runner `launchRun` (ADR-018), sequence-diagrams.md#1, ADR-009, ADR-018, UC-06 (E1, E2, E3), BR-015, FR-RUN-01, FR-RUN-02
**Phụ thuộc:** TICKET-004, TICKET-005, TICKET-009, TICKET-019, TICKET-025

**Chỉ dẫn code**
- `src/cli/commands/run.ts`: `aimtap run <app-id> [--scope ...]`:
  - Phân giải tham số: thiết bị, tập chạy theo test feature/tên test case/nhãn (US-12 BA).
  - Chuỗi tiền điều kiện theo sequence-diagram §1, đúng thứ tự: `loadAppConfig` → `verifyTestDataComplete` → `ensureReadyBeforeRun` → `installBuild`. Bất kỳ mục nào không thỏa: không mở lượt chạy, không sinh bản ghi, không sinh báo cáo; nêu lý do theo từng mục (UC-06 E1, BR-015).
  - Tập chạy rỗng: không mở, nêu tiêu chí chọn không khớp test case nào (UC-06 E2).
  - Thỏa hết: CLI sinh `run-id`, dựng + **assert `AIMTAP_*` (nhà chính, ADR-009/ADR-018)** rồi gọi `runner.launchRun({ runId, appConfig, deviceContext, scope, outputDir })` (bọc `@wdio/cli` Launcher, tiêm env `AIMTAP_*`+`AIMTAP_RUN_ID`, dịch scope → spec/tag Cucumber). Tiến trình per-test hiển thị bởi reporter WDIO trong worker (TICKET-022), không phải luồng xuyên tiến trình.
  - Kết thúc lượt chạy: gọi Reporter sinh báo cáo (UC-06 bước 7). Hủy giữa chừng → `stop_reason = cancelled_by_qc` (UC-06 E3).
- Import qua `index.ts` các module liên quan. Cập nhật `Makefile` đích `run`.

**Acceptance Criteria (cấp code)**
- [ ] Tiền điều kiện không thỏa → lượt chạy không mở, không sinh bản ghi/báo cáo, lý do nêu theo từng mục (test đơn vị với các bước giả lập).
- [ ] Tập chạy rỗng → không mở, nêu tiêu chí không khớp.
- [ ] Thỏa hết → mở lượt chạy, ghi bối cảnh, chạy tới cuối và sinh báo cáo.
- [ ] Chọn tập con theo test feature/tên/nhãn phản ánh đúng vào `scope_kind`/`scope_criteria`.
- [ ] Hủy giữa chừng ghi `stop_reason = cancelled_by_qc` và vẫn sinh báo cáo.

### TICKET-022: Hiển thị tiến trình lượt chạy
**Thiết kế liên quan:** runner `progress-reporter.ts` (reporter WDIO worker, ADR-018 Phương án a), sequence-diagrams.md#1, FR-RUN-03, UC-06 (bước 5)
**Phụ thuộc:** TICKET-019, TICKET-020

**Chỉ dẫn code**
- `src/runner/progress-reporter.ts`: reporter WDIO chạy trong worker (ADR-018) — in test case đang chạy kèm test feature, số đã hoàn tất, và trạng thái mỗi test case ngay khi nó kết thúc (không chờ hết lượt chạy). `ProgressTracker` giữ phần đếm/định dạng thuần (test được); reporter map sự kiện WDIO/Cucumber (feature = suite, scenario = suite lồng) lên tracker.
- Đăng ký reporter ở `config/wdio.shared.conf.ts` (`reporters`). Không phải bộ tiêu thụ luồng ở tiến trình CLI (gỡ mâu thuẫn ADR-013↔component-design theo ADR-018).

**Acceptance Criteria (cấp code)**
- [ ] Hiển thị test case đang chạy kèm test feature và số đã hoàn tất/tổng.
- [ ] Trạng thái mỗi test case hiện ra ngay khi test case kết thúc (test đơn vị với luồng sự kiện giả lập).
- [ ] Không phụ thuộc việc lượt chạy hoàn tất để hiện trạng thái từng test case.

## Definition of Done (US)
Theo `conventions.md` §4.

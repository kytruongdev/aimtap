# US-4.4: CLI `report`

**Epic:** EPIC-4 — Báo cáo & CLI
**Business US (BA):** US-16
**Độ ưu tiên:** Medium
**Phụ thuộc:** US-4.1, US-4.2

## Mục tiêu
QC sinh lại báo cáo của một lượt chạy đã lưu bằng `aimtap report <run-id>`, không chạy lại test case.

## Tickets

### TICKET-023: `aimtap report`
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/report.ts`), interface-spec.md#Reporter, sequence-diagrams.md#4, ADR-006, FR-REP-01
**Phụ thuộc:** TICKET-020, TICKET-025

**Chỉ dẫn code**
- `src/cli/commands/report.ts`: `aimtap report <run-id> [--format pdf|png]`:
  - Gọi `buildReportModel(runId)` rồi `render(model, format)`; in đường dẫn tệp báo cáo.
  - Không chạy lại test case; chỉ đọc dữ liệu đã lưu (ADR-006).
  - `run-id` không tồn tại: báo lỗi rõ ràng, không tạo tệp rỗng.
- Đăng ký lệnh vào khung CLI; cập nhật `Makefile` đích `report`. Import Reporter qua `src/reporter/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] `make report RUN=<run-id>` (hoặc tương đương) sinh tệp báo cáo từ dữ liệu đã lưu, in đường dẫn.
- [ ] Không chạy lại test case.
- [ ] `run-id` không tồn tại → báo lỗi rõ, không tạo tệp.
- [ ] Cùng luồng render với báo cáo tự sinh ở cuối lượt chạy (TICKET-021).

## Definition of Done (US)
Theo `conventions.md` §4.

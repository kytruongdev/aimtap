# US-4.1: Sinh báo cáo

**Epic:** EPIC-4 — Báo cáo & CLI
**Business US (BA):** US-16, US-17, US-18
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.4

## Mục tiêu
Sinh một tệp báo cáo PNG/PDF của một lượt chạy từ dữ liệu đã lưu: bối cảnh, bảng tóm tắt nhóm theo test feature, chi tiết mỗi test case hỏng; render giống nhau trên mọi máy QC, đính được Jira.

## Tickets

### TICKET-024: Dựng mô hình báo cáo
**Thiết kế liên quan:** component-design.md#Reporter (`report-model.ts`), interface-spec.md#Reporter (`buildReportModel`), sequence-diagrams.md#4, ADR-006, ADR-011, FR-REP-01→04, BR-011, BR-012, BR-014, BR-016
**Phụ thuộc:** TICKET-007

**Chỉ dẫn code**
- `src/reporter/report-model.ts`: `buildReportModel(runId): ReportModel` — đọc qua `getRunModel`, dựng:
  - Bối cảnh: ứng dụng, phiên bản, thiết bị, loại thiết bị, OS, thời điểm bắt đầu, tổng thời lượng, tổng số test case và số lượng theo từng trạng thái.
  - Bảng tóm tắt nhóm theo test feature (BR-016): mỗi dòng test case gồm tên, trạng thái, thời lượng.
  - Chi tiết mỗi test case hỏng: đường dẫn ảnh bước hỏng, nhật ký thực thi, tên màn hình, `failure_type`, thông báo lỗi gốc.
  - Lượt chạy `incomplete`: số test case chưa chạy và `stop_reason` (BR-012). `evidence_missing` đánh dấu là thiếu, không để trống (BR-004).
  - Nhánh `env` không bí mật được phép hiện trong bối cảnh; giá trị bí mật không xuất hiện.
- Logic thuần đọc dữ liệu, không render, không chạm thiết bị. Cập nhật `src/reporter/index.ts` phơi ra `buildReportModel` và kiểu `ReportModel`.

**Acceptance Criteria (cấp code)**
- [ ] Mô hình gồm đủ bối cảnh, bảng tóm tắt nhóm theo test feature, chi tiết test case hỏng (test đơn vị trên dữ liệu Store giả lập).
- [ ] Lượt chạy `incomplete` có số test case chưa chạy và `stop_reason` trong mô hình.
- [ ] `evidence_missing` biểu diễn là thiếu, không bỏ trống.
- [ ] Không có giá trị dữ liệu kiểm thử bí mật trong mô hình.

### TICKET-025: Mẫu HTML + xuất PNG/PDF
**Thiết kế liên quan:** component-design.md#Reporter (`templates/`, `render.ts`), interface-spec.md#Reporter (`render`), interface-spec.md#Tích-hợp-ngoài (Jira), sequence-diagrams.md#4, ADR-006, ADR-012, FR-REP-01→04, BC-05
**Phụ thuộc:** TICKET-024

**Chỉ dẫn code**
- `src/reporter/templates/`: mẫu HTML/CSS do nền tảng kiểm soát cho bối cảnh, bảng tóm tắt theo test feature, chi tiết test case hỏng (nhúng ảnh theo đường dẫn tương đối).
- `src/reporter/render.ts`: `render(model, format: 'pdf' | 'png'): string` — dựng HTML từ mẫu + đọc tệp ảnh, xuất bằng Puppeteer kèm Chromium đóng gói (ADR-012); trả đường dẫn tệp dưới `output/<app-id>/reports/<run-id>.<pdf|png>`. Một tệp báo cáo một lượt chạy (US-17 BA). Sinh lại được bất kỳ lúc nào từ dữ liệu đã lưu, không chạy lại test case.
- Cập nhật `src/reporter/index.ts` phơi ra `render`; cập nhật `Makefile`/tài liệu nếu cần bước tải Chromium.

**Acceptance Criteria (cấp code)**
- [ ] `render` sinh đúng một tệp PNG hoặc PDF tại `output/<app-id>/reports/<run-id>.<ext>`.
- [ ] Báo cáo chứa bối cảnh, bảng tóm tắt nhóm theo test feature, chi tiết mỗi test case hỏng (ảnh, nhật ký, màn hình, loại lỗi, thông báo lỗi gốc).
- [ ] Lượt chạy `incomplete` vẫn sinh báo cáo, nêu số test case chưa chạy và lý do dừng.
- [ ] Bằng chứng thiếu hiển thị là thiếu, không để trống.
- [ ] Sinh lại từ dữ liệu đã lưu cho cùng kết quả, không chạy lại test case.

## Definition of Done (US)
Theo `conventions.md` §4.

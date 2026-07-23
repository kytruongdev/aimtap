# US-4.2: Nền CLI + `doctor`

**Epic:** EPIC-4 — Báo cáo & CLI
**Business US (BA):** US-08
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1, US-3.1

## Mục tiêu
Có khung CLI đăng ký lệnh và lệnh `aimtap doctor` báo tình trạng môi trường máy QC.

## Tickets

### TICKET-020: Khung lệnh + `aimtap doctor`
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/doctor.ts`), north-star.md#2.1 (cli/), north-star.md#2.3 (make doctor), coding-convention.md#Ghi-log, UC-05
**Phụ thuộc:** TICKET-001, TICKET-008

**Chỉ dẫn code**
- `src/cli/index.ts`: đăng ký lệnh và phân giải tham số dòng lệnh; điểm vào của `aimtap`.
- `src/cli/commands/doctor.ts`: `aimtap doctor` — gọi `environmentCheck` của Device & Build Manager, in danh sách mục kiểm tra kèm trạng thái và lý do; mã thoát khác 0 khi có mục không đạt.
- In qua lớp trình bày CLI; log nội bộ qua `shared/logger.ts`. Cập nhật `Makefile` đích `doctor`. Import Device qua `src/device/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] `make doctor` chạy `aimtap doctor`, in đủ mục môi trường kèm trạng thái.
- [ ] Mã thoát khác 0 khi có mục không đạt; bằng 0 khi mọi mục đạt.
- [ ] Khung CLI đăng ký được lệnh khác (run, report) ở các user story sau mà không sửa lại khung.

## Definition of Done (US)
Theo `conventions.md` §4.

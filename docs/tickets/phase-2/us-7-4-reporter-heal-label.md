# US-7.4: Trục trạng thái hai giá trị + hiển thị tự phục hồi trong báo cáo

**Epic:** EPIC-7 — Tự phục hồi locator lúc chạy
**Business US (BA):** US-202, US-203
**Độ ưu tiên:** High
**Phụ thuộc:** US-7.1

## Mục tiêu
Trạng thái test case rút còn hai giá trị `passed`/`failed`; "đạt kèm tự phục hồi" là nhãn dẫn xuất (đạt và có ≥1 heal_event). Báo cáo HTML hiện mỗi lần tự phục hồi: locator cũ→mới, ảnh phần tử, màn hình, bước.

## Tickets

### TICKET-039: Rút `TestCaseStatus` còn hai giá trị
**Thiết kế liên quan:** interface-spec.md#test_case_result.status, erd.md#Thay-đổi-test_case_result, ADR-024, BR-204
**Phụ thuộc:** TICKET-034

**Chỉ dẫn code**
- `src/store/models.ts`: `TestCaseStatus = 'passed' | 'failed'` (bỏ `passed_healed` — ADR-024; kết luận do phép kiểm quyết định, BR-204).
- `src/store/run-repository.ts`: đơn giản hóa truy vấn tổng hợp dùng `passed_healed` (dòng `status NOT IN ('passed', 'passed_healed')`) thành `status NOT IN ('passed')` — vì `passed_healed` không còn là giá trị ghi. DB `CHECK` giữ permissive (không rebuild bảng — TICKET-034).
- Đường ghi status vốn chỉ ghi `passed`/`failed` (Phase 1 chưa từng ghi giá trị thứ ba) nên không migrate dữ liệu.

**Acceptance Criteria (cấp code)**
- [ ] `TestCaseStatus` chỉ còn `passed`/`failed`; `make typecheck` xanh toàn repo.
- [ ] Truy vấn tổng hợp hỏng không tham chiếu `passed_healed`; test store xanh.

### TICKET-040: Báo cáo — nhãn dẫn xuất + mục hiển thị tự phục hồi
**Thiết kế liên quan:** component-design.md#Reporter (thêm hiển thị tự phục hồi), interface-spec.md#Result-Store-heal_event, interface-spec.md#test_case_result.status, ADR-019 (HTML tự chứa), ADR-024, FR-HEAL-05, FR-HEAL-07, BR-206
**Phụ thuộc:** TICKET-035, TICKET-039

**Chỉ dẫn code**
- `src/reporter/report-model.ts`:
  - Bỏ trường/đếm `passed_healed` khỏi `ReportTotals` và vòng đếm; chỉ đếm `passed`/`failed`.
  - Nhãn "đạt kèm tự phục hồi" = **dẫn xuất**: test case `status === 'passed'` AND có ≥1 `heal_event` (từ `getRunModel`, US-7.1). Không thêm giá trị status.
  - Dựng mô hình mục hiển thị mỗi lần tự phục hồi: `expected_locator` (cũ), `used_locator` (mới), `screenshot_path`, `screen`, `step_order`; gom theo test case. Test case hỏng có heal vẫn liệt kê các heal (BR-205).
- `src/reporter/run-summary.ts`: bỏ nhánh/đếm `passed_healed` (gồm nhãn `↻ HEAL`); nếu cần chỉ dấu heal trong summary thì tính từ sự tồn tại heal_event, không từ status.
- `src/reporter/report-html.ts`: bỏ ô "Passed (healed)" và class `status-passed_healed`; thêm khối HTML mỗi lần tự phục hồi (locator cũ→mới, ảnh nhúng data-URI phần tử đã thao tác, màn hình, bước); test đạt có heal gắn nhãn "đạt kèm tự phục hồi"; escape HTML mọi giá trị nội suy (như Phase 1). Ảnh nhúng theo cơ chế `dataUriResolver` sẵn có.
- Cập nhật các test reporter (`report-model.test.ts`, `run-summary.test.ts`, `report-html.test.ts`) bỏ kỳ vọng `passed_healed`, thêm ca nhãn dẫn xuất + render heal (đạt-có-heal, hỏng-có-heal, đạt-không-heal).

**Acceptance Criteria (cấp code)**
- [ ] Đếm chỉ theo `passed`/`failed`; không còn `passed_healed` trong reporter (test đơn vị).
- [ ] Test đạt + ≥1 heal_event → gắn nhãn "đạt kèm tự phục hồi"; đạt + 0 heal → không nhãn (test đơn vị).
- [ ] Mỗi lần tự phục hồi hiển thị locator cũ→mới + ảnh + màn hình + bước; test hỏng có heal vẫn hiển thị (test đơn vị).
- [ ] Mọi giá trị nội suy được escape HTML; ảnh nhúng data-URI.

## Definition of Done (US)
Theo `conventions.md` §4.

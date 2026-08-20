# US-7.1: Lưu trữ heal_event

**Epic:** EPIC-7 — Tự phục hồi locator lúc chạy
**Business US (BA):** US-202, US-203
**Độ ưu tiên:** High
**Phụ thuộc:** — (dựng trên Phase 1 `store`)

## Mục tiêu
Store lưu từng lần tự phục hồi thành bảng `heal_event` append-only, và trả các lần tự phục hồi của một lượt chạy để Reporter dựng nhãn và mục hiển thị. Ticket này thuần thêm (additive), chưa đổi trục trạng thái (thuộc US-7.4).

## Tickets

### TICKET-034: Migration 002 — bảng `heal_event` + model
**Thiết kế liên quan:** erd.md#Entity-heal_event, component-design.md#Result-Store, interface-spec.md#heal_event, ADR-024, ADR-020, BR-205, BR-207
**Phụ thuộc:** —

**Chỉ dẫn code**
- `src/store/migrations/002-heal-event.ts`: `Migration` version `2`, `up(db)` tạo bảng `heal_event` đúng `erd.md`:
  - `id TEXT PRIMARY KEY`, `test_case_result_id TEXT NOT NULL REFERENCES test_case_result(id)`, `step_order INTEGER NOT NULL`, `screen TEXT NOT NULL`, `expected_locator TEXT NOT NULL`, `used_locator TEXT NOT NULL`, `screenshot_path TEXT` (NULL cho phép), `occurred_at TEXT NOT NULL`.
  - Index `idx_heal_tcr ON heal_event (test_case_result_id)` cho join theo lượt chạy.
  - **KHÔNG** rebuild `test_case_result`: giữ `CHECK` cũ permissive; Phase 1 chưa từng ghi `passed_healed` nên không cần siết (chọn theo `erd.md` §Thay-đổi-test_case_result — quyền Team Lead ở migration). Trục trạng thái hai giá trị xử lý ở tầng kiểu, US-7.4.
- `src/store/database.ts`: thêm `migration002` vào mảng `migrations` (chạy theo version, idempotent — không sửa `001`, ADR-020).
- `src/store/models.ts`: thêm kiểu `HealEvent` (khớp cột trên; `screenshot_path: string | null`). **Chưa** đụng `TestCaseStatus` (US-7.4).

**Acceptance Criteria (cấp code)**
- [ ] Chạy migration trên DB trống và trên DB đã ở version 1 đều thành công, lên version 2 (test đơn vị trên SQLite tạm).
- [ ] Bảng `heal_event` có đủ cột + index; `screenshot_path` cho phép NULL.
- [ ] Migration `001` không bị sửa; kiểu `HealEvent` suy từ hình dạng bảng, không `any`.

### TICKET-035: Repository — `saveHealEvents` + `getRunModel` trả heal_event
**Thiết kế liên quan:** interface-spec.md#Result-Store-heal_event, component-design.md#Result-Store, erd.md#Quan-hệ, ADR-024, BR-205, BR-207
**Phụ thuộc:** TICKET-034

**Chỉ dẫn code**
- `src/store/run-repository.ts` (hoặc `heal-repository.ts` cùng module):
  - `saveHealEvents(events: HealEvent[]): void` — ghi append-only; gọi được **trong cùng giao dịch** với `saveTestCaseResult` của test case tương ứng (Evidence Collector US-7.3 điều phối giao dịch). Không cập nhật/không xóa (BR-207).
  - Mở rộng `getRunModel(runId)` trả kèm `heal_event` của lượt chạy (join qua `test_case_result_id`), gom theo test case, để Reporter dựng nhãn + mục hiển thị (US-7.4).
- `src/store/index.ts`: phơi `saveHealEvents` và kiểu liên quan; `getRunModel` giữ tên, mở rộng kết quả trả về (bổ sung trường heal, không phá chữ ký cũ).
- Mọi truy cập DB qua repository (coding-convention.md §Store); module khác không viết SQL.

**Acceptance Criteria (cấp code)**
- [ ] `saveHealEvents` ghi nhiều dòng và đọc lại đúng; không có đường cập nhật/xóa (test đơn vị SQLite tạm).
- [ ] `getRunModel` trả `heal_event` gom theo test case, gồm cả test case hỏng có heal (BR-205) (test đơn vị).
- [ ] Ghi heal_event nằm được trong cùng giao dịch với bản ghi test case (test đơn vị mô phỏng giao dịch).

## Definition of Done (US)
Theo `conventions.md` §4.

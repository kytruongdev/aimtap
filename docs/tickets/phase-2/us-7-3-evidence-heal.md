# US-7.3: Ghi nhận & chụp ảnh lần tự phục hồi

**Epic:** EPIC-7 — Tự phục hồi locator lúc chạy
**Business US (BA):** US-202
**Độ ưu tiên:** High
**Phụ thuộc:** US-7.1

## Mục tiêu
Evidence Collector nhận `HealRecord` từ Locator Resolver, chụp ảnh phần tử AI đã thao tác (ngoài đường chờ của bước, NFR-10), và ghi `heal_event` cùng bản ghi test case theo giao dịch cuối test case.

## Tickets

### TICKET-038: `onHeal` — chụp ảnh phần tử + ghi heal_event theo giao dịch
**Thiết kế liên quan:** component-design.md#Evidence-Collector (thêm ghi nhận tự phục hồi), interface-spec.md#Evidence-Collector-ghi-nhận-tự-phục-hồi, erd.md#Entity-heal_event, ADR-024, ADR-011, BR-205, BR-206, NFR-10
**Phụ thuộc:** TICKET-035

**Chỉ dẫn code**
- `src/evidence/evidence-collector.ts` (mở rộng bộ thu sự kiện hiện có):
  - `onHeal(record: HealRecord): void` — đồng bộ; kích hoạt chụp ảnh phần tử AI đã thao tác **ngoài đường chờ của bước** (giữ promise chụp đang treo, cùng mô hình `onStepEnd` của US-2.3, NFR-10). Ảnh ghi ra tệp qua `screenshot-writer`; đường dẫn gắn vào bản ghi heal sau khi chụp xong.
  - Ở `onScenarioEnd`: chờ mọi promise chụp heal đang treo (như chờ ảnh bước hỏng), dựng danh sách `HealEvent` (gắn `test_case_result_id`, `screenshot_path`), gọi `saveHealEvents` **trong cùng giao dịch** với `saveTestCaseResult` của test case (BR-207). Test case hỏng vẫn ghi các heal của nó (BR-205).
  - Lỗi khi chụp ảnh/ghi không đổi kết luận test case (bằng chứng phụ trợ, BR-004): `screenshot_path` để `null`, log warn, không ném.
- `src/evidence/index.ts`: phơi `onHeal` trên lối vào collector.
- Evidence phụ thuộc `store`, `shared` (đã trong ma trận); không import `locator`/`ai`.

**Acceptance Criteria (cấp code)**
- [ ] `onHeal` kích hoạt chụp ngoài đường chờ của bước (test đơn vị: promise chụp giữ ngoài, không chặn `onHeal`).
- [ ] `onScenarioEnd` ghi `heal_event` cùng giao dịch với bản ghi test case; test case hỏng có heal vẫn ghi heal (test đơn vị SQLite tạm cả hai ca).
- [ ] Lỗi chụp ảnh → `screenshot_path=null`, không ném, không đổi status test case (test đơn vị).
- [ ] `heal_event` mang đủ trường của `erd.md`; đường dẫn ảnh gắn sau khi chụp.

## Definition of Done (US)
Theo `conventions.md` §4. Phần chụp ảnh chạm thiết bị kiểm chứng thủ công; logic điều phối/giao dịch test đơn vị với thiết bị giả lập.

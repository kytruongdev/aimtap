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
Evidence **enrich** `HealSignal` (resolver đẩy — US-7.2) thành `HealEvent` đầy đủ: điền `step_order`, `test_case_result_id`, `screenshot_path`. Resolver không biết số bước vì `find` giữ chữ ký ổn định (ADR-004); Evidence là nơi biết ngữ cảnh bước/test case và gắn ảnh.

- `src/evidence/evidence-collector.ts` (mở rộng bộ thu sự kiện hiện có):
  - `onHeal(signal: HealSignal): void` — đồng bộ; **buffer** signal vào một danh sách heal-đang-treo của bước hiện hành, và kích hoạt chụp ảnh phần tử AI đã thao tác **ngoài đường chờ của bước** (giữ promise chụp, cùng mô hình `onStepEnd` của US-2.3, NFR-10). KHÔNG gán `step_order` ở đây (heal xảy ra **giữa** bước, trước khi bước kết thúc).
  - `onStepEnd(step)` (mở rộng): khi một bước kết thúc, **gán `step.order`** cho mọi heal buffer từ sau bước trước (chúng xảy ra trong chính bước này) → chuyển sang danh sách heal của scenario kèm `step_order`; xóa buffer. Cách này gán đúng bước đang chạy khi heal, không lệch (KHÔNG dùng "bước hiện tại theo `onStepEnd`" vì sẽ ra bước trước).
  - Ở `onScenarioEnd`: chờ mọi promise chụp heal đang treo (như chờ ảnh bước hỏng), dựng danh sách `HealEvent` (điền `test_case_result_id = result.id`, `screenshot_path`, `step_order` đã gán), gọi `saveHealEvents` **trong cùng giao dịch** với `saveTestCaseResult` (BR-207). Test case hỏng vẫn ghi các heal của nó (BR-205). Flush heal buffer còn sót (nếu có) gán bước cuối cùng đã biết.
  - Lỗi khi chụp ảnh/ghi không đổi kết luận test case (bằng chứng phụ trợ, BR-004): `screenshot_path` để `null`, log warn, không ném.
  - `reset()` xóa cả buffer heal + danh sách heal của scenario sau mỗi `onScenarioEnd`.
- **Nơi đặt kiểu (không tạo cạnh chéo):** Evidence khai `onHeal` với **kiểu param của riêng nó** (shape `{ screen, expectedLocator, usedLocator, occurredAt }`), KHÔNG import `HealSignal` từ `locator`. Locator khai `HealSignal` của riêng nó (US-7.2). Hai shape trùng nhau; tầng lắp ráp (US-7.5) bắc cầu `registerHealSink((s) => evidence.onHeal(s))` — TypeScript structural typing khớp, typecheck bắt nếu hai shape lệch. Không cần hoist lên `shared`, không cạnh `evidence → locator`/`locator → evidence` (giống cách assembly bắc cầu `Screenshotter` ở Phase 1).
- `src/evidence/index.ts`: phơi `onHeal` trên lối vào collector.
- Evidence phụ thuộc `store`, `shared` (đã trong ma trận); không import `locator`/`ai`.

**Acceptance Criteria (cấp code)**
- [ ] `onHeal` buffer signal + kích hoạt chụp ngoài đường chờ của bước (test đơn vị: promise chụp giữ ngoài, không chặn `onHeal`).
- [ ] `onStepEnd` gán đúng `step_order` cho heal xảy ra trong bước đó: heal giữa bước N → `heal_event.step_order = N` (test đơn vị: onHeal rồi onStepEnd(N) → record mang N; heal ở bước 1 mang 1).
- [ ] `onScenarioEnd` ghi `heal_event` cùng giao dịch với bản ghi test case; test case hỏng có heal vẫn ghi heal (test đơn vị SQLite tạm cả hai ca).
- [ ] Lỗi chụp ảnh → `screenshot_path=null`, không ném, không đổi status test case (test đơn vị).
- [ ] `heal_event` mang đủ trường của `erd.md` (`step_order`, `test_case_result_id`, `screenshot_path` do Evidence điền); đường dẫn ảnh gắn sau khi chụp.

## Definition of Done (US)
Theo `conventions.md` §4. Phần chụp ảnh chạm thiết bị kiểm chứng thủ công; logic điều phối/giao dịch test đơn vị với thiết bị giả lập.

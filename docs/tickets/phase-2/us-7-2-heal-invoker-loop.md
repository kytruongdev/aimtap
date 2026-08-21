# US-7.2: Suy luận locator qua AI + vòng thử phục hồi

**Epic:** EPIC-7 — Tự phục hồi locator lúc chạy
**Business US (BA):** US-201
**Độ ưu tiên:** High
**Phụ thuộc:** US-6.2

## Mục tiêu
Khi `find` thất bại và AI bật, Locator Resolver gọi một `healFn` (tiêm vào) để lấy locator thay thế từ AI CLI, thử live trong bộ nhớ, lặp tối đa N lần, và đẩy một `HealRecord` sang Evidence khi áp dụng thành công — test chạy tiếp, không dừng giữa chừng. Locator Resolver KHÔNG import AI Gateway (tránh chu trình, ADR-014).

> Ranh giới kiểu `Locator` cho AI Gateway đã chốt: **ADR-027** — nâng kiểu `Locator` + enum `LocatorStrategy` lên `shared`; bộ dựng iOS / `toSelector` / `describeLocator` / logic find giữ ở `locator` (re-export cho tương thích nguồn). AI Gateway import `Locator` từ `shared`; dependency `ai → shared, config` (KHÔNG cạnh `ai → locator`). Bước move ở TICKET-045; heal-invoker dùng kiểu từ `shared`.

## Tickets

### TICKET-045: Nâng kiểu `Locator` + `LocatorStrategy` lên `shared`
**Thiết kế liên quan:** ADR-027, ADR-015 (tiền lệ hoisting hạ tầng dùng chung lên `shared`), north-star.md#2.1 (`Locator`/`LocatorStrategy` ở `shared`), component-design.md#AI-Gateway
**Phụ thuộc:** —

**Chỉ dẫn code**
- Chuyển **định nghĩa kiểu** `Locator` và enum `LocatorStrategy` từ `src/locator/locator.ts` sang `src/shared/` (ví dụ `src/shared/locator-type.ts`), phơi ở `src/shared/index.ts`. Phạm vi = **kiểu + enum**, KHÔNG chuyển bộ dựng.
- Giữ ở `src/locator/`: bộ dựng iOS (`byAccessibilityId`/`byId`/`byPredicate`/`byClassChain`), `toSelector`, `describeLocator`, logic find — nay import kiểu từ `shared`.
- `src/locator/index.ts`: **re-export** `Locator`/`LocatorStrategy` từ `shared` để importer nội bộ và `src/index.ts` (nhập của `apps/`) không đổi đường dùng.
- Không đổi ma trận `element-types`: `locator → shared` đã cho phép; nguồn nhập `apps/` qua `src/index.ts` giữ nguyên.

**Acceptance Criteria (cấp code)**
- [ ] `Locator`/`LocatorStrategy` định nghĩa ở `shared`, phơi qua `shared/index.ts`; `locator` re-export.
- [ ] `make typecheck`/`lint` xanh toàn repo; `apps/*` và importer nội bộ không đổi đường import (test/biên dịch hiện có vẫn xanh).
- [ ] Bộ dựng iOS / `toSelector` / `describeLocator` vẫn ở `locator`.

### TICKET-036: `heal-invoker` — dựng prompt heal, gọi CodeAgent, parse ra `Locator`
**Thiết kế liên quan:** component-design.md#AI-Gateway (`heal-invoker.ts`, `prompts/`), interface-spec.md#CodeAgent (`healLocator`), interface-spec.md#AI-CLI-qua-subprocess (Heal read-only), sequence-diagrams.md#1, ADR-024, ADR-025, ADR-027, BR-201, BR-208
**Phụ thuộc:** TICKET-031, TICKET-045

**Chỉ dẫn code**
- `src/ai/prompts/heal.ts`: `buildHealPrompt(ctx: { expectedLocator: string; screenName: string; pageSource: string }): string` — hàm thuần dựng prompt yêu cầu CLI **chỉ trả về đúng một locator** theo định dạng cố định `{ strategy, selector }`; kèm locator đã hỏng, tên màn hình, page source (ADR-025 Heal read-only).
- `src/ai/heal-invoker.ts`: `healLocator(agent: CodeAgent, ctx): Promise<Locator | null>`:
  - Import `Locator`/`LocatorStrategy` từ `shared` (ADR-027).
  - Gọi `agent.invoke('heal', buildHealPrompt(ctx))`; nhận chuỗi `result` hoặc `null`.
  - Parse `result` qua Zod `z.object({ strategy: <enum LocatorStrategy>, selector: z.string().min(1) })` → dựng **object `Locator` trực tiếp** từ `{ strategy, selector }` đã Zod-validate (không dùng bộ dựng iOS — ADR-027 §Hệ-quả); sai định dạng/`null` → trả `null` (không áp dụng — BR-208).
- Phơi `healLocator` (hoặc một `HealFn` factory) ở `src/ai/index.ts` để tầng lắp ráp (US-7.5) dựng `healFn` tiêm vào Locator Resolver.
- Đầu ra CLI đi qua Zod (coding-convention.md §Dữ-liệu-vào). Không log page source/prompt.

**Acceptance Criteria (cấp code)**
- [ ] `buildHealPrompt` gồm locator hỏng + tên màn hình + page source và yêu cầu trả đúng một locator (test đơn vị so nội dung/khung).
- [ ] `result` hợp lệ → `Locator` (dựng từ shape Zod, kiểu từ `shared`); sai định dạng hoặc `null` → `null` (test đơn vị với `CodeAgent` giả lập từng nhánh).
- [ ] `ai` không import `locator`; `make lint` xanh (ranh giới `ai → shared, config`).
- [ ] `heal-invoker` không ném khi AI lỗi; không log page source.

### TICKET-037: Locator Resolver — `registerHealer` + vòng thử phục hồi + `registerHealSink`
**Thiết kế liên quan:** component-design.md#Locator-Resolver (thêm phần tự phục hồi), interface-spec.md#Locator-Resolver-tiêm-healer, sequence-diagrams.md#1, ADR-004, ADR-014, BR-201, BR-202, BR-208
**Phụ thuộc:** TICKET-036

**Chỉ dẫn code**
- `src/locator/locator-resolver.ts` (mở rộng, giữ chữ ký `find` ổn định — điểm chèn self-healing ADR-004):
  - `HealFn = (ctx: { expectedLocator: string; screenName: string; pageSource: string }) => Promise<Locator | null>`.
  - `registerHealer(fn: HealFn): void` / `clearHealer(): void` — tiêm/gỡ healer lúc mở phiên (cùng pattern `registerScreenSink`, ADR-014); không có healer → hành vi Phase 1.
  - `registerHealSink(sink: (signal: HealSignal) => void): void` / `clearHealSink()` — tiêm lối đẩy `HealSignal` sang Evidence (US-7.3), cùng pattern sink để Locator KHÔNG import `evidence`.
  - Trong `find`: khi `waitForExist` thất bại và có healer + AI bật:
    - Lặp tối đa `healRetries` lần (giá trị truyền vào lúc đăng ký healer/qua closure — mặc định 3, BR-202):
      - Lấy page source hiện tại từ phiên WebdriverIO toàn cục.
      - Gọi `healFn({ expectedLocator: describeLocator(locator), screenName, pageSource })`.
      - Kết quả `Locator` → thử live (`$`/`waitForExist` ngắn); tìm thấy → đẩy `HealSignal` qua heal sink và trả phần tử (bước tiếp tục); dừng lặp.
    - Hết lượt / không có healer / AI tắt → ném `AppFailure` như Phase 1 (chụp ảnh bước hỏng ở tầng Evidence). Lỗi gọi AI không làm dừng lượt chạy (BR-208).
    - Locator đã phục hồi cho chính locator đó dùng lại trong cùng lượt chạy, không gọi lại AI (BR-202) — giữ cache in-memory theo khóa locator.
  - `HealSignal` = **các trường resolver BIẾT**: `{ screen, expectedLocator, usedLocator, occurredAt }`. **KHÔNG** mang `stepOrder`, `testCaseResultId`, `screenshot_path` — vì `find(locator, screenName)` giữ chữ ký ổn định (ADR-004), resolver không biết số bước; ba trường này do **Evidence enrich** (US-7.3), cùng cách `screenshot_path` được "gắn sau khi chụp". `HealSignal` là tập con của `HealEvent` (store, US-7.1).
- `src/locator/index.ts`: phơi `registerHealer`, `registerHealSink`, kiểu `HealFn`, `HealSignal`.
- Không thêm cạnh `locator → ai`/`locator → evidence`: mọi liên kết qua sink tiêm (ADR-014).

**Acceptance Criteria (cấp code)**
- [ ] Không có healer → `find` hỏng đúng như Phase 1 (test đơn vị, phiên WDIO giả lập).
- [ ] Có healer: healFn trả locator định vị được → `find` trả phần tử, đẩy đúng một `HealSignal` (screen/expectedLocator/usedLocator/occurredAt, không stepOrder) qua sink (test đơn vị).
- [ ] Lặp tối đa `healRetries` lần khi các lần trả locator không tìm thấy; hết lượt → ném `AppFailure` (test đơn vị đếm số lần gọi).
- [ ] Locator đã phục hồi được dùng lại, không gọi lại healFn cho cùng locator (test đơn vị).
- [ ] Locator không import `ai`/`evidence`/`runner`; `make lint` xanh (ranh giới).

## Definition of Done (US)
Theo `conventions.md` §4.

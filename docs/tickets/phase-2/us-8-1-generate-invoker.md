# US-8.1: Sinh test case qua phiên agent (agentic, Appium MCP)

**Epic:** EPIC-8 — Sinh test case với AI
**Business US (BA):** US-206, US-209 (phần đánh dấu)
**Độ ưu tiên:** High
**Phụ thuộc:** US-6.2

## Mục tiêu
AI Gateway sinh một test case nháp (mô tả hành vi + phần cài đặt; locator trong Page Object) từ **mô tả bằng lời**, bằng cách chạy một **phiên agent**: AI tự lái app thật qua công cụ Appium MCP đi theo từng bước của kịch bản nó viết, inspect từng màn lấy locator (ADR-028). QC **không** cung cấp page source. AI ưu tiên tái dùng câu/step đã có và đánh dấu test case sinh ra là "do AI sinh".

## Tickets

### TICKET-049: Transport `runGenerateSession` — phiên agent Claude Code có công cụ Appium MCP
**Thiết kế liên quan:** component-design.md#AI-Gateway (`code-agent.ts`, `adapters/claude-code.ts`), interface-spec.md#CodeAgent (`runGenerateSession`), interface-spec.md#AI-CLI-qua-subprocess (Generate), sequence-diagrams.md#2, ADR-028, ADR-025, FR-GEN-01, coding-convention.md#Gọi-AI
**Phụ thuộc:** TICKET-031

**Chỉ dẫn code**
- Mở rộng port `CodeAgent` (`src/ai/code-agent.ts`) với hình dạng gọi thứ hai, **cạnh** `invoke` (transport heal — không đổi trong re-work này; generate thôi không dùng `invoke` nữa):
  - `runGenerateSession(opts: { prompt: string; mcp: AppiumMcpConfig; writeDir: string; limits?: CallLimits }): Promise<{ draftFiles: string[] } | null>`.
  - `AppiumMcpConfig` là kiểu **structural** khai trong `ai` (không import module khác): đủ để dựng cấu hình MCP server điều khiển thiết bị — package/lệnh chạy MCP server + capabilities Appium (build path, platformName iOS, automationName XCUITest, deviceId, osVersion). Lệnh `generate` (US-8.2) dựng và truyền vào.
- `src/ai/adapters/claude-code.ts` — nhánh generate: spawn `claude -p --output-format json` với:
  - `--mcp-config <file>`: ghi `opts.mcp` ra file cấu hình MCP tạm (server Appium MCP), trỏ Claude Code vào để AI có công cụ `getPageSource`/`tap`/`scroll`/`type` trên phiên thiết bị sống.
  - Quyền ghi giới hạn trong `opts.writeDir`: `--add-dir <opts.writeDir>`; đặt thư mục làm việc tiến trình con = `opts.writeDir` để file nháp rơi đúng `apps/<app-id>/` (deterministic — không nhờ prompt điều hướng đường dẫn). Nguồn thư mục nay là **`opts.writeDir` truyền per-call**, không phải `cwd` cấp-agent; dùng lại đường truyền `cwd` sẵn có của `SpawnFn` (merged US-8.2) để `runGenerateSession` truyền `cwd = opts.writeDir` tới `spawn` lúc gọi.
  - `--permission-mode acceptEdits` (được ghi file nháp), khác nhánh heal read-only.
  - `prompt` đưa qua stdin.
  - Tách trường `result`; suy ra danh sách file nháp đã tạo (đường dẫn tương đối theo `writeDir`). Không có file nào hoặc CLI lỗi/không phản hồi → `null` (KHÔNG ném — coding-convention.md#Gọi-AI).
- `withControlPoint(inner, limits)` bọc `runGenerateSession` như đã bọc `invoke` (giới hạn số lần gọi/timeout mỗi phiên, ADR-025).
- `createCodeAgent({ cli, limits })` phơi cả `invoke` và `runGenerateSession` (khớp interface-spec §CodeAgent). **Bỏ tham số `cwd` cấp-agent** mà bản merged US-8.2 từng thêm cho generate — thư mục ghi nay đi qua `runGenerateSession(opts.writeDir)` per-call, nên lệnh `generate` (US-8.2) dựng agent **không cwd**.
- Phơi `runGenerateSession`, `AppiumMcpConfig` ở `src/ai/index.ts`.
- KHÔNG log `prompt`, nội dung page source, hay giá trị test-data (coding-convention.md#Bí-mật). Ranh giới `ai → shared, config` không đổi (không cạnh mới).

**Acceptance Criteria (cấp code)**
- [ ] `runGenerateSession` spawn `claude -p` với `--mcp-config` (từ `opts.mcp`), `--add-dir`/cwd = `opts.writeDir`, `--permission-mode acceptEdits` (test đơn vị với `SpawnFn` giả lập kiểm cờ + cwd; nhánh heal `invoke` không đổi, vẫn read-only, không MCP).
- [ ] Trả `{ draftFiles }` khi có file; `null` khi CLI lỗi/không phản hồi/không file — không ném (test đơn vị từng nhánh).
- [ ] `withControlPoint` áp giới hạn cho `runGenerateSession` (test đơn vị vượt giới hạn → dừng).
- [ ] Không log prompt/page source/test-data.

### TICKET-042: `generate-invoker` — dựng prompt sinh agentic, gọi `runGenerateSession`, gắn nhãn AI sinh
**Thiết kế liên quan:** component-design.md#AI-Gateway (`generate-invoker.ts`, `prompts/`), interface-spec.md#CodeAgent (`generateTestCase`), sequence-diagrams.md#2, ADR-028, ADR-007, ADR-025, FR-GEN-01, FR-GEN-05, BR-211, BR-212, BR-216
**Phụ thuộc:** TICKET-049

**Chỉ dẫn code**
- `src/ai/prompts/generate.ts`: `buildGeneratePrompt(ctx: { description: string; existingSteps: string[] }): string` — hàm thuần dựng prompt yêu cầu CLI, dùng công cụ Appium MCP, **tự lái app** đi theo kịch bản để lấy locator rồi viết file nháp:
  - Viết `.feature` (hành vi, tiếng Anh, không locator) từ `description`.
  - Lái app qua công cụ MCP tới từng màn của kịch bản (tự xử màn trung gian: dialog quyền, onboarding), xem page source, **chọn locator ổn định** — ưu tiên accessibility id trước XPath (khớp chiến lược locator ADR-004).
  - Viết `steps/*.steps.ts` (mỗi câu → method Page Object; `Then` khẳng định qua `assertExpectation`) và `screens/*.screen.ts` (locator tập trung).
  - **Ưu tiên tái dùng** câu/step đã có (`existingSteps`), không tạo câu trùng nghĩa (ADR-007, BR-212).
  - Gắn tag `@ai-generated` trên scenario để phân biệt khi rà soát (FR-GEN-05, BR-216).
  - KHÔNG nhận page source tĩnh — AI tự lấy qua MCP.
- `src/ai/generate-invoker.ts`: `generateTestCase(agent: CodeAgent, ctx: { description: string; existingSteps: string[]; mcp: AppiumMcpConfig; writeDir: string }): Promise<GenerateOutcome>`:
  - Gọi `agent.runGenerateSession({ prompt: buildGeneratePrompt({ description, existingSteps }), mcp: ctx.mcp, writeDir: ctx.writeDir })`.
  - `{ draftFiles }` → `{ ok: true; draftPaths: draftFiles }`; `null` → `{ ok: false; reason }` (BR-208 cho generate: không sinh lần này — AI/MCP lỗi hoặc không đi hết kịch bản, UC-203 E3).
- `GenerateOutcome` = `{ ok: true; draftPaths: string[] } | { ok: false; reason: string }`. Phơi `generateTestCase`, `GenerateOutcome` ở `src/ai/index.ts`.
- Đầu ra CLI qua Zod nếu cần parse; không log mô tả/page source/test-data.

**Acceptance Criteria (cấp code)**
- [ ] `buildGeneratePrompt` gồm mô tả + hướng dẫn tự lái app qua MCP lấy locator + danh sách step hiện có (yêu cầu tái dùng trước khi sinh) + tag `@ai-generated`; **không** chứa trường page source (test đơn vị so khung prompt).
- [ ] `generateTestCase` gọi `runGenerateSession` với `mcp` + `writeDir` từ `ctx`; `{ draftFiles }` → `{ ok: true, draftPaths }`; `null` → `{ ok: false, reason }` (test đơn vị với `CodeAgent` giả lập từng nhánh).
- [ ] `generateTestCase` KHÔNG nhận `pageSource`; không ném khi AI lỗi; không log mô tả/page source/test-data.

## Definition of Done (US)
Theo `conventions.md` §4. Phần chạy phiên agent thật (spawn `claude -p` + Appium MCP điều khiển simulator) kiểm chứng thủ công, ghi trong PR; logic dựng prompt + điều phối kết quả test đơn vị với `CodeAgent`/`SpawnFn` giả lập. Chất lượng test case AI sinh thật kiểm chứng ở US-8.2/US-8.3.

# US-6.2: AI Gateway — port CodeAgent + adapter Claude Code (subprocess)

**Epic:** EPIC-6 — Nền AI: gọi CLI & môi trường
**Business US (BA):** US-201 (cơ chế gọi AI), US-206 (cơ chế gọi AI)
**Độ ưu tiên:** High
**Phụ thuộc:** US-6.1

## Mục tiêu
Có module `src/ai/` là điểm duy nhất nền tảng gọi AI CLI: một port `CodeAgent` với điểm kiểm soát (hạn mức số lần gọi/lượt chạy, timeout mỗi lần, không bao giờ ném — trả `null` khi lỗi), và một adapter subprocess gọi `claude -p --output-format json`. Chưa gắn nội dung heal/generate (thuộc US-7.2 / US-8.1); ticket này dựng khung gọi CLI và ranh giới module.

## Tickets

### TICKET-030: Module `ai/` — port CodeAgent, điểm kiểm soát, factory, ranh giới
**Thiết kế liên quan:** component-design.md#AI-Gateway (`code-agent.ts`), interface-spec.md#CodeAgent, ADR-025, north-star.md#2 (module AI Gateway), BR-219, NFR-202, NFR-204
**Phụ thuộc:** TICKET-029

**Chỉ dẫn code**
- Tạo module `src/ai/`:
  - `src/ai/code-agent.ts`:
    - `export interface CodeAgent { invoke(mode: 'heal' | 'generate', prompt: string): Promise<string | null> }` — trả về trường `result` (chuỗi) từ CLI, hoặc `null` khi AI không khả dụng/lỗi/timeout/vượt hạn mức. **Không bao giờ ném** (BR-208, NFR-204).
    - Điểm kiểm soát `withControlPoint(inner: CodeAgent, limits: { maxCallsPerRun: number; callTimeoutMs: number }): CodeAgent` — đếm số lần gọi trong lượt chạy, quá `maxCallsPerRun` trả `null`; đặt timeout mỗi lần gọi, hết giờ trả `null`. Mọi lỗi từ `inner` nuốt thành `null` và log ở mức warn (không log prompt/nội dung page source).
    - `createCodeAgent(opts: { cli: 'claude-code'; limits: { maxCallsPerRun: number; callTimeoutMs: number } }): CodeAgent` — factory chọn adapter theo `cli` (giai đoạn này chỉ `claude-code`, TICKET-031); bọc adapter bằng `withControlPoint`. Nạp token qua `loadCliToken` (config) và tiêm vào adapter.
  - `src/ai/index.ts`: phơi `createCodeAgent`, kiểu `CodeAgent`.
- **Ranh giới module (`eslint.config.ts`):** thêm phần tử `{ type: 'ai', mode: 'folder', pattern: 'src/ai' }`; thêm `ai` vào danh sách `entry-point` allow `index.ts`; thêm luật `element-types` `{ from: ['ai'], allow: ['shared', 'config'] }`. Không cạnh `ai → locator`: kiểu `Locator` ở `shared` (ADR-027, hoisting làm ở US-7.2 TICKET-045). Cập nhật danh sách `boundaries/entry-point` target để gồm `ai`.
- Công tắc bật/tắt AI theo app KHÔNG đọc trong `ai/` (tránh `ai → registry`): giá trị `ai.enabled`/`healRetries` do tầng lắp ráp (US-7.5) và CLI generate (US-8.2) đọc từ `AppConfig` rồi truyền vào. `isEnabled` của interface-spec hiện thực là cổng gác tại điểm kiểm soát trên giá trị công tắc được truyền vào.

**Acceptance Criteria (cấp code)**
- [ ] `CodeAgent.invoke` trả `null` (không ném) khi adapter lỗi/timeout/vượt hạn mức (test đơn vị với adapter giả lập cho từng nhánh).
- [ ] `withControlPoint` chặn sau `maxCallsPerRun` lần và áp timeout mỗi lần gọi (test đơn vị đếm lần gọi + timeout).
- [ ] `eslint.config.ts` có phần tử `ai` và luật `{ from: ['ai'], allow: ['shared', 'config'] }`; probe import `ai → store` (cố ý sai) báo lỗi `boundaries/element-types`.
- [ ] `make lint`/`typecheck` xanh; không log giá trị prompt/page source/token.

### TICKET-031: Adapter Claude Code — subprocess `claude -p`, parse JSON qua Zod
**Thiết kế liên quan:** component-design.md#AI-Gateway (`adapters/claude-code.ts`), interface-spec.md#AI-CLI-qua-subprocess, ADR-025, ADR-026, coding-convention.md#Dữ-liệu-vào, BR-219, BR-220
**Phụ thuộc:** TICKET-030

**Chỉ dẫn code**
- `src/ai/adapters/claude-code.ts`: `createClaudeCodeAdapter(opts: { token: string | null; spawnFn?: SpawnFn }): CodeAgent`:
  - `invoke(mode, prompt)`: spawn `claude` với `['-p', '--output-format', 'json']` cộng cờ quyền theo `mode`:
    - `heal` → chỉ đọc (`--permission-mode` hạn chế, `--allowedTools` rỗng/chỉ đọc) — CLI chỉ trả locator, không sửa file (ADR-025).
    - `generate` → quyền ghi giới hạn.
  - Đưa `prompt` qua **stdin**; đọc stdout tới hết.
  - Tiêm token vào env tiến trình con: `env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token }` khi có token (ADR-026); thiếu token → trả `null`.
  - Parse stdout qua Zod: `z.object({ result: z.string() }).passthrough()`; lấy `result`. Sai định dạng / mã thoát khác 0 / spawn lỗi → trả `null` (dữ liệu ngoài phải qua Zod — coding-convention.md §Dữ-liệu-vào).
  - **Tách seam chạm tiến trình:** nhận `spawnFn` tiêm được (mặc định `child_process.spawn`) để dựng lệnh + parse test được bằng spawn giả lập; lần gọi CLI thật kiểm chứng thủ công (ghi cách kiểm trong PR — coding-convention.md §Kiểm-thử).
- Không phơi adapter ra ngoài `ai/index.ts` — chỉ `createCodeAgent` (TICKET-030) dùng.

**Acceptance Criteria (cấp code)**
- [ ] Dựng đúng `argv` theo `mode` (heal chỉ đọc / generate ghi giới hạn), đưa prompt qua stdin (test đơn vị với `spawnFn` giả lập).
- [ ] stdout JSON hợp lệ → trả `result`; JSON sai định dạng / exit≠0 / thiếu token → trả `null` (test đơn vị từng nhánh).
- [ ] Token tiêm vào env tiến trình con, không ghép vào chuỗi log.
- [ ] Đầu ra CLI đi qua schema Zod trước khi dùng.

## Definition of Done (US)
Theo `conventions.md` §4. Phần chạm CLI thật kiểm chứng thủ công, ghi trong PR.

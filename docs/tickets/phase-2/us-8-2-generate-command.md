# US-8.2: Lệnh `generate`

**Epic:** EPIC-8 — Sinh test case với AI
**Business US (BA):** US-206
**Độ ưu tiên:** High
**Phụ thuộc:** US-8.1, US-6.1

## Mục tiêu
QC chạy một lệnh CLI đưa mô tả + page source màn hình đích, nền tảng gọi AI Gateway sinh file nháp test case vào `apps/<app-id>/`. Lệnh chịu công tắc bật/tắt AI theo app; AI tắt → không sinh qua AI, báo rõ để QC soạn tay như Phase 1.

## Tickets

### TICKET-043: `commands/generate.ts` — nhận mô tả + page source, gọi AI Gateway, ghi file nháp
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/generate.ts`), interface-spec.md#CodeAgent (`generateTestCase`, `isEnabled`), sequence-diagrams.md#2, ADR-017, ADR-025, FR-GEN-01, FR-AI-01, BR-209, BR-218
**Phụ thuộc:** TICKET-042, TICKET-028

**Chỉ dẫn code**
- `src/cli/commands/generate.ts`:
  - `runGenerate(deps): Promise<number>` — logic thuần trả mã thoát, phụ thuộc tiêm:
    1. Nhận `appId`, mô tả (đường dẫn file mô tả hoặc tham số), đường dẫn page source (file).
    2. Resolve `AppConfig` (registry) → kiểm `ai.enabled`. Tắt → in thông báo "AI tắt cho app; soạn tay như Phase 1", thoát mã xác định, không gọi AI (BR-209, BR-218).
    3. Bật → dựng `CodeAgent` (AI Gateway) **với `cwd = apps/<appId>/`** (thư mục app đã resolve từ `AppConfig`) + `existingSteps` (đọc step definition hiện có của app để ưu tiên tái dùng, BR-212); gọi `generateTestCase` (US-8.1).
    4. `{ ok: true }` → in đường dẫn file nháp (tương đối theo `apps/<appId>/`); nhắc QC chạy thử + xác nhận qua mô tả hành vi + mở PR (ngoài nền tảng, US-8.3). `{ ok: false }` → in lý do, thoát khác 0.
  - `generateCommand(): Command` — bọc cho commander (ADR-017), `exitOverride()`; đăng ký ở `program.ts`.
- **File nháp rơi vào `apps/<app-id>/` bằng cách đặt thư mục làm việc của tiến trình con `claude` = app dir** (deterministic, không nhờ prompt điều hướng đường dẫn; scope ghi khoanh trong app dir). Cần thread một `cwd` optional qua transport `ai` (mở rộng **additive**, tương thích ngược — heal không truyền cwd, không đổi):
  - `SpawnFn` input (`src/ai/adapters/claude-code.ts`) thêm `cwd?: string`; `defaultSpawn` truyền vào `spawn(command, args, { env, cwd, stdio })`.
  - `createClaudeCodeAdapter({ token, cwd? })` giữ `cwd`, truyền xuống `runProcess`; `createCodeAgent({ cli, limits, cwd? })` (`src/ai/code-agent.ts`) chuyển `cwd` xuống adapter.
  - Lệnh `generate` dựng agent với `cwd = apps/<appId>/`; heal (US-7.5) dựng agent không cwd. `src/` KHÔNG import `apps/` (coding-convention.md §Ranh-giới) — đây là đường dẫn chuỗi tới `cwd`, không phải import.
- Ranh giới: `cli → config, registry, ai, shared`. Thêm `ai` vào `element-types` của `cli` trong `eslint.config.ts`: `{ from: ['cli'], allow: ['shared', 'config', 'registry', 'device', 'runner', 'reporter', 'ai'] }`.
- Phần chạm AI CLI thật kiểm chứng thủ công; logic điều phối + nhánh bật/tắt test đơn vị với AI Gateway giả lập.

**Acceptance Criteria (cấp code)**
- [ ] AI tắt cho app → không gọi AI, in thông báo soạn-tay, mã thoát xác định (test đơn vị).
- [ ] AI bật → gọi `generateTestCase` với `existingSteps`; `ok:true` in đường dẫn nháp, `ok:false` thoát khác 0 (test đơn vị AI Gateway giả lập).
- [ ] Agent của `generate` dựng với `cwd = apps/<appId>/`; `SpawnFn` nhận `cwd` và `defaultSpawn` truyền vào `spawn(...,{cwd})` (test đơn vị với `spawnFn` giả lập kiểm `cwd` đúng app dir; heal-path không truyền cwd — không đổi).
- [ ] Lệnh đăng ký ở `program.ts` với `exitOverride()`; `eslint.config.ts` cho `cli → ai`; `make lint`/`typecheck` xanh.

## Definition of Done (US)
Theo `conventions.md` §4. Phần gọi CLI thật kiểm chứng thủ công, ghi trong PR.

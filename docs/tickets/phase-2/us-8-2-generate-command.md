# US-8.2: Lệnh `generate` (agentic)

**Epic:** EPIC-8 — Sinh test case với AI
**Business US (BA):** US-206
**Độ ưu tiên:** High
**Phụ thuộc:** US-8.1, US-6.1

## Mục tiêu
QC chạy một lệnh CLI đưa **mô tả** hành vi; nền tảng đọc `app.config.ts` dựng cấu hình Appium MCP (capabilities của app) rồi gọi AI Gateway chạy phiên khám phá agentic sinh file nháp test case vào `apps/<app-id>/` (ADR-028). Lệnh chịu công tắc bật/tắt AI theo app; AI tắt → không sinh qua AI, báo rõ để QC soạn tay như Phase 1.

## Tickets

### TICKET-043: `commands/generate.ts` — nhận mô tả, dựng cấu hình Appium MCP, gọi AI Gateway
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/generate.ts`), interface-spec.md#CodeAgent (`generateTestCase`), sequence-diagrams.md#2, ADR-028, ADR-017, ADR-025, FR-GEN-01, FR-AI-01, BR-209, BR-218
**Phụ thuộc:** TICKET-042, TICKET-028

**Chỉ dẫn code**
- `src/cli/commands/generate.ts`:
  - `runGenerate(deps): Promise<number>` — logic thuần trả mã thoát, phụ thuộc tiêm:
    1. Nhận `appId` và **mô tả** (đường dẫn file mô tả `--description-file` hoặc tham số `--description`). **KHÔNG còn `--page-source`.**
    2. Resolve `AppConfig` (registry) → kiểm `ai.enabled`. Tắt → in thông báo "AI tắt cho app; soạn tay như Phase 1", thoát mã xác định, không gọi AI (BR-209, BR-218).
    3. Bật → dựng cấu hình Appium MCP từ `AppConfig` capabilities (build path, platformName iOS, automationName XCUITest, deviceId, osVersion) — cùng nguồn capabilities như lượt chạy, nhưng đưa cho **server Appium MCP** quản phiên (KHÔNG mở phiên Test Runner; AI Gateway do đó KHÔNG phụ thuộc Test Runner/Device — component-design §CLI Entry).
    4. Gom `existingSteps` (đọc step definition hiện có của app để ưu tiên tái dùng, BR-212).
    5. Dựng `CodeAgent` (AI Gateway) **không cwd** (bản merged dựng agent với `cwd = apps/<appId>/` — bỏ; thư mục ghi nay đi per-call qua `writeDir`) và gọi `generateTestCase(agent, { description, existingSteps, mcp, writeDir: <apps/<appId>/> })` (US-8.1).
    6. `{ ok: true }` → in đường dẫn file nháp (tương đối theo `apps/<appId>/`); nhắc QC chạy thử + xác nhận qua mô tả hành vi + mở PR (ngoài nền tảng, US-8.3). `{ ok: false }` → in lý do, thoát khác 0 (BR-208 / UC-203 E3: không sinh lần này, không hỏng).
  - `generateCommand(): Command` — bọc cho commander (ADR-017), `exitOverride()`; đăng ký ở `program.ts`. Bỏ option `--page-source` khỏi định nghĩa lệnh.
- **`writeDir` khoanh vùng ghi:** truyền `writeDir = apps/<appId>/` xuống `generateTestCase` → `runGenerateSession`; transport đặt `--add-dir` + thư mục làm việc tiến trình con = app dir (US-8.1 TICKET-049). `src/` KHÔNG import `apps/` (coding-convention.md §Ranh-giới) — đây là đường dẫn chuỗi, không phải import.
- Ranh giới: `cli → config, registry, ai, shared` (đã có trong `element-types` từ bản trước; không thêm cạnh mới).
- Phần chạm AI CLI + Appium MCP thật kiểm chứng thủ công; logic điều phối + nhánh bật/tắt + dựng cấu hình MCP test đơn vị với AI Gateway giả lập.

**Acceptance Criteria (cấp code)**
- [ ] Lệnh nhận mô tả, **không** có option `--page-source` (test đơn vị: truyền `--page-source` bị commander từ chối / không được nhận).
- [ ] AI tắt cho app → không gọi AI, in thông báo soạn-tay, mã thoát xác định (test đơn vị).
- [ ] AI bật → dựng cấu hình Appium MCP từ `AppConfig` capabilities và gọi `generateTestCase` với `mcp` + `writeDir = apps/<appId>/` + `existingSteps` (test đơn vị AI Gateway giả lập, kiểm capabilities đưa vào `mcp` khớp `AppConfig`).
- [ ] `ok:true` in đường dẫn nháp; `ok:false` in lý do + thoát khác 0 (test đơn vị).
- [ ] Lệnh đăng ký ở `program.ts` với `exitOverride()`; `make lint`/`typecheck` xanh.

## Definition of Done (US)
Theo `conventions.md` §4. Phần gọi CLI + Appium MCP thật kiểm chứng thủ công, ghi trong PR. Cập nhật `docs/onboarding-a-new-app.md` §2.5/§2.6 (bỏ bước dump page source tay; QC chỉ đưa mô tả) và `docs/operations-guide.md` §2.2 khi ticket này land.

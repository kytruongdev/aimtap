# US-6.6: Kiểm/cài Appium MCP server cho generate agentic

**Epic:** EPIC-6 — Nền AI: gọi CLI & môi trường
**Business US (BA):** US-210
**Độ ưu tiên:** Medium
**Phụ thuộc:** US-6.3 (setup/doctor đã có), US-6.4 (auto-install CLI)

## Mục tiêu
Bước `generate` agentic (ADR-028) cần **Appium MCP server** để AI lái thiết bị lấy locator. `make doctor` báo rõ Appium MCP server có mặt hay không; `make setup` chuẩn bị (cài/hướng dẫn) để lần `generate` đầu không bị chặn. Thiếu Appium MCP chỉ chặn `generate`, KHÔNG chặn `run` hay phần chạy test không dùng AI.

## Tickets

### TICKET-050: `doctor` kiểm Appium MCP server (không chặn lượt chạy không-AI)
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/doctor.ts`), sequence-diagrams.md#3, north-star.md §4 (Appium MCP server — `appium/appium-mcp`), ADR-028, ADR-026, FR-ENV-02, BR-221
**Phụ thuộc:** TICKET-033

**Chỉ dẫn code**
- `src/cli/commands/doctor.ts`: thêm một mục kiểm, **cùng nhóm cảnh báo AI** với AI CLI + token (TICKET-033) — KHÔNG thuộc nhóm host-tools quyết định mã thoát:
  - Appium MCP server có mặt: probe host xem lệnh chạy MCP server (`appium/appium-mcp`, north-star §4) resolve được (dùng lại pattern `system-probes` của `device`; ví dụ `npx --no-install <pkg> --version` thoát 0, hoặc package hiện diện trong `node_modules`). Package cụ thể + cách chạy pin theo north-star §4 — xác nhận lúc implement.
  - In trạng thái rõ (có/thiếu). Thiếu → cảnh báo "lệnh generate không chạy được cho tới khi có Appium MCP server"; **không** làm `doctor` thoát khác 0 chỉ vì thiếu (BR-221 — chạy test không AI vẫn hoạt động).
- Không log đầu ra nhạy cảm.

**Acceptance Criteria (cấp code)**
- [ ] `doctor` in trạng thái Appium MCP server (có/thiếu) với probe giả lập cả hai nhánh (test đơn vị).
- [ ] Thiếu Appium MCP server KHÔNG làm `doctor` thoát khác 0 khi host-tools bắt buộc đủ (test đơn vị).
- [ ] Kiểm chứng thủ công trên máy có/không Appium MCP server, ghi trong PR.

### TICKET-051: `setup` chuẩn bị Appium MCP server
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/setup.ts`), sequence-diagrams.md#3, north-star.md §4, ADR-028, ADR-026, FR-ENV-01, BR-221
**Phụ thuộc:** TICKET-032, TICKET-046

**Chỉ dẫn code**
- `src/cli/ai-cli.ts`: thêm `ensureAppiumMcp(): boolean` — chuẩn bị Appium MCP server (`appium/appium-mcp`, north-star §4): cài/pre-fetch package qua trình quản lý gói (để `npx` resolve cục bộ, không phải tải lúc `generate` đầu tiên), hoặc trả `true` nếu đã sẵn. Phần chạm hệ thống, kiểm chứng thủ công (như `installClaudeCli`). Không log đầu ra nhạy cảm.
- `src/cli/commands/setup.ts` — `SetupDeps` thêm `ensureMcp: () => boolean`; `runSetup` sau bước token:
  - Kiểm Appium MCP server hiện diện (dùng lại probe của TICKET-050 hoặc `ensureMcp`). Vắng → in "preparing Appium MCP server…" → gọi `ensureMcp()` → kiểm lại. Thành công → báo sẵn sàng cho `generate`; thất bại → **in cảnh báo** (thiếu MCP chỉ chặn `generate`, KHÔNG chặn `run`/heal) + link tài liệu, **KHÔNG đổi mã thoát chỉ vì MCP** (giữ cùng nguyên tắc warn-only như doctor TICKET-050 và như thiếu token — mã thoát setup vẫn theo nhánh CLI/token bắt buộc).
  - Có sẵn → bỏ qua, không cài lại.
- `setupCommand()` truyền `ensureMcp: ensureAppiumMcp` vào `runSetup`.
- Cập nhật comment đầu `setup.ts` + mô tả lệnh: setup nay chuẩn bị cả AI CLI + token + Appium MCP server.

**Acceptance Criteria (cấp code)**
- [ ] Appium MCP vắng → `runSetup` gọi `ensureMcp` rồi kiểm lại; thành công → báo sẵn sàng; thất bại → in cảnh báo (KHÔNG đổi mã thoát vì MCP) (test đơn vị cả hai nhánh, deps giả lập).
- [ ] Appium MCP sẵn → không gọi `ensureMcp` (test đơn vị).
- [ ] Bước chuẩn bị thật kiểm chứng thủ công trên máy chưa có Appium MCP server (ghi trong PR); không log giá trị nhạy cảm.

## Definition of Done (US)
Theo `conventions.md` §4. Phần cài/probe thật kiểm chứng thủ công. Cập nhật `docs/onboarding-a-new-app.md` §1 (yêu cầu môi trường thêm Appium MCP server) và `docs/operations-guide.md` §1 khi ticket này land.

# US-6.4: `setup` tự cài Claude Code khi máy chưa có

**Epic:** EPIC-6 — Nền AI: gọi CLI & môi trường
**Business US (BA):** US-210
**Độ ưu tiên:** Medium
**Phụ thuộc:** US-6.3

## Mục tiêu
`make setup` trên máy chưa có Claude Code **tự chạy lệnh cài** (thay vì chỉ in hướng dẫn rồi dừng), rồi tiếp tục bước token — để máy mới sẵn sàng dùng AI trong một lệnh. Nằm trong phạm vi FR-ENV-01/ADR-026 ("cài **hoặc** hướng dẫn cài"); quyết định PO 2026-08-21 chọn nhánh "cài".

## Tickets

### TICKET-046: `setup` tự cài Claude Code (native installer) khi vắng
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/setup.ts`), interface-spec.md#bước-cài-đặt-và-kiểm-tra, ADR-026, FR-ENV-01, BR-221
**Phụ thuộc:** TICKET-032

**Chỉ dẫn code**
- `src/cli/ai-cli.ts`: thêm `installClaudeCli(): boolean` — chạy installer native chính thức (macOS/Linux, north-star §2.3): `sh -c 'curl -fsSL https://claude.ai/install.sh | bash'`; trả `true` nếu tiến trình thoát 0. Phần chạm hệ thống, kiểm chứng thủ công (như `isClaudeCliPresent`). Không log đầu ra nhạy cảm.
- `src/cli/commands/setup.ts` — `SetupDeps` thêm `installCli: () => boolean`; `runSetup`:
  - Khi `!cliPresent()`: in "installing Claude Code…" → gọi `installCli()` → **kiểm lại sự hiện diện**.
  - **Lưu ý PATH:** installer đặt binary ở `~/.local/bin/claude`, có thể **chưa vào PATH của tiến trình hiện tại**. Kiểm lại bằng cả `command -v claude` **và** đường dẫn `~/.local/bin/claude`. Nếu hiện diện → tiếp tục bước token. Nếu cài thất bại/không thấy → in lỗi + link tài liệu, mở PATH bằng cách mở terminal mới rồi chạy lại `make setup`, `return 1`.
  - Khi `cliPresent()` ngay từ đầu → giữ nguyên luồng US-6.3 (bỏ qua cài, sang token).
- `setupCommand()` truyền `installCli: installClaudeCli` vào `runSetup`.
- Cập nhật comment đầu `setup.ts` (bỏ "does not install the CLI silently" — nay có cài, theo quyết định PO); cập nhật mô tả lệnh nếu cần.

**Acceptance Criteria (cấp code)**
- [ ] `!cliPresent` → `runSetup` gọi `installCli` rồi kiểm lại; cài thành công (fake trả true + hiện diện) → sang bước token; cài thất bại (fake trả false / vẫn vắng) → `return 1` với thông báo rõ (test đơn vị cả hai nhánh, deps giả lập).
- [ ] `cliPresent` sẵn → không gọi `installCli`, sang token như US-6.3 (test đơn vị).
- [ ] Kiểm hiện diện sau cài xét cả `command -v claude` lẫn `~/.local/bin/claude` (test đơn vị nhánh PATH-chưa-cập-nhật).
- [ ] Lệnh cài thật kiểm chứng thủ công trên máy chưa có Claude Code (ghi trong PR); không log giá trị nhạy cảm.

## Definition of Done (US)
Theo `conventions.md` §4. Phần chạy installer thật kiểm chứng thủ công.

# US-6.3: Lệnh setup + doctor kiểm AI CLI

**Epic:** EPIC-6 — Nền AI: gọi CLI & môi trường
**Business US (BA):** US-210
**Độ ưu tiên:** High
**Phụ thuộc:** US-6.1

## Mục tiêu
QC automation có một lệnh cài đặt chuẩn bị AI CLI + token, và bước `doctor` báo rõ AI CLI có mặt và token hợp lệ hay không. Thiếu CLI/token thì tính năng AI không chạy nhưng phần chạy test không dùng AI vẫn hoạt động.

## Tickets

### TICKET-032: Lệnh `setup` — chọn CLI, kiểm/cài, hướng dẫn lấy token, lưu env
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/setup.ts`), interface-spec.md#bước-cài-đặt-và-kiểm-tra, sequence-diagrams.md#3, ADR-026, ADR-017 (commander), FR-ENV-01, BR-220, BR-221
**Phụ thuộc:** TICKET-029

**Chỉ dẫn code**
- `src/cli/commands/setup.ts`:
  - `runSetup(deps): Promise<number>` — logic thuần trả mã thoát, nhận phụ thuộc tiêm (probe `command -v`, hàm ghi env, hàm đọc token người dùng dán) để test được:
    1. Chọn CLI (giai đoạn này chỉ `claude-code`; giữ chỗ chọn cho seam đa-CLI ADR-025).
    2. Kiểm CLI đã cài: `command -v claude` qua probe host (dùng lại pattern `system-probes` của `device`); chưa có → in hướng dẫn cài, không tự cài ngầm.
    3. In hướng dẫn chạy `claude setup-token` một lần; nhận token người dùng dán.
    4. Ghi `CLAUDE_CODE_OAUTH_TOKEN=<token>` vào `.env.local` gốc (git-ignored) — thêm mới hoặc cập nhật khóa đã có, không xóa khóa khác.
  - `setupCommand(): Command` — bọc `runSetup` cho commander (ADR-017), `exitOverride()` như các lệnh hiện có; đăng ký ở `program.ts`.
- `Makefile`: **`make setup` trao cho AI setup** (ADR-026, sequence §3). Vì target `setup` hiện có đang chạy `npm ci` (bootstrap Phase 1), đổi tên nó:
  - Đổi `setup: npm ci` → **`install: npm ci`** (tên chuẩn cho cài phụ thuộc).
  - Thêm **`setup: npx tsx src/cli/index.ts setup`** (cùng pattern target `doctor`).
  - Cập nhật `.PHONY` (thêm `install`) và comment đầu file: máy mới chạy `make install` (deps) rồi `make setup` (chuẩn bị AI — một lần, chỉ khi dùng AI).
  - Không doc nào khác tham chiếu `make setup`=npm ci (đã grep) nên không cần sửa thêm.
- Ranh giới: `cli → config` (ghi/đọc token), `cli → device` (probe), `cli → shared` — đã nằm trong ma trận hiện có.
- Phần tương tác (dán token, in hướng dẫn) kiểm chứng thủ công; logic ghi/cập nhật `.env.local` test đơn vị với file tạm.

**Acceptance Criteria (cấp code)**
- [ ] `runSetup` phát hiện CLI vắng qua probe và in hướng dẫn cài (test đơn vị với probe giả lập cả hai nhánh).
- [ ] Ghi/cập nhật `CLAUDE_CODE_OAUTH_TOKEN` vào `.env.local` không làm mất khóa khác (test đơn vị với file tạm).
- [ ] `make setup` chạy `aimtap setup`; `make install` chạy `npm ci`; token không lọt vào log.
- [ ] Lệnh đăng ký ở `program.ts`; `exitOverride()` áp dụng (mã thoát test được).

### TICKET-033: `doctor` kiểm AI CLI + token (không chặn lượt chạy không-AI)
**Thiết kế liên quan:** component-design.md#CLI-Entry (`commands/doctor.ts` mở rộng), interface-spec.md#bước-cài-đặt-và-kiểm-tra, ADR-026, FR-ENV-02, BR-221
**Phụ thuộc:** TICKET-029

**Chỉ dẫn code**
- `src/cli/commands/doctor.ts`: mở rộng `runDoctor` thêm hai mục kiểm AI, **tách khỏi** nhóm host-tools quyết định mã thoát Phase 1:
  - AI CLI có mặt: `command -v claude` qua probe host.
  - Token hợp lệ: `loadCliToken() !== null` (config).
  - In trạng thái rõ từng mục (có/thiếu). Thiếu CLI hoặc token → in cảnh báo "tính năng AI không chạy"; **không** làm `doctor` thoát khác 0 chỉ vì thiếu AI (phần chạy test không dùng AI vẫn hoạt động — BR-221). Mã thoát vẫn theo nhóm host-tools bắt buộc như Phase 1.
- Không đọc giá trị token, chỉ kiểm có/không (không log giá trị).

**Acceptance Criteria (cấp code)**
- [ ] `doctor` in trạng thái AI CLI và token (có/thiếu) với probe/token giả lập cho từng tổ hợp (test đơn vị).
- [ ] Thiếu AI CLI/token KHÔNG làm `doctor` thoát khác 0 khi host-tools bắt buộc đủ (test đơn vị).
- [ ] Không log giá trị token.

## Definition of Done (US)
Theo `conventions.md` §4. Phần tương tác setup kiểm chứng thủ công, ghi trong PR.

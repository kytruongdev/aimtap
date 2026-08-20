# US-6.1: Cấu hình AI theo app + token AI CLI

**Epic:** EPIC-6 — Nền AI: gọi CLI & môi trường
**Business US (BA):** US-205, US-210 (phần token)
**Độ ưu tiên:** High
**Phụ thuộc:** — (dựng trên Phase 1: `registry`, `config` đã có)

## Mục tiêu
Mỗi app khai báo được công tắc bật/tắt AI và số lần thử phục hồi; nền tảng nạp được token AI CLI từ env ngoài kho mã và che ở tầng log. Đây là nền cho mọi phần AI đọc cấu hình và xác thực.

## Tickets

### TICKET-028: Trường `ai` trên schema AppConfig
**Thiết kế liên quan:** component-design.md#Config-Secrets (trường `ai: { enabled, healRetries }`), interface-spec.md#CodeAgent (`isEnabled`), ADR-024, BR-202, BR-209
**Phụ thuộc:** —

**Chỉ dẫn code**
- `src/registry/app-config.schema.ts`: mở rộng `appConfigSchema` thêm khối `ai`:
  - `ai: z.object({ enabled: z.boolean(), healRetries: z.number().int().min(1) }).default({ enabled: false, healRetries: 3 })`.
  - `enabled` mặc định `false` — app phải chủ động bật AI, nên app Phase 1 hiện có parse được không cần khai báo `ai` và chạy đúng như Phase 1 (US-205 AC "app tắt AI chạy như Phase 1").
  - `healRetries` mặc định `3` (BR-202); tối thiểu 1.
- Kiểu `AppConfig` vẫn `z.infer<typeof appConfigSchema>` — không khai báo kiểu song song (coding-convention.md §Dữ-liệu-vào).
- Cập nhật `apps/*/app.config.ts` mẫu (nếu ticket đụng `test-data.example`/khai báo mẫu) không bắt buộc; app không khai `ai` vẫn hợp lệ nhờ default.

**Acceptance Criteria (cấp code)**
- [ ] `appConfigSchema` chấp nhận `ai: { enabled, healRetries }`; thiếu khối `ai` thì áp default `{ enabled: false, healRetries: 3 }` (test đơn vị cả hai nhánh).
- [ ] `healRetries < 1` bị từ chối; kiểu `AppConfig` suy ra từ schema, mang `ai.enabled: boolean` và `ai.healRetries: number`.
- [ ] App config Phase 1 (không có khối `ai`) vẫn parse thành công.

### TICKET-029: Nạp token AI CLI từ env, che ở log
**Thiết kế liên quan:** component-design.md#Config-Secrets (`secrets.ts` đọc token CLI), interface-spec.md#bước-cài-đặt-và-kiểm-tra, ADR-026, ADR-009, BR-220, NFR-201
**Phụ thuộc:** —

**Chỉ dẫn code**
- `src/config/secrets.ts`: thêm hàm nạp token theo đúng pattern `loadApiKey` sẵn có:
  - Hằng `const CLI_TOKEN_VAR = 'CLAUDE_CODE_OAUTH_TOKEN'`.
  - `loadCliToken(opts: { rootDir?: string; env?: NodeJS.ProcessEnv } = {}): string | null` — `registerSecretPaths([CLI_TOKEN_VAR])`; đọc từ `.env.local` gốc (dùng lại `readEnvFile`) rồi tới ambient env; `trim`; trả `null` khi rỗng (thiếu token → tính năng AI không chạy, BR-221).
  - Không ghép giá trị token vào chuỗi log (coding-convention.md §Log).
- `src/config/index.ts`: phơi `loadCliToken`.
- ADR-026: token theo pattern `.env.local` git-ignored; KHÔNG tạo `config.db`. Không đụng đường `ANTHROPIC_API_KEY` (giữ nguyên cho tương thích, không dùng cho AI của hướng B).

**Acceptance Criteria (cấp code)**
- [ ] `loadCliToken` đọc `CLAUDE_CODE_OAUTH_TOKEN` từ `.env.local` và từ ambient env; ưu tiên `.env.local` (test đơn vị với file tạm).
- [ ] Đăng ký đường bí mật với log mask; token không xuất hiện trong log (test đơn vị kiểm `registerSecretPaths` được gọi với `CLAUDE_CODE_OAUTH_TOKEN`).
- [ ] Trả `null` khi token rỗng/thiếu.

## Definition of Done (US)
Theo `conventions.md` §4.

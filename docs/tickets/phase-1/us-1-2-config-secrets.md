# US-1.2: Cấu hình & bí mật

**Epic:** EPIC-1 — Nền tảng lõi
**Business US (BA):** US-19
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1

## Mục tiêu
Nền tảng đọc được biến môi trường và cấu hình vận hành qua schema, nạp khóa API từ `.env.local`, và nạp/kiểm tra đầy đủ dữ liệu kiểm thử của một ứng dụng từ tệp ngoài kho mã.

## Tickets

### TICKET-003: Schema biến môi trường + cấu hình vận hành
**Thiết kế liên quan:** component-design.md#Config-&-Secrets, interface-spec.md#Config-&-Secrets, north-star.md#5 (NFR-04, NFR-05), coding-convention.md#Cấu-hình-và-bí-mật, ADR-009
**Phụ thuộc:** TICKET-002

**Chỉ dẫn code**
- `src/config/env.schema.ts`: schema Zod cho biến môi trường, gồm khóa API Claude (Phase 2, không bắt buộc ở Phase 1); kiểu suy ra bằng `z.infer`.
- `src/config/platform-config.ts`: cấu hình vận hành hợp nhất từ biến môi trường + mặc định: thời gian chờ, thư mục `output`, công tắc AI; trả kiểu đã kiểm tra.
- Nạp khóa API từ `.env.local` gốc (bí mật toàn cục — ADR-009); đăng ký khóa API vào danh sách che qua `registerSecretPaths`.
- `src/config/index.ts` phơi ra hàm đọc cấu hình vận hành và khóa API. Cập nhật `.env.example` (tên biến, gồm khóa API, không giá trị thật).

**Acceptance Criteria (cấp code)**
- [ ] Biến môi trường sai/thiếu bị schema bắt kèm tên biến.
- [ ] Khóa API đọc qua module này, không nơi nào khác đọc trực tiếp `process.env` cho khóa API.
- [ ] Khóa API được đăng ký che; test đơn vị xác nhận không lọt vào log.
- [ ] Công tắc AI mặc định tắt; nền tảng chạy không cần khóa API.

### TICKET-004: Nạp và kiểm tra đầy đủ dữ liệu kiểm thử
**Thiết kế liên quan:** component-design.md#Config-&-Secrets, interface-spec.md#Config-&-Secrets (`loadTestData`, `verifyTestDataComplete`), interface-spec.md#Hợp-đồng-dữ-liệu, ADR-009, BR-017
**Phụ thuộc:** TICKET-003

**Chỉ dẫn code**
- `src/config/secrets.ts`:
  - `loadTestData(appId): TestData` — nạp `apps/<app-id>/test-data.local.json`, kiểm tra qua schema Zod theo ứng dụng; đăng ký nhánh `secrets` vào danh sách che; nhánh `env` được phép hiện trong bối cảnh báo cáo.
  - `verifyTestDataComplete(appId): { ok: true } | { ok: false; missing: string[] }` — `missing` là đường dẫn trường của mục chưa có giá trị (ví dụ `secrets.accounts.standard.password`).
- Hình dạng tệp theo interface-spec §Hợp đồng dữ liệu: hai nhánh `secrets` (che) và `env` (không che); dữ liệu bị test case tiêu thụ không nằm trong tệp này (BR-017 quy tắc 3). Schema theo ứng dụng đặt cùng chỗ nạp.
- Cập nhật `src/config/index.ts` phơi ra `loadTestData`, `verifyTestDataComplete`.

**Acceptance Criteria (cấp code)**
- [ ] `verifyTestDataComplete` trả `missing` đúng khi thiếu; `{ ok: true }` khi đủ.
- [ ] Giá trị `secrets` bị che ở log; `env` không bị che (test đơn vị hai nhánh).
- [ ] Tệp `.local.json` sai hình dạng bị schema bắt kèm đường dẫn trường.
- [ ] Không có giá trị dữ liệu thật trong kho mã; `test-data.example.json` chỉ là khuôn.

## Definition of Done (US)
Theo `conventions.md` §4.

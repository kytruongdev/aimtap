# US-1.1: Khung dự án + shared kernel

**Epic:** EPIC-1 — Nền tảng lõi
**Business US (BA):** US-02
**Độ ưu tiên:** High
**Phụ thuộc:** —

## Mục tiêu
Kho mã build/lint/typecheck/test được, có cây thư mục `src/` theo module đúng `north-star.md` §2.1, luật lint cưỡng chế ranh giới, và hạ tầng dùng chung (log, lỗi, kiểu) sẵn cho mọi module.

## Tickets

### TICKET-001: Khởi tạo dự án và cưỡng chế ranh giới module
**Thiết kế liên quan:** north-star.md#2.1, north-star.md#2.3, coding-convention.md#Tổ-chức-thư-mục-và-ranh-giới, coding-convention.md#Môi-trường-và-lệnh-vận-hành, ADR-001, ADR-002, ADR-008
**Phụ thuộc:** —

**Chỉ dẫn code**
- `package.json`: trường `engines` ràng buộc Node LTS (khớp `.nvmrc`), script chạy qua `tsx`, phụ thuộc trụ cột theo north-star §4 (`@wdio/cli`, `@wdio/cucumber-framework`, `webdriverio`, `better-sqlite3`, `zod`, `pino`, `vitest`, `eslint`, `eslint-plugin-boundaries`, `typescript`, `tsx`). Cài bằng `npm ci`; commit `package-lock.json`.
- `.nvmrc` khớp `engines`. `tsconfig.json` bật `strict: true`, không cho `any` ngầm định. `vitest.config.ts` chạy test `<tên>.test.ts` cạnh nguồn.
- `eslint.config.ts` với `eslint-plugin-boundaries` khai báo đúng ba luật ranh giới north-star §2.1: (1) `src/` không import `apps/`; (2) `apps/` chỉ import `src/index.ts`; (3) giữa module trong `src/` chỉ import qua `index.ts` của nhau, phụ thuộc theo cột "Phụ thuộc" bảng §2, không phụ thuộc vòng; cộng luật một chiều `features/`→`steps/`→`screens/` trong `apps/`.
- Tạo cây thư mục rỗng `src/<module>/index.ts` cho đúng **10 module Phase 1** (`cli`, `registry`, `device`, `runner`, `locator`, `evidence`, `store`, `reporter`, `config`, `shared`) và `src/index.ts` là điểm vào công khai. Không tạo `src/ai/`, `src/analytics/`.
- `Makefile` với đích `setup`, `doctor`, `run`, `report`, `test`, `lint`, `typecheck` (stub, ticket sau nối lệnh thật). `.gitignore` chặn `output/`, `.env.local`, `apps/*/test-data.local.json`. `.env.example` (khung, không giá trị thật).

**Acceptance Criteria (cấp code)**
- [ ] `npm ci` cài được từ `package-lock.json` đã commit.
- [ ] Cây `src/` có đúng 10 thư mục module Phase 1, mỗi thư mục một `index.ts`; đường dẫn khớp §2.1; không có `src/ai/`, `src/analytics/`.
- [ ] `make typecheck`, `make lint`, `make test` chạy không lỗi trên cây khởi tạo.
- [ ] Import vi phạm ranh giới (ví dụ `src/` import `apps/`, hoặc import thẳng tệp bên trong module khác) làm `make lint` báo lỗi.
- [ ] `.env.local` và `apps/*/test-data.local.json` không bị Git theo dõi.
- [ ] Thêm một thư mục dưới `apps/` không đòi hỏi sửa gì trong `src/`.

### TICKET-002: Shared — logger, hai nhánh lỗi, kiểu chung
**Thiết kế liên quan:** component-design.md#Shared, interface-spec.md (mọi lỗi thuộc AppFailure/PlatformFailure), north-star.md#2.2 (Hai nhánh lỗi, Khả năng lần vết), coding-convention.md#Xử-lý-lỗi, coding-convention.md#Ghi-log
**Phụ thuộc:** TICKET-001

**Chỉ dẫn code**
- `src/shared/errors.ts`: `AppFailure` (lỗi ứng dụng được kiểm thử, kết quả hợp lệ, ghi vào bản ghi) và `PlatformFailure` (lỗi nền tảng/môi trường, không ghi thành "test case hỏng"); mỗi lớp mang `message` gốc + ngữ cảnh tùy chọn; bộ phân biệt kiểu `isAppFailure`/`isPlatformFailure`.
- `src/shared/logger.ts`: Pino log có cấu trúc; child logger gắn `run-id`; danh sách trường che (redact) + `registerSecretPaths(paths: string[])` để Config & Secrets đăng ký nhánh bí mật lúc chạy; không ghép giá trị bí mật vào chuỗi thông điệp.
- `src/shared/types.ts`: kiểu dùng chung (ví dụ `DeviceType = 'real' | 'simulator'`, `RunId`).
- `src/shared/index.ts`: phơi ra lỗi, bộ phân biệt kiểu, `logger`, `registerSecretPaths`, kiểu chung.

**Acceptance Criteria (cấp code)**
- [ ] `AppFailure`/`PlatformFailure` phân biệt được; test đơn vị bao hai nhánh.
- [ ] Log ở dạng có cấu trúc, mọi dòng mang `run-id` khi dùng child logger.
- [ ] Giá trị trường đã đăng ký che không xuất hiện trong dòng log (test đơn vị).
- [ ] Module khác chỉ import Shared qua `src/shared/index.ts`.

## Definition of Done (US)
Theo `conventions.md` §4: mọi ticket thỏa DoD cấp ticket (§3); mỗi ticket một commit; PR merge được, đã phê duyệt, tiêu đề mang mã user story.

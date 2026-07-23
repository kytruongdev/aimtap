# US-1.3: App Registry

**Epic:** EPIC-1 — Nền tảng lõi
**Business US (BA):** US-01, US-02
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1

## Mục tiêu
Nền tảng nạp và kiểm tra khai báo của một ứng dụng theo `<app-id>`, từ chối khai báo sai kèm lý do theo trường.

## Tickets

### TICKET-005: Schema khai báo ứng dụng + loader
**Thiết kế liên quan:** component-design.md#App-Registry, interface-spec.md#App-Registry (`loadAppConfig`), interface-spec.md#Hợp-đồng-dữ-liệu (`app.config.ts`), UC-01 (E1, E2), BR-008, BR-015
**Phụ thuộc:** TICKET-002

**Chỉ dẫn code**
- `src/registry/app-config.schema.ts`: schema Zod của `app.config.ts` — `appId`, `buildPath`, `deviceType` (`real`|`simulator`), `deviceId`, `osVersion`. Nguồn duy nhất của cả kiểu `AppConfig` (`z.infer`) lẫn phép kiểm tra.
- `src/registry/load-app-config.ts`:
  - `loadAppConfig(appId): AppConfig` — nạp `apps/<app-id>/app.config.ts` theo quy ước đường dẫn, kiểm tra qua schema; ném `PlatformFailure` nêu trường thiếu/sai (UC-01 E2).
  - `<app-id>` không tồn tại → từ chối kèm định danh không tìm thấy.
  - Kiểm tra `appId` trong tệp khớp tên thư mục; lệch thì ném `PlatformFailure` nêu định danh đang lệch (UC-01 E1).
- `src/registry/index.ts` phơi ra `loadAppConfig` và kiểu `AppConfig`.

**Acceptance Criteria (cấp code)**
- [ ] Khai báo đủ trường hợp lệ trả về `AppConfig` đã kiểm tra kiểu.
- [ ] Thiếu trường bắt buộc → `PlatformFailure` nêu đúng tên trường (test đơn vị).
- [ ] `appId` lệch tên thư mục → `PlatformFailure` nêu định danh lệch.
- [ ] Không có tri thức của ứng dụng cụ thể nào trong `src/registry/`.

## Definition of Done (US)
Theo `conventions.md` §4.

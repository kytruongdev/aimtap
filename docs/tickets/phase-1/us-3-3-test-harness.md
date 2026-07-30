# US-3.3: Bộ khung WDIO/Cucumber

**Epic:** EPIC-3 — Thiết bị & vòng đời lượt chạy
**Business US (BA):** US-05, US-06, US-03
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1

## Mục tiêu
Nền tảng gắn được vào WebdriverIO testrunner với Cucumber, mở phiên Appium một lần cho mỗi lượt chạy, và dừng kèm danh sách câu mô tả thiếu step definition.

## Tickets

### TICKET-017: WDIO service + cấu hình WDIO/Cucumber
**Thiết kế liên quan:** component-design.md#Test-Runner (`wdio-service.ts`), interface-spec.md#Tích-hợp-ngoài (Appium/XCUITest — phiên thực thi), north-star.md#2.1 (config/), north-star.md#2.2 (Độ ổn định, Hiệu suất — mở phiên một lần), north-star.md#2.3 (câu thiếu step definition làm dừng), coding-convention.md#Phần-cài-đặt, ADR-001, ADR-007, ADR-013, ADR-015
**Phụ thuộc:** TICKET-001, TICKET-002

**Chỉ dẫn code**
- `src/runner/wdio-service.ts`:
  - `buildCucumberOpts(require, policy?)` — dựng `cucumberOpts`: `timeout` lấy từ `wait-policy` (ADR-015, không đặt cố định), `ignoreUndefinedDefinitions: false` (câu thiếu step definition làm lượt chạy dừng, không bỏ qua im lặng — north-star §2.3), `failAmbiguousDefinitions: true`, `backtrace: true`.
  - `iosCapabilities(kind: 'sim' | 'device', env?)` — dựng capabilities XCUITest: phần cố định (`platformName`, `automationName`) tại đây, giá trị theo lượt chạy (thiết bị, build ứng dụng, ký mã) đọc từ biến môi trường (`AIMTAP_DEVICE_NAME`, `AIMTAP_PLATFORM_VERSION`, `AIMTAP_APP_PATH`; thiết bị thật thêm `AIMTAP_UDID`, `AIMTAP_XCODE_ORG_ID`, `AIMTAP_XCODE_SIGNING_ID`). Không phụ thuộc build-time vào Device & Build Manager hay CLI.
  - `class AimtapService` — WDIO service để testrunner nạp nền tảng; phiên Appium mở một lần cho mỗi lượt chạy (mặc định một worker, AS-P1-01). Hook vòng đời Cucumber (probe, sự kiện bằng chứng, sink tên màn hình) thêm ở US-3.4 (`cucumber-hooks.ts`).
- `config/wdio.shared.conf.ts`: phần dùng chung — `framework: 'cucumber'`, `specs` trỏ `apps/*/features`, `cucumberOpts` từ `buildCucumberOpts`, đăng ký `AimtapService`, `maxInstances: 1`, endpoint Appium mặc định localhost:4723 (đổi qua `AIMTAP_APPIUM_HOST`/`AIMTAP_APPIUM_PORT`).
- `config/wdio.ios.sim.conf.ts`, `config/wdio.ios.device.conf.ts`: kế thừa phần dùng chung, thêm `capabilities` từ `iosCapabilities('sim')` / `iosCapabilities('device')`.
- Cập nhật `src/runner/index.ts` phơi service + helper.

**Convention áp dụng:** `coding-convention.md` §Đặt tên, §Phần cài đặt; toàn bộ mã tiếng Anh (BC-10). Test đơn vị theo `conventions.md` §3.1 (logic thuần bắt buộc test; phần chạm thiết bị/testrunner kiểm chứng thủ công ghi trong PR).

**Acceptance Criteria (cấp code)**
- [ ] Testrunner khởi động với Cucumber qua cấu hình dùng chung; capabilities chọn được giữa simulator và thiết bị thật (kiểm chứng thủ công ghi trong PR).
- [ ] `cucumberOpts.ignoreUndefinedDefinitions === false`: câu mô tả không có step definition làm lượt chạy dừng kèm danh sách câu thiếu (test đơn vị).
- [ ] `iosCapabilities` dựng đúng capabilities sim/device từ biến môi trường (test đơn vị hai nhánh).
- [ ] `cucumberOpts.timeout` lấy từ `wait-policy`, không đặt cố định (test đơn vị).
- [ ] Phiên Appium mở một lần cho mỗi lượt chạy, dùng lại giữa các test case (kiểm chứng thủ công ghi trong PR).

## Definition of Done (US)
Theo `conventions.md` §4.

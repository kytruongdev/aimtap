# US-3.3: Bộ khung WDIO/Cucumber

**Epic:** EPIC-3 — Thiết bị & vòng đời lượt chạy
**Business US (BA):** US-05, US-06, US-03
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1

## Mục tiêu
Nền tảng gắn được vào WebdriverIO testrunner với Cucumber, mở phiên Appium một lần cho mỗi lượt chạy, và dừng kèm danh sách câu mô tả thiếu step definition.

## Tickets

### TICKET-017: WDIO service + cấu hình WDIO/Cucumber
**Thiết kế liên quan:** component-design.md#Test-Runner (`wdio-service.ts`), interface-spec.md#Tích-hợp-ngoài (Appium/XCUITest — phiên thực thi), north-star.md#2.1 (config/), north-star.md#2.2 (Độ ổn định, Hiệu suất — mở phiên một lần), coding-convention.md#Phần-cài-đặt, ADR-001, ADR-007
**Phụ thuộc:** TICKET-001, TICKET-002

**Chỉ dẫn code**
- `config/wdio.shared.conf.ts`: phần dùng chung — đăng ký WDIO service của nền tảng, `cucumberOpts`, tham số thời gian chờ lấy từ `wait-policy`. Câu mô tả chưa có step definition làm lượt chạy dừng kèm danh sách câu thiếu; không bật bỏ qua step chưa định nghĩa.
- `config/wdio.ios.sim.conf.ts` và `config/wdio.ios.device.conf.ts`: capabilities cho simulator và thiết bị thật, kế thừa phần dùng chung.
- `src/runner/wdio-service.ts`: WDIO service gắn nền tảng vào testrunner; mở phiên Appium một lần cho mỗi lượt chạy, dùng lại giữa các test case; dùng lệnh cấp cao của WebdriverIO.
- Cập nhật `src/runner/index.ts`; cập nhật `Makefile` đích liên quan nếu cần.

**Acceptance Criteria (cấp code)**
- [ ] Testrunner khởi động với Cucumber qua cấu hình dùng chung; capabilities chọn được giữa simulator và thiết bị thật.
- [ ] Câu mô tả không có step definition làm lượt chạy dừng kèm danh sách câu thiếu (không bỏ qua im lặng).
- [ ] Phiên Appium mở một lần cho mỗi lượt chạy, dùng lại giữa các test case (kiểm chứng thủ công ghi trong PR).
- [ ] Tham số thời gian chờ lấy từ `wait-policy`, không đặt cố định trong cấu hình.

## Definition of Done (US)
Theo `conventions.md` §4.

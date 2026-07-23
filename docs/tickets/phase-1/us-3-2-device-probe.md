# US-3.2: Probe thiết bị giữa lượt chạy

**Epic:** EPIC-3 — Thiết bị & vòng đời lượt chạy
**Business US (BA):** US-20
**Độ ưu tiên:** High
**Phụ thuộc:** US-2.1, US-3.1

## Mục tiêu
Trước mỗi test case, nền tảng xác định phiên/thiết bị còn sống bằng một lệnh chi phí thấp, trả `ready`/`unavailable`.

## Tickets

### TICKET-010: probeDuringRun
**Thiết kế liên quan:** component-design.md#Device-&-Build-Manager (`probeDuringRun`), interface-spec.md#Device-&-Build-Manager và §Tích-hợp-ngoài (Appium/XCUITest — probe), sequence-diagrams.md#3, ADR-010, BR-018, FR-RUN-06
**Phụ thuộc:** TICKET-009, TICKET-011

**Chỉ dẫn code**
- Bổ sung vào `src/device/device-manager.ts`:
  - `probeDuringRun(session): 'ready' | 'unavailable'` — phát một lệnh phiên chi phí thấp (`execute('mobile: activeAppInfo')` hoặc `getWindowRect()`), bọc trong `wait-policy` (chờ có điều kiện, thời gian chờ tối đa, thử lại để bỏ qua trục trặc thoáng qua). Trả về bình thường ⇒ `ready`; ném lỗi kết nối hoặc hết thời gian chờ sau khi thử lại ⇒ `unavailable`.
- Dùng tham số chờ/thử lại từ `locator/wait-policy.ts`; không đặt thời gian chờ cố định riêng; không gọi lệnh giao thức cấp thấp. Việc dừng lượt chạy khi `unavailable` do Test Runner quyết (US-3.4).

**Acceptance Criteria (cấp code)**
- [ ] `probeDuringRun` trả `ready` khi lệnh phiên trả về bình thường; `unavailable` khi ném lỗi kết nối/hết thời gian chờ (test đơn vị với phiên giả lập).
- [ ] Dùng `wait-policy` chung, không có thời gian chờ cố định trong hàm.
- [ ] Không gọi lệnh giao thức cấp thấp của WebDriver.

## Definition of Done (US)
Theo `conventions.md` §4.

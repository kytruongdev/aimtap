# US-3.1: Sẵn sàng thiết bị & cài build

**Epic:** EPIC-3 — Thiết bị & vòng đời lượt chạy
**Business US (BA):** US-08
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1, US-1.3

## Mục tiêu
Nền tảng kiểm tra môi trường máy QC trước khi mở phiên, chuẩn bị thiết bị thật/simulator, cài `.ipa`/`.app`, và trả `DeviceContext` khi sẵn sàng; nêu lý do riêng cho từng trường hợp không thỏa.

## Tickets

### TICKET-008: Kiểm tra môi trường
**Thiết kế liên quan:** component-design.md#Device-&-Build-Manager (`environment-check.ts`), north-star.md#2.2 (Phát hiện sai sót sớm), north-star.md#2.3, north-star.md#5 (NFR-02), UC-05 (E1–E4), BR-015
**Phụ thuộc:** TICKET-002

**Chỉ dẫn code**
- `src/device/environment-check.ts`: kiểm tra Node đúng phiên bản, Xcode có mặt, Appium chạy được, thiết bị khai báo khả dụng, bản build tồn tại tại `buildPath`. Trả kết quả có cấu trúc: từng mục kèm trạng thái đạt/không đạt và lý do; gom đủ mục trước khi báo, không dừng ở mục đầu. Điều kiện môi trường không thỏa là `PlatformFailure`. Mọi kiểm tra môi trường mới về sau thêm vào đây.
- Cập nhật `src/device/index.ts` phơi ra `environmentCheck`.

**Acceptance Criteria (cấp code)**
- [ ] Trả danh sách mục kiểm tra kèm trạng thái và lý do, gom đủ trước khi báo.
- [ ] Bản build không tồn tại tại `buildPath` được nêu kèm đường dẫn (UC-05 E1).
- [ ] Thiết bị không khả dụng / OS lệch được nêu riêng từng mục (UC-05 E2, E3).
- [ ] Logic tách khỏi phần gọi công cụ hệ thống để test đơn vị chạy không cần máy thật.

### TICKET-009: Chuẩn bị thiết bị + cài build
**Thiết kế liên quan:** component-design.md#Device-&-Build-Manager (`device-manager.ts`, `simulator-driver.ts`, `real-device-driver.ts`), interface-spec.md#Device-&-Build-Manager (`ensureReadyBeforeRun`, `installBuild`), UC-05, FR-DEV-01→04, BR-015
**Phụ thuộc:** TICKET-005, TICKET-008

**Chỉ dẫn code**
- `src/device/device-manager.ts`:
  - `prepareDevice(appConfig)` — khởi động simulator hoặc xác nhận kết nối thiết bị thật theo `deviceType`.
  - `ensureReadyBeforeRun(appConfig): DeviceContext` — kiểm tra đầy đủ ở tầng hệ điều hành (có mặt, kết nối, OS khớp); ném `PlatformFailure` nêu lý do khi không thỏa (UC-05 E2, E3). `DeviceContext` gồm `device_id`, `device_type`, `os_version`, `app_version`.
  - `installBuild(appConfig)` — cài build; bỏ qua nếu đã đúng phiên bản (UC-05 4a); ném `PlatformFailure` nêu lý do do hệ thống cài đặt trả về khi thất bại (UC-05 E4).
- `src/device/simulator-driver.ts` / `real-device-driver.ts`: cài đặt cho hai loại qua `simctl` và công cụ thiết bị thật; `device-manager.ts` chọn driver theo `deviceType`. Dùng `environment-check` cho phần điều kiện chung.
- Cập nhật `src/device/index.ts` phơi ra `prepareDevice`, `ensureReadyBeforeRun`, `installBuild`, kiểu `DeviceContext`.

**Acceptance Criteria (cấp code)**
- [ ] `.ipa` cài lên thiết bị thật, `.app` cài lên simulator (kiểm chứng thủ công ghi trong PR).
- [ ] `installBuild` bỏ qua khi đã đúng phiên bản (test đơn vị với lớp gọi giả lập).
- [ ] Mỗi trường hợp không thỏa (build không tồn tại, thiết bị không sẵn sàng, OS lệch, cài thất bại) ném `PlatformFailure` với lý do riêng.
- [ ] `ensureReadyBeforeRun` trả `DeviceContext` đủ bốn trường khi thỏa.
- [ ] Logic chọn driver và điều kiện tách khỏi phần gọi `simctl`/công cụ thật.

## Definition of Done (US)
Theo `conventions.md` §4.

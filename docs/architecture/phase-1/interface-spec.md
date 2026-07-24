# Interface Spec — Phase 1

Đặc tả interface nội bộ giữa các component và hợp đồng với bên ngoài. Chữ ký viết ở mức khái niệm; kiểu dữ liệu suy từ schema Zod đặt cùng module (`coding-convention.md`). Mọi lỗi ném ra thuộc `AppFailure` hoặc `PlatformFailure`.

---

## Interface nội bộ

### App Registry
**Mục đích:** nạp và kiểm tra khai báo một ứng dụng.
**Đầu vào / đầu ra:** `loadAppConfig(appId: string): AppConfig` — ném `PlatformFailure` nêu trường thiếu/sai nếu khai báo không hợp lệ (UC-01 E2).
**Liên quan:** FR-APP-01, UC-01.

### Config & Secrets
**Mục đích:** nạp dữ liệu kiểm thử và kiểm tra tính đầy đủ trước lượt chạy.
**Đầu vào / đầu ra:**
- `loadTestData(appId: string): TestData` — nạp `apps/<app-id>/test-data.local.json`, kiểm tra qua schema theo ứng dụng; nhánh bí mật được đăng ký vào danh sách che của logger.
- `verifyTestDataComplete(appId: string): { ok: true } | { ok: false; missing: string[] }` — `missing` là đường dẫn trường của mục chưa có giá trị (FR-APP-04, US-19).
**Liên quan:** FR-APP-04, FR-APP-05, ADR-009.

### Device & Build Manager
**Mục đích:** chuẩn bị thiết bị và kiểm tra sẵn sàng.
**Đầu vào / đầu ra:**
- `ensureReadyBeforeRun(appConfig: AppConfig): DeviceContext` — kiểm tra đầy đủ ở tầng hệ điều hành (có mặt, kết nối, OS khớp); ném `PlatformFailure` nêu lý do nếu không thỏa (FR-DEV-02, UC-05 E1–E4). `DeviceContext` gồm `device_id`, `device_type`, `os_version`, `app_version`.
- `installBuild(appConfig): void` — bỏ qua nếu ứng dụng đã ở đúng phiên bản (UC-05 4a).
- `probeDuringRun(session): 'ready' | 'unavailable'` — probe nhẹ trên phiên đang mở (ADR-010), xem §Tích hợp ngoài.
**Liên quan:** FR-DEV-01→04, BR-015, BR-018.

### Locator Resolver
**Mục đích:** điểm duy nhất tìm phần tử; mang tên màn hình phục vụ bằng chứng.
**Đầu vào / đầu ra:** `find(locator: Locator, screenName: string): Element` — tìm phần tử qua phiên WebdriverIO toàn cục, chờ có điều kiện theo `wait-policy`; ném lỗi không tìm thấy khi hết thời gian chờ. `screenName` do Page Object truyền vào, đẩy qua sink do Test Runner tiêm lúc mở phiên (ADR-014) — Locator không import Test Runner; Test Runner ghi nhận làm màn hình hiện tại (ADR-011).
`registerScreenSink(sink: (screenName: string) => void): void` — Test Runner gọi lúc mở phiên để tiêm sink.
**Liên quan:** FR-AUTH-03, BR-007, ADR-004, ADR-011, ADR-014.

### Evidence Collector
**Mục đích:** dựng bằng chứng và đẩy bản ghi.
**Đầu vào / đầu ra:**
- `onStepEnd(step: { order; text; result; duration; error? }): void` — thêm mục vào nhật ký; nếu hỏng, chụp ảnh và phân loại lỗi.
- `onScenarioEnd(testCase): TestCaseResult` — chốt trạng thái test case, đẩy TestCaseResult và StepLog sang Result Store theo một giao dịch.
- `setCurrentScreen(name: string): void` — Test Runner gọi khi màn hình đổi (ADR-011).
Lỗi chụp ảnh/ghi nhật ký được bắt tại đây, đánh dấu `evidence_missing`, không đổi trạng thái test case (BR-004).
**Liên quan:** FR-EXEC-03→06, FR-EXEC-10, UC-07.

### Result Store (repository)
**Mục đích:** ghi/đọc dữ liệu kết quả, chỉ chèn thêm.
**Đầu vào / đầu ra:**
- `saveRunStart(run): void` / `finalizeRun(run): void` — ghi bối cảnh lúc mở và trạng thái tổng hợp lúc đóng.
- `saveTestCaseResult(result, steps[]): void` — một giao dịch cho mỗi test case (ADR-003).
- `getRunModel(runId): { run; results[]; steps[] }` — cho Reporter.
Không có thao tác cập nhật hay xóa (FR-DATA-05).
**Liên quan:** FR-DATA-01→05, BR-009.

### Reporter
**Mục đích:** dựng và xuất báo cáo một tệp.
**Đầu vào / đầu ra:** `buildReportModel(runId): ReportModel` rồi `render(model, format: 'pdf' | 'png'): string` (đường dẫn tệp dưới `output/<app-id>/reports/`).
**Liên quan:** FR-REP-01→04, ADR-006, ADR-012.

---

## Tích hợp ngoài

### Appium/XCUITest — probe thiết bị giữa lượt chạy (ADR-010)
**Mục đích:** xác định thiết bị/phiên còn sống trước mỗi test case.
**Request gửi đi:** một lệnh phiên chi phí thấp — `execute('mobile: activeAppInfo')` hoặc `getWindowRect()` — bọc trong `wait-policy` (chờ có điều kiện, thời gian chờ tối đa, có thử lại để bỏ qua trục trặc thoáng qua).
**Response nhận về:** trả về bình thường ⇒ `ready`. Ném lỗi kết nối hoặc hết thời gian chờ ⇒ `unavailable` ⇒ Test Runner dừng lượt chạy với `stop_reason = device_unavailable` (BR-018, FR-RUN-06).
**Business rule:** BR-018.

### Appium/XCUITest — phiên thực thi
Capabilities khai báo ở `config/wdio.ios.{sim,device}.conf.ts`; phiên mở một lần cho mỗi lượt chạy, dùng lại giữa các test case (`north-star.md` §2.2). Dùng lệnh cấp cao của WebdriverIO, không gọi giao thức cấp thấp.

### Jira
Không có tích hợp API; đầu ra là một tệp PNG/PDF QC đính thủ công (BC-05, FR-REP-03).

---

## Hợp đồng dữ liệu

### Bản ghi kết quả logic (JSON) của một test case
Bản ghi logic mà FR-DATA-01/FR-DATA-03 mô tả là TestCaseResult ghép bối cảnh của Run. Trường bắt buộc, khớp `erd.md`:

`run_id`, `app_id`, `app_version`, `device_id`, `device_type`, `os_version`, `started_at` (thời điểm chạy), `test_feature`, `test_case`, `status` (`passed`|`failed`|`passed_healed`), `duration_ms`, `screen`, `failure_type` (`wrong_conclusion`|`step_not_executed`), `error_message`, kèm nhật ký thực thi (`steps[]`: `step_order`, `step_text`, `result`, `duration_ms`, `error_message?`, `screenshot_path?`).

Trường `screen`, `failure_type`, `error_message` chỉ có giá trị khi `status = failed`. Bản ghi không chứa giá trị dữ liệu kiểm thử (ADR-009). Đây là hợp đồng Phase 3 và Reporter dựa vào; thêm trường về sau bằng migration (ADR-003).

### `app.config.ts` (khai báo ứng dụng)
Trường: `appId`, `buildPath`, `deviceType` (`real`|`simulator`), `deviceId`, `osVersion`. Kiểm tra qua schema ở App Registry (FR-APP-01).

### `test-data.example.json` / `test-data.local.json` (ADR-009)
Tệp có cấu trúc theo ứng dụng, tách nhánh bí mật và nhánh cấu hình không bí mật:
```
{
  "secrets": { "accounts": { "<tên>": { "username": "...", "password": "..." } } },
  "env": { "<tên cấu hình không bí mật>": "..." }
}
```
`test-data.example.json` mang giá trị giữ chỗ và là danh sách mục bắt buộc; `test-data.local.json` mang giá trị thật, không theo dõi bởi Git. Schema theo ứng dụng là nguồn của phép kiểm tra tính đầy đủ; nhánh `secrets` được che ở tầng log, nhánh `env` được phép hiện trong bối cảnh báo cáo. Dữ liệu loại bị tiêu thụ không nằm trong tệp này (BR-017 quy tắc 3).

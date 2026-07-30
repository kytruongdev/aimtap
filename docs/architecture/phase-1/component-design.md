# Component Design — Phase 1

Thiết kế cấu trúc bên trong các module Phase 1 ở mức module/layer. Ranh giới và phụ thuộc giữa các module theo `north-star.md` §2; cây thư mục theo §2.1. Quyết định Phase 1 áp dụng: ADR-009 (dữ liệu kiểm thử ngoài kho mã), ADR-010 (probe thiết bị), ADR-011 (tên màn hình), ADR-012 (công cụ PDF), ADR-013 (mô hình thực thi Test Runner), ADR-014 (Locator Resolver không phụ thuộc Test Runner), ADR-015 (wait-policy là hạ tầng Shared), ADR-016 (discriminant loại lỗi trên AppFailure).

Danh sách tệp dưới mỗi module là tệp đại diện, không phải danh sách đầy đủ; việc chia hàm/tệp cấp ticket thuộc Team Lead.

---

## CLI Entry
**Trách nhiệm:** Nhận lệnh của QC, khởi động một lượt chạy và hiển thị tiến trình.
**Cấu trúc bên trong:**
- `commands/run.ts` — lệnh `aimtap run <app-id>`: phân giải tham số (thiết bị, tập chạy theo test feature/tên/nhãn), gọi chuỗi kiểm tra tiền điều kiện rồi Test Runner.
- `commands/report.ts` — lệnh `aimtap report <run-id>`: gọi Reporter sinh lại báo cáo từ dữ liệu đã lưu, không chạy lại test case.
- `commands/doctor.ts` — lệnh `aimtap doctor`: gọi `checkEnvironment` (kèm target) của Device & Build Manager.
- `progress-view.ts` — hiển thị test case đang chạy kèm test feature, số đã hoàn tất trên tổng, trạng thái từng test case (FR-RUN-03, US-10).
**Phụ thuộc:** App Registry, Config & Secrets, Device & Build Manager, Test Runner, Reporter, Shared.
**Requirement liên quan:** FR-RUN-01, FR-RUN-02, FR-RUN-03, UC-06.

## App Registry
**Trách nhiệm:** Giữ và kiểm tra khai báo của từng ứng dụng.
**Cấu trúc bên trong:**
- `app-config.schema.ts` — schema Zod của `app.config.ts`: định danh, đường dẫn build, loại thiết bị, định danh thiết bị, phiên bản OS đích. Nguồn duy nhất của cả kiểu lẫn phép kiểm tra.
- `load-app-config.ts` — nạp khai báo của một `<app-id>` theo quy ước đường dẫn, kiểm tra qua schema, trả lỗi nêu rõ trường thiếu/sai (E1, E2 của UC-01).
**Phụ thuộc:** Shared.
**Requirement liên quan:** FR-APP-01, FR-APP-02, FR-APP-03, FR-AUTH-08, BR-008, UC-01.

## Config & Secrets
**Trách nhiệm:** Cấu hình vận hành, nạp khóa API và dữ liệu kiểm thử từ nguồn ngoài kho mã; kiểm tra tính đầy đủ của dữ liệu kiểm thử.
**Cấu trúc bên trong:**
- `env.schema.ts` — schema Zod cho biến môi trường (gồm khóa API Phase 2).
- `platform-config.ts` — cấu hình vận hành: thời gian chờ, thư mục output, công tắc AI.
- `secrets.ts` — nạp khóa API và dữ liệu kiểm thử của một ứng dụng từ `apps/<app-id>/test-data.local.json`, kiểm tra qua schema theo ứng dụng, đánh dấu nhánh bí mật vào danh sách che của logger; phần kiểm tra tính đầy đủ báo mục thiếu theo đường dẫn trường (ADR-009, FR-APP-04, FR-APP-05, US-19).
**Phụ thuộc:** Shared.
**Requirement liên quan:** FR-APP-04, FR-APP-05, NFR-04, NFR-12, BR-015, BR-017.

## Device & Build Manager
**Trách nhiệm:** Chuẩn bị thiết bị, cài build, kiểm tra thiết bị sẵn sàng trước và giữa lượt chạy.
**Cấu trúc bên trong:**
- `device-manager.ts` — hợp đồng chung: `prepareDevice`, `installBuild`, `ensureReadyBeforeRun` (FR-DEV-02; sở hữu kiểm tra thiết bị/OS/bản build ở tầng hệ điều hành, trả `DeviceContext`), `probeDuringRun` (ADR-010, probe nhẹ trên phiên, bọc trong `wait-policy` của Shared).
- `simulator-driver.ts` / `real-device-driver.ts` — cài đặt cho hai loại thiết bị qua `simctl` và công cụ thiết bị thật.
- `environment-check.ts` — `checkEnvironment(probes, target?)`: luôn kiểm host tools (Node, Xcode, Appium); kèm `target` thì thêm bản build/thiết bị/OS. Gom mọi mục trước khi báo; `assertEnvironmentReady` gộp mục hỏng thành một `PlatformFailure`.

Phân vai ở bước tiền điều kiện lượt chạy để không kiểm trùng: CLI gọi `checkEnvironment` **không kèm target** (chỉ host tools Node/Xcode/Appium — điều kiện độc lập ứng dụng), còn `ensureReadyBeforeRun` sở hữu thiết bị/OS/bản build và trả `DeviceContext`. `doctor` gọi `checkEnvironment` **kèm target** cho chẩn đoán một lần đầy đủ. Cả hai đáp ứng §2.2 "Node, Xcode, Appium, thiết bị, bản build kiểm trước khi mở phiên Appium".
**Phụ thuộc:** App Registry (kiểu `AppConfig`), Appium, công cụ dòng lệnh của Xcode, Shared.
**Requirement liên quan:** FR-DEV-01→04, FR-EXEC-01, BR-015, BR-018, UC-05.

## Test Runner
**Trách nhiệm:** Thực thi test case được chọn, quản lý vòng đời phiên Appium, phát sự kiện bước/test case, điều phối probe thiết bị và điều kiện dừng. WebdriverIO/Cucumber điều khiển việc lặp qua test case; nền tảng phản ứng qua hook vòng đời (ADR-013).
**Cấu trúc bên trong:**
- `run-session.ts` — trạng thái và điều phối một lượt chạy trong tiến trình worker: sinh `run-id`, giữ trạng thái tổng hợp và cờ dừng, quyết định khi probe trả `unavailable` hoặc khi QC hủy. `saveRunStart` chạy ở hook `before`, `finalizeRun` (trạng thái tổng hợp, BR-011) ở hook `after` (ADR-013). Không tự lặp qua test case.
- `cucumber-hooks.ts` — handler vòng đời: `beforeScenario` gọi `probeDuringRun` (ADR-010); nếu cờ dừng đã bật hoặc probe trả `unavailable` thì bỏ qua test case và không sinh bản ghi (BR-012, BR-018). Test case `failed` không bật cờ dừng (BR-002). `beforeStep`/`afterStep`/`afterScenario` chuyển sự kiện tới Evidence Collector. Tiêm sink tên màn hình vào Locator Resolver lúc mở phiên (ADR-014) và giữ "màn hình hiện tại" (ADR-011).
- `wdio-service.ts` — gắn nền tảng vào WebdriverIO testrunner; đăng ký các hook trên và mở phiên Appium một lần cho mỗi lượt chạy.
- Hủy bởi QC: bắt tín hiệu ngắt (SIGINT) trong worker, bật cờ dừng với `stop_reason = cancelled_by_qc`; test case còn lại bị bỏ qua, `finalizeRun` đánh dấu `incomplete` (ADR-013).
**Phụ thuộc:** WebdriverIO, Cucumber, Appium, Device & Build Manager, Locator Resolver, Evidence Collector, Result Store, Shared.
**Requirement liên quan:** FR-RUN-01→06, FR-EXEC-01, FR-EXEC-07, UC-06, UC-07.

## Locator Resolver
**Trách nhiệm:** Điểm duy nhất tìm phần tử; điểm chèn self-healing của Phase 2 (ADR-004).
**Cấu trúc bên trong:**
- `locator-resolver.ts` — `find(locator, screenName)`: Phase 1 tìm phần tử qua phiên WebdriverIO toàn cục theo `wait-policy` (của Shared), trả phần tử hoặc ném `AppFailure` không tìm thấy (`kind = step_execution` mặc định, ADR-016). `screenName` do Page Object truyền vào; đẩy tới sink do Test Runner tiêm lúc mở phiên (ADR-014), không import Test Runner (ADR-011).
- `locator.ts` — kiểu Locator và các chiến lược iOS (accessibility id, id, predicate string, class chain).
**Phụ thuộc:** WebdriverIO (phiên toàn cục), Shared.
**Requirement liên quan:** FR-AUTH-02, FR-AUTH-03, BR-007, UC-02.

## Evidence Collector
**Trách nhiệm:** Dựng bằng chứng thực thi của mỗi test case và đẩy bản ghi sang Result Store.
**Cấu trúc bên trong:**
- `evidence-collector.ts` — nhận sự kiện bước/test case, dựng bản ghi kết quả và nhật ký, đẩy sang Result Store; đọc màn hình hiện tại tại bước hỏng (ADR-011).
- `execution-log.ts` — dựng nhật ký thực thi trong bộ nhớ: bước theo thứ tự, kết quả, thời lượng, lỗi tại bước hỏng.
- `screenshot-writer.ts` — chụp và ghi ảnh tại bước hỏng và bước được đánh dấu, ngoài đường chờ của bước.
- `failure-classifier.ts` — đọc `kind` của `AppFailure` để ra `failure_type` (BR-014): `assertion` → `wrong_conclusion`; `step_execution` và lỗi lạ không thuộc `AppFailure`/`PlatformFailure` → `step_not_executed`; luôn giữ thông báo lỗi gốc; `PlatformFailure` không ghi thành test case hỏng (ADR-016).
**Phụ thuộc:** Result Store, Shared.
**Requirement liên quan:** FR-EXEC-03→06, FR-EXEC-10, BR-003, BR-004, BR-014, UC-07.

## Result Store
**Trách nhiệm:** Lưu bản ghi kết quả có cấu trúc trên máy QC (ADR-003).
**Cấu trúc bên trong:**
- `database.ts` — mở SQLite tại `output/<app-id>/results.db`, bật WAL, chuẩn bị câu lệnh.
- `migrations/` — nâng cấp schema có đánh số, chạy lúc khởi động.
- `run-repository.ts` — ghi/đọc Run, TestCaseResult, StepLog theo giao dịch; chỉ chèn thêm.
- `models.ts` — kiểu bản ghi kết quả, khớp `erd.md`.
**Phụ thuộc:** `better-sqlite3`, Shared.
**Requirement liên quan:** FR-DATA-01→05, BR-009, UC-07.

## Reporter
**Trách nhiệm:** Sinh báo cáo một tệp của một lượt chạy (ADR-006).
**Cấu trúc bên trong:**
- `report-model.ts` — dựng mô hình báo cáo từ Result Store: bối cảnh lượt chạy, bảng tóm tắt nhóm theo test feature, chi tiết mỗi test case hỏng.
- `templates/` — mẫu HTML/CSS do nền tảng kiểm soát.
- `render.ts` — dựng HTML rồi xuất PNG/PDF bằng trình duyệt không giao diện (ADR-012).
**Phụ thuộc:** Result Store, công cụ PDF (ADR-012), Shared.
**Requirement liên quan:** FR-REP-01→04, BR-012, UC-08, UC-09.

## Shared
**Trách nhiệm:** Hạ tầng dùng chung.
**Cấu trúc bên trong:**
- `logger.ts` — log có cấu trúc (Pino), gắn `run-id`, che trường bí mật.
- `errors.ts` — `AppFailure` (mang `kind`: `step_execution` mặc định | `assertion` — ADR-016) và `PlatformFailure`.
- `assertion.ts` — cơ chế khẳng định của nền tảng: bọc lệnh khẳng định của step definition, ném lỗi khẳng định thành `AppFailure` với `kind = assertion` để `failure-classifier` ánh xạ ra `wrong_conclusion` (ADR-016). Mặt ghi đối xứng với `failure-classifier` (mặt đọc); chỉ phụ thuộc `errors.ts`.
- `wait-policy.ts` — tham số thời gian chờ có điều kiện tập trung (`timeoutMs`/`intervalMs`/`retries`) và `withRetries`; dùng chung cho `find` (Locator Resolver) và probe thiết bị (Device & Build Manager) (ADR-010, ADR-015).
- `types.ts` — kiểu dùng chung.
**Phụ thuộc:** —
**Requirement liên quan:** NFR-03 (tách hai nhánh lỗi), NFR-04 (che bí mật).

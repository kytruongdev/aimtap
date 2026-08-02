# US-3.4: Điều phối lượt chạy

**Epic:** EPIC-3 — Thiết bị & vòng đời lượt chạy
**Business US (BA):** US-09, US-11, US-12, US-13, US-20
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.4, US-2.1, US-2.3, US-3.1, US-3.2, US-3.3

## Mục tiêu
WebdriverIO/Cucumber điều khiển việc lặp qua test case; nền tảng phản ứng qua hook (ADR-013): `beforeScenario` probe thiết bị và bỏ qua test case theo cờ dừng, `beforeStep`/`afterStep`/`afterScenario` chuyển sự kiện thành bằng chứng; `run-session` giữ trạng thái tổng hợp và cờ dừng, ghi bối cảnh ở hook `before` và trạng thái tổng hợp ở hook `after`. Test Runner tiêm sink tên màn hình vào Locator Resolver lúc mở phiên (ADR-014).

## Tickets

### TICKET-018: Móc Cucumber → bằng chứng, probe, tiêm sink tên màn hình
**Thiết kế liên quan:** component-design.md#Test-Runner (`cucumber-hooks.ts`), interface-spec.md#Evidence-Collector, interface-spec.md#Locator-Resolver (`registerScreenSink`), sequence-diagrams.md#2, #3, ADR-013, ADR-014, ADR-010, ADR-011, ADR-016, ADR-009, BR-002, BR-012, BR-018, UC-07
**Phụ thuộc:** TICKET-010, TICKET-012, TICKET-016, TICKET-017, TICKET-019

**Chỉ dẫn code**
- `src/runner/cucumber-hooks.ts` — handler vòng đời do `wdio-service` (TICKET-017) đăng ký:
  - Lúc mở phiên (worker `before`): tiêm sink vào Locator Resolver qua `registerScreenSink(name => evidenceCollector.setCurrentScreen(name))` — Test Runner → Locator một chiều (ADR-014). Locator không import Test Runner. `onSessionStart` chỉ làm việc này, **không** kiểm biến môi trường (guard nằm ở hook trước-phiên, xem `wdio-service.ts` dưới).
  - `beforeScenario` — nếu cờ dừng cấp lượt chạy (do `run-session` giữ, TICKET-019) đã bật thì bỏ qua test case, không sinh bản ghi (BR-012). Ngược lại gọi `probeDuringRun` (ADR-010); probe trả `unavailable` thì bật cờ dừng với `stop_reason = device_unavailable`, bỏ qua test case, không sinh bản ghi (BR-018). Probe `ready` thì khởi tạo nhật ký cho test case và cho chạy.
  - `beforeStep`/`afterStep` — đo thời lượng bước, gọi `onStepEnd` với `order`, `text`, `result`, `duration`, `error?`.
  - `afterScenario` — gọi `onScenarioEnd` để chốt và đẩy bản ghi; cập nhật trạng thái tổng hợp ở `run-session`. Test case `failed` không bật cờ dừng (BR-002).
- `src/runner/wdio-service.ts` — `AimtapService` kiểm hiện diện `AIMTAP_*` ở `onPrepare()` (hook launcher, chạy **trước mọi phiên**), không ở `before` (WDIO `before(caps, specs, browser)` chạy **sau** khi phiên đã tạo nên guard ở đó vô tác dụng — SA review 2026-08-02). Gọi `assertCapabilityEnv` với bộ khóa bắt buộc theo `CapabilityKind`; thiếu/rỗng → `PlatformFailure` liệt kê khóa thiếu, dừng sớm (ADR-009), không thành test case hỏng (ADR-016). Đây là **lưới an toàn** cho đường `npx wdio run config/...`; **nhà chính** là pha tiền điều kiện CLI (US-4.3) — assert trước khi khởi chạy testrunner (`sequence-diagrams.md` §1). Config sim/device đăng ký `AimtapService` kèm `capabilityKind`. *Populate* `AIMTAP_*` do CLI ráp từ `AppConfig` + `DeviceContext` đã validate (FR-DEV-02) + secret ký mã (US-1.2) — `DeviceContext` một mình không đủ.
- Cơ chế bỏ qua động của Cucumber (bỏ qua scenario khi cờ dừng bật) hiện thực bằng cách drop sự kiện bước/scenario của test case bị bỏ qua nên không sinh bản ghi; whether Cucumber chạy vật lý các bước rỗng là điểm kiểm chứng lúc implement, không chốt cứng (ADR-013).
- Nếu việc *populate* biến môi trường capability (US-4.3) buộc phải đổi cách CLI ↔ testrunner truyền biến giữa hai tiến trình thì dừng và đẩy về SA (chạm cách hai component giao tiếp), không tự quyết.
- Import Evidence Collector, Locator Resolver, Device qua `index.ts`; đọc/ghi cờ dừng và trạng thái tổng hợp qua `run-session`. Cập nhật `src/runner/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] Thiếu bất kỳ `AIMTAP_*` bắt buộc theo `CapabilityKind` → `AimtapService.onPrepare()` ném `PlatformFailure` liệt kê khóa thiếu (test đơn vị với env giả lập); không thành test case hỏng (ADR-016).
- [ ] `AimtapService.before()` **không** chạy guard (env thiếu vẫn không ném ở `before`) — guard ở `onPrepare`, trước-phiên; `onSessionStart` chỉ tiêm sink.
- [ ] Lúc mở phiên, sink được tiêm vào Locator Resolver; `screenName` do Locator báo qua sink được điền vào `screen` khi bước hỏng (ADR-011, ADR-014).
- [ ] `beforeScenario` gọi `probeDuringRun`; `unavailable` → bật cờ dừng `device_unavailable`, bỏ qua test case, không sinh bản ghi (test đơn vị với probe giả lập).
- [ ] Cờ dừng đã bật → `beforeScenario` bỏ qua các test case còn lại, không probe, không sinh bản ghi (BR-012).
- [ ] Test case `failed` không bật cờ dừng; test case kế tiếp vẫn chạy (BR-002).
- [ ] Mỗi bước Cucumber sinh đúng một `onStepEnd`; `afterScenario` gọi `onScenarioEnd` đúng một lần cho mỗi test case đã chạy; test case bị bỏ qua không sinh `onStepEnd`/`onScenarioEnd`.
- [ ] Không import chéo phá ranh giới module (Test Runner → Locator một chiều).

### TICKET-019: Trạng thái lượt chạy và cờ dừng
**Thiết kế liên quan:** component-design.md#Test-Runner (`run-session.ts`), sequence-diagrams.md#1, #3, erd.md#Entity:-Run, ADR-013, BR-002, BR-011, BR-012, BR-018, FR-RUN-01→06
**Phụ thuộc:** TICKET-007, TICKET-009

**Chỉ dẫn code**
- `src/runner/run-session.ts` — trạng thái và điều phối trong tiến trình worker; **không tự lặp qua test case** (framework lặp — ADR-013):
  - Sinh `run-id`; giữ trạng thái tổng hợp (đếm test case đã hoàn tất và số bị bỏ qua) và cờ dừng (`stop_reason`).
  - `saveRunStart` — chạy ở hook `before` (đầu phiên worker): ghi bối cảnh gồm `run-id`, thời điểm bắt đầu, `DeviceContext`, `scope_kind`/`scope_criteria`.
  - `finalizeRun` — chạy ở hook `after` (cuối phiên worker): chạy hết → `completion = completed`; cờ dừng đã bật → `completion = incomplete`, `not_run_count` = số scenario bị bỏ qua, ghi `stop_reason` (BR-012). `aggregate_result` (BR-011) do Result Store suy ra từ các hàng `test_case_result` đã ghi lúc `finalizeRun`, `run-session` không tự tính.
  - Phơi ra API cho hook (TICKET-018) đọc/ghi: kiểm tra cờ dừng, bật cờ dừng kèm `stop_reason` (reason đầu tiên thắng), báo test case đã chạy xong/bị bỏ qua.
  - Hủy bởi QC: bắt tín hiệu ngắt (SIGINT) trong worker, bật cờ dừng với `stop_reason = cancelled_by_qc`; gỡ listener ở `finalizeRun`; test case còn lại bị bỏ qua ở `beforeScenario` (ADR-013).
  - Tiêu chí chọn tập (US-12 BA: theo test feature/tên test case/nhãn) được dịch thành bộ lọc spec/tag/tên scenario của Cucumber lúc khởi động (do CLI `run`, US-4.3, truyền vào cấu hình testrunner); `run-session` chỉ ghi lại `scope_kind`/`scope_criteria` ở `saveRunStart`.
  - Phát sự kiện tiến trình (test case đang chạy kèm test feature, số đã hoàn tất, trạng thái từng test case khi kết thúc, bắt đầu/kết thúc lượt chạy) cho lớp hiển thị (US-4.3).
- Import Store, Device (kiểu `DeviceContext`) qua `index.ts`. Cập nhật `src/runner/index.ts`.

**Acceptance Criteria (cấp code)**
- [ ] `saveRunStart` ghi bối cảnh đầy đủ (gồm `scope_kind`/`scope_criteria`) khi gọi ở hook `before` (test đơn vị với store giả lập).
- [ ] `finalizeRun` ở hook `after`: chạy hết → `completed` + tổng thời lượng; cờ dừng bật → `incomplete` + `not_run_count` (số scenario bị bỏ qua) + `stop_reason`.
- [ ] Cờ dừng đặt được với `device_unavailable` (từ hook probe) và `cancelled_by_qc` (từ SIGINT); reason đầu tiên thắng; giữ kết quả các test case đã chạy.
- [ ] `run-session` không chứa vòng lặp qua test case.
- [ ] Phát đủ sự kiện tiến trình cho lớp hiển thị.

## Definition of Done (US)
Theo `conventions.md` §4.

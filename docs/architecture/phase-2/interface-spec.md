# Interface Spec — Phase 2

Chữ ký dưới đây là hợp đồng ở mức interface; kiểu chi tiết suy từ schema Zod tại chỗ hiện thực. Dữ liệu đến từ ngoài (đầu ra AI CLI) PHẢI qua Zod.

## Interface nội bộ: CodeAgent (AI Gateway) — transport
**Mục đích:** Điểm duy nhất gọi AI CLI, ở mức vận chuyển. Là nơi đặt điểm kiểm soát: hạn mức số lần gọi trên một lượt chạy và timeout mỗi lần; **không bao giờ ném** — trả `null` khi lỗi/timeout/vượt hạn/thiếu token (BR-208, NFR-204).
**Đầu vào / đầu ra:**
- `invoke(mode: 'heal' | 'generate', prompt: string): Promise<string | null>` — spawn `claude -p --output-format json` với quyền theo `mode` (heal read-only; generate ghi giới hạn), đưa `prompt` qua stdin, trả trường `result` (chuỗi) hoặc `null`.
- Điểm kiểm soát `withControlPoint(inner, limits)` bọc adapter; factory `createCodeAgent({ cli, limits })` chọn adapter theo CLI (giai đoạn này `claude-code`).
**Liên quan:** UC-201, UC-203. **Business rule:** BR-208, BR-219, NFR-202/204.

## Interface nội bộ: heal-invoker / Script Generator (dựng trên CodeAgent)
**Mục đích:** Tầng nghiệp vụ dựng prompt và parse kết quả, trên `CodeAgent.invoke`.
**Đầu vào / đầu ra:**
- `healLocator(agent: CodeAgent, ctx: { expectedLocator, screenName, pageSource }): Promise<Locator | null>` (US-7.2) — dựng prompt heal, gọi `invoke('heal', ...)`, parse `result` qua Zod (`{ strategy, selector }`) → dựng `Locator` (kiểu ở `shared`, ADR-027); sai định dạng/`null` → `null`. Không sửa file.
- `generateTestCase(agent: CodeAgent, ctx: { description, pageSource }): Promise<GenerateOutcome>` (US-8.1) — dựng prompt sinh (kèm danh sách step definition hiện có, BR-212), gọi `invoke('generate', ...)`, sinh file nháp + đánh dấu do AI sinh (FR-GEN-05).
**Liên quan:** UC-201, UC-203. **Business rule:** BR-201, BR-202, BR-211, BR-212.

## Bật/tắt AI theo app
Công tắc AI (BR-209) KHÔNG là phương thức của `CodeAgent`. Tầng lắp ráp lượt chạy (US-7.5) và lệnh generate (US-8.2) đọc `AppConfig.ai` (`enabled`, `healRetries`) rồi chỉ tiêm healer / gọi generate khi bật; AI tắt → không dựng `CodeAgent`, hành vi Phase 1.

## Interface nội bộ: Locator Resolver — tiêm healer
**Mục đích:** Cho phép tự phục hồi mà không để Locator Resolver phụ thuộc AI Gateway (tránh chu trình; cùng pattern sink ADR-014).
**Đầu vào / đầu ra:**
- `registerHealer(healFn: HealFn, retries?): void` — tầng lắp ráp tiêm lúc mở phiên; `retries` từ `AppConfig.ai.healRetries`.
- `HealFn = (ctx: { expectedLocator, screenName, pageSource }) => Promise<Locator | null>`.
- `registerHealSink(sink: (signal: HealSignal) => void): void` — tiêm lối đẩy sang Evidence (cùng pattern sink ADR-014, để Locator Resolver KHÔNG phụ thuộc Evidence).
- `HealSignal = { screen, expectedLocator, usedLocator, occurredAt }` — chỉ các trường Resolver biết. `find(locator, screenName)` giữ chữ ký ổn định (ADR-004) nên Resolver KHÔNG biết `stepOrder`, `testCaseResultId`, `screenshotPath`; ba trường đó do Evidence enrich. `HealSignal` là tập con của `HealEvent` (Result Store).
- Khi `find` thất bại và có healer + AI bật: lặp gọi `healFn` tối đa N lần (mặc định 3, BR-202), thử live mỗi kết quả; thành công → đẩy `HealSignal` qua heal sink và trả phần tử; hết lượt → hỏng như Phase 1.
**Liên quan:** UC-201. **Business rule:** BR-201, BR-202, BR-208.

## Interface nội bộ: Evidence Collector — ghi nhận tự phục hồi
**Mục đích:** Nhận một lần tự phục hồi, chụp ảnh phần tử đã thao tác, ghi vào bản ghi lượt chạy.
**Đầu vào / đầu ra:** `onHeal(signal: HealSignal): void` — nhận payload Resolver đẩy (tập con), buffer nó và kích hoạt chụp ảnh phần tử (ngoài đường chờ của bước, NFR-10).
Evidence enrich `HealSignal` thành `HealEvent`: gán `stepOrder` tại `onStepEnd(N)` (heal xảy ra giữa bước, trước `onStepEnd`, nên số bước chỉ biết khi bước kết thúc); điền `testCaseResultId` và `screenshotPath` (sau khi chụp) tại `onScenarioEnd`, rồi `saveHealEvents` cùng giao dịch với `saveTestCaseResult`.
`HealEvent = { testCaseResultId, stepOrder, screen, expectedLocator, usedLocator, screenshotPath?, occurredAt }` — khớp bảng `heal_event` (`erd.md`).
**Liên quan:** UC-201. **Business rule:** BR-205, BR-206.

## Interface nội bộ: Result Store — heal_event
**Mục đích:** Lưu và đọc các lần tự phục hồi; append-only.
**Đầu vào / đầu ra:**
- `saveHealEvents(events: HealEvent[]): void` — ghi cùng giao dịch với `saveTestCaseResult` của test case tương ứng.
- `getRunModel(runId)` mở rộng: trả kèm `heal_event` của lượt chạy để Reporter dựng nhãn và mục hiển thị.
**Liên quan:** BR-205, BR-207.

## Tích hợp ngoài: AI CLI (Claude Code) qua subprocess
**Mục đích:** Lấy locator thay thế (heal) hoặc sinh test case, bằng cách gọi CLI thật (ADR-025), auth bằng token thuê bao trong env (ADR-026).
**Request gửi đi:** spawn `claude -p --output-format json` với `--permission-mode`/`--allowedTools` theo chế độ:
- *Heal (read-only):* quyền chỉ đọc; prompt (qua stdin) gồm page source + locator đã hỏng + tên màn hình, yêu cầu **chỉ trả về một locator** theo định dạng cố định.
- *Generate:* quyền ghi giới hạn; prompt gồm mô tả + page source + danh sách step definition hiện có, yêu cầu sinh file nháp.
Môi trường tiến trình con mang token CLI (ADR-026).
**Response nhận về:** một JSON object trên stdout; nền tảng lấy trường `result`, rồi:
- *Heal:* Zod parse `result` thành `{ strategy, selector }` → dựng `Locator`; sai định dạng → coi như không suy được (không áp dụng).
- *Generate:* xác nhận file nháp đã tạo; đọc trường token/usage nếu cần.
Lỗi/timeout/CLI vắng → trả "không khả dụng"; heal → bước hỏng như Phase 1 (BR-208), không dừng lượt chạy.
**Business rule:** BR-201, BR-208, BR-211, BR-219, BR-220.

## Tích hợp ngoài: bước cài đặt và kiểm tra môi trường AI
**Mục đích:** Chuẩn bị và xác nhận AI CLI + token trên máy.
- `setup`: chọn CLI → `command -v <cli>` kiểm có sẵn → nếu chưa, cài/hướng dẫn → hướng dẫn `claude setup-token` một lần → lưu token vào env git-ignored.
- `doctor` (mở rộng): kiểm CLI có mặt + token hợp lệ; báo thiếu; tính năng AI tắt khi thiếu, chạy test không AI vẫn chạy.
**Business rule:** BR-220, BR-221.

## Hợp đồng dữ liệu: heal_event
**Các trường bắt buộc** (khớp `erd.md`): `id`, `test_case_result_id`, `step_order`, `screen`, `expected_locator`, `used_locator`, `occurred_at`; `screenshot_path` cho phép rỗng khi chụp lỗi (bằng chứng phụ trợ, không đổi kết quả — nguyên tắc Phase 1). Là bảng con của `test_case_result` (như `step_log`), không mang `app_id`/`run_id` — truy vấn theo lượt chạy bằng join. Bất biến sau khi ghi (BR-207).

## Hợp đồng dữ liệu: test_case_result.status
Chỉ nhận `passed` | `failed` (bỏ `passed_healed`, ADR-024). Nhãn "đạt kèm tự phục hồi" tính ở Reporter = `passed` AND có ≥1 `heal_event`.

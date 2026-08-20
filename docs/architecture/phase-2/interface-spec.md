# Interface Spec — Phase 2

Chữ ký dưới đây là hợp đồng ở mức interface; kiểu chi tiết suy từ schema Zod tại chỗ hiện thực. Dữ liệu đến từ ngoài (đầu ra AI CLI) PHẢI qua Zod.

## Interface nội bộ: CodeAgent (AI Gateway)
**Mục đích:** Điểm duy nhất gọi AI CLI; đặt công tắc bật/tắt theo app, hạn mức số lần gọi/lượt chạy, timeout; hai chế độ gọi.
**Đầu vào / đầu ra:**
- `healLocator(ctx: { expectedLocator, screenName, pageSource }): Promise<Locator | null>` — chế độ read-only; trả một `Locator` đã kiểm bằng Zod, hoặc `null` khi AI tắt/lỗi/không suy được. Không sửa file.
- `generateTestCase(ctx: { description, pageSource }): Promise<GenerateOutcome>` — sinh file nháp; trả kết quả (đường dẫn file nháp / lỗi).
- `isEnabled(appId): boolean` — công tắc AI theo app (BR-209).
**Liên quan:** UC-201, UC-203. **Business rule:** BR-201, BR-202, BR-219.

## Interface nội bộ: Locator Resolver — tiêm healer
**Mục đích:** Cho phép tự phục hồi mà không để Locator Resolver phụ thuộc AI Gateway (tránh chu trình; cùng pattern sink ADR-014).
**Đầu vào / đầu ra:**
- `registerHealer(healFn: HealFn): void` — tầng lắp ráp tiêm lúc mở phiên.
- `HealFn = (ctx: { expectedLocator, screenName, pageSource }) => Promise<Locator | null>`.
- Khi `find` thất bại và có healer + AI bật: lặp gọi `healFn` tối đa N lần (mặc định 3, BR-202), thử live mỗi kết quả; thành công → đẩy `HealRecord` sang Evidence và trả phần tử; hết lượt → hỏng như Phase 1.
**Liên quan:** UC-201. **Business rule:** BR-201, BR-202, BR-208.

## Interface nội bộ: Evidence Collector — ghi nhận tự phục hồi
**Mục đích:** Nhận một lần tự phục hồi, chụp ảnh phần tử đã thao tác, ghi vào bản ghi lượt chạy.
**Đầu vào / đầu ra:** `onHeal(record: HealRecord): void` — kích hoạt chụp ảnh (ngoài đường chờ của bước, NFR-10) và giữ để ghi `heal_event` theo giao dịch ở cuối test case.
`HealRecord = { testCaseResultId?, stepOrder, screen, expectedLocator, usedLocator, occurredAt }` (đường dẫn ảnh gắn sau khi chụp).
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

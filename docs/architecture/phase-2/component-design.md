# Component Design — Phase 2 (hướng B: gọi AI CLI ngoài)

Phase 2 bổ sung AI bằng cách nền tảng chủ động gọi một AI CLI bên ngoài (Claude Code) qua subprocess (ADR-025), xác thực bằng token thuê bao trong env (ADR-026). Nền tảng chạm AI đúng hai chỗ: tự phục hồi locator lúc chạy, và sinh test case do QC chủ động. Không tích hợp git/PR trong `src/` — con người làm git/PR sau review.

Các module Phase 1 giữ nguyên trách nhiệm; dưới đây chỉ mô tả module mới và phần Phase 2 thêm vào module cũ.

---

## AI Gateway (`src/ai/`) — mới
**Trách nhiệm:** Điểm duy nhất nền tảng gọi AI. Đóng gói việc gọi một AI CLI ngoài qua subprocess, là nơi đặt công tắc bật/tắt AI theo app, giới hạn số lần gọi trên một lượt chạy, timeout mỗi lần gọi, và là nơi duy nhất page source rời máy.
**Cấu trúc bên trong:**
- `code-agent.ts` — port `CodeAgent` (hợp đồng "gọi AI CLI") + factory chọn adapter theo CLI cấu hình. Điểm kiểm soát (on/off, hạn mức, timeout).
- `adapters/claude-code.ts` — adapter subprocess: dựng lệnh `claude -p --output-format json` với `--allowedTools`/`--permission-mode` theo chế độ gọi, đưa prompt qua stdin, đọc stdout, tách trường `result`.
- `prompts/` — nội dung prompt (heal, generate) tách khỏi mã gọi.
- `heal-invoker.ts` — chế độ read-only: dựng prompt heal, gọi `CodeAgent`, parse `result` qua Zod thành một `Locator`. Không cho CLI sửa file.
- `generate-invoker.ts` (Script Generator) — chế độ sinh: gọi CLI sinh file nháp test case, gửi kèm danh sách step definition hiện có và ưu tiên tái dùng trước khi sinh step mới (ADR-007, BR-212); gắn nhãn "do AI sinh" vào test case sinh ra (ví dụ tag `@ai-generated` trên scenario) để phân biệt khi rà soát (FR-GEN-05, BR-216).
**Phụ thuộc:** Config & Secrets (công tắc AI theo app, token, CLI đã chọn), Shared, và kiểu/lược đồ `Locator` của module Locator (để parse đầu ra heal). Không phụ thuộc Locator Resolver, Test Runner (một chiều).
**Requirement liên quan:** FR-HEAL-01, FR-GEN-01, FR-GEN-05, FR-AI-01, BR-201, BR-202, BR-216, BR-219.

## Locator Resolver (`src/locator/`) — thêm phần tự phục hồi
**Trách nhiệm (thêm):** Khi tìm phần tử theo locator dự kiến thất bại và AI bật, kích hoạt tự phục hồi để bước tiếp tục (điểm chèn ADR-004).
**Cấu trúc bên trong:**
- Nhận một **healer tiêm vào** qua `registerHealer(healFn)` lúc mở phiên — cùng pattern sink của ADR-014, nên Locator Resolver KHÔNG import AI Gateway (tránh chu trình). `healFn(failedLocator, screenName, pageSource) → Promise<Locator | null>`.
- Vòng thử: gọi `healFn`, thử live locator trả về trong bộ nhớ; lặp tối đa số lần cấu hình (mặc định 3); dùng lại locator đã phục hồi cho chính locator đó trong cùng lượt chạy; đẩy một bản ghi lần tự phục hồi sang Evidence Collector khi áp dụng thành công.
**Phụ thuộc:** Shared, phiên WebdriverIO toàn cục (ADR-014). Healer tiêm từ tầng lắp ráp.
**Requirement liên quan:** FR-HEAL-01, FR-HEAL-02, FR-HEAL-06, BR-201, BR-202, BR-208.

## Result Store (`src/store/`) — thêm thực thể heal_event
**Trách nhiệm (thêm):** Lưu từng lần tự phục hồi; đổi trục trạng thái test case sang kết luận hai giá trị (ADR-024).
**Cấu trúc bên trong:**
- Migration mới (đánh số kế tiếp, không sửa migration đã phát hành) tạo bảng `heal_event`; `test_case_result.status` chỉ còn `passed`/`failed`.
- `heal-repository.ts` (hoặc mở rộng `run-repository.ts`) — ghi/đọc `heal_event`, append-only bất biến.
**Phụ thuộc:** better-sqlite3, Shared.
**Requirement liên quan:** FR-HEAL-02, FR-HEAL-04, BR-204, BR-205, BR-207.

## Evidence Collector (`src/evidence/`) — thêm ghi nhận tự phục hồi
**Trách nhiệm (thêm):** Nhận sự kiện một lần tự phục hồi từ Locator Resolver, chụp ảnh phần tử đã thao tác (BR-206), và ghi `heal_event` cùng bản ghi test case theo giao dịch của lượt chạy.
**Cấu trúc bên trong:** mở rộng bộ thu sự kiện hiện có với một lối vào `onHeal(healSignal)`; buffer signal Resolver đẩy (tập con), enrich `stepOrder` tại `onStepEnd` và `testCaseResultId`/`screenshotPath` tại `onScenarioEnd` thành `heal_event`; ảnh phần tử ghi ra tệp, `heal_event` giữ đường dẫn.
**Phụ thuộc:** Result Store, Shared.
**Requirement liên quan:** FR-HEAL-02, FR-HEAL-04, FR-HEAL-05, BR-205, BR-206.

## Reporter (`src/reporter/`) — thêm hiển thị tự phục hồi
**Trách nhiệm (thêm):** Trong file HTML, hiện mỗi lần tự phục hồi (locator cũ→mới, ảnh, màn hình, bước) và gắn nhãn dẫn xuất "đạt kèm tự phục hồi" khi test đạt và có ≥1 `heal_event`.
**Cấu trúc bên trong:** mô hình báo cáo join `heal_event`; phần đếm bỏ giá trị `passed_healed`, tính nhãn từ sự tồn tại heal.
**Phụ thuộc:** Result Store, Shared.
**Requirement liên quan:** FR-HEAL-05, BR-206, BR-204.

## CLI Entry (`src/cli/`) — thêm lệnh setup / generate và mở rộng doctor
**Trách nhiệm (thêm):** cài đặt môi trường AI; sinh test case; kiểm tra AI CLI ở doctor.
**Cấu trúc bên trong:**
- `commands/setup.ts` — chọn CLI → kiểm/cài CLI → hướng dẫn lấy token một lần → lưu token vào env git-ignored (ADR-026).
- `commands/doctor.ts` (mở rộng) — thêm kiểm AI CLI có mặt + token hợp lệ; thiếu thì báo, tính năng AI không chạy, chạy test không AI vẫn hoạt động.
- `commands/generate.ts` — nhận mô tả + page source, gọi AI Gateway sinh file nháp; QC chạy thử + xác nhận + tự mở PR (ngoài nền tảng).
**Phụ thuộc:** AI Gateway, Config & Secrets, Device (doctor host tools), Shared.
**Requirement liên quan:** FR-ENV-01, FR-ENV-02, FR-GEN-01, UC-203, UC-205, BR-220, BR-221.

## Config & Secrets (`src/config/`) — thêm công tắc AI và token
**Trách nhiệm (thêm):** cấp công tắc bật/tắt AI + số lần thử tự phục hồi theo app; nạp token AI CLI từ env git-ignored, che ở tầng log.
**Cấu trúc bên trong:** mở rộng schema `app.config.ts` (trường `ai: { enabled, healRetries }`); `secrets.ts` đọc token CLI (thay đường khóa API của Phase 1 cho mục đích AI).
**Phụ thuộc:** Shared.
**Requirement liên quan:** FR-AI-01, BR-209, BR-220.

---

## Ghi chú lắp ráp (tránh chu trình)
Healer được tầng lắp ráp lượt chạy (`run-assembly`, ADR-018) dựng từ AI Gateway và tiêm vào Locator Resolver qua `registerHealer` lúc mở phiên — cùng cơ chế `registerScreenSink` của ADR-014. Nhờ đó quan hệ một chiều: lắp ráp → (AI Gateway, Locator Resolver); Locator Resolver chỉ phụ thuộc Shared; AI Gateway phụ thuộc Config/Shared/kiểu Locator. Không cạnh Locator → AI, không chu trình.

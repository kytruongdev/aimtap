# Sequence Diagrams — Phase 2

## 1. Tự phục hồi một locator hỏng lúc chạy (UC-201)
```mermaid
sequenceDiagram
participant PO as Page Object
participant Resolver as Locator Resolver
participant WDIO as Phiên WebdriverIO
participant Heal as healFn (tiêm từ AI Gateway)
participant CLI as AI CLI (claude -p, subprocess)
participant Ev as Evidence Collector

PO->>Resolver: find(locator dự kiến)
Resolver->>WDIO: tìm phần tử
WDIO-->>Resolver: không tìm thấy
alt AI bật cho app và có healer
  loop tối đa N lần (mặc định 3)
    Resolver->>WDIO: lấy page source hiện tại
    Resolver->>Heal: heal(locator hỏng, tên màn hình, page source)
    Heal->>CLI: spawn claude -p --output-format json (read-only)
    CLI-->>Heal: JSON {result: locator}
    Heal-->>Resolver: Locator (Zod-parsed) | null
    Resolver->>WDIO: thử live locator thay thế
    alt tìm thấy
      Resolver->>Ev: onHeal(HealSignal: màn hình, locator cũ→mới, thời điểm)
      Resolver-->>PO: phần tử — bước tiếp tục
    end
  end
else AI tắt / hết lượt / lỗi
  Resolver-->>PO: hỏng như Phase 1 (chụp ảnh bước hỏng)
end
```
**Điểm thất bại & xử lý:**
- CLI vắng/token hỏng/timeout/JSON sai định dạng → `healFn` trả `null` → coi như không suy được; hết lượt thì bước hỏng như Phase 1 (BR-208). Lỗi gọi AI KHÔNG dừng lượt chạy, KHÔNG tự đổi kết quả test case (NFR-204).
- Locator thay thế định vị **nhầm** phần tử → test có thể đạt giả; chặn bằng ghi `heal_event` + ảnh vào báo cáo để người rà soát (BR-206). Locator chỉ vào nhánh chính khi **con người** tự áp và mở PR sau review (BR-203; nền tảng không tạo PR).
- Locator đã phục hồi trong lượt chạy được dùng lại cho chính locator đó, không gọi lại AI (BR-202).
- Resolver đẩy `HealSignal` (tập con: màn hình, locator cũ→mới, thời điểm) — `find` giữ chữ ký ổn định (ADR-004) nên Resolver không biết số bước. Evidence enrich thành `heal_event`: `stepOrder` gán tại `onStepEnd`, `testCaseResultId` và `screenshotPath` điền tại `onScenarioEnd`.

## 2. Sinh test case với hỗ trợ AI (UC-203)
```mermaid
sequenceDiagram
participant QC
participant CLIcmd as CLI (generate)
participant AI as AI Gateway
participant CLI as AI CLI (claude -p, subprocess)
participant Dev as Thiết bị / lượt chạy thử

QC->>CLIcmd: generate(mô tả + page source)
CLIcmd->>AI: generateTestCase(mô tả, page source)
AI->>CLI: spawn claude -p (sinh file nháp: .feature + step + Page Object)
CLI-->>AI: JSON {result} + file nháp đã tạo
AI-->>QC: đường dẫn file nháp
QC->>Dev: chạy thử test case nháp
Dev-->>QC: nhật ký thực thi
alt nhật ký khớp mô tả và đạt
  QC->>QC: xác nhận → tự mở pull request (đánh dấu do AI sinh)
else không khớp / không đạt
  QC->>CLIcmd: chỉnh mô tả, sinh lại
end
```
**Điểm thất bại & xử lý:**
- AI tắt cho app → không sinh qua AI; QC soạn tay như Phase 1 (BR-218).
- CLI lỗi/không phản hồi → không sinh lần này; QC thử lại hoặc soạn tay.
- Test case nháp có thể sai/thừa (BR-213) → bắt buộc QC chạy thử + xác nhận qua mô tả hành vi (BR-214) và chạy xanh trước khi mở PR (BR-215). Mở PR + git do **con người** làm sau review.

## 3. Cài đặt và kiểm tra môi trường AI (UC-205)
```mermaid
sequenceDiagram
participant QC as QC automation
participant Setup as CLI (setup)
participant Sys as Máy (shell)
participant Doctor as CLI (doctor)

QC->>Setup: make setup
Setup->>Sys: command -v <ai-cli>
alt CLI chưa có
  Setup->>Sys: cài / hướng dẫn cài AI CLI
end
Setup->>QC: hướng dẫn chạy `claude setup-token` (một lần)
QC->>Setup: dán token
Setup->>Sys: lưu token vào file env git-ignored
QC->>Doctor: make doctor
Doctor->>Sys: kiểm CLI có mặt + token hợp lệ
Doctor-->>QC: đủ điều kiện AI / thiếu gì
```
**Điểm thất bại & xử lý:**
- Thiếu CLI hoặc token → `doctor` báo rõ; tính năng AI không chạy, phần chạy test không dùng AI vẫn hoạt động (BR-221).
- Token là bí mật trong env git-ignored, che ở tầng log (ADR-026); không lên Git, không vào log/kết quả/báo cáo.

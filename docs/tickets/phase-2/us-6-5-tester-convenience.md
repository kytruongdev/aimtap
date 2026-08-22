# US-6.5: Lệnh tiện dụng cho tester — dựng app mới + wrap generate

**Epic:** EPIC-6 — Nền AI: gọi CLI & môi trường
**Business US (BA):** — (cải tiến trải nghiệm vận hành; phục vụ `docs/onboarding-a-new-app.md`)
**Độ ưu tiên:** Medium
**Phụ thuộc:** US-8.2 (lệnh generate đã có)

## Mục tiêu
Tester dựng một app mới bằng **một lệnh** (không tự tạo từng file, tránh thiếu/sai), và chạy `generate` qua một target Makefile gọn (chỉ cần file mô tả — AI tự lấy locator, ADR-028). Giảm ma sát nêu trong `docs/onboarding-a-new-app.md`.

## Tickets

### TICKET-047: Lệnh `new-app` — scaffold `apps/<app-id>/`
**Thiết kế liên quan:** north-star.md#2.1 (cấu trúc `apps/<app-id>/`), coding-convention.md#Tổ-chức-thư-mục, registry `app-config.schema.ts` (hình dạng `app.config.ts`), ADR-017 (commander)
**Phụ thuộc:** —

**Chỉ dẫn code**
- `src/cli/commands/new-app.ts`:
  - `runNewApp(appId: string, deps): number` — logic thuần trả mã thoát; deps tiêm (`exists`, `mkdir`, `writeFile`, `out`) để test được.
    1. Kiểm `appId` hợp lệ (slug an toàn, ví dụ `^[a-z0-9][a-z0-9-]*$` — làm tên thư mục + `appId`); sai → in hướng dẫn, `return 1`.
    2. `apps/<appId>/` đã tồn tại → **không ghi đè**, in thông báo, `return 1`.
    3. Tạo cây thư mục: `apps/<appId>/{build,features,steps,screens,fixtures}`.
    4. Ghi các file từ template (mô phỏng mẫu `apps/my-demo-app`, giá trị cụ thể thay bằng chỗ trống đánh dấu `// TODO`):
       - `app.config.ts` — `appId: '<appId>'` điền sẵn; `buildPath`/`deviceType`/`deviceId`/`osVersion` là placeholder; **kèm khối `ai: { enabled: false, healRetries: 3 }`** để tester thấy công tắc AI (BR-209/BR-202).
       - `test-data.example.json` — `{ "secrets": {}, "env": {} }`.
       - `test-data.local.json` — bản sao của example (git-ignored; tester điền).
       - `build/.gitkeep` — nội dung là chú thích nhiều dòng (tiếng Anh) về bản chất artifact build, KHÔNG chỉ "đặt .app vào đây":
         ```
         # Place the app build here (git-ignored, per-machine binary handed over by the dev team).
         # - .app is a directory (an application bundle), not a single file; drop the whole folder in.
         # - .ipa is a zip of Payload/<Name>.app: unzip it here (unzip <file> -d .) to get Payload/<Name>.app.
         # - Point app.config.ts.buildPath at the .app directory, e.g. build/Payload/My App.app.
         ```
       - Một file **mẫu chạy-được, đủ pattern** mỗi thư mục (KHÔNG rỗng), import từ mặt tiền nền tảng (`src/index.ts`) như `apps/my-demo-app`, mỗi file mở đầu bằng comment `// Example — replace with your own test.`:
         - `screens/Example.screen.ts`: hằng `const SCREEN = 'ExampleScreen'`; một locator mẫu `byAccessibilityId('example-id')`; một method nghiệp vụ dùng `find(locator, SCREEN)`; một method truy vấn trả giá trị (minh họa tách query khỏi assertion); **không** assertion trong file.
         - `features/example.feature`: một `Feature` + một `Scenario` gắn tag `@example`, ba câu `Given/When/Then` mức nghiệp vụ, **không** locator; bước mở đầu thể hiện reset trạng thái.
         - `steps/example.steps.ts`: import `Given/When/Then` + `assertExpectation`; ánh xạ ba câu của `example.feature` tới method của `Example.screen.ts`; câu `Then` khẳng định qua `assertExpectation` (đọc giá trị → so sánh → `throw new Error(...)`).
         - `fixtures/example.ts`: một hàm đọc dữ liệu theo tên qua `loadTestData('<appId>')`, không viết cứng giá trị.
    5. In các bước kế tiếp cho tester: (a) thả build vào `build/` — `.app` thả thẳng, `.ipa` giải nén lấy `Payload/<Name>.app`; (b) điền `app.config.ts` (`buildPath` trỏ vào `.app`; `deviceId`/`osVersion` từ `xcrun simctl list devices booted`); (c) điền `test-data.local.json`; (d) bật AI nếu cần; (e) viết mô tả hành vi rồi chạy `generate` (AI tự lái app lấy locator, ADR-028 — trỏ `docs/onboarding-a-new-app.md`).
  - `newAppCommand(): Command` — commander `new-app <app-id>` (ADR-017), `exitOverride()`; đăng ký ở `program.ts`.
- `Makefile`: target `new-app` (guard `APP=` như `run`): `npx tsx src/cli/index.ts new-app $(APP)`; thêm vào `.PHONY`.
- `src/` KHÔNG import `apps/`; đây là ghi file lúc chạy theo đường dẫn chuỗi (coding-convention.md §Ranh-giới), không phải import.

**Acceptance Criteria (cấp code)**
- [ ] `new-app <app-id>` tạo đủ cây thư mục + các file config + skeleton, `appId` điền đúng, có khối `ai` (test đơn vị với fs giả lập, kiểm tập file sinh ra).
- [ ] File mẫu đủ pattern, không rỗng: `Example.screen.ts` có `SCREEN` + locator + method dùng `find` + method truy vấn, không assertion; `example.steps.ts` khẳng định qua `assertExpectation`; `example.feature` không chứa locator (test đơn vị kiểm nội dung sinh ra: có `assertExpectation`, có `SCREEN`, `.feature` không chứa chuỗi locator).
- [ ] `build/.gitkeep` chứa chú thích nêu `.app` là thư mục, `.ipa` giải nén ra `Payload/*.app`, và `buildPath` trỏ vào `.app` (test đơn vị kiểm chuỗi chú thích).
- [ ] `apps/<app-id>/` đã tồn tại → không ghi đè, `return 1` (test đơn vị).
- [ ] `app-id` không hợp lệ (rỗng/ký tự lạ) → `return 1` với hướng dẫn (test đơn vị).
- [ ] `make new-app APP=<id>` chạy lệnh; guard báo rõ khi thiếu `APP=`.

### TICKET-048: `make generate` — wrap lệnh generate bằng file mô tả
**Thiết kế liên quan:** Makefile (lệnh vận hành, CLAUDE.md §6), US-8.2 (`generate --description-file`), ADR-028
**Phụ thuộc:** TICKET-043

**Chỉ dẫn code**
- `Makefile`: target `generate` bọc lệnh CLI; **chỉ mô tả** là đầu vào, để dạng **file** (hợp với make vars, và tránh nhét đoạn text dài vào dòng lệnh). Không còn `PAGE` — AI tự lấy locator qua Appium MCP (ADR-028):
  ```
  generate:
      @test -n "$(APP)"  || { echo "Usage: make generate APP=<app-id> DESC=<desc-file>"; exit 1; }
      @test -n "$(DESC)" || { echo "Missing DESC=<behaviour description file>"; exit 1; }
      npx tsx src/cli/index.ts generate $(APP) --description-file $(DESC)
  ```
- Thêm `generate` vào `.PHONY`. Không đổi code CLI (`generate` nhận `--description-file`, US-8.2).

**Acceptance Criteria (cấp code)**
- [ ] `make generate APP= DESC=` gọi đúng `generate <app> --description-file <DESC>` (không truyền page source).
- [ ] Thiếu `APP`/`DESC` → in usage rõ, thoát khác 0.

## Definition of Done (US)
Theo `conventions.md` §4. Cập nhật `docs/onboarding-a-new-app.md` (Phần 2, bước 2.2/2.6) theo lệnh mới (chỉ DESC).

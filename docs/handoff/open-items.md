# Open Items — bàn giao giữa các vai trò

Mỗi mục ghi rõ vai trò cần xử lý, bối cảnh, và tài liệu liên quan. Vai trò nào cũng đọc file này ở bước khởi động.

Từ vựng trung tâm (test suite, test feature, test case, bước) định nghĩa ở `docs/business/brd.md` §1.1.

---

## Đang mở

### CẦN SA ĐỒNG BỘ (không chặn): từ vựng interface-spec §CodeAgent lệch bản hiện thực US-6.2 — *đã xử lý (SA, 2026-08-21)*
Phát hiện lúc review US-6.2 (`2a78ee0`/`ac260c9`). `interface-spec.md` §CodeAgent (dòng 5–11) mô tả port bằng ba hàm cấp cao `healLocator(ctx)`/`generateTestCase(ctx)`/`isEnabled(appId)`. Bản hiện thực (theo TICKET-030, TL chốt) là port **cấp thấp** `CodeAgent.invoke(mode: 'heal'|'generate', prompt): Promise<string|null>`; nội dung heal/generate (dựng prompt, parse ra `Locator`/file nháp) là **tầng trên** ở US-7.2/US-8.1, và `isEnabled` thành cổng gác tại điểm kiểm soát trên giá trị công tắc được truyền vào (ticket §25). Code trung thành ticket — KHÔNG vi phạm khuôn khổ; đây là doc-drift của artifact SA. SA cân nhắc hòa hợp interface-spec §CodeAgent khi US-7.2/US-8.1 land (phân định rõ port cấp thấp `invoke` vs các hàm heal/generate cấp cao). Không chặn merge US-6.2.

**Đã đồng bộ (SA, 2026-08-21):** `interface-spec.md` §CodeAgent viết lại theo phân tầng đã hiện thực: (1) **CodeAgent (transport)** = `invoke(mode, prompt): Promise<string|null>` + `withControlPoint`/`createCodeAgent`, không bao giờ ném; (2) **heal-invoker / Script Generator** = `healLocator`/`generateTestCase` dựng trên `invoke` (US-7.2/US-8.1), parse Zod → `Locator` (kiểu ở `shared`, ADR-027); (3) **Bật/tắt AI theo app** không là method của CodeAgent — tầng lắp ráp US-7.5 / lệnh generate US-8.2 đọc `AppConfig.ai` rồi mới tiêm/gọi. Khớp bản US-6.2 đã merge; là hợp đồng cho US-7.2/US-8.1.

### CẦN BA LÀM: re-scope Phase 2 sang hướng B (AI CLI ngoài) — *đã xử lý (BA, 2026-08-20)*
Bối cảnh: Product team chọn **phương án B** — QC automation điều khiển một **AI CLI bên ngoài** (ví dụ Claude Code); nền tảng mỏng, KHÔNG nhúng AI. Phân tích lý do: `docs/business/ai-integration-analysis.md`.

- **Bộ tài liệu hướng A đã được BẢO TOÀN** nguyên vẹn ở `docs/business/ai-embedded-approach/` (kèm `README.md` nêu trạng thái "giữ cho tương lai"). Product team xác nhận có giá trị, dùng về sau — KHÔNG sửa/ghi đè.
- **BA đã làm (2026-08-19):** đặc tả Phase 2 hướng B (B-chủ-động) viết xong + tự rà + verify tại `docs/business/phase-2/` (4 file: srs, use-cases, user-stories, business-rules). Nền tảng tự trigger AI CLI; tự phục hồi lúc chạy GIỮ (persist qua PR); bỏ đa nhà cung cấp/giao diện/khóa → token CLI + `make setup`/`doctor`; "đạt kèm tự phục hồi" = nhãn dẫn xuất (khớp ADR-024). Truy vết đủ, không dư âm A. Hai câu hỏi mở trước đây đã được posture B-chủ-động trả lời.
- **BA đã cập nhật tài liệu nền (2026-08-19 → 2026-08-20):** `brd.md` (BO-07/NFR-08 → năng suất; §7 phạm vi bỏ đa nhà cung cấp+giao diện, thêm AI-qua-CLI + cài đặt; NFR-04 khóa→token; BC-12 ràng buộc CLI+token; §3.1 người dùng = QC automation biết code), `epic-map.md` (EP-26 khóa→token; EP-28/29 sang hướng CLI; EP-30→FUTURE), `phase-proposal.md` Phase 2, `change-log.md`. Đã gỡ luôn dư âm hướng A (auto-PR) khỏi tài liệu nền — xem mục "bỏ nền tảng tự tạo PR" đã xử lý bên dưới.

**Hệ quả cho SA:** cụm ADR-021→024 (xây cho hướng A) được đánh giá lại theo B — xem mục "Posture B-chủ-động" ngay dưới: ADR-021/022/023 thay bằng cách tiếp cận CLI, ADR-024 (mô hình heal + persist-qua-PR) phần lớn dùng lại. Hai mục cũ "CẦN PO DUYỆT ADR-021→024" và "CẦN BA hệ quả doc" đã gỡ (moot theo B).

### CẦN BA ĐỌC + SA GIỮ: Posture "B-chủ-động" — nền tảng tự trigger AI CLI (chốt kỹ thuật SA↔PO, 2026-08-19)
Đây là kết quả buổi bàn kỹ thuật giữa SA và PO, cụ thể hóa hướng B ở mục trên và **trả lời hai câu hỏi mở PO đang giữ**. Là input định hướng của PO cho spec B; phần ranh giới functional vẫn do BA ratify.

**BA đã đọc + ratify vào spec B (2026-08-19):** ranh giới functional đã đưa vào `docs/business/phase-2/` (giữ tự phục hồi lúc chạy; bỏ đa nhà cung cấp/giao diện/khóa → token CLI + cài đặt; nhãn "đạt kèm tự phục hồi"). **Spec B đã sẵn sàng cho SA** viết ADR mới + reconcile ADR-021→024.

**Posture chốt — "B-chủ-động":** trong hướng B, nền tảng KHÔNG thụ động chờ dev lái CLI. Nền tảng **tự trigger AI CLI (Claude Code) như một tiến trình con** (headless `claude -p` / Agent SDK) tại các điểm cần AI, rồi tự lo phần còn lại. Dung hòa: giữ cái rẻ của B (dùng lại Claude Code trên máy, không mua key Claude Platform) mà lấy lại cái tiện của A (tester không phải ngồi prompt tay từng lần).

**Bốn quyết định đã chốt với PO:**
- **A. Posture = B-chủ-động** (nền tảng tự trigger CLI). *(trả lời câu hỏi mở #1: nền tảng CHỦ ĐỘNG về AI, không thụ động.)*
- **B. Tự phục hồi locator: GIỮ cơ chế lúc chạy.** *(trả lời câu hỏi mở #2 — trước giả định "B không in-run"; SA xác minh in-run VẪN khả thi & rẻ qua CLI.)* Mô hình:
  - *Lúc chạy:* locator hỏng → gọi `claude -p` (chỉ đọc; cho page source + locator hỏng) → nhận **một chuỗi locator** → thử live trong bộ nhớ → chạy tiếp. Test **không dừng giữa chừng**. KHÔNG sửa file lúc chạy (tiến trình đang chạy không nhận thay đổi file).
  - *Sau lượt chạy:* locator đúng (cũ→mới) được ghi lại và **tạo PR** sửa Page Object; con người duyệt PR (BC-08). PO nhấn mạnh: **locator đúng phải được lưu lại qua PR**.
- **C. Auth = `CLAUDE_CODE_OAUTH_TOKEN`** (token dài hạn từ `claude setup-token`, tính theo subscription — rẻ), lưu trong file env gitignored. KHÔNG dùng `ANTHROPIC_API_KEY` (per-token, mất lợi thế chi phí).
- **D. Một CLI (Claude Code) giai đoạn này**, nhưng project structure **chuẩn bị sẵn + aware** để mở rộng CLI khác về sau: đoạn trigger đặt sau một seam nội bộ (kiểu `CodeAgent` port), thêm adapter CLI thứ hai chỉ khi cần.

**Hệ quả functional cho BA đưa vào spec B:**
- Tự phục hồi vẫn là **năng lực lúc chạy của nền tảng** (không chỉ lúc soạn) — sửa lại giả định "B không in-run" ở câu hỏi #2.
- Nền tảng **không giữ khóa AI, không quản đa nhà cung cấp, không có giao diện cấu hình AI** — auth là token CLI trong env; các mảng EP-28/29 rời phạm vi nền tảng (đúng như BA đã dự tính).
- Ràng buộc môi trường mới: mỗi máy phải **cài Claude Code + có token** (như Xcode/Appium). Cơ chế PO hình dung: `make setup` (chọn CLI → check/cài → hướng dẫn chạy `claude setup-token` một lần → lưu token vào env gitignored) + `make doctor` kiểm hiện diện + token.
- Quyền chấp nhận vẫn ở con người qua PR (BR-210/BC-08 giữ nguyên). Sinh test case cũng theo posture này (nền tảng trigger CLI với AC/mô tả → sinh file → chạy xanh → PR).

**Hệ quả kiến trúc (SA giữ, làm khi có spec B):**
- **ADR-021** (giao diện cấu hình AI), **ADR-022** (AI Client đa nhà cung cấp nội bộ), **ADR-023** (config.db lưu khóa) — **thay bằng cách tiếp cận CLI**. Sẽ viết ADR mới cho: cơ chế trigger CLI + seam `CodeAgent` (D); auth token (C); điểm chèn heal qua CLI (B).
- **ADR-024 (heal_event + status passed/failed + nhãn dẫn xuất + persist-qua-PR) phần lớn DÙNG LẠI** — chỉ đổi *nguồn* locator từ AI Client nội bộ sang CLI. Các file ADR-021→024 vẫn giữ (không xóa), park cùng bộ hướng A.
- Mới: tích hợp git/gh để tạo PR (lần đầu `src/` chạm git); `make setup`/`doctor` cho CLI; cạm bẫy "không sửa file giữa run".
- Điểm cần chốt khi thiết kế: PR-persist là **edit cơ học old→new + gh** (nền tảng tự làm, deterministic) hay nhờ CLI agent sửa — SA nghiêng edit cơ học (kiểm soát được, dùng CLI chỉ cho khâu suy ra locator).

**Nguồn kỹ thuật đã verify (Claude Code):** headless `-p` + `--output-format json` + `--allowedTools`/`--permission-mode` ([code.claude.com/docs/en/headless](https://code.claude.com/docs/en/headless)); auth `CLAUDE_CODE_OAUTH_TOKEN` qua `claude setup-token`, subscription billing, không cần browser mỗi lần ([code.claude.com/docs/en/authentication](https://code.claude.com/docs/en/authentication)).

### CẦN SA LÀM RÕ: ranh giới kiểu `Locator` cho AI Gateway (Phase 2, US-7.2) — *đã xử lý (SA, 2026-08-20)*
Bối cảnh: AI Gateway (`src/ai/`, ADR-025) parse đầu ra heal của AI CLI thành một `Locator` (interface-spec §CodeAgent `healLocator(): Promise<Locator | null>`). Kiểu `Locator` hiện ở module `locator` (`src/locator/locator.ts`). Sau khi thêm resolver TS (`fe1d1ed`), `eslint-plugin-boundaries` bắt cả type-import, nên cần một quyết định ranh giới:
- **PA1 (SA nghiêng):** nâng kiểu `Locator` + enum chiến lược lên `shared` (giữ bộ dựng locator đặc thù iOS ở `locator`, re-export cho tương thích nguồn). AI Gateway import `Locator` từ `shared` → dependency `ai → shared, config`, không cạnh `ai → locator`. Hợp guardrail OS-agnostic (CodeAgent page-source-vào/locator-ra, ADR-025).
- **PA2:** cho cạnh `ai → locator` type-only trong ma trận `element-types`.
Cả hai chạm khuôn khổ (ma trận phụ thuộc / vị trí kiểu ở kernel) nên Team Lead đẩy về SA thay vì tự quyết. **Team Lead khuyến nghị PA1** (khớp lean của SA). Ảnh hưởng: một dòng import ở US-7.2 (TICKET-036) + luật `element-types` của `ai` (US-6.2 TICKET-030 hiện đặt `{ from: ['ai'], allow: ['shared', 'config'] }` theo PA1). Không chặn viết ticket; chặn hiện thực US-7.2 ở mức đường import. Nếu SA chọn PA1: xác nhận phạm vi hoisting (kiểu + enum) và ai làm bước move (Team Lead đưa vào US-7.2 như bước hiện thực SA-đã-chốt).

**Chốt SA (2026-08-20): PA1 — [ADR-027](../architecture/adr/adr-027.md).** Nâng kiểu `Locator` + enum `LocatorStrategy` lên `shared`; bộ dựng iOS / `toSelector` / `describeLocator` / logic find giữ ở `locator` (re-export kiểu để tương thích nguồn). **Phạm vi hoisting = kiểu + enum** (KHÔNG phải bộ dựng). Bước move là bước hiện thực trong **US-7.2** (SA-đã-chốt). Ma trận `{ from: ['ai'], allow: ['shared', 'config'] }` (TICKET-030) **giữ nguyên** — không cạnh `ai → locator`. Đã cập nhật `north-star.md` §2.1/§3. Team Lead tiến hành US-7.2 theo PA1.

### CẦN SA ĐỒNG BỘ (không chặn): chữ "Claude Client" còn sót sau pivot B — *đã xử lý (SA, 2026-08-20)*
`coding-convention.md` §"Gọi Claude API" (dòng ~89–93, "thêm bởi: SA") và `CLAUDE.md` §5 còn ghi "Mọi lời gọi Claude qua Claude Client" — mô tả hướng A. Sau pivot B (ADR-025), đường gọi AI là **AI Gateway / CodeAgent gọi AI CLI ngoài qua subprocess**. Tài liệu này SA/PO sở hữu (CLAUDE.md là tầng bất biến); Team Lead ghi để SA đồng bộ chữ, không tự sửa.

**Đã đồng bộ (SA, 2026-08-20):** `coding-convention.md` §đổi "Gọi Claude API" → "Gọi AI (qua AI CLI ngoài)" (mọi lời gọi AI qua AI Gateway/`CodeAgent`, subprocess `claude -p`, đầu ra qua Zod, AI Gateway trả `null` không ném) + dòng 59 "phản hồi của Claude"→"AI CLI"; `CLAUDE.md` §5 dòng "Mọi lời gọi AI PHẢI qua AI Gateway (port `CodeAgent`)... gọi AI CLI ngoài qua subprocess (ADR-025)". Không còn "Claude Client" mô tả đường gọi.

### CẦN BA LÀM: bỏ "nền tảng tự tạo PR" khỏi tự phục hồi — *đã xử lý (BA, 2026-08-20)*
PO chốt: trong hướng B, git/commit/tạo-PR do **con người (QC automation) làm sau khi review kỹ**; nền tảng **KHÔNG** tự tạo PR.
**BA đã sửa (2026-08-20):** không chỉ 3 chỗ được nêu mà **9 chỗ** dư âm hướng A — FR-HEAL-07 (ghi locator cũ→mới + ảnh vào báo cáo, không tạo PR), NFR-203, BR-203, BR-210 (+ state diagram vòng đời tự phục hồi + ghi chú), US-203 (actor Reviewer→QC automation; con người tự áp + mở PR), §mở đầu use-cases, EP-14/EP-15 (epic-map), brd §6 happy path. Verify grep: mọi mention còn lại là câu phủ định đúng ("nền tảng **không** tự tạo PR") hoặc thuộc luồng sinh test case (Reviewer duyệt PR test AI sinh — đúng vai). Ghi change-log 2026-08-20.
Nguyên tắc thống nhất đã vào spec: **nền tảng gọi AI CLI cho việc AI** (heal lấy chuỗi locator, sinh test file); **mọi thao tác git/PR là của con người sau review**. SA thiết kế bỏ tích hợp git/gh khỏi `src/`.

### CẦN SA ĐÁNH GIÁ: Re-scope lộ trình — Android → Phase 3, phân tích → Phase 4 (Phase 2 giữ nguyên)
Bối cảnh: Product Owner re-scope lộ trình (2026-08-15). Android (EP-16) chuyển từ ngoài phạm vi thành **Phase 3**; lớp phân tích (EP-20/EP-21) lùi xuống **Phase 4**; mục tiêu go-live phủ iOS + Android + AI. Tài liệu BA đã cập nhật: `brd.md` §1/§5/§7, `epic-map.md` (EP-16/EP-20/EP-21), `phase-proposal.md` (thêm mục Phase 3 Android, đổi tên Phase 4), `requirement.md` §1/§2, `change-log.md` (2026-08-15).
Cần SA: khi mở thiết kế **Phase 3**, đánh giá lại quyết định `north-star.md` §6 (Phase 1 chốt KHÔNG thêm lớp trừu tượng Android). Android cần một lớp cho điều khiển thiết bị, tìm phần tử và cài build đặc thù. **Không tác động thiết kế Phase 2** (AI không đổi). Mục theo dõi cho Phase 3, không chặn Phase 2.
SA đã xác nhận (2026-08-18): tác động Phase 2 = không. Guardrail đã cài: lớp AI (AI Client + adapter + healing) không nhúng đặc thù iOS, chỉ page-source-vào/locator-ra; đặc thù iOS giữ ở module `locator` (ADR-022 §Hệ quả). Android vào Phase 3 thêm adapter ở `device`/`locator`, không đụng lớp AI. Mục vẫn mở như theo dõi Phase 3.

### CẦN BA + TEAM-LEAD LÀM: Khởi động US-5.2 — *đã xử lý: US-5.2 merged (`612d62b`, PR #23), Phase 1 hoàn tất 100%* — chốt app thí điểm (AUT) và chuỗi requirement → `.feature` → chạy thật
Bối cảnh: Phase 1 ~94% (16/17 US), chỉ còn US-5.2 (TICKET-026) — lần chứng minh nền tảng chạy đầu-cuối thật trên simulator, và là **thước đo** cho phần AI Phase 2 (kịch bản người viết chạy được là chuẩn để so kịch bản AI sinh). Không có app thật/requirement/QC nội bộ nên dùng app demo nguồn mở làm AUT và tự dựng đầu vào nghiệp vụ.

**AUT đã research (SA):** [saucelabs/my-demo-app-ios](https://github.com/saucelabs/my-demo-app-ios) (active) — có build simulator tải sẵn `SauceLabs-Demo-App.Simulator.zip` (release 2.2.2): giải nén → `.app` → `app.config.ts.buildPath`, `deviceType: 'simulator'`. (Bản `my-demo-app-rn` cũ đã archived 05/2024, không dùng.)

**Ghi chú vai:** hiện tại **Team Lead, Dev, QC là một người** — các mục dưới tách theo "mũ" (vai) để rõ *loại việc*, nhưng cùng một người thực hiện; thứ tự trong mũ đó vẫn nên theo. **BA** và **SA** là hai vai tách riêng.

**Chuỗi vai để khởi động (đúng quy trình):**

**Bước 0 — người Team Lead/Dev/QC:** tải `SauceLabs-Demo-App.Simulator.zip`, giải nén `.app` vào `apps/<pilot>/build/` (`coding-convention.md` §Tổ chức thư mục), mở trong simulator một lần **xác nhận có luồng login + credentials** (SA chưa verify được từ README — README chỉ mô tả QR scanner). Báo lại cho BA những luồng quan sát được.

**BA** — *đầu vào nghiệp vụ* — **đã giao:** `docs/business/phase-1/pilot-app-requirements.md`.
- Requirement/AC cho AUT: ba luồng cốt lõi (đăng nhập đúng, đăng nhập sai, thêm sản phẩm vào giỏ) phát biểu mức nghiệp vụ (bối cảnh — hành động — kết quả mong đợi), dữ liệu tham chiếu bằng tên theo BR-017.
- Năm test case, hai test feature: TC-1.1/TC-1.2/TC-2.1 đạt; **TC-2.2 gieo lỗi có chủ đích (`@seeded-fail`)** để kích hoạt đường ảnh chụp + báo cáo test hỏng. Kèm phương án thay thế nếu build có tài khoản khóa.
- Các chi tiết đặc thù build (giá trị credential, có tài khoản khóa không, nhãn màn hình) đánh nhãn giả định/câu hỏi mở ở §6 — người mở simulator / vai viết `.feature` xác nhận, không cần BA quyết. BA không giữ mục mở nào ở US-5.2.

**Team Lead/Dev/QC (US-5.2, một người — tách theo mũ):**
- *(mũ QC)* Từ AC của BA, viết `features/*.feature`: hành vi bằng **tiếng Anh, không locator, mỗi test case một hành vi + một kết quả** (BR-016); bước mở đầu tự đưa app/dữ liệu về trạng thái cần (BR-005). Dùng **Appium Inspector** trên chính build đó để đọc accessibility id.
- *(mũ Dev)* Viết `steps/*.steps.ts` (mỗi câu ánh xạ một phương thức Page Object, ưu tiên tái dùng câu đã có, không chứa locator) và `screens/*.screen.ts` (Page Object: locator tập trung, thao tác mức nghiệp vụ, tìm phần tử qua Locator Resolver, **không assertion trong Page Object**).
- *(mũ Team Lead)* Dựng `apps/<pilot>/` đúng cấu trúc: `app.config.ts` (hợp schema, `buildPath` trỏ `build/`), `test-data.example.json` + giá trị thật ở `.local`; đảm bảo cổng `make typecheck/lint/test` xanh; mở PR (một US = một PR). Bám `coding-convention.md` (§mô tả hành vi/§cài đặt/§Page Object/§đặt tên) và `north-star.md` §2.1.

**SA** — *kiểm soát chất lượng kiến trúc*:
- Review nội dung `apps/<pilot>/` đối chiếu convention (tách Page Object, `.feature` không locator, `screenName` khớp Page Object — ADR-011, phụ thuộc một chiều features→steps→screens).
- **Verify lần chạy thật đầu-cuối** trên simulator; soi các mối nối rủi ro lần đầu: cast `browser` ở `run-assembly`, adapter payload Cucumber, env kế thừa xuống worker, SQLite trong worker, và bundleId vs `app.config` (xem ghi chú review US-4.3).

**Nghiệm thu US-5.2:** một case đạt + một case hỏng chạy được trên simulator, sinh báo cáo mở xem được; lượt chạy này chốt làm **baseline known-good** để sau này đo hiệu quả AI. Chốt AUT cụ thể là quyết định kỹ thuật của đội.

## Đã xử lý

### CẦN TEAM-LEAD LÀM: tiếp nhận thiết kế Phase 2 (hướng B) để chẻ ticket — *đã xử lý (Team Lead, 2026-08-20)*
PO đã duyệt gói thiết kế Phase 2 hướng B; SA đã reconcile (ADR-024/025/026 Accepted, north-star/change-log cập nhật). Team Lead đã chẻ ticket: **3 epic → 11 user story → 17 ticket** (TICKET-028→044) ở `docs/tickets/phase-2/` (11 tệp `us-*.md` + `board.md`), phủ US-201..210 (BA), Phương án A lát mỏng theo module. Bám ADR-024 (heal_event + status hai giá trị), ADR-025 (subprocess `claude -p` + `CodeAgent`), ADR-026 (token env + setup/doctor) và `docs/architecture/phase-2/`. Nền tảng KHÔNG tích hợp git/PR (con người mở PR). Residual `Locator` type đẩy về SA đã giải (ADR-027, PA1). Phụ thuộc BA (bỏ auto-PR) đã xong. **PO đã duyệt board Phase 2 (2026-08-20)** — Giai đoạn N đóng; sẵn sàng cho Dev (bắt đầu US-6.1 + US-7.1).

### CẦN SA ĐÁNH GIÁ: Re-scope Phase 2 — đa nhà cung cấp AI + giao diện cục bộ — *đã đánh giá*
SA đã đánh giá cùng Product Owner (2026-08-18), ghi thành ADR (Proposed, chờ PO duyệt): **ADR-021** (giao diện web cục bộ khởi chạy theo yêu cầu — bác desktop app/TUI), **ADR-022** (lớp đa nhà cung cấp AI ports-and-adapters, adapter tự viết sau AI Client, thay ADR-005; token từ `usage`), **ADR-023** (`data/config.db` riêng cho danh sách nhà cung cấp + khóa, thay phần khóa-toàn-cục ADR-009). Giả định "chạy cục bộ, KHÔNG server từ xa" xác nhận: giao diện là web localhost sống-ngắn, không daemon. Việc còn lại theo dõi ở mục "CẦN PRODUCT OWNER DUYỆT" phần Đang mở.

### CẦN SA ĐÁNH GIÁ: Mô hình dữ liệu "lần tự phục hồi" (Phase 2, phần tự phục hồi) — *đã đánh giá*
SA đã đánh giá (2026-08-18), ghi thành **ADR-024** (Proposed): trục trạng thái test case tách còn kết luận `{passed, failed}` (BR-204); "đạt kèm tự phục hồi / AI healed" là **nhãn dẫn xuất** từ sự tồn tại của thực thể mới `heal_event`, không phải giá trị trạng thái — nên ca "hỏng + có tự phục hồi" (mà ba giá trị cũ không chứa) biểu diễn được. `heal_event` append-only bất biến (BR-207); trạng thái rà soát sống ở pull request (git), không cột khả biến. Đầu vào AI healing = locator + màn hình + page source (đủ theo cơ chế ADR-022); kiểu `Locator` giữ co giãn thêm mô tả tùy chọn về sau (mục `srs.md` §3). Trục status Phase 1 (ADR-003/004/020) đổi cách biểu diễn — ghi ở ADR-024 §Hệ quả + mục BA phần Đang mở.

### CẦN SA LÀM RÕ: Phân loại lỗi ADR-016 bị vô hiệu dưới @wdio/cucumber-framework — *đã xử lý*
Chẩn đoán xác nhận trong source: `@wdio/cucumber-framework` (index.js:128) truyền `afterStep` **chuỗi** `world.result.message`, không phải object → `AppFailure.kind` (ADR-016) không sống sót, mọi assertion rơi `step_not_executed`. **Chốt (SA):** mang `kind='assertion'` qua ranh giới Cucumber bằng một **sentinel ổn định trong message** — `assertExpectation` (`shared/assertion.ts`) gắn sentinel; `failure-classifier` nhận diện → `wrong_conclusion` và cắt sentinel để `error_message` giữ nguyên (FR-EXEC-10). Ghi vào ADR-016 §Hệ quả. **Việc Dev (2 file):** (1) `shared/assertion.ts` gắn tiền tố sentinel; (2) `evidence/failure-classifier.ts` nhận diện + cắt sentinel (giữ nhánh `isAppFailure && kind==='assertion'` cho đường trong tiến trình). Không chặn nghiệm thu US-5.2.

### CẦN TEAM-LEAD LÀM: Cưỡng chế ranh giới module + hai cạnh vi phạm ma trận (US-4.3) — *đã xử lý*
Sửa ở `fe1d1ed`, **SA verified thực nghiệm**: (A) `eslint-import-resolver-typescript` + `settings['import/resolver']` — probe `cli→store` cố ý sai nay báo lỗi `boundaries/element-types`; ma trận ADR-002/014 cưỡng chế thật (bắt cả type-import). (B) `src/reporter/generate-report.ts` `generateReport(appId,runId,outputDir,format)`; CLI gọi Reporter, bỏ import store. (C) `launchRun` nhận `LaunchTarget` cấu trúc trong runner, không import `AppConfig` từ registry. Mã thật pass lint với hàng rào sống; tsc 0; 171/171 test. `component-design.md` §Reporter/§Test Runner cập nhật.

### CẦN TEAM-LEAD LÀM: Guard hiện diện `AIMTAP_*` (US-3.4 onPrepare + US-4.3 launchRun) — *đã xử lý*
Cả hai vị trí đã SA verified: [x] US-3.4 `AimtapService.onPrepare` (`ab3b680`) là lưới an toàn cho đường `wdio run` trực tiếp (WDIO gọi launcher hook trên class inline — `@wdio/utils` 9.30.0); [x] US-4.3 `launchRun` (`f3a04dc`) chạy `assertCapabilityEnv` trong tiến trình CLI trước khi tạo Launcher (nhà chính, ADR-009/018). Guard bỏ khỏi `before` (chạy sau phiên). Đúng ADR-009 §Hệ quả.

### CẦN SA + TEAM-LEAD LÀM: Implement US-4.3 launch/progress theo ADR-018 — *đã xử lý*
ADR-018 (Accepted) gỡ ba điểm + mâu thuẫn ADR-013↔component-design: (1) `launchRun` bọc `@wdio/cli` Launcher (CLI=launcher); (2) tiến trình per-test = reporter WDIO trong worker (`progress-reporter.ts`), bỏ `progress-view` khỏi CLI; (3) run-id do CLI sinh + tiêm env `AIMTAP_RUN_ID`, worker dùng, CLI sinh báo cáo cuối lượt. Team Lead implement (`f3a04dc`/`fe1d1ed`), SA verify. [x] SA đồng bộ doc tham chiếu: `interface-spec.md` §Test Runner (`launchRun`), `component-design.md` §CLI Entry/§Test Runner/§Reporter, `sequence-diagrams.md` §1, `north-star.md` §2.1, ghi chú nguồn run-id ở ADR-013.

### CẦN PRODUCT OWNER DUYỆT: Thư viện CLI cho khung lệnh `aimtap` — *đã xử lý*
Chốt **commander** ở **ADR-017 (Accepted, Product Owner duyệt)**. Neo ràng buộc dự án (ESM/NodeNext, Node 22, posture ít phụ thuộc, đúng 3 lệnh doctor/run/report, mã thoát test-được): commander zero-dependency + ESM-only v15 + `exitOverride()` khớp trực tiếp AC mã thoát `doctor`; yargs/oclif dư phụ thuộc/kiến trúc cho nhu cầu hiện tại. Đã thêm dòng CLI (commander) vào `north-star.md` §4. Team Lead mở US-4.2 (TICKET-020) ngay; US-4.3/4.4/5.2 nối tiếp. Xem lại theo hướng oclif nếu CLI phình nhiều lệnh/plugin (ADR-017 §Hệ quả).

### CẦN TEAM-LEAD LÀM: Kiểm tra sự hiện diện `AIMTAP_*` trước khi mở phiên (phát hiện lúc review US-3.3) — *đã xử lý*
Hành vi US-3.3 giữ nguyên: `iosCapabilities` (`src/runner/wdio-service.ts`) mặc định env thiếu thành chuỗi rỗng là đúng ở tầng này vì US-3.3 cố ý không phụ thuộc build-time vào Config/Device/CLI (ADR-014). Không sửa TICKET-017. Việc kiểm tra sự hiện diện `AIMTAP_*` là điểm wiring cấp ticket, đặt ở US-3.4 (TICKET-018): trước khi phiên Appium mở, dựng biến môi trường capability từ `DeviceContext` đã validate (FR-DEV-02) làm nguồn duy nhất, kiểm tra mọi khóa bắt buộc theo `CapabilityKind`, thiếu thì ném `PlatformFailure` liệt kê khóa thiếu và dừng lượt chạy sớm (ADR-009), không thành test case hỏng (ADR-016) — kèm acceptance criteria. Ghi chú giới hạn phạm vi ở US-1.2 (TICKET-003): `AIMTAP_*` giá trị theo lượt chạy không vào schema tĩnh của Config & Secrets. Điểm đặt chính xác bước dựng/kiểm trong luồng khởi động testrunner là điểm kiểm chứng lúc implement; nếu buộc phải đổi cách CLI ↔ testrunner truyền biến môi trường giữa hai tiến trình thì đẩy về SA. Không chạm khuôn khổ.

### CẦN SA LÀM RÕ: Chữ ký async của Evidence Collector (`onScenarioEnd`) — *đã xử lý*
Duyệt chữ ký async theo phương án Team Lead đề xuất, là hợp đồng interface (không cần ADR mới; khớp NFR-10, ghi giao dịch, ADR-013). Đã đồng bộ `interface-spec.md` §Evidence Collector và `sequence-diagrams.md` §2:
- `onStepEnd(step): void` — đồng bộ; khi bước hỏng **hoặc bước đánh dấu chụp** (BR-003) thì kích hoạt chụp ảnh và giữ promise chụp đang chờ, ngoài đường chờ của bước (NFR-10).
- `onScenarioEnd(testCase): Promise<TestCaseResult>` — chờ mọi promise chụp đang treo để có `screenshot_path`, rồi dựng `StepLog`/`TestCaseResult` và gọi `saveTestCaseResult` theo một giao dịch. Test Runner `await` ở hook `afterScenario`.
- `setCurrentScreen(name): void` — không đổi.
Không tách hàm `flush()` riêng: gộp await vào `onScenarioEnd` giữ một ranh giới trách nhiệm và tránh một lời gọi mà hook có thể quên. TICKET-016 hiện thực theo chữ ký này; TICKET-018 (`cucumber-hooks.ts`, US-3.4) `await onScenarioEnd` — không đổi mô hình thực thi ADR-013 vì hook Cucumber vốn await được.

### CẦN TEAM-LEAD LÀM: Áp discriminant loại lỗi (ADR-016) vào failure-classifier khi làm US-2.2 (TICKET-015) — *đã xử lý*
Chốt ở ADR-016: `AppFailure` mang `kind: 'step_execution' | 'assertion'`, mặc định `step_execution`. Hiện thực ở US-2.2 (commit `d253f01`): (a) `src/shared/errors.ts` thêm `kind` (mặc định `step_execution`, bộ phân biệt kiểu giữ nguyên); (b) `src/evidence/failure-classifier.ts` ánh xạ `assertion → wrong_conclusion`, `step_execution` và lỗi lạ không thuộc `AppFailure`/`PlatformFailure` → `step_not_executed`, luôn giữ `error_message` gốc; (c) cơ chế khẳng định của nền tảng `src/shared/assertion.ts` (`assertExpectation`) gắn `kind = 'assertion'`. `find` (US-2.1) phù hợp nhờ mặc định — không sửa. SA review commit `d253f01` (cấp code): sửa `assertExpectation` cho `PlatformFailure` đi qua nguyên trạng để không bị bọc thành `assertion` (giữ trên đường thiết bị/lượt chạy, không ghi thành test case hỏng — hệ quả ADR-016), chuyển `screenshot-writer` sang `fs/promises` (NFR-10), đặt `readonly` cho trường `StepRecord`. Ba điểm cấp code, tôn trọng hợp đồng lỗi sẵn có, không chạm khuôn khổ. `component-design.md` §Shared bổ sung `assertion.ts` (phần tử hạ tầng dùng chung).

### CẦN SA LÀM RÕ: Ma trận phụ thuộc module Phase 1 (phát hiện lúc implement US-1.1) — *đã xử lý*
**Chốt:** (1) Chu trình Test Runner ↔ Locator Resolver gỡ theo Phương án C của ADR-014 (Proposed) — Locator không import Test Runner, dùng phiên WebdriverIO toàn cục để tìm phần tử, nhận tên màn hình qua sink Test Runner tiêm lúc mở phiên (`registerScreenSink`); quan hệ một chiều Test Runner → Locator Resolver, Locator chỉ phụ thuộc Shared. (2) CLI phụ thuộc thêm App Registry và Reporter. (3) Shared là kernel mọi module trong `src/` được phép import; Device & Build Manager → App Registry (chỉ kiểu `AppConfig`). Đã vào `north-star.md` §2/§2.1/§3, `component-design.md`, `interface-spec.md`, `adr/adr-014.md`. Ma trận provisional trong `eslint.config.ts` khớp ba hướng này nên chốt lại không kéo theo sửa mã US-1.1; Team Lead bỏ nhãn provisional ở `eslint.config.ts` và chỉnh diễn đạt US-2.1 (Locator dùng phiên toàn cục + sink) và US-3.4 (Test Runner tiêm sink) theo ADR-014.

### CẦN TEAM-LEAD LÀM: Chỉnh diễn đạt TICKET-018/019 theo mô hình thực thi Test Runner (ADR-013) — *đã xử lý*
Đồng bộ TICKET-018/019 (trong `docs/tickets/phase-1/us-3-4-run-orchestration.md`) với ADR-013. TICKET-018 (`cucumber-hooks.ts`): `beforeScenario` bỏ qua test case nếu cờ dừng đã bật, ngược lại gọi `probeDuringRun` và bật cờ dừng `device_unavailable` khi `unavailable`; test case `failed` không bật cờ dừng (BR-002); `beforeStep`/`afterStep`/`afterScenario` chuyển sự kiện tới Evidence Collector. TICKET-019 (`run-session.ts`): không tự lặp qua test case, giữ trạng thái tổng hợp và cờ dừng, `saveRunStart` ở hook `before`, `finalizeRun` ở hook `after` (`not_run_count` = số scenario bị bỏ qua), hủy qua SIGINT với `stop_reason = cancelled_by_qc`; tiêu chí chọn tập dịch thành bộ lọc spec/tag của Cucumber lúc khởi động. Cập nhật `board.md` phụ thuộc cấp ticket (018 nay phụ thuộc 019); phụ thuộc cấp user story của US-3.4 không đổi. Không chạm khuôn khổ.

### CẦN TEAM-LEAD LÀM: Tiếp nhận thiết kế Phase 1 để chẻ ticket — *đã xử lý*
Giai đoạn 0 (quy ước ticket) và Giai đoạn 1 (chẻ ticket Phase 1) hoàn tất. Phân cấp tổ chức: **Epic → User Story → Ticket** (`docs/tickets/conventions.md`). Phase 1 chẻ theo Phương án A (lát mỏng theo module) thành **5 epic → 17 user story → 27 ticket**, phủ toàn bộ US-01→US-20 nghiệp vụ. Mỗi user story là một tệp `docs/tickets/phase-1/us-*.md` chứa ticket inline (một user story = một pull request; mỗi ticket = một commit) và link về US nghiệp vụ qua field "Business US (BA)". `board.md` định nghĩa epic, danh sách user story thuộc từng epic, thứ tự merge và phụ thuộc. Quy tắc style/thực thi cấp mã bổ sung vào `coding-convention.md` §"Thực thi & style" (đặt tên, tệp `.feature`/test case, commit/PR, kiểm thử đơn vị) — chỉ style/thực thi, không chạm khuôn khổ. Không có điểm nào cần đẩy ngược về SA/BA.

### CẦN SA LÀM RÕ: Đồng bộ thuật ngữ và hai trường dữ liệu mới vào tài liệu thiết kế — *đã xử lý*
Từ vựng trung tâm mới đã đồng bộ vào toàn bộ tài liệu Giai đoạn 0 ("kịch bản" → test case; "bộ kịch bản" → test suite; bổ sung tầng test feature với ánh xạ một tệp `.feature` = một test feature; "Reviewer kịch bản" → Reviewer). Grep `docs/architecture/` không còn "kịch bản".
Hợp đồng dữ liệu đã cập nhật ở ADR-003 (thêm tên test feature và thông báo lỗi gốc; loại lỗi hai giá trị theo BR-014; test case không chạy không sinh bản ghi) và ADR-006 (bảng tóm tắt báo cáo nhóm theo test feature, thêm thông báo lỗi gốc ở phần test case hỏng). Danh sách trường bắt buộc đầy đủ đặc tả ở `erd.md`/`interface-spec.md` của Phase 1. Ghi ở `change-log.md` (2026-07-23), cột Team Lead đánh giá lại = Có.

### CẦN SA LÀM RÕ: Điểm kiểm tra thiết bị giữa lượt chạy — *đã xử lý*
**ADR-010 (Accepted):** trước mỗi test case, nền tảng phát một lệnh WebDriver chi phí thấp trên phiên Appium đang mở (probe nhẹ); ném lỗi kết nối hoặc hết thời gian chờ tối đa sau khi thử lại theo `wait-policy` thì coi thiết bị không sẵn sàng và dừng lượt chạy theo BR-018. Không kiểm tra lại ở tầng hệ điều hành mỗi test case, vì giữa lượt chạy chỉ tính sống của phiên là đổi được, còn OS và định danh thiết bị cố định và đã kiểm ở FR-DEV-02 lúc mở. Loại lệnh probe cụ thể chốt ở `interface-spec.md` Phase 1.

### CẦN SA LÀM RÕ: Cơ chế lưu bí mật ngoài kho mã chuyển sang phạm vi Phase 1 — *đã xử lý*
**ADR-009 (Accepted):** dữ liệu kiểm thử và bí mật lưu bằng tệp có cấu trúc theo từng ứng dụng, một tệp cho mỗi ứng dụng — `apps/<app-id>/test-data.example.json` (theo dõi bởi Git, khuôn) và `apps/<app-id>/test-data.local.json` (không theo dõi bởi Git, giá trị QC điền). Một schema Zod theo ứng dụng mô tả hình dạng và đánh dấu nhánh bí mật; Config & Secrets nạp, kiểm tra tính đầy đủ trước khi mở lượt chạy và báo mục thiếu theo đường dẫn trường. Khóa API Claude giữ ở `.env.local` gốc — bí mật toàn cục, không thuộc ứng dụng nào. Cấu trúc `apps/<app-id>/` và quy tắc `.gitignore`/che bí mật đã vào `north-star.md` §2.1 và `coding-convention.md`.

### CẦN SA LÀM RÕ: Cách suy ra trường "tên màn hình" và công cụ tạo PDF (hoãn từ ADR-003/ADR-006) — *đã xử lý*
**ADR-011 (Accepted, SA):** tên màn hình lấy từ Page Object đang thao tác tại bước hỏng — lựa chọn phù hợp duy nhất vì iOS không có khái niệm màn hình ở tầng hệ điều hành.
**ADR-012 (Accepted, SA):** Reporter dùng Puppeteer kèm Chromium đóng gói cho cả PNG và PDF, để báo cáo render giống nhau trên mọi máy QC; product owner xác nhận khoản tải Chromium khi cài đặt là chấp nhận được.

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Ứng xử khi không mở được phiên điều khiển thiết bị giữa lượt chạy (OQ-P1-03) — *đã xử lý*
Tách hai điều kiện dừng thay vì gộp làm một. Một test case hỏng không dừng lượt chạy, không phụ thuộc loại lỗi (BR-002) — các test case độc lập với nhau về logic và dữ liệu. Lượt chạy chỉ dừng khi thiết bị không còn sẵn sàng (BR-018), vì thiết bị là tài nguyên dùng chung mà mọi test case phụ thuộc vào, và tính độc lập giữa các test case không còn ý nghĩa khi tài nguyên chung biến mất.
Việc dừng dựa trên một điều kiện xác định — thiết bị còn hay không — chứ không dựa trên ngưỡng số lần hỏng liên tiếp. Đã vào: BR-002, BR-018, FR-DEV-04, FR-RUN-04, FR-RUN-06, UC-06 E4, US-20, AS-P1-08.

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Dữ liệu kiểm thử mà test case cần (OQ-P1-02) — *đã xử lý*
Giá trị dữ liệu kiểm thử nằm ngoài kho mã. Kho mã chứa tên các mục và một tệp mẫu không mang giá trị thật; QC chép tệp mẫu ra và điền giá trị trên máy mình.
Dữ liệu chia hai loại: loại test case chỉ đọc (tài khoản đăng nhập, tài khoản bị khóa) chuẩn bị cố định trên môi trường test; loại test case làm thay đổi hoặc tiêu thụ (email đăng ký, đơn hàng được tạo) do test case tự sinh mới ở bước mở đầu. Quy tắc thứ hai là BR-005 áp vào dữ liệu, và là điều kiện để NFR-03 thỏa qua nhiều lượt chạy.
Cơ chế dọn dữ liệu do test case sinh ra nằm ngoài phạm vi Phase 1 (AS-P1-07).
Đã vào: BR-017, FR-APP-05, FR-AUTH-10, NFR-12, AS-P1-06, AS-P1-07, UC-01, UC-03, UC-04, US-05, US-07, US-19.

### CẦN BA LÀM RÕ: Đơn vị của "kịch bản" — một test case hay một luồng nghiệp vụ — *đã xử lý*
Phân cấp bốn tầng: test suite chứa test feature, test feature chứa test case, test case chứa các bước (`brd.md` §1.1, BR-016).
Đơn vị mang trạng thái đạt hoặc hỏng là **test case**. Một test case kiểm tra đúng một hành vi với một kết quả mong đợi và chạy độc lập được. "Test login" và "test signup" là hai test feature, không phải hai test case.
Bản ghi kết quả mang cả tên test feature lẫn tên test case, để Phase 3 tổng hợp được ở cả hai tầng.

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Tập giá trị trạng thái của một test case (OQ-P1-01) — *đã xử lý*
Giữ nguyên ba giá trị đã duyệt ở FR-EXEC-06: đạt, hỏng, đạt kèm tự phục hồi. ADR-003 không phải sửa phần này.
Test case nằm trong tập chạy nhưng không được thực thi không sinh bản ghi kết quả; số lượng được ghi ở cấp lượt chạy. Mẫu số khi tính tỷ lệ vượt qua ở Phase 3 vì thế không phải lọc thêm.
Phân loại lỗi rút xuống hai giá trị mà nền tảng xác định chắc chắn được lúc chạy: "test case kết luận sai" và "không thực hiện được bước". Bản ghi luôn lưu thông báo lỗi gốc, nên việc phân loại chi tiết hơn thực hiện được về sau từ dữ liệu đã tích lũy mà không mất thông tin. Việc này được xem lại sau khi Phase 1 vận hành.

### CẦN BA LÀM RÕ: Mã NFR-09 mang hai nội dung khác nhau ở hai tài liệu — *đã xử lý*
Mã NFR đồng bộ theo `brd.md`. `requirement.md` NFR-09 nay mang cùng nội dung với `brd.md` NFR-09: phần mô tả hành vi của test case phải luôn khớp với hành vi được thực thi. Hai yêu cầu bị đẩy xuống: NFR-10 là hiệu năng thu thập bằng chứng, NFR-11 là ngôn ngữ tiếng Anh trong kho mã.
Quy ước đánh mã ghi ở đầu `requirement.md`: NFR-01 đến NFR-09 dùng chung giữa hai tài liệu và mang cùng nội dung; NFR-10 trở đi chỉ có ở `requirement.md`. Thiết kế đang dùng mã theo `brd.md` nên không phải sửa theo.

### CẦN BA LÀM RÕ: Mức bắt buộc của ảnh chụp màn hình ở test case đạt — *đã xử lý*
Hệ thống chụp một ảnh duy nhất, tại thời điểm bước hỏng của một test case hỏng. Các bước khác không chụp, trừ những bước được đánh dấu tường minh là cần chụp. Test case đạt không có ảnh chụp.
Thay cho ảnh của các bước trước, mỗi test case có một nhật ký thực thi: các bước đã chạy theo thứ tự, kết quả từng bước, và thông báo lỗi gốc tại bước hỏng.
Lý do: muốn có ảnh của các bước trước bước hỏng thì buộc phải chụp mọi bước ngay từ đầu, vì lúc chạy chưa biết bước nào sẽ hỏng. Mỗi lần chụp tốn từ vài trăm mili-giây tới vài giây, nên chi phí này rơi vào cả các test case đạt và ảnh hưởng trực tiếp SM-02. Nhật ký thực thi cho cùng thông tin điều tra với chi phí thấp hơn nhiều.
Quy tắc đi kèm: lỗi phát sinh khi chụp màn hình hoặc ghi nhật ký không được làm thay đổi trạng thái của test case. Bằng chứng thực thi là thứ phụ trợ, không phải điều đang được kiểm tra.
Đã phản ánh vào thiết kế: Evidence Collector đổi trách nhiệm (`north-star.md` §2), nguyên tắc "bằng chứng thực thi là thứ phụ trợ" (§2.2), nhật ký thực thi vào hợp đồng dữ liệu (ADR-003), nội dung báo cáo (ADR-006), quy tắc mã (`coding-convention.md`).

### CẦN BA LÀM RÕ: `phase-proposal.md` vẫn tính EP-10 vào Phase 1 — *đã xử lý*
`phase-proposal.md` §Phase 1 liệt kê tường minh: EP-01, EP-02, EP-03, EP-04, EP-05, EP-06, EP-07, EP-08, EP-09, EP-17, EP-19, EP-23, EP-24, EP-25. Phase 2 và Phase 3 cũng liệt kê tường minh thay vì dùng dải mã.

### CẦN BA LÀM RÕ: `brd.md` §3.1 chưa phản ánh xác nhận về ngôn ngữ — *đã xử lý*
`brd.md` §3.1 bổ sung cột "Đọc và viết mô tả hành vi bằng tiếng Anh", bắt buộc ở cả ba phase. Thêm BC-10 và `requirement.md` NFR-11 về việc toàn bộ nội dung trong kho mã viết bằng tiếng Anh. BC-10 đã vào `north-star.md` §5.

### CẦN BA LÀM RÕ: FR-EXEC-04 chưa có trạng thái "đạt kèm tự phục hồi" — *đã xử lý*
Yêu cầu về trạng thái test case nay là FR-EXEC-06, phát biểu ba giá trị: đạt, hỏng, đạt kèm tự phục hồi. Giá trị thứ ba nằm trong dữ liệu kết quả từ giai đoạn 1 dù chỉ phát sinh từ giai đoạn 2.
Mã yêu cầu trong `requirement.md` §4.2 đã đánh lại do chèn thêm ba yêu cầu về bằng chứng thực thi; self-healing nay là FR-EXEC-08 và FR-EXEC-09. Tài liệu thiết kế không tham chiếu mã FR nào, nên không có chỗ nào phải sửa theo.

### CẦN BA ĐÁNH GIÁ: Quyết định dùng Cucumber làm đổi cách mô tả test case trong tài liệu nghiệp vụ — *đã xử lý*
Cách mô tả đã cập nhật ở `requirement.md` §3 và FR-AUTH-01, `epic-map.md` EP-03 và EP-12, `brd.md` §1.1: một test case gồm phần mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt thực thi từng câu mô tả. Thiết kế dùng cùng cách gọi này.
Việc thu hẹp phạm vi được xác nhận: FR-AUTH-06 và EP-12 không còn là xây một chức năng hiển thị, mà là đưa phần mô tả hành vi tới QC. NFR-09 giữ ở mức nghiệp vụ để ràng buộc mọi lựa chọn thiết kế về sau, và đã vào `north-star.md` §5.

### CẦN BA LÀM RÕ: Trạng thái kết quả của một test case có xảy ra tự phục hồi — *đã xử lý*
Trạng thái riêng "đạt kèm tự phục hồi", tách khỏi "đạt". Giá trị này nằm trong hợp đồng dữ liệu kết quả từ Phase 1 dù chỉ phát sinh từ Phase 2 (ADR-003, ADR-004).

### CẦN BA LÀM RÕ: Nội dung tối thiểu của báo cáo đính Jira — *đã xử lý*
Báo cáo gồm bảng tóm tắt toàn lượt chạy nhóm theo test feature, và với mỗi test case hỏng là ảnh chụp bước hỏng, nhật ký thực thi, tên màn hình, loại lỗi và thông báo lỗi gốc (ADR-006, `srs.md` FR-REP-02).

### CẦN BA LÀM RÕ: Trạng thái khởi tạo của ứng dụng trước mỗi lượt chạy — *đã xử lý*
Mỗi test case tự đưa ứng dụng về trạng thái nó cần ở bước mở đầu; nền tảng không đặt lại ứng dụng giữa các lượt chạy. Device & Build Manager thu hẹp phạm vi tương ứng (`north-star.md` §2).

### CẦN BA LÀM RÕ: `docs/requirement.md` Mục 2 mâu thuẫn với `brd.md` về phạm vi Android — *đã xử lý*
`requirement.md` đã đồng bộ với `brd.md`.

### CẦN BA LÀM RÕ: Năng lực tiếng Anh của QC — *đã xử lý*
Tiếng Anh là ngôn ngữ chính của đội.

### CẦN BA LÀM RÕ: Ứng dụng thí điểm để nghiệm thu Phase 1 — *đã xử lý*
Tiêu chí nghiệm thu phát biểu theo đặc điểm ứng dụng: một ứng dụng iOS bất kỳ có luồng đăng nhập và một vài thao tác cốt lõi. Việc chọn ứng dụng cụ thể để dev kiểm chứng là quyết định kỹ thuật, xử lý ở thiết kế Phase 1.

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Cách sinh báo cáo PNG/PDF — *đã xử lý*
Reporter tự sinh báo cáo từ dữ liệu trong Result Store (ADR-006); công cụ cụ thể ở ADR-012.

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Điểm đặt lớp self-healing — *đã xử lý*
Locator Resolver gọi tường minh (ADR-004).

### CẦN BA LÀM RÕ: Ai soạn test case mới ở Phase 2 khi Claude không khả dụng — *đã xử lý*
Đội có người viết được mã ở mọi phase; việc phân bổ nguồn lực do đội đảm nhận. Giả định này là căn cứ của ADR-001.

### CẦN PRODUCT OWNER QUYẾT ĐỊNH: Hình dạng test case và test framework — *đã xử lý*
Cucumber với tệp `.feature` và tập step definition (ADR-001, ADR-007). Một tệp `.feature` tương ứng một test feature.

### CẦN SA LÀM RÕ: Mâu thuẫn phạm vi Android — *đã xử lý*
Thiết kế Phase 1 không thêm lớp trừu tượng nào cho Android (`north-star.md` §6).

### CẦN SA LÀM RÕ: Định dạng báo cáo PNG/PDF — *đã xử lý*
ADR-006: nền tảng tự sinh báo cáo một tệp từ dữ liệu kết quả.

### CẦN SA LÀM RÕ: Tách nền tảng khỏi test case của từng ứng dụng trong cùng một repo — *đã xử lý*
ADR-002: ranh giới bằng thư mục cộng luật lint chặn phụ thuộc ngược.

### CẦN SA LÀM RÕ: Thực thi trên cả thiết bị thật và simulator — *đã xử lý ở mức Giai đoạn 0*
Device & Build Manager chịu trách nhiệm cho khác biệt giữa hai loại. Ràng buộc chi tiết thuộc thiết kế Phase 1.

### CẦN SA LÀM RÕ: Biểu diễn test case dưới dạng các bước bằng ngôn ngữ tự nhiên — *đã xử lý*
ADR-007: tệp `.feature` là biểu diễn ngôn ngữ tự nhiên và cũng là thứ được thực thi.

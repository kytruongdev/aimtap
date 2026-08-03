# Open Items — bàn giao giữa các vai trò

Mỗi mục ghi rõ vai trò cần xử lý, bối cảnh, và tài liệu liên quan. Vai trò nào cũng đọc file này ở bước khởi động.

Từ vựng trung tâm (test suite, test feature, test case, bước) định nghĩa ở `docs/business/brd.md` §1.1.

---

## Đang mở

### CẦN TEAM-LEAD LÀM: Guard hiện diện `AIMTAP_*` đặt sai vòng đời — chạy sau khi phiên đã mở (phát hiện lúc review US-3.4)
Bối cảnh: mở từ review US-3.3 (guard cần chạy **trước khi mở phiên Appium** để thiếu biến `AIMTAP_*` báo lỗi đọc được thay vì lỗi Appium khó hiểu — ADR-009 §Hệ quả). US-3.4 (`985f56c`) đã thêm logic guard đúng và có test: `missingCapabilityEnv`/`assertCapabilityEnv` trong `src/runner/cucumber-hooks.ts` kiểm đúng khóa bắt buộc theo `CapabilityKind`, coi rỗng là thiếu, ném `PlatformFailure` liệt kê khóa thiếu.

**Lỗi:** guard được gọi ở `AimtapService.before()` (`src/runner/wdio-service.ts`) → `hooks.onSessionStart()` → `assertCapabilityEnv`. Hook `before(capabilities, specs, browser)` của WDIO chạy **sau** khi phiên đã tạo (xác nhận tài liệu WDIO chính thức: `before` có `browser`, tức phiên đã mở; `onPrepare` chạy trước mọi phiên). Nếu `AIMTAP_APP_PATH`/... rỗng, WDIO tạo phiên với capabilities rỗng → Appium ném lỗi cấp giao thức lúc tạo phiên → worker hỏng → `before` (và guard) không bao giờ chạy. Guard không đạt mục đích; tính chất ADR-009 §Hệ quả không thỏa ở tầng này.

**Cách sửa (thống nhất SA + Team Lead):** phép kiểm hiện diện `AIMTAP_*` có hai vị trí, không loại trừ nhau:
- **Nhà chính — pha tiền điều kiện CLI (US-4.3):** CLI dựng `AIMTAP_*` từ AppConfig + `DeviceContext` đã validate + secret ký mã, rồi assert đủ khóa bắt buộc theo `CapabilityKind` **trước khi khởi chạy testrunner** — cùng chỗ với `checkEnvironment`/`verifyTestDataComplete`/`ensureReadyBeforeRun` (`sequence-diagrams.md` §1). Đây là nơi kiến trúc đúng: chặn trước cả khi spawn worker, đồng vị với nơi các biến được dựng. `missingCapabilityEnv` đã export ở `src/runner/index.ts`.
- **Lưới an toàn — `onPrepare()` của `AimtapService` (fix ngay cho US-3.4):** hook launcher chạy trước mọi phiên; gọi `assertCapabilityEnv`. Bảo vệ đường dev chạy thẳng `npx wdio run config/...` (bỏ qua CLI). Đăng ký sink tên màn hình **giữ ở worker `before`** (cần tiến trình worker nơi Locator sống) — tách hai việc.
- **Bỏ guard khỏi `onSessionStart`/`before`:** ở đó nó chạy sau khi phiên đã tạo nên tạo cảm giác an toàn giả.

Không cần ADR mới (lỗi hiện thực nghịch ADR-009 đã có, không đổi quyết định). `sequence-diagrams.md` §1 nay ghi phép kiểm `AIMTAP_*` trong pha tiền điều kiện CLI và lưới an toàn `onPrepare`.

**Phân rã:**
- [x] US-3.4 (fix ngay, `ab3b680`) — **SA verified**: `AimtapService.onPrepare()` gọi `assertCapabilityEnv`; guard bỏ khỏi `before`/`onSessionStart`, sink giữ ở `before`; config sim/device đăng ký service kèm `capabilityKind`. Test khẳng định `onPrepare` guard + `before` không guard; gate xanh. Xác nhận WDIO gọi `onPrepare` ở launcher trước phiên: `@wdio/utils` 9.30.0 `initializeLauncherService` khởi tạo service đăng ký **inline dạng class** trong tiến trình launcher (nhánh `typeof service === "function" && !serviceName`), nên launcher hook chạy — quy tắc "phải có `launcher` export riêng" chỉ áp cho service đăng ký bằng tên package. **Không tháo `onPrepare` khỏi class này** dựa trên tài liệu chung.
- [x] US-4.3 (nhà chính): `launchRun` (`src/runner/launch-run.ts`) dựng `AIMTAP_*` từ AppConfig + DeviceContext đã validate và **assert trước khi gọi wdio** (ADR-009/ADR-018); test khẳng định thiếu khóa → PlatformFailure. `onPrepare` (US-3.4) là lưới an toàn cho đường `wdio run` trực tiếp. Cả hai xong → chờ SA verify để đóng.
- Đóng open-item khi cả hai phần xong; SA verify.

### CẦN SA + TEAM-LEAD LÀM: Implement US-4.3 launch/progress theo ADR-018 (**Accepted**) — ranh giới tiến trình CLI ↔ testrunner
Phát hiện lúc mở US-4.3. Chuỗi tiền điều kiện và assert `AIMTAP_*` chạy trong tiến trình CLI thì rõ và làm được. Nhưng phần **khởi chạy testrunner + hiển thị tiến trình** đụng ranh giới tiến trình CLI ↔ worker mà thiết kế chưa định nghĩa:

- **`startRun` không tồn tại.** TICKET-021 trỏ `interface-spec.md ... startRun`, nhưng `interface-spec.md` không có interface Test Runner nào cho việc khởi chạy; không có `startRun` trong code lẫn tài liệu. Cần chốt: CLI gọi thẳng `@wdio/cli` `Launcher(configPath).run()`, hay Test Runner phơi một hàm khởi chạy? Đặt ở đâu?
- **Luồng tiến trình worker → CLI chưa có cơ chế.** `run-session` (TICKET-019) phát `ProgressEvent` qua callback `onProgress` **trong tiến trình worker**; `progress-view` lại đặt ở CLI Entry (`component-design.md` §CLI Entry) và "nhận luồng sự kiện tiến trình từ Test Runner (`startRun`)". Không có cầu nối nào bắc `ProgressEvent` từ worker sang tiến trình CLI. Các khả năng — **thuộc quyết định của SA**:
  - (a) `progress-view` là một **WDIO reporter tùy biến** chạy trong worker, in tiến trình thẳng ra terminal QC (dùng lại cơ chế báo cáo của testrunner — ADR-013 §Ưu điểm). Khi đó `progress-view` **không** phải bộ tiêu thụ ở tiến trình CLI như `component-design` mô tả.
  - (b) Gom ở phía launcher qua thông điệp/`onWorkerEnd` của WDIO (thô, theo worker chứ không theo từng test case).
  - (c) Cơ chế khác (tệp/socket).
- **run-id cho báo cáo cuối lượt.** `sequence-diagrams.md` §1 ghi `run-id` sinh ở hook `before` trong worker và **về CLI qua luồng sự kiện** (ADR-013). Nếu vậy, CLI cần chính cầu nối chưa-định-nghĩa ở trên mới biết `run-id` để gọi Reporter sinh báo cáo cuối lượt (UC-06 bước 7). Phương án thay thế: CLI **sinh `run-id` và tiêm vào worker qua env** (xác định, đơn giản) — nhưng việc này **đổi TICKET-019** (`run-session` đang tự sinh `run-id`) và nghịch mô tả sequence §1, nên là quyết định thiết kế của SA.

Mâu thuẫn cần SA gỡ: ADR-013 nói "dùng lại cơ chế báo cáo có sẵn của testrunner" (nghiêng về reporter trong worker), còn `component-design` §CLI Entry đặt `progress-view` ở tiến trình CLI tiêu thụ luồng từ `startRun`. Hai chỗ không khớp về nơi `progress-view` sống và cách sự kiện qua ranh giới tiến trình.

**SA xử lý (2026-08-03) → ADR-018 (Accepted, Product Owner ủy quyền Team Lead duyệt).** Kiểm chứng mô hình tiến trình WDIO từ nguồn (Launcher lập trình `@wdio/cli`, reporter chạy trong worker, env kế thừa xuống worker; `run-session` nhận `newRunId` tiêm vào nên không đụng mã đã merge). Chốt hướng gỡ cả ba + mâu thuẫn ADR-013↔component-design:
1. **Khởi chạy:** CLI = tiến trình launcher; Test Runner phơi `launchRun(options): Promise<RunOutcome>` bọc `new Launcher(configPath,args).run()`. Bỏ `startRun` (không tồn tại).
2. **Tiến trình:** `progress-view` là **reporter WDIO trong worker** (Phương án a), in per-test ra terminal — dùng lại cơ chế báo cáo testrunner (ADR-013), không cầu nối xuyên tiến trình. `progress-view` rời CLI Entry sang module Test Runner.
3. **run-id:** CLI sinh `run-id`, tiêm qua env `AIMTAP_RUN_ID`; worker cấp `newRunId` cho `run-session` từ env; CLI dùng chính run-id đó sinh báo cáo cuối lượt (đường của `aimtap report`). Không đổi mã merged.

**ADR-018 → Accepted (2026-08-03).** Product Owner ủy quyền Team Lead rà soát kỹ thuật; Team Lead duyệt: cả ba quyết định (launchRun / reporter worker / run-id qua env) đúng kỹ thuật, gỡ đúng mâu thuẫn ADR-013↔component-design, không đụng mã đã merge (`run-session` vốn nhận `newRunId` tiêm vào). Còn lại:
- [ ] SA đồng bộ tài liệu tham chiếu: `interface-spec.md` §Test Runner (thêm `launchRun(options): Promise<RunOutcome>`, bỏ `startRun`), `component-design.md` §CLI Entry/§Test Runner (`progress-view` → reporter worker), `sequence-diagrams.md` §1/§3/§4 (run-id CLI qua env; báo cáo cuối lượt do CLI), ghi chú nguồn run-id ở ADR-013.
- [x] Team Lead chỉnh TICKET-021/022 theo ADR-018 và implement US-4.3 (branch `us/4-3-cli-run-progress`): `launchRun`, `progress-reporter` (reporter worker), `run.ts` (tiền điều kiện + assert + scope + báo cáo cuối lượt), worker `run-assembly` + `AimtapService.after`. 171 test xanh; smoke `aimtap run` reject tiền điều kiện đúng. Chờ SA đồng bộ doc tham chiếu + verify.
Đóng open-item khi cả hai xong; SA verify. Có thể implement song song với việc SA đồng bộ doc (ADR-018 là thiết kế thẩm quyền).

## Đã xử lý

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

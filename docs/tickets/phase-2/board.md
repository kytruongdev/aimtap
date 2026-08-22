# Board — Phase 2 (hướng B: nền tảng tự gọi AI CLI ngoài)

Phân cấp: **Epic → User Story → Ticket** (`conventions.md`). Mỗi user story là một tệp `us-*.md` chứa ticket inline, và là một pull request; mỗi ticket là một commit. Mỗi user story link về US nghiệp vụ của BA ở field "Business US (BA)".

Chẻ theo Phương án A (lát mỏng theo module, như Phase 1): **3 epic → 14 user story → 24 ticket** (TICKET-028→051), phủ US-201..210 (BA). Thiết kế: ADR-024 (heal_event + status hai giá trị), ADR-025 (subprocess `claude -p` + port `CodeAgent`), ADR-026 (token env + setup/doctor), ADR-027 (`Locator` là kiểu kernel ở `shared`), ADR-028 (generate = phiên agent qua Appium MCP); `docs/architecture/phase-2/`.

**Tiến độ:** Core Phase 2 (US-6.1..6.3, 7.1..7.5, 8.1..8.3) **đã implement + merge** trên mô hình generate cũ (DESC + page source dump tay). **US-6.4** (setup tự cài Claude Code) — Todo. **Re-work theo ADR-028 (2026-08-22):** bước `generate` đổi sang **agentic** (QC chỉ đưa mô tả; AI tự lái app qua Appium MCP lấy locator). US-8.1/US-8.2 re-ticket sang mô hình agentic (thêm TICKET-049 transport `runGenerateSession`); thêm **US-6.6** (kiểm/cài Appium MCP server ở setup/doctor); US-6.5 bỏ `PAGE`. Các US này về trạng thái re-work — Todo.

---

## Epic và user story thuộc nó

### EPIC-6 — Nền AI: gọi CLI & môi trường
Cấu hình AI theo app, token AI CLI, module `ai/` gọi subprocess, và lệnh setup/doctor. Nền cho mọi phần AI.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-6.1 | Cấu hình AI theo app + token AI CLI | 028, 029 | US-205, US-210 |
| US-6.2 | AI Gateway: port CodeAgent + adapter Claude Code | 030, 031 | US-201, US-206 |
| US-6.3 | Lệnh setup + doctor kiểm AI CLI | 032, 033 | US-210 |
| US-6.4 | `setup` tự cài Claude Code khi vắng | 046 | US-210 |
| US-6.5 | Lệnh tiện dụng: dựng app mới + wrap generate | 047, 048 | — (DX vận hành) |
| US-6.6 | Kiểm/cài Appium MCP server (generate agentic) | 050, 051 | US-210 |

### EPIC-7 — Tự phục hồi locator lúc chạy
Lưu heal_event, suy luận locator qua AI + vòng thử phục hồi, ghi nhận/ảnh, hiển thị báo cáo, và lắp ráp khép mạch.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-7.1 | Lưu trữ heal_event | 034, 035 | US-202, US-203 |
| US-7.2 | Suy luận locator + vòng thử phục hồi | 045, 036, 037 | US-201 |
| US-7.3 | Ghi nhận & chụp ảnh lần tự phục hồi | 038 | US-202 |
| US-7.4 | Trục trạng thái hai giá trị + hiển thị heal | 039, 040 | US-202, US-203 |
| US-7.5 | Lắp ráp healer vào lượt chạy | 041 | US-201, US-205 |

### EPIC-8 — Sinh test case với AI
Sinh test case qua AI CLI, lệnh generate, và quy trình rà soát test AI sinh.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-8.1 | Sinh test case qua phiên agent (agentic, Appium MCP) | 049, 042 | US-206, US-209 |
| US-8.2 | Lệnh generate (agentic) | 043 | US-206 |
| US-8.3 | Quy trình xác nhận & rà soát test AI sinh | 044 | US-207, US-208, US-209 |

---

## Thứ tự thực thi và phụ thuộc (cấp user story = cấp PR)

| User story | Phụ thuộc | Song song với | Trạng thái |
|---|---|---|---|
| US-6.1 | — | US-7.1 | Merged |
| US-7.1 | — | US-6.1 | Merged |
| US-6.2 | US-6.1 | US-6.3, US-7.1 | Merged |
| US-6.3 | US-6.1 | US-6.2, US-7.1 | Merged |
| US-7.3 | US-7.1 | US-6.2, US-6.3, US-7.4 | Merged |
| US-7.4 | US-7.1 | US-7.2, US-7.3, US-8.1 | Merged |
| US-7.2 | US-6.2 | US-7.3, US-7.4, US-8.1 | Merged |
| US-8.1 | US-6.2 | US-7.2, US-7.3, US-7.4 | Merged (mô hình cũ) → **Todo: re-work ADR-028** |
| US-7.5 | US-6.2, US-7.2, US-7.3 | US-8.1, US-8.2 | Merged |
| US-8.2 | US-8.1, US-6.1 | US-7.5 | Merged (mô hình cũ) → **Todo: re-work ADR-028** |
| US-8.3 | US-8.1 | (bất kỳ sau US-8.1) | Merged (không đổi) |
| US-6.4 | US-6.3 | US-6.5, US-6.6 | Todo |
| US-6.5 | US-8.2 | US-6.4, US-6.6 | Todo (TICKET-048 re-work ADR-028) |
| US-6.6 | US-6.3, US-6.4 | US-8.1, US-8.2 | Todo |

**Trình tự merge đề xuất (core — đã thực hiện, giữ làm tham chiếu):**
1. Song song nền: **US-6.1** (cấu hình + token) và **US-7.1** (store heal_event) — độc lập, mỗi story một PR.
2. **US-6.2** (AI Gateway core) sau US-6.1; song song **US-6.3** (setup/doctor).
3. **US-7.3** (evidence, cần US-7.1) và **US-7.4** (status hai giá trị + báo cáo, cần US-7.1) — song song.
4. **US-7.2** (heal-invoker + locator loop, cần US-6.2) và **US-8.1** (generate-invoker, cần US-6.2) — song song.
5. **US-7.5** — điểm hội tụ khép mạch tự phục hồi (cần US-6.2, US-7.2, US-7.3).
6. **US-8.2** (lệnh generate) và **US-8.3** (quy trình rà soát).

**Việc còn lại — trình tự re-work agentic (ADR-028), sau khi core đã merge:**
1. **US-8.1** re-work: TICKET-049 (transport `runGenerateSession`) trước, rồi TICKET-042 (invoker agentic).
2. **US-8.2** re-work: lệnh `generate` bỏ `--page-source`, dựng cấu hình Appium MCP (cần US-8.1).
3. **US-6.6**: kiểm/cài Appium MCP ở doctor/setup (song song US-8.1/8.2; cần cho `generate` chạy thật).
4. **US-6.5** TICKET-048: `make generate` bỏ `PAGE` (cần US-8.2).

Dev nên bắt đầu re-work từ **US-8.1** (TICKET-049 → TICKET-042).

## Phụ thuộc cấp ticket (trong và giữa user story)

| Ticket | User story | Phụ thuộc ticket |
|---|---|---|
| 028 | US-6.1 | — |
| 029 | US-6.1 | — |
| 030 | US-6.2 | 029 |
| 031 | US-6.2 | 030 |
| 032 | US-6.3 | 029 |
| 033 | US-6.3 | 029 |
| 034 | US-7.1 | — |
| 035 | US-7.1 | 034 |
| 045 | US-7.2 | — |
| 036 | US-7.2 | 031, 045 |
| 037 | US-7.2 | 036 |
| 038 | US-7.3 | 035 |
| 039 | US-7.4 | 034 |
| 040 | US-7.4 | 035, 039 |
| 041 | US-7.5 | 037, 038, 030 |
| 049 | US-8.1 | 031 |
| 042 | US-8.1 | 049 |
| 043 | US-8.2 | 042, 028 |
| 044 | US-8.3 | 042 |
| 046 | US-6.4 | 032 |
| 047 | US-6.5 | — |
| 048 | US-6.5 | 043 |
| 050 | US-6.6 | 033 |
| 051 | US-6.6 | 032, 046 |

## Ghi chú

- **Không phụ thuộc vòng** ở cả cấp user story lẫn ticket. Phụ thuộc đi xuôi theo cột "Phụ thuộc" của `north-star.md` §2.
- **Module mới `ai/` (ADR-025):** thêm vào `eslint.config.ts` (phần tử + entry-point + element-types). Dependency: `ai → shared, config` — **không** cạnh `ai → locator`. Kiểu `Locator` + enum `LocatorStrategy` nâng lên `shared` (**ADR-027**); bước move ở US-7.2 TICKET-045; AI Gateway parse đầu ra heal thành object `Locator` từ shape Zod (kiểu ở `shared`).
- **Không tạo chu trình Locator↔AI/Evidence:** healer và heal sink **tiêm** vào Locator Resolver (cùng pattern `registerScreenSink` của ADR-014). Lắp ráp (US-7.5) là nơi duy nhất nối AI Gateway ↔ Locator ↔ Evidence. Cạnh `runner → ai` thêm ở US-7.5; `cli → ai` thêm ở US-8.2 (component-design §Ghi-chú-lắp-ráp).
- **Trục trạng thái hai giá trị (ADR-024):** narrowing `TestCaseStatus` (`passed_healed` → bỏ) gom trong **US-7.4** vì nó chạm cả `store` (models/query) lẫn `reporter` (đếm/hiển thị) — tách narrowing khỏi reporter sẽ để một PR không build được. US-7.1 chỉ thêm (additive), không đổi status.
- **Migration status CHECK:** giữ `CHECK` cũ permissive ở `test_case_result`, không rebuild bảng (Phase 1 chưa từng ghi `passed_healed`); trục hai giá trị siết ở tầng kiểu TypeScript. Chọn theo `erd.md` §Thay-đổi-test_case_result (quyền Team Lead ở migration).
- **Công tắc AI theo app** ở `AppConfig.ai` (registry, US-6.1); tầng lắp ráp (US-7.5) và lệnh generate (US-8.2) đọc rồi truyền vào AI Gateway. AI Gateway KHÔNG import `registry` (giữ dependency set component-design §AI-Gateway); đường `run` tiêm `AIMTAP_AI_ENABLED`/`AIMTAP_AI_HEAL_RETRIES` qua env (pattern `AIMTAP_*` sẵn có).
- **Không tích hợp git/PR trong `src/`** (ADR-025, BR-210): tự phục hồi ghi locator cũ→mới vào báo cáo; sinh test gắn tag `@ai-generated` + ghi file nháp. Con người mở PR (US-8.3).
- Phần chạm AI CLI thật (subprocess), chụp ảnh heal, và khép mạch đầu-cuối kiểm chứng thủ công trên simulator; logic quanh nó test đơn vị với giả lập (`conventions.md` §3.1).
- **Generate agentic (ADR-028) — re-work US-8.x + US-6.6:** bước `generate` đổi từ "QC dump page source tay + AI viết từ static page source" sang "QC chỉ đưa mô tả + AI tự lái app qua **Appium MCP** lấy locator". `CodeAgent` nhận **hai hình dạng gọi**: `invoke` (heal, một-lần read-only, KHÔNG đổi) và `runGenerateSession` (generate, phiên agent có MCP + quyền ghi giới hạn `apps/<app-id>/`). `generateTestCase` bỏ `pageSource`, nhận `mcp` + `writeDir`. Lệnh `generate` bỏ `--page-source`, dựng cấu hình Appium MCP từ `AppConfig` capabilities. Đổi hợp đồng transport + thêm công cụ ngoài đã do SA chốt (ADR-028, interface-spec §CodeAgent, sequence §2) — không chạm khuôn khổ ở tầng ticket. Heal (ADR-024) và mô hình run tất định KHÔNG đổi.
- **Appium MCP server là môi trường mới (US-6.6):** kiểm ở `doctor` (cảnh báo, không chặn run) + chuẩn bị ở `setup`. Package pin theo `north-star.md` §4 (`appium/appium-mcp`).

## Điểm đã đẩy về SA/BA

- **CẦN SA LÀM RÕ — ĐÃ GIẢI (ADR-027, 2026-08-20):** ranh giới kiểu `Locator` cho AI Gateway. SA chốt **PA1**: nâng kiểu `Locator` + enum `LocatorStrategy` lên `shared` (phạm vi = kiểu + enum, không phải bộ dựng); ma trận `{ from: ['ai'], allow: ['shared', 'config'] }` giữ nguyên, không cạnh `ai → locator`. Đã áp vào US-7.2 (thêm TICKET-045 làm bước move; TICKET-036 dùng kiểu từ `shared`).
- **Ghi chú SA — ĐÃ ĐỒNG BỘ (2026-08-20):** `coding-convention.md` §"Gọi Claude API"→"Gọi AI (qua AI CLI ngoài)" và `CLAUDE.md` §5 nay ghi "Mọi lời gọi AI PHẢI qua AI Gateway (port `CodeAgent`)... subprocess (ADR-025)". Không còn "Claude Client".

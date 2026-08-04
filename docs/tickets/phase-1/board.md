# Board — Phase 1

Phân cấp: **Epic → User Story → Ticket** (`conventions.md`). Mỗi user story là một tệp `us-*.md` chứa ticket inline, và là một pull request; mỗi ticket là một commit. Mỗi user story link về US nghiệp vụ của BA ở field "Business US (BA)".

Chẻ theo Phương án A (lát mỏng theo module): 5 epic → 17 user story → 27 ticket, phủ US-01→US-20 (BA).

**Tiến độ (2026-08-04):** 15/17 user story (25/27 ticket) đã merge vào master — thêm US-4.3 (CLI `run` + tiến trình, ADR-018). **EPIC-1, EPIC-2, EPIC-3 hoàn tất; EPIC-4 gần trọn.** US-4.4 (CLI `report`) đang làm.

---

## Epic và user story thuộc nó

### EPIC-1 — Nền tảng lõi
Hạ tầng không chạm thiết bị mà mọi thứ khác dựng lên: khung dự án, ranh giới module, lỗi/log dùng chung, cấu hình, khai báo ứng dụng, lưu trữ kết quả.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-1.1 | Khung dự án + shared kernel | 001, 002 | US-02 |
| US-1.2 | Cấu hình & bí mật | 003, 004 | US-19 |
| US-1.3 | App Registry | 005 | US-01, US-02 |
| US-1.4 | Result Store | 006, 007 | US-15, US-11, US-02 |

### EPIC-2 — Tương tác phần tử & bằng chứng
Điểm duy nhất tìm phần tử, và việc dựng bằng chứng thực thi của mỗi test case.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-2.1 | Locator Resolver | 011, 012 | US-03, US-04 |
| US-2.2 | Khối bằng chứng | 013, 014, 015 | US-13, US-14, US-18 |
| US-2.3 | Điều phối bằng chứng | 016 | US-13, US-14, US-15 |

### EPIC-3 — Thiết bị & vòng đời lượt chạy
Chuẩn bị thiết bị, kiểm tra sống của thiết bị, gắn bộ khung test và điều phối một lượt chạy.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-3.1 | Sẵn sàng thiết bị & cài build | 008, 009 | US-08 |
| US-3.2 | Probe thiết bị giữa lượt chạy | 010 | US-20 |
| US-3.3 | Bộ khung WDIO/Cucumber | 017 | US-05, US-06, US-03 |
| US-3.4 | Điều phối lượt chạy | 018, 019 | US-09, US-11, US-12, US-13, US-20 |

### EPIC-4 — Báo cáo & CLI
Sinh báo cáo một lượt chạy và các lệnh QC dùng: `doctor`, `run`, `report`, hiển thị tiến trình.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-4.1 | Sinh báo cáo | 024, 025 | US-16, US-17, US-18 |
| US-4.2 | Nền CLI + `doctor` | 020 | US-08 |
| US-4.3 | CLI `run` + tiến trình | 021, 022 | US-09, US-10, US-12 |
| US-4.4 | CLI `report` | 023 | US-16 |

### EPIC-5 — Nội dung thí điểm & quy trình giao hàng
Nội dung ứng dụng thí điểm để nghiệm thu đầu-cuối, và quy trình rà soát pull request.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-5.1 | Quy trình rà soát pull request | 027 | US-07 |
| US-5.2 | Ứng dụng thí điểm đầu-cuối | 026 | US-03, US-04, US-05, US-06 |

---

## Thứ tự thực thi và phụ thuộc (cấp user story = cấp PR)

| User story | Phụ thuộc | Song song với | Trạng thái |
|---|---|---|---|
| US-1.1 | — | — | **Done** |
| US-5.1 | US-1.1 | hầu hết | **Done** |
| US-1.2 | US-1.1 | US-1.3, US-1.4, US-2.1, US-2.2, US-3.3 | **Done** |
| US-1.3 | US-1.1 | US-1.2, US-1.4, US-2.1, US-2.2, US-3.3 | **Done** |
| US-1.4 | US-1.1 | US-1.2, US-1.3, US-2.1, US-2.2, US-3.3 | **Done** |
| US-2.1 | US-1.1 | US-1.2, US-1.3, US-1.4, US-2.2, US-3.3 | **Done** |
| US-2.2 | US-1.1 | US-1.2, US-1.3, US-1.4, US-2.1, US-3.3 | **Done** |
| US-3.3 | US-1.1 | US-1.2, US-1.3, US-1.4, US-2.1, US-2.2 | **Done** |
| US-2.3 | US-1.4, US-2.2 | US-3.1 | **Done** |
| US-3.1 | US-1.1, US-1.3 | US-2.3, US-4.1 | **Done** |
| US-3.2 | US-2.1, US-3.1 | — | **Done** |
| US-4.1 | US-1.4 | US-3.1, US-4.2 | **Done** |
| US-4.2 | US-1.1, US-3.1 | US-4.1 | **Done** |
| US-3.4 | US-1.4, US-2.1, US-2.3, US-3.1, US-3.2, US-3.3 | — | **Done** |
| US-4.3 | US-1.2, US-1.3, US-3.1, US-3.4, US-4.1, US-4.2 | — | **Done** |
| US-4.4 | US-4.1, US-4.2 | — | In progress |
| US-5.2 | US-1.3, US-2.1, US-3.3 (chạy được cần US-4.3) | — | Todo |

**Trình tự merge đề xuất:**
1. US-1.1 (nền móng) → US-5.1 (quy trình PR, sớm).
2. Song song: US-1.2, US-1.3, US-1.4, US-2.1, US-2.2, US-3.3 — mỗi story một dev, một PR.
3. US-2.3 (cần US-1.4, US-2.2) và US-3.1 (cần US-1.3).
4. US-3.2 (cần US-2.1, US-3.1).
5. US-4.1 (cần US-1.4) và US-4.2 (cần US-3.1) — song song.
6. US-3.4 — điểm hội tụ tích hợp.
7. US-4.3 (`run`) và US-4.4 (`report`).
8. US-5.2 — thí điểm, nghiệm thu đầu-cuối.

**Còn lại:** US-4.4 (đang làm — `aimtap report <run-id>`, dùng lại `generateReport` của Reporter); Todo — US-5.2 (thí điểm đầu-cuối, capstone). US-5.2 verify thật integration US-4.3 trên simulator; cần chốt app thí điểm.

## Phụ thuộc cấp ticket (trong và giữa user story)

| Ticket | User story | Phụ thuộc ticket |
|---|---|---|
| 001 | US-1.1 | — |
| 002 | US-1.1 | 001 |
| 003 | US-1.2 | 002 |
| 004 | US-1.2 | 003 |
| 005 | US-1.3 | 002 |
| 006 | US-1.4 | 002 |
| 007 | US-1.4 | 006 |
| 011 | US-2.1 | 002 |
| 012 | US-2.1 | 011 |
| 013 | US-2.2 | 002 |
| 014 | US-2.2 | 002 |
| 015 | US-2.2 | 002 |
| 016 | US-2.3 | 007, 013, 014, 015 |
| 008 | US-3.1 | 002 |
| 009 | US-3.1 | 005, 008 |
| 010 | US-3.2 | 009, 011 |
| 017 | US-3.3 | 001, 002 |
| 019 | US-3.4 | 007, 009 |
| 018 | US-3.4 | 010, 012, 016, 017, 019 |
| 024 | US-4.1 | 007 |
| 025 | US-4.1 | 024 |
| 020 | US-4.2 | 001, 008 |
| 021 | US-4.3 | 004, 005, 009, 019, 025 |
| 022 | US-4.3 | 019, 020 |
| 023 | US-4.4 | 020, 025 |
| 027 | US-5.1 | 001 |
| 026 | US-5.2 | 005, 012, 017 |

## Ghi chú

- Không có phụ thuộc vòng ở cả cấp user story lẫn cấp ticket; phụ thuộc đi xuôi theo cột "Phụ thuộc" của `north-star.md` §2.
- **ADR-015:** `wait-policy` chuyển từ `locator/` sang `shared/` (hạ tầng cắt ngang, dùng chung cho `find` và probe). Không thêm cạnh đồ thị. TICKET-010 (US-3.2) import `wait-policy` từ `shared`, không đụng `locator`.
- **ADR-016:** `AppFailure` mang `kind` (`step_execution` mặc định / `assertion`) để `failure-classifier` (TICKET-015) phân `failure_type` không cần match chuỗi. Cơ chế khẳng định nền tảng `assertExpectation` (`shared/assertion.ts`) gắn `kind = 'assertion'`; `PlatformFailure` đi qua nguyên trạng, không thành test case hỏng.
- **Chữ ký async Evidence Collector (US-2.3):** `onStepEnd(): void` (kích hoạt chụp, giữ promise), `onScenarioEnd(): Promise<TestCaseResult>` (await ảnh rồi lưu một giao dịch); SA duyệt, đã đồng bộ `interface-spec.md` §Evidence Collector và `sequence-diagrams.md` §2. TICKET-018 (US-3.4) `await onScenarioEnd` ở hook `afterScenario`.
- **US-3.3 (TICKET-017):** capabilities đọc giá trị theo lượt chạy từ biến môi trường `AIMTAP_*` (device, app build, ký mã, endpoint Appium); `cucumberOpts.timeout` lấy từ `wait-policy` (ADR-015); `ignoreUndefinedDefinitions:false` để câu thiếu step definition làm dừng. Hook vòng đời Cucumber ở US-3.4.
- **Kiểm hiện diện `AIMTAP_*` (review US-3.3/US-3.4):** hành vi US-3.3 giữ nguyên (mặc định env thiếu thành chuỗi rỗng — đúng ở tầng này theo ADR-014, không sửa TICKET-017). Guard phải chạy **trước-phiên**: đặt ở `AimtapService.onPrepare()` (hook launcher), **không** ở `before` (chạy sau khi phiên đã tạo — SA review 2026-08-02). Hai vị trí không loại trừ nhau: **nhà chính** là pha tiền điều kiện CLI (US-4.3, `sequence-diagrams.md` §1); **lưới an toàn** là `onPrepare` cho đường `npx wdio run config/...`. Thiếu khóa bắt buộc theo `CapabilityKind` → `PlatformFailure` liệt kê khóa thiếu, dừng sớm (ADR-009), không thành test case hỏng (ADR-016). *Populate* do CLI US-4.3 ráp từ `AppConfig` + `DeviceContext` đã validate + secret ký mã. US-1.2 (TICKET-003) ghi rõ `AIMTAP_*` không vào schema tĩnh.
- Theo ADR-013, Test Runner phản ứng qua hook (framework điều khiển vòng lặp). Trong US-3.4, TICKET-018 (cucumber-hooks) đọc/ghi trạng thái và cờ dừng do TICKET-019 (run-session) giữ, nên 018 phụ thuộc 019.
- Theo ADR-014, Test Runner tiêm sink tên màn hình vào Locator Resolver lúc mở phiên (quan hệ một chiều Test Runner → Locator, phá chu trình). Vì vậy TICKET-018 phụ thuộc TICKET-012 (`registerScreenSink`), và US-3.4 phụ thuộc US-2.1.
- US-4.3 phụ thuộc US-4.1 vì cuối một lượt chạy `run` tự sinh báo cáo (UC-06 bước 7, sequence-diagram §3).
- US-5.2 (thí điểm) khai báo phụ thuộc kỹ thuật US-1.3/2.1/3.3 để viết được nội dung; để **chạy** đầu-cuối cần luồng `run` ở US-4.3 nên xếp cuối.

## Điểm đã đẩy về SA/BA

Không có mục đang mở (`open-items.md` "Đang mở" trống). Các mục đã giải: ma trận phụ thuộc (ADR-014), mô hình Test Runner (ADR-013), vị trí wait-policy (ADR-015), discriminant loại lỗi (ADR-016), chữ ký async Evidence Collector (interface-spec §Evidence Collector), kiểm hiện diện `AIMTAP_*` (đặt ở US-3.4 TICKET-018, không sửa US-3.3). Còn treo — quyết định thư viện CLI (Product Owner/SA), cần trước US-4.2.

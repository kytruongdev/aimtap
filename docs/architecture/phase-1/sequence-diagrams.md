# Sequence Diagrams — Phase 1

Sơ đồ tương tác cho các luồng chính của Phase 1. Điểm có thể thất bại và cách xử lý ghi dưới mỗi sơ đồ.

---

## 1. Khởi chạy lượt chạy và kiểm tra tiền điều kiện (UC-06)

```mermaid
sequenceDiagram
    participant QC
    participant CLI as CLI Entry
    participant Cfg as Config & Secrets
    participant Reg as App Registry
    participant Dev as Device & Build Manager
    participant WDIO as WDIO/Cucumber
    participant Runner as Test Runner
    participant Store as Result Store

    QC->>CLI: aimtap run <app-id> [--scope]
    CLI->>Reg: loadAppConfig(app-id)
    Reg-->>CLI: AppConfig (hoặc PlatformFailure: khai báo sai)
    CLI->>Dev: checkEnvironment() — host tools Node/Xcode/Appium
    Dev-->>CLI: ok, hoặc PlatformFailure gom mọi host tool thiếu
    CLI->>Cfg: verifyTestDataComplete(app-id)
    Cfg-->>CLI: ok | missing[]
    CLI->>Dev: ensureReadyBeforeRun(AppConfig)
    Dev-->>CLI: DeviceContext (hoặc PlatformFailure: thiết bị/OS/build)
    CLI->>Dev: installBuild()
    CLI->>WDIO: khởi chạy testrunner (scope → bộ lọc Cucumber, DeviceContext)
    WDIO->>Runner: before (đầu phiên worker)
    Runner->>Runner: sinh run-id
    Runner->>Store: saveRunStart(run)
    Runner-->>CLI: run-id + luồng sự kiện tiến trình
```

Điểm thất bại: bất kỳ kiểm tra tiền điều kiện nào không thỏa (host tools, khai báo, dữ liệu kiểm thử thiếu, thiết bị/OS/bản build) làm lượt chạy **không mở**, không sinh bản ghi, không sinh báo cáo; lý do nêu theo từng mục (BR-015, FR-APP-04, UC-06 E1). `checkEnvironment` không kèm target kiểm host tools Node/Xcode/Appium (độc lập ứng dụng); `ensureReadyBeforeRun` sở hữu thiết bị/OS/bản build và trả `DeviceContext` — hai bên không kiểm trùng (§2.2, `component-design.md` §Device & Build Manager). Tập chạy rỗng cũng không mở lượt chạy (UC-06 E2). Tiền điều kiện chạy trong tiến trình CLI trước khi khởi chạy testrunner; `run-id` sinh trong hook `before` ở tiến trình worker và về CLI qua luồng sự kiện, không phải giá trị trả đồng bộ (ADR-013).

---

## 2. Thực thi một test case và thu thập bằng chứng (UC-07)

```mermaid
sequenceDiagram
    participant WDIO as WDIO/Cucumber
    participant Runner as Test Runner
    participant Dev as Device & Build Manager
    participant Steps as Step Definition
    participant PO as Page Object
    participant Res as Locator Resolver
    participant Appium
    participant Ev as Evidence Collector
    participant Store as Result Store

    WDIO->>Runner: beforeScenario (mỗi test case)
    Runner->>Dev: probeDuringRun(session)
    Dev-->>Runner: ready
    loop mỗi bước trong test case
        Steps->>PO: hành vi nghiệp vụ
        PO->>Res: find(locator, screenName)
        Res->>Runner: setCurrentScreen(screenName)
        Res->>Appium: tìm phần tử (wait-policy)
        Appium-->>Res: phần tử | lỗi không tìm thấy
        Steps->>Ev: onStepEnd(kết quả bước)
        alt bước hỏng
            Ev->>Appium: chụp màn hình
            Ev->>Ev: phân loại lỗi (BR-014), đọc màn hình hiện tại
        end
    end
    WDIO->>Runner: afterScenario
    Runner->>Ev: onScenarioEnd(test case)
    Ev->>Store: saveTestCaseResult(result, steps) [giao dịch]
```

Điểm thất bại: bước hỏng ⇒ test case `failed`, không chạy các bước còn lại, nhưng lượt chạy tiếp tục (BR-002). Lỗi khi chụp ảnh/ghi nhật ký được bắt trong Evidence Collector, đánh dấu `evidence_missing`, không đổi trạng thái test case (BR-004). Mất phiên giữa test case ⇒ `failed` loại `step_not_executed`; việc dừng lượt chạy do probe ở lần kiểm tra kế tiếp quyết định (UC-07 E2, BR-018). WDIO/Cucumber điều khiển việc lặp qua test case và gọi các hook; nền tảng không tự lặp (ADR-013).

---

## 3. Dừng lượt chạy khi thiết bị không còn sẵn sàng (UC-06 E4, BR-018)

```mermaid
sequenceDiagram
    participant WDIO as WDIO/Cucumber
    participant Runner as Test Runner
    participant Dev as Device & Build Manager
    participant Store as Result Store
    participant Reporter

    WDIO->>Runner: beforeScenario
    Runner->>Dev: probeDuringRun(session)
    Dev-->>Runner: unavailable
    Runner->>Runner: bật cờ dừng (device_unavailable)
    loop mỗi test case còn lại
        WDIO->>Runner: beforeScenario
        Runner->>WDIO: bỏ qua (cờ dừng bật) — không sinh bản ghi
    end
    WDIO->>Runner: after (kết thúc phiên)
    Runner->>Store: finalizeRun(incomplete, device_unavailable, not_run_count)
    Runner->>Reporter: sinh báo cáo lượt chạy chưa hoàn tất
```

Điểm thất bại: các test case chưa chạy **không** sinh bản ghi; số lượng ghi ở cấp lượt chạy (BR-012). Dữ liệu của các test case đã hoàn tất giữ nguyên vì mỗi test case đã ghi theo giao dịch ngay khi kết thúc (ADR-003). Lượt chạy chưa hoàn tất **vẫn** sinh báo cáo (FR-REP-01). Hủy bởi QC bật cờ dừng với `stop_reason = cancelled_by_qc` qua tín hiệu ngắt (SIGINT), rồi đi cùng luồng bỏ qua và `finalizeRun` này (UC-06 E3, ADR-013).

---

## 4. Sinh báo cáo một lượt chạy (UC-08, FR-REP)

```mermaid
sequenceDiagram
    participant QC
    participant CLI as CLI Entry
    participant Reporter
    participant Store as Result Store
    participant Browser as Trình duyệt không giao diện

    QC->>CLI: aimtap report <run-id>
    CLI->>Reporter: buildReportModel(run-id)
    Reporter->>Store: getRunModel(run-id)
    Store-->>Reporter: run, results[], steps[]
    Reporter->>Reporter: dựng HTML từ mẫu + đọc tệp ảnh
    Reporter->>Browser: render HTML → PDF/PNG (ADR-012)
    Browser-->>Reporter: tệp báo cáo
    Reporter-->>QC: output/<app-id>/reports/<run-id>.<pdf|png>
```

Điểm thất bại: báo cáo sinh lại được bất kỳ lúc nào từ dữ liệu đã lưu, không cần chạy lại test case (ADR-003, ADR-006) — cùng luồng chạy tự động ở cuối lượt chạy và khi QC gọi `aimtap report`. Phần bằng chứng có `evidence_missing` được thể hiện là thiếu, không bỏ trống (BR-004, UC-08 E2). Báo cáo nhóm bảng tóm tắt theo test feature; mỗi test case hỏng kèm ảnh bước hỏng, nhật ký, tên màn hình, loại lỗi, thông báo lỗi gốc (FR-REP-02).

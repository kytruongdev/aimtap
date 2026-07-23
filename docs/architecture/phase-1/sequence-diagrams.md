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
    participant Runner as Test Runner
    participant Store as Result Store

    QC->>CLI: aimtap run <app-id> [--scope]
    CLI->>Reg: loadAppConfig(app-id)
    Reg-->>CLI: AppConfig (hoặc PlatformFailure: khai báo sai)
    CLI->>Cfg: verifyTestDataComplete(app-id)
    Cfg-->>CLI: ok | missing[]
    CLI->>Dev: ensureReadyBeforeRun(AppConfig)
    Dev-->>CLI: DeviceContext (hoặc PlatformFailure: thiết bị/build)
    CLI->>Dev: installBuild()
    CLI->>Runner: startRun(scope, DeviceContext)
    Runner->>Store: saveRunStart(run)
    Runner-->>CLI: run-id, tiến trình
```

Điểm thất bại: bất kỳ kiểm tra tiền điều kiện nào không thỏa (khai báo, dữ liệu kiểm thử thiếu, bản build, thiết bị) làm lượt chạy **không mở**, không sinh bản ghi, không sinh báo cáo; lý do nêu theo từng mục (BR-015, FR-APP-04, UC-06 E1). Tập chạy rỗng cũng không mở lượt chạy (UC-06 E2).

---

## 2. Thực thi một test case và thu thập bằng chứng (UC-07)

```mermaid
sequenceDiagram
    participant Runner as Test Runner
    participant Dev as Device & Build Manager
    participant Steps as Step Definition
    participant PO as Page Object
    participant Res as Locator Resolver
    participant Appium
    participant Ev as Evidence Collector
    participant Store as Result Store

    Runner->>Dev: probeDuringRun(session)
    Dev-->>Runner: ready
    Runner->>Steps: chạy test case kế tiếp
    loop mỗi bước
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
    Steps->>Ev: onScenarioEnd(test case)
    Ev->>Store: saveTestCaseResult(result, steps) [giao dịch]
```

Điểm thất bại: bước hỏng ⇒ test case `failed`, không chạy các bước còn lại, nhưng lượt chạy tiếp tục (BR-002). Lỗi khi chụp ảnh/ghi nhật ký được bắt trong Evidence Collector, đánh dấu `evidence_missing`, không đổi trạng thái test case (BR-004). Mất phiên giữa test case ⇒ `failed` loại `step_not_executed`; việc dừng lượt chạy do probe ở lần kiểm tra kế tiếp quyết định (UC-07 E2, BR-018).

---

## 3. Dừng lượt chạy khi thiết bị không còn sẵn sàng (UC-06 E4, BR-018)

```mermaid
sequenceDiagram
    participant Runner as Test Runner
    participant Dev as Device & Build Manager
    participant Store as Result Store
    participant Reporter

    Runner->>Dev: probeDuringRun(session)
    Dev-->>Runner: unavailable
    Runner->>Store: finalizeRun(incomplete, device_unavailable, not_run_count)
    Runner->>Reporter: sinh báo cáo lượt chạy chưa hoàn tất
```

Điểm thất bại: các test case chưa chạy **không** sinh bản ghi; số lượng ghi ở cấp lượt chạy (BR-012). Dữ liệu của các test case đã hoàn tất giữ nguyên vì mỗi test case đã ghi theo giao dịch ngay khi kết thúc (ADR-003). Lượt chạy chưa hoàn tất **vẫn** sinh báo cáo (FR-REP-01). Hủy bởi QC đi cùng luồng này với `stop_reason = cancelled_by_qc` (UC-06 E3).

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

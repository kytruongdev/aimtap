# ERD — Phase 1

Mô hình dữ liệu kết quả của Phase 1. Nơi lưu và thư viện truy cập theo ADR-003: SQLite cục bộ qua `better-sqlite3`, mỗi ứng dụng một tệp tại `output/<app-id>/results.db`. Chỉ ghi thêm, không ghi đè (BR-009, FR-DATA-05).

Ba thực thể: **Run** (một lượt chạy), **TestCaseResult** (kết quả một test case trong một lượt chạy), **StepLog** (một bước trong nhật ký thực thi). Ảnh chụp màn hình là tệp trên đĩa, không phải thực thể; bản ghi chỉ giữ đường dẫn tương đối (ADR-003, ADR-006).

Bối cảnh lượt chạy (phiên bản ứng dụng, thiết bị, hệ điều hành, thời điểm chạy) lưu một lần ở **Run**; bản ghi kết quả logic mà FR-DATA-03 mô tả là **TestCaseResult** ghép với bối cảnh của **Run** qua `run_id`. Vì dữ liệu chỉ ghi thêm, bối cảnh này cố định tại thời điểm chạy và không đổi về sau (BR-009). Hình dạng bản ghi logic dạng JSON ở `interface-spec.md` §Hợp đồng dữ liệu.

---

## Entity: Run

Truy vết: FR-RUN-01, FR-RUN-05, FR-RUN-06, FR-DEV-03, FR-REP-04, BR-009, BR-011, BR-012.

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| run_id | TEXT | PK | Định danh lượt chạy; gắn vào log, ảnh, báo cáo. |
| app_id | TEXT | NOT NULL | Định danh ứng dụng đã khai báo. |
| app_version | TEXT | NOT NULL | Phiên bản ứng dụng của bản build. |
| device_id | TEXT | NOT NULL | Định danh thiết bị. |
| device_type | TEXT | NOT NULL | `real` hoặc `simulator`. |
| os_version | TEXT | NOT NULL | Phiên bản hệ điều hành lúc chạy. |
| started_at | TEXT (ISO-8601) | NOT NULL | Thời điểm bắt đầu. |
| ended_at | TEXT (ISO-8601) | NULL khi đang chạy | Thời điểm kết thúc. |
| total_duration_ms | INTEGER | NULL khi đang chạy | Tổng thời lượng. |
| completion | TEXT | NOT NULL | `completed` hoặc `incomplete` (BR-012). Lượt chạy `TuChoi` không sinh bản ghi Run. |
| aggregate_result | TEXT | NULL khi chưa kết thúc | `passed` khi mọi test case đã chạy ở `passed`/`passed_healed`; ngược lại `failed` (BR-011). |
| scope_kind | TEXT | NOT NULL | `full_suite` hoặc `subset`. |
| scope_criteria | TEXT (JSON) | NULL khi `full_suite` | Tiêu chí chọn tập con: theo test feature, tên test case, hoặc nhãn (FR-RUN-02). |
| not_run_count | INTEGER | NOT NULL, mặc định 0 | Số test case chưa chạy khi `incomplete` (BR-012). |
| stop_reason | TEXT | NULL khi `completed` | `cancelled_by_qc` hoặc `device_unavailable` (FR-RUN-06, BR-018). |
| schema_version | INTEGER | NOT NULL | Phiên bản schema ghi bản ghi này. |

## Entity: TestCaseResult

Truy vết: FR-DATA-01, FR-DATA-03, FR-DATA-04, FR-EXEC-06, FR-EXEC-10, BR-001, BR-014, BR-016.

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | TEXT | PK | |
| run_id | TEXT | FK → Run, NOT NULL | FR-DATA-04. |
| app_id | TEXT | NOT NULL | Lặp lại từ Run để truy vấn trực tiếp theo ứng dụng (FR-DATA-04). |
| test_feature | TEXT | NOT NULL | Tên test feature (BR-016, SM-01). |
| test_case | TEXT | NOT NULL | Tên test case. |
| status | TEXT | NOT NULL | `passed`, `failed`, `passed_healed` (FR-EXEC-06, BR-001). |
| started_at | TEXT (ISO-8601) | NOT NULL | |
| duration_ms | INTEGER | NOT NULL | Thời lượng test case. |
| screen | TEXT | NULL khi `passed`/`passed_healed` | Tên màn hình tại bước hỏng (ADR-011). |
| failure_type | TEXT | NULL khi không `failed` | `wrong_conclusion` hoặc `step_not_executed` (BR-014). |
| error_message | TEXT | NULL khi không `failed` | Thông báo lỗi gốc tại bước hỏng (FR-EXEC-10). |
| evidence_missing | INTEGER (0/1) | NOT NULL, mặc định 0 | Đánh dấu bằng chứng thiếu do lỗi lúc thu thập (BR-004). |

Sự tồn tại của một bản ghi TestCaseResult đồng nghĩa test case đó đã được thực thi; test case chưa chạy không sinh bản ghi (FR-DATA-01, BR-012). `passed_healed` chỉ phát sinh từ Phase 2 nhưng nằm trong tập giá trị hợp lệ từ Phase 1 (ADR-003, ADR-004). Bản ghi không chứa giá trị dữ liệu kiểm thử (ADR-009, US-15).

## Entity: StepLog

Truy vết: FR-EXEC-03, FR-EXEC-04, BR-003, BR-004, BR-010.

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | TEXT | PK | |
| test_case_result_id | TEXT | FK → TestCaseResult, NOT NULL | |
| step_order | INTEGER | NOT NULL | Thứ tự bước trong test case. |
| step_text | TEXT | NOT NULL | Nội dung câu mô tả hành vi của bước (BR-010). |
| result | TEXT | NOT NULL | `passed` hoặc `failed`. |
| duration_ms | INTEGER | NOT NULL | Thời lượng bước. |
| error_message | TEXT | NULL trừ bước hỏng | Thông báo lỗi gốc tại bước hỏng. |
| screenshot_path | TEXT | NULL trừ bước hỏng và bước được đánh dấu cần chụp | Đường dẫn tương đối tới ảnh dưới `output/<app-id>/screenshots/<run-id>/` (BR-003). |

Chỉ bước hỏng và bước được đánh dấu tường minh mới có `screenshot_path`; test case đạt không sinh ảnh (BR-003). Khối lượng ảnh của một lượt chạy tỷ lệ với số test case hỏng, không với tổng số bước (ADR-006).

---

## Quan hệ

```
Run --(1:N)--> TestCaseResult: một lượt chạy gồm nhiều kết quả test case
TestCaseResult --(1:N)--> StepLog: một test case gồm nhiều bước trong nhật ký thực thi
```

- Xóa/ghi đè bị cấm ở tầng repository; một lượt chạy mới chỉ chèn thêm (FR-DATA-05, BR-009).
- Ghi một lượt chạy theo giao dịch: Run cùng TestCaseResult và StepLog của mỗi test case ghi ngay khi test case kết thúc (ADR-003, `coding-convention.md`), để một lượt chạy bị ngắt vẫn để lại dữ liệu phần đã chạy (BR-012).
- Các trường không cố định về sau (siêu dữ liệu self-healing của Phase 2) thêm bằng migration có đánh số, không sửa migration đã phát hành (ADR-003).

## Chỉ mục phục vụ truy vấn Phase 3

Không thuộc phạm vi truy vấn Phase 1, nhưng schema tạo sẵn để EP-20/EP-21 không phải đổi cấu trúc:
- TestCaseResult theo `(app_id, test_feature, test_case)` — tỷ lệ vượt qua theo test case/feature, phát hiện test case thiếu ổn định.
- TestCaseResult theo `(app_id, screen)` — màn hình hay hỏng.
- Run theo `(app_id, started_at)` — xu hướng theo thời gian.

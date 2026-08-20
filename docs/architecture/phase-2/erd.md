# ERD — Phase 2

Phase 2 thêm một thực thể **heal_event** (mỗi lần tự phục hồi một dòng) và đổi trục trạng thái của `test_case_result` sang kết luận hai giá trị (ADR-024). Các thực thể Phase 1 (`run`, `test_case_result`, `step_log`) giữ nguyên, trừ thay đổi ở `test_case_result.status` nêu dưới. Ship bằng một migration mới, không sửa migration đã phát hành (ADR-020).

## Entity: heal_event
Một lần tự phục hồi trong một lượt chạy — append-only, bất biến (BR-207).

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | TEXT | PK | định danh dòng |
| test_case_result_id | TEXT | NOT NULL, FK → test_case_result(id) | test case chứa lần tự phục hồi |
| step_order | INTEGER | NOT NULL | bước xảy ra tự phục hồi (BR-205) |
| screen | TEXT | NOT NULL | tên màn hình (Page Object) đang thao tác (ADR-011) |
| expected_locator | TEXT | NOT NULL | locator dự kiến đã hỏng (dạng chuỗi mô tả) |
| used_locator | TEXT | NOT NULL | locator thay thế AI đưa, đã dùng thành công |
| screenshot_path | TEXT | NULL cho phép | đường dẫn ảnh phần tử đã thao tác (BR-206); ảnh ngoài DB |
| occurred_at | TEXT | NOT NULL | thời điểm (ISO-8601) |

## Thay đổi trên Entity: test_case_result
| Field | Thay đổi | Ghi chú |
|---|---|---|
| status | `CHECK (status IN ('passed','failed'))` | bỏ `passed_healed` (ADR-024); kết luận do phép kiểm quyết định (BR-204). Không migrate dữ liệu — Phase 1 chưa từng ghi `passed_healed`. Siết `CHECK` cần rebuild bảng (SQLite không ALTER được CHECK); có thể để `CHECK` cũ permissive và ngừng ghi giá trị thứ ba — cách hiện thực do Team Lead chọn ở migration. |

"Đạt kèm tự phục hồi" **không** là giá trị lưu; nó là **nhãn dẫn xuất** ở tầng báo cáo: `status = 'passed'` AND tồn tại ≥1 `heal_event` của test case đó (ADR-024, BR-204).

## Quan hệ
```
run --(1:N)--> test_case_result : một lượt chạy gồm nhiều kết quả test case (Phase 1)
test_case_result --(1:N)--> step_log : một test case gồm nhiều bước (Phase 1)
test_case_result --(1:N)--> heal_event : một test case có 0..N lần tự phục hồi (Phase 2)
```

Một test case đạt có ≥1 `heal_event` → hiển thị nhãn "đạt kèm tự phục hồi". Một test case **hỏng** vẫn có thể có `heal_event` (BR-205) — biểu diễn được vì heal tách khỏi `status`.

## Ngoài phạm vi (chưa chốt)
Mức dùng AI theo lượt chạy (số lần gọi, token tiêu thụ) là **câu hỏi mở** (`srs.md` Phase 2 §3) — chưa thêm trường; nếu Product Owner muốn hiển thị, thêm một nhóm trường ở cấp `run` sau, không đổi các thực thể trên.

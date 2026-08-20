# Đặc tả hướng "AI nhúng bên trong nền tảng" — GIỮ CHO TƯƠNG LAI

Bộ tài liệu này là đặc tả nghiệp vụ **đầy đủ** cho hướng đưa AI vào nền tảng như một tác nhân **bên trong, khép kín**: nền tảng gọi AI qua khóa và tự làm — sinh test case, tự phục hồi locator lúc chạy, quản nhiều nhà cung cấp AI, có giao diện cấu hình.

## Trạng thái: KHÔNG phải hướng đang triển khai

Product team đã chọn hướng **dùng AI CLI bên ngoài** (do QC automation điều khiển) cho giai đoạn hiện tại. Đặc tả cho hướng đang triển khai nằm ở `docs/business/phase-2/`.

Bộ tài liệu này được **giữ nguyên vẹn** vì có giá trị và dự kiến áp dụng trong tương lai. Không sửa đổi; không dùng làm đầu vào thiết kế cho tới khi product team quyết định quay lại hướng này.

## Nội dung
- `srs.md` — yêu cầu chức năng và phi chức năng.
- `use-cases.md` — luồng công việc kèm sơ đồ.
- `user-stories.md` — user story kèm tiêu chí nghiệm thu.
- `business-rules.md` — quy tắc nghiệp vụ kèm sơ đồ vòng đời.

## Vì sao chọn hướng khác
Phân tích so sánh hai hướng và lý do quyết định: `../ai-integration-analysis.md`.

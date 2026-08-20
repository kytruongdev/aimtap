# Epic Map

Mỗi epic mô tả bằng một câu, nhóm theo stakeholder. Chi tiết bên trong epic thuộc Giai đoạn N.

Mã epic giữ ổn định để các tài liệu thiết kế tham chiếu được. Mã không liên tục khi một epic bị loại khỏi phạm vi.

Từ vựng trung tâm (test suite, test feature, test case, bước) định nghĩa ở `brd.md` §1.1. Một test case gồm hai phần: mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt từng câu mô tả. Cả hai phần đều nằm trong kho mã.

---

## QC

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-01 | [CORE] | Lấy locator của từng màn hình ứng dụng qua Appium Inspector để dùng cho test case. | 1 |
| EP-02 | [CORE] | Tổ chức locator của mỗi màn hình tập trung tại một nơi theo mô hình Page Object. | 1 |
| EP-03 | [CORE] | Soạn test case cho một luồng nghiệp vụ: viết mô tả hành vi bằng ngôn ngữ tự nhiên và cài đặt phần thực thi tương ứng. | 1 |
| EP-04 | [CORE] | Chuẩn bị thiết bị và cài bản build ứng dụng do lập trình viên cung cấp trước khi chạy. | 1 |
| EP-05 | [CORE] | Khởi chạy một lượt chạy trên một test suite và theo dõi tiến trình. | 1 |
| EP-06 | [CORE] | Ghi nhận bằng chứng thực thi cho mỗi test case: trạng thái, nhật ký các bước đã chạy kèm kết quả từng bước, và ảnh chụp màn hình tại bước hỏng. | 1 |
| EP-07 | [CORE] | Nhận báo cáo PNG/PDF của mỗi lượt chạy ở định dạng đính được vào Jira. | 1 |
| EP-08 | [CORE] | Đính báo cáo vào task Jira và cập nhật trạng thái pass/fail. | 1 |
| EP-09 | [NICE] | Chọn tập con test case để chạy thay vì chạy toàn bộ test suite. | 1 |
| EP-11 | [CORE] | Sinh test case từ mô tả bằng lời và page source của màn hình đích thông qua Claude. | 2 |
| EP-12 | [CORE] | Xác nhận test case thực hiện đúng điều đã mô tả, bằng cách đọc phần mô tả hành vi bằng ngôn ngữ tự nhiên, không cần đọc phần cài đặt. | 2 |
| EP-13 | [CORE] | Tự phục hồi test case khi một locator không tìm thấy lúc chạy, thay vì dừng test case giữa chừng. | 2 |
| EP-14 | [CORE] | Xem mỗi lần tự phục hồi trong báo cáo (kèm locator cũ→mới và ảnh phần tử AI đã dùng) để đánh giá AI đoán đúng không. | 2 |
| EP-15 | [CORE] | Con người tự cập nhật locator đúng vào Page Object và mở pull request được duyệt sau khi xem báo cáo tự phục hồi; nền tảng không tự tạo pull request. | 2 |
| EP-30 | [FUTURE] | Giao diện đồ họa xem báo cáo và thống kê chất lượng (gộp cùng lớp phân tích). | — |
| EP-16 | [CORE] | Soạn và chạy test case cho ứng dụng Android. | 3 |

## Reviewer

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-17 | [CORE] | Rà soát test case và Page Object trong pull request, phê duyệt hoặc trả lại kèm yêu cầu chỉnh sửa. | 1 |
| EP-18 | [CORE] | Phân biệt được test case do AI sinh với test case do người viết khi rà soát. | 2 |

## QC Lead

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-19 | [CORE] | Lưu bản ghi kết quả có cấu trúc cho mỗi test case trong mỗi lượt chạy để phục vụ phân tích về sau. | 1 |
| EP-20 | [CORE] | Truy vấn dữ liệu đã tích lũy để trả lời câu hỏi về tỷ lệ vượt qua theo thời gian, màn hình hay hỏng và test case thiếu ổn định. | 4 |
| EP-21 | [NICE] | Xem xu hướng chất lượng dưới dạng biểu đồ. | 4 |
| EP-22 | [FUTURE] | Tổng hợp dữ liệu kết quả từ nhiều máy QC vào một nơi. | — |

## Lập trình viên

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-23 | [CORE] | Nhận thông tin lỗi đủ để tái hiện: bước hỏng, nhật ký các bước đã chạy trước đó, ảnh chụp màn hình lúc hỏng, tên màn hình và loại lỗi. | 1 |

## Vận hành nền tảng

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-24 | [CORE] | Khai báo một ứng dụng cần kiểm thử vào nền tảng: định danh ứng dụng, bản build, thiết bị và phiên bản hệ điều hành đích, mà không phải sửa nền tảng. | 1 |
| EP-25 | [CORE] | Vận hành song song nhiều ứng dụng được kiểm thử trên cùng một nền tảng, mỗi ứng dụng có test suite và dữ liệu kết quả riêng. | 1 |
| EP-26 | [CORE] | Lưu token của AI CLI ngoài kho mã (cài một lần). | 2 |
| EP-27 | [CORE] | Bật hoặc tắt việc gọi AI bằng cấu hình. | 2 |
| EP-28 | [CORE] | Nền tảng gọi AI bằng cách chủ động gọi một AI CLI bên ngoài (như Claude Code). | 2 |
| EP-29 | [CORE] | Cài đặt và kiểm tra AI CLI cùng token trên máy (chọn CLI, lấy token, kiểm hiện diện). | 2 |

---

Chú thích:
- `[CORE]`: bắt buộc phải có trong MVP.
- `[NICE]`: nên có nhưng không chặn tiến độ.
- `[FUTURE]`: để dành cho sau, không nằm trong phạm vi hiện tại.

Cột "Giai đoạn" của epic `[FUTURE]` để trống vì chưa gắn vào lộ trình ba giai đoạn hiện tại.

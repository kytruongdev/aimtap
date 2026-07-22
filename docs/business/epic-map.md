# Epic Map

Mỗi epic mô tả bằng một câu, nhóm theo stakeholder. Chi tiết bên trong epic thuộc Giai đoạn N.

Mã epic giữ ổn định để các tài liệu thiết kế tham chiếu được. Mã không liên tục khi một epic bị loại khỏi phạm vi.

Một kịch bản gồm hai phần: mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt từng câu mô tả. Cả hai phần đều nằm trong kho mã.

---

## QC

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-01 | [CORE] | Lấy locator của từng màn hình ứng dụng qua Appium Inspector để dùng cho kịch bản. | 1 |
| EP-02 | [CORE] | Tổ chức locator của mỗi màn hình tập trung tại một nơi theo mô hình Page Object. | 1 |
| EP-03 | [CORE] | Soạn kịch bản kiểm thử cho một luồng nghiệp vụ: viết mô tả hành vi bằng ngôn ngữ tự nhiên và cài đặt phần thực thi tương ứng. | 1 |
| EP-04 | [CORE] | Chuẩn bị thiết bị và cài bản build ứng dụng do lập trình viên cung cấp trước khi chạy. | 1 |
| EP-05 | [CORE] | Khởi chạy một lượt chạy trên một bộ kịch bản và theo dõi tiến trình. | 1 |
| EP-06 | [CORE] | Ghi nhận bằng chứng thực thi cho mỗi kịch bản: trạng thái, nhật ký các bước đã chạy kèm kết quả từng bước, và ảnh chụp màn hình tại bước hỏng. | 1 |
| EP-07 | [CORE] | Nhận báo cáo PNG/PDF của mỗi lượt chạy ở định dạng đính được vào Jira. | 1 |
| EP-08 | [CORE] | Đính báo cáo vào task Jira và cập nhật trạng thái pass/fail. | 1 |
| EP-09 | [NICE] | Chọn tập con kịch bản để chạy thay vì chạy toàn bộ bộ kịch bản. | 1 |
| EP-11 | [CORE] | Sinh kịch bản từ mô tả bằng lời và page source của màn hình đích thông qua Claude. | 2 |
| EP-12 | [CORE] | Xác nhận kịch bản thực hiện đúng điều đã mô tả, bằng cách đọc phần mô tả hành vi bằng ngôn ngữ tự nhiên, không cần đọc phần cài đặt. | 2 |
| EP-13 | [CORE] | Tự phục hồi kịch bản khi một locator không tìm thấy lúc chạy, thay vì dừng kịch bản giữa chừng. | 2 |
| EP-14 | [CORE] | Nhận cảnh báo cho mỗi lần tự phục hồi và xác nhận hoặc bác bỏ locator được đề xuất. | 2 |
| EP-15 | [NICE] | Đưa locator đã xác nhận vào Page Object dưới dạng một thay đổi chờ phê duyệt. | 2 |
| EP-16 | [FUTURE] | Soạn và chạy kịch bản kiểm thử cho ứng dụng Android. | — |

## Reviewer kịch bản

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-17 | [CORE] | Rà soát kịch bản và Page Object trong pull request, phê duyệt hoặc trả lại kèm yêu cầu chỉnh sửa. | 1 |
| EP-18 | [CORE] | Phân biệt được kịch bản do AI sinh với kịch bản do người viết khi rà soát. | 2 |

## QC Lead

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-19 | [CORE] | Lưu bản ghi kết quả có cấu trúc cho mỗi kịch bản trong mỗi lượt chạy để phục vụ phân tích về sau. | 1 |
| EP-20 | [CORE] | Truy vấn dữ liệu đã tích lũy để trả lời câu hỏi về tỷ lệ vượt qua theo thời gian, màn hình hay hỏng và kịch bản thiếu ổn định. | 3 |
| EP-21 | [NICE] | Xem xu hướng chất lượng dưới dạng biểu đồ. | 3 |
| EP-22 | [FUTURE] | Tổng hợp dữ liệu kết quả từ nhiều máy QC vào một nơi. | — |

## Lập trình viên

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-23 | [CORE] | Nhận thông tin lỗi đủ để tái hiện: bước hỏng, nhật ký các bước đã chạy trước đó, ảnh chụp màn hình lúc hỏng, tên màn hình và loại lỗi. | 1 |

## Vận hành nền tảng

| Mã | Nhãn | Epic | Giai đoạn |
|---|---|---|---|
| EP-24 | [CORE] | Khai báo một ứng dụng cần kiểm thử vào nền tảng: định danh ứng dụng, bản build, thiết bị và phiên bản hệ điều hành đích, mà không phải sửa nền tảng. | 1 |
| EP-25 | [CORE] | Vận hành song song nhiều ứng dụng được kiểm thử trên cùng một nền tảng, mỗi ứng dụng có bộ kịch bản và dữ liệu kết quả riêng. | 1 |
| EP-26 | [CORE] | Lưu khóa API của Claude ngoài kho mã. | 2 |
| EP-27 | [CORE] | Bật hoặc tắt việc gọi Claude bằng cấu hình. | 2 |

---

Chú thích:
- `[CORE]`: bắt buộc phải có trong MVP.
- `[NICE]`: nên có nhưng không chặn tiến độ.
- `[FUTURE]`: để dành cho sau, không nằm trong phạm vi hiện tại.

Cột "Giai đoạn" của epic `[FUTURE]` để trống vì chưa gắn vào lộ trình ba giai đoạn hiện tại.

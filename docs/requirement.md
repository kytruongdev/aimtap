# Tài liệu Yêu cầu — Mobile Automation Testing Platform

*Yêu cầu đầu vào cho đội triển khai*

Tài liệu này cụ thể hóa đề xuất đã được phê duyệt thành các yêu cầu để đội thiết kế và xây dựng. Bối cảnh và lý do nằm ở tài liệu đề xuất; tài liệu này chỉ tập trung vào yêu cầu. Chi tiết kiến trúc và cách hiện thực sẽ thuộc các tài liệu thiết kế kỹ thuật riêng.

Tài liệu nghiệp vụ chuẩn của dự án là `docs/business/brd.md`. Khi hai tài liệu khác nhau, `brd.md` là căn cứ. Mã NFR-01 đến NFR-09 dùng chung giữa hai tài liệu và mang cùng nội dung; NFR-10 trở đi chỉ có ở tài liệu này.

---

## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Phạm vi](#2-phạm-vi)
- [3. Thuật ngữ](#3-thuật-ngữ)
- [4. Yêu cầu chức năng](#4-yêu-cầu-chức-năng)
- [5. Yêu cầu phi chức năng](#5-yêu-cầu-phi-chức-năng)
- [6. Ràng buộc và giả định](#6-ràng-buộc-và-giả-định)
- [7. Tiêu chí nghiệm thu theo giai đoạn](#7-tiêu-chí-nghiệm-thu-theo-giai-đoạn)

---

## 1. Tổng quan

Mục tiêu là xây dựng một nền tảng tự động hóa kiểm thử cho ứng dụng di động, chạy nội bộ trên máy của QC, dựa trên Appium kết hợp WebdriverIO, và bổ sung AI để hỗ trợ soạn test case và tự phục hồi test case. Nền tảng thay thế phần kiểm thử hồi quy đang làm thủ công.

Nền tảng là công cụ dùng chung, không gắn với một ứng dụng cụ thể. Mọi thông tin phụ thuộc ứng dụng được khai báo từ bên ngoài.

Việc triển khai chia thành bốn phase: phase 1 dựng nền tảng iOS cơ bản chưa có AI, phase 2 bổ sung AI, phase 3 bổ sung hỗ trợ Android, phase 4 bổ sung lớp phân tích. Mục tiêu go-live là nền tảng phủ cả iOS, Android và AI. Mỗi yêu cầu trong tài liệu được gắn nhãn phase tương ứng.

Quy ước: từ "phải" biểu thị yêu cầu bắt buộc. Mỗi yêu cầu có một mã để tiện tham chiếu và truy vết.

---

## 2. Phạm vi

**Trong phạm vi.** Khai báo một ứng dụng di động bất kỳ vào nền tảng; soạn test case (thủ công và có hỗ trợ AI); thực thi test case trên thiết bị iOS, cả thiết bị thật và simulator; kiểm thử ứng dụng Android (bổ sung ở phase 3); tự phục hồi test case khi giao diện thay đổi; xuất báo cáo cho mỗi lượt chạy; lưu dữ liệu kết quả để phân tích; và lớp phân tích xu hướng.

**Ngoài phạm vi.** Test case và tri thức nghiệp vụ của một ứng dụng cụ thể; máy chủ kết quả tập trung và tổng hợp dữ liệu xuyên nhiều máy QC; tích hợp vào quy trình CI/CD; dịch vụ thiết bị trên cloud; việc AI tự phê duyệt test case hay tự quyết định chất lượng; cơ chế đặt lại ứng dụng giữa các lượt chạy; cơ chế dọn dữ liệu do test case sinh ra trên môi trường test; chụp màn hình ở mọi bước của test case; chi tiết kiến trúc, cấu hình và quy ước viết mã (thuộc tài liệu thiết kế kỹ thuật).

---

## 3. Thuật ngữ

| Thuật ngữ | Giải thích |
|---|---|
| Test suite | Toàn bộ test case của một ứng dụng. |
| Test feature | Một luồng nghiệp vụ của ứng dụng; là nhóm chứa các test case. Ví dụ: Login, Signup. |
| Test case | Một trường hợp kiểm thử cụ thể với một kết quả mong đợi. Đây là đơn vị mang trạng thái đạt hoặc hỏng. Gồm hai phần: phần mô tả hành vi bằng ngôn ngữ tự nhiên, và phần cài đặt thực thi từng câu mô tả bằng WebdriverIO. |
| Bước (step) | Một câu mô tả hành vi bên trong một test case. |
| Tập chạy | Tập con test case được chọn để chạy trong một lượt chạy, thay cho toàn bộ test suite. |
| Mô tả hành vi | Phần của test case viết bằng ngôn ngữ tự nhiên, liệt kê các bước theo góc nhìn người dùng. Đây là phần được thực thi, không phải tài liệu đi kèm. |
| Dữ liệu kiểm thử | Các giá trị test case cần để đi đúng luồng: tài khoản, mật khẩu, và các giá trị nghiệp vụ khác. Test case tham chiếu tới chúng bằng tên; giá trị nằm ngoài kho mã. |
| Locator | Cách xác định một thành phần trên giao diện (nút, ô nhập...) để thao tác. |
| Page source | Bản mô tả cấu trúc giao diện của một màn hình, chứa định danh của các thành phần. |
| Page Object | Mẫu thiết kế tập trung toàn bộ locator của một màn hình vào một nơi. |
| Self-healing | Cơ chế tự tìm lại thành phần khi locator cũ không còn dùng được. |
| Lượt chạy (run) | Một lần thực thi test suite, hoặc một tập chạy được chọn từ nó. |
| Nhật ký thực thi | Bản ghi tuần tự các bước của một test case kèm kết quả từng bước, dùng để điều tra nguyên nhân hỏng. |
| Reviewer | Người rà soát test case trong pull request và phê duyệt trước khi merge. |

---

## 4. Yêu cầu chức năng

### 4.1. Soạn test case

| Mã | Yêu cầu | GĐ |
|---|---|---|
| FR-AUTH-01 | Hệ thống phải cho phép QC soạn test case gồm phần mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt thực thi bằng WebdriverIO chạy trên Appium. | 1 |
| FR-AUTH-02 | Hệ thống phải hỗ trợ QC lấy locator thật của từng màn hình qua Appium Inspector. | 1 |
| FR-AUTH-03 | Locator của mỗi màn hình phải được tập trung tại một nơi theo mô hình Page Object, không rải rác trong test case. | 1 |
| FR-AUTH-04 | Hệ thống phải cho phép sinh test case từ mô tả bằng lời và page source của màn hình đích, thông qua Claude. | 2 |
| FR-AUTH-05 | Mọi test case, dù do người viết hay AI sinh, phải được rà soát và phê duyệt qua pull request trước khi merge vào nhánh chính. | 1 |
| FR-AUTH-06 | Hệ thống phải đưa phần mô tả hành vi của test case tới QC để xác nhận test case thực hiện đúng điều đã mô tả, mà không cần đọc phần cài đặt. | 2 |
| FR-AUTH-09 | Mỗi test case phải thuộc về đúng một test feature. | 1 |
| FR-AUTH-10 | Test case phải tham chiếu tới dữ liệu kiểm thử bằng tên; giá trị nằm trong tệp cấu hình trên máy QC. Kho mã phải có một tệp mẫu liệt kê đầy đủ các mục dữ liệu cần điền, không mang giá trị thật. | 1 |

### 4.2. Chạy kiểm thử

| Mã | Yêu cầu | GĐ |
|---|---|---|
| FR-EXEC-01 | Hệ thống phải thực thi test case trên thiết bị iOS, cả thiết bị thật và simulator, qua WebdriverIO điều khiển Appium. | 1 |
| FR-EXEC-02 | Hệ thống phải cho phép cài bản build ứng dụng (`.ipa` hoặc `.app`) do lập trình viên cung cấp lên thiết bị trước khi chạy. | 1 |
| FR-EXEC-03 | Khi một test case hỏng, hệ thống phải chụp một ảnh màn hình tại thời điểm bước hỏng. Hệ thống không chụp màn hình ở các bước khác, trừ những bước được đánh dấu tường minh là cần chụp. | 1 |
| FR-EXEC-04 | Hệ thống phải ghi nhật ký thực thi cho mỗi test case: các bước đã chạy theo thứ tự, kết quả từng bước, và thông báo lỗi gốc tại bước hỏng. | 1 |
| FR-EXEC-05 | Lỗi phát sinh khi chụp màn hình hoặc ghi nhật ký không được làm thay đổi trạng thái của test case. Test case tiếp tục chạy và phần bằng chứng thiếu được ghi nhận là thiếu. | 1 |
| FR-EXEC-06 | Hệ thống phải ghi nhận trạng thái của từng test case đã được thực thi trong mỗi lượt chạy theo một trong ba giá trị: đạt, hỏng, hoặc đạt kèm tự phục hồi. Giá trị "đạt kèm tự phục hồi" chỉ phát sinh từ giai đoạn 2 nhưng nằm trong dữ liệu kết quả từ giai đoạn 1. | 1 |
| FR-EXEC-07 | Mỗi test case phải tự đưa ứng dụng về trạng thái nó cần ở bước mở đầu, không giả định trạng thái do lượt chạy trước để lại. Dữ liệu mà test case làm thay đổi hoặc tiêu thụ phải được sinh mới ở bước mở đầu. | 1 |
| FR-EXEC-08 | Khi một locator không tìm thấy lúc chạy, hệ thống phải gọi Claude để tìm lại thành phần tương ứng nhằm tránh dừng test case giữa chừng. | 2 |
| FR-EXEC-09 | Mỗi lần tự phục hồi phải được ghi lại và phát cảnh báo để QC xác nhận; hệ thống không được tự thay đổi test case một cách im lặng. | 2 |

### 4.3. Báo cáo và lưu trữ

| Mã | Yêu cầu | GĐ |
|---|---|---|
| FR-REP-01 | Hệ thống phải tạo báo cáo PNG/PDF cho mỗi lượt chạy. | 1 |
| FR-REP-02 | Báo cáo phải gồm bảng tóm tắt toàn lượt chạy nhóm theo test feature (tên test case, trạng thái, thời lượng), và với mỗi test case hỏng là ảnh chụp bước hỏng, nhật ký thực thi, tên màn hình, loại lỗi và thông báo lỗi gốc. | 1 |
| FR-REP-03 | Báo cáo phải ở định dạng để QC đính vào task trên Jira và cập nhật trạng thái pass/fail. | 1 |
| FR-DATA-01 | Hệ thống phải ghi một bản ghi kết quả dạng JSON cho mỗi test case đã được thực thi trong mỗi lượt chạy. | 1 |
| FR-DATA-02 | Bản ghi JSON phải được lưu vào SQLite trên máy QC. | 1 |
| FR-DATA-03 | Mỗi bản ghi phải chứa tối thiểu các trường: thời điểm chạy, phiên bản ứng dụng, thiết bị, hệ điều hành, tên test feature, tên test case, trạng thái, thời lượng, màn hình, loại lỗi và thông báo lỗi gốc. | 1 |

### 4.4. Phân tích

| Mã | Yêu cầu | GĐ |
|---|---|---|
| FR-ANL-01 | Hệ thống phải cho phép truy vấn dữ liệu kết quả để trả lời các câu hỏi xu hướng: tỷ lệ vượt qua theo thời gian, màn hình hay hỏng, test feature hay hỏng, test case thiếu ổn định. | 3 |
| FR-ANL-02 | Lớp phân tích phải đọc từ dữ liệu đã tích lũy trong SQLite, không yêu cầu thay đổi tầng chạy test. | 3 |

---

## 5. Yêu cầu phi chức năng

| Mã | Yêu cầu | GĐ |
|---|---|---|
| NFR-01 | Nền tảng phải chạy nội bộ trên máy QC, không yêu cầu máy chủ hay triển khai online. | 1 |
| NFR-02 | Kiểm thử iOS phải chạy trên máy macOS. | 1 |
| NFR-03 | Test case phải được chạy trên bản build chính thức và cho kết quả lặp lại, không phụ thuộc thứ tự chạy hay trạng thái còn lại từ lượt chạy trước. | 1 |
| NFR-04 | Khóa API của Claude phải được lưu an toàn và không được đưa vào kho mã. | 2 |
| NFR-05 | Việc gọi Claude lúc chạy phải kiểm soát được về độ trễ và chi phí, và phải có thể bật hoặc tắt bằng cấu hình. | 2 |
| NFR-06 | Quyền quyết định chất lượng, gồm việc kết luận đạt hay hỏng và chấp nhận test case, phải thuộc về con người; AI chỉ đóng vai trò hỗ trợ. | 2 |
| NFR-07 | Nền tảng không được chứa tri thức riêng của bất kỳ ứng dụng nào. Thêm một ứng dụng mới vào kiểm thử không được đòi hỏi sửa nền tảng. | 1 |
| NFR-08 | Từ giai đoạn 2, mọi thao tác của QC trên nền tảng phải thực hiện được mà không cần đọc hay viết phần cài đặt của test case. | 2 |
| NFR-09 | Phần mô tả hành vi của test case phải luôn khớp với hành vi được thực thi. | 1 |
| NFR-10 | Việc thu thập bằng chứng thực thi không được làm tăng đáng kể thời lượng một lượt chạy. | 1 |
| NFR-11 | Toàn bộ nội dung trong kho mã, gồm cả phần mô tả hành vi của test case, phải viết bằng tiếng Anh. | 1 |
| NFR-12 | Giá trị của dữ liệu kiểm thử, gồm tài khoản và mật khẩu, không được nằm trong kho mã. | 1 |

---

## 6. Ràng buộc và giả định

- iOS được phát triển trước, nên giai đoạn đầu cần tối thiểu một máy Mac.
- Lập trình viên cung cấp bản build đã ký đúng và sẵn sàng cài lên thiết bị.
- Chưa tích hợp CI/CD trong phạm vi hiện tại.
- Jira là điểm tổng hợp kết quả; thao tác đính báo cáo do QC thực hiện thủ công.
- Việc gọi Claude yêu cầu kết nối mạng và một khóa API hợp lệ.
- Test case và Page Object được quản lý bằng Git, nằm chung kho mã với nền tảng.
- Quy trình rà soát pull request do product owner kiểm soát, nằm ngoài phạm vi nền tảng.
- Tiếng Anh là ngôn ngữ chính của đội; QC đọc và viết được mô tả hành vi bằng tiếng Anh.
- Mỗi lần chụp màn hình tốn từ vài trăm mili giây tới vài giây tùy thiết bị, nên số lần chụp trong một lượt chạy được giữ ở mức tối thiểu.
- Mỗi QC điền giá trị dữ liệu kiểm thử trên máy mình một lần trước khi chạy lần đầu; đội thống nhất một bộ tài khoản dùng chung trên môi trường test.
- Môi trường test tách khỏi production. Dữ liệu do test case sinh ra tích tụ trên môi trường test và chưa có cơ chế dọn trong phạm vi hiện tại.

---

## 7. Tiêu chí nghiệm thu theo giai đoạn

### Giai đoạn 1 — Nền tảng cơ bản, chưa có AI

- Một test suite cho các luồng chính của một ứng dụng iOS bất kỳ có luồng đăng nhập và một vài thao tác cốt lõi, chạy tự động được trên thiết bị.
- Cùng một test suite chạy hai lần liên tiếp cho cùng tập trạng thái.
- Mỗi lượt chạy tạo báo cáo PNG/PDF và ghi bản ghi JSON vào SQLite với đủ các trường nêu ở FR-DATA-03.
- Với một test case hỏng, báo cáo cho biết bước nào hỏng, màn hình lúc đó trông thế nào, và các bước đã chạy trước đó.
- QC đính được báo cáo lên Jira và cập nhật trạng thái pass/fail.
- Thỏa các yêu cầu gắn nhãn giai đoạn 1 ở Mục 4 và Mục 5.

### Giai đoạn 2 — Bổ sung AI

- Chức năng sinh test case tạo được test case chạy được từ mô tả và page source, sau khi QC xác nhận và pull request được phê duyệt.
- Self-healing khôi phục được test case khi locator thay đổi, và phát cảnh báo cho mỗi lần tự phục hồi để QC xác nhận.
- Thỏa các yêu cầu gắn nhãn giai đoạn 2 ở Mục 4 và Mục 5.

### Giai đoạn 3 — Phân tích và biểu đồ

- Trả lời được các câu hỏi xu hướng nêu ở FR-ANL-01 từ dữ liệu đã tích lũy.
- Thỏa các yêu cầu gắn nhãn giai đoạn 3 ở Mục 4.

# User Stories — Phase 1

Mỗi story truy ngược về một epic đã chốt ở Giai đoạn 0. Đây là đầu vào để Team Lead chẻ thành ticket. Từ vựng trung tâm (test suite, test feature, test case, bước) định nghĩa ở `brd.md` §1.1.

| Story | Epic | Use case | Độ ưu tiên |
|---|---|---|---|
| US-01 | EP-24 | UC-01 | High |
| US-02 | EP-25 | UC-01 | High |
| US-03 | EP-01 | UC-02 | High |
| US-04 | EP-02 | UC-02 | High |
| US-05 | EP-03 | UC-03 | High |
| US-06 | EP-03 | UC-03 | Medium |
| US-07 | EP-17 | UC-04 | High |
| US-08 | EP-04 | UC-05 | High |
| US-09 | EP-05 | UC-06 | High |
| US-10 | EP-05 | UC-06 | Medium |
| US-11 | EP-05 | UC-06 | High |
| US-12 | EP-09 | UC-06 | Medium |
| US-13 | EP-06 | UC-07 | High |
| US-14 | EP-06 | UC-07 | High |
| US-15 | EP-19 | UC-07 | High |
| US-16 | EP-07 | UC-06, UC-08 | High |
| US-17 | EP-08 | UC-08 | Medium |
| US-18 | EP-23 | UC-09 | High |
| US-19 | EP-24 | UC-01, UC-03 | High |
| US-20 | EP-05 | UC-06 | High |

---

## US-01: Khai báo một ứng dụng vào nền tảng

**As a** QC
**I want to** khai báo ứng dụng cần kiểm thử bằng dữ liệu nằm ngoài mã nền tảng
**So that** đưa một ứng dụng vào kiểm thử mà không phải sửa nền tảng

**Acceptance Criteria:**
- [ ] Khai báo gồm định danh ứng dụng, đường dẫn bản build, loại thiết bị đích, định danh thiết bị, phiên bản hệ điều hành đích.
- [ ] Ứng dụng đã khai báo chọn được khi khởi chạy một lượt chạy.
- [ ] Khai báo thiếu trường bắt buộc bị từ chối kèm tên trường thiếu.
- [ ] Định danh ứng dụng trùng với ứng dụng đã có bị từ chối kèm định danh đang trùng.
- [ ] Đưa một ứng dụng mới vào kiểm thử không có thay đổi nào trong phần dùng chung của nền tảng.

**Business Rules:** BR-008, BR-015
**Use Case:** UC-01
**Độ ưu tiên:** High
**Phase:** 1

---

## US-02: Vận hành nhiều ứng dụng trên cùng một nền tảng

**As a** QC Lead
**I want to** nhiều ứng dụng cùng tồn tại trên một bản cài đặt nền tảng
**So that** nền tảng dùng lại được cho ứng dụng tiếp theo mà không phải dựng lại từ đầu

**Acceptance Criteria:**
- [ ] Mỗi ứng dụng có nơi chứa Page Object, test case và tệp mẫu dữ liệu kiểm thử riêng.
- [ ] Một lượt chạy thuộc về đúng một ứng dụng.
- [ ] Bản ghi kết quả mang định danh ứng dụng, và truy được toàn bộ lượt chạy của một ứng dụng.
- [ ] Thêm hoặc sửa test case của ứng dụng này không ảnh hưởng test case và dữ liệu kết quả của ứng dụng khác.

**Business Rules:** BR-008, BR-009
**Use Case:** UC-01
**Độ ưu tiên:** High
**Phase:** 1

---

## US-03: Lấy locator của một màn hình

**As a** QC
**I want to** mở phiên kiểm tra giao diện của ứng dụng và lấy locator thật của từng thành phần
**So that** test case thao tác đúng thành phần trên màn hình

**Acceptance Criteria:**
- [ ] Phiên kiểm tra giao diện mở được tới ứng dụng đã khai báo, trên thiết bị thật và trên simulator.
- [ ] Với một thành phần được chọn, lấy được locator kèm chiến lược locator tương ứng.
- [ ] Locator kiểm chứng được trong Inspector trước khi đưa vào Page Object.
- [ ] Khi phiên không mở được, lý do được nêu rõ.

**Business Rules:** BR-007
**Use Case:** UC-02
**Độ ưu tiên:** High
**Phase:** 1

---

## US-04: Tập trung locator theo Page Object

**As a** QC
**I want to** toàn bộ locator của một màn hình nằm tại một nơi
**So that** khi giao diện màn hình đó thay đổi thì chỉ phải sửa một chỗ

**Acceptance Criteria:**
- [ ] Mỗi màn hình của ứng dụng có đúng một Page Object.
- [ ] Phần cài đặt của test case tham chiếu tới Page Object, không chứa locator trực tiếp.
- [ ] Một locator dùng ở nhiều test case chỉ được khai báo một lần.

**Business Rules:** BR-007
**Use Case:** UC-02
**Độ ưu tiên:** High
**Phase:** 1

---

## US-05: Soạn test case gồm mô tả hành vi và phần cài đặt

**As a** QC
**I want to** viết mô tả hành vi của test case bằng ngôn ngữ tự nhiên và cài đặt phần thực thi tương ứng
**So that** test case chạy được và người đọc hiểu nó kiểm tra điều gì

**Acceptance Criteria:**
- [ ] Test case gồm phần mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt từng câu mô tả.
- [ ] Phần mô tả hành vi là thứ được thực thi, không phải tài liệu đi kèm.
- [ ] Nội dung viết bằng tiếng Anh.
- [ ] Test case thuộc về đúng một ứng dụng đã khai báo và đúng một test feature.
- [ ] Một test case kiểm tra một hành vi với một kết quả mong đợi.
- [ ] Bước mở đầu của test case đưa ứng dụng về trạng thái nó cần, và sinh mới dữ liệu mà nó làm thay đổi hoặc tiêu thụ.
- [ ] Chạy cùng test case hai lần liên tiếp cho cùng kết quả.

**Business Rules:** BR-005, BR-010, BR-013, BR-016, BR-017
**Use Case:** UC-03
**Độ ưu tiên:** High
**Phase:** 1

---

## US-06: Dùng lại phần cài đặt của câu mô tả

**As a** QC
**I want to** dùng lại phần cài đặt của những câu mô tả đã có ở test case khác
**So that** soạn test case mới nhanh hơn và hành vi của cùng một câu mô tả nhất quán giữa các test case

**Acceptance Criteria:**
- [ ] Một câu mô tả đã có phần cài đặt dùng được ở test case khác của cùng ứng dụng mà không cài đặt lại.
- [ ] Test case mới chỉ cần cài đặt cho những câu mô tả chưa có.

**Business Rules:** BR-010
**Use Case:** UC-03
**Độ ưu tiên:** Medium
**Phase:** 1

---

## US-07: Rà soát và phê duyệt test case qua pull request

**As a** Reviewer
**I want to** rà soát test case và Page Object trong pull request trước khi merge
**So that** test case sai không đi vào bộ hồi quy dùng chung

**Acceptance Criteria:**
- [ ] Test case và Page Object chỉ vào nhánh chính qua pull request đã được phê duyệt.
- [ ] Pull request cho thấy phần mô tả hành vi và phần cài đặt của thay đổi.
- [ ] Reviewer trả lại pull request kèm yêu cầu chỉnh sửa khi cài đặt không khớp mô tả, khi test case nằm sai test feature hoặc gộp nhiều hành vi, khi pull request chứa giá trị dữ liệu kiểm thử thật, khi locator nằm ngoài Page Object, khi bước mở đầu không tự thiết lập trạng thái và dữ liệu, hoặc khi nội dung không viết bằng tiếng Anh.

**Business Rules:** BR-005, BR-006, BR-007, BR-010, BR-013, BR-016, BR-017
**Use Case:** UC-04
**Độ ưu tiên:** High
**Phase:** 1

---

## US-08: Chuẩn bị thiết bị và cài bản build

**As a** QC
**I want to** nền tảng cài bản build lên thiết bị và kiểm tra thiết bị sẵn sàng trước khi chạy
**So that** lượt chạy không hỏng hàng loạt vì lý do thiết bị hoặc bản build

**Acceptance Criteria:**
- [ ] Bản build `.ipa` hoặc `.app` cài được lên thiết bị thật và lên simulator.
- [ ] Nền tảng kiểm tra thiết bị có mặt, kết nối được, và phiên bản hệ điều hành khớp khai báo.
- [ ] Khi ứng dụng đã ở đúng phiên bản của bản build, bước cài được bỏ qua.
- [ ] Mỗi trường hợp không thỏa (bản build không tồn tại, thiết bị không sẵn sàng, phiên bản hệ điều hành lệch, cài thất bại) dừng lại kèm lý do riêng.

**Business Rules:** BR-015
**Use Case:** UC-05
**Độ ưu tiên:** High
**Phase:** 1

---

## US-09: Khởi chạy một lượt chạy

**As a** QC
**I want to** khởi chạy một lượt chạy trên test suite của một ứng dụng
**So that** một vòng hồi quy được thực hiện bằng máy thay vì thao tác tay từng bước

**Acceptance Criteria:**
- [ ] Lượt chạy chỉ mở khi tiền điều kiện về khai báo, bản build, thiết bị và dữ liệu kiểm thử đều thỏa.
- [ ] Lượt chạy có định danh, thời điểm bắt đầu, và bối cảnh gồm ứng dụng, phiên bản ứng dụng, thiết bị, loại thiết bị, hệ điều hành.
- [ ] Tiền điều kiện không thỏa thì lượt chạy không mở, không sinh bản ghi kết quả, không sinh báo cáo, và lý do được nêu theo từng mục không thỏa.
- [ ] Tập test case được chọn rỗng thì lượt chạy không mở kèm thông báo tiêu chí chọn không khớp test case nào.

**Business Rules:** BR-015, BR-017
**Use Case:** UC-06
**Độ ưu tiên:** High
**Phase:** 1

---

## US-10: Theo dõi tiến trình lượt chạy

**As a** QC
**I want to** biết lượt chạy đang tới đâu trong lúc nó diễn ra
**So that** ước lượng được thời gian còn lại và phát hiện sớm sự cố

**Acceptance Criteria:**
- [ ] Trong lúc chạy, hiển thị test case đang chạy kèm test feature chứa nó, và số test case đã hoàn tất trên tổng số.
- [ ] Trạng thái của mỗi test case hiện ra ngay khi test case đó kết thúc, không phải chờ hết lượt chạy.

**Business Rules:** —
**Use Case:** UC-06
**Độ ưu tiên:** Medium
**Phase:** 1

---

## US-11: Lượt chạy chạy hết tập test case dù có test case hỏng

**As a** QC
**I want to** một test case hỏng không làm dừng các test case còn lại
**So that** một lượt chạy cho bức tranh đầy đủ về toàn bộ tập test case

**Acceptance Criteria:**
- [ ] Test case hỏng không dừng lượt chạy; test case kế tiếp vẫn được thực thi, không phụ thuộc loại lỗi.
- [ ] Khi kết thúc, lượt chạy có trạng thái tổng hợp, thời điểm kết thúc, tổng thời lượng, và số lượng test case theo từng trạng thái.
- [ ] Lượt chạy đạt khi mọi test case trong tập chạy ở trạng thái đạt hoặc đạt kèm tự phục hồi.
- [ ] Khi lượt chạy bị hủy, kết quả các test case đã hoàn tất được giữ, lượt chạy đánh dấu chưa hoàn tất kèm số test case chưa chạy và lý do dừng, và báo cáo vẫn được sinh.
- [ ] Test case chưa chạy không sinh bản ghi kết quả.

**Business Rules:** BR-002, BR-011, BR-012
**Use Case:** UC-06
**Độ ưu tiên:** High
**Phase:** 1

---

## US-12: Chọn tập con test case để chạy

**As a** QC
**I want to** chạy một tập con test case thay vì toàn bộ test suite
**So that** kiểm tra nhanh một luồng vừa sửa mà không phải chờ hết vòng hồi quy

**Acceptance Criteria:**
- [ ] Chọn được theo test feature, theo tên test case, hoặc theo nhãn gắn trên test case.
- [ ] Báo cáo và dữ liệu kết quả phản ánh đúng tập đã chạy.
- [ ] Trạng thái tổng hợp tính trên tập đã chọn, và báo cáo nêu rõ đây là lượt chạy trên tập con.

**Business Rules:** BR-011, BR-016
**Use Case:** UC-06
**Độ ưu tiên:** Medium
**Phase:** 1

---

## US-13: Ghi nhật ký thực thi cho mỗi test case

**As a** QC
**I want to** biết test case đã đi qua những bước nào và hỏng ở bước nào
**So that** điều tra nguyên nhân mà không phải chạy lại và quan sát bằng mắt

**Acceptance Criteria:**
- [ ] Mỗi test case có nhật ký gồm các bước đã chạy theo thứ tự, kết quả từng bước, thời lượng từng bước.
- [ ] Bước trong nhật ký mang đúng nội dung câu mô tả hành vi tương ứng.
- [ ] Bước hỏng kèm thông báo lỗi gốc, tên màn hình, và loại lỗi theo hai giá trị: test case kết luận sai, không thực hiện được bước.
- [ ] Lỗi khi ghi nhật ký không làm thay đổi trạng thái test case; phần thiếu được đánh dấu là thiếu.

**Business Rules:** BR-004, BR-010, BR-014
**Use Case:** UC-07
**Độ ưu tiên:** High
**Phase:** 1

---

## US-14: Chụp màn hình tại bước hỏng

**As a** Lập trình viên
**I want to** thấy màn hình ứng dụng tại đúng thời điểm test case hỏng
**So that** biết ứng dụng đang ở trạng thái nào lúc đó mà không phải tái hiện trước

**Acceptance Criteria:**
- [ ] Test case hỏng có đúng một ảnh chụp, tại bước hỏng.
- [ ] Bước được đánh dấu tường minh là cần chụp thì có ảnh chụp gắn với bước đó.
- [ ] Test case đạt không có ảnh chụp nào, trừ ảnh của các bước được đánh dấu.
- [ ] Lỗi khi chụp màn hình không làm thay đổi trạng thái test case; ảnh thiếu được đánh dấu là thiếu.

**Business Rules:** BR-003, BR-004
**Use Case:** UC-07
**Độ ưu tiên:** High
**Phase:** 1

---

## US-15: Ghi bản ghi kết quả cho mỗi test case

**As a** QC Lead
**I want to** mỗi test case đã chạy sinh một bản ghi kết quả có cấu trúc
**So that** lớp phân tích ở Phase 3 có dữ liệu để trả lời câu hỏi xu hướng

**Acceptance Criteria:**
- [ ] Mỗi test case đã được thực thi trong mỗi lượt chạy sinh đúng một bản ghi kết quả dạng JSON, lưu vào SQLite trên máy QC.
- [ ] Bản ghi chứa tối thiểu: thời điểm chạy, định danh ứng dụng, phiên bản ứng dụng, thiết bị, loại thiết bị, hệ điều hành, tên test feature, tên test case, trạng thái, thời lượng, màn hình, loại lỗi và thông báo lỗi gốc.
- [ ] Bản ghi gắn với định danh lượt chạy và định danh ứng dụng.
- [ ] Trạng thái nhận một trong ba giá trị: đạt, hỏng, đạt kèm tự phục hồi. Giá trị thứ ba nằm trong hợp đồng dữ liệu từ Phase 1 dù chưa phát sinh ở Phase 1.
- [ ] Test case không được thực thi không sinh bản ghi.
- [ ] Bản ghi không chứa giá trị dữ liệu kiểm thử.
- [ ] Lượt chạy mới không ghi đè hay xóa dữ liệu của lượt chạy trước.

**Business Rules:** BR-001, BR-009, BR-012, BR-014, BR-016, BR-017
**Use Case:** UC-07
**Độ ưu tiên:** High
**Phase:** 1

---

## US-16: Nhận báo cáo của mỗi lượt chạy

**As a** QC
**I want to** mỗi lượt chạy sinh một báo cáo tự đủ thông tin
**So that** chia sẻ kết quả mà không phải giải thích thêm bằng lời

**Acceptance Criteria:**
- [ ] Mỗi lượt chạy sinh một báo cáo PNG/PDF, kể cả lượt chạy chưa hoàn tất.
- [ ] Báo cáo nêu bối cảnh: ứng dụng, phiên bản ứng dụng, thiết bị, hệ điều hành, thời điểm bắt đầu, tổng thời lượng, tổng số test case và số lượng theo từng trạng thái.
- [ ] Báo cáo có bảng tóm tắt nhóm theo test feature, mỗi dòng gồm tên test case, trạng thái, thời lượng.
- [ ] Với mỗi test case hỏng, báo cáo có ảnh chụp bước hỏng, nhật ký thực thi, tên màn hình, loại lỗi và thông báo lỗi gốc.
- [ ] Báo cáo của lượt chạy chưa hoàn tất nêu rõ số test case chưa chạy và lý do dừng.
- [ ] Phần bằng chứng thiếu được nêu rõ là thiếu thay vì để trống.

**Business Rules:** BR-003, BR-012, BR-014, BR-016
**Use Case:** UC-06, UC-08
**Độ ưu tiên:** High
**Phase:** 1

---

## US-17: Đính báo cáo lên Jira

**As a** QC
**I want to** đính báo cáo vào task Jira và cập nhật trạng thái pass/fail
**So that** kết quả kiểm thử tập trung ở nơi cả đội đang theo dõi

**Acceptance Criteria:**
- [ ] Báo cáo ở định dạng đính được vào task Jira mà không phải chuyển đổi thêm.
- [ ] Một tệp báo cáo tương ứng một lượt chạy.

**Business Rules:** —
**Use Case:** UC-08
**Độ ưu tiên:** Medium
**Phase:** 1

---

## US-18: Nhận thông tin lỗi đủ để tái hiện

**As a** Lập trình viên
**I want to** nhận đủ thông tin về một test case hỏng
**So that** tái hiện và xử lý lỗi mà không phải hỏi lại QC

**Acceptance Criteria:**
- [ ] Với một test case hỏng, báo cáo cho biết test feature, bước hỏng, các bước đã chạy trước đó, ảnh chụp lúc hỏng, tên màn hình, loại lỗi và thông báo lỗi gốc.
- [ ] Báo cáo cho biết phiên bản ứng dụng, thiết bị, loại thiết bị và phiên bản hệ điều hành của lượt chạy.
- [ ] Loại lỗi phân biệt được trường hợp test case đi tới chỗ kết luận và kết luận sai, với trường hợp test case không đi tới được chỗ kết luận.

**Business Rules:** BR-014
**Use Case:** UC-09
**Độ ưu tiên:** High
**Phase:** 1

---

## US-19: Khai báo dữ liệu kiểm thử ngoài kho mã

**As a** QC
**I want to** test case tham chiếu tới dữ liệu kiểm thử bằng tên, giá trị nằm trên máy tôi
**So that** tài khoản và mật khẩu không đi vào kho mã, và tôi biết chính xác phải chuẩn bị gì trước khi chạy lần đầu

**Acceptance Criteria:**
- [ ] Test case tham chiếu tới dữ liệu kiểm thử bằng tên; giá trị nằm trong tệp cấu hình trên máy QC.
- [ ] Kho mã có một tệp mẫu liệt kê đầy đủ các mục dữ liệu mà test suite của ứng dụng cần, không mang giá trị thật.
- [ ] Trước khi mở lượt chạy, nền tảng kiểm tra mọi mục trong tệp mẫu đã có giá trị; mục còn thiếu được nêu tên.
- [ ] Dữ liệu mà test case làm thay đổi hoặc tiêu thụ không nằm trong tệp cấu hình; nó được test case sinh mới ở bước mở đầu.

**Business Rules:** BR-008, BR-017
**Use Case:** UC-01, UC-03
**Độ ưu tiên:** High
**Phase:** 1

---

## US-20: Dừng lượt chạy khi thiết bị không còn sẵn sàng

**As a** QC
**I want to** lượt chạy dừng ngay khi thiết bị mất kết nối thay vì chạy tiếp vô ích
**So that** không phải chờ hết số test case còn lại và dữ liệu kết quả không nhận thêm hàng loạt bản ghi hỏng vì cùng một lý do

**Acceptance Criteria:**
- [ ] Trước mỗi test case, nền tảng kiểm tra thiết bị còn sẵn sàng theo cùng điều kiện dùng khi mở lượt chạy.
- [ ] Khi thiết bị không còn sẵn sàng, lượt chạy dừng, đánh dấu chưa hoàn tất, ghi số test case chưa chạy và lý do dừng, và vẫn sinh báo cáo.
- [ ] Các test case chưa chạy không sinh bản ghi kết quả.
- [ ] Việc dừng dựa trên trạng thái thiết bị, không dựa trên số lần test case hỏng liên tiếp.

**Business Rules:** BR-012, BR-018
**Use Case:** UC-06
**Độ ưu tiên:** High
**Phase:** 1

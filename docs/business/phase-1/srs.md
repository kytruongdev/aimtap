# Software Requirements Specification — Phase 1

Phạm vi: các epic của Phase 1 theo `docs/business/phase-proposal.md` — EP-01, EP-02, EP-03, EP-04, EP-05, EP-06, EP-07, EP-08, EP-09, EP-17, EP-19, EP-23, EP-24, EP-25.

Căn cứ nghiệp vụ: `docs/business/brd.md`. Từ vựng trung tâm (test suite, test feature, test case, bước) định nghĩa ở `brd.md` §1.1. Yêu cầu ở mức toàn dự án nằm ở `docs/requirement.md`; tài liệu này chi tiết hóa phần thuộc Phase 1 và bổ sung các yêu cầu chỉ lộ ra khi đặc tả ở mức luồng.

Quy ước đánh mã: các họ mã `FR-AUTH`, `FR-EXEC`, `FR-REP`, `FR-DATA` tiếp nối `docs/requirement.md` §4, không đánh lại. Ba họ mã mới xuất hiện ở tài liệu này: `FR-APP` (khai báo ứng dụng), `FR-DEV` (thiết bị và bản build), `FR-RUN` (lượt chạy).

Từ "phải" biểu thị yêu cầu bắt buộc.

---

## 1. Functional Requirements

### 1.1. Khai báo ứng dụng được kiểm thử

Truy vết: EP-24, EP-25.

#### FR-APP-01: Khai báo một ứng dụng vào nền tảng
- Mô tả: Hệ thống phải cho phép khai báo một ứng dụng cần kiểm thử bằng dữ liệu nằm ngoài mã nền tảng.
- Input: định danh ứng dụng, đường dẫn bản build, loại thiết bị đích (thiết bị thật hoặc simulator), định danh thiết bị, phiên bản hệ điều hành đích.
- Output: một ứng dụng ở trạng thái khai báo được nền tảng nhận biết và chạy được test case.
- Business rule liên quan: BR-008.

#### FR-APP-02: Vận hành nhiều ứng dụng trên cùng một nền tảng
- Mô tả: Hệ thống phải cho phép nhiều ứng dụng cùng tồn tại trên một bản cài đặt nền tảng, mỗi ứng dụng có test suite, Page Object, dữ liệu kiểm thử và dữ liệu kết quả riêng.
- Input: nhiều khai báo ứng dụng theo FR-APP-01.
- Output: một lượt chạy luôn thuộc về đúng một ứng dụng; dữ liệu kết quả của ứng dụng này không lẫn vào ứng dụng khác.
- Business rule liên quan: BR-008.

#### FR-APP-03: Thêm ứng dụng mới không đòi hỏi sửa nền tảng
- Mô tả: Việc đưa một ứng dụng mới vào kiểm thử chỉ gồm việc bổ sung khai báo, Page Object và test case của ứng dụng đó.
- Input: khai báo và nội dung test case của ứng dụng mới.
- Output: ứng dụng mới chạy được mà không có thay đổi nào trong phần dùng chung của nền tảng.
- Business rule liên quan: BR-008.

#### FR-APP-04: Kiểm tra khai báo trước khi mở một lượt chạy
- Mô tả: Trước khi bắt đầu một lượt chạy, hệ thống phải kiểm tra khai báo của ứng dụng là đầy đủ, trỏ tới tài nguyên tồn tại, và mọi mục dữ liệu kiểm thử trong tệp mẫu đã có giá trị. Khi thiếu hoặc sai, hệ thống dừng trước khi chạy test case đầu tiên và nêu rõ mục nào thiếu hoặc sai.
- Input: khai báo ứng dụng, bản build, thiết bị đích, dữ liệu kiểm thử.
- Output: lượt chạy được mở, hoặc lượt chạy không được mở kèm lý do.
- Business rule liên quan: BR-015, BR-017.

#### FR-APP-05: Khai báo dữ liệu kiểm thử
- Mô tả: Hệ thống phải cho phép test case tham chiếu tới dữ liệu kiểm thử bằng tên, với giá trị nằm trong tệp cấu hình trên máy QC, ngoài kho mã. Kho mã phải có một tệp mẫu liệt kê đầy đủ các mục dữ liệu mà test suite của ứng dụng cần, không mang giá trị thật.
- Input: tên các mục dữ liệu kiểm thử do test suite của ứng dụng dùng tới.
- Output: test case chạy được trên máy QC sau khi QC điền giá trị; QC mới biết chính xác phải chuẩn bị những gì trước khi chạy lần đầu.
- Business rule liên quan: BR-008, BR-017.

### 1.2. Soạn test case và đưa vào nhánh chính

Truy vết: EP-01, EP-02, EP-03, EP-17.

#### FR-AUTH-01: Soạn test case gồm mô tả hành vi và phần cài đặt
- Mô tả: Hệ thống phải cho phép QC soạn test case gồm phần mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt thực thi bằng WebdriverIO chạy trên Appium.
- Input: trường hợp cần kiểm thử trong một luồng nghiệp vụ.
- Output: một test case chạy được, gồm hai phần nêu trên, nằm trong kho mã.
- Business rule liên quan: BR-010, BR-013, BR-016.

#### FR-AUTH-02: Lấy locator qua Appium Inspector
- Mô tả: Hệ thống phải hỗ trợ QC mở một phiên kiểm tra giao diện của ứng dụng đã khai báo để lấy locator thật của từng màn hình qua Appium Inspector.
- Input: khai báo ứng dụng, thiết bị đã cài bản build.
- Output: locator của các thành phần trên màn hình đích.
- Business rule liên quan: BR-007.

#### FR-AUTH-03: Tập trung locator theo Page Object
- Mô tả: Locator của mỗi màn hình phải được tập trung tại một nơi theo mô hình Page Object, không nằm rải rác trong phần cài đặt của test case.
- Input: locator lấy từ FR-AUTH-02.
- Output: một Page Object cho mỗi màn hình của ứng dụng.
- Business rule liên quan: BR-007.

#### FR-AUTH-05: Mọi test case đi qua pull request được phê duyệt
- Mô tả: Test case và Page Object chỉ vào nhánh chính qua pull request đã được reviewer phê duyệt.
- Input: test case mới hoặc test case đã sửa.
- Output: nội dung đã merge vào nhánh chính, hoặc pull request bị trả lại kèm yêu cầu chỉnh sửa.
- Business rule liên quan: BR-006, BR-017.

#### FR-AUTH-07: Dùng lại phần cài đặt của câu mô tả giữa các test case
- Mô tả: Một câu mô tả hành vi đã có phần cài đặt phải dùng lại được ở test case khác của cùng ứng dụng mà không phải cài đặt lại.
- Input: tập câu mô tả đã có phần cài đặt của một ứng dụng.
- Output: test case mới chỉ cần cài đặt cho những câu mô tả chưa có.
- Business rule liên quan: BR-010.

#### FR-AUTH-08: Test case thuộc về đúng một ứng dụng
- Mô tả: Mỗi test case và mỗi Page Object phải thuộc về đúng một ứng dụng đã khai báo.
- Input: test case, Page Object.
- Output: quan hệ xác định giữa test case và ứng dụng, dùng khi chọn test suite để chạy và khi ghi dữ liệu kết quả.
- Business rule liên quan: BR-008.

#### FR-AUTH-09: Test case thuộc về đúng một test feature
- Mô tả: Mỗi test case phải thuộc về đúng một test feature, và một test feature tương ứng một luồng nghiệp vụ của ứng dụng.
- Input: test case.
- Output: quan hệ xác định giữa test case và test feature, dùng khi chọn tập con để chạy, khi trình bày báo cáo, và khi tổng hợp dữ liệu ở Phase 3.
- Business rule liên quan: BR-016.

### 1.3. Chuẩn bị thiết bị và bản build

Truy vết: EP-04.

#### FR-DEV-01: Cài bản build lên thiết bị
- Mô tả: Hệ thống phải cài bản build ứng dụng (`.ipa` hoặc `.app`) do lập trình viên cung cấp lên thiết bị đích trước khi chạy. Yêu cầu này là dạng chi tiết của FR-EXEC-02.
- Input: đường dẫn bản build, thiết bị đích.
- Output: ứng dụng đã có trên thiết bị ở phiên bản của bản build đó.
- Business rule liên quan: BR-015.

#### FR-DEV-02: Kiểm tra thiết bị sẵn sàng trước khi mở lượt chạy
- Mô tả: Trước khi bắt đầu một lượt chạy, hệ thống phải kiểm tra thiết bị đích ở trạng thái dùng được: có mặt, kết nối được, và phiên bản hệ điều hành khớp với khai báo. Khi không thỏa, lượt chạy không được mở và lý do được nêu rõ.
- Input: khai báo thiết bị đích.
- Output: thiết bị được xác nhận sẵn sàng, hoặc lượt chạy không được mở kèm lý do.
- Business rule liên quan: BR-015.

#### FR-DEV-03: Ghi nhận bối cảnh thiết bị của lượt chạy
- Mô tả: Hệ thống phải ghi nhận định danh thiết bị, loại thiết bị, phiên bản hệ điều hành và phiên bản ứng dụng đang chạy, gắn với lượt chạy.
- Input: thông tin thiết bị và bản build tại thời điểm chạy.
- Output: bối cảnh lượt chạy dùng cho báo cáo và dữ liệu kết quả.
- Business rule liên quan: BR-009.

#### FR-DEV-04: Kiểm tra thiết bị còn sẵn sàng giữa lượt chạy
- Mô tả: Trước khi bắt đầu mỗi test case, hệ thống phải kiểm tra thiết bị đích còn sẵn sàng hay không, theo cùng điều kiện dùng ở FR-DEV-02. Khi thiết bị không còn sẵn sàng, lượt chạy dừng theo FR-RUN-06.
- Input: trạng thái thiết bị tại thời điểm giữa hai test case.
- Output: test case kế tiếp được thực thi, hoặc lượt chạy dừng kèm lý do.
- Business rule liên quan: BR-018.

### 1.4. Lượt chạy

Truy vết: EP-05, EP-09.

#### FR-RUN-01: Khởi chạy một lượt chạy
- Mô tả: Hệ thống phải cho phép QC khởi chạy một lượt chạy trên test suite của một ứng dụng đã khai báo.
- Input: ứng dụng, test suite, thiết bị đích.
- Output: một lượt chạy có định danh, thời điểm bắt đầu, và bối cảnh theo FR-DEV-03.
- Business rule liên quan: BR-015.

#### FR-RUN-02: Chọn tập con test case để chạy
- Mô tả: Hệ thống phải cho phép chọn một tập con test case thay vì toàn bộ test suite của ứng dụng.
- Input: tiêu chí chọn — theo test feature, theo tên test case, hoặc theo nhãn gắn trên test case.
- Output: lượt chạy chỉ thực thi các test case được chọn; báo cáo và dữ liệu kết quả phản ánh đúng tập đã chạy.
- Business rule liên quan: BR-011, BR-016.

#### FR-RUN-03: Theo dõi tiến trình lượt chạy
- Mô tả: Trong lúc lượt chạy diễn ra, hệ thống phải cho biết test case nào đang chạy và thuộc test feature nào, số test case đã hoàn tất trên tổng số, và trạng thái của từng test case đã hoàn tất.
- Input: tiến trình thực thi.
- Output: thông tin tiến trình hiển thị cho QC tại thời điểm chạy.
- Business rule liên quan: —

#### FR-RUN-04: Một test case hỏng không dừng lượt chạy
- Mô tả: Khi một test case kết thúc ở trạng thái hỏng, hệ thống phải tiếp tục thực thi các test case còn lại của lượt chạy, không phụ thuộc loại lỗi. Trường hợp duy nhất làm lượt chạy dừng giữa chừng ngoài việc QC hủy là thiết bị không còn sẵn sàng (FR-DEV-04).
- Input: kết quả của một test case.
- Output: lượt chạy chạy hết tập test case đã chọn.
- Business rule liên quan: BR-002.

#### FR-RUN-05: Trạng thái tổng hợp của lượt chạy
- Mô tả: Khi kết thúc, hệ thống phải ghi nhận trạng thái tổng hợp của lượt chạy, thời điểm kết thúc, tổng thời lượng, và số lượng test case theo từng trạng thái.
- Input: trạng thái của từng test case trong lượt chạy.
- Output: trạng thái tổng hợp của lượt chạy.
- Business rule liên quan: BR-011.

#### FR-RUN-06: Lượt chạy kết thúc bất thường
- Mô tả: Khi lượt chạy dừng giữa chừng vì QC hủy hoặc vì thiết bị không còn sẵn sàng, hệ thống phải giữ lại kết quả của các test case đã hoàn tất, đánh dấu lượt chạy là chưa hoàn tất, và ghi số test case chưa chạy cùng lý do dừng ở cấp lượt chạy. Test case chưa chạy không sinh bản ghi kết quả.
- Input: sự kiện hủy, hoặc kết quả kiểm tra thiết bị ở FR-DEV-04.
- Output: lượt chạy ở trạng thái chưa hoàn tất, dữ liệu của phần đã chạy được giữ nguyên.
- Business rule liên quan: BR-012, BR-018.

### 1.5. Thực thi test case và bằng chứng thực thi

Truy vết: EP-06, EP-23.

#### FR-EXEC-01: Thực thi trên thiết bị thật và simulator
- Mô tả: Hệ thống phải thực thi test case trên thiết bị iOS, cả thiết bị thật và simulator, qua WebdriverIO điều khiển Appium.
- Input: test case, thiết bị đích.
- Output: kết quả thực thi của test case.
- Business rule liên quan: —

#### FR-EXEC-03: Chụp màn hình tại bước hỏng
- Mô tả: Khi một test case hỏng, hệ thống phải chụp một ảnh màn hình tại thời điểm bước hỏng. Hệ thống không chụp màn hình ở các bước khác, trừ những bước được đánh dấu tường minh là cần chụp.
- Input: sự kiện một bước hỏng; đánh dấu cần chụp trên một bước.
- Output: ảnh chụp màn hình gắn với bước tương ứng của test case.
- Business rule liên quan: BR-003.

#### FR-EXEC-04: Ghi nhật ký thực thi
- Mô tả: Hệ thống phải ghi nhật ký thực thi cho mỗi test case: các bước đã chạy theo thứ tự, kết quả từng bước, thời lượng từng bước, và thông báo lỗi gốc tại bước hỏng.
- Input: tiến trình thực thi từng bước của test case.
- Output: nhật ký thực thi gắn với test case trong lượt chạy đó.
- Business rule liên quan: BR-004, BR-010.

#### FR-EXEC-05: Lỗi thu thập bằng chứng không đổi trạng thái test case
- Mô tả: Lỗi phát sinh khi chụp màn hình hoặc ghi nhật ký không được làm thay đổi trạng thái của test case. Test case tiếp tục chạy và phần bằng chứng thiếu được ghi nhận là thiếu.
- Input: lỗi trong quá trình thu thập bằng chứng.
- Output: trạng thái test case giữ nguyên; bằng chứng thiếu được đánh dấu là thiếu, không bị bỏ trống không giải thích.
- Business rule liên quan: BR-004.

#### FR-EXEC-06: Trạng thái của một test case trong một lượt chạy
- Mô tả: Hệ thống phải ghi nhận trạng thái của từng test case đã được thực thi trong mỗi lượt chạy theo một trong ba giá trị: đạt, hỏng, đạt kèm tự phục hồi. Giá trị "đạt kèm tự phục hồi" chỉ phát sinh từ Phase 2 nhưng nằm trong dữ liệu kết quả từ Phase 1.
- Input: kết quả thực thi các bước của test case.
- Output: một trạng thái duy nhất cho test case trong lượt chạy đó.
- Business rule liên quan: BR-001.

#### FR-EXEC-07: Test case tự đảm bảo điều kiện tiên quyết
- Mô tả: Mỗi test case phải tự đưa ứng dụng về trạng thái nó cần ở bước mở đầu, không giả định trạng thái do test case trước hay lượt chạy trước để lại. Dữ liệu mà test case làm thay đổi hoặc tiêu thụ được sinh mới ở bước mở đầu.
- Input: trạng thái bất kỳ của ứng dụng trước khi test case bắt đầu.
- Output: test case chạy được độc lập với thứ tự chạy và lặp lại được qua nhiều lượt chạy.
- Business rule liên quan: BR-005, BR-017.

#### FR-EXEC-10: Phân loại lỗi tại bước hỏng
- Mô tả: Khi một test case hỏng, hệ thống phải ghi nhận tên màn hình tại thời điểm hỏng, loại lỗi theo hai giá trị ở BR-014, và thông báo lỗi gốc.
- Input: bối cảnh tại bước hỏng.
- Output: tên màn hình, loại lỗi và thông báo lỗi gốc, dùng cho báo cáo và dữ liệu kết quả.
- Business rule liên quan: BR-014.

### 1.6. Báo cáo lượt chạy

Truy vết: EP-07, EP-08, EP-23.

#### FR-REP-01: Sinh báo cáo cho mỗi lượt chạy
- Mô tả: Hệ thống phải tạo báo cáo PNG/PDF cho mỗi lượt chạy, kể cả lượt chạy chưa hoàn tất theo FR-RUN-06.
- Input: dữ liệu kết quả của lượt chạy.
- Output: một tệp báo cáo cho lượt chạy đó.
- Business rule liên quan: BR-012.

#### FR-REP-02: Nội dung báo cáo
- Mô tả: Báo cáo phải gồm bảng tóm tắt toàn lượt chạy, nhóm theo test feature, mỗi dòng gồm tên test case, trạng thái và thời lượng; và với mỗi test case hỏng là ảnh chụp bước hỏng, nhật ký thực thi, tên màn hình, loại lỗi và thông báo lỗi gốc.
- Input: dữ liệu kết quả của lượt chạy.
- Output: báo cáo đủ thông tin để lập trình viên tái hiện lỗi mà không cần hỏi lại QC.
- Business rule liên quan: BR-003, BR-014, BR-016.

#### FR-REP-03: Định dạng đính được vào Jira
- Mô tả: Báo cáo phải ở định dạng để QC đính vào task trên Jira và cập nhật trạng thái pass/fail.
- Input: tệp báo cáo.
- Output: tệp đính kèm trên task Jira.
- Business rule liên quan: —

#### FR-REP-04: Bối cảnh lượt chạy trong báo cáo
- Mô tả: Báo cáo phải nêu bối cảnh của lượt chạy: định danh ứng dụng, phiên bản ứng dụng, thiết bị, phiên bản hệ điều hành, thời điểm bắt đầu, tổng thời lượng, tổng số test case và số lượng theo từng trạng thái. Với lượt chạy chưa hoàn tất, báo cáo nêu thêm số test case chưa chạy và lý do dừng.
- Input: bối cảnh theo FR-DEV-03 và trạng thái tổng hợp theo FR-RUN-05.
- Output: phần bối cảnh trong báo cáo.
- Business rule liên quan: BR-009, BR-012.

### 1.7. Dữ liệu kết quả

Truy vết: EP-19.

#### FR-DATA-01: Bản ghi kết quả cho mỗi test case
- Mô tả: Hệ thống phải ghi một bản ghi kết quả dạng JSON cho mỗi test case đã được thực thi trong mỗi lượt chạy. Sự tồn tại của một bản ghi đồng nghĩa với việc test case đó đã được thực thi.
- Input: kết quả thực thi của test case.
- Output: một bản ghi kết quả.
- Business rule liên quan: BR-009.

#### FR-DATA-02: Lưu trữ trên máy QC
- Mô tả: Bản ghi kết quả phải được lưu vào SQLite trên máy QC.
- Input: bản ghi kết quả.
- Output: dữ liệu tích lũy qua các lượt chạy.
- Business rule liên quan: BR-009.

#### FR-DATA-03: Trường tối thiểu của bản ghi
- Mô tả: Mỗi bản ghi phải chứa tối thiểu các trường: thời điểm chạy, định danh ứng dụng, phiên bản ứng dụng, thiết bị, loại thiết bị, hệ điều hành, tên test feature, tên test case, trạng thái, thời lượng, màn hình, loại lỗi và thông báo lỗi gốc.
- Input: kết quả thực thi và bối cảnh lượt chạy.
- Output: bản ghi đủ trường để lớp phân tích ở Phase 3 trả lời các câu hỏi xu hướng mà không cần bổ sung dữ liệu về sau.
- Business rule liên quan: BR-009, BR-014, BR-016.

#### FR-DATA-04: Gắn bản ghi với lượt chạy và ứng dụng
- Mô tả: Mỗi bản ghi phải gắn với định danh lượt chạy và định danh ứng dụng, để truy được toàn bộ test case của một lượt chạy và toàn bộ lượt chạy của một ứng dụng.
- Input: định danh lượt chạy, định danh ứng dụng.
- Output: quan hệ truy vấn được giữa bản ghi, lượt chạy và ứng dụng.
- Business rule liên quan: BR-009.

#### FR-DATA-05: Dữ liệu chỉ ghi thêm
- Mô tả: Một lượt chạy mới không được ghi đè hay xóa dữ liệu của lượt chạy trước.
- Input: lượt chạy mới.
- Output: dữ liệu lịch sử giữ nguyên.
- Business rule liên quan: BR-009.

---

## 2. Non-functional Requirements

Tám yêu cầu dưới đây là các yêu cầu gắn nhãn Phase 1 ở `docs/business/brd.md` §9 và `docs/requirement.md` §5, phát biểu lại kèm cách kiểm chứng ở mức nghiệp vụ.

### NFR-01: Chạy nội bộ
Nền tảng chạy trên máy QC, không yêu cầu máy chủ hay triển khai online.
Kiểm chứng: một lượt chạy hoàn tất trên máy QC không có kết nối tới bất kỳ dịch vụ nội bộ nào của dự án.

### NFR-02: Nền tảng hệ điều hành
Kiểm thử iOS chạy trên máy macOS.

### NFR-03: Kết quả lặp lại
Test case chạy trên bản build chính thức và cho kết quả lặp lại, không phụ thuộc thứ tự chạy hay trạng thái còn lại từ lượt chạy trước.
Kiểm chứng: chạy cùng một test suite hai lần liên tiếp trên cùng bản build và cùng thiết bị cho cùng tập trạng thái; chạy theo thứ tự đảo ngược cũng cho cùng tập trạng thái.

### NFR-07: Nền tảng không chứa tri thức ứng dụng
Mọi thông tin phụ thuộc ứng dụng được khai báo từ bên ngoài. Thêm một ứng dụng mới vào kiểm thử không đòi hỏi sửa nền tảng.
Kiểm chứng: đưa ứng dụng thứ hai vào kiểm thử mà không có thay đổi nào trong phần dùng chung của nền tảng.

### NFR-09: Mô tả hành vi khớp hành vi thực thi
Phần mô tả hành vi của test case luôn khớp với hành vi được thực thi.
Kiểm chứng: không tồn tại đường nào để mô tả hành vi và phần cài đặt lệch nhau mà test case vẫn chạy được.

### NFR-10: Chi phí thu thập bằng chứng
Việc thu thập bằng chứng thực thi không làm tăng đáng kể thời lượng một lượt chạy.
Kiểm chứng: số lần chụp màn hình trong một lượt chạy bằng số test case hỏng cộng số bước được đánh dấu tường minh.

### NFR-11: Ngôn ngữ
Toàn bộ nội dung trong kho mã, gồm cả phần mô tả hành vi của test case, viết bằng tiếng Anh.

### NFR-12: Dữ liệu kiểm thử ngoài kho mã
Giá trị của dữ liệu kiểm thử, gồm tài khoản và mật khẩu, không nằm trong kho mã.
Kiểm chứng: kho mã chỉ chứa tên các mục dữ liệu và một tệp mẫu không mang giá trị thật.

---

## 3. Tiêu chí nghiệm thu Phase 1

Phase 1 được nghiệm thu trên một ứng dụng iOS bất kỳ có luồng đăng nhập và một vài thao tác cốt lõi:

- Ứng dụng được khai báo vào nền tảng mà không sửa phần dùng chung của nền tảng.
- Một test suite cho các luồng chính, tổ chức theo test feature, chạy tự động được trên thiết bị thật và trên simulator.
- Cùng một test suite chạy hai lần liên tiếp cho cùng tập trạng thái.
- Một test case hỏng không làm dừng các test case còn lại.
- Khi thiết bị bị ngắt giữa lượt chạy, lượt chạy dừng và giữ nguyên kết quả phần đã chạy.
- Mỗi lượt chạy tạo một báo cáo và ghi bản ghi kết quả vào SQLite với đủ trường ở FR-DATA-03.
- Với một test case hỏng, báo cáo cho biết bước nào hỏng, các bước đã chạy trước đó, màn hình lúc đó trông thế nào, tên màn hình, loại lỗi và thông báo lỗi gốc.
- QC đính được báo cáo lên Jira và cập nhật trạng thái pass/fail.
- Mọi yêu cầu chức năng và phi chức năng ở tài liệu này được thỏa.

---

## 4. Giả định

Các giả định ở mức toàn dự án nằm ở `brd.md` §11. Phần dưới chỉ gồm những mục phát sinh khi đặc tả Phase 1. Không còn câu hỏi mở nào ở Phase 1.

| Mã | Nội dung | Ảnh hưởng nếu sai |
|---|---|---|
| AS-P1-01 | Một lượt chạy thực thi các test case tuần tự trên một thiết bị. | Phải bổ sung quy tắc về thứ tự và cách gộp kết quả khi chạy song song nhiều thiết bị. |
| AS-P1-02 | Nền tảng không tự chạy lại một test case hỏng. Việc chạy lại do QC chủ động khởi động một lượt chạy mới. | Phải bổ sung quy tắc về trạng thái của test case đạt ở lần chạy lại, và cách lớp phân tích ở Phase 3 tính tỷ lệ vượt qua. |
| AS-P1-03 | Test suite của một ứng dụng đủ nhỏ để một lượt chạy hoàn tất trong một buổi làm việc của QC. | Phải bổ sung cơ chế chạy nền hoặc chia nhỏ lượt chạy. |
| AS-P1-04 | QC khởi chạy và theo dõi lượt chạy trên máy của mình, không cần thông báo khi lượt chạy kết thúc. | Phải bổ sung cơ chế thông báo. |
| AS-P1-05 | Khi lượt chạy bị hủy giữa chừng, biết số lượng test case chưa chạy là đủ để QC quyết định chạy lại; không cần danh sách tên test case chưa chạy. | Phải sinh bản ghi cho test case chưa chạy, kéo theo việc loại chúng khỏi mẫu số khi tính tỷ lệ vượt qua ở Phase 3. |
| AS-P1-06 | Môi trường test tách khỏi production, nên dữ liệu do test case sinh ra không gây ảnh hưởng ngoài phạm vi kiểm thử. | BR-017 quy tắc 3 phải đổi: test case không được tự sinh dữ liệu, và phải có cơ chế khác để đảm bảo tính lặp lại. |
| AS-P1-07 | Dữ liệu do test case sinh ra tích tụ trên môi trường test là chấp nhận được trong Phase 1; chưa cần cơ chế dọn. | Phải bổ sung quy tắc dọn dữ liệu vào phạm vi, hoặc đưa việc reset môi trường test thành ràng buộc vận hành có người chịu trách nhiệm. |
| AS-P1-08 | Thiết bị là tài nguyên dùng chung duy nhất mà mọi test case trong một lượt chạy phụ thuộc vào. | Phải mở rộng BR-018 sang các tài nguyên dùng chung khác, ví dụ dịch vụ backend của ứng dụng. |

Việc phân loại lỗi ở mức chi tiết hơn hai giá trị của BR-014 được xem lại sau khi Phase 1 vận hành, dựa trên các thông báo lỗi gốc đã tích lũy.

---

## Nguồn tham chiếu

| Nội dung lấy từ research | Nguồn |
|---|---|
| Phân cấp test feature và test case: một tệp mô tả một luồng nghiệp vụ, bên trong là nhiều trường hợp cụ thể; mỗi trường hợp kiểm tra một hành vi và chạy độc lập được. Cơ sở cho BR-016, FR-AUTH-09. | [Solving: How to organise feature files? — Cucumber](https://cucumber.io/blog/bdd/solving-how-to-organise-feature-files/), [Cucumber Best Practices](https://www.testmuai.com/blog/cucumber-best-practices/) |
| Dữ liệu kiểm thử tách khỏi kho mã và đưa vào tệp cấu hình bên ngoài; mỗi lượt chạy thao tác trên dữ liệu cô lập để loại bỏ phụ thuộc thứ tự và giữ tính lặp lại. Cơ sở cho BR-017, FR-APP-05, NFR-12. | [Test Data Management Best Practices for Automation — ToolsQA](https://www.toolsqa.com/blogs/test-data-management-best-practices-for-automation/), [Test Data Management: Strategies for Reliable QA — TestRail](https://www.testrail.com/blog/test-data-management/) |
| Phân biệt lỗi do ứng dụng (failed) với lỗi do môi trường hoặc mã kiểm thử (broken). Cơ sở cho BR-014. | [Allure Report — Test statuses](https://allurereport.org/docs/test-statuses/) |
| Các dạng sự cố môi trường thường gặp khi mở phiên Appium trên iOS: WebDriverAgent không khởi động được, thiết bị bị khóa hoặc mất kết nối, phiên bản Xcode và driver lệch nhau, bản build không cài được. Cơ sở cho FR-DEV-02, FR-DEV-04, BR-015, BR-018. | [Appium issue #20450 — Failed to create session](https://github.com/appium/appium/issues/20450), [Infinum QA Handbook — Troubleshooting Appium](https://infinum.com/handbook/qa/automation/mobile/appium/troubleshooting-appium) |
| Chụp màn hình khi một bước hỏng được thực hiện tại điểm móc sau mỗi bước, dựa trên trạng thái của bước. Cơ sở cho FR-EXEC-03 và FR-EXEC-04. | [Take Screenshot for Failed Test Cases in Cucumber](https://www.browserstack.com/guide/take-screenshot-for-failed-test-cases-in-cucumber), [WebdriverIO issue #2190 — Screenshots after failed test](https://github.com/webdriverio/webdriverio/issues/2190) |
| Khuyến nghị không dùng cơ chế chạy lại tự động để che test case thiếu ổn định; chạy lại làm lặp lại toàn bộ phần chuẩn bị. Cơ sở cho AS-P1-02. | [WebdriverIO — Retry Flaky Tests](https://webdriver.io/docs/retry/) |
| Quy trình lấy locator qua Appium Inspector: chọn phần tử trên cây giao diện, đối chiếu locator đề xuất, kiểm chứng locator trong Inspector trước khi đưa vào test case. Thứ tự ưu tiên locator trên iOS: accessibility id, id, rồi mới tới predicate string hoặc class chain. Cơ sở cho FR-AUTH-02, BR-007. | [How to inspect elements using Appium Inspector](https://appiuminspector.com/how-to-inspect-elements-using-appium-inspector/), [Effective Locator Strategies in Appium](https://www.browserstack.com/guide/locators-in-appium) |

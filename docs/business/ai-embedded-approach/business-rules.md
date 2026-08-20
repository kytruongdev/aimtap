# Business Rules — Phase 2

Phase 2 bổ sung AI vào nền tảng. Tài liệu đặc tả ba phần: **tự phục hồi locator** (EP-13/14/15, BR-201→210), **sinh test case** (EP-11/12/18, BR-211→218), và **đa nhà cung cấp AI cùng giao diện cục bộ** (EP-28/29/30, BR-219→223).

Từ vựng trung tâm (test suite, test feature, test case, bước, bằng chứng thực thi, lượt chạy) định nghĩa ở `brd.md` §1.1.

Một **lần tự phục hồi** là một sự việc trong một lượt chạy: một lần tìm phần tử theo locator dự kiến thất bại, nền tảng nhờ AI tìm một cách khác để định vị phần tử đó. Đây là thực thể trung tâm của phần tự phục hồi.

---

## State diagram — vòng đời một lần tự phục hồi

```mermaid
stateDiagram-v2
[*] --> DangThuPhucHoi: đang chạy, locator không tìm thấy (AI đang bật)
DangThuPhucHoi --> DaApDung: tìm được phần tử trong giới hạn số lần thử → dùng, test chạy tiếp
DangThuPhucHoi --> KhongPhucHoiDuoc: AI lỗi, hoặc hết số lần thử mà không tìm được
KhongPhucHoiDuoc --> [*]: bước hỏng như Phase 1
DaApDung --> ChoDuyet: ghi vào báo cáo (kèm ảnh) + tạo sẵn pull request sửa locator
ChoDuyet --> DaVaoNhanhChinh: Reviewer duyệt (đối chiếu ảnh) → locator vào nhánh chính
ChoDuyet --> BiSuaLaiHoacBo: Reviewer sửa lại hoặc bỏ (AI bấm nhầm)
DaVaoNhanhChinh --> [*]
BiSuaLaiHoacBo --> [*]
```

Ghi chú đọc sơ đồ:
- `DangThuPhucHoi` và `DaApDung` xảy ra trong lượt chạy; test chạy tiếp ngay, không dừng chờ người.
- `ChoDuyet → DaVaoNhanhChinh | BiSuaLaiHoacBo` là pull request nền tảng tạo sẵn, được rà soát sau lượt chạy như mọi thay đổi code khác (BR-203, BR-210).
- Trạng thái đạt/hỏng của test case không nằm trong sơ đồ này — nó do các phép kiểm quyết định, độc lập với lần tự phục hồi (BR-204).

---

## BR-201: Điều kiện kích hoạt tự phục hồi
- Quy tắc: Tự phục hồi chỉ kích hoạt khi một lần tìm phần tử theo locator dự kiến thất bại (không tìm thấy) và AI đang bật cho app đó. Không kích hoạt ở mọi lần tìm phần tử.
- Lý do: Gọi AI ở mọi lần tìm phần tử làm tăng chi phí và độ trễ toàn lượt chạy (NFR-05).
- Nếu vi phạm: Chi phí và thời lượng lượt chạy tăng ngoài kiểm soát.
- Áp dụng cho: UC-201.

## BR-202: Số lần thử phục hồi cho một locator hỏng
- Quy tắc: Với mỗi locator hỏng trong một lượt chạy, nền tảng thử phục hồi tối đa một số lần giới hạn (đặt qua giao diện cấu hình theo từng app, lưu ở `apps/<app-id>/app.config.ts`; mặc định 3). Mỗi lần thử là một lời gọi AI. Nếu locator thay thế trả về không tìm thấy phần tử, nền tảng thử lại cho tới hết giới hạn. Khi tìm được phần tử thì dừng thử và dùng phần tử đó; hết giới hạn mà chưa được thì bước hỏng như Phase 1. Locator đã phục hồi được dùng lại trong cùng lượt chạy cho chính locator đó, không thử lại.
- Lý do: Cho vài lần thử để tăng khả năng phục hồi khi AI đoán trượt lần đầu; giới hạn số lần để kiểm soát chi phí và độ trễ (NFR-05).
- Nếu vi phạm: Thử không giới hạn làm chi phí và thời lượng lượt chạy tăng ngoài kiểm soát.
- Áp dụng cho: UC-201, UC-205.

## BR-203: Locator do tự phục hồi chỉ vào nhánh chính qua pull request được duyệt
- Quy tắc: Nền tảng được phép tự ghi locator đã sửa vào code và tạo sẵn một pull request. Nhưng locator đó chỉ vào **nhánh chính** (bộ test case đã tin cậy) sau khi một người rà soát và duyệt pull request. Trong lúc chạy, locator thay thế dùng tạm trong bộ nhớ để lượt chạy đi tiếp; nền tảng không tự merge thay đổi vào nhánh chính giữa lượt chạy.
- Lý do: Khi tự phục hồi giữa một lượt chạy, không ai kiểm được ngay lúc đó AI có bấm trúng phần tử đúng không — bám nhầm thì test đạt giả. Người rà soát (nhìn ảnh phần tử AI đã bấm) là chỗ kiểm điều đó. Mọi thay đổi code vào nhánh chính đều qua pull request được duyệt, dù do người hay AI (BC-08); một lượt chạy hồi quy cũng không được tự sửa chính bộ test đang chạy (NFR-03).
- Nếu vi phạm: Một locator AI bấm nhầm tự đóng băng vào bộ test tin cậy, làm các lượt sau đạt giả mà không ai kiểm.
- Áp dụng cho: UC-201.

## BR-204: Kết quả chức năng độc lập với tự phục hồi
- Quy tắc: Trạng thái đạt hoặc hỏng của một test case do các phép kiểm (assertion) quyết định, không phụ thuộc việc có tự phục hồi hay không. Một test case đạt mà có ít nhất một lần tự phục hồi mang trạng thái "đạt kèm tự phục hồi".
- Lý do: Tự phục hồi là cơ chế phụ trợ để test không dừng giữa chừng, không phải một mức chất lượng thấp hơn của kết quả.
- Nếu vi phạm: Test đúng chức năng bị đánh dấu như kết quả kém, hoặc một lần tự phục hồi bị bỏ qua khỏi kết quả.
- Áp dụng cho: UC-201.

## BR-205: Ghi nhận mọi lần tự phục hồi
- Quy tắc: Mỗi lần tự phục hồi được ghi nhận riêng, gồm: locator dự kiến, locator thay thế đã dùng, màn hình (Page Object) đang thao tác, bước, và thời điểm. Ghi nhận áp dụng kể cả khi test case cuối cùng hỏng.
- Lý do: Một lần tự phục hồi có thể xảy ra nhiều lần trong một test case; và một lần sửa sai có thể chính là nguyên nhân test case hỏng — con người cần thấy đầy đủ từng lần.
- Nếu vi phạm: Con người thiếu thông tin để biết AI đoán đúng hay sai.
- Áp dụng cho: UC-201.

## BR-206: Mỗi lần tự phục hồi đều hiển thị trong báo cáo, kèm ảnh
- Quy tắc: Mỗi lần tự phục hồi đã áp dụng được ghi và hiển thị trong file báo cáo HTML của lượt chạy, **kèm ảnh chụp phần tử mà nền tảng đã thao tác**, để con người xem lại và biết AI bấm trúng thứ cần hay không. Test chạy tiếp ngay khi tự phục hồi, không dừng chờ người; việc xem diễn ra sau khi lượt chạy kết thúc. Không lần tự phục hồi nào bị bỏ khỏi báo cáo.
- Lý do: Rủi ro lớn nhất của tự phục hồi là bám nhầm một phần tử tương tự nhưng sai, làm test báo đạt trong khi ứng dụng đã hỏng (đạt giả). Việc hiển thị đầy đủ trong báo cáo là cơ chế đưa con người vào để chặn rủi ro này (NFR-06).
- Nếu vi phạm: Một lần bám nhầm phần tử lọt qua mà không ai biết.
- Áp dụng cho: UC-201.

## BR-207: Không sửa lại bản ghi lượt chạy đã qua
- Quy tắc: Việc cập nhật (hay không cập nhật) locator vào Page Object sau khi xem một lần tự phục hồi không làm thay đổi bản ghi kết quả của lượt chạy đã qua.
- Lý do: Bản ghi kết quả là sự thật lịch sử của một thời điểm và là nền cho phân tích xu hướng (Phase 4). Trạng thái "đạt kèm tự phục hồi" tự nó đã báo cần chú ý.
- Nếu vi phạm: Lịch sử kết quả bị viết lại, làm sai phân tích xu hướng.
- Áp dụng cho: UC-201.

## BR-208: Ứng xử khi không phục hồi được
- Quy tắc: Nếu AI tắt cho app, AI không phản hồi hoặc lỗi, hoặc hết số lần thử mà không tìm được locator thay thế dùng được, thì không có tự phục hồi; bước hỏng đúng như Phase 1 (ghi nhận hỏng, chụp ảnh tại bước hỏng, chạy tiếp test case kế). Lỗi khi gọi AI không làm dừng lượt chạy và không tự biến kết quả test case.
- Lý do: Tự phục hồi là thứ phụ trợ, không phải thứ đang được kiểm tra; sự cố của nó không được đổi kết luận về ứng dụng.
- Nếu vi phạm: Sự cố hạ tầng AI bị tính thành lỗi của ứng dụng, hoặc làm dừng cả lượt chạy.
- Áp dụng cho: UC-201.

## BR-209: Bật hoặc tắt AI theo từng app
- Quy tắc: Việc gọi AI bật hoặc tắt được theo từng app qua giao diện cấu hình (lưu ở `apps/<app-id>/app.config.ts`). App tắt AI chạy đúng như Phase 1.
- Lý do: Kiểm soát chi phí và độ trễ (NFR-05); đồng thời cho phép tắt AI với app có màn hình chứa dữ liệu nhạy cảm (AS-02).
- Nếu vi phạm: Không tắt được gọi AI khi cần kiểm soát chi phí hoặc khi màn hình có dữ liệu nhạy cảm.
- Áp dụng cho: UC-201, UC-205.

## BR-210: Nền tảng tạo sẵn pull request cho locator đã sửa
- Quy tắc: Với một lần tự phục hồi, nền tảng tự sửa locator trong Page Object và tạo sẵn một pull request. Reviewer đối chiếu ảnh phần tử AI đã bấm rồi duyệt (locator vào nhánh chính) hoặc sửa lại/bỏ nếu AI bấm nhầm. Không ai phải tự tay tìm và chép locator vào code. Nếu AI bấm nhầm, kết quả "đạt kèm tự phục hồi" của lượt chạy đó không đáng tin và cần xem lại; bản ghi lượt chạy vẫn giữ nguyên (BR-207).
- Lý do: AI làm được khâu sửa code như một tester; việc còn lại của con người chỉ là rà soát và duyệt — cùng cổng mà mọi thay đổi code đi qua (BC-08, EP-17).
- Nếu vi phạm: Bắt người dùng tự chép locator thủ công, hoặc để locator AI vào nhánh chính không qua rà soát.
- Áp dụng cho: UC-201.

---

# Phần sinh test case

Thực thể trung tâm của phần này là một **test case do AI sinh**. Vòng đời của nó từ lúc AI sinh tới lúc vào nhánh chính như dưới đây.

## State diagram — vòng đời một test case do AI sinh

```mermaid
stateDiagram-v2
[*] --> BanNhap: QC mô tả bằng lời + page source → AI sinh
BanNhap --> ChayThu: QC chạy thử trên thiết bị
ChayThu --> CanDieuChinh: nhật ký thực thi không khớp điều đã mô tả, hoặc không đạt
CanDieuChinh --> BanNhap: QC chỉnh mô tả và sinh lại
ChayThu --> DaXacNhan: đạt và khớp điều đã mô tả
DaXacNhan --> ChoPheDuyet: QC mở pull request (test được đánh dấu do AI sinh)
ChoPheDuyet --> DaMerge: Reviewer phê duyệt
ChoPheDuyet --> CanDieuChinh: Reviewer trả lại kèm yêu cầu chỉnh sửa
DaMerge --> [*]
```

## BR-211: Đầu vào của việc sinh test case
- Quy tắc: AI sinh test case từ mô tả bằng lời của QC và page source của màn hình đích.
- Lý do: Đây là hai đầu vào QC có được mà không cần viết code (EP-11).
- Nếu vi phạm: Thiếu một trong hai đầu vào thì test case sinh ra không bám đúng màn hình hoặc không đúng ý QC.
- Áp dụng cho: UC-203.

## BR-212: Đầu ra là test case đầy đủ hai phần, ưu tiên tái dùng
- Quy tắc: Kết quả sinh gồm phần mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt; locator đặt trong Page Object. Việc sinh ưu tiên tái dùng câu mô tả hành vi và phần cài đặt đã có, không tạo câu trùng nghĩa mới.
- Lý do: Sinh câu trùng nghĩa làm phần cài đặt phình lên với các câu trùng và phá tính nhất quán của test suite.
- Nếu vi phạm: Phần cài đặt đầy các câu trùng nghĩa, khó bảo trì.
- Áp dụng cho: UC-203.

## BR-213: Test case do AI sinh là bản nháp
- Quy tắc: Test case do AI sinh là bản nháp, không phải bản cuối. QC xác nhận trước khi đưa đi rà soát.
- Lý do: LLM có thể sinh hành vi không được yêu cầu, hoặc bám locator sai mà bước vẫn chạy qua; đầu ra phải được con người kiểm.
- Nếu vi phạm: Một test case sai hoặc thừa đi thẳng vào rà soát mà chưa ai kiểm.
- Áp dụng cho: UC-203.

## BR-214: Xác nhận qua mô tả hành vi, không qua cài đặt
- Quy tắc: QC xác nhận một test case do AI sinh bằng cách đọc phần mô tả hành vi và chạy thử, đối chiếu nhật ký thực thi với điều mình đã mô tả — không cần đọc phần cài đặt.
- Lý do: Từ Phase 2, QC thao tác được mà không cần đọc hay viết phần cài đặt (NFR-08); phần mô tả hành vi phải khớp với hành vi được thực thi (NFR-09).
- Nếu vi phạm: QC buộc phải đọc cài đặt để tin test case, phá mục tiêu hạ ngưỡng kỹ năng của Phase 2.
- Áp dụng cho: UC-203.

## BR-215: Chạy xanh trước khi mở pull request
- Quy tắc: Một test case do AI sinh phải chạy được trên thiết bị ít nhất một lần và đạt trước khi QC mở pull request.
- Lý do: Chặn test case sai hoặc không chạy được tràn vào hàng đợi rà soát và làm mất thời gian Reviewer.
- Nếu vi phạm: Reviewer nhận những test case chưa từng chạy được.
- Áp dụng cho: UC-203.

## BR-216: Đánh dấu test case do AI sinh
- Quy tắc: Test case do AI sinh được đánh dấu rõ là do AI sinh, để Reviewer phân biệt với test case do người viết khi rà soát.
- Lý do: Reviewer cần biết để rà soát kỹ hơn phần AI sinh; đây là điều kiện để đo tỷ lệ pull request AI sinh được duyệt (SM-06).
- Nếu vi phạm: Reviewer không phân biệt được nguồn gốc test case khi rà soát.
- Áp dụng cho: UC-203.

## BR-217: Quyền chấp nhận test case thuộc về con người
- Quy tắc: AI không tự đưa test case vào nhánh chính. Mọi test case, dù do AI sinh hay người viết, vào nhánh chính qua pull request được phê duyệt.
- Lý do: Quyền chấp nhận test case thuộc về con người (NFR-06); mọi thay đổi vào nhánh chính đi qua pull request (BC-08).
- Nếu vi phạm: Test case do AI sinh vào nhánh chính mà không qua rà soát.
- Áp dụng cho: UC-203.

## BR-218: Sinh test case là hành động chủ động, chịu công tắc bật/tắt AI
- Quy tắc: Việc gọi AI để sinh test case do QC chủ động khởi động, không diễn ra trong lúc chạy test. Việc gọi này chịu cùng công tắc bật/tắt AI theo app (BR-209): app tắt AI không sinh được test case qua AI, QC soạn tay như Phase 1.
- Lý do: Kiểm soát chi phí và độ trễ (NFR-05); giữ một chỗ bật/tắt AI duy nhất cho mỗi app.
- Nếu vi phạm: Gọi AI sinh test case ngoài tầm kiểm soát chi phí, hoặc bỏ qua công tắc bật/tắt AI.
- Áp dụng cho: UC-203.

---

# Đa nhà cung cấp AI và giao diện cục bộ

Phần này đặc tả EP-28 (nhiều nhà cung cấp AI), EP-29 (giao diện cấu hình), EP-30 (giao diện mở báo cáo). Thực thể trung tâm là một **nhà cung cấp AI đã khai báo** (ví dụ Claude, GPT), gồm tên nhà cung cấp, model, và khóa.

## State diagram — vòng đời một nhà cung cấp AI đã khai báo

```mermaid
stateDiagram-v2
[*] --> ChuaDung: QC thêm nhà cung cấp (model + khóa) qua giao diện
ChuaDung --> DangDung: đặt làm nhà cung cấp đang dùng
DangDung --> ChuaDung: một nhà cung cấp khác được đặt làm đang dùng
ChuaDung --> [*]: QC gỡ nhà cung cấp
DangDung --> [*]: QC gỡ nhà cung cấp
```

Ghi chú: tại một thời điểm đúng **một** nhà cung cấp ở trạng thái `DangDung`; mọi lời gọi AI dùng nhà cung cấp đó.

## BR-219: Nhiều nhà cung cấp AI, đúng một cái đang dùng
- Quy tắc: QC khai báo được nhiều nhà cung cấp AI, mỗi cái gồm tên nhà cung cấp, model và khóa. Tại một thời điểm đúng một nhà cung cấp được đánh dấu "đang dùng" — **chung cho cả máy, áp cho mọi app**; mọi lời gọi AI — tự phục hồi và sinh test case — dùng nhà cung cấp đang dùng. Việc chọn nhà cung cấp là chung; riêng bật hoặc tắt AI thì theo từng app (BR-209). Nếu chưa có nhà cung cấp đang dùng, các tính năng AI không chạy (như khi AI tắt).
- Lý do: Đội cần chọn được nhà cung cấp (theo chi phí, chất lượng, chính sách) mà không phải sửa nền tảng.
- Nếu vi phạm: Không đổi được nhà cung cấp, hoặc gọi AI khi chưa chọn nhà cung cấp nào.
- Áp dụng cho: UC-205.

## BR-220: Khóa của mọi nhà cung cấp lưu ngoài kho mã
- Quy tắc: Khóa API của mọi nhà cung cấp AI lưu ngoài kho mã, không khóa nào nằm trong kho mã (mở rộng ADR-009 từ một khóa duy nhất sang nhiều khóa).
- Lý do: Khóa là bí mật và gắn với chi phí; lộ khóa gây rủi ro tài chính và lạm dụng.
- Nếu vi phạm: Khóa bị đẩy lên Git, người ngoài lấy được.
- Áp dụng cho: UC-205.

## BR-221: Nội dung test không phụ thuộc nhà cung cấp
- Quy tắc: Test case và Page Object không gắn với nhà cung cấp AI nào. Đổi nhà cung cấp đang dùng không phải sửa nội dung test.
- Lý do: Giữ nền tảng không chứa tri thức riêng của một nhà cung cấp (tinh thần NFR-07), để đổi nhà cung cấp là một thao tác cấu hình.
- Nếu vi phạm: Đổi nhà cung cấp kéo theo sửa hàng loạt test case.
- Áp dụng cho: UC-205.

## BR-222: Mọi thiết lập AI thực hiện qua giao diện cục bộ
- Quy tắc: Mọi thiết lập AI làm qua giao diện chạy cục bộ: thêm/bớt model, nhập/sửa khóa, chọn nhà cung cấp đang dùng (chung cho máy), và bật/tắt AI cùng số lần thử tự phục hồi (theo từng app). Thay đổi được ghi ra nơi lưu cấu hình và khóa ngoài kho mã (khóa) và `app.config.ts` (thiết lập theo app). QC không phải sửa file bằng tay.
- Lý do: Người dùng đặt các thiết lập này mà không phải sửa file cấu hình bằng tay.
- Nếu vi phạm: Buộc sửa file tay, hoặc khóa lọt vào kho mã.
- Áp dụng cho: UC-205.

## BR-223: Giao diện báo cáo chỉ liệt kê và mở file HTML
- Quy tắc: Giao diện báo cáo liệt kê các lượt chạy đã có và mở file HTML report tương ứng; không sinh lại báo cáo và không thay nội dung của nó. Thống kê và biểu đồ đầy đủ thuộc Phase 4 (EP-21).
- Lý do: Phase 2 chỉ cần một lối vào tiện cho báo cáo đã sinh; phần phân tích để đúng phase của nó.
- Nếu vi phạm: Phình phạm vi giao diện sang phần phân tích của Phase 4.
- Áp dụng cho: UC-206.

# Software Requirements Specification — Phase 2

Phase 2 bổ sung AI. Đặc tả ba phần: **tự phục hồi locator** (EP-13/14/15, EP-27), **sinh test case** (EP-11/12/18), và **đa nhà cung cấp AI cùng giao diện cục bộ** (EP-28/29/30).

Từ vựng trung tâm định nghĩa ở `brd.md` §1.1. Quy tắc nghiệp vụ tham chiếu ở `business-rules.md` Phase 2.

EP-26 (lưu khóa API ngoài kho mã): cơ chế một khóa đã có từ Phase 1 (`.env.local`, ADR-009); Phase 2 mở rộng sang nhiều khóa cho nhiều nhà cung cấp (BR-220, FR-PROV-01).

---

## 0. Cách người dùng tương tác với nền tảng

Nền tảng chạy **cục bộ trên máy QC, không phụ thuộc máy chủ từ xa hay dịch vụ hosted** (NFR-01, BC-02). Từ Phase 2 có thêm một **giao diện chạy cục bộ**. Người dùng tương tác qua bốn mặt:

- **Giao diện cục bộ (Phase 2):**
  - *Cấu hình (EP-29):* thêm/bớt AI model, thêm/sửa khóa API, chọn nhà cung cấp AI đang dùng (chung cho máy), và bật/tắt AI cùng số lần thử tự phục hồi (theo từng app).
  - *Báo cáo cơ bản (EP-30):* liệt kê các lượt chạy và mở file HTML report. Thống kê và biểu đồ đầy đủ thuộc Phase 4 (EP-21).
  - Giao diện Phase 2 **không chạy test** — chạy test vẫn qua lệnh CLI `run`.
- **Dòng lệnh (CLI):** các lệnh `doctor` / `run` / `report` (ADR-017).
- **File cấu hình (giao diện ghi ra, không cần sửa tay):** `apps/<app-id>/app.config.ts` (bật/tắt AI, số lần thử tự phục hồi theo app); khóa API lưu ngoài kho mã (ADR-009); `apps/<app-id>/test-data.local.json` (dữ liệu test — QC vẫn điền tay).
- **File báo cáo HTML tĩnh:** mỗi lượt chạy sinh một file `output/<app-id>/reports/<run-id>.html`, ảnh nhúng sẵn (ADR-019). Giao diện báo cáo (EP-30) chỉ liệt kê và mở file này ở Phase 2, không thay thế nó.

---

## 1. Functional Requirements

### FR-HEAL-01: Kích hoạt tự phục hồi khi locator hỏng
- Mô tả: Khi một lần tìm phần tử theo locator dự kiến thất bại trong lúc chạy một bước, và AI đang bật cho app, nền tảng yêu cầu AI tìm một cách định vị khác cho phần tử đó, dựa trên locator đã hỏng, màn hình đang thao tác và page source hiện tại.
- Input: locator dự kiến đã hỏng và định danh của nó; tên màn hình (Page Object) đang thao tác; page source hiện tại.
- Output: nền tảng gọi AI để lấy locator thay thế (tối đa số lần cấu hình được, mặc định 3, cho locator hỏng đó), mỗi lời gọi kèm page source, locator đã hỏng và tên màn hình; thử lại khi locator thay thế chưa tìm thấy phần tử, dừng khi tìm được.
- Business rule liên quan: BR-201, BR-202.

### FR-HEAL-02: Áp dụng locator thay thế và ghi nhận
- Mô tả: Nếu AI trả về một locator thay thế định vị được một phần tử trên màn hình hiện tại, nền tảng dùng phần tử đó để bước tiếp tục, và ghi một lần tự phục hồi.
- Input: locator thay thế từ AI.
- Output: bước tiếp tục với phần tử tìm được; một bản ghi lần tự phục hồi gồm locator dự kiến, locator thay thế đã dùng, màn hình (Page Object), bước, thời điểm.
- Business rule liên quan: BR-203, BR-205.

### FR-HEAL-03: Trạng thái test case khi có tự phục hồi
- Mô tả: Trạng thái đạt hoặc hỏng của test case do các phép kiểm quyết định. Một test case đạt có ít nhất một lần tự phục hồi mang trạng thái "đạt kèm tự phục hồi".
- Input: kết quả các phép kiểm của test case; số lần tự phục hồi trong test case.
- Output: trạng thái test case (đạt / hỏng / đạt kèm tự phục hồi).
- Business rule liên quan: BR-204.

### FR-HEAL-04: Ghi nhận tự phục hồi ở test case hỏng
- Mô tả: Nếu một test case có tự phục hồi nhưng cuối cùng hỏng, các lần tự phục hồi vẫn được ghi và hiển thị trong báo cáo.
- Input: các lần tự phục hồi trong một test case hỏng.
- Output: bản ghi các lần tự phục hồi trong báo cáo, kèm bản ghi test case hỏng.
- Business rule liên quan: BR-205, BR-206.

### FR-HEAL-05: Hiển thị lần tự phục hồi trong báo cáo
- Mô tả: Mỗi lần tự phục hồi đã áp dụng hiển thị trong báo cáo lượt chạy.
- Input: các bản ghi lần tự phục hồi của lượt chạy.
- Output: trong file báo cáo HTML, mỗi lần tự phục hồi hiện: locator dự kiến, locator thay thế đã dùng, ảnh chụp phần tử đã thao tác, màn hình, bước.
- Business rule liên quan: BR-206.

### FR-HEAL-06: Ứng xử khi không phục hồi được
- Mô tả: Nếu AI tắt cho app, AI không phản hồi hoặc lỗi, hoặc hết số lần thử mà không tìm được locator thay thế dùng được, thì không có tự phục hồi; bước hỏng như Phase 1. Lỗi khi gọi AI không làm dừng lượt chạy và không tự biến kết quả test case.
- Input: locator hỏng nhưng không có tự phục hồi khả dụng.
- Output: bước ghi nhận hỏng, chụp ảnh tại bước hỏng, lượt chạy tiếp tục sang test case kế.
- Business rule liên quan: BR-208.

### FR-HEAL-07: Tạo sẵn pull request sửa locator từ một lần tự phục hồi
- Mô tả: Từ một lần tự phục hồi, nền tảng tự sửa locator trong Page Object và tạo sẵn một pull request để Reviewer rà soát.
- Input: một lần tự phục hồi (locator cũ, locator đã dùng, ảnh phần tử đã thao tác).
- Output: một pull request sửa Page Object (kèm ảnh phần tử đã thao tác), chờ rà soát; Reviewer duyệt (locator vào nhánh chính) hoặc sửa lại/bỏ nếu AI bấm nhầm. Bản ghi lượt chạy cũ không đổi.
- Business rule liên quan: BR-203, BR-207, BR-210.

### FR-AI-01: Bật hoặc tắt AI theo từng app
- Mô tả: Việc gọi AI bật hoặc tắt được theo từng app qua giao diện cấu hình. Công tắc này áp cho cả tự phục hồi và sinh test case.
- Input: cấu hình bật/tắt AI của app.
- Output: bật → cho phép gọi AI khi locator hỏng và khi QC yêu cầu sinh test case; tắt → không gọi AI, app chạy và soạn test đúng như Phase 1.
- Business rule liên quan: BR-209, BR-218.

### FR-GEN-01: Sinh test case từ mô tả và page source
- Mô tả: Khi QC yêu cầu và AI đang bật cho app, nền tảng gọi AI sinh một test case từ mô tả bằng lời của QC và page source của màn hình đích.
- Input: mô tả bằng lời của trường hợp cần kiểm thử; page source của màn hình đích.
- Output: một test case gồm phần mô tả hành vi (ngôn ngữ tự nhiên) và phần cài đặt; locator đặt trong Page Object; ưu tiên tái dùng câu mô tả và phần cài đặt đã có.
- Business rule liên quan: BR-211, BR-212, BR-218.

### FR-GEN-02: Xác nhận test case do AI sinh qua mô tả hành vi
- Mô tả: QC xác nhận một test case do AI sinh bằng cách đọc phần mô tả hành vi và chạy thử, đối chiếu nhật ký thực thi với điều đã mô tả — không cần đọc phần cài đặt.
- Input: phần mô tả hành vi của test case; nhật ký thực thi của lần chạy thử.
- Output: test case được xác nhận, hoặc yêu cầu sinh lại.
- Business rule liên quan: BR-213, BR-214.

### FR-GEN-03: Sinh lại sau khi điều chỉnh mô tả
- Mô tả: Nếu test case sinh ra không khớp điều QC mô tả, QC chỉnh mô tả và yêu cầu sinh lại.
- Input: mô tả đã chỉnh.
- Output: test case sinh lại.
- Business rule liên quan: BR-213.

### FR-GEN-04: Chạy xanh trước khi mở pull request
- Mô tả: Một test case do AI sinh phải chạy được trên thiết bị và đạt ít nhất một lần trước khi QC mở pull request.
- Input: test case do AI sinh đã xác nhận.
- Output: một lần chạy đạt trên thiết bị, làm điều kiện để mở pull request.
- Business rule liên quan: BR-215.

### FR-GEN-05: Đánh dấu test case do AI sinh
- Mô tả: Test case do AI sinh được đánh dấu là do AI sinh, hiển thị được khi rà soát pull request (để Reviewer phân biệt với test do người viết).
- Input: test case do AI sinh.
- Output: một nhãn "do AI sinh" gắn với test case, phân biệt được với test case do người viết.
- Business rule liên quan: BR-216, BR-217.

### FR-PROV-01: Quản lý nhà cung cấp AI
- Mô tả: QC thêm hoặc bớt nhà cung cấp AI (tên nhà cung cấp, model), và nhập hoặc sửa khóa của từng cái.
- Input: thao tác thêm/bớt nhà cung cấp; khóa API của nhà cung cấp.
- Output: danh sách nhà cung cấp đã khai báo; khóa lưu ngoài kho mã.
- Business rule liên quan: BR-219, BR-220.

### FR-PROV-02: Chọn nhà cung cấp AI đang dùng
- Mô tả: QC chọn một nhà cung cấp làm "đang dùng".
- Input: lựa chọn một nhà cung cấp trong danh sách.
- Output: đúng một nhà cung cấp ở trạng thái đang dùng tại một thời điểm.
- Business rule liên quan: BR-219.

### FR-PROV-03: Lời gọi AI dùng nhà cung cấp đang dùng
- Mô tả: Tự phục hồi và sinh test case gọi nhà cung cấp AI đang dùng. Chưa có nhà cung cấp đang dùng thì các tính năng AI không chạy (như AI tắt).
- Input: nhà cung cấp đang dùng; một yêu cầu tự phục hồi hoặc sinh test case.
- Output: lời gọi tới nhà cung cấp đang dùng; nội dung test không phụ thuộc nhà cung cấp.
- Business rule liên quan: BR-219, BR-221.

### FR-UI-01: Giao diện cấu hình AI (chạy cục bộ)
- Mô tả: Một giao diện chạy cục bộ cho mọi thiết lập AI: thêm/bớt model, nhập/sửa khóa, chọn nhà cung cấp đang dùng (chung cho máy), và bật/tắt AI cùng số lần thử tự phục hồi (theo từng app).
- Input: thao tác của người dùng trên giao diện.
- Output: cấu hình và khóa ghi ra nơi lưu (khóa ngoài kho mã; thiết lập theo app ở `app.config.ts`); danh sách nhà cung cấp và cái đang dùng hiển thị trên giao diện.
- Business rule liên quan: BR-222, BR-209, BR-202.

### FR-UI-02: Giao diện mở báo cáo lượt chạy (chạy cục bộ)
- Mô tả: Một giao diện chạy cục bộ liệt kê các lượt chạy đã có và mở file HTML report tương ứng.
- Input: người dùng chọn một lượt chạy.
- Output: file HTML report của lượt chạy đó được mở. Giao diện không sinh lại và không thay nội dung báo cáo.
- Business rule liên quan: BR-223.

---

## 2. Non-functional Requirements

### NFR-201: Bảo mật khóa API (chi tiết hóa NFR-04)
Khóa API của các nhà cung cấp AI không nằm trong kho mã. Cơ chế lưu khóa ngoài kho mã có từ Phase 1 (`.env.local`, ADR-009); Phase 2 mở rộng sang nhiều khóa cho nhiều nhà cung cấp, vẫn ngoài kho mã (BR-220).

### NFR-202: Chi phí và độ trễ khi gọi AI (chi tiết hóa NFR-05)
Việc gọi AI lúc chạy kiểm soát được: chỉ gọi khi một locator hỏng (BR-201), tối đa số lần cấu hình được (mặc định 3) cho mỗi locator hỏng trong một lượt chạy (BR-202), và bật/tắt được theo từng app (BR-209).

### NFR-203: Quyền quyết định thuộc về con người (chi tiết hóa NFR-06)
Không locator tự phục hồi nào vào nhánh chính mà chưa qua rà soát. Nền tảng tạo sẵn pull request; Reviewer duyệt hoặc sửa lại (BR-203, BR-210).

### NFR-204: Độ tin cậy của lượt chạy
Sự cố khi tự phục hồi (AI lỗi, mất mạng) không làm dừng lượt chạy và không tự đổi kết quả test case (BR-208).

### NFR-205: Thao tác không cần đọc hay viết cài đặt (chi tiết hóa NFR-08)
QC xác nhận một test case do AI sinh qua phần mô tả hành vi và nhật ký thực thi, không cần đọc phần cài đặt (BR-214).

### NFR-206: Mô tả hành vi khớp với hành vi thực thi (chi tiết hóa NFR-09)
Phần mô tả hành vi của test case do AI sinh phải khớp với hành vi được thực thi; điều kiện chạy xanh trước khi mở pull request (BR-215) giúp phát hiện lệch trước khi rà soát.

---

## 3. Giả định và câu hỏi mở

- `GIẢ ĐỊNH:` Dữ liệu hiển thị trên màn hình của app được kiểm thử không chứa dữ liệu thật nhạy cảm, nên page source gửi tới AI không bị giới hạn (kế thừa AS-02). Rủi ro này được chấp nhận cho Phase 2; cơ chế lọc/che dữ liệu và việc tắt AI theo từng test case vì lý do nhạy cảm để dành cho phase sau. Biện pháp hiện tại là bật/tắt AI theo app (BR-209). Áp dụng cho cả page source gửi khi tự phục hồi và khi sinh test case.
- `GIẢ ĐỊNH:` Để tự phục hồi, AI cần biết phần tử cần tìm là gì, không chỉ locator đã hỏng. Phase 2 giả định gửi AI locator đã hỏng + tên màn hình (Page Object) + page source là đủ để AI suy ra ý định, vì định danh của locator thường đã mang nghĩa (ví dụ `Login-button`). Nếu chạy thật cho thấy chưa đủ (ảnh hưởng SM-05 — tỷ lệ phục hồi thành công), bổ sung một mô tả ngắn dễ đọc cho từng locator trong Page Object. SA cân nhắc khi thiết kế phần tự phục hồi.
- `PHẠM VI:` Phase 2 hỗ trợ **nhiều nhà cung cấp AI** (Claude, GPT, …): lưu khóa cho từng nhà cung cấp, thêm/bớt model, chọn nhà cung cấp đang dùng (EP-28). Lời gọi AI đi qua một lớp trừu tượng nhà-cung-cấp thay vì gắn cứng vào một nhà cung cấp.
- `GIẢ ĐỊNH:` Giao diện Phase 2 lo phần **cấu hình** (nhà cung cấp/khóa/AI đang dùng) và **mở báo cáo**. Nhưng **soạn hoặc sửa code test case và thao tác git/pull request vẫn cần kỹ năng kỹ thuật** — Phase 2 chưa có giao diện cho các việc đó. Nếu người dùng QC không quen git/code thì vẫn cần một người kỹ thuật cho khâu này.
- `CÂU HỎI MỞ:` Nếu công ty cần một định nghĩa chính thức về "dữ liệu nhạy cảm", định nghĩa đó do Product Owner / bên quản lý dữ liệu đặt, không thuộc phạm vi nền tảng. Chưa cần cho Phase 2.
- `CÂU HỎI MỞ:` Nền tảng có nên hiển thị số lần gọi AI hoặc chi phí ước tính (để đội theo dõi ngân sách) không? Phase 2 hiện chỉ kiểm soát chi phí bằng bật/tắt AI và giới hạn số lần thử (NFR-05), chưa hiển thị mức dùng. Cân nhắc nếu Product Owner muốn thấy chi phí.
- `GHI CHÚ ĐO LƯỜNG:` SM-04 (thời gian soạn một test case mới, so trước và sau khi có AI) cần một con số "trước khi có AI" làm mốc. Đề xuất: trước khi bật AI, QC bấm giờ soạn một mẫu 5–10 test case (từ lúc bắt đầu tới khi chạy xanh) làm mốc; sau khi có AI đo lại trên số lượng tương đương. Nền tảng không tự đo thời gian soạn. SM-05 (số lần tự phục hồi thành công) và SM-06 (tỷ lệ pull request AI sinh được duyệt) được nền tảng hỗ trợ sẵn qua ghi nhận từng lần tự phục hồi (BR-205) và nhãn đánh dấu test do AI sinh (BR-216).

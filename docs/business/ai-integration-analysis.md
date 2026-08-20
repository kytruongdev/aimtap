# Phân tích lựa chọn: cách tích hợp AI vào nền tảng

Tài liệu phân tích hai cách đưa AI vào `aimtap` để product team cân nhắc và quyết định. Quyết định thuộc về product team; tài liệu này chỉ làm rõ đánh đổi.

Phạm vi ảnh hưởng: **cách tích hợp AI vào nền tảng**. Toàn bộ phần chạy test, thu bằng chứng, báo cáo và lưu kết quả **không đổi ở cả hai phương án**. Mục tiêu (giảm thời gian soạn test, giảm chi phí bảo trì, con người giữ quyền quyết qua pull request) cũng giữ nguyên; chỉ *cách đạt* thay đổi.

Người dùng nền tảng là **QC automation (biết code)** — cả hai phương án đều do nhóm này vận hành. Vì vậy "ai dùng" không phải điểm phân biệt giữa A và B.

---

## 1. Hai phương án

### Phương án A — AI nằm bên trong nền tảng (khép kín)
AI là một thành phần **bên trong** nền tảng, gọi qua khóa API. Nền tảng tự thực hiện các việc dùng AI: sinh test case, tự phục hồi locator **lúc chạy**, và các thao tác AI khác. Người dùng thao tác với nền tảng; nền tảng điều phối AI.

- **Tác nhân làm việc:** nền tảng.
- **Nền tảng sở hữu:** cách gọi AI, lớp đa nhà cung cấp, lưu khóa, giao diện cấu hình AI, cơ chế tự phục hồi lúc chạy, lệnh sinh test, cách soạn yêu cầu gửi AI, đo mức dùng.

### Phương án B — AI CLI bên ngoài (QC automation điều khiển)
AI **không** nằm trong nền tảng. QC automation dùng một **AI CLI bên ngoài** (ví dụ Claude Code) đọc acceptance criteria / yêu cầu nghiệp vụ để sinh kịch bản test, tạo test script, chạy test, yêu cầu tự phục hồi locator. QC automation trao đổi với công cụ đó; kết quả cuối (file mới/sửa) tự mở pull request.

- **Tác nhân làm việc:** QC automation + công cụ AI ngoài.
- **Nền tảng sở hữu:** phần chạy test + báo cáo + lưu kết quả, cộng việc được thiết kế sao cho một AI CLI bên ngoài **đọc và điều khiển được dễ dàng** (cấu trúc rõ, đầu ra máy đọc được, tài liệu và acceptance criteria mạch lạc). Nền tảng không gọi AI.

---

## 2. Tiêu chí đánh giá

So sánh hai phương án trên các trục sau: người dùng và kỹ năng; quy trình làm việc; phạm vi và chi phí xây/bảo trì nền tảng; chi phí vận hành; cài đặt máy; kiểm soát và an toàn; chất lượng kết quả AI; tự do đổi công cụ; bảo mật dữ liệu; tự phục hồi lúc chạy; tác động tới công việc đã làm; rủi ro và phụ thuộc.

---

## 3. Phân tích từng trục

### 3.1. Người dùng và kỹ năng cần có
Người vận hành ở cả hai phương án là **QC automation (biết code)** — nên "ai dùng" không phải điểm khác biệt. Khác biệt nằm ở kỹ năng phụ và điểm thao tác:
- **A:** QC automation thao tác qua các tính năng AI của nền tảng. Không cần quen một công cụ AI ngoài; chỉ cần biết dùng nền tảng.
- **B:** QC automation trao đổi với một AI CLI bên ngoài và tự mở pull request. Cần **thêm** kỹ năng điều khiển một AI CLI (soạn yêu cầu, đọc và kiểm kết quả của công cụ).
- **Khác biệt cốt lõi:** B đòi hỏi thêm sự thành thạo một công cụ AI ngoài; A không.
- **Hệ quả cho mục tiêu:** vì người dùng đã biết code, lợi thế "cho người không biết code cũng soạn được test" **không còn là điểm phân biệt** giữa A và B.

### 3.2. Quy trình làm việc
- **A:** Khép kín, trong nền tảng. Người dùng ra lệnh, nền tảng làm, cho ra pull request. Chuẩn hóa, đồng nhất giữa mọi người dùng.
- **B:** Tương tác mở với công cụ ngoài. Mạnh và linh hoạt, nhưng **kết quả phụ thuộc cách QC automation điều khiển công cụ**; ít chuẩn hóa hơn.
- **Khác biệt cốt lõi:** A đồng nhất, lặp lại được; B mạnh và linh hoạt nhưng phụ thuộc kỹ năng người dùng.

### 3.3. Phạm vi và chi phí xây/bảo trì nền tảng
- **A:** Nền tảng phải xây và **tự bảo trì lâu dài** một hệ con AI khá lớn: AI Client, lớp đa nhà cung cấp, lưu khóa, giao diện cấu hình, điều phối tự phục hồi lúc chạy, lệnh sinh test, soạn prompt, đo token.
- **B:** Nền tảng mỏng đi (gần như chỉ còn phần chạy test và báo cáo). Phần phức tạp của AI nằm ở công cụ ngoài — **bên khác xây và bảo trì**.
- **Khác biệt cốt lõi:** B giảm mạnh khối lượng đội phải xây và nuôi về sau. Với một công cụ nội bộ, đây là điểm lợi lớn của B.

### 3.4. Chi phí vận hành
- **A:** Trả theo lượt gọi API. Tăng theo mức dùng; tự phục hồi lúc chạy tiêu token ở **mỗi lượt hồi quy**, có thể dồn lại đáng kể. Cần quản khóa và ngân sách.
- **B:** Thuê bao AI CLI (product team đánh giá rẻ hơn). Mỗi người dùng cần một chỗ ngồi/thuê bao.
- **Khác biệt cốt lõi:** B được đánh giá rẻ hơn; chi phí A trôi theo mức tự động hóa.

### 3.5. Cài đặt máy và hạ tầng
- **A:** Máy QC automation không cần cài AI CLI; chỉ cần nền tảng + cấu hình khóa. Cài đặt nhẹ, khóa tập trung.
- **B:** **Mọi máy chạy platform phải cài và đăng nhập AI CLI.** Cài đặt nặng hơn theo từng máy; phụ thuộc sự sẵn sàng và cập nhật của công cụ ngoài.
- **Khác biệt cốt lõi:** A nhẹ và tập trung; B mỗi máy phải trang bị công cụ ngoài.

### 3.6. Kiểm soát và an toàn (quyền con người)
- **A:** Nền tảng hành động **tự động** (tự phục hồi giữa lượt chạy, tự sinh) — nên phải xây nhiều rào chắn: đánh dấu test AI sinh, tự tạo pull request, rà soát, bản ghi bất biến, chặn "đạt giả". Chính tính tự động là rủi ro.
- **B:** QC automation ở trong vòng suốt quá trình, xem kết quả trước khi commit. Quyền con người có sẵn theo bản chất (QC automation điều khiển + tự mở PR); ít rủi ro AI tự quyết. *Lưu ý:* phụ thuộc kỷ luật của người dùng; không có dấu vết/đánh dấu bắt buộc trừ khi tự thêm.
- **Khác biệt cốt lõi:** B có con-người-trong-vòng theo mặc định (ít nguy cơ "đạt giả" âm thầm); A phải kỹ thuật hóa rào chắn nhưng bù lại có dấu vết kiểm toán nhất quán.

### 3.7. Chất lượng và độ nhất quán của kết quả AI
- **A:** Prompt do nền tảng cố định và kiểm soát → nhất quán nhưng bị giới hạn bởi chất lượng prompt đội tự soạn.
- **B:** Một AI CLI trưởng thành (như Claude Code) đọc được cả kho mã + AC + tài liệu nghiệp vụ và tự lặp → kết quả **bám ngữ cảnh tốt hơn** một prompt cố định trong nền tảng. Bù lại kém đồng nhất, thay đổi theo người dùng.
- **Khác biệt cốt lõi:** B có tiềm năng cho kết quả tốt và bám ngữ cảnh hơn; A ổn định và đoán trước được hơn.

### 3.8. Tự do đổi công cụ / không khóa cứng nhà cung cấp
- **A:** Đội phải **tự xây** lớp đa nhà cung cấp để đổi được.
- **B:** QC automation tự chọn công cụ CLI mình quen — tự do đổi có sẵn, không phải xây gì.
- **Khác biệt cốt lõi:** B cho tự do công cụ miễn phí; A phải bỏ công xây.

### 3.9. Bảo mật dữ liệu
- **A:** Nền tảng gửi page source tới API — đội **kiểm soát được** gửi gì, có thể thêm bộ lọc.
- **B:** Công cụ ngoài chạy trên máy QC automation tự đọc file/AC và gửi tới nhà cung cấp của nó — đội **ít kiểm soát** đường dữ liệu hơn, nhưng cũng bớt trách nhiệm.
- **Khác biệt cốt lõi:** cùng loại rủi ro (dữ liệu rời ra một nhà cung cấp AI); A kiểm soát nhiều hơn, B giao phó cho công cụ ngoài.

### 3.10. Tự phục hồi locator lúc chạy (điểm khác biệt then chốt)
- **A:** Làm được — nền tảng tự phục hồi **giữa một lượt hồi quy không người ngồi canh** (giữ cho một lượt 50 test chạy suốt). Đây là một năng lực thật.
- **B:** **Không làm được theo cách đó.** AI CLI do QC automation điều khiển, mang tính tương tác; không có ai tự phục hồi giữa một lượt chạy tự động. Ở B, tự phục hồi trở thành việc **QC automation nhờ CLI sửa file rồi chạy lại lúc soạn**, không phải cơ chế lúc chạy.
- **Khác biệt cốt lõi:** Nếu đội cần **lượt hồi quy tự động tự vượt qua locator hỏng mà không người can thiệp**, chỉ A đáp ứng. Nếu tự phục hồi lúc soạn là đủ, B ổn. Đây là một trong hai câu hỏi quyết định.

### 3.11. Tác động tới công việc đã làm
- **A:** Là hướng đang được thiết kế và triển khai — đi tiếp, không phải làm lại.
- **B:** Làm lỗi thời phần lớn thiết kế đang có: mảng đa nhà cung cấp, giao diện cấu hình, lưu khóa gần như bỏ; phần tự phục hồi và sinh test phải viết lại theo mô hình "QC automation + AI CLI ngoài". Tốn thêm thời gian thiết kế và đặc tả lại.
- **Khác biệt cốt lõi:** A không phải làm lại; B tốn công làm lại nhưng cho ra một nền tảng gọn hơn.

### 3.12. Rủi ro và phụ thuộc
- **A:** Phụ thuộc API nhà cung cấp, chất lượng prompt của đội, và **gánh nặng bảo trì một hệ con AI phức tạp** do đội tự sở hữu.
- **B:** Phụ thuộc một **công cụ ngoài** (Claude Code): sự sẵn sàng, giá, thay đổi hành vi, và khóa vào hệ sinh thái của công cụ đó. Ngoài ra một phiên tương tác người+AI **khó lặp lại đúng** hơn một hàm của nền tảng.
- **Khác biệt cốt lõi:** A ôm phức tạp và rủi ro vào trong; B đẩy phức tạp ra ngoài nhưng nhận lấy phụ thuộc công cụ ngoài và tính lặp-lại kém hơn.

---

## 4. Bảng so sánh tóm tắt

| Trục | Phương án A (AI bên trong) | Phương án B (AI CLI bên ngoài) |
|---|---|---|
| Tác nhân làm việc | Nền tảng | QC automation + công cụ AI ngoài |
| Người dùng | QC automation (biết code) | QC automation (biết code) + quen AI CLI |
| Quy trình | Khép kín, chuẩn hóa | Tương tác, linh hoạt, tùy người |
| Khối lượng đội xây/bảo trì | Lớn (cả hệ con AI) | Nhỏ (nền tảng mỏng) |
| Chi phí vận hành | Trả theo lượt gọi | Thuê bao CLI (rẻ hơn) |
| Cài đặt máy | Nhẹ, khóa tập trung | Mỗi máy phải cài AI CLI |
| Quyền con người | Cần xây rào chắn | Có sẵn (QC automation trong vòng) |
| Chất lượng AI | Nhất quán, bị prompt giới hạn | Bám ngữ cảnh tốt hơn, kém đồng nhất |
| Đổi nhà cung cấp | Phải tự xây | Có sẵn (QC automation tự chọn) |
| Kiểm soát dữ liệu | Nhiều hơn | Ít hơn |
| Tự phục hồi lúc chạy (không người canh) | **Có** | **Không** (chỉ lúc soạn) |
| Tác động công việc đã làm | Không phải làm lại | Phải làm lại một phần thiết kế + đặc tả |
| Phụ thuộc chính | API + hệ con AI tự nuôi | Công cụ ngoài + tính lặp-lại kém |

---

## 5. Câu hỏi quyết định

Người vận hành đã chốt là **QC automation (biết code)** — nên câu "ai dùng" không còn là biến số. Quyết định A hay B giờ quy chủ yếu về một câu:

1. **Có cần tự phục hồi lúc chạy, trong lượt hồi quy không người ngồi canh không?** Nếu **có** → chỉ **A** làm được. Nếu tự phục hồi lúc soạn (nhờ CLI sửa rồi chạy lại) là đủ → **B** ổn.

Hai yếu tố phụ ảnh hưởng cân nhắc: ngân sách nghiêng về trả-theo-lượt-gọi (A) hay thuê-bao CLI (B); và đội có sẵn lòng tự xây + bảo trì một hệ con AI phức tạp (A) hay muốn nền tảng gọn, đẩy phức tạp ra công cụ ngoài (B) không.

---

## 6. Khuyến nghị (không thay quyết định của product team)

Vì người vận hành đã chốt là QC automation biết code, **lợi thế lớn nhất của A — cho người không biết code dùng được AI — không còn**. Khi đó cán cân phụ thuộc chủ yếu vào nhu cầu tự phục hồi lúc chạy và khẩu vị xây/bảo trì:

- **Chọn B nếu:** **không** cần tự phục hồi tự động lúc chạy; muốn nền tảng gọn, ít phải xây và bảo trì; ưu tiên chi phí thấp và tận dụng một công cụ ngoài mạnh; chấp nhận kết quả kém đồng nhất và phụ thuộc công cụ ngoài.
- **Chọn A nếu:** **cần** tự phục hồi lúc chạy cho hồi quy không người canh; hoặc muốn một quy trình AI chuẩn hóa, có dấu vết, lặp lại được do nền tảng kiểm soát; và sẵn sàng xây, bảo trì hệ con AI cùng trả chi phí theo lượt gọi.

**Nhận định:** với một công cụ **nội bộ** do QC automation biết code vận hành, **B cắt được rất nhiều thứ đội phải tự xây và nuôi** (đa nhà cung cấp, giao diện cấu hình, lưu khóa, điều phối AI) và tận dụng một công cụ chín như Claude Code. Điểm duy nhất khiến A còn cần thiết là **tự phục hồi lúc chạy cho lượt hồi quy không người canh**. Vì vậy câu cần trả lời trước tiên là đội có thật sự cần năng lực đó không; nếu không, cán cân nghiêng rõ về B.

**Một hướng lai để cân nhắc:** làm sinh test theo B (QC automation dùng Claude Code sinh/soạn), nhưng giữ một cơ chế tự phục hồi lúc chạy gọn nhẹ theo A **chỉ khi** đội cần lượt hồi quy tự động. Hướng lai giữ được năng lực chạy tự động mà không phải xây cả mảng đa nhà cung cấp/giao diện của A — nhưng làm ranh giới trong/ngoài phức tạp hơn, cần cân nhắc kỹ về mặt kỹ thuật.

---

## 7. Tác động lộ trình nếu đổi hướng

- Đây là **lần thứ ba** cách tích hợp AI thay đổi (mô hình tự phục hồi → đa nhà cung cấp + giao diện → trong/ngoài). Khuyến nghị: **chốt dứt điểm mô hình tích hợp AI trước khi làm tiếp**, vì mỗi lần đổi kéo theo viết lại cả phần đặc tả lẫn thiết kế.
- Nếu chọn **B**: viết lại phần sinh test và tự phục hồi theo mô hình "QC automation + AI CLI ngoài"; bỏ mảng đa nhà cung cấp, giao diện cấu hình và lưu khóa khỏi phạm vi nền tảng; xem lại lời hứa "không cần biết code", dòng giá trị và các ràng buộc (chi phí, cài đặt máy).
- Nếu giữ **A**: không phải làm lại; tiếp tục với thiết kế và đặc tả đang có.

---

## 8. Giả định và điểm chưa rõ

- `GIẢ ĐỊNH:` Đánh giá "B rẻ hơn" lấy theo nhận định của product team; con số cụ thể (thuê bao CLI so với trả-theo-lượt-gọi ở mức dùng thực tế) chưa đo.
- `CÂU HỎI MỞ:` Ở B, nền tảng còn "chủ động" gì về AI không, hay hoàn toàn thụ động để công cụ ngoài điều khiển? Câu trả lời định hình lại toàn bộ luồng thao tác của người dùng.
- `CÂU HỎI MỞ:` Đội có thật sự cần lượt hồi quy tự động tự phục hồi không người canh không? Đây là năng lực chỉ A có, và giờ là câu định hướng lớn nhất giữa A và B.

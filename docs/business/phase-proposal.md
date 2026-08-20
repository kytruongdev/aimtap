# Phase Proposal

Lộ trình gồm bốn phase. Tài liệu này soi chiếu lộ trình theo quan hệ phụ thuộc giữa các epic, và nêu rõ epic nào bị loại khỏi từng phase cùng lý do. Mục tiêu go-live là nền tảng phủ cả iOS, Android và AI; lớp phân tích dữ liệu đi sau cùng.

Từ vựng trung tâm (test suite, test feature, test case, bước) định nghĩa ở `brd.md` §1.1.

---

## Phase 1 — Nền tảng thực thi, chưa có AI

**Mục tiêu:** QC khai báo được một ứng dụng iOS vào nền tảng, chạy được một vòng hồi quy tự động trên các luồng chính của ứng dụng đó, nhận báo cáo đính được vào Jira, và dữ liệu kết quả bắt đầu tích lũy.

**Vì sao làm phase này trước:**
Toàn bộ giá trị của hai phase sau đều bám vào tầng thực thi của phase này. AI ở Phase 2 không tạo ra một luồng chạy mới — nó bọc quanh hai điểm đã tồn tại trong Phase 1: bước soạn test case (sinh test case) và bước tìm phần tử lúc chạy (tự phục hồi locator). Nếu chưa có test case chạy được và chưa có Page Object để đặt locator vào, thì không có chỗ để gắn AI. Lớp phân tích ở Phase 3 đọc dữ liệu do Phase 1 ghi ra; dữ liệu chỉ có giá trị khi đã tích lũy qua nhiều lượt chạy, nên Phase 1 phải chạy thật một khoảng thời gian trước khi Phase 3 có gì để phân tích.

Ba nhóm epic trong Phase 1 mang tính nền móng dù giá trị của chúng hiện ra muộn hơn:
- EP-19 (ghi bản ghi kết quả có cấu trúc) — dữ liệu không ghi tại thời điểm chạy thì không thu thập ngược lại được.
- EP-24, EP-25 (khai báo ứng dụng từ bên ngoài, vận hành nhiều ứng dụng) — nếu tri thức của ứng dụng đầu tiên bị gắn cứng vào nền tảng ngay từ Phase 1, việc tách ra về sau đòi hỏi làm lại tầng thực thi.
- EP-17 (rà soát và phê duyệt test case qua pull request) — quy trình phê duyệt phải vận hành ổn định trước khi AI bắt đầu sinh test case ở Phase 2, vì đó là cơ chế duy nhất chặn test case sai đi vào nhánh chính.

**Epic bao gồm:** EP-01, EP-02, EP-03, EP-04, EP-05, EP-06, EP-07, EP-08, EP-09, EP-17, EP-19, EP-23, EP-24, EP-25.

**Epic loại trừ:**
| Epic | Lý do loại |
|---|---|
| EP-11 → EP-15, EP-18 (AI) | Thuộc Phase 2. Phụ thuộc vào tầng thực thi và cấu trúc Page Object của Phase 1. |
| EP-16 (Android) | Thuộc Phase 3. Android là mở rộng nền tảng sang một hệ điều hành khác, tách khỏi phần AI. |
| EP-20, EP-21 (phân tích) | Thuộc Phase 4. Chưa có dữ liệu tích lũy để phân tích. |
| EP-22 (tổng hợp đa máy) | Ngoài phạm vi. |

---

## Phase 2 — Bổ sung AI

**Mục tiêu:** Thời gian soạn test case mới và chi phí bảo trì test case khi giao diện thay đổi đều giảm, nhờ AI (sinh test từ mô tả, tự phục hồi locator). Quyền chấp nhận test case vẫn thuộc về con người, thực hiện qua phê duyệt pull request.

**Phụ thuộc vào:** Phase 1 — cấu trúc Page Object (EP-02) làm nơi đặt locator được sinh ra và được sửa; tầng thực thi (EP-05) làm nơi chèn bước tự phục hồi khi không tìm thấy phần tử; cơ chế ghi bản ghi kết quả (EP-19) làm nơi ghi nhận mỗi lần tự phục hồi; quy trình phê duyệt pull request (EP-17) làm cơ chế kiểm soát test case do AI sinh.

**Vì sao không làm sớm hơn:**
Hai chức năng AI đều cần một đầu vào chỉ có sau khi Phase 1 chạy thật. Sinh test case cần một tập câu mô tả hành vi và step definition đã được chấp nhận để test case sinh ra bám theo. Tự phục hồi cần biết locator nào đang dùng và hỏng theo kiểu nào; nếu chưa có test case chạy đủ nhiều thì chưa xác định được cơ chế tự phục hồi có giải quyết đúng vấn đề hay không.

**Epic bao gồm:** EP-11, EP-12, EP-13, EP-14, EP-15, EP-18, EP-26, EP-27, EP-28, EP-29.

**Ghi chú phạm vi:** Nền tảng dùng AI bằng cách chủ động gọi một **AI CLI bên ngoài** (như Claude Code) (EP-28); xác thực bằng một **token** lưu ngoài kho mã (EP-26); và một bước **cài đặt/kiểm tra CLI** trên máy (EP-29). Không nhúng khóa API, không quản đa nhà cung cấp, không có giao diện đồ họa. Người dùng là QC automation biết code.

**Epic loại trừ:**
| Epic | Lý do loại |
|---|---|
| EP-16 (Android) | Thuộc Phase 3. Mở rộng nền tảng sang Android, không liên quan tới phần AI của Phase 2. |
| EP-20, EP-21 (phân tích) | Thuộc Phase 4. Dữ liệu tích lũy còn ít; hoãn tới khi lượng lượt chạy đủ để xu hướng có ý nghĩa. |
| EP-22 (tổng hợp đa máy) | Ngoài phạm vi. |

---

## Phase 3 — Android

**Mục tiêu:** Nền tảng soạn và chạy được test case cho ứng dụng Android bên cạnh iOS đã có, để đạt mục tiêu go-live phủ cả hai hệ điều hành.

**Phụ thuộc vào:** Phase 1 — toàn bộ tầng thực thi, Page Object, thu thập bằng chứng, ghi kết quả và báo cáo được xây trước cho iOS; Android tái dùng các tầng này và bổ sung phần điều khiển thiết bị, tìm phần tử và cài build đặc thù Android. Không phụ thuộc Phase 2: phần AI áp được cho Android nếu đã có, nhưng Android chạy được mà không cần AI.

**Vì sao đặt sau Phase 2:**
Nền tảng Phase 1 được xây trước cho một hệ điều hành để chứng minh giá trị nhanh; giá trị AI ở Phase 2 đo được độc lập với việc thêm hệ điều hành. Đưa Android vào trước khi AI chứng minh được giá trị sẽ nhân đôi diện tích nền tảng trong khi chưa rõ AI có hiệu quả không. Android đứng sau AI vì là mở rộng bề rộng sang một hệ điều hành khác, độc lập với phần AI; đứng trước phân tích vì thuộc mục tiêu go-live, còn phân tích chỉ có giá trị sau khi dữ liệu tích lũy đủ.

**Epic bao gồm:** EP-16.

**Epic loại trừ:**
| Epic | Lý do loại |
|---|---|
| EP-20, EP-21 (phân tích) | Thuộc Phase 4. |
| EP-22 (tổng hợp đa máy) | Ngoài phạm vi. |

---

## Phase 4 — Phân tích và biểu đồ

**Mục tiêu:** QC Lead trả lời được các câu hỏi về xu hướng chất lượng từ dữ liệu đã tích lũy, làm cơ sở điều chỉnh phạm vi test case và ưu tiên sửa lỗi.

**Phụ thuộc vào:** Phase 1 (EP-19 — dữ liệu kết quả đã ghi đủ trường và đã tích lũy qua nhiều lượt chạy). Không phụ thuộc Phase 2 hay Phase 3; lớp phân tích đọc dữ liệu kết quả đã có, không yêu cầu thay đổi tầng chạy test và không phân biệt dữ liệu đến từ iOS hay Android.

**Vì sao làm sau cùng:**
Giá trị của lớp phân tích tỷ lệ thuận với lượng dữ liệu đã tích lũy. Xác định test case thiếu ổn định dựa trên việc trạng thái đổi qua lại giữa nhiều lượt chạy liên tiếp; với ít lượt chạy, kết luận không có cơ sở. Xây lớp này trước khi có dữ liệu tạo ra một giao diện rỗng, không dùng được.

**Epic bao gồm:** EP-20, EP-21.

**Epic loại trừ:** EP-22 — ngoài phạm vi.

---

## Trình tự các phase

Trình tự bốn phase bám theo quan hệ phụ thuộc giữa các epic và nguyên tắc chứng minh giá trị trước khi mở rộng:

- **Phase 1 (iOS, không AI)** đứng đầu vì mọi phase sau bám vào tầng thực thi của nó: AI bọc quanh các điểm đã có, Android tái dùng các tầng đã có, phân tích đọc dữ liệu do nó ghi ra.
- **Phase 2 (AI)** đứng thứ hai vì hai chức năng AI cần một tập test case và Page Object đã chạy thật để bám theo, và để đo được giá trị AI trên một nền tảng gọn trước khi mở rộng bề rộng.
- **Phase 3 (Android)** đứng sau AI vì là mở rộng sang một hệ điều hành khác, độc lập với phần AI; đứng trước phân tích vì thuộc mục tiêu go-live.
- **Phase 4 (phân tích)** đứng cuối vì giá trị của nó tỷ lệ thuận với lượng dữ liệu đã tích lũy qua nhiều lượt chạy.

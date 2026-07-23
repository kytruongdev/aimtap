# Phase Proposal

Lộ trình ba giai đoạn đã được xác định từ tài liệu yêu cầu. Tài liệu này soi chiếu lại lộ trình đó theo quan hệ phụ thuộc giữa các epic, và nêu rõ epic nào bị loại khỏi từng phase cùng lý do.

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
| EP-11 → EP-15, EP-18 (AI) | Phụ thuộc vào tầng thực thi và cấu trúc Page Object của Phase 1. |
| EP-20, EP-21 (phân tích) | Không có dữ liệu tích lũy để phân tích. |
| EP-16 (Android) | Ngoài phạm vi. Nguồn lực tập trung cho iOS. |
| EP-22 (tổng hợp đa máy) | Ngoài phạm vi. |

---

## Phase 2 — Bổ sung AI

**Mục tiêu:** Người soạn test case không cần biết lập trình; thời gian soạn test case mới và chi phí bảo trì test case khi giao diện thay đổi đều giảm. Quyền chấp nhận test case vẫn thuộc về con người, thực hiện qua phê duyệt pull request.

**Phụ thuộc vào:** Phase 1 — cấu trúc Page Object (EP-02) làm nơi đặt locator được sinh ra và được sửa; tầng thực thi (EP-05) làm nơi chèn bước tự phục hồi khi không tìm thấy phần tử; cơ chế ghi bản ghi kết quả (EP-19) làm nơi ghi nhận mỗi lần tự phục hồi; quy trình phê duyệt pull request (EP-17) làm cơ chế kiểm soát test case do AI sinh.

**Vì sao không làm sớm hơn:**
Hai chức năng AI đều cần một đầu vào chỉ có sau khi Phase 1 chạy thật. Sinh test case cần một tập câu mô tả hành vi và step definition đã được chấp nhận để test case sinh ra bám theo. Tự phục hồi cần biết locator nào đang dùng và hỏng theo kiểu nào; nếu chưa có test case chạy đủ nhiều thì chưa xác định được cơ chế tự phục hồi có giải quyết đúng vấn đề hay không.

**Epic bao gồm:** EP-11, EP-12, EP-13, EP-14, EP-15, EP-18, EP-26, EP-27.

**Epic loại trừ:**
| Epic | Lý do loại |
|---|---|
| EP-20, EP-21 (phân tích) | Dữ liệu tích lũy còn ít; hoãn tới khi lượng lượt chạy đủ để xu hướng có ý nghĩa. |
| EP-16, EP-22 | Ngoài phạm vi. |

---

## Phase 3 — Phân tích và biểu đồ

**Mục tiêu:** QC Lead trả lời được các câu hỏi về xu hướng chất lượng từ dữ liệu đã tích lũy, làm cơ sở điều chỉnh phạm vi test case và ưu tiên sửa lỗi.

**Phụ thuộc vào:** Phase 1 (EP-19 — dữ liệu kết quả đã ghi đủ trường và đã tích lũy qua nhiều lượt chạy). Không phụ thuộc vào Phase 2; lớp phân tích đọc dữ liệu đã có, không yêu cầu thay đổi tầng chạy test.

**Vì sao làm sau cùng:**
Giá trị của lớp phân tích tỷ lệ thuận với lượng dữ liệu đã tích lũy. Xác định test case thiếu ổn định dựa trên việc trạng thái đổi qua lại giữa nhiều lượt chạy liên tiếp; với ít lượt chạy, kết luận không có cơ sở. Xây lớp này trước khi có dữ liệu tạo ra một giao diện rỗng, không dùng được.

**Epic bao gồm:** EP-20, EP-21.

**Epic loại trừ:** EP-16, EP-22 — ngoài phạm vi.

---

## Điểm cần quyết định về trình tự

Trình tự ba phase không đảo được vì quan hệ phụ thuộc nêu trên. Hai điểm còn là lựa chọn:

**Vị trí của tự phục hồi (EP-13, EP-14).** Đưa lên Phase 1 nếu giao diện ứng dụng dự kiến thay đổi nhiều và sớm, khi đó chi phí bảo trì locator xuất hiện ngay từ vòng hồi quy đầu tiên. Giữ ở Phase 2 nếu ưu tiên có một nền tảng thực thi gọn và chứng minh được giá trị trước khi đưa phụ thuộc vào Claude API vào luồng chạy.

**Điều kiện chuyển từ Phase 1 sang Phase 2.** Chuyển theo mốc thời gian, hoặc chuyển theo điều kiện dữ liệu (ví dụ: sau khi Phase 1 chạy được một số vòng hồi quy nhất định và các chỉ số SM-01 → SM-03 đã đo được). Cách thứ hai gắn với nguyên tắc chứng minh giá trị trước khi mở rộng, nhưng làm thời điểm bắt đầu Phase 2 khó dự đoán.

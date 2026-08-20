# Change Log — tài liệu nghiệp vụ

Ghi lại thay đổi đối với tài liệu đã được phê duyệt. Thay đổi trước thời điểm phê duyệt được sửa trực tiếp vào tài liệu và không ghi ở đây.

---

## Trạng thái tài liệu

| Tài liệu | Trạng thái | Ngày phê duyệt gần nhất | Phạm vi đã phê duyệt |
|---|---|---|---|
| `docs/business/brd.md` | Đã phê duyệt | 2026-07-22 | Toàn bộ, cả ba phase |
| `docs/business/epic-map.md` | Đã phê duyệt | 2026-07-22 | 26 epic đang hiệu lực |
| `docs/business/phase-proposal.md` | Đã phê duyệt | 2026-08-15 | Bốn phase và quan hệ phụ thuộc |
| `docs/requirement.md` | Đã phê duyệt | 2026-07-22 | Toàn bộ |
| `docs/business/phase-1/` | Bản nháp đang rà soát | — | — |

Thay đổi đối với tài liệu ở trạng thái "Đã phê duyệt" được ghi vào bảng bên dưới.

---

## Thay đổi

| Ngày | Nội dung | Tài liệu ảnh hưởng | SA cần đánh giá lại? |
|---|---|---|---|
| 2026-07-21 | Phê duyệt bộ tài liệu Giai đoạn 0: ranh giới phạm vi, epic map, đề xuất phân phase. Mốc bắt đầu áp dụng quản lý thay đổi. | `brd.md`, `epic-map.md`, `phase-proposal.md` | — |
| 2026-07-22 | Đồng bộ `requirement.md` với `brd.md`: Android chuyển sang ngoài phạm vi; FR-EXEC-01 giới hạn iOS gồm thiết bị thật và simulator; FR-AUTH-05 đổi thành phê duyệt qua pull request và áp dụng từ giai đoạn 1; thêm FR-AUTH-06, NFR-07, NFR-08. | `requirement.md` | Không |
| 2026-07-22 | Tiêu chí nghiệm thu Phase 1 phát biểu theo đặc điểm ứng dụng thay vì gắn với một ứng dụng cụ thể. | `requirement.md` §7 | Không |
| 2026-07-22 | Xác nhận tiếng Anh là ngôn ngữ chính của đội; QC đọc và viết được mô tả hành vi bằng tiếng Anh. | `brd.md` §3.1, BC-10; `requirement.md` NFR-11 | Không |
| 2026-07-22 | Test case có xảy ra tự phục hồi mang trạng thái riêng "đạt kèm tự phục hồi", tách khỏi "đạt". | `requirement.md` FR-EXEC-06, hợp đồng dữ liệu kết quả | Có |
| 2026-07-22 | Mỗi test case tự đưa ứng dụng về trạng thái nó cần ở bước mở đầu. Nền tảng không đặt lại ứng dụng giữa các lượt chạy. EP-10 bị loại khỏi phạm vi. | `epic-map.md`, `requirement.md` FR-EXEC-07 | Có |
| 2026-07-22 | Cách mô tả test case đổi thành hai phần: mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt thực thi. FR-AUTH-06 và EP-12 thu hẹp thành đưa phần mô tả hành vi tới QC, không phải xây chức năng hiển thị. | `brd.md` §1 §3.1, `epic-map.md` EP-03 EP-12, `requirement.md` §3 FR-AUTH-01 FR-AUTH-06 | Có. Phạm vi Phase 2 thu hẹp tương ứng. |
| 2026-07-22 | Bằng chứng thực thi: chụp một ảnh duy nhất tại bước hỏng, cộng các bước được đánh dấu tường minh. Test case đạt không chụp. Bổ sung nhật ký thực thi cho mọi test case. Lỗi khi thu thập bằng chứng không làm đổi trạng thái test case. | `requirement.md` FR-EXEC-03 → FR-EXEC-05, FR-REP-02, NFR-10 | Có. Thiết kế Executor và Reporter. |
| 2026-07-22 | Đồng bộ mã NFR giữa hai tài liệu theo `brd.md`. `requirement.md` NFR-09 nay là "mô tả hành vi khớp với hành vi được thực thi"; hiệu năng thu thập bằng chứng chuyển thành NFR-10; ngôn ngữ tiếng Anh chuyển thành NFR-11. | `requirement.md` §5 | Không |
| 2026-07-22 | Mô hình bằng chứng thực thi phản ánh đầy đủ vào tài liệu nghiệp vụ: định nghĩa bằng chứng thực thi (`brd.md` §1), dòng giá trị (§5), happy path chạy hồi quy và soạn test case với AI (§6), happy path mới cho lập trình viên (§6), phạm vi trong và ngoài (§7), BC-11, AS-05; EP-06 và EP-23 viết lại. | `brd.md`, `epic-map.md` | Không |
| 2026-07-22 | Phê duyệt toàn bộ tài liệu nghiệp vụ sau ba đợt rà soát cùng SA. Giai đoạn 0 khép lại về phía BA. | `brd.md`, `epic-map.md`, `phase-proposal.md`, `requirement.md` | — |
| 2026-07-22 | Bổ sung phân cấp bốn tầng và đổi tên khái niệm trung tâm: "kịch bản" đổi thành **test case**; "bộ kịch bản" đổi thành **test suite**; bổ sung tầng **test feature** (một luồng nghiệp vụ, nhóm chứa các test case); "bước" giữ nguyên. Vai trò "Reviewer kịch bản" đổi thành "Reviewer". Thay đổi thuần túy về cách gọi tên và cấu trúc phân cấp, không đổi quyết định nghiệp vụ nào. | `brd.md` (§1.1 mới, toàn bộ, context diagram), `epic-map.md`, `phase-proposal.md`, `requirement.md` (§3, §4) | Có. Đồng bộ thuật ngữ trong `north-star.md`, ADR-001 → ADR-008, `coding-convention.md`. |
| 2026-07-22 | Bản ghi kết quả bổ sung hai trường: **tên test feature** và **thông báo lỗi gốc**. Trường "loại lỗi" rút xuống hai giá trị: "test case kết luận sai" và "không thực hiện được bước". Báo cáo trình bày bảng tóm tắt nhóm theo test feature. | `requirement.md` FR-DATA-03, FR-REP-02, FR-EXEC-04, FR-ANL-01; thêm FR-AUTH-09 | Có. Hợp đồng dữ liệu ở ADR-003 và nội dung báo cáo ở ADR-006. |
| 2026-07-22 | Trạng thái test case giữ ba giá trị đã duyệt. Test case nằm trong tập chạy nhưng không được thực thi không sinh bản ghi kết quả; số lượng ghi ở cấp lượt chạy. | `requirement.md` FR-EXEC-06, FR-DATA-01 | Không. ADR-003 không đổi. |
| 2026-07-22 | Quy tắc dữ liệu kiểm thử: giá trị nằm ngoài kho mã, kho mã chỉ chứa tên các mục và một tệp mẫu; dữ liệu chỉ đọc chuẩn bị cố định trên môi trường test, dữ liệu bị test case tiêu thụ do test case sinh mới ở bước mở đầu. Cơ chế lưu bí mật ngoài kho mã vì vậy cần có từ Phase 1, không phải Phase 2. Cơ chế dọn dữ liệu do test case sinh ra nằm ngoài phạm vi. | `requirement.md` §2, §3, FR-AUTH-10 mới, FR-EXEC-07, NFR-12 mới, §6 | Có. Cơ chế cấu hình và lưu bí mật chuyển sang phạm vi Phase 1; liên quan ADR-005 và NFR-04. |
| 2026-07-22 | Tách hai điều kiện dừng: một test case hỏng không dừng lượt chạy dù thuộc loại lỗi nào; lượt chạy chỉ dừng khi thiết bị — tài nguyên dùng chung của mọi test case — không còn sẵn sàng. Nền tảng kiểm tra thiết bị trước mỗi test case. Không dùng ngưỡng số lần hỏng liên tiếp. | `phase-1/` BR-002, BR-018 mới, FR-DEV-04 mới, FR-RUN-04, FR-RUN-06, UC-06, US-20 mới | Có. Vòng lặp thực thi trong Executor và điểm kiểm tra thiết bị. |
| 2026-07-23 | Làm rõ thuật ngữ "test suite": chỉ còn một nghĩa — toàn bộ test case của một ứng dụng. Định nghĩa "lượt chạy" mở rộng để nêu rõ có thể thực thi toàn bộ test suite hoặc một tập chạy (tập con test case được chọn). Happy path "chạy vòng hồi quy" và UC-06 luồng chính nêu rõ mặc định là toàn bộ test suite; chọn tập chạy là luồng thay thế. Làm sạch từ vựng, không đổi quyết định nghiệp vụ nào. | `brd.md` §1.1 §6, `requirement.md` §3, `use-cases.md` UC-06 | Không |
| 2026-08-15 | Re-scope lộ trình (Product Owner duyệt): Android (EP-16) chuyển từ ngoài phạm vi thành **Phase 3**; lớp phân tích (EP-20, EP-21) lùi từ Phase 3 xuống **Phase 4**. Mục tiêu go-live gồm cả iOS, Android và AI. Phase 2 (AI) không đổi nội dung. | `brd.md` §1 §5 §7, `epic-map.md` EP-16/EP-20/EP-21, `phase-proposal.md` (thêm mục Phase 3 Android, đổi tên Phase 4), `requirement.md` §1 §2 | Có. SA đánh giá lại lớp trừu tượng đa hệ điều hành cho Android khi mở thiết kế Phase 3 (`north-star.md` §6 hiện chốt không thêm trừu tượng Android). Không tác động thiết kế Phase 2. |
| 2026-08-16 | Thuật ngữ tự phục hồi (khi đặc tả Phase 2): mỗi lần tự phục hồi được **ghi và hiển thị trong báo cáo** lượt chạy, không gọi là "cảnh báo" (việc đã xảy ra thì thuộc báo cáo, không phải cảnh báo phát trước/trong khi hành động). Bổ sung quyết định: tự phục hồi **thử lại tối đa số lần cấu hình được, mặc định 3** cho mỗi locator hỏng; locator thay thế chỉ dùng tạm trong bộ nhớ, không sửa file lúc chạy; lượt chạy không dừng chờ người xác nhận. | `brd.md` §6 §7, `epic-map.md` EP-14, `docs/business/phase-2/*` | Có. SA dùng thuật ngữ báo cáo và tham số số-lần-thử khi thiết kế Phase 2. |
| 2026-08-17 | Re-scope Phase 2 (Product Owner): thêm **đa nhà cung cấp AI** (EP-28: nhiều khóa, thêm/bớt model, chọn nhà cung cấp active — không còn Claude-only) và **giao diện chạy cục bộ** (EP-29 cấu hình model/khóa/AI active; EP-30 mở báo cáo cơ bản link file HTML). Thống kê/biểu đồ đầy đủ vẫn Phase 4 (EP-21). Tổng quát hóa EP-26/27 và các mention "Claude" → "AI"; NFR-01/BC-02 nới cho giao diện cục bộ (vẫn không máy chủ từ xa). Sửa lỗi cũ: brd §7 "báo cáo PNG/PDF" → HTML (ADR-019). | `brd.md` §7/NFR-01/04/05/BC-02, `epic-map.md` (EP-26/27 sửa, thêm EP-28/29/30), `phase-proposal.md` Phase 2, `srs.md` §0/§3 | Có. SA: lớp trừu tượng nhà-cung-cấp AI + giao diện cục bộ (desktop hoặc localhost, không server từ xa). Xem xét tách Phase 2a/2b. |
| 2026-08-17 | Mô hình xử lý tự phục hồi theo góc nhìn người dùng: bỏ thao tác "xác nhận/bác bỏ" nghi thức. Báo cáo là **file HTML mỗi lượt chạy**, mỗi lần tự phục hồi kèm **ảnh phần tử AI đã bấm**. **Nền tảng tự sửa locator và tạo sẵn pull request; Reviewer nhìn ảnh rồi duyệt (locator vào nhánh chính) hoặc sửa lại/bỏ.** AI được ghi locator vào code như một tester; chỉ khâu duyệt PR là của con người (BC-08); không tự merge vào nhánh chính giữa lượt chạy (rủi ro đạt giả, NFR-03). **EP-15 nâng NICE → CORE** (tự tạo PR là đường chính). | `brd.md` §6, `epic-map.md` EP-14/EP-15, `docs/business/phase-2/*` (BR-203/206/207/210, FR-HEAL-05/07, UC-202, US-202/203; bỏ US-204/FR-HEAL-08) | Có. SA thiết kế: tự phục hồi ghi ảnh phần tử đã bấm + tự tạo pull request sửa locator; không tự merge nhánh chính. |
| 2026-08-20 | **Bỏ "nền tảng tự tạo pull request" khỏi tự phục hồi (SA review, PO quyết):** trong hướng B, git/commit/tạo-PR do **con người (QC automation)** làm sau review; nền tảng chỉ **ghi locator cũ→mới + ảnh phần tử vào báo cáo** để con người tự cập nhật Page Object và mở PR. Xóa dư âm hướng A ở 9 chỗ (không còn "nền tảng tự sửa locator/tạo sẵn PR"). Actor tự phục hồi hậu-kỳ = QC automation, không phải Reviewer. | `brd.md` §6, `epic-map.md` EP-14/15, `phase-2/*` (FR-HEAL-07, NFR-203, BR-203/210 + state diagram, US-203, use-cases §mở đầu) | Có. SA đã review; thiết kế bỏ tích hợp git/PR khỏi `src/` (không phụ thuộc `gh`/remote). |
| 2026-08-19 | **Đổi hướng tích hợp AI (product team quyết):** từ AI nhúng trong nền tảng (đa nhà cung cấp + giao diện cấu hình + khóa) sang **AI CLI bên ngoài mà nền tảng tự trigger** (posture "B-chủ-động", Claude Code). Tự phục hồi lúc chạy GIỮ (persist qua PR). Bỏ đa nhà cung cấp / giao diện / khóa → **token CLI** + cài đặt/kiểm tra CLI. Người dùng = **QC automation biết code** (bỏ lời hứa "không cần biết code" ở BO-07/NFR-08). "đạt kèm tự phục hồi" = **nhãn dẫn xuất**, không phải kết luận thứ ba. Bộ đặc tả hướng A giữ nguyên ở `docs/business/ai-embedded-approach/`. | `brd.md` (BO-07, §3.1, §5, §7, BC-02/04/12, NFR-01/04/08), `epic-map.md` (EP-26/28/29 sửa, EP-30→FUTURE), `phase-proposal.md` Phase 2, `docs/business/phase-2/*` viết lại | Có. SA viết ADR mới (trigger CLI, seam CodeAgent, auth token, heal qua CLI); reconcile ADR-021→024 (021/022/023 thay bằng CLI, 024 dùng lại). |

---

## Quy ước

- Mỗi thay đổi ghi một dòng: ngày, nội dung sửa, tài liệu bị ảnh hưởng, và việc SA có cần đánh giá lại tác động thiết kế hay không.
- Nội dung tài liệu luôn phản ánh trạng thái hiện tại. Change log giữ dấu vết thay đổi; thân tài liệu không chứa lịch sử.
- Mã NFR-01 đến NFR-09 dùng chung giữa `brd.md` và `requirement.md`. Yêu cầu chỉ có ở `requirement.md` đánh mã từ NFR-10 trở đi.
- Khi một quyết định nghiệp vụ thay đổi, đối chiếu cả bốn tài liệu trước khi đóng mục: `brd.md`, `epic-map.md`, `phase-proposal.md`, `requirement.md`.
- Mọi khái niệm trung tâm được định nghĩa một chỗ ở `brd.md` §1.1; các mục khác tham chiếu tới đó thay vì mô tả lại.

---

## Ánh xạ mã NFR

| Mã | Nội dung | Có ở `brd.md` | Có ở `requirement.md` |
|---|---|---|---|
| NFR-01 | Chạy nội bộ trên máy QC | Có | Có |
| NFR-02 | Kiểm thử iOS chạy trên macOS | Có | Có |
| NFR-03 | Kết quả lặp lại | Có | Có |
| NFR-04 | Khóa API ngoài kho mã | Có | Có |
| NFR-05 | Kiểm soát độ trễ và chi phí gọi Claude | Có | Có |
| NFR-06 | Quyền quyết định chất lượng thuộc về con người | Có | Có |
| NFR-07 | Nền tảng không chứa tri thức riêng của ứng dụng | Có | Có |
| NFR-08 | Từ Phase 2, QC không cần đọc hay viết phần cài đặt | Có | Có |
| NFR-09 | Mô tả hành vi khớp với hành vi được thực thi | Có | Có |
| NFR-10 | Thu thập bằng chứng không làm tăng đáng kể thời lượng lượt chạy | Không | Có |
| NFR-11 | Toàn bộ nội dung kho mã viết bằng tiếng Anh | Không | Có |
| NFR-12 | Giá trị dữ liệu kiểm thử không nằm trong kho mã | Không | Có |

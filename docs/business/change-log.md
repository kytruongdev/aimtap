# Change Log — tài liệu nghiệp vụ

Ghi lại thay đổi đối với tài liệu đã được phê duyệt. Thay đổi trước thời điểm phê duyệt được sửa trực tiếp vào tài liệu và không ghi ở đây.

---

## Trạng thái tài liệu

| Tài liệu | Trạng thái | Ngày phê duyệt gần nhất | Phạm vi đã phê duyệt |
|---|---|---|---|
| `docs/business/brd.md` | Đã phê duyệt | 2026-07-22 | Toàn bộ, cả ba phase |
| `docs/business/epic-map.md` | Đã phê duyệt | 2026-07-22 | 26 epic đang hiệu lực |
| `docs/business/phase-proposal.md` | Đã phê duyệt | 2026-07-22 | Ba phase và quan hệ phụ thuộc |
| `docs/requirement.md` | Đã phê duyệt | 2026-07-22 | Toàn bộ |
| `docs/business/phase-1/` | Chưa bắt đầu | — | — |

Thay đổi đối với tài liệu ở trạng thái "Đã phê duyệt" được ghi vào bảng bên dưới.

---

## Thay đổi

| Ngày | Nội dung | Tài liệu ảnh hưởng | SA cần đánh giá lại? |
|---|---|---|---|
| 2026-07-21 | Phê duyệt bộ tài liệu Giai đoạn 0: ranh giới phạm vi, epic map, đề xuất phân phase. Mốc bắt đầu áp dụng quản lý thay đổi. | `brd.md`, `epic-map.md`, `phase-proposal.md` | — |
| 2026-07-22 | Đồng bộ `requirement.md` với `brd.md`: Android chuyển sang ngoài phạm vi; FR-EXEC-01 giới hạn iOS gồm thiết bị thật và simulator; FR-AUTH-05 đổi thành phê duyệt qua pull request và áp dụng từ giai đoạn 1; thêm FR-AUTH-06, NFR-07, NFR-08. | `requirement.md` | Không |
| 2026-07-22 | Tiêu chí nghiệm thu Phase 1 phát biểu theo đặc điểm ứng dụng thay vì gắn với một ứng dụng cụ thể. | `requirement.md` §7 | Không |
| 2026-07-22 | Xác nhận tiếng Anh là ngôn ngữ chính của đội; QC đọc và viết được mô tả hành vi bằng tiếng Anh. | `brd.md` §3.1, BC-10; `requirement.md` NFR-11 | Không |
| 2026-07-22 | Kịch bản có xảy ra tự phục hồi mang trạng thái riêng "đạt kèm tự phục hồi", tách khỏi "đạt". | `requirement.md` FR-EXEC-06, hợp đồng dữ liệu kết quả | Có |
| 2026-07-22 | Mỗi kịch bản tự đưa ứng dụng về trạng thái nó cần ở bước mở đầu. Nền tảng không đặt lại ứng dụng giữa các lượt chạy. EP-10 bị loại khỏi phạm vi. | `epic-map.md`, `requirement.md` FR-EXEC-07 | Có |
| 2026-07-22 | Cách mô tả kịch bản đổi thành hai phần: mô tả hành vi bằng ngôn ngữ tự nhiên và phần cài đặt thực thi. FR-AUTH-06 và EP-12 thu hẹp thành đưa phần mô tả hành vi tới QC, không phải xây chức năng hiển thị. | `brd.md` §1 §3.1, `epic-map.md` EP-03 EP-12, `requirement.md` §3 FR-AUTH-01 FR-AUTH-06 | Có. Phạm vi Phase 2 thu hẹp tương ứng. |
| 2026-07-22 | Bằng chứng thực thi: chụp một ảnh duy nhất tại bước hỏng, cộng các bước được đánh dấu tường minh. Kịch bản đạt không chụp. Bổ sung nhật ký thực thi cho mọi kịch bản. Lỗi khi thu thập bằng chứng không làm đổi trạng thái kịch bản. | `requirement.md` FR-EXEC-03 → FR-EXEC-05, FR-REP-02, NFR-10 | Có. Thiết kế Executor và Reporter. |
| 2026-07-22 | Đồng bộ mã NFR giữa hai tài liệu theo `brd.md`. `requirement.md` NFR-09 nay là "mô tả hành vi khớp với hành vi được thực thi"; hiệu năng thu thập bằng chứng chuyển thành NFR-10; ngôn ngữ tiếng Anh chuyển thành NFR-11. | `requirement.md` §5 | Không |
| 2026-07-22 | Mô hình bằng chứng thực thi phản ánh đầy đủ vào tài liệu nghiệp vụ: định nghĩa bằng chứng thực thi (`brd.md` §1), dòng giá trị (§5), happy path chạy hồi quy và soạn kịch bản với AI (§6), happy path mới cho lập trình viên (§6), phạm vi trong và ngoài (§7), BC-11, AS-05; EP-06 và EP-23 viết lại. | `brd.md`, `epic-map.md` | Không |
| 2026-07-22 | Phê duyệt toàn bộ tài liệu nghiệp vụ sau ba đợt rà soát cùng SA. Giai đoạn 0 khép lại về phía BA. | `brd.md`, `epic-map.md`, `phase-proposal.md`, `requirement.md` | — |

---

## Quy ước

- Mỗi thay đổi ghi một dòng: ngày, nội dung sửa, tài liệu bị ảnh hưởng, và việc SA có cần đánh giá lại tác động thiết kế hay không.
- Nội dung tài liệu luôn phản ánh trạng thái hiện tại. Change log giữ dấu vết thay đổi; thân tài liệu không chứa lịch sử.
- Mã NFR-01 đến NFR-09 dùng chung giữa `brd.md` và `requirement.md`. Yêu cầu chỉ có ở `requirement.md` đánh mã từ NFR-10 trở đi.
- Khi một quyết định nghiệp vụ thay đổi, đối chiếu cả bốn tài liệu trước khi đóng mục: `brd.md`, `epic-map.md`, `phase-proposal.md`, `requirement.md`.
- Mọi khái niệm trung tâm được định nghĩa một chỗ ở `brd.md` §1; các mục khác tham chiếu tới đó thay vì mô tả lại.

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

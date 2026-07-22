# Change Log — tài liệu kiến trúc

Ghi lại thay đổi đối với tài liệu đã được phê duyệt. Thay đổi trước thời điểm phê duyệt được sửa trực tiếp vào tài liệu và không ghi ở đây.

| Ngày | Nội dung | Tài liệu ảnh hưởng | Team Lead cần đánh giá lại? |
|---|---|---|---|
| 2026-07-22 | Phê duyệt bộ tài liệu Giai đoạn 0: kiến trúc tổng thể, quy ước viết mã, và tám quyết định kiến trúc nền tảng. Mốc bắt đầu áp dụng quản lý thay đổi. | `north-star.md`, `coding-convention.md`, `adr/adr-001.md` → `adr/adr-008.md` | — |
| 2026-07-22 | Đồng bộ với định nghĩa "bằng chứng thực thi" ba phần ở `brd.md` §1: trách nhiệm Evidence Collector và nguyên tắc thu thập bằng chứng phát biểu theo cùng ba phần đó. Gắn AS-05 làm căn cứ cho NFR-10 và cho ngưỡng chuyển sang chụp ảnh ở mọi bước. | `north-star.md` §2, §2.2, §5, §6 | Không. Trách nhiệm module và hợp đồng dữ liệu không đổi; chỉ thống nhất cách phát biểu và bổ sung truy vết. |

---

## Quy ước

- Mỗi thay đổi ghi một dòng: ngày, nội dung sửa, tài liệu bị ảnh hưởng, và việc Team Lead có cần đánh giá lại các ticket đang mở hay không.
- Nội dung tài liệu luôn phản ánh trạng thái hiện tại. Change log giữ dấu vết thay đổi; thân tài liệu không chứa lịch sử.
- Thay đổi đảo ngược một quyết định đã `Accepted` và đã được nơi khác dựa vào thì tạo ADR mới trỏ tới ADR cũ, đánh dấu ADR cũ là `Superseded`, và ghi một dòng ở đây. Thay đổi không chạm quyết định nào (sửa cấu trúc thư mục, bổ sung quy ước viết mã, cập nhật diagram) chỉ ghi ở đây.
- Cột cuối đánh dấu `Có` khi thay đổi chạm tới thứ Team Lead đang dựa vào để chẻ ticket: ranh giới module, bề mặt công khai `src/index.ts`, hợp đồng dữ liệu kết quả, hoặc quy ước viết mã.
- Khi một quyết định nghiệp vụ thay đổi, đối chiếu cả tài liệu kiến trúc lẫn bốn tài liệu nghiệp vụ (`brd.md`, `epic-map.md`, `phase-proposal.md`, `requirement.md`) trước khi đóng mục.

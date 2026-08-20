# US-8.3: Quy trình xác nhận & rà soát test case AI sinh

**Epic:** EPIC-8 — Sinh test case với AI
**Business US (BA):** US-207, US-208, US-209
**Độ ưu tiên:** Medium
**Phụ thuộc:** US-8.1

## Mục tiêu
Quy trình con người (ngoài nền tảng) cho test case AI sinh: QC xác nhận qua mô tả hành vi + nhật ký thực thi (không đọc cài đặt), chạy xanh trước khi mở PR, và Reviewer phân biệt được test AI sinh khi rà soát. Đây là mở rộng quy trình PR của US-5.1, không phải năng lực mã mới.

## Tickets

### TICKET-044: Bổ sung quy trình rà soát cho test case AI sinh
**Thiết kế liên quan:** interface-spec.md (không có interface mới), sequence-diagrams.md#2, FR-GEN-02, FR-GEN-04, FR-GEN-05, BR-213, BR-214, BR-215, BR-216, BR-217; nối tiếp US-5.1 (TICKET-027)
**Phụ thuộc:** TICKET-042

**Chỉ dẫn code**
- Mở rộng mẫu pull request / tài liệu `CONTRIBUTING` (dựng ở US-5.1) thêm mục cho test case AI sinh:
  - Xác nhận qua **mô tả hành vi + nhật ký thực thi**, không cần đọc phần cài đặt (BR-214, FR-GEN-02).
  - Test case AI sinh phải **chạy xanh trên thiết bị ít nhất một lần** trước khi mở PR (BR-215, FR-GEN-04) — dùng lệnh `run` sẵn có, không cơ chế mới ở nền tảng.
  - Test case AI sinh mang tag `@ai-generated` (US-8.1); Reviewer phân biệt được và rà soát phần AI sinh (BR-216, FR-GEN-05).
  - Mọi test case (AI sinh hay người viết) vào nhánh chính qua PR được phê duyệt (BR-217, BC-08).
- Không dựng cơ chế bắt buộc ở tầng nền tảng — đây là quy ước quy trình + tag do `generate` gắn (như US-5.1 §TICKET-027).

**Acceptance Criteria (cấp code)**
- [ ] Mẫu PR/`CONTRIBUTING` có mục: xác nhận qua mô tả hành vi + nhật ký; chạy xanh trước PR; nhận diện tag `@ai-generated`; vào nhánh chính qua PR duyệt.
- [ ] Tài liệu nêu rõ nền tảng không tự đưa test AI sinh vào nhánh chính (con người mở PR).

## Definition of Done (US)
Theo `conventions.md` §4 (phần tài liệu quy trình; không đụng `src/`).

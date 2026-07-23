# US-5.1: Quy trình rà soát pull request

**Epic:** EPIC-5 — Nội dung thí điểm & quy trình giao hàng
**Business US (BA):** US-07
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1

## Mục tiêu
Test case và Page Object chỉ vào nhánh chính qua pull request đã phê duyệt, với danh sách kiểm tra rà soát bám đúng business rule.

## Tickets

### TICKET-027: Quy trình rà soát pull request test case
**Thiết kế liên quan:** north-star.md#2.1 (ranh giới lint), coding-convention.md (toàn bộ), UC-04, BR-005, BR-006, BR-007, BR-010, BR-013, BR-016, BR-017
**Phụ thuộc:** TICKET-001

**Chỉ dẫn code**
- Thêm mẫu pull request (`.github/pull_request_template.md` hoặc tương đương) và tài liệu `CONTRIBUTING` ánh xạ danh sách kiểm tra UC-04 sang các mục reviewer xác nhận:
  - Phần cài đặt khớp phần mô tả hành vi (BR-010).
  - Test case đúng test feature và chỉ một hành vi (BR-016).
  - Không chứa giá trị dữ liệu kiểm thử thật; mục dữ liệu mới đã vào `test-data.example.json` (BR-017).
  - Locator nằm trong Page Object, không rải trong step definition (BR-007).
  - Bước mở đầu tự thiết lập trạng thái và dữ liệu (BR-005).
  - Nội dung viết bằng tiếng Anh (BR-013).
- Nêu rõ cổng tự động trước khi merge: `make lint` (gồm ranh giới module), `make typecheck`, `make test` (theo `conventions.md`).
- Không tự dựng cơ chế bắt buộc phê duyệt ở tầng nền tảng; đây là quy ước quy trình + cấu hình kho mã (BR-006).

**Acceptance Criteria (cấp code)**
- [ ] Mẫu pull request hiện đủ mục kiểm tra ánh xạ từ UC-04 và các BR liên quan.
- [ ] Mẫu chỉ rõ cổng `lint`/`typecheck`/`test` phải xanh trước khi merge.
- [ ] Tài liệu quy trình nêu rằng test case và Page Object chỉ vào nhánh chính qua pull request đã phê duyệt.

## Definition of Done (US)
Theo `conventions.md` §4.

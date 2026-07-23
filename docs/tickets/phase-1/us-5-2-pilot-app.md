# US-5.2: Ứng dụng thí điểm đầu-cuối

**Epic:** EPIC-5 — Nội dung thí điểm & quy trình giao hàng
**Business US (BA):** US-03, US-04, US-05, US-06
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.3, US-2.1, US-3.3 (chạy đầu-cuối cần US-4.3)

## Mục tiêu
Có nội dung mẫu của một ứng dụng iOS thí điểm (luồng đăng nhập và vài thao tác cốt lõi) chạy đầu-cuối, làm chuẩn tham chiếu cho cách khai báo, lấy locator, viết test case và dùng lại step.

## Tickets

### TICKET-026: Nội dung ứng dụng thí điểm
**Thiết kế liên quan:** north-star.md#2.1 (apps/<app-id>/), north-star.md#2, coding-convention.md (Phần mô tả hành vi, Phần cài đặt, Page Object), interface-spec.md#Hợp-đồng-dữ-liệu (app.config.ts, test-data.example.json), UC-01, UC-02, UC-03, BR-005, BR-007, BR-010, BR-016, BR-017
**Phụ thuộc:** TICKET-005, TICKET-012, TICKET-017

**Chỉ dẫn code**
- Tạo `apps/<pilot-app>/` đúng cấu trúc cố định:
  - `app.config.ts` — khai báo hợp lệ theo schema App Registry.
  - `features/login.feature` — một test feature, các test case mô tả hành vi bằng tiếng Anh ở mức nghiệp vụ (không thao tác phần tử, không locator); mỗi test case một hành vi và một kết quả mong đợi (BR-016); bước mở đầu tự đưa ứng dụng và dữ liệu về trạng thái cần (BR-005).
  - `steps/login.steps.ts` — step definition là nơi duy nhất gọi Page Object; không chứa locator, không gọi thẳng WebdriverIO; assertion nằm ở đây; thể hiện dùng lại step giữa các test case (US-06 BA).
  - `screens/login.screen.ts` — Page Object màn hình đăng nhập; locator tập trung; tìm phần tử qua Locator Resolver và truyền `screenName`; không chứa assertion (BR-007).
  - `fixtures/users.ts` — tham chiếu dữ liệu kiểm thử bằng tên, không chứa giá trị (ADR-009).
  - `test-data.example.json` — khuôn liệt kê đầy đủ mục cần điền (nhánh `secrets`/`env`), không giá trị thật.
- Dữ liệu bị test case tiêu thụ (nếu có) sinh mới ở bước mở đầu, không đưa vào tệp mẫu (BR-017 quy tắc 3). Không sửa gì trong `src/` để thêm ứng dụng này (NFR-07).

**Acceptance Criteria (cấp code)**
- [ ] `aimtap run <pilot-app>` chạy được test suite thí điểm đầu-cuối trên simulator hoặc thiết bị thật (kiểm chứng thủ công ghi trong PR).
- [ ] Locator chỉ nằm trong Page Object; step definition không chứa locator; `.feature` không chứa chi tiết kỹ thuật.
- [ ] Chạy cùng test case hai lần liên tiếp cho cùng kết quả (BR-005/NFR-03).
- [ ] `test-data.example.json` liệt kê đủ mục và không mang giá trị thật; `test-data.local.json` không bị Git theo dõi.
- [ ] Thêm ứng dụng này không kéo theo thay đổi nào trong `src/`.

## Definition of Done (US)
Theo `conventions.md` §4.

# Ticket Conventions — áp dụng cho mọi phase

Tài liệu này định nghĩa phân cấp tổ chức công việc phía implement, cấu trúc chuẩn của một user story và một ticket, và Definition of Done. Áp dụng cho mọi phase. Quy tắc style/thực thi cấp mã ở `docs/architecture/coding-convention.md` §"Thực thi & style"; ranh giới kiến trúc ở `docs/architecture/north-star.md`.

## Phân cấp tổ chức

**Epic → User Story → Ticket.**

- **Epic** — một chủ đề kỹ thuật lớn của phase. Định nghĩa và danh sách user story thuộc nó ở `board.md`.
- **User Story (implement)** — đơn vị pull request. Mỗi user story là một tệp `docs/tickets/phase-{N}/us-{epic}-{n}-<slug>.md`, chứa trực tiếp các ticket gom chung được. **Một user story = một pull request.**
- **Ticket** — đơn vị commit, là một mục bên trong tệp user story. **Mỗi ticket = một commit.**

Đây là tầng implement, tách khỏi artifact nghiệp vụ của BA (`docs/business/epic-map.md`, `user-stories.md`). Để không lẫn:
- User story implement dùng ID dạng `US-{epic}.{n}` (ví dụ `US-1.4`); user story nghiệp vụ của BA dùng ID phẳng `US-xx`.
- Mỗi user story implement mang field **"Business US (BA)"** liệt kê US nghiệp vụ mà nó phục vụ — trục truy ngược requirement.

---

## 1. Cấu trúc chuẩn của một User Story (tệp)

| Trường | Bắt buộc | Nội dung |
|---|---|---|
| Tiêu đề `# US-{epic}.{n}: <tên>` | Có | ID và tên ngắn chỉ kết quả. |
| **Epic** | Có | Mã và tên epic chứa nó. |
| **Business US (BA)** | Có | Danh sách US nghiệp vụ của BA mà story này phục vụ. |
| **Độ ưu tiên** | Có | High / Medium / Low. |
| **Phụ thuộc** | Có | User story implement khác phải xong trước, hoặc `—`. |
| **Mục tiêu** | Có | Một câu: story này xong thì có lát chức năng gì. |
| **Tickets** | Có | Các ticket inline, mỗi ticket một mục con theo §2. |
| **Definition of Done (US)** | Có | Theo §4. |

## 2. Cấu trúc chuẩn của một Ticket (mục con trong tệp User Story)

Mỗi ticket là một mục `### TICKET-{ID}: <tên>` với các trường:

- **Thiết kế liên quan** — trỏ tới thiết kế SA mà ticket cụ thể hóa: `component-design#<module>`, `interface-spec#<interface>`, `erd#<entity>`, ADR. Mọi chỉ dẫn code phải truy ngược được về đây.
- **Phụ thuộc** — TICKET khác phải xong trước, hoặc `—`.
- **Chỉ dẫn code** — function/method cần tạo và trách nhiệm; entity/bảng đụng tới theo ERD; các bước thực thi theo thứ tự; convention áp dụng (link).
- **Acceptance Criteria (cấp code)** — checkbox kiểm chứng được ở mức mã, dẫn từ AC nghiệp vụ và business rule liên quan.

Quy tắc nội dung:
- Ticket mô tả *cách thực thi*, không lặp lại *lý do thiết kế* — lý do ở tài liệu SA, link tới.
- Không chứa mục còn chờ làm rõ trong thân ticket; điều còn mở ghi ở `docs/handoff/open-items.md`.
- Viết khẳng định, thì hiện tại; gọi đúng tên function/entity/interface; không ẩn dụ, không tính từ cảm tính không kèm lý do.

## 3. Definition of Done cấp Ticket

Một ticket (một commit) Done khi:

- [ ] **Chức năng:** mọi Acceptance Criteria cấp code của ticket được thỏa.
- [ ] **Kiểu:** `make typecheck` không lỗi; không dùng `any` cho dữ liệu từ bên ngoài.
- [ ] **Kiểm thử đơn vị:** đạt theo §3.1; test xanh qua `make test`.
- [ ] **Lint & ranh giới:** `make lint` không lỗi, gồm `eslint-plugin-boundaries`.
- [ ] **Convention:** tuân thủ `coding-convention.md`.
- [ ] **Tài liệu:** cập nhật tài liệu liên quan nếu ticket đổi `Makefile`, `.env.example`, hay `test-data.example.json`.
- [ ] **Commit:** một commit theo Conventional Commits, mang mã ticket.
- [ ] **Không rò rỉ bí mật:** không có giá trị dữ liệu kiểm thử thật hay khóa API (BR-017, NFR-04).

### 3.1. Chiến lược kiểm thử đơn vị

Bám nguyên tắc "Khả năng kiểm thử của chính nền tảng" (`north-star.md` §2.2) và Vitest (ADR-008). Phân theo ranh giới "cần thiết bị / không cần thiết bị", không theo chỉ tiêu "một test cho mỗi function":

- **Logic không cần thiết bị — bắt buộc có test đơn vị.** Kiểm tra schema Zod, phân loại lỗi, dựng nhật ký, dựng mô hình báo cáo, repository trên SQLite tạm, chuỗi tiền điều kiện và vòng đời lượt chạy với thiết bị/runner giả lập. Test đặt cạnh nguồn `<tên>.test.ts`.
- **Code chạm thiết bị — kiểm chứng thủ công, không unit test bằng thiết bị thật.** Phần bọc lời gọi Appium/`simctl`/công cụ thật tách sau ranh giới để logic quanh nó vẫn test được bằng giả lập; phần chạm thiết bị ghi cách kiểm chứng trong pull request.
- **Thước đo phủ:** mọi nhánh logic và mọi Acceptance Criteria đều có test phủ; không viết test tầm thường cho getter/wrapper.

## 4. Definition of Done cấp User Story (Pull Request)

Một user story (một PR) Done khi:

- [ ] Mọi ticket trong story thỏa Definition of Done cấp ticket (§3).
- [ ] Mỗi ticket là một commit riêng; thứ tự commit theo phụ thuộc nội bộ.
- [ ] Story để lại một lát chức năng merge được, không làm hỏng nhánh chính.
- [ ] Các user story mà story này phụ thuộc đã merge (thứ tự ở `board.md`).
- [ ] Pull request đã được phê duyệt (BR-006); tiêu đề PR mang mã user story.

## 5. Trạng thái trên board

`Todo` → `In progress` → `In review` → `Done`, theo dõi ở cấp user story trên `board.md`.

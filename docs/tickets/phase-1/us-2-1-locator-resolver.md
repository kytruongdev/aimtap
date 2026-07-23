# US-2.1: Locator Resolver

**Epic:** EPIC-2 — Tương tác phần tử & bằng chứng
**Business US (BA):** US-03, US-04
**Độ ưu tiên:** High
**Phụ thuộc:** US-1.1

## Mục tiêu
Có kiểu Locator với các chiến lược iOS, thời gian chờ có điều kiện tập trung, và điểm duy nhất tìm phần tử mang theo tên màn hình phục vụ bằng chứng.

## Tickets

### TICKET-011: wait-policy + kiểu Locator
**Thiết kế liên quan:** component-design.md#Locator-Resolver (`locator.ts`, `wait-policy.ts`), north-star.md#2.2 (Độ ổn định), coding-convention.md#Chờ-đợi-và-tương-tác-với-thiết-bị, UC-02 (3a)
**Phụ thuộc:** TICKET-002

**Chỉ dẫn code**
- `src/locator/locator.ts`: kiểu `Locator` và các chiến lược iOS theo thứ tự ưu tiên accessibility id, id, predicate string, class chain (UC-02 3a); bộ dựng locator theo từng chiến lược, kiểu an toàn.
- `src/locator/wait-policy.ts`: tham số chờ có điều kiện tập trung (thời gian chờ tối đa, khoảng thử lại, số lần thử lại); không có thời gian chờ cố định rải rác; phơi ra để `locator-resolver.ts` và `probeDuringRun` dùng chung.
- `src/locator/index.ts` phơi ra kiểu `Locator`, bộ dựng, và `wait-policy`.

**Acceptance Criteria (cấp code)**
- [ ] Kiểu `Locator` biểu diễn được cả bốn chiến lược iOS.
- [ ] Tham số chờ tập trung ở `wait-policy.ts`; không có hằng thời gian chờ cố định ở nơi khác của module.
- [ ] `wait-policy` import được bởi Device & Build Manager (probe) và Locator Resolver.

### TICKET-012: Điểm tìm phần tử `find()`
**Thiết kế liên quan:** component-design.md#Locator-Resolver (`locator-resolver.ts`), interface-spec.md#Locator-Resolver (`find`), sequence-diagrams.md#2, ADR-004, ADR-011, FR-AUTH-02, FR-AUTH-03, BR-007
**Phụ thuộc:** TICKET-011

**Chỉ dẫn code**
- `src/locator/locator-resolver.ts`:
  - `find(locator: Locator, screenName: string): Element` — Phase 1 gọi thẳng WebdriverIO qua `wait-policy`, trả phần tử hoặc ném lỗi không tìm thấy khi hết thời gian chờ.
  - `screenName` do Page Object truyền vào; chuyển tới Test Runner làm màn hình hiện tại (`setCurrentScreen`) theo ADR-011, qua cơ chế Test Runner cung cấp (US-3.4), không import ngược Test Runner ngoài `index.ts`.
  - Là điểm chèn self-healing Phase 2 (ADR-004); Phase 1 không gọi Claude, giữ chữ ký ổn định.
- Cập nhật `src/locator/index.ts` phơi ra `find`.

**Acceptance Criteria (cấp code)**
- [ ] `find` trả phần tử khi tìm thấy; ném lỗi không tìm thấy khi hết thời gian chờ (test đơn vị với WebdriverIO giả lập).
- [ ] `find` chuyển `screenName` lên Test Runner mỗi lần gọi (ADR-011).
- [ ] Dùng `wait-policy` chung; không gọi lệnh giao thức cấp thấp.
- [ ] Chữ ký `find` là điểm chèn self-healing Phase 2 và không đổi khi Phase 2 thêm healing.

## Definition of Done (US)
Theo `conventions.md` §4.

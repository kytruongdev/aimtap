# US-8.1: Sinh test case qua AI CLI

**Epic:** EPIC-8 — Sinh test case với AI
**Business US (BA):** US-206, US-209 (phần đánh dấu)
**Độ ưu tiên:** High
**Phụ thuộc:** US-6.2

## Mục tiêu
AI Gateway sinh một test case nháp (mô tả hành vi + phần cài đặt; locator trong Page Object) từ mô tả bằng lời + page source, ưu tiên tái dùng câu/step đã có, và đánh dấu test case sinh ra là "do AI sinh".

## Tickets

### TICKET-042: `generate-invoker` — dựng prompt sinh, gọi CodeAgent, gắn nhãn AI sinh
**Thiết kế liên quan:** component-design.md#AI-Gateway (`generate-invoker.ts`, `prompts/`), interface-spec.md#CodeAgent (`generateTestCase`), interface-spec.md#AI-CLI-qua-subprocess (Generate), sequence-diagrams.md#2, ADR-007, ADR-025, FR-GEN-01, FR-GEN-05, BR-211, BR-212, BR-216
**Phụ thuộc:** TICKET-031

**Chỉ dẫn code**
- `src/ai/prompts/generate.ts`: `buildGeneratePrompt(ctx: { description: string; pageSource: string; existingSteps: string[] }): string` — hàm thuần dựng prompt yêu cầu CLI sinh file nháp `.feature` + step + Page Object; **ưu tiên tái dùng** câu mô tả hành vi + phần cài đặt đã có (`existingSteps`), không tạo câu trùng nghĩa (ADR-007, BR-212); locator đặt trong Page Object; gắn tag `@ai-generated` trên scenario để phân biệt khi rà soát (FR-GEN-05, BR-216).
- `src/ai/generate-invoker.ts`: `generateTestCase(agent: CodeAgent, ctx: { description; pageSource; existingSteps }): Promise<GenerateOutcome>`:
  - Gọi `agent.invoke('generate', buildGeneratePrompt(ctx))` (chế độ quyền ghi giới hạn, ADR-025).
  - Trả `GenerateOutcome` = `{ ok: true; draftPaths: string[] } | { ok: false; reason: string }` — xác nhận file nháp đã tạo hoặc lỗi/không phản hồi (BR-208 cho generate: không sinh lần này).
- Phơi `generateTestCase`, `GenerateOutcome` ở `src/ai/index.ts`.
- Đầu ra CLI qua Zod; không log mô tả/page source.

**Acceptance Criteria (cấp code)**
- [ ] `buildGeneratePrompt` gồm mô tả + page source + danh sách step hiện có và yêu cầu tái dùng trước khi sinh mới, kèm tag `@ai-generated` (test đơn vị so khung prompt).
- [ ] `result` báo file nháp đã tạo → `{ ok: true, draftPaths }`; CLI lỗi/không phản hồi → `{ ok: false, reason }` (test đơn vị với `CodeAgent` giả lập từng nhánh).
- [ ] Không ném khi AI lỗi; không log mô tả/page source.

## Definition of Done (US)
Theo `conventions.md` §4. Chất lượng test case AI sinh thật kiểm chứng thủ công (US-8.2/US-8.3).

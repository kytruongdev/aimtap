# US-7.5: Lắp ráp healer vào lượt chạy

**Epic:** EPIC-7 — Tự phục hồi locator lúc chạy
**Business US (BA):** US-201, US-205
**Độ ưu tiên:** High
**Phụ thuộc:** US-6.2, US-7.2, US-7.3

## Mục tiêu
Tầng lắp ráp lượt chạy dựng `CodeAgent` từ AI Gateway, dựng `healFn`, và tiêm vào Locator Resolver qua `registerHealer` + nối `registerHealSink` tới `evidence.onHeal` — chỉ khi AI bật cho app. Đây là điểm hội tụ khép mạch tự phục hồi lúc chạy. AI tắt/thiếu token → không tiêm healer, hành vi Phase 1.

## Tickets

### TICKET-041: Tiêm healer + heal sink lúc mở phiên; truyền công tắc AI theo app qua env
**Thiết kế liên quan:** component-design.md#Ghi-chú-lắp-ráp, component-design.md#AI-Gateway, component-design.md#Locator-Resolver, interface-spec.md#Locator-Resolver-tiêm-healer, sequence-diagrams.md#1, ADR-014, ADR-018, ADR-025, BR-201, BR-209, BR-221
**Phụ thuộc:** TICKET-037, TICKET-038, TICKET-030

**Chỉ dẫn code**
- **CLI-side (nơi dựng biến môi trường `AIMTAP_*`, đường `run` — `src/runner/launch-run.ts` / `src/cli/commands/run.ts`):** thêm hai khóa từ `AppConfig.ai` đã resolve: `AIMTAP_AI_ENABLED` (`'1'|'0'`) và `AIMTAP_AI_HEAL_RETRIES` (số). Theo đúng pattern tiêm `AIMTAP_*` sẵn có (CLI là nguồn duy nhất, worker đọc env) — không thêm cạnh `runner → registry`.
- **Worker-side (`src/runner/run-assembly.ts`, trong `assembleWorkerRun`):**
  - Đọc `AIMTAP_AI_ENABLED`/`AIMTAP_AI_HEAL_RETRIES` từ env (mặc định tắt / 3 khi thiếu).
  - Nếu AI bật:
    - `const agent = createCodeAgent({ cli: 'claude-code', limits: { maxCallsPerRun, callTimeoutMs } })` (AI Gateway; token nạp bên trong qua `loadCliToken`, tiêm vào subprocess). `limits` dùng mặc định nền tảng (NFR-202); ghi hằng ở một chỗ.
    - `const healFn = (ctx) => healLocator(agent, ctx)` (US-7.2).
    - `registerHealer(healFn)` với `healRetries` (BR-202); `registerHealSink((record) => evidence.onHeal(record))` (US-7.3) — nối Locator → Evidence qua sink, không tạo cạnh `locator → evidence`.
  - Nếu AI tắt: không tiêm healer/sink → hành vi Phase 1 (BR-208/BR-209).
  - Gỡ healer/sink khi phiên đóng nếu vòng đời cần (đối xứng `clearScreenSink`).
- **Ranh giới module (`eslint.config.ts`):** thêm `ai` vào `element-types` của `runner`: `{ from: ['runner'], allow: ['shared', 'device', 'evidence', 'locator', 'store', 'ai'] }` (component-design §Ghi-chú-lắp-ráp: lắp ráp → AI Gateway).

**Acceptance Criteria (cấp code)**
- [ ] AI bật → `assembleWorkerRun` tiêm healer + heal sink; healFn gọi AI Gateway; heal sink trỏ `evidence.onHeal` (test đơn vị với AI Gateway/Evidence giả lập).
- [ ] AI tắt hoặc thiếu token → không tiêm healer; `find` hỏng như Phase 1 (test đơn vị).
- [ ] CLI tiêm `AIMTAP_AI_ENABLED`/`AIMTAP_AI_HEAL_RETRIES` từ `AppConfig.ai`; worker đọc đúng (test đơn vị dựng env).
- [ ] `eslint.config.ts` cho `runner → ai`; `make lint`/`typecheck` xanh. Khép mạch tự phục hồi kiểm chứng thủ công ở lượt chạy thật (ghi trong PR).

## Definition of Done (US)
Theo `conventions.md` §4. Khép mạch đầu-cuối kiểm chứng thủ công trên simulator (một locator gieo hỏng → AI trả locator → bước tiếp tục → heal hiện trong báo cáo).

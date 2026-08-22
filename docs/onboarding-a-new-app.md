# Hướng dẫn dùng aimtap — từ máy trống tới app chạy test

Tài liệu vận hành cho **QC automation**: setup máy, đưa một app mới vào kiểm thử tự động (từ một build `.ipa`/`.app` + bản mô tả chức năng), chạy test, xem kết quả. Nền tảng chạy **cục bộ** trên máy QC; phần AI dùng **Claude Code CLI** (ADR-025).

Đây là **hướng dẫn thao tác** cho QC, **dẫn xuất** từ tài liệu quy trình có thẩm quyền `docs/architecture/app-onboarding-workflow.md` (nơi Team Lead đọc cùng use-case của BA để chẻ ticket). Tài liệu này dạy *cách áp dụng*; nguồn chân lý của các quy tắc code ở `docs/architecture/coding-convention.md`, cấu trúc thư mục ở `north-star.md §2.1`. Khi hai bên khác nhau, tin coding-convention.

## Cách đọc — [NGƯỜI] và [MÁY]

Mỗi bước gắn một nhãn:
- **[NGƯỜI]** — con người **bắt buộc** làm tay (không tự động hóa được): nhận build từ đội dev, đặt file vào thư mục, đọc app bằng Appium Inspector, duyệt kết quả.
- **[MÁY]** — một **lệnh** làm tự động; mỗi bước [MÁY] ghi rõ "máy làm gì bên trong".

Lệnh chưa hiện thực đánh dấu **⏳ (US-…)** kèm cách làm tay tạm thời, để tài liệu khớp đúng trạng thái hôm nay.

---

# Phần 1 — Setup máy (một lần cho mỗi máy mới)

### 1.1. [NGƯỜI] Chuẩn bị công cụ host
- macOS; Node `>=22`; Xcode + Appium 2 (chạy iOS); **Appium Inspector** (app desktop, dùng ở bước 2.5).
- Nếu dùng AI: Claude Code CLI + một token thuê bao (bước 1.3 lo).

### 1.2. [MÁY] `make install`
**Máy làm:** `npm ci` — cài đúng phiên bản phụ thuộc theo `package-lock.json`.

### 1.3. [MÁY] `make setup`
**Máy làm:** chạy `aimtap setup` — kiểm Claude Code CLI, hướng dẫn lấy token, lưu `CLAUDE_CODE_OAUTH_TOKEN` vào `.env.local` (git-ignored). Khi lệnh nhắc, người chạy `claude setup-token` một lần và dán token vào.
> Tự cài Claude Code CLI khi thiếu là tiện ích US-6.4 (⏳). Hiện tại: cài Claude Code CLI thủ công trước nếu máy chưa có.

### 1.4. [MÁY] `make doctor`
**Máy làm:** báo cáo host tools (Node, Xcode, Appium) và phần AI (CLI + token). Thiếu AI → tính năng AI tắt, test không-AI vẫn chạy (BR-221).

**Xong Phần 1 khi:** `make doctor` xanh phần host tools; nếu dùng AI, báo `[ok] AI CLI` + `[ok] AI token`. Các lần sau trên cùng máy: token đã lưu, không lặp `make setup`; chỉ `make install` lại khi phụ thuộc đổi.

---

# Phần 2 — Đưa một app mới vào test

Mỗi bước gắn [NGƯỜI] hay [MÁY] theo đúng luật: **có lệnh `make` làm → [MÁY]; phải tự tay đặt/di chuyển file hoặc điền nội dung → [NGƯỜI]**. Hai bước cần phán đoán con người nhiều nhất: **2.5** (đọc app lấy page source) và **2.6** (nội dung test). Quy tắc viết test chi tiết ở **Phụ lục A**.

### 2.1. [NGƯỜI] Nhận bàn giao từ đội dev
Hai thứ:
1. **Bản build** — một file `.ipa` (thiết bị thật) hoặc `.app` (simulator). Đây là app đã biên dịch; mã nguồn app **không** nằm trong repo nền tảng.
2. **Bản mô tả chức năng cần test** — văn bản ngôn ngữ tự nhiên (dùng ở bước 2.5/2.6).

Chọn một **app-id**: chữ thường/số/gạch ngang (`my-demo-app`). Nó là tên thư mục `apps/<app-id>/` và giá trị `appId` — hai chỗ phải khớp.

### 2.2. [MÁY] `make new-app APP=<app-id>` — dựng sườn
**Máy làm bên trong** (TICKET-047):
- Tạo cây `apps/<app-id>/{build,features,steps,screens,fixtures}`.
- Ghi `app.config.ts` (điền sẵn `appId`, còn lại `// TODO`, kèm khối `ai: { enabled: false, healRetries: 3 }`).
- Ghi `test-data.example.json` (`{ "secrets": {}, "env": {} }`) và `test-data.local.json` (bản sao).
- Ghi `build/.gitkeep` kèm chú thích về file build.
- Ghi mỗi thư mục một file mẫu đúng pattern (`features/example.feature`, `steps/example.steps.ts`, `screens/Example.screen.ts`, `fixtures/example.ts`) để bước 2.6 có khuôn bắt chước.
- In các bước kế tiếp (điền config, thả build, điền test-data).

> ⏳ `make new-app` là US-6.5, **chưa merge**. Hiện làm tay: sao chép cấu trúc từ `apps/my-demo-app/` rồi xóa nội dung nghiệp vụ, giữ khung.

### 2.3. [NGƯỜI] Đặt bản build vào `apps/<app-id>/build/`
Bản chất artifact — cần hiểu đúng vì đây là chỗ hay nhầm:
- `.app` **là một thư mục** (application bundle), không phải file đơn: bên trong là app đã biên dịch (`Info.plist`, binary, `.nib`, `Frameworks/`, assets). **Không tạo, không sửa** gì bên trong — nó là hộp đen.
- `.ipa` thực chất là một zip chứa `Payload/<Tên>.app`.

Cách đặt:
- Nhận `.app` → thả thẳng thư mục đó vào `apps/<app-id>/build/`.
- Nhận `.ipa`/zip → **giải nén**: `unzip <file> -d apps/<app-id>/build/` → ra `apps/<app-id>/build/Payload/<Tên>.app`.

Toàn bộ `apps/*/build/` bị `.gitignore` — cả zip lẫn `.app`, không gì lên Git.

### 2.4. [NGƯỜI] Điền `app.config.ts` + dữ liệu test
`app.config.ts` — trỏ nền tảng tới đúng build và thiết bị:
```ts
export default {
  appId: 'my-demo-app',
  buildPath: 'apps/my-demo-app/build/Payload/My Demo App.app', // trỏ VÀO thư mục .app
  deviceType: 'simulator',
  deviceId: 'iPhone 17',
  osVersion: '26.5',
};
```
- App Registry kiểm file này bằng schema Zod lúc nạp; sai → dừng sớm, báo thiếu gì.

**Lấy `deviceType` / `deviceId` / `osVersion`:**

| Trường | Simulator | Thiết bị thật |
|---|---|---|
| `deviceType` | `'simulator'` | `'real'` |
| `deviceId` | tên simulator (vd `iPhone 17`) hoặc UDID — dùng làm `appium:deviceName` | **UDID** của thiết bị |
| `osVersion` | phiên bản iOS của simulator (vd `26.5`) | phiên bản iOS của thiết bị |

- **Simulator:** `xcrun simctl list devices available` liệt kê simulator theo runtime — mỗi dòng có tên + UDID + trạng thái; tiêu đề nhóm là phiên bản iOS (`-- iOS 26.5 --`). Boot một máy: mở app Simulator, hoặc `xcrun simctl boot "iPhone 17"`. Điền `deviceId` = **tên** (bền giữa các máy hơn UDID), `osVersion` = phiên bản nhóm.
- **Thiết bị thật:** `xcrun xctrace list devices` liệt kê thiết bị đang cắm kèm UDID + phiên bản iOS; điền `deviceId` = **UDID**, `osVersion` = phiên bản iOS đó. (Thiết bị thật còn cần cấu hình code signing — ngoài phạm vi tài liệu này.)

Dữ liệu test: sao `test-data.example.json` → `test-data.local.json`, điền **giá trị thật** (git-ignored). Nhánh `secrets` được logger che, không lọt vào log/báo cáo (ADR-009).

### 2.5. [NGƯỜI] Đọc app lấy page source
Bước quyết định: locator **không suy được từ file build**, phải mở app thật và đọc cây accessibility (page source) của **từng màn**.

**Vì sao không tự động hoàn toàn được:** app đã nằm trong `build/` (bước 2.3) và khởi chạy được — nhưng khởi chạy chỉ mở ra **màn đầu tiên**. Page source cần lấy là của **một màn cụ thể** (vd màn login nằm sau vài lần bấm), và chỉ lấy được khi app **đang ở đúng màn đó**. Đưa app tới màn đó cần một kịch bản điều hướng — mà kịch bản đó chính là thứ đang định tạo (chưa có). Nên máy chỉ chụp được page source của **màn đang hiển thị**; phần **điều hướng tới màn đích** phải làm tay.

Các bước:
- Chạy Appium server; mở **Appium Inspector**; đặt capability tối thiểu: `platformName=iOS`, `appium:automationName=XCUITest`, `appium:deviceName`=`deviceId`, `appium:platformVersion`=`osVersion`, `appium:app`=đường dẫn `.app` (như `buildPath`). Khởi phiên.
- Điều hướng app (bấm trong Inspector hoặc simulator) tới **từng màn cần kiểm**; mỗi màn, **lưu page source ra một file** (vd `login.page.xml`). File này là đầu vào `PAGE` của bước 2.6.
- Cách chọn locator từ cây: **Phụ lục A §Chọn locator**.

> Khâu *chụp* page source ra file có thể gói thành một lệnh nền tảng về sau (thay Appium Inspector); nhưng phần *điều hướng* tới màn vẫn là thao tác tay, không bỏ được.

### 2.6. Sinh test — hai đường

**Đường AI [MÁY]** (khi app bật AI: `app.config.ts` → `ai.enabled: true`, và máy có token):
```
make generate APP=<app-id> DESC=<desc-file> PAGE=<page-source-file>
```
**Máy làm bên trong** (US-8.2): đọc `AppConfig.ai` (tắt → in thông báo soạn tay, không gọi CLI); đọc file mô tả + page source; gom danh sách step đã có (để tái dùng); gọi Claude Code với **thư mục làm việc = `apps/<app-id>/`** nên file nháp rơi đúng vào app dir; sinh `.feature`/steps/screen gắn tag `@ai-generated`; in danh sách file nháp đã tạo.
> ⏳ Target `make generate` là US-6.5, **chưa merge**. Tới khi có, chạy trực tiếp: `npx tsx src/cli/index.ts generate <app-id> --description-file <DESC> --page-source <PAGE>`.

**Đường viết tay [NGƯỜI]** (khi AI tắt, hoặc muốn tự viết): viết `.feature` → `steps` → `screens` theo **Phụ lục A**.

### 2.7. [MÁY] `make run APP=<app-id>` — chạy test
Chạy bộ test trên simulator/thiết bị; kết quả đọc ở bước 2.8.

### 2.8. [NGƯỜI] Sửa tới xanh + đối chiếu
Đọc lỗi/nhật ký từ 2.7 → sửa (thường là locator ở bước 2.5, hoặc bước sai) → chạy lại (2.7) tới xanh. Với file AI sinh: đối chiếu nháp với mô tả hành vi + nhật ký thực thi (**Phụ lục B** là checklist).

### 2.9. [MÁY] Cổng chất lượng
`make typecheck`, `make lint`, `make test` — cả ba phải xanh (chi tiết Phần 4).

### 2.10. [NGƯỜI] Mở pull request
Mọi test case vào nhánh chính **chỉ qua PR được duyệt** (BC-08). Chi tiết git: skill `git-workflow`.

---

# Phần 3 — Chạy & xem kết quả (hằng ngày)

### 3.1. [MÁY] Chạy test
```
make run APP=<app-id>              # bộ hồi quy (loại các case @assert-fail)
make run-assert-fail APP=<app-id>  # chỉ các case gieo lỗi có chủ đích
```
**Máy làm:** khi AI bật + có token, nếu một locator hỏng lúc chạy, nền tảng **tự phục hồi** (gọi Claude Code chỉ-đọc lấy locator thay thế, thử live, chạy tiếp) — lượt chạy không dừng. Không có AI/không phục hồi được → bước đó hỏng, lượt chạy vẫn không dừng.

### 3.2. [NGƯỜI] Xem kết quả
| Kênh | Xem gì | Ở đâu |
|---|---|---|
| CLI summary | Bảng per-feature đạt/hỏng, in cuối `make run`. | Terminal |
| Báo cáo HTML | Mỗi test hỏng: ảnh bước hỏng + nhật ký + loại lỗi. Mỗi lần tự phục hồi: locator cũ→mới + ảnh phần tử AI đã bấm; test đạt-có-heal gắn nhãn "đạt kèm tự phục hồi". | `output/<app-id>/reports/<run-id>.html` |
| Store | `heal_event` (mỗi lần tự phục hồi một dòng), `test_case_result.status` (passed/failed). | `data/database.db` |
| File sinh | Test case nháp tag `@ai-generated`. | `apps/<app-id>/` |

### 3.3. [MÁY] Sinh lại báo cáo (không chạy lại test)
```
make report RUN=<run-id>
```

### 3.4. [NGƯỜI] Sau khi AI tự phục hồi — cập nhật locator
Tự phục hồi **không sửa code**: sau lượt chạy, Page Object vẫn giữ locator cũ; báo cáo cho locator mới + ảnh phần tử AI đã bấm. Người xem báo cáo: nếu AI đoán đúng, cập nhật locator vào Page Object và mở PR (BR-203/BR-210). Nếu ảnh cho thấy AI bấm sai phần tử, kết quả "đạt kèm tự phục hồi" của lượt đó không đáng tin — điền locator đúng.

---

# Phần 4 — Cổng chất lượng (trước khi mở PR)
```
make typecheck    # tsc --noEmit
make lint         # eslint (gồm cưỡng chế ranh giới module)
make test         # vitest
```
Cả ba phải xanh trước khi merge (`CLAUDE.md §6`).

---

# Phụ lục A — Quy tắc viết test

Dùng khi **viết tay** (bước 2.6 đường người) và khi **đối chiếu file AI sinh** (bước 2.7). Viết theo thứ tự `features` → `steps` → `screens`; phụ thuộc trong app một chiều `features/` → `steps/` → `screens/`. Ví dụ trích từ `apps/my-demo-app/`.

### Chọn locator (từ cây page source ở bước 2.5)
1. **Ưu tiên accessibility id** khi phần tử có id ổn định: `byAccessibilityId('AddToCart')`.
2. **Không có id → khớp theo `name`/`type` bằng predicate:**
   ```ts
   const loginButton: Locator = byPredicate("type == 'XCUIElementTypeButton' AND name == 'Login'");
   ```
3. **Cần ĐỌC một giá trị (không chỉ tìm) → khớp theo mẫu rồi đọc thuộc tính:**
   ```ts
   const itemCountLabel: Locator = byPredicate("name MATCHES '[0-9]+ Items'");
   ```
   Vì sao: định vị bằng phần tử giá trị-cụ-thể ("2 Items") sẽ **chờ hết timeout rồi hỏng** khi giá trị thật khác — biến kết luận sai thành lỗi hạ tầng. Khớp mẫu + đọc số thật cho phép so sánh đúng ở tầng assertion.

### `.feature` — mô tả hành vi
- Mỗi `Scenario` = một test case: **một hành vi + một kết quả**, tiếng Anh, **không locator, không thao tác giao diện**. Bước mở đầu tự đưa app về trạng thái cần (BR-005).
- Đúng: `When I log in with the standard account`. Sai (bị trả ở rà soát PR): `When I tap the "Login" button`.
- Tên file = tên test feature `kebab-case`; tên `Scenario` = tên test case; tag `@kebab-case`.
- Khuyến nghị thêm một scenario `@assert-fail` (gieo lỗi có chủ đích) để kích hoạt đường ảnh chụp + báo cáo hỏng; nó bị loại khỏi `make run`, chạy riêng bằng `make run-assert-fail`.

```gherkin
Feature: Cart
  Add a product from the catalog to the cart.

  @cart
  Scenario: Add a product to the cart
    Given the cart is empty
    When I add a product to the cart
    Then the cart shows 1 items
```

### `screens/*.screen.ts` — Page Object
Một màn một Page Object; locator tập trung; phơi **thao tác nghiệp vụ**; tìm qua `find(locator, SCREEN)`; **không assertion**. Tách **truy vấn** (trả giá trị) khỏi **khẳng định** (ở step).
```ts
import { find, byAccessibilityId, byPredicate, type Locator } from '../../../src/index.js';

const SCREEN = 'CartScreen';   // khớp tên Page Object → trường `screen` của bản ghi truy ngược được (ADR-011)
const catalogTab: Locator = byAccessibilityId('Catalog-tab-item');
const itemCountLabel: Locator = byPredicate("name MATCHES '[0-9]+ Items'");

export const cartScreen = {
  async addFirstProductToCart(): Promise<void> {
    await (await find(catalogTab, SCREEN)).click();
    // ...
  },
  async itemCount(): Promise<number> {           // truy vấn — trả giá trị, không assert
    const label = await (await find(itemCountLabel, SCREEN)).getAttribute('name');
    return Number(/(\d+)/.exec(label ?? '')?.[1] ?? 0);
  },
};
```

### `steps/*.steps.ts` — step definition
Mỗi câu ánh xạ một thao tác Page Object; **không locator, không gọi thẳng WebdriverIO**; khẳng định qua `assertExpectation` (kỳ vọng sai → `wrong_conclusion`, ADR-016). Kiểm câu đã có trước khi viết câu mới (gộp, không nhân bản).
```ts
import { Given, When, Then } from '@cucumber/cucumber';
import { assertExpectation } from '../../../src/index.js';
import { cartScreen } from '../screens/cart.screen.js';

Then('the cart shows {int} items', async (count: number) => {
  await cartScreen.openCart();
  await assertExpectation(async () => {
    const actual = await cartScreen.itemCount();
    if (actual !== count) {
      throw new Error(`Expected the cart to show ${count} items but it shows ${actual}`);
    }
  });
});
```

### `fixtures/` + dữ liệu test
Tham chiếu dữ liệu **theo tên** qua Config & Secrets; không viết cứng giá trị (giá trị ở `test-data.local.json`):
```ts
import { loadTestData } from '../../../src/index.js';
export function standardUser(): Account {
  return loadTestData('my-demo-app').secrets.standardUser as unknown as Account;
}
```

---

# Phụ lục B — Checklist tự rà trước PR

- [ ] `app.config.ts.appId` khớp tên thư mục; `buildPath` trỏ vào thư mục `.app` trong `build/`.
- [ ] `.feature` mức nghiệp vụ, tiếng Anh, **không locator**; mỗi test case một hành vi + một kết quả; bước mở đầu tự reset trạng thái.
- [ ] Step definition **không** locator, **không** gọi thẳng WebdriverIO; khẳng định qua `assertExpectation`; không câu trùng hành vi.
- [ ] Page Object: một màn một object, locator tập trung, **không assertion**; `screenName` khớp tên Page Object.
- [ ] Cần đọc giá trị thì khớp mẫu + đọc thuộc tính, **không** chờ phần tử giá trị-cụ-thể.
- [ ] `test-data.local.json` và build **không** lên Git.
- [ ] Ba cổng `typecheck`/`lint`/`test` xanh; `make run` xanh trên simulator.

---

# Con trỏ (nguồn chân lý)

| Cần gì | Ở đâu |
|---|---|
| Quy tắc code đầy đủ (kèm lý do) | `docs/architecture/coding-convention.md` |
| Cấu trúc thư mục + module nền tảng | `docs/architecture/north-star.md §2.1, §2` |
| Lệnh vận hành (định nghĩa gốc) | `Makefile` |
| Vì sao lỗi phân hai nhánh / status / heal | `adr/adr-016`, `adr-024`; `north-star.md §4` |
| App tham chiếu để đọc kèm | `apps/my-demo-app/` |
</content>

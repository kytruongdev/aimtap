# Coding Convention

Quy ước áp dụng cho toàn bộ kho mã: nền tảng, Page Object, phần cài đặt và phần mô tả hành vi của kịch bản. Cây thư mục tương ứng ở `north-star.md` §2.1; các nguyên tắc thiết kế mà những quy tắc dưới đây phái sinh ra ở `north-star.md` §2.2.

---

## Kiến trúc (SA sở hữu)

### Ngôn ngữ
- Toàn bộ nội dung trong kho mã viết bằng tiếng Anh: tên tệp, tên thư mục, định danh, chú thích, thông điệp log, thông báo lỗi, tên kịch bản và câu mô tả hành vi trong tệp `.feature`. — *thêm bởi: SA*
- Tệp `.feature` dùng từ khóa Gherkin tiếng Anh (`Feature`, `Scenario`, `Given`, `When`, `Then`); không khai báo ngôn ngữ khác trong tệp. — *thêm bởi: SA*
- Tài liệu trong `docs/` viết bằng tiếng Việt; ranh giới ngôn ngữ nằm đúng ở biên giữa `docs/` và phần còn lại của kho mã. — *thêm bởi: SA*

### Tổ chức thư mục và ranh giới
- Mỗi module của nền tảng là một thư mục con của `src/`, đặt tên theo module ở `north-star.md` §2. Một module mới là một quyết định chạm khuôn khổ kiến trúc. — *thêm bởi: SA*
- Mỗi thư mục `apps/<app-id>/` giữ đúng cấu trúc cố định: `app.config.ts`, `features/`, `steps/`, `screens/`, `fixtures/`. — *thêm bởi: SA*
- Mã trong `src/` không import bất kỳ thứ gì từ `apps/`. — *thêm bởi: SA*
- Mã trong `apps/` chỉ import từ `src/index.ts`, không import vào thư mục con nội bộ của một module. — *thêm bởi: SA*
- Một module trong `src/` chỉ import module khác qua `index.ts` của module đó, không import thẳng vào tệp bên trong. Phụ thuộc đi theo đúng cột "Phụ thuộc" ở `north-star.md` §2; không có phụ thuộc vòng. — *thêm bởi: SA*
- Trong `apps/<app-id>/`, phụ thuộc đi một chiều `features/` → `steps/` → `screens/`. — *thêm bởi: SA*
- Các quy tắc ranh giới trên khai báo trong `eslint.config.ts` qua `eslint-plugin-boundaries`; thêm một module kéo theo cập nhật tệp này. — *thêm bởi: SA*
- Không có định danh, chuỗi văn bản, hay luồng nghiệp vụ của một ứng dụng cụ thể nào xuất hiện trong `src/`. — *thêm bởi: SA*
- Mọi thứ sinh ra lúc chạy (cơ sở dữ liệu kết quả, ảnh chụp, báo cáo) ghi vào `output/<app-id>/`. `output/` và `.env.local` nằm trong `.gitignore`; `.env.example` liệt kê tên biến môi trường, không chứa giá trị thật. — *thêm bởi: SA*
- Kiểm thử đơn vị đặt cạnh tệp nguồn dưới dạng `<tên>.test.ts`. — *thêm bởi: SA*

### Môi trường và lệnh vận hành
- Mọi lệnh vận hành định nghĩa trong `Makefile`; tài liệu hướng dẫn tham chiếu tới đích Makefile thay vì lặp lại chuỗi lệnh. — *thêm bởi: SA*
- Cài đặt phụ thuộc bằng `npm ci`, không dùng `npm install`, để phiên bản thư viện không xê dịch giữa các máy. Thay đổi phụ thuộc luôn kèm cập nhật `package-lock.json` trong cùng pull request. — *thêm bởi: SA*
- Phiên bản Node cố định trong `.nvmrc` và trường `engines` của `package.json`; hai nơi này luôn khớp nhau. — *thêm bởi: SA*
- `tsx` không kiểm tra kiểu lúc chạy, nên kiểm tra kiểu là một lệnh riêng và là cổng bắt buộc trước khi merge pull request. — *thêm bởi: SA*
- Điều kiện môi trường mà kho mã không cố định được (Xcode, Appium, thiết bị) kiểm tra qua `environment-check.ts`; mọi kiểm tra mới thêm vào đó thay vì viết rời trong từng lệnh. — *thêm bởi: SA*

### Phần mô tả hành vi (tệp `.feature`)
- Một câu mô tả một hành vi nghiệp vụ của người dùng, không mô tả thao tác trên phần tử giao diện. `When the user signs in with Gmail` là đúng mức; chuỗi `When the user taps the "Sign in" button`, `And the user waits for the Gmail screen`, `And the user selects the first account` là mức thao tác và bị trả lại ở khâu rà soát pull request. — *thêm bởi: SA*
- Tệp `.feature` không chứa locator, tên phần tử giao diện, hay bất kỳ chi tiết kỹ thuật nào. — *thêm bởi: SA*
- Trước khi viết một câu mới, kiểm tra trong tập step definition hiện có xem đã có câu diễn đạt cùng hành vi chưa. Hai câu khác chữ nhưng cùng hành vi là một lỗi cần gộp. — *thêm bởi: SA*
- Mỗi kịch bản tự đưa ứng dụng về trạng thái nó cần ở bước mở đầu, không giả định trạng thái do kịch bản khác hay lượt chạy trước để lại. — *thêm bởi: SA*

### Phần cài đặt (step definition)
- Step definition là nơi duy nhất gọi Page Object. Nó không chứa locator và không gọi thẳng lệnh của WebdriverIO. — *thêm bởi: SA*
- Một step definition tương ứng một hành vi nghiệp vụ, thường ánh xạ tới một phương thức Page Object. — *thêm bởi: SA*
- Biểu thức khớp của một step definition không được chồng lấn với step definition đã có. — *thêm bởi: SA*
- Câu mô tả hành vi chưa có step definition tương ứng làm lượt chạy dừng kèm danh sách câu thiếu; không cấu hình bỏ qua step chưa định nghĩa. — *thêm bởi: SA*

### Page Object
- Mỗi màn hình của ứng dụng có đúng một Page Object; locator của màn hình đó khai báo tập trung trong Page Object. — *thêm bởi: SA*
- Page Object phơi ra các thao tác ở mức nghiệp vụ của màn hình, không phơi ra phần tử thô cho step definition dùng trực tiếp. — *thêm bởi: SA*
- Page Object tìm phần tử qua Locator Resolver, không gọi thẳng lệnh tìm phần tử của WebdriverIO. — *thêm bởi: SA*
- Page Object không chứa lệnh khẳng định kết quả (assertion); khẳng định nằm trong step definition. — *thêm bởi: SA*

### Bằng chứng thực thi
- Nhật ký thực thi là bằng chứng mặc định của mọi kịch bản và được dựng trong bộ nhớ; không ghi thêm tệp nhật ký rời bên cạnh Result Store. — *thêm bởi: SA*
- Ảnh chụp màn hình chỉ được tạo tại bước hỏng, và tại bước được đánh dấu tường minh là cần chụp. Không thêm lời gọi chụp ảnh rải rác trong Page Object hay step definition. — *thêm bởi: SA*
- Mọi thao tác thu thập bằng chứng bọc trong xử lý lỗi riêng: lỗi khi chụp ảnh hoặc ghi nhật ký được ghi nhận là bằng chứng thiếu và không đổi trạng thái kịch bản, không ném ngược vào luồng thực thi. — *thêm bởi: SA*

### Kiểu dữ liệu và kiểm tra đầu vào
- Chế độ kiểm tra kiểu nghiêm ngặt của TypeScript luôn bật. Không dùng `any` cho dữ liệu đến từ bên ngoài. — *thêm bởi: SA*
- Mọi dữ liệu vào nền tảng từ bên ngoài (khai báo ứng dụng, biến môi trường, phản hồi của Claude) đi qua một schema Zod trước khi được dùng. Kiểu TypeScript của dữ liệu đó suy ra từ schema, không khai báo song song. — *thêm bởi: SA*
- Schema đặt cùng module chịu trách nhiệm về dữ liệu đó, không gom vào một thư mục schema chung. — *thêm bởi: SA*

### Xử lý lỗi
- Mọi lỗi ném ra thuộc một trong hai nhánh: `AppFailure` (lỗi của ứng dụng được kiểm thử, là kết quả hợp lệ và được ghi vào bản ghi kết quả) hoặc `PlatformFailure` (lỗi của nền tảng hoặc môi trường, không được ghi thành "kịch bản hỏng"). — *thêm bởi: SA*
- Lỗi cấu hình và lỗi môi trường được phát hiện trước khi mở phiên Appium và dừng lượt chạy kèm thông báo nêu rõ thiếu gì. — *thêm bởi: SA*
- Không nuốt lỗi bằng khối try/catch rỗng; mọi lỗi bị bắt hoặc được xử lý tường minh hoặc được ném lại kèm ngữ cảnh. — *thêm bởi: SA*
- Một kịch bản hỏng không làm dừng lượt chạy. — *thêm bởi: SA*

### Ghi log
- Ghi log qua `shared/logger.ts`, không dùng `console.log`. — *thêm bởi: SA*
- Mọi dòng log mang `run-id` của lượt chạy hiện tại. — *thêm bởi: SA*
- Trường bí mật khai báo trong danh sách che của logger; không tự ghép giá trị bí mật vào chuỗi thông điệp. — *thêm bởi: SA*

### Chờ đợi và tương tác với thiết bị
- Không dùng thời gian chờ cố định. Mọi lần chờ là chờ có điều kiện với thời gian chờ tối đa, lấy tham số từ `locator/wait-policy.ts`. — *thêm bởi: SA*
- Không gọi lệnh giao thức cấp thấp của WebDriver; dùng lệnh cấp cao của WebdriverIO để giữ cơ chế chờ và thử lại sẵn có. — *thêm bởi: SA*
- Khẳng định kết quả dùng dạng có chờ sẵn, không tự viết vòng lặp chờ trước khi khẳng định. — *thêm bởi: SA*

### Cấu hình và bí mật
- Mọi thông tin phụ thuộc ứng dụng hoặc phụ thuộc máy (đường dẫn build, định danh thiết bị, phiên bản hệ điều hành) đọc từ `app.config.ts` của ứng dụng hoặc từ biến môi trường, không viết cứng trong mã. — *thêm bởi: SA*
- Khóa API đọc qua module Config & Secrets, không đọc trực tiếp từ biến môi trường ở nơi khác. — *thêm bởi: SA*

### Truy cập dữ liệu kết quả
- Mọi truy cập cơ sở dữ liệu đi qua repository trong `src/store/`; module khác không tự viết câu lệnh SQL. — *thêm bởi: SA*
- Thay đổi schema thực hiện bằng một tệp migration có đánh số trong `src/store/migrations/`, không sửa migration đã phát hành. — *thêm bởi: SA*
- Ghi kết quả của mỗi kịch bản ngay khi kịch bản kết thúc, theo một giao dịch. — *thêm bởi: SA*

### Gọi Claude API
- Mọi lời gọi Claude đi qua Claude Client; không module nào khác gọi trực tiếp SDK hay HTTP endpoint của Claude. — *thêm bởi: SA*
- Nội dung yêu cầu gửi tới mô hình đặt trong `src/ai/prompts/`, tách khỏi mã gọi. — *thêm bởi: SA*
- Script Generator gửi kèm danh sách step definition hiện có trong mọi lần sinh kịch bản, và ưu tiên dùng lại step đã có trước khi sinh step mới. — *thêm bởi: SA*
- Phía gọi luôn xử lý được trường hợp Claude không khả dụng (bị tắt bằng cấu hình, mất mạng, hết thời gian chờ, vượt hạn mức) mà không làm hỏng lượt chạy. — *thêm bởi: SA*

---

## Thực thi & style (Team Lead bổ sung)

*(chưa có)*

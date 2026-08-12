# Pilot App Requirements — US-5.2 (Phase 1 acceptance)

Đầu vào nghiệp vụ cho ứng dụng thí điểm (AUT) của US-5.2. Đây là artifact BA giao cho vai viết `.feature`; nó không phải thiết kế kỹ thuật. Từ vựng trung tâm (test suite, test feature, test case, bước) định nghĩa ở `brd.md` §1.1; quy tắc phân cấp và dữ liệu ở BR-016, BR-017; quy tắc bằng chứng ở BR-003, BR-004, BR-014.

## 1. Mục đích và phạm vi

US-5.2 là lần chứng minh nền tảng chạy đầu-cuối thật trên simulator, và là **baseline known-good** để về sau đo hiệu quả phần AI. Vì đội chưa có ứng dụng nội bộ, requirement và dữ liệu nghiệp vụ được dựng từ một ứng dụng demo nguồn mở làm AUT.

Phạm vi test suite thí điểm: ba luồng cốt lõi — đăng nhập đúng, đăng nhập sai, thêm sản phẩm vào giỏ. Suite chứa tối thiểu một test case đạt và một test case hỏng, để chứng minh cả đường bằng chứng của test case đạt lẫn đường ảnh chụp + báo cáo của test case hỏng.

Ngoài phạm vi: checkout, thanh toán, QR scanner, và mọi luồng không nằm trong ba luồng cốt lõi trên.

## 2. Ứng dụng được kiểm thử (AUT)

| Mục | Giá trị |
|---|---|
| Ứng dụng | SauceLabs My Demo App (iOS) — ứng dụng thương mại điện tử mẫu: đăng nhập, duyệt sản phẩm, giỏ hàng, checkout. |
| Nguồn | https://github.com/saucelabs/my-demo-app-ios (build simulator `SauceLabs-Demo-App.Simulator.zip`, release 2.2.2) |
| Loại thiết bị | Simulator (`deviceType: 'simulator'`). |
| Định danh ứng dụng trong nền tảng | Do đội đặt khi dựng `apps/<app-id>/` (quyết định kỹ thuật). |

## 3. Dữ liệu kiểm thử (theo BR-017)

Test case tham chiếu dữ liệu bằng tên; giá trị nằm ở `test-data.local.json` trên máy, khuôn ở `test-data.example.json`. Ba luồng này chỉ đọc dữ liệu, không tiêu thụ hay tạo mới dữ liệu, nên không có bước sinh dữ liệu ở đầu test case.

| Tên mục | Loại | Mô tả |
|---|---|---|
| `standardUser.username` | Bí mật (secret) | Tài khoản hợp lệ đăng nhập được và tới được danh mục sản phẩm. |
| `standardUser.password` | Bí mật (secret) | Mật khẩu đúng của `standardUser`. |
| `wrongPassword` | Không bí mật | Một mật khẩu sai có chủ đích, do test kiểm soát, để kiểm luồng đăng nhập thất bại. |

## 4. Test feature và test case

Mỗi test case phát biểu ở mức nghiệp vụ: bối cảnh (precondition) — hành động — kết quả mong đợi. Bước mở đầu tự đưa ứng dụng về trạng thái cần (BR-005). Không nêu locator hay chi tiết phần tử (thuộc vai viết `.feature`/Page Object).

### TF-1: Authentication (đăng nhập)

**TC-1.1 — Đăng nhập bằng thông tin hợp lệ. (Kỳ vọng: ĐẠT)**
- Precondition: ứng dụng vừa khởi động, đang ở màn hình đăng nhập.
- Action: nhập `standardUser.username` và `standardUser.password`, xác nhận đăng nhập.
- Expected: đăng nhập thành công và hiển thị danh mục sản phẩm.

**TC-1.2 — Đăng nhập bằng mật khẩu sai. (Kỳ vọng: ĐẠT)**
- Precondition: ứng dụng vừa khởi động, đang ở màn hình đăng nhập.
- Action: nhập `standardUser.username` và `wrongPassword`, xác nhận đăng nhập.
- Expected: đăng nhập bị từ chối, một thông báo lỗi hiển thị, người dùng vẫn ở màn hình đăng nhập, danh mục sản phẩm không hiển thị.

Lý do TC-1.2 là ĐẠT: đây là kiểm thử đường phủ định; hành vi đúng của ứng dụng là chặn đăng nhập và báo lỗi, nên khi ứng dụng làm đúng thì test case đạt.

### TF-2: Cart (giỏ hàng)

**TC-2.1 — Thêm một sản phẩm vào giỏ. (Kỳ vọng: ĐẠT)**
- Precondition: đã đăng nhập bằng `standardUser` và đang ở danh mục sản phẩm.
- Action: chọn một sản phẩm và thêm sản phẩm đó vào giỏ.
- Expected: giỏ hàng thể hiện đang có đúng một sản phẩm.

**TC-2.2 — [SEEDED-FAIL] Số lượng giỏ hàng sau khi thêm một sản phẩm. (Kỳ vọng: HỎNG)**
- Precondition: đã đăng nhập bằng `standardUser` và đang ở danh mục sản phẩm.
- Action: thêm đúng một sản phẩm vào giỏ.
- Expected (đặt sai có chủ đích): giỏ hàng thể hiện đang có hai sản phẩm.
- Kết quả thực tế: ứng dụng thể hiện một sản phẩm, nên kết luận của test case sai so với thực tế và test case hỏng với loại lỗi "test case kết luận sai" (BR-014).

Vai trò của TC-2.2: đây là test case gieo lỗi có chủ đích, tồn tại **chỉ để** kích hoạt đường ảnh chụp tại bước hỏng và phần báo cáo test case hỏng cho nghiệm thu US-5.2. Nó được gắn nhãn tường minh (ví dụ tag `@seeded-fail`) để reviewer hiểu đây là lỗi cố ý, và để loại khỏi bộ hồi quy thật về sau. Phần mô tả hành vi của nó vẫn khớp với phần cài đặt (NFR-09): nó thật sự kiểm tra "giỏ có hai sản phẩm", chỉ là kỳ vọng đó không đúng với ứng dụng.

Phương án thay thế cho vai viết `.feature`, nếu build có tài khoản bị khóa: thay TC-2.2 bằng một test case đăng nhập bằng tài khoản khóa mà kỳ vọng (sai có chủ đích) là vào được danh mục — cũng cho một test case hỏng thật. Chọn phương án nào là quyết định của vai viết `.feature` dựa trên build thật.

## 5. Đối chiếu với tiêu chí nghiệm thu US-5.2

| Tiêu chí (open-items US-5.2) | Đáp ứng bởi |
|---|---|
| Ba luồng cốt lõi: đăng nhập đúng, đăng nhập sai, thêm sản phẩm vào giỏ | TC-1.1, TC-1.2, TC-2.1 |
| ≥1 test case đạt | TC-1.1, TC-1.2, TC-2.1 |
| ≥1 test case hỏng (chứng minh đường bằng chứng + báo cáo hỏng) | TC-2.2 |
| Mỗi test case một hành vi và một kết quả mong đợi (BR-016) | Cả năm test case |
| Bước mở đầu tự thiết lập trạng thái, không phụ thuộc test case khác (BR-005) | Precondition từng test case |

## 6. Giả định và câu hỏi mở

Các mục dưới đây đặc thù theo build thật; người mở simulator (Bước 0) hoặc vai viết `.feature` xác nhận, không cần BA quyết.

- `GIẢ ĐỊNH:` AUT có màn hình đăng nhập nhận cặp username/password và một tài khoản hợp lệ tới được danh mục sản phẩm. Giá trị cụ thể của `standardUser` điền vào `test-data.local.json` sau khi quan sát build (màn hình đăng nhập của dòng app này thường liệt kê sẵn các tài khoản chấp nhận được).
- `GIẢ ĐỊNH:` Đăng nhập sai mật khẩu làm ứng dụng hiển thị thông báo lỗi và giữ người dùng ở màn hình đăng nhập.
- `GIẢ ĐỊNH:` Danh mục sản phẩm có thao tác thêm vào giỏ và giỏ hàng có chỉ báo số lượng sản phẩm.
- `CÂU HỎI MỞ:` Build có tài khoản bị khóa (locked-out user) không? Nếu có, đây là lựa chọn cho test case hỏng thật ở §4 thay cho case gieo lỗi.

## 7. Bàn giao

Artifact này giao cho vai viết `.feature` (mũ QC của US-5.2) làm đầu vào cho `features/*.feature`. Việc ánh xạ từng câu mô tả sang step definition, Page Object và accessibility id thuộc vai đó; việc chọn định danh ứng dụng và cấu trúc `apps/<app-id>/` thuộc mũ Team Lead. BA không giữ mục mở nào ở US-5.2.

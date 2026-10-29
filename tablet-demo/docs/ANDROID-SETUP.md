# Cài ứng dụng tư vấn lên tablet Tomko 27" (Android 15)

Ứng dụng chạy như một trang web, đặt trên website của tiệm tại địa chỉ **/tablet/**:

- Bản thử hiện nay: `https://grey-jackal-135755.hostingersite.com/tablet/`
- Khi tên miền `minhquanghanoi.com` mở công khai thì dùng `https://minhquanghanoi.com/tablet/` (lúc đang bị chặn trước ngày ra mắt thì chỉ dùng được địa chỉ thử ở trên).
- Ứng dụng có **mã truy cập riêng** (không phải mật khẩu của website). Lần đầu mở, trang "Nhập mã truy cập" hiện ra; nhập mã một lần, tablet được nhớ trong 1 năm. Người quản lý đặt mã bằng biến `TABLET_ACCESS_CODE` trên Hostinger (xem `DEPLOY.md`); chưa đặt thì ứng dụng chưa mở. Đổi mã thì mọi tablet phải nhập lại.

Tablet tải ứng dụng **một lần khi có mạng**, từ đó chạy được cả khi mất mạng (chọn thiết kế, xuất PDF; các đơn chưa gửi được sẽ giữ trên máy và tự gửi khi có mạng).

## 1. Mở và cài lên màn hình chính

1. Nối tablet vào Wi-Fi.
2. Mở **Chrome**, vào địa chỉ ở trên, nhập mã truy cập. Đợi trang tải xong (lần đầu khoảng 4 MB).
3. Bấm menu **⋮** của Chrome → **Cài đặt ứng dụng** (hoặc **Thêm vào màn hình chính**) → **Cài đặt**.
4. Từ nay mở ứng dụng bằng biểu tượng **MQ Tư vấn** ở màn hình chính. Ứng dụng chạy **toàn màn hình**, không có thanh địa chỉ.

## 2. Nối với bảng tính Google (làm một lần cho mỗi tablet)

1. Trong ứng dụng, **chạm 5 lần liên tiếp vào logo** Minh Quang ở góc trái phía trên. Trang **Cài đặt máy này** hiện ra (khách không thấy). Nếu đang dùng Chrome bình thường, có thể gõ thẳng `…/tablet/#/setup`.
2. Dán **địa chỉ ứng dụng web** của Apps Script (kết thúc bằng `/exec`) và **mã bí mật (SECRET)** nếu bạn đã đặt. Hai thứ này lấy từ bước 4 và bước 3 của [`google-sheets/GUIDE.md`](google-sheets/GUIDE.md).
3. Bấm **Kiểm tra kết nối**. Thấy dòng "Kết nối được" là đúng.
4. Bấm **Lưu**, rồi **Về ứng dụng**.

Địa chỉ này chỉ lưu trên tablet đó, không nằm trên website.

## 3. Thử một đơn

Chọn một sản phẩm → **Bắt đầu từ gợi ý nhà may** → **Xem lại thiết kế** → **Xác nhận thiết kế** → điền Order ID `THU-001`, tên, số điện thoại → **Xác nhận đơn**. Dòng "Bảng tính" phải báo "Đã ghi đơn vào bảng tính", rồi bấm **Xuất PDF phiếu thiết kế** (file nằm trong thư mục **Tải xuống** của tablet). Xóa dòng thử trong bảng tính trước khi dùng thật.

## 4. Chỉnh Android cho dùng ở cửa hàng

Các mục này nằm trong **Cài đặt** của Android (tên có thể hơi khác tùy máy):

| Việc | Chỗ chỉnh | Vì sao |
|---|---|---|
| Màn hình không tự tắt | **Tùy chọn nhà phát triển → Giữ màn hình luôn bật khi sạc**, hoặc **Màn hình → Thời gian chờ** đặt dài nhất | Ứng dụng đã tự xin giữ sáng màn hình, nhưng đặt thêm cho chắc |
| Khóa hướng màn hình | Kéo thanh trạng thái xuống, bật/tắt **Tự xoay** | Ứng dụng chạy cả hướng ngang lẫn dọc; khóa theo hướng bạn dùng |
| Khách không thoát ra ngoài | **Bảo mật → Ghim ứng dụng**, rồi ghim **MQ Tư vấn** từ màn hình ứng dụng gần đây | Ghim ứng dụng chặn vuốt về màn hình chính |
| Chữ và nút to nhỏ | **Màn hình → Kích thước hiển thị** | Ứng dụng tự phóng theo cỡ màn hình; chỉnh thêm nếu vẫn nhỏ hoặc to |
| Không bị tiết kiệm pin làm tắt | **Pin → Không hạn chế** cho Chrome | Tránh hệ thống dừng ứng dụng ở chế độ nền |
| Luôn mới | Cập nhật **Chrome** và **Android System WebView** trên Google Play | Một số tính năng (giữ sáng màn hình, cài ứng dụng) cần bản mới |

Tablet cần có **Google Play / Chrome**. Nếu máy không có Chrome, dùng Edge hoặc Firefox cũng chạy được ứng dụng, chỉ khác cách cài lên màn hình chính.

## 5. Khi có bản mới

Ứng dụng tự kiểm tra bản mới mỗi lần mở khi có mạng. Sau khi bạn đưa bản mới lên website, trên tablet hãy **đóng hẳn ứng dụng rồi mở lại hai lần** (lần đầu tải bản mới, lần sau chạy bản mới). Xem số **Phiên bản** ở trang Cài đặt máy này để biết đã mới chưa.

## 6. Xử lý sự cố

| Thấy gì | Cách xử lý |
|---|---|
| Không thấy mục "Cài đặt ứng dụng" | Chrome chưa nhận ra ứng dụng: tải lại trang, đợi vài giây, mở lại menu. Hoặc dùng "Thêm vào màn hình chính" (vẫn mở được toàn màn hình). |
| Trang "Nhập mã truy cập" hiện lại | Mã đã bị đổi hoặc dữ liệu Chrome bị xóa: nhập lại mã. Thấy "Ứng dụng tạm thời chưa mở" thì biến `TABLET_ACCESS_CODE` chưa đặt trên Hostinger. |
| Dòng "Bảng tính" báo "Chưa kết nối" | Chưa nhập địa chỉ ở trang Cài đặt máy này. |
| Báo "Chưa ghi được vào bảng tính" | Mất mạng, sai địa chỉ, sai mã bí mật, hoặc Apps Script chưa chọn "Bất kỳ ai". Đơn vẫn giữ trên tablet; sửa xong vào trang Cài đặt máy này bấm **Gửi ngay**. |
| Chữ quá nhỏ hoặc quá to | Mở trang Cài đặt máy này, xem **Kích thước màn hình** và chụp gửi mình; hoặc chỉnh **Kích thước hiển thị** của Android. |
| Cần xóa hết dữ liệu trên máy | Cài đặt Android → Ứng dụng → **MQ Tư vấn** (hoặc Chrome) → Bộ nhớ → **Xóa dữ liệu**. Việc này cũng xóa địa chỉ bảng tính và các đơn chưa gửi. |

## Dành cho người đưa bản mới lên website

```bash
cd tablet-demo
npm run build:site
```

Lệnh này build ứng dụng vào thư mục `tablet-app/` của website (bản trên website luôn có `config.json` rỗng, không chứa địa chỉ hay mã bí mật). Sau đó commit thư mục `tablet-app/` và push; Hostinger tự triển khai. Thư mục này là sản phẩm build nên đừng sửa tay. Không đặt nó trong `public/`: Hostinger phát các tệp trong `public/` thẳng cho mọi người, bỏ qua mã truy cập.

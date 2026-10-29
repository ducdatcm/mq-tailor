# Kết nối đơn hàng với Google Sheets (từng bước)

Mỗi khi nhân viên bấm **Xác nhận đơn**, ứng dụng gửi một dòng vào bảng tính Google của tiệm: Ngày, Order ID, Tên khách, Số điện thoại, Sản phẩm, Lần xác nhận, và mỗi lựa chọn thiết kế một cột (Kiểu cài áo, Kiểu ve...). Không cần máy chủ riêng, chỉ cần một tài khoản Google.

**Lưu ý trước khi bắt đầu**
- Cần mạng khi gửi. Nếu mất mạng, đơn được giữ trên tablet và tự gửi lại khi có mạng (nút **Gửi lại** trên màn hình đã xác nhận cũng gửi ngay).
- Đây là bảng tính chứa tên và số điện thoại khách. Chỉ chia sẻ cho người cần xem.
- Mình chưa thử đoạn mã này trên tài khoản Google của bạn. Làm xong bước 5 và thử một đơn mẫu trước khi dùng thật.

## 1. Tạo bảng tính

1. Vào [sheets.google.com](https://sheets.google.com), tạo một bảng tính trống, đặt tên ví dụ "Đơn hàng Minh Quang".
2. Không cần tạo cột. Lần đầu có đơn, trang tính **Đơn hàng** và các cột tự được tạo.

## 2. Dán mã

1. Trong bảng tính, chọn menu **Tiện ích mở rộng** (Extensions) → **Apps Script**.
2. Xóa đoạn mã mẫu có sẵn.
3. Mở tệp `docs/google-sheets/Code.gs` trong thư mục dự án, chép **toàn bộ** nội dung và dán vào.
4. Bấm biểu tượng đĩa (hoặc `Ctrl + S`) để lưu.

## 3. (Khuyến nghị) Đặt mã bí mật

Mã này ngăn người khác tình cờ gửi dữ liệu vào bảng tính nếu họ biết địa chỉ.

1. Ở thanh bên trái của Apps Script bấm biểu tượng bánh răng **Cài đặt dự án** (Project Settings).
2. Kéo xuống **Thuộc tính tập lệnh** (Script properties) → **Thêm thuộc tính tập lệnh**.
3. Tên: `SECRET`. Giá trị: một chuỗi dài bất kỳ (ví dụ 20 ký tự). Lưu lại.
4. Ghi lại chuỗi này, bạn sẽ dán nó vào bước 5.

## 4. Triển khai thành ứng dụng web

1. Góc trên bên phải bấm **Triển khai** (Deploy) → **Triển khai mới** (New deployment).
2. Bấm biểu tượng bánh răng cạnh "Chọn loại" → **Ứng dụng web** (Web app).
3. Điền:
   - **Thực thi với tư cách** (Execute as): **Tôi** (Me).
   - **Người có quyền truy cập** (Who has access): **Bất kỳ ai** (Anyone).
4. Bấm **Triển khai**. Google sẽ hỏi cấp quyền: chọn tài khoản của bạn → nếu thấy cảnh báo "Google hasn't verified this app" thì bấm **Nâng cao** → **Đi tới (tên dự án)** → **Cho phép**. Đây là mã của chính bạn.
5. Sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
6. Dán URL đó vào trình duyệt: thấy dòng "OK - Minh Quang order sheet is running." là đúng.

## 5. Nối với ứng dụng trên tablet

1. Mở tệp `config.json` đặt cạnh `index.html` trên nơi đặt ứng dụng (trong thư mục dự án là `public/config.json`; sau khi build là `dist/config.json`).
2. Điền:

```json
{
  "orderSheetUrl": "https://script.google.com/macros/s/XXXX/exec",
  "orderSheetToken": "chuỗi SECRET ở bước 3 (bỏ trống nếu không đặt)"
}
```

3. Lưu. Không cần build lại: tablet đọc tệp này mỗi lần mở ứng dụng (tải lại trang để áp dụng).
4. Lưu ý: tệp `config.json` nằm công khai cùng ứng dụng, nên mã bí mật chỉ chặn việc gửi nhầm, không phải khóa bảo mật mạnh. Nếu địa chỉ bị lộ, hãy triển khai lại một phiên bản mới (bước 4) và đổi địa chỉ.

## 6. Thử một đơn

1. Trên tablet: chọn một sản phẩm → **Bắt đầu từ gợi ý nhà may** → **Xem lại thiết kế** → **Xác nhận thiết kế** → điền Order ID `THU-001`, tên, số điện thoại → **Xác nhận đơn**.
2. Ở màn hình đã xác nhận, dòng **Bảng tính** phải báo "Đã ghi đơn vào bảng tính".
3. Mở bảng tính: trang **Đơn hàng** có một dòng mới. Số điện thoại giữ nguyên số 0 đầu.
4. Xóa dòng thử trước khi dùng thật.

## Khi có sự cố

| Thấy gì | Nguyên nhân thường gặp |
|---|---|
| "Chưa kết nối bảng tính" | `orderSheetUrl` trong `config.json` còn trống, hoặc tablet chưa tải lại trang. |
| "Chưa ghi được vào bảng tính (có thể mất mạng)" | Mất mạng; sai địa chỉ; `orderSheetToken` không trùng `SECRET`; hoặc quyền truy cập chưa chọn "Bất kỳ ai". Đơn vẫn được giữ trên tablet, bấm **Gửi lại** sau khi sửa. |
| Cột mới "Tay áo", "Kiểu khuy tay", "Loại khuy", "Khuyết Milan" | Tự thêm vào bảng tính ở đơn đầu tiên có các lựa chọn này; các dòng cũ để trống ở những cột đó. |
| Suit ba mảnh hai quần: cột "Quần 2 · …" | Quần thứ hai có cột riêng, tên bắt đầu bằng "Quần 2 · ". Cột của quần thứ nhất giữ tên như suit hai mảnh. |
| Có dòng nhưng thiếu cột thiết kế | Cột tự thêm theo tên nhóm. Nếu bạn đổi tên cột đã có, mã sẽ tạo cột mới. Đừng đổi tên các cột tiêu đề. |
| Sửa mã Apps Script mà không thấy đổi | Phải triển khai lại: **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới**. |

## Ghi chú kỹ thuật

- Cột được ghép theo **tên tiêu đề**, nên bạn có thể thêm cột của riêng mình ở bên phải (ví dụ "Ghi chú"). Mã chỉ điền các cột nó biết.
- Mỗi lần xác nhận đơn có một mã gửi riêng (cột "Mã gửi"). Nếu một đơn đến hai lần (mạng chập chờn), bảng tính chỉ lưu một dòng.
- Khi khách đổi thiết kế rồi xác nhận lại, một dòng mới được thêm với "Lần xác nhận" tăng lên. Các dòng cũ không bị sửa.
- Cột Ngày là ngày giờ thật (sắp xếp và lọc được), lấy từ đồng hồ tablet và hiển thị theo múi giờ Việt Nam.
- Để thử không cần Google: `node scripts/mock-sheet-server.mjs` chạy một máy chủ giả trên `http://localhost:8787` với cùng giao thức.

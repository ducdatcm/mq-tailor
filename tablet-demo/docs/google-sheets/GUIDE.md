# Kết nối đơn hàng với Google Sheets (từng bước)

Mỗi khi nhân viên bấm **Xác nhận đơn**, ứng dụng gửi đơn vào bảng tính Google của tiệm, **mỗi loại món một dòng**. Các cột, từ trái sang phải:

**Ngày › Order ID › Tên khách › Số điện thoại › Sản phẩm › Số lượng**, rồi mỗi lựa chọn thiết kế một cột (Kiểu cài áo, Kiểu ve, Xếp ly trước, Kiểu cổ áo...), và cuối cùng hai cột kỹ thuật **Lần xác nhận** và **Mã gửi**. Cột "Sản phẩm" ghi loại món: Áo, Quần, Gile hoặc Sơ mi.

Một đơn có thể gồm nhiều sản phẩm, mỗi sản phẩm một số lượng riêng. Ví dụ đơn A gồm 1 suit hai mảnh và 2 quần tây (ba quần tất cả):
- cả ba quần chọn giống nhau: 2 dòng — *Áo, SL 1* và *Quần, SL 3*;
- quần 2 và 3 giống nhau, quần 1 khác: 3 dòng — *Áo, SL 1*, *Quần, SL 1* (kiểu quần 1) và *Quần, SL 2* (kiểu quần 2 và 3);
- cả ba khác nhau: 4 dòng, mỗi quần một dòng *SL 1*.

Phần nguyên phụ liệu (loại khuy, khuyết Milan) áp dụng cho cả đơn nên có ở mọi dòng. Không cần máy chủ riêng, chỉ cần một tài khoản Google.

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

## Cập nhật mã khi ứng dụng có bản mới (đã làm bước 1–6 trước đây)

Bản ứng dụng có **nhiều sản phẩm trong một đơn và bảng mẫu mới** cần mã Apps Script mới (`Code.gs`). Nếu vẫn dùng mã cũ, các đơn mới sẽ thiếu cột thiết kế hoặc không tách dòng theo món. Làm như sau, chỉ mất vài phút và địa chỉ ứng dụng web không đổi:

1. Mở bảng tính → **Tiện ích mở rộng → Apps Script**.
2. Xóa toàn bộ mã cũ trong tệp `Code.gs`, dán toàn bộ nội dung tệp `docs/google-sheets/Code.gs` mới. Bấm **Lưu**.
3. **Triển khai → Quản lý triển khai → biểu tượng bút chì → Phiên bản: Phiên bản mới → Triển khai.**
4. Trên mỗi tablet: trang **Cài đặt máy này** (chạm 5 lần vào logo) → **Kiểm tra kết nối**. Phải thấy chữ "OK v3". Nếu báo "Apps Script là bản cũ" thì bước 3 chưa xong.
5. **Để có đúng bảng mẫu** (Ngày, Order ID, Tên khách, Số điện thoại, Sản phẩm, Số lượng, ...): đổi tên trang **Đơn hàng** cũ (ví dụ "Đơn hàng cũ", hoặc xóa nếu chỉ là đơn thử). Đơn tiếp theo sẽ tự tạo trang **Đơn hàng** mới với cột đúng thứ tự. Nếu giữ trang cũ, mã chỉ thêm các cột còn thiếu (Sản phẩm, Số lượng) vào bên phải, không đổi thứ tự cột cũ.

Làm bước 1–3 **trước** khi đưa bản ứng dụng mới lên tablet: mã mới vẫn nhận được đơn của bản ứng dụng cũ.

## Khi có sự cố

| Thấy gì | Nguyên nhân thường gặp |
|---|---|
| "Chưa kết nối bảng tính" | `orderSheetUrl` trong `config.json` còn trống, hoặc tablet chưa tải lại trang. |
| "Chưa ghi được vào bảng tính (có thể mất mạng)" | Mất mạng; sai địa chỉ; `orderSheetToken` không trùng `SECRET`; hoặc quyền truy cập chưa chọn "Bất kỳ ai". Đơn vẫn được giữ trên tablet, bấm **Gửi lại** sau khi sửa. |
| Đơn không tách dòng, hoặc thiếu cột thiết kế | Apps Script còn là mã cũ. Làm mục "Cập nhật mã" ở trên. |
| Cột mới "Tay áo", "Kiểu khuy tay", "Loại khuy", "Khuyết Milan" | Tự thêm vào bảng tính ở đơn đầu tiên có các lựa chọn này; các dòng cũ để trống ở những cột đó. |
| Nhiều quần trong một đơn | Các quần chọn giống nhau gộp thành một dòng "Quần" với số lượng cộng lại; quần chọn khác nhau là các dòng riêng, mỗi dòng có kiểu riêng. |
| Có dòng nhưng thiếu cột thiết kế | Cột tự thêm theo tên nhóm. Nếu bạn đổi tên cột đã có, mã sẽ tạo cột mới. Đừng đổi tên các cột tiêu đề. |
| Sửa mã Apps Script mà không thấy đổi | Phải triển khai lại: **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới**. |

## Ghi chú kỹ thuật

- Cột được ghép theo **tên tiêu đề**, nên bạn có thể thêm cột của riêng mình ở bên phải (ví dụ "Ghi chú"). Mã chỉ điền các cột nó biết.
- Mỗi lần xác nhận đơn có một mã gửi riêng (cột "Mã gửi"). Nếu một đơn đến hai lần (mạng chập chờn), bảng tính chỉ lưu một dòng.
- Khi khách đổi thiết kế rồi xác nhận lại, các dòng mới được thêm với "Lần xác nhận" tăng lên. Các dòng cũ không bị sửa.
- Một đơn có nhiều dòng được ghi cùng lúc, cùng một "Mã gửi". Đơn đến hai lần thì không dòng nào bị ghi lại.
- Đơn đã lưu trên tablet từ bản trước (chưa gửi được) vẫn gửi được: mã mới ghi nó thành một dòng như trước.
- Cột Ngày là ngày giờ thật (sắp xếp và lọc được), lấy từ đồng hồ tablet và hiển thị theo múi giờ Việt Nam.
- Để thử không cần Google: `node scripts/mock-sheet-server.mjs` chạy một máy chủ giả trên `http://localhost:8787` với cùng giao thức.

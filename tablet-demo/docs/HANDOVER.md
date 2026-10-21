# Bàn giao — Demo tư vấn thiết kế Minh Quang

Ngày: 21/10/2026 · Phiên bản demo 1.0 · Cách chạy: xem [`../README.md`](../README.md).

Tài liệu này tách rõ hai nhóm việc: **(A) kết quả kiểm tra phần mềm** và **(B) nội dung mẫu chờ nhà may duyệt**. Một thuật ngữ hay một hình chưa đúng ý nhà may không phải lỗi phần mềm, và ngược lại.

---

## A. Kết quả kiểm tra phần mềm

Hai lớp kiểm tra, đều chạy lại được:

- `npm test` — 38 test hành vi (quy tắc chọn, reducer, hành trình người dùng bằng Testing Library). **38/38 đạt.**
- `npm run verify` — Chrome thật điều khiển bằng Playwright, 3 kích thước × cả 3 sản phẩm (hành trình đầy đủ từ chọn sản phẩm đến xác nhận), kiểm tra layout trên mọi màn hình, một lượt chỉ dùng bàn phím, ghi lỗi console. **54/54 đạt**, cả trên bản dev và bản `npm run build`. Chi tiết: `docs/verification-results.json`.

| ID | Kết quả | Bằng chứng |
| --- | --- | --- |
| A1 Suit hai mảnh | Đạt | test "A1": áo và quần cấu hình độc lập, chuyển qua lại không mất lựa chọn |
| A2 Blazer / quần riêng | Đạt | test "A2": blazer 6 nhóm áo, quần riêng 5 nhóm quần, không có nhóm của món kia |
| A3 Chọn trong cùng nhóm | Đạt | test "A3": một giá trị được chọn, tóm tắt cập nhật; mỗi lựa chọn có hình riêng (xem sketch bên dưới) |
| A4 Tiến / lùi / đổi áo–quần | Đạt | test "A4" và test reducer về `lastGroup` |
| A5 Bỏ thiếu một nhóm | Đạt | test "A5": báo "Còn thiếu N nhóm", liệt kê tên, nút xác nhận bị khóa, bấm tên nhóm mở đúng nhóm |
| A6 Preset rồi sửa một chi tiết | Đạt | test "A6": chỉ chi tiết sửa đổi; gợi ý "Nhờ nhà may gợi ý" không tự chọn gì cho đến khi bấm Áp dụng |
| A7 Một hàng/notch → 6×2 | Đạt | test "A7": hộp thoại giải thích đổi ve; Đồng ý cập nhật cả hai, Hủy giữ nguyên cả hai (kiểm cả ở tầng reducer); notch bị vô hiệu kèm lý do khi đang 6×2; về một hàng khuy vẫn giữ ve nhọn |
| A8 VI/EN giữa luồng | Đạt | test "A8": dịch đủ chữ trên màn hình, `<html lang>` đổi theo, giữ lựa chọn; kiểm tra kiểu của `vi.ts`/`en.ts` buộc hai ngôn ngữ đủ mục |
| A9 Sửa từ màn hình xem lại | Đạt | test "A9": mở đúng nhóm, nút "Xong, về xem lại", bản tóm tắt đúng |
| A10 Bấm xác nhận nhiều lần | Đạt | test "A10": ba lần bấm trong cùng một lượt chỉ ra một bản xác nhận (cũng kiểm ở reducer); không có chữ "Google Sheet", "đã gửi", "đơn hàng thật" |
| A11 Sửa bản đã xác nhận | Đạt | test "A11": bản cũ giữ nguyên đến khi xác nhận lại, sau đó hiện lần 2, chỉ chi tiết đổi được đánh dấu và liệt kê "Thay đổi so với lần 1"; không cho xác nhận lại khi chưa có thay đổi |
| A12 Phiên mới | Đạt | test "A12": hỏi xác nhận khi có dữ liệu, giữ phiên nếu bấm Giữ, sạch dữ liệu sau khi xóa; reset thẳng khi không có gì để mất |
| A13 Kích thước tablet | Đạt | `verify`: 1024×768, 1280×800 ngang và 768×1024 dọc — không tràn ngang, mọi nút ≥ 44×44 px, footer cố định không che nội dung cuối trang, ở các màn hình bắt đầu / chọn (cả khi mở "Tìm hiểu thêm") / xem lại / đã xác nhận, cả tiếng Việt và English |
| A14 Chỉ dùng bàn phím | Đạt | `verify` + test: đi từ màn hình đầu đến xác nhận chỉ bằng Tab/Enter/Space; vòng focus nhìn thấy ở mọi điểm dừng; hộp thoại giữ focus bên trong, Esc đóng và trả focus về nút đã mở; khi đổi màn hình focus chuyển về tiêu đề màn hình mới |

Chạy trọn một lượt cho cả ba sản phẩm: có trong `verify` (suit từ gợi ý nhà may, blazer và quần riêng chọn tay). Kịch bản demo mục 12 của brief (suit từ gợi ý, đổi ve, sửa gấu quần ở màn hình xem lại, xác nhận, sửa lại một chi tiết và xác nhận lần hai, phiên mới với blazer tự chọn) được các test A6, A7, A9, A11, A12 phủ.

**Kiểm tra bằng mắt tất cả sketch:** đã xem toàn bộ 26 hình lựa chọn và 3 hình sản phẩm trên trang `#/sketches` ở cuối quá trình (sau các lần chỉnh), cùng ảnh chụp màn hình bên dưới.

### Ảnh chụp màn hình

`docs/screenshots/<kích thước>__<tên>.png`, tạo bởi `npm run verify`. Mỗi kích thước (`tablet-1024x768`, `tablet-1280x800`, `portrait-768x1024`) có:

| Tệp | Nội dung |
| --- | --- |
| `01-start` | Bắt đầu tư vấn |
| `02-configure-closure` | Chọn chi tiết, nhóm kiểu cài áo (suit từ gợi ý) |
| `03-configure-trousers` | Phần quần của suit |
| `04-learn-more` | "Tìm hiểu thêm" mở ra (câu hỏi gợi ý và giải thích) |
| `05-summary` | Tóm tắt lựa chọn (thu gọn/mở tùy kích thước) |
| `06-review-suit/blazer/trousers` | Xem lại thiết kế cho từng sản phẩm |
| `07-confirmed-suit/blazer/trousers` | Đã xác nhận thiết kế mẫu |
| `08-confirmed-revision-2` | Lần xác nhận 2, chỉ chi tiết đã sửa được đánh dấu |
| `09-confirmed-english` | Cùng màn hình ở English |

### Giới hạn còn lại của phần mềm

- **Chưa thử trên máy tablet thật** (iPad Safari, Android Chrome). Đã thử bằng Chrome giả lập đúng kích thước viewport và cảm ứng; nên thử một lượt trên thiết bị cửa hàng trước khi dùng với khách.
- Trạng thái chỉ lưu trong `sessionStorage` của tab: tải lại trang vẫn giữ, đóng tab thì mất. Đây là tiện ích, không phải yêu cầu.
- Thời điểm xác nhận lấy theo đồng hồ của thiết bị; "DEMO-001" là nhãn cố định của mô phỏng, không tăng theo phiên.
- Vùng chạm hình phóng to chỉ dùng nút "Phóng to" (không có pinch-zoom, theo brief).
- Các hình là sketch minh họa viết tay bằng SVG, không đo theo tỷ lệ thật. Hình ve của áo hai hàng 6×2 vẽ phần ve phía trên bằng phép nghiêng của hình ve nhọn nên đường ve hơi khác so với áo may thật.
- Chưa có dark mode, chưa có chế độ kiosk tự quay về màn hình đầu sau một thời gian không dùng (không nằm trong brief).
- `npm run verify` cần Chrome hoặc Edge cài trên máy; không tải trình duyệt riêng.

---

## B. Chờ nhà may / thợ chính duyệt

Tất cả mục dưới đây là nội dung mẫu và quy tắc mẫu, **chưa phải danh mục thương mại hay tiêu chuẩn sản xuất** của Minh Quang. Sửa chữ ở `src/content/vi.ts`, `src/content/en.ts`; sửa lựa chọn và preset ở `src/catalog/catalog.ts`; sửa hình ở `src/sketches/`.

### B1. Thuật ngữ và tên gọi

Cần xác nhận cách gọi của tiệm (VI và EN), nhất là các từ sau:

- Sản phẩm: **Suit hai mảnh**, **Blazer**, **Quần tây**.
- Áo: **Kiểu cài áo** (Một hàng 1 khuy / Một hàng 2 khuy / Hai hàng 6×2), **Ve notch** / **Ve nhọn**, **Dáng vai** (Vai tự nhiên đệm nhẹ / Vai cấu trúc rõ), **Túi ngoài** (Túi có nắp / Túi viền không nắp / Túi đắp), **Xẻ sau** (Hai xẻ / Một xẻ), **Lót áo** (Lót toàn bộ / Lót một phần / Không lót).
- Quần: **Xếp ly trước** (Không ly / Một ly mỗi bên / Hai ly mỗi bên), **Chi tiết cạp quần** (Đỉa thắt lưng / Tăng đơ hai bên), **Túi trước** (Túi chéo / Túi dọc), **Túi sau** (Một túi bên phải / Hai túi), **Gấu quần** (Gấu thường / Gấu lơ vê).
- Nhãn tiếng Anh phụ trong bản tiếng Việt (ví dụ "Single-breasted, 2 buttons", "Side adjusters", "Turn-up") và cách dịch sang English.
- Cách xưng hô trong câu hỏi gợi ý cho sale ("Anh/chị …").

### B2. Nội dung tư vấn (bản nháp trung tính)

Mỗi nhóm có: một câu giải thích khác biệt, một câu hỏi gợi ý cho sale, phần "Giải thích thêm", và một câu lý do cho gợi ý mẫu. Cần nhà may đọc và chỉnh. Đặc biệt:

- **Dáng vai:** mô tả vai tự nhiên / cấu trúc có đúng nghề không; câu "định hướng thiết kế, thợ may đánh giá khi đo".
- **Lót áo:** chỉ chọn phạm vi lót; đã ghi rõ không nói về lớp dựng (canvas). Cần xác nhận mô tả "lót một phần" khớp với cách tiệm làm (hình vẽ lót phần trên lưng và tay).
- **Xếp ly / đường là**, **tăng đơ**, **túi chéo / túi dọc** và các câu "thường đi cùng …".
- Các câu "Mẫu của nhà may chọn …" trong cửa sổ gợi ý: nên là nhận định của tiệm, hiện đang rất trung tính.

### B3. Hình minh họa

- Toàn bộ 26 hình lựa chọn và 3 hình sản phẩm: xem ở `http://localhost:5173/#/sketches`. Cần thợ chính nhìn từng hình, xem tỷ lệ và chi tiết có đúng với cách tiệm may không.
- Cần chú ý hơn: ve notch và ve nhọn (độ nhọn, vị trí khấc), hình hai hàng 6×2 (vị trí khuy và ve phía trên), vai (độ dốc và độ dày đệm), túi đắp (kích thước và dạng góc), sơ đồ lót (vùng "một phần"), hai kiểu ly (vị trí ly so với đường là), tăng đơ (hình dáng miếng chỉnh), gấu lơ vê (độ cao lơ vê).
- Hình vai và lót đã có chú thích "minh họa" dưới thẻ.

### B4. Quy tắc mẫu

- Cấu hình **gợi ý cơ bản** hiện tại: áo một hàng 2 khuy, ve notch, vai tự nhiên đệm nhẹ, túi có nắp, hai xẻ, lót toàn bộ; quần không ly, đỉa thắt lưng, túi chéo, hai túi sau, gấu thường (đúng theo brief). Xác nhận đây có phải thứ tiệm muốn đưa ra làm điểm khởi đầu.
- **Hai hàng 6×2 chỉ đi với ve nhọn** (quy tắc phạm vi mẫu, không phải khẳng định kết hợp khác không may được). Đổi từ notch sang 6×2 hiện hỏi khách đồng ý đổi ve; ở nhóm ve, notch hiện mờ kèm lý do khi đang chọn 6×2.
- Không có quy tắc "hợp / không hợp" theo tuổi, cân nặng hay dáng người (đúng yêu cầu).

### B5. Quan sát khi thử với sale và khách (theo brief mục 12)

Chưa chạy buổi thử có người thật. Khi thử, nên quan sát: khách có hiểu khác biệt từ hình và câu giải thích không; sale còn phải tự giải thích thêm gì; có tìm được chỗ sửa không; bản xem lại có đúng điều hai bên vừa thống nhất không.

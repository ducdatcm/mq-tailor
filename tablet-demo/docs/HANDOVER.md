# Bàn giao — Demo tư vấn thiết kế Minh Quang

Ngày: 21/10/2026 · Phiên bản demo 1.0 · Cách chạy: xem [`../README.md`](../README.md).

Tài liệu này tách rõ hai nhóm việc: **(A) kết quả kiểm tra phần mềm** và **(B) nội dung mẫu chờ nhà may duyệt**. Một thuật ngữ hay một hình chưa đúng ý nhà may không phải lỗi phần mềm, và ngược lại.

---

## A. Kết quả kiểm tra phần mềm

Hai lớp kiểm tra, đều chạy lại được:

- `npm test` — 92 test (quy tắc chọn, reducer, hành trình người dùng bằng Testing Library, kiểm tra đơn hàng, dòng gửi bảng tính, tệp PDF, suit ba mảnh, gile, tay áo và nguyên phụ liệu). **92/92 đạt.**
- `npm run verify` — Chrome thật điều khiển bằng Playwright, 3 kích thước × cả 6 sản phẩm (hành trình đầy đủ từ chọn sản phẩm, xác nhận thiết kế, điền và xác nhận đơn, đến xuất PDF), kiểm tra layout trên mọi màn hình kể cả màn hình đơn hàng, một lượt chỉ dùng bàn phím (kể cả gõ thông tin đơn), kiểm tra dòng đơn đến được máy chủ bảng tính giả, ghi lỗi console. **159/159 đạt.** Chi tiết: `docs/verification-results.json`.

| ID | Kết quả | Bằng chứng |
| --- | --- | --- |
| A1 Suit hai mảnh | Đạt | test "A1": áo và quần cấu hình độc lập, chuyển qua lại không mất lựa chọn |
| A2 Blazer / quần riêng | Đạt | test "A2": blazer 6 nhóm áo, quần riêng 5 nhóm quần, không có nhóm của món kia |
| A3 Chọn trong cùng nhóm | Đạt | test "A3": một giá trị được chọn, tóm tắt cập nhật; mỗi lựa chọn có hình riêng (xem sketch bên dưới) |
| A4 Tiến / lùi / đổi áo–quần | Đạt | test "A4" và test reducer về `lastGroup` |
| A5 Bỏ thiếu một nhóm | Đạt | test "A5": báo "Còn thiếu N nhóm", liệt kê tên, nút xác nhận bị khóa, bấm tên nhóm mở đúng nhóm |
| A6 Preset rồi sửa một chi tiết | Đạt | test "A6": chỉ chi tiết sửa đổi; gợi ý "Nhờ nhà may gợi ý" không tự chọn gì cho đến khi bấm Áp dụng |
| A7 Một hàng/notch → hai hàng khuy | Đạt | test "A7" và test quy tắc: với **cả bốn** kiểu hai hàng (6×2, 6×1, 4×2, 4×1), hộp thoại giải thích đổi ve (từ notch hoặc ve sam sang ve nhọn); Đồng ý cập nhật cả hai, Hủy giữ nguyên cả hai; notch và ve sam bị vô hiệu kèm lý do khi đang hai hàng khuy; về một hàng khuy vẫn giữ ve nhọn |
| A8 VI/EN giữa luồng | Đạt | test "A8": dịch đủ chữ trên màn hình, `<html lang>` đổi theo, giữ lựa chọn; kiểm tra kiểu của `vi.ts`/`en.ts` buộc hai ngôn ngữ đủ mục |
| A9 Sửa từ màn hình xem lại | Đạt | test "A9": mở đúng nhóm, nút "Xong, về xem lại", bản tóm tắt đúng |
| A10 Bấm xác nhận nhiều lần | Đạt | test "A10": ba lần bấm trong cùng một lượt chỉ ra một bản xác nhận thiết kế (cũng kiểm ở reducer); sau đó đến màn hình đơn hàng, xác nhận đơn cũng chỉ một lần. |
| A11 Sửa bản đã xác nhận | Đạt | test "A11": bản cũ giữ nguyên đến khi xác nhận lại, sau đó hiện lần 2, chỉ chi tiết đổi được đánh dấu và liệt kê "Thay đổi so với lần 1"; không cho xác nhận lại khi chưa có thay đổi |
| A12 Phiên mới | Đạt | test "A12": hỏi xác nhận khi có dữ liệu, giữ phiên nếu bấm Giữ, sạch dữ liệu sau khi xóa; reset thẳng khi không có gì để mất |
| A13 Kích thước tablet | Đạt | `verify`: 1024×768, 1280×800 ngang và 768×1024 dọc — không tràn ngang, mọi nút ≥ 44×44 px, footer cố định không che nội dung cuối trang, ở các màn hình bắt đầu / chọn (cả khi mở "Tìm hiểu thêm") / xem lại / đã xác nhận, cả tiếng Việt và English |
| A14 Chỉ dùng bàn phím | Đạt | `verify` + test: đi từ màn hình đầu đến xác nhận chỉ bằng Tab/Enter/Space; vòng focus nhìn thấy ở mọi điểm dừng; hộp thoại giữ focus bên trong, Esc đóng và trả focus về nút đã mở; khi đổi màn hình focus chuyển về tiêu đề màn hình mới |

Chạy trọn một lượt cho cả ba sản phẩm: có trong `verify` (suit từ gợi ý nhà may, blazer và quần riêng chọn tay). Kịch bản demo mục 12 của brief (suit từ gợi ý, đổi ve, sửa gấu quần ở màn hình xem lại, xác nhận, sửa lại một chi tiết và xác nhận lần hai, phiên mới với blazer tự chọn) được các test A6, A7, A9, A11, A12 phủ.

**Kiểm tra bằng mắt tất cả sketch:** đã xem toàn bộ 32 hình lựa chọn và 3 hình sản phẩm trên trang `#/sketches` sau khi chuyển sang dùng hình gốc của nhà may, cùng ảnh chụp màn hình bên dưới.

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
- Thời điểm xác nhận và "Ngày" trên phiếu và bảng tính lấy theo đồng hồ của thiết bị. Order ID do nhân viên nhập (không còn nhãn "DEMO-001").
- Vùng chạm hình phóng to chỉ dùng nút "Phóng to" (không có pinch-zoom, theo brief).
- Hình áo là bản vẽ gốc của nhà may đã chuyển sang vector (tự động), nên có thể lệch nét rất nhỏ so với ảnh gốc. Các hình chưa có bản gốc được sửa từ hình gần nhất nên có thể lệch nhẹ so với áo thật; các hình còn do mã vẽ (xẻ sau, túi trước, gấu quần) hơi khác kiểu với phần còn lại.
- Chưa có dark mode, chưa có chế độ kiosk tự quay về màn hình đầu sau một thời gian không dùng (không nằm trong brief).
- `npm run verify` cần Chrome hoặc Edge cài trên máy; không tải trình duyệt riêng.

---

## B. Chờ nhà may / thợ chính duyệt

Tất cả mục dưới đây là nội dung mẫu và quy tắc mẫu, **chưa phải danh mục thương mại hay tiêu chuẩn sản xuất** của Minh Quang. Sửa chữ ở `src/content/vi.ts`, `src/content/en.ts`; sửa lựa chọn và preset ở `src/catalog/catalog.ts`; sửa hình ở `src/sketches/`.

### B1. Thuật ngữ và tên gọi

Cần xác nhận cách gọi của tiệm (VI và EN), nhất là các từ sau:

- Sản phẩm: **Suit hai mảnh**, **Suit ba mảnh (1 áo + 2 quần)**, **Suit ba mảnh (1 áo + 1 quần + 1 gile)**, **Blazer**, **Quần tây**, **Gile**. (Tên "Suit ba mảnh (1 áo + 1 quần + 1 gile)" do mình suy từ yêu cầu; cần xác nhận.)
- Gile: **Kiểu gile** (Một hàng, 2 túi / Một hàng, 4 túi / Hai hàng, 2 túi / Hai hàng, 4 túi), nút **Giống quần đã chọn** cho quần 2, và câu giải thích, câu hỏi gợi ý cho sale của nhóm gile.
- Áo: **Kiểu cài áo** (Một hàng 1 / 2 / 3 khuy; Hai hàng 6×2 / 6×1 / 4×2 / 4×1), **Ve notch** / **Ve nhọn** / **Ve sam**, **Dáng vai** (Vai cuộn / Vai tự nhiên đệm nhẹ / Vai sơ-mi), **Túi ngoài** (Túi nắp xéo / Túi viền xéo / Túi ốp / Túi nắp thẳng / Túi viền thẳng), **Túi ngực** (Túi ngực thẳng / Túi ngực barchetta / Túi ốp), **Xẻ sau** (Không xẻ / Một xẻ / Hai xẻ), **Lót áo** (Lót toàn bộ / Lót nửa áo / Lót một phần tư / Không lót).
- Quần: **Xếp ly trước** (Không ly / Một ly / Hai ly), **Chi tiết cạp quần** (Đỉa thắt lưng / Khóa sườn), **Túi trước** (Túi chéo / Túi dọc), **Túi sau** (Một túi bên phải / Hai túi), **Gấu quần** (Gấu thường / Gấu lơ vê).
- Nhãn tiếng Anh phụ trong bản tiếng Việt (ví dụ "Single-breasted, 2 buttons", "Side adjusters", "Turn-up") và cách dịch sang English.
- Cách xưng hô trong câu hỏi gợi ý cho sale ("Anh/chị …").

### B2. Nội dung tư vấn (bản nháp trung tính)

Mỗi nhóm có: một câu giải thích khác biệt, một câu hỏi gợi ý cho sale, phần "Giải thích thêm", và một câu lý do cho gợi ý mẫu. Cần nhà may đọc và chỉnh. Đặc biệt:

- **Dáng vai:** mô tả vai cuộn / vai tự nhiên đệm nhẹ / vai sơ-mi có đúng nghề không (vai cuộn dùng hình đường cuộn tròn, vai sơ-mi dùng hình đầu tay nhún nhẹ); câu "định hướng thiết kế, thợ may đánh giá khi đo".
- **Lót áo:** chỉ chọn phạm vi lót; đã ghi rõ không nói về lớp dựng (canvas). Cần xác nhận cách gọi và phạm vi của "lót nửa áo" (lót phần trên lưng và hai thân trước) và "lót một phần tư" (chỉ lót phần trên lưng) khớp với cách tiệm làm.
- **Xếp ly / đường là**, **khóa sườn**, **túi ngực thẳng / barchetta**, **túi chéo / túi dọc** và các câu "thường đi cùng …".
- Các câu "Mẫu của nhà may chọn …" trong cửa sổ gợi ý: nên là nhận định của tiệm, hiện đang rất trung tính.

### B3. Hình minh họa

- Toàn bộ hình xem ở `http://localhost:5173/#/sketches`.
- **Hình gốc nhà may cung cấp, dùng nguyên trạng:** một hàng 2 khuy, hai hàng 6×2 và 6×1, ve notch, ve nhọn, vai sơ-mi (spalla camicia), vai cuộn (roped), quần không ly / hai ly, đỉa thắt lưng, khóa sườn, hai túi sau.
- **Hình sửa từ hình gốc (thợ chính cần xem lại):** một hàng 1 khuy và 3 khuy (vị trí khuy và đoạn gập ve vẫn theo hình 2 khuy), hai hàng 4×1 và 4×2 (bỏ hàng khuy trên cùng của hình 6 khuy; vị trí các khuy và khuy cài lấy theo hình gốc), túi ngực (3 kiểu theo hình "Chest pockets": nét xám mảnh tô lại thành nét đen, phóng to vào phần túi trong khung tròn) và xẻ sau (3 hình nhà may gửi: không xẻ, một xẻ giữa, hai xẻ bên; nét bút chì mờ tô lại thành nét đen, chỗ xẻ vẽ viền, tay áo có khuy; tô lại thành nét đen trên nền trắng cho giống các hình khác, xóa chữ đỏ, khuy vẽ lại thành vòng tròn, nét khâu đứt của túi ốp giữ nguyên), ve sam (xóa khấc, tai ve và mép ve của hình 2 khuy, vẽ một đường cong liền từ cổ xuống khuy theo hình "Lapel Styles"), vai tự nhiên đệm nhẹ (từ hình vai sơ-mi, xóa đường vai và vẽ lại đầu vai), một ly (từ hình một ly, thêm đường ly nối từ trước lên cạp theo hình nhà may đánh dấu), 4 kiểu lót áo (toàn bộ, nửa áo, một phần tư, không lót: vẽ lại từ hình mẫu "Men's Jacket Lining Types" bạn gửi: xóa màu xanh và logo, vùng lót để trắng, vùng không lót để màu nền, các đường viền mép đường may thành nét đen; hình mẫu gốc là của bên thứ ba nên cần xác nhận được phép dùng trước khi phát hành), một túi sau bên phải (xóa túi trái của hình hai túi).
- **Hình vẽ bằng mã theo cùng hệ nét (chưa phải hình gốc):** 5 kiểu túi ngoài (theo hình "Pockets" của nhà may, vẽ ở `sketches/pockets.tsx`), túi trước chéo và dọc, gấu thường và gấu lơ vê, hình quần ở màn hình đầu. Mọi hình dùng chung độ dày nét (`sketch.css`), vải trắng trên nền be, không màu nhấn, không nét đứt. Nếu nhà may có hình gốc cho các mục này, thay vào là xong (cách làm trong README).
- Hình vai và lót đã có chú thích "minh họa" dưới thẻ.

### B4. Quy tắc mẫu

- Cấu hình **gợi ý cơ bản** hiện tại: áo một hàng 2 khuy, ve notch, vai tự nhiên đệm nhẹ, túi nắp thẳng, túi ngực barchetta, hai xẻ, lót toàn bộ; quần không ly, đỉa thắt lưng, túi chéo, hai túi sau, gấu thường (đúng theo brief). Xác nhận đây có phải thứ tiệm muốn đưa ra làm điểm khởi đầu.
- **Mọi kiểu hai hàng khuy (6×2, 6×1, 4×2, 4×1) chỉ đi với ve nhọn** (quy tắc phạm vi mẫu, không phải khẳng định kết hợp khác không may được). Đổi từ notch hoặc ve sam sang một kiểu hai hàng hiện hỏi khách đồng ý đổi ve; ở nhóm ve, notch và ve sam hiện mờ kèm lý do khi đang chọn hai hàng khuy.
- Không có quy tắc "hợp / không hợp" theo tuổi, cân nặng hay dáng người (đúng yêu cầu).

### B5. Quan sát khi thử với sale và khách (theo brief mục 12)

Chưa chạy buổi thử có người thật. Khi thử, nên quan sát: khách có hiểu khác biệt từ hình và câu giải thích không; sale còn phải tự giải thích thêm gì; có tìm được chỗ sửa không; bản xem lại có đúng điều hai bên vừa thống nhất không.

## Hướng phát triển tiếp theo

- Kết nối ảnh sản phẩm thật của website vào ứng dụng (bản nháp để quyết định): [`docs/PHOTO-INTEGRATION-SPEC.md`](PHOTO-INTEGRATION-SPEC.md).

## Đơn hàng, PDF và Google Sheets (đã làm, cần nhà may duyệt)

- Luồng mới: Xác nhận thiết kế → **Thông tin đơn hàng** (Order ID, tên khách, số điện thoại, ngày tự động) → **Xác nhận đơn** → màn hình đã xác nhận có nút **Xuất PDF phiếu thiết kế** và tự ghi một dòng vào Google Sheets. Hướng dẫn nối bảng tính: `docs/google-sheets/GUIDE.md`; mã nhận dữ liệu: `docs/google-sheets/Code.gs`.
- **Chưa thử trên Google thật.** Mã Apps Script chưa chạy trên tài khoản của tiệm; phía ứng dụng đã được thử với máy chủ giả có cùng giao thức (`scripts/mock-sheet-server.mjs`). Nên gửi một đơn thử trước khi dùng thật.
- **Dữ liệu khách:** tên và số điện thoại được lưu trong phiên của tab (xóa khi Phiên mới), in trên phiếu PDF và gửi vào bảng tính. Khi mất mạng, dòng chưa gửi được giữ trong bộ nhớ của trình duyệt trên tablet cho đến khi gửi được. Cần xác nhận cách tiệm xử lý và lưu thông tin này.
- Nhãn chữ mới cần duyệt: "Thông tin đơn hàng", "Xác nhận đơn", "Xuất PDF phiếu thiết kế", câu cuối phiếu PDF ("Phiếu thiết kế tham khảo ... thống nhất riêng với nhà may").
- Tệp PDF là ảnh một trang A4 (chữ không chọn/sao chép được) để hiển thị giống hệt màn hình trên mọi tablet; tạo trong khoảng 0,2 giây trên máy tính và dưới 1,5 giây khi giả lập CPU chậm gấp 6 lần.
- Khi đổi thiết kế rồi xác nhận lại, đơn phải xác nhận lại và một dòng mới được thêm (cột "Lần xác nhận" tăng); dòng cũ không bị sửa.

## Suit ba mảnh, gile và logo (đã làm, cần nhà may duyệt)

- Hai suit ba mảnh và sản phẩm Gile; gile là một nhóm bốn lựa chọn lấy từ bản vẽ nhà may gửi (vẽ lại cùng kiểu nét trắng–đen–be với các hình áo; nút cài thành vòng tròn, cổ gile để trống). Ảnh gile gốc khá nhỏ nên nét hơi mịn hơn các hình áo; nếu có bản vẽ lớn hơn, thay vào `src/sketches/assets/source/vest-*.png` rồi chạy `node scripts/vectorize.mjs`.
- Suit ba mảnh hai quần: **Giống quần đã chọn** chép (và đồng bộ) kiểu quần 1 sang quần 2. Trong bảng tính, quần 2 có cột riêng, tên dạng "Quần 2 · Xếp ly trước".
- Thanh trên cùng dùng logo Minh Quang Bespoke (bỏ chữ "Nhà may · Hà Nội"); phiếu PDF cũng dùng logo này. Nếu logo chính thức khác, thay ảnh rồi vẽ lại `src/brand/logo.ts`.
- Phiếu PDF của suit ba mảnh tự thu nhỏ để vừa một trang A4 (chữ nhỏ hơn bản hai mảnh khoảng 12%).
- Phiên đang mở trước bản này sẽ bị bỏ khi tải lại (định dạng lưu phiên đã đổi sang v2).

## Tay áo và nguyên phụ liệu (đã làm, cần nhà may duyệt)

- **Tay áo (Cuffs):** 4 lựa chọn 1 / 2 / 3 / 4 khuy, thêm vào nhóm của áo (trước Lót áo). Hình lấy từ bản vẽ nhà may gửi, vẽ lại cùng kiểu nét (áo trắng, nét đen, khuy thành vòng tròn); hình gốc chỉ vẽ cửa tay và khuy khá nhỏ, nên nếu muốn rõ hơn có thể phóng vào phần khuy trong vòng tròn như các hình chi tiết khác.
- **Khuy mở / Khuy đóng** là lựa chọn chung cho cả 4 kiểu, hiện ngay dưới các thẻ tay áo. Thẻ "Khuy mở" ghi rõ chỉ khuyến nghị cho sport jacket / blazer; ứng dụng không chặn chọn Khuy mở cho suit, chỉ ghi chú.
- **Nguyên phụ liệu:** tab riêng ở cuối mọi sản phẩm, gồm Loại khuy (Khuy nhựa (tiêu chuẩn) / Khuy sừng / Khuy xà cừ, kèm ghi chú phụ phí tùy dòng vải) và Khuyết Milan (Có / Không). Chọn một lần cho cả đơn, không có hình.
- Chữ cần duyệt: tên và mô tả các nhóm "Tay áo", "Kiểu khuy tay", "Loại khuy", "Khuyết Milan"; đặc biệt cách giải thích khuyết Milan (mình viết ngắn gọn, thợ chính cần xác nhận) và dòng phụ phí.
- Bản "gợi ý của nhà may" cho các nhóm mới: tay áo 4 khuy, khuy đóng, khuy nhựa, không khuyết Milan (cần xác nhận).
- Bảng tính có thêm các cột "Tay áo", "Kiểu khuy tay", "Loại khuy", "Khuyết Milan". Phiên đang mở trước bản này bị bỏ khi tải lại (định dạng lưu phiên đã đổi sang v3).

## Chạy trên tablet Android (đã làm, chưa thử trên máy thật)

- Ứng dụng được build vào `public/tablet/` của website và phục vụ ở `/tablet/` (route `src/routes/tablet.js`, chính sách bảo mật riêng cho phép gửi đơn tới Google Apps Script, không cho công cụ tìm kiếm lập chỉ mục). Cài lên màn hình chính, chạy toàn màn hình, offline sau lần đầu (service worker). Hướng dẫn: `docs/ANDROID-SETUP.md`.
- Bản trên website luôn có `config.json` rỗng; địa chỉ bảng tính nhập một lần trên từng tablet ở trang `#/setup`.
- **Chưa kiểm tra trên tablet thật.** Đã kiểm tra bằng Chrome ở các kích thước 1920×1080, 1080×1920 và 720×1280; hành vi cài đặt, giữ sáng màn hình và ghim ứng dụng còn tùy máy. Trang `#/setup` hiện kích thước màn hình thật của tablet để chỉnh cỡ chữ nếu cần.
- Ai có địa chỉ `/tablet/` đều mở được ứng dụng (không chứa dữ liệu khách; đơn đi thẳng tới bảng tính Google). Nếu muốn khóa, đặt mật khẩu cho cả website (Basic Auth) hoặc chuyển ứng dụng sang địa chỉ riêng.

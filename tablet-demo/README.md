# Minh Quang — Demo tư vấn thiết kế trên tablet

Prototype frontend chạy trong trình duyệt, dùng tại cửa hàng: sale và khách cùng chọn kiểu bằng sketch 2D, xem lại, sửa và xác nhận một **phiếu thiết kế demo**. Không có backend, không có tài khoản, không có số đo/giá/thanh toán. Brief gốc: `Minh_Quang_Tablet_Demo_Engineer_Brief_VN_EN.md`.

Tiếng Việt mặc định, chuyển sang English bằng nút VI / EN ở góc trên phải (không mất lựa chọn).

## Chạy demo

Cần Node 18+.

```bash
cd tablet-demo
npm install
npm run dev          # http://localhost:5173
```

Bản build tĩnh (để đưa lên tablet hoặc host bất kỳ):

```bash
npm run build        # kiểm tra kiểu + build vào dist/
npm run preview      # xem bản build tại http://localhost:4173
```

`dist/` là site tĩnh, dùng đường dẫn tương đối nên đặt ở thư mục con nào cũng chạy. Mở trên tablet cùng mạng Wi-Fi: `npm run dev -- --host` rồi vào `http://<ip-máy>:5173`. Font và toàn bộ SVG nằm trong dự án, demo không gọi CDN hay website nào khác.

## Bắt đầu lại / xóa dữ liệu

- Nút **Phiên mới** ở góc trên (hoặc **Bắt đầu phiên mới** ở màn hình đã xác nhận): hỏi xác nhận nếu đang có lựa chọn, rồi xóa sạch phiên cũ. Ngôn ngữ đang chọn được giữ.
- Demo giữ trạng thái khi tải lại trang (trong `sessionStorage` của tab, mất khi đóng tab). Muốn xóa tay: mở DevTools và chạy `sessionStorage.clear()`, hoặc dùng nút Phiên mới.

## Kiểm thử

```bash
npm test             # 92 test (quy tắc, reducer, hành trình người dùng A1–A12 và A14, đơn hàng, dòng gửi bảng tính, tệp PDF, suit ba mảnh, gile, tay áo và nguyên phụ liệu)
npm run verify       # chạy trình duyệt thật: 6 sản phẩm và đơn nhiều sản phẩm × 3 kích thước, layout A13, bàn phím A14, chụp ảnh
```

`npm run verify` cần dev server đang chạy (hoặc đặt `DEMO_URL` trỏ tới bản preview) và một trình duyệt Chrome/Edge cài sẵn trên máy (đặt `BROWSER_PATH` nếu ở vị trí khác). Ảnh chụp lưu ở `docs/screenshots/`, kết quả ở `docs/verification-results.json`. Chi tiết đối chiếu A1–A14 và việc cần nhà may duyệt: [`docs/HANDOVER.md`](docs/HANDOVER.md).

## Sản phẩm

Sáu sản phẩm ở màn hình đầu: **Suit hai mảnh** (áo + quần), **Suit ba mảnh (1 áo + 2 quần)**, **Suit ba mảnh (1 áo + 1 quần + 1 gile)**, **Blazer**, **Quần tây** và **Gile**.

- Suit ba mảnh có hai quần: ở tab **Quần 2** có nút **Giống quần đã chọn**. Bật thì mọi lựa chọn của quần 2 được chép từ quần 1 và tự đổi theo khi quần 1 đổi; chọn riêng một mục cho quần 2 thì quần 2 tách khỏi quần 1 (các mục còn lại giữ nguyên).
- **Gile** (và gile của suit ba mảnh) là một nhóm bốn lựa chọn: một hàng khuy hai túi / bốn túi, hai hàng khuy hai túi / bốn túi. Hình lấy từ bản vẽ nhà may cung cấp, vẽ lại cùng kiểu nét với các hình áo (xem `docs/sketch-style.md`).
- Logo Minh Quang Bespoke ở thanh trên cùng và đầu phiếu PDF được vẽ lại từ ảnh logo nhà may cung cấp thành một đường nét (`src/brand/logo.ts`), nên luôn sắc nét ở mọi cỡ màn hình.

## Chạy trên tablet Android

Ứng dụng đặt trên website của tiệm ở `/tablet/` và cài lên màn hình chính của tablet như một ứng dụng (toàn màn hình, chạy được khi mất mạng). Hướng dẫn từng bước cho tablet Tomko 27" Android 15: [`docs/ANDROID-SETUP.md`](docs/ANDROID-SETUP.md).

- Đưa bản mới lên website: `npm run build:site` (build vào `../tablet-app/`), commit rồi push.
- Trang nhân viên `#/setup` (chạm 5 lần vào logo): nhập địa chỉ bảng tính cho riêng máy đó, kiểm tra kết nối, xem kích thước màn hình và đơn đang chờ gửi.
- Chữ và nút tự phóng theo cỡ màn hình (tối đa khoảng 1,6 lần) và màn hình dọc luôn dùng bố cục dọc; chặn zoom bằng hai ngón, kéo, chọn chữ và menu khi giữ lâu; màn hình được giữ sáng.

## Tay áo và nguyên phụ liệu

- **Tay áo (Cuffs)** nằm trong các nhóm của áo (suit, blazer): 1, 2, 3 hoặc 4 khuy, hình vẽ từ bản nhà may gửi. Ngay trên màn hình đó có thêm lựa chọn chung cho cả bốn kiểu: **Khuy mở** (functional; chỉ khuyến nghị cho sport jacket / blazer) hoặc **Khuy đóng** (closed). Lựa chọn chung này được lưu thành nhóm riêng `cuffMode` nhưng không có bước riêng (khai báo `companionOf: 'cuffs'` trong `catalog.ts`).
- **Nguyên phụ liệu** là một tab cuối ở mọi sản phẩm, chọn một lần cho cả đơn, không có hình vẽ (thẻ chữ): **Loại khuy** (nhựa tiêu chuẩn / sừng / xà cừ; sừng và xà cừ có thể có phụ phí tùy dòng vải) và **Khuyết Milan** (Có / Không).
- Nhóm không có hình khai báo `noSketch: true`; hiển thị bằng thẻ chữ, trong phiếu PDF không có ô hình.

## Đơn hàng, PDF và bảng tính

Sau khi **Xác nhận thiết kế**, ứng dụng sang màn hình **Thông tin đơn hàng**: Order ID, tên khách, số điện thoại (ngày lấy tự động theo giờ của máy). Bấm **Xác nhận đơn** thì:

- Màn hình đã xác nhận hiện thông tin đơn và nút **Xuất PDF phiếu thiết kế** (một trang A4 — suit ba mảnh tự thu nhỏ vừa một trang; có logo, ngày, Order ID, khách, số điện thoại và từng lựa chọn kèm hình; tải về qua trình duyệt).
- Một dòng được ghi tự động vào **Google Sheets** của tiệm (ngày, Order ID, tên, số điện thoại, sản phẩm, lần xác nhận và mỗi lựa chọn thiết kế một cột). Cách nối: [`docs/google-sheets/GUIDE.md`](docs/google-sheets/GUIDE.md). Địa chỉ đặt trong `config.json` cạnh `index.html` (`public/config.json`), không cần build lại. Để trống thì ứng dụng vẫn chạy, chỉ không ghi bảng tính.
- Mất mạng thì đơn được giữ trên tablet và tự gửi lại; mỗi lần xác nhận có mã gửi riêng nên bảng tính không bị ghi trùng.
- Khách đổi thiết kế rồi xác nhận lại: phải xác nhận đơn lần nữa, thêm một dòng mới với "Lần xác nhận" tăng lên.

Thử không cần Google: `node scripts/mock-sheet-server.mjs` (máy chủ giả trên http://localhost:8787, cùng giao thức), rồi đặt `orderSheetUrl` thành `http://localhost:8787/`. Tên, số điện thoại chỉ nằm trong phiên của tab và trong hàng đợi gửi (khi chưa gửi được); **Phiên mới** xóa phiên.

## Cấu trúc

```
src/
  catalog/catalog.ts     danh mục mẫu: nhóm, lựa chọn, preset (ID ổn định)
  catalog/rules.ts       quy tắc chọn (hai hàng khuy ↔ ve nhọn), kiểm tra thiếu nhóm, preset
  content/vi.ts, en.ts   TOÀN BỘ chữ hiển thị — nhà may sửa ở đây
  sketches/              hình SVG: photos.tsx, pockets.tsx, trousers.tsx, products.tsx, registry.tsx
  state/                 reducer (nháp / bản xác nhận tách riêng), store, lưu sessionStorage
  screens/, components/  màn hình và thành phần giao diện
  styles/                tokens.css (màu, font), sketch.css (nét vẽ), app.css
scripts/verify.mjs       kiểm thử trình duyệt + chụp ảnh
```

Xem toàn bộ sketch trên một trang (để duyệt hình): mở `http://localhost:5173/#/sketches`. Trang này không có link trong luồng khách hàng.

## Sửa danh mục, chữ và thêm sketch

**Sửa chữ** (tên nhóm, mô tả, câu hỏi gợi ý cho sale, giải thích thêm, nội dung gợi ý, thông báo): sửa `src/content/vi.ts` và `src/content/en.ts`. Cả hai file cùng kiểu `Copy` nên TypeScript báo lỗi nếu thiếu một mục ở bất kỳ ngôn ngữ nào. Nhãn tiếng Anh phụ trong bản tiếng Việt là trường `term`.

**Đổi cấu hình gợi ý của nhà may**: sửa trường `preset` của từng nhóm trong `src/catalog/catalog.ts`.

**Thêm một lựa chọn vào nhóm có sẵn** (ví dụ thêm "Túi viền cong" vào Túi ngực):

1. `catalog.ts`: thêm ID vào mảng `options` của nhóm, ví dụ `'breastPocket.curved'`.
2. `vi.ts` và `en.ts`: thêm mục `options['breastPocket.curved']` (label, term, desc). Thiếu một trong hai file sẽ báo lỗi biên dịch.
3. `sketches/photos.tsx`, `pockets.tsx` (hoặc `trousers.tsx`): viết component vẽ mới, rồi đăng ký trong `sketches/registry.tsx`. Thiếu hình cũng báo lỗi biên dịch.
4. Nếu lựa chọn mới có ràng buộc với nhóm khác, thêm quy tắc vào `catalog/rules.ts` (xem quy tắc hai hàng khuy ↔ ve nhọn làm mẫu) và test trong `src/test/rules.test.ts`.

**Thêm một nhóm mới**: thêm phần tử vào `GROUPS` trong `catalog.ts` (chọn `garment: 'jacket' | 'trousers'`), thêm copy `groups[<id>]` ở hai ngôn ngữ, và các lựa chọn như trên. Màn hình chọn, tiến trình, xem lại, kiểm tra thiếu nhóm và xác nhận tự nhận nhóm mới.

**Nguồn hình** — hai loại:

- **Hình do nhà may cung cấp** (kiểu cài áo, ve, vai, túi ngực, xẻ sau, 4 kiểu lót áo, ly quần, cạp quần, túi sau): ảnh gốc đã cắt nằm ở `src/sketches/assets/source/`, được chuyển thành đường vector bằng `node scripts/vectorize.mjs` (ra `assets/vectors.ts`). Hình nhúng thẳng vào trang, không có tệp ảnh nào cần tải, nét sắc ở mọi mức phóng to. `sketches/photos.tsx` ghép từng lựa chọn với hình tương ứng.
- **Lựa chọn chưa có hình gốc** được sửa từ hình gần nhất, bằng nét cùng kiểu vẽ: một hàng 1 và 3 khuy (xóa và vẽ lại khuy trên hình 2 khuy), hai hàng 4×1 và 4×2 (xóa hàng khuy trên cùng của hình 6 khuy), ve sam (xóa khấc và tai ve, vẽ một đường cong liền), vai tự nhiên đệm nhẹ (vẽ lại đầu vai của hình vai sơ-mi), một ly (thêm đường ly lên cạp). Các chỗ sửa vẽ ngay trong `photos.tsx` theo tọa độ điểm ảnh của ảnh cắt (`Erase` xóa, `Ring` vẽ khuy, `pen` vẽ nét).
- **Hình vẽ bằng mã** (5 kiểu túi ngoài, túi trước, gấu quần, hình quần ở màn hình đầu): `sketches/pockets.tsx`, `trousers.tsx`, `products.tsx`, dùng bộ dụng cụ ở `common.tsx` (`Mirror`, `Scale`, `Callout` vòng tròn phóng to, `Button`) và các lớp nét trong `styles/sketch.css` (`ink`, `line`, `fine`, `dots`, `crease`, `pen`). Quy tắc chung của mọi hình: [`docs/sketch-style.md`](docs/sketch-style.md).

**Thay một hình gốc bằng hình mới:** cắt ảnh mới cùng kích thước với tệp cũ (hình áo 300×440 px, vòng tròn vai 260×260 px, vòng tròn quần 350×350 px, lót áo 580×465 px), đặt đè lên tệp cùng tên trong `assets/source/`, rồi chạy `node scripts/vectorize.mjs` (cần Chrome/Edge trên máy). Nếu đổi vị trí khuy hay đường nét thì chỉnh lại các tọa độ sửa tương ứng trong `photos.tsx`. Màu nền `--sk-bg` trong `tokens.css` khớp màu nền ảnh gốc (#edeae2).

## Giới hạn chủ ý của giai đoạn này

Không có backend riêng, lưu lâu dài (ngoài một dòng mỗi đơn gửi vào Google Sheets), số đo, giá, đặt cọc, thanh toán, lịch hẹn, CRM hay đăng nhập. Order ID do nhân viên nhập, không có cơ chế tạo mã tự động. Phiếu PDF là phiếu thiết kế tham khảo, không phải hóa đơn hay biên nhận.

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
npm test             # 38 test hành vi (quy tắc, reducer, hành trình người dùng A1–A12, A14)
npm run verify       # chạy trình duyệt thật: 3 sản phẩm × 3 kích thước, layout A13, bàn phím A14, chụp ảnh
```

`npm run verify` cần dev server đang chạy (hoặc đặt `DEMO_URL` trỏ tới bản preview) và một trình duyệt Chrome/Edge cài sẵn trên máy (đặt `BROWSER_PATH` nếu ở vị trí khác). Ảnh chụp lưu ở `docs/screenshots/`, kết quả ở `docs/verification-results.json`. Chi tiết đối chiếu A1–A14 và việc cần nhà may duyệt: [`docs/HANDOVER.md`](docs/HANDOVER.md).

## Cấu trúc

```
src/
  catalog/catalog.ts     danh mục mẫu: nhóm, lựa chọn, preset (ID ổn định)
  catalog/rules.ts       quy tắc chọn (6×2 ↔ ve nhọn), kiểm tra thiếu nhóm, preset
  content/vi.ts, en.ts   TOÀN BỘ chữ hiển thị — nhà may sửa ở đây
  sketches/              hình SVG: jacket.tsx, trousers.tsx, products.tsx, registry.tsx
  state/                 reducer (nháp / bản xác nhận tách riêng), store, lưu sessionStorage
  screens/, components/  màn hình và thành phần giao diện
  styles/                tokens.css (màu, font), sketch.css (nét vẽ), app.css
scripts/verify.mjs       kiểm thử trình duyệt + chụp ảnh
```

Xem toàn bộ sketch trên một trang (để duyệt hình): mở `http://localhost:5173/#/sketches`. Trang này không có link trong luồng khách hàng.

## Sửa danh mục, chữ và thêm sketch

**Sửa chữ** (tên nhóm, mô tả, câu hỏi gợi ý cho sale, giải thích thêm, nội dung gợi ý, thông báo): sửa `src/content/vi.ts` và `src/content/en.ts`. Cả hai file cùng kiểu `Copy` nên TypeScript báo lỗi nếu thiếu một mục ở bất kỳ ngôn ngữ nào. Nhãn tiếng Anh phụ trong bản tiếng Việt là trường `term`.

**Đổi cấu hình gợi ý của nhà may**: sửa trường `preset` của từng nhóm trong `src/catalog/catalog.ts`.

**Thêm một lựa chọn vào nhóm có sẵn** (ví dụ thêm "Túi ngực" vào Túi ngoài):

1. `catalog.ts`: thêm ID vào mảng `options` của nhóm, ví dụ `'hipPockets.besom'`.
2. `vi.ts` và `en.ts`: thêm mục `options['hipPockets.besom']` (label, term, desc). Thiếu một trong hai file sẽ báo lỗi biên dịch.
3. `sketches/jacket.tsx` (hoặc `trousers.tsx`): viết component vẽ mới, rồi đăng ký trong `sketches/registry.tsx`. Thiếu hình cũng báo lỗi biên dịch.
4. Nếu lựa chọn mới có ràng buộc với nhóm khác, thêm quy tắc vào `catalog/rules.ts` (xem quy tắc 6×2 làm mẫu) và test trong `src/test/rules.test.ts`.

**Thêm một nhóm mới**: thêm phần tử vào `GROUPS` trong `catalog.ts` (chọn `garment: 'jacket' | 'trousers'`), thêm copy `groups[<id>]` ở hai ngôn ngữ, và các lựa chọn như trên. Màn hình chọn, tiến trình, xem lại, kiểm tra thiếu nhóm và xác nhận tự nhận nhóm mới.

**Quy ước vẽ sketch** (để các hình giống nhau về nét):

- Khung `viewBox="0 0 400 300"`, do `Sketch.tsx` tạo; component chỉ trả về phần thân SVG.
- `className="ink"` cho chi tiết đang được so sánh (nét đậm); `ctx` cho phần nền giữ nguyên ở mọi lựa chọn (nét nhạt); `cloth`, `cloth2`, `paper`, `lining`, `pad` cho màu nền. Màu và độ dày nét nằm trong `styles/sketch.css` và `styles/tokens.css`.
- Giữ nguyên phần nền giữa các lựa chọn trong cùng nhóm; chỉ vẽ khác ở chi tiết cần so sánh.
- Dùng `Mirror` (trong `sketches/common.tsx`) để vẽ nửa rồi lấy đối xứng qua x = 200.

## Giới hạn chủ ý của giai đoạn này

Không có backend, Google Sheets, lưu lâu dài, số đo, giá, đặt cọc, thanh toán, lịch hẹn, CRM, đăng nhập hay xuất receipt. "DEMO-001" chỉ là nhãn mô phỏng, không phải cơ chế mã đơn thật.

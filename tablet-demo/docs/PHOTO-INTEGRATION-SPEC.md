# Đặc tả kỹ thuật: kết nối ảnh sản phẩm thật của website với ứng dụng tư vấn

Trạng thái: **bản nháp để quyết định**, chưa có dòng mã nào được viết. Phạm vi: Giai đoạn 0 (kiểm kê ảnh **đã tải lên website**) và Giai đoạn 1 (bản chạy tối thiểu). Ảnh chưa tải lên (đang ở thư mục trên máy) **chưa nằm trong phạm vi**; xem mục 6. Giai đoạn 2 trở đi chỉ nêu hướng ở cuối tài liệu.

Hai dự án liên quan nằm trong cùng một repo:

| Dự án | Thư mục | Vai trò trong tích hợp |
|---|---|---|
| Website (Express + EJS + MySQL) | gốc repo | Nơi tải ảnh, gắn tag; xuất danh sách ảnh cho tablet |
| Ứng dụng tư vấn (React + Vite, không backend) | `tablet-demo/` | Hiện ảnh thật khi khách xem một lựa chọn |

## 1. Mục tiêu, nguyên tắc, ngoài phạm vi

**Mục tiêu.** Khi khách bấm phóng to một lựa chọn (ví dụ "Một hàng 2 khuy"), ngoài sketch còn thấy vài ảnh áo thật nhà may đã làm đúng kiểu đó. Sketch vẫn là hình chính để so sánh, ảnh thật chỉ bổ sung.

**Nguyên tắc thiết kế**
1. Ứng dụng tư vấn **không được hỏng** khi không có ảnh, mất mạng hoặc chưa cấu hình: phần ảnh tự ẩn, mọi thứ khác chạy như hiện nay.
2. Không thêm backend cho ứng dụng tư vấn. Website xuất một tệp JSON công khai lên R2, tablet chỉ đọc tệp đó.
3. Danh mục lựa chọn của tablet (`src/catalog/catalog.ts`) là **nguồn chuẩn** cho ID. Website không tự đặt thêm ID.
4. Việc **đăng một ảnh lên trang Our Garments** và việc **dùng ảnh đó trên tablet** là hai quyết định độc lập: ảnh chỉ dành cho tablet không bị lộ ra trang công khai.

**Điều kiện về ảnh (đã xác nhận):** mọi ảnh là ảnh sản phẩm hoặc ảnh chi tiết, không có mặt người, nên **không cần chụp thêm và không cần xin sự đồng ý của khách**. Người gắn tag: chủ dự án. **Nguồn ảnh cho Giai đoạn 0–1: chỉ các ảnh đã có trong Media Library của website.**

**Điều kiện đã làm xong trước khi gắn tag:** sao lưu database (trang `/admin/backups`, xem `DEPLOY.md`, mục "Database backups"), vì tag là công sức của bạn.

**Ngoài phạm vi Giai đoạn 0–1:** đăng nhập cho khách, lưu lựa chọn của khách lên máy chủ, thống kê lượt xem ảnh, gắn tag bằng AI, chạy offline hoàn toàn bằng service worker, ảnh cho vải/màu, gợi ý ảnh theo tổ hợp nhiều lựa chọn ở màn hình xem lại.

## 2. Giai đoạn 0 — Kiểm kê ảnh đã tải lên website

Mục đích: biết trong Media Library hiện có gì để gắn tag, và ảnh nào đủ chất lượng.

### 2.1 Script kiểm kê (chỉ đọc)

`scripts/photo-audit.js` ở gốc repo. **Không ghi gì vào database hay R2.** Chạy: `node scripts/photo-audit.js`. Báo cáo in ra màn hình và lưu `photo-audit.csv`:

| Phần | Nội dung |
|---|---|
| Tổng quan | Số ảnh theo `group`; số ảnh `product_collection` theo `garment_category` |
| Chất lượng | Ảnh có cạnh dài dưới 1200 px; ảnh thiếu `alt_vi`/`alt_en` |
| Từng ảnh | `id`, `filename`, `group`, `garment_category`, kích thước, có bản gốc hay không, caption |

Kết quả cho bạn biết quy mô ngay trước khi gắn tag.

### 2.2 Chất lượng tối thiểu để dùng trên tablet

- Cạnh dài **từ 1200 px trở lên** (ảnh nhỏ hơn mờ khi phóng to trên tablet).
- Cho thấy rõ kiểu dáng ở phần cần so sánh (khuy, ve, túi, cạp...). Ảnh chi tiết cận cảnh vẫn dùng được: chỉ gắn tag cho những nhóm nhìn thấy rõ trong ảnh.
- Hệ thống đã nhận JPEG, PNG, WebP, tối đa 40 MB một tệp.

### 2.3 Kết thúc Giai đoạn 0

Không có cổng chặn cứng. Giai đoạn 0 xong khi đã chạy báo cáo kiểm kê và đọc kết quả. Mức phủ theo từng lựa chọn chỉ biết được **sau khi gắn tag**; phần này do bảng thống kê trong admin ở mục 3.3 cho thấy.

## 3. Giai đoạn 1 — Bản chạy tối thiểu

### 3.1 Mô hình dữ liệu (website)

Hai migration mới, đặt tên theo quy ước hiện có:

**`20260101000024_add_consult_enabled_to_media.js`** — thêm vào bảng `media` cột `consult_enabled` (boolean, mặc định `false`): ảnh được phép hiện trên tablet. Ảnh đã có tag nhưng chưa bật thì không xuất ra tablet, nên bạn có thể gắn tag trước và duyệt rồi mới bật.

**`20260101000025_create_media_design_tags.js`** — bảng mới:

| Cột | Ý nghĩa |
|---|---|
| `media_id` | Khóa ngoại tới `media.id`, xóa theo (`ON DELETE CASCADE`) |
| `option_id` | ID lựa chọn, ví dụ `closure.sb2` |

Khóa chính là cặp (`media_id`, `option_id`). Mỗi nhóm tối đa **một** tag cho mỗi ảnh (một áo chỉ có một kiểu cài); điều này kiểm tra ở tầng ứng dụng, không bắt buộc bằng database.

Không thay đổi `group` hay `garment_category` hiện có; trang Our Garments chạy như cũ.

### 3.2 Hợp đồng ID giữa hai dự án

1. Ở `tablet-demo/` thêm lệnh `npm run export:catalog` sinh `catalog.json`:
   ```json
   {
     "version": 1,
     "groups": [
       { "id": "closure", "garment": "jacket", "name": { "vi": "Kiểu cài áo", "en": "Front closure" },
         "options": [ { "id": "closure.sb2", "vi": "Một hàng 2 khuy", "en": "Single-breasted, 2 buttons" } ] }
     ]
   }
   ```
2. Tệp được ghi vào `src/data/consult-catalog.json` của website và được commit.
3. Một test trong `tablet-demo` so tệp đã commit với catalog hiện tại và **thất bại nếu hai bên lệch nhau**. Nhờ đó không ai thêm lựa chọn ở tablet mà quên cập nhật website.
4. Website kiểm tra mọi `option_id` nhận vào theo tệp này và từ chối ID lạ.

### 3.3 Giao diện gắn tag (admin website)

Trang mới `/admin/consult-photos`, thêm một mục vào menu admin. Thiết kế quanh việc **một người gắn tag cho nhiều ảnh liên tục**:

- Danh sách ảnh dạng lưới, có bộ lọc: **Chưa gắn tag** (mặc định), **Đã gắn tag**, **Đang bật cho tablet**, và lọc theo nhóm `group`.
- Mặc định chỉ liệt kê ảnh **đã có trong Media Library**, mọi nhóm, kèm bộ lọc theo `group`.
- Bấm vào một ảnh mở bảng bên cạnh, gồm:
  - Ảnh lớn (biến thể 1200 px) và caption VI/EN đang có (sửa được tại chỗ).
  - Với mỗi nhóm trong catalog: một **nhóm nút chọn một** (radio) gồm các lựa chọn của nhóm và mục "Không thấy rõ" (mặc định). Chọn một lựa chọn là lưu ngay, không cần nút Lưu.
  - Công tắc "Dùng trên tablet".
- **Gắn tag nhanh:**
  - Nút "Ảnh tiếp theo" (và phím mũi tên) trong danh sách đang lọc, để gắn xong là qua ảnh khác.
  - Nút "Sao chép tag từ ảnh trước", cho trường hợp nhiều ảnh chụp cùng một áo.
  - Chỉ hiện các nhóm phù hợp: ảnh chi tiết chỉ cần gắn nhóm nhìn thấy trong ảnh.
- **Bảng thống kê phủ ảnh** ở đầu trang: với từng lựa chọn của catalog, số ảnh đã gắn tag và số ảnh đã bật cho tablet. Lựa chọn dưới 2 ảnh được tô nhắc. Đây là nơi bạn thấy lựa chọn nào còn thiếu.
- Ảnh bị xóa khỏi thư viện thì tag tự xóa theo, và manifest được xuất lại.
- Các route ghi mới dùng token chống giả mạo yêu cầu (CSRF) gắn trong phiên. Phần còn lại của admin hiện chưa có token này; vá phần còn lại là việc riêng, nên làm.

**Ước tính công gắn tag** (người làm là bạn): khoảng 20 đến 40 giây mỗi ảnh khi có "Ảnh tiếp theo" và sao chép tag, tức khoảng 1 đến 2 giờ cho 150 ảnh. Đây là ước lượng chưa kiểm chứng.

### 3.4 Manifest (website → R2)

Mỗi lần tag, công tắc hoặc ảnh thay đổi, website tạo lại manifest (gộp các thay đổi trong vòng 5 giây thành một lần) và tải lên R2:

- `consult/design-photos.<mã-băm>.json`: nội dung đầy đủ, cache dài.
- `consult/latest.json`: tệp nhỏ trỏ tới tệp trên, **cache ngắn (5 phút)**.

Hàm `putObject` hiện luôn đặt `Cache-Control: immutable` một năm, nên cần thêm một tham số tùy chọn `cacheControl`.

Định dạng manifest, phiên bản 1:

```json
{
  "version": 1,
  "generatedAt": "2026-11-02T09:00:00Z",
  "photos": [
    {
      "id": 123,
      "garment": "jacket",
      "caption": { "vi": "Áo một hàng 2 khuy, vải len", "en": "Two-button jacket, wool" },
      "tags": ["closure.sb2", "lapel.notch", "hipPockets.straightFlap"],
      "width": 2400,
      "height": 3000,
      "sizes": { "480": "https://…/a-480.webp", "768": "https://…/a-768.webp", "1200": "https://…/a-1200.webp" },
      "updatedAt": "2026-11-01T14:20:00Z"
    }
  ]
}
```

Quy tắc xuất:
- Chỉ ảnh có `consult_enabled = true` và ít nhất một tag.
- `garment` suy ra từ tag (`jacket` hoặc `trousers`); ảnh có tag của cả hai loại thì không xuất và bị báo lỗi trong admin.
- Chỉ ba cỡ 480, 768 và 1200 px. **Không đưa `original_path`** vào manifest (bản gốc nặng và có thể còn thông tin kỹ thuật trong EXIF); bản hiển thị đã được `sharp` chuyển sang WebP.
- Tối đa 500 ảnh; sắp xếp theo `updatedAt` giảm dần.
- Cấu hình CORS cho bucket R2: cho phép phương thức `GET` từ địa chỉ nơi tablet được đặt.

### 3.5 Ứng dụng tư vấn

**Cấu hình.** Biến lúc build `VITE_PHOTO_MANIFEST_URL` (địa chỉ `latest.json`). **Nếu không đặt, toàn bộ tính năng tắt** và ứng dụng giữ nguyên hành vi hiện tại.

**Mã mới**

| Tệp | Việc |
|---|---|
| `src/photos/manifest.ts` | Kiểu dữ liệu, kiểm tra hình dạng JSON, bỏ ảnh có tag lạ, bỏ ảnh hỏng |
| `src/photos/loadManifest.ts` | Tải `latest.json` rồi manifest; hết thời gian chờ 4 giây; lưu bản gần nhất vào `localStorage`; lỗi thì dùng bản đã lưu; không có thì trả về rỗng |
| `src/photos/match.ts` | Hàm thuần `photosForOption(manifest, option, selections)` |
| `src/components/RealPhotos.tsx` | Dải ảnh nhỏ trong cửa sổ phóng to |
| `src/components/PhotoLightbox.tsx` | Xem ảnh lớn, trước/sau, dựa trên `Modal` |

**Quy tắc chọn ảnh (`match.ts`)**
1. Giữ ảnh có tag đúng lựa chọn đang xem.
2. Điểm = số lựa chọn khác trong **bản nháp hiện tại** mà ảnh cũng có tag trùng (không tính nhóm đang xem).
3. Sắp theo điểm giảm dần, sau đó theo `updatedAt` mới nhất; lấy tối đa 6 ảnh.
4. Với áo, chỉ ảnh `garment: "jacket"`; với quần, chỉ `trousers`.

**Giao diện.** Trong cửa sổ phóng to của `ConfigureScreen` (hiện có sketch và dòng mô tả), thêm bên dưới:
- Tiêu đề "Ảnh thực tế nhà may đã làm" (EN: "Garments we have made").
- Dải cuộn ngang tối đa 6 ảnh nhỏ (biến thể 480 px, `loading="lazy"`), mỗi ảnh là một nút cao tối thiểu 44 px.
- Dòng lưu ý cố định: "Chất liệu và màu vải mỗi áo mỗi khác; ảnh chỉ để tham khảo kiểu dáng." (EN tương ứng.) Dòng này quan trọng, vì khách dễ chọn theo màu vải thay vì kiểu dáng.
- Bấm ảnh mở lightbox (biến thể 768 px, 1200 px trên màn hình lớn), có caption, nút trước/sau, đóng bằng nút hoặc phím Escape.
- **Không có ảnh khớp thì không hiện gì**, kể cả tiêu đề. Không có màn hình trống.

Toàn bộ chữ mới nằm trong `src/content/vi.ts` và `en.ts` theo cách hiện có.

**Tải trước.** Ngay khi bắt đầu phiên, tải ngầm các ảnh 480 px của nhóm Giai đoạn 1 (ước tính vài MB) để việc mở cửa sổ phóng to không phải chờ. Ảnh trên R2 đã có cache một năm nên lần sau lấy từ bộ nhớ trình duyệt.

### 3.6 Phạm vi các nhóm trong Giai đoạn 1

Giao diện tablet hiện ảnh cho **mọi lựa chọn có ảnh được gắn tag**, không giới hạn nhóm. Nhóm dễ có ảnh nhất ở mặt trước là kiểu cài áo (7), kiểu ve (3), túi ngoài (5), túi ngực (3) và xếp ly trước (3), tổng 21 lựa chọn; các nhóm khác (vai, xẻ sau, lót, cạp quần, túi trước, túi sau, gấu) có ảnh khi nào gắn tag khi đó. Không có nhóm nào bị khóa cứng, và lựa chọn chưa có ảnh đơn giản là không hiện gì.

### 3.7 Kiểm thử và nghiệm thu

**Kiểm thử tự động (tablet)**
- `match.ts`: đúng nhóm, đúng thứ tự điểm, giới hạn 6 ảnh, không lẫn áo với quần.
- `manifest.ts`: bỏ tag lạ, bỏ bản ghi hỏng, phiên bản lạ thì coi như rỗng.
- Thành phần `RealPhotos`: không ảnh thì không hiện; có ảnh thì hiện đúng số lượng.
- Test "catalog khớp" (mục 3.2).
- `scripts/verify.mjs`: thêm một lượt chạy với manifest mẫu phục vụ cục bộ, kiểm tra bố cục ở ba kích thước tablet và chụp ảnh màn hình. Một lượt chạy khác **không có** manifest để chắc chắn bản demo cũ vẫn nguyên vẹn.

**Kiểm thử thủ công**

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| P0 | Chạy `scripts/photo-audit.js` | Báo cáo đúng số ảnh theo nhóm; không có thay đổi nào trong database |
| P1 | Tablet thật, Wi-Fi tốt, chọn "Một hàng 2 khuy" và phóng to | Thấy dải ảnh đúng kiểu, mở lightbox được |
| P2 | Tắt Wi-Fi sau khi đã mở một phiên | Ảnh đã tải vẫn hiện; ảnh chưa tải không làm hỏng giao diện |
| P3 | Tablet mới, chưa từng có mạng | Không thấy phần ảnh, mọi thứ khác bình thường |
| P4 | Lựa chọn không có ảnh | Không hiện tiêu đề hay khung trống |
| P5 | Tắt công tắc "Dùng trên tablet" của một ảnh | Trong vài phút ảnh biến mất khỏi tablet |
| P6 | Ảnh chỉ gắn tag, không bật công tắc | Không xuất hiện trong manifest; trang Our Garments không đổi |
| P7 | Chuyển VI ↔ EN khi đang xem lightbox | Caption đổi ngôn ngữ, không mất vị trí |

**Tiêu chí hoàn thành:** P0 đến P7 đạt; `npm test` và `npm run verify` đạt; `npm run build` không lỗi; bản không cấu hình `VITE_PHOTO_MANIFEST_URL` vẫn qua toàn bộ các kiểm tra A1 đến A14 hiện có.

### 3.8 Nơi đặt ứng dụng tư vấn (cần quyết định)

| Phương án | Ưu | Nhược |
|---|---|---|
| Hosting tĩnh riêng (ví dụ Cloudflare Pages) | Không ảnh hưởng website; cập nhật độc lập; dễ cấu hình CORS | Thêm một nơi cần quản lý |
| Đặt dưới đường dẫn của website (ví dụ `/consult/`) | Một nơi duy nhất; dùng chung cổng mật khẩu | Mỗi lần sửa tablet là một lần deploy lại website |

**Đề xuất:** hosting tĩnh riêng, kèm mật khẩu hoặc mã PIN ở mức hosting. Cần chốt trước khi cấu hình CORS.

### 3.9 Ước lượng công việc

| Hạng mục | Ngày công kỹ sư |
|---|---|
| Script kiểm kê (Giai đoạn 0) | 0,5 |
| Hai migration, cập nhật `putObject` | 0,5 |
| Trang admin gắn tag, gắn nhanh, bảng phủ ảnh, CSRF cho route mới | 2 đến 2,5 |
| Tạo và đẩy manifest, xử lý xóa ảnh | 0,5 đến 1 |
| `export:catalog` và test khớp | 0,5 |
| Tablet: tải manifest, chọn ảnh, giao diện, lightbox, tải trước | 2 |
| Test, `verify`, kiểm tra trên tablet thật, tài liệu | 1 |
| **Tổng Giai đoạn 0 và 1** | **khoảng 7 đến 8** |

Chưa tính công gắn tag của bạn (mục 3.3), phụ thuộc số lượng ảnh.

## 4. Rủi ro và việc phải làm kèm

| Rủi ro | Cách giảm |
|---|---|
| Mất dữ liệu tag khi mất database | Đã có sao lưu mã hóa hằng ngày lên R2 (`/admin/backups`); cần đặt `BACKUP_PASSPHRASE` và bấm lưu bản đầu tiên **trước** khi nhập tag |
| Khách chọn theo màu vải thay vì kiểu | Dòng lưu ý cố định; sketch vẫn là hình chính; chỉ hiện trong cửa sổ phóng to |
| Tag sai | Radio mỗi nhóm một lựa chọn; ảnh chỉ lên tablet sau khi bạn bật công tắc |
| Lệch ID giữa hai dự án | Tệp danh mục dùng chung và test lệch |
| Tablet không có mạng ở tiệm | Lưu manifest gần nhất; tải trước ảnh; bản hỏng thì ẩn phần ảnh |

## 5. Câu hỏi cần chốt trước khi bắt đầu

1. Đặt tablet ở đâu (mục 3.8)?
2. Tên hiển thị tiếng Việt cho các kiểu túi ngực (Straight away, Barchetta) đã được nhà may duyệt chưa (xem `docs/HANDOVER.md`)?
3. Ảnh nào trong Media Library được dùng cho tablet là do bạn bật từng ảnh; ảnh vẫn dùng được đồng thời cho website (không cần tách riêng).

## 6. Hướng cho Giai đoạn 2 (không thuộc đặc tả này)

- **Ảnh chưa tải lên:** sau này tải lên thủ công qua Media Library, hoặc lưu trực tiếp trong tablet. Khi đó có thể thêm trang tải ảnh hàng loạt (gửi từng ảnh một để không quá tải bộ nhớ của hosting) và script kiểm kê thư mục để phát hiện trùng với ảnh đã tải lên. Mô hình dữ liệu và manifest ở trên không cần đổi.
- Gắn tag nhanh hơn: AI gợi ý tag, bạn chỉ duyệt.
- Service worker để chạy offline đầy đủ.
- Gợi ý ảnh theo tổ hợp toàn bộ lựa chọn ở màn hình xem lại.
- Thống kê ẩn danh: lựa chọn nào được xem nhiều, ảnh nào được mở.
- Dùng cùng dữ liệu tag để lọc ở trang Our Garments của website.

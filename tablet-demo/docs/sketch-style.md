# Nguồn và phong cách hình vẽ

Hình do nhà may cung cấp (kiểu cài, ve, vai, lót áo, ly quần, cạp quần, túi sau) **dùng nguyên bản vẽ**: nét đen đều, áo trắng trên nền be, áo treo trên mannequin, vòng tròn phóng to cho chi tiết nhỏ.

Quy tắc chung cho mọi hình trong ứng dụng, để cả bộ trông như một người vẽ:

- **Một hệ nét:** nét chính 1,9 · nét phụ 1,6 · nét mảnh 1,3 · khuy 1,5 (khai báo trong `sketch.css`, biến `--lw` giữ độ dày khi hình phóng to/thu nhỏ). Không nét đứt, không màu nhấn, không tô xám.
- **Một bảng màu:** nét nâu đen `--sk-ink`, vải trắng `--sk-paper`, nền be `--sk-bg` (#edeae2, khớp nền ảnh gốc).
- **Một khung:** hình áo trên mannequin; chi tiết nhỏ (vai, quần, gấu) trong vòng tròn phóng to; túi ngoài là mảng trước thân áo bằng vải trắng.
- Đường ly quần là một nét mảnh liền.

Hình nhà may gửi ở dạng nền xám hoặc có màu (túi ngực, xẻ sau, lót áo) được tô lại thành nét đen trên nền trắng bằng script chuẩn bị ảnh (xóa chữ đỏ, nối lại đường sống lưng, vẽ lại khuy thành vòng tròn) để cùng kiểu với các hình khác.

Gile (4 kiểu) được tô lại bằng cùng cách: nền xám thành áo trắng, cổ gile tối thành nền be, chấm khuy thành vòng tròn, túi thành khung nét đen.

Tay áo (4 kiểu khuy) tô lại cùng cách: nền xám thành vải trắng, chấm khuy thành vòng tròn, giữ nét nhỏ của khuyết; mép phải của tay áo để hở như bản gốc. Nguyên phụ liệu (loại khuy, khuyết Milan) và lựa chọn khuy mở / đóng không có hình, dùng thẻ chữ.

Sơ mi: chiều dài tay, kiểu cổ áo, cổ tay áo, túi ngực và vạt áo có hình; nẹp áo, "măng sét đúp", "nắp túi" và "không túi" là thẻ chữ. Hình gốc nằm trong `src/sketches/assets/shirt/` (cổ áo, cổ tay, vạt áo: SVG tách từ bộ hình Adobe Stock của nhà may; tay áo: hai ảnh JPG nhà may gửi). `node scripts/shirt-art.mjs` chuyển chúng sang màu của app và ghi `src/sketches/assets/shirtArt.ts`: nét giữ nguyên vector gốc, vùng vải trắng được tô bằng cách loang nền be từ mép (các khe nhỏ giữa hai nét được bịt trước khi loang); cổ tay đổi màu theo độ sáng (vải trắng, tay áo màu `--sk-tie`, mặt sau cổ tay `--sk-shade`); vạt áo là phần thân dưới của hai mẫu áo stock (`HEM_CROP`); ảnh tay áo được trace như các hình áo vest, nét được làm mảnh cho bằng các hình khác và bỏ túi ngực ở áo tay ngắn. Hình cổ áo mờ dần ở hai bên và mép dưới, hình vạt áo mờ dần ở mép trên (`fade` trong `src/sketches/shirt.tsx`). Túi ngực vẽ bằng mã trong `shirt.tsx`, cùng nét với hình áo, quần (nét mực than, đường may nổi `.stitch`). Hình cổ tay và túi ngực đổi theo lựa chọn đi kèm: `SKETCH_FOLLOWS` trong `src/sketches/registry.tsx`; ở cổ tay thường, khuy măng sét của hình gốc được phủ vải trắng và vẽ một khuy cài. Thay hình: đặt file mới cùng tên vào thư mục trên rồi chạy lại script.

Khi một lựa chọn chưa có hình gốc, sửa từ hình gần nhất bằng đúng nét ấy (xóa phần thừa bằng màu trắng của áo, vẽ phần mới bằng lớp `pen`), hoặc vẽ bằng mã theo cùng hệ nét (túi ngoài, xẻ sau, túi trước, gấu). Nếu nhà may cung cấp thêm hình gốc, thay vào là thống nhất toàn bộ.

/**
 * Starter Journal articles — safe, verifiable "house journal" writing
 * (general tailoring craft / cloth / Hanoi observation) rather than
 * unverifiable specific claims about Minh Quang's own history. Add real
 * house stories, people profiles and workshop pieces from Admin > Journal.
 */
exports.seed = async function (knex) {
  await knex('journal_posts').del();

  const now = new Date();

  const rows = [
    {
      slug: 'why-the-canvas-comes-first',
      category: 'craft',
      title_en: 'Why the Canvas Comes First',
      title_vi: 'Vì Sao Lớp Canvas Luôn Được Làm Trước',
      excerpt_en: "Before a jacket has sleeves or a collar, it has a canvas — the layer most people never see, and the one that decides how the finished garment behaves.",
      excerpt_vi: 'Trước khi một chiếc áo khoác có tay hay có cổ, nó đã có một lớp canvas — lớp mà hầu hết mọi người không bao giờ nhìn thấy.',
      body_en:
`Before a jacket has sleeves, a collar, or even much of a shape, it has a canvas. This is the layer most people never see and the one that decides how the finished garment behaves.

The canvas sits between the outer cloth and the lining, in the chest and lapel area, and it's usually a blend of horsehair, wool and cotton stitched together with rows of loose, hand-worked stitching. Its job is unglamorous: to give the chest its shape, to let the lapel roll rather than fold flat, and to let the jacket soften and mould to the body over months of wear instead of holding one rigid shape from day one.

There's a reason this matters more than most of what's visible from the outside. A fused jacket — where a layer of interfacing is glued to the cloth rather than stitched in — can look identical to a canvassed one on a hanger. The difference shows up later: in how the jacket ages, in whether the chest keeps its shape after a few dozen wears, in how it drapes when you're sitting rather than standing for a photograph.

We don't put every jacket through the same construction. A half-canvas jacket, with floating canvas through the chest and fused only below, is lighter and often the right call for a warm climate and a jacket that will be worn often rather than occasionally. A full canvas, running the length of the jacket, is a different decision — more structure, more weight, and usually reserved for a jacket meant to hold its shape through years of use.

None of this is a hierarchy where full canvas always wins. It's a set of trade-offs, and the right one depends on the cloth, the season, and how the jacket is actually going to be worn. That's a conversation we have before anything is cut — not a specification printed on a price list.`,
      body_vi:
`Trước khi một chiếc áo khoác có tay, có cổ, hay thậm chí có hình dáng rõ ràng, nó đã có một lớp canvas. Đây là lớp mà hầu hết mọi người không bao giờ nhìn thấy, nhưng lại là lớp quyết định cách chiếc áo hoàn thiện sẽ "sống" trên người mặc.

Lớp canvas nằm giữa lớp vải ngoài và lớp lót, ở vùng ngực và ve áo, thường là hỗn hợp lông ngựa, len và cotton được khâu lại với nhau bằng những đường chỉ tay lỏng, thưa. Nhiệm vụ của nó không hào nhoáng: tạo hình cho phần ngực, giúp ve áo cuộn tự nhiên thay vì gập phẳng, và để chiếc áo mềm dần, ôm theo cơ thể qua nhiều tháng sử dụng, thay vì giữ nguyên một dáng cứng ngay từ ngày đầu.

Có lý do để điều này quan trọng hơn phần lớn những gì nhìn thấy được từ bên ngoài. Một chiếc áo dùng keo dựng ép (fused) — nơi một lớp dựng được ép dính vào vải thay vì khâu vào — có thể trông giống hệt một chiếc áo dựng canvas khi treo trên móc. Sự khác biệt chỉ lộ ra sau đó: ở cách chiếc áo "già đi", ở việc phần ngực có giữ được dáng sau vài chục lần mặc hay không, ở cách nó rủ xuống khi bạn ngồi thay vì chỉ đứng để chụp ảnh.

Chúng tôi không dựng mọi chiếc áo theo cùng một cách. Một chiếc áo bán canvas, với lớp canvas thả tự do ở ngực và chỉ ép dựng ở phần dưới, nhẹ hơn và thường là lựa chọn phù hợp cho khí hậu nóng cùng một chiếc áo sẽ được mặc thường xuyên. Một chiếc áo full canvas, chạy dọc suốt thân áo, lại là một quyết định khác — nhiều cấu trúc hơn, nặng hơn, và thường dành cho một chiếc áo cần giữ dáng qua nhiều năm sử dụng.

Không có chuyện full canvas luôn là lựa chọn tốt hơn. Đây là một tập hợp những sự đánh đổi, và lựa chọn đúng phụ thuộc vào loại vải, mùa mặc, và cách chiếc áo thực sự sẽ được sử dụng. Đó là cuộc trò chuyện chúng tôi có trước khi đặt kéo cắt vải — không phải một thông số in sẵn trên bảng giá.`,
      status: 'published',
      published_at: now,
    },
    {
      slug: 'dressing-for-a-hanoi-summer',
      category: 'cloth',
      title_en: 'Dressing for a Hanoi Summer',
      title_vi: 'Chọn Vải Cho Mùa Hè Hà Nội',
      excerpt_en: "Hanoi's climate doesn't leave much room for cloth that only works in theory.",
      excerpt_vi: 'Khí hậu Hà Nội không để lại nhiều chỗ cho những loại vải chỉ đẹp trên lý thuyết.',
      body_en:
`Hanoi's climate doesn't leave much room for cloth that only works in theory. Wool that reads well in a mill's showroom in Biella can feel like a mistake by the time you've walked two blocks in July.

Most of what we recommend for the warmer months sits in a narrow range: tropical wool weights around 200–260 grams, open plain weaves that let air move through the cloth, and a handful of wool-linen blends that trade a little bit of drape for a lot more breathability. Pure linen has its place too, mostly in shirts and the occasional unstructured jacket, though it creases in a way that not everyone wants to live with in an office.

Colour and finish matter as much as fibre. A cloth with a slight sheen shows sweat marks faster than a drier, more matte finish — worth knowing before you commit to a colour you'll wear five days a week. Darker charcoals and navy hide more than pale greys, which is part of why they stay popular here regardless of trend.

None of this is really about following a seasonal collection. It's closer to picking the right tool for a specific, repeatable problem: a business suit that has to survive a commute on a motorbike, a shirt that needs to look pressed after a day in a humid office, a jacket for an evening that starts warm and doesn't cool down much. We keep a working selection of cloth suited to exactly that, and we're glad to bring in something specific if what a client needs isn't already on the table.`,
      body_vi:
`Khí hậu Hà Nội không để lại nhiều chỗ cho những loại vải chỉ đẹp trên lý thuyết. Một loại len trông rất ổn trong phòng trưng bày của một xưởng dệt ở Biella có thể trở thành một lựa chọn sai lầm chỉ sau vài trăm mét đi bộ giữa tháng Bảy.

Phần lớn những gì chúng tôi gợi ý cho mùa nóng nằm trong một khoảng khá hẹp: len nhiệt đới trọng lượng khoảng 200–260 gram, kiểu dệt trơn thoáng giúp không khí lưu thông qua lớp vải, và một số loại pha len-lanh đánh đổi một chút độ rủ để lấy lại nhiều độ thoáng khí hơn. Vải lanh nguyên chất cũng có chỗ đứng riêng, chủ yếu ở sơ mi và một vài chiếc áo khoác không dựng cứng, dù nó nhăn theo cách không phải ai cũng muốn chấp nhận khi đi làm văn phòng.

Màu sắc và độ hoàn thiện của vải cũng quan trọng không kém chất liệu. Một loại vải hơi bóng sẽ lộ vết mồ hôi nhanh hơn một loại có bề mặt khô, mờ hơn — điều đáng biết trước khi bạn chọn một màu sẽ mặc năm ngày một tuần. Màu than chì đậm và xanh navy che khuyết điểm tốt hơn màu xám nhạt, một phần lý do chúng vẫn được ưa chuộng ở đây bất kể xu hướng thay đổi ra sao.

Tất cả những điều này không thực sự liên quan đến việc chạy theo một bộ sưu tập theo mùa. Nó gần với việc chọn đúng công cụ cho một vấn đề cụ thể, lặp đi lặp lại: một bộ suit công sở phải chịu được quãng đường đi làm bằng xe máy, một chiếc sơ mi cần trông vẫn phẳng phiu sau một ngày trong văn phòng ẩm thấp, một chiếc áo khoác cho buổi tối bắt đầu oi bức và không mát đi nhiều. Chúng tôi giữ một lựa chọn vải phù hợp đúng với những nhu cầu đó, và luôn sẵn lòng đặt riêng một loại vải cụ thể nếu điều khách cần chưa có sẵn.`,
      status: 'published',
      published_at: now,
    },
    {
      slug: 'phung-hung-between-trade-and-transit',
      category: 'hanoi',
      title_en: 'Phùng Hưng, Between Trade and Transit',
      title_vi: 'Phùng Hưng, Giữa Thương Mại Và Giao Thông',
      excerpt_en: "A street shaped as much by what passed behind it as by what was sold in front.",
      excerpt_vi: 'Một con phố được định hình không kém bởi những gì diễn ra phía sau so với những gì được bày bán phía trước.',
      body_en:
`Phùng Hưng runs along the western edge of Hanoi's Old Quarter, close enough to the railway that for a long time its ground floors were defined as much by what passed behind them as by what was sold in front. The street has always done a certain kind of business — practical, commercial, close to the trades that keep a city dressed and supplied — and that character hasn't fully gone away, even as the shopfronts have changed hands over the decades.

Walk it in the morning and it's ordinary in a way that's easy to underestimate: shutters going up, deliveries arriving by motorbike, the particular narrowness of a street built for foot traffic and cyclos rather than cars. It doesn't perform for visitors the way some Old Quarter streets now do. That's part of what makes it a reasonable place for a tailoring house to have stayed for as long as this one has.

We don't think of Phùng Hưng as a backdrop. It's closer to a set of working conditions — foot traffic, neighbours who've known the shop for years, a rhythm to the street that shapes when customers come in and when they don't. A house like this is a product of its address as much as its cutting table, and it would be a different business somewhere else in the city, let alone somewhere else entirely.`,
      body_vi:
`Phùng Hưng chạy dọc rìa phía tây của khu phố cổ Hà Nội, đủ gần đường sắt để trong một thời gian dài, tầng trệt của các ngôi nhà trên phố được định hình không kém bởi những gì diễn ra phía sau chúng so với những gì được bày bán phía trước. Con phố này vốn luôn gắn với một kiểu kinh doanh nhất định — thực tế, mang tính thương mại, gần với những ngành nghề giữ cho một thành phố được ăn mặc và cung ứng đầy đủ — và tính chất đó chưa hoàn toàn biến mất, dù các cửa hiệu đã đổi chủ qua nhiều thập kỷ.

Đi bộ qua đây vào buổi sáng, con phố mang một vẻ bình thường dễ bị đánh giá thấp: những tấm cửa cuốn được kéo lên, hàng hóa được giao bằng xe máy, và cái sự chật hẹp đặc trưng của một con phố vốn được xây cho người đi bộ và xích lô chứ không phải ô tô. Nó không "trình diễn" cho khách du lịch theo cách một số con phố khác trong khu phố cổ đang làm. Đó cũng là một phần lý do khiến nơi đây là một địa điểm hợp lý để một nhà may như thế này gắn bó lâu đến vậy.

Chúng tôi không xem Phùng Hưng như một phông nền. Nó gần với một tập hợp những điều kiện làm việc hơn — lượng người qua lại, những người hàng xóm đã biết đến cửa hiệu từ nhiều năm, một nhịp điệu riêng của con phố quyết định khi nào khách ghé vào và khi nào thì không. Một nhà may như thế này là sản phẩm của chính địa chỉ nó tọa lạc, không kém gì bàn cắt của nó, và nó hẳn sẽ là một cửa hiệu khác nếu ở một nơi khác trong thành phố, chưa nói đến một nơi hoàn toàn khác.`,
      status: 'published',
      published_at: now,
    },
  ];

  await knex('journal_posts').insert(rows);
};

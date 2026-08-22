exports.seed = async function (knex) {
  await knex('page_content').del();

  const rows = [
    // --- HOME ---
    {
      page_key: 'home', section_key: 'hero', sort_order: 1,
      title_en: 'A tailoring house in Hanoi.',
      title_vi: 'Một nhà may ở Hà Nội.',
      body_en: '', body_vi: '',
    },
    {
      page_key: 'home', section_key: 'intro', sort_order: 2,
      title_en: null, title_vi: null,
      body_en: "Minh Quang has worked from Hanoi's Old Quarter for three generations, cutting cloth on the same street where the city's tailors have always kept their workshops. We make suits, jackets, trousers and shirts for people who plan to wear them for years, not one season. The process is unhurried: a conversation first, then cloth, then the cutting table.",
      body_vi: 'Minh Quang gắn bó với khu phố cổ Hà Nội qua ba thế hệ, vẫn cắt may trên con phố mà những người thợ may của thành phố từng chọn làm nơi lập nghiệp. Chúng tôi may suit, áo khoác, quần âu và sơ mi cho những khách hàng có ý định mặc chúng nhiều năm, không chỉ một mùa. Quy trình không vội vã: bắt đầu bằng một cuộc trò chuyện, rồi đến vải, rồi mới tới bàn cắt.',
    },
    {
      page_key: 'home', section_key: 'house_teaser', sort_order: 3,
      title_en: 'Discover the House', title_vi: 'Khám Phá Nhà May',
      body_en: 'A shopfront on Phùng Hưng, a workshop upstairs, and a family that has kept both running since 1955.',
      body_vi: 'Một cửa hiệu trên phố Phùng Hưng, xưởng may trên tầng, và một gia đình đã giữ cả hai từ năm 1955.',
    },
    {
      page_key: 'home', section_key: 'craft_teaser', sort_order: 4,
      title_en: 'The Process', title_vi: 'Quy Trình',
      body_en: 'Cutting, fitting, making — most of it still happens by hand, at a table that has seen decades of cloth.',
      body_vi: 'Cắt, thử, may — phần lớn vẫn làm bằng tay, trên một chiếc bàn đã chứng kiến hàng chục năm vải vóc qua lại.',
    },
    {
      page_key: 'home', section_key: 'people_teaser', sort_order: 5,
      title_en: 'Meet the people behind the house', title_vi: 'Gặp gỡ những con người của nhà may',
      body_en: 'The cutters, the coat makers, the trouser makers, the person who answers the phone. Every one of them has a hand in what you wear.',
      body_vi: 'Những người thợ cắt, thợ may áo, thợ may quần, và cả người nghe điện thoại mỗi ngày. Ai trong số họ cũng có phần trong bộ trang phục bạn khoác lên.',
    },
    {
      page_key: 'home', section_key: 'tailoring_teaser', sort_order: 6,
      title_en: 'Tailoring', title_vi: 'May Đo',
      body_en: 'Suits, jackets, trousers, shirts, and formalwear for weddings — each considered by cloth, silhouette and purpose before anything is cut.',
      body_vi: 'Suit, áo khoác, quần âu, sơ mi và trang phục lễ cưới — mỗi loại được cân nhắc theo vải, dáng và mục đích trước khi đặt kéo.',
    },
    {
      page_key: 'home', section_key: 'hanoi_teaser', sort_order: 7,
      title_en: 'Phùng Hưng', title_vi: 'Phùng Hưng',
      body_en: "Phùng Hưng has been a street of commerce and cloth for longer than the house has been on it. Hanoi is not a backdrop here — it's where the work happens.",
      body_vi: 'Phùng Hưng đã là một con phố buôn bán và vải vóc từ trước cả khi nhà may có mặt. Hà Nội ở đây không phải phông nền — đó là nơi công việc thực sự diễn ra.',
    },
    {
      page_key: 'home', section_key: 'visit_teaser', sort_order: 8,
      title_en: 'Visit the House', title_vi: 'Ghé Thăm Nhà May',
      body_en: '175 Phùng Hưng, Hoàn Kiếm, Hanoi. Open Monday to Saturday. Appointments are welcome; so are walk-ins.',
      body_vi: '175 Phùng Hưng, Hoàn Kiếm, Hà Nội. Mở cửa từ thứ Hai đến thứ Bảy. Có thể đặt lịch hẹn trước, hoặc ghé trực tiếp.',
    },

    // --- THE HOUSE ---
    {
      page_key: 'house', section_key: 'intro', sort_order: 1,
      title_en: null, title_vi: null,
      body_en: "Minh Quang began as a family workshop and has stayed one. What's changed over the decades is less the way a jacket is put together than who is doing the fitting, and how customers reach us.",
      body_vi: 'Minh Quang bắt đầu như một xưởng may gia đình, và vẫn giữ nguyên như vậy. Điều thay đổi qua nhiều thập kỷ không phải là cách một chiếc áo được dựng lên, mà là ai đang đứng thử đồ cho khách, và khách tìm đến chúng tôi bằng cách nào.',
    },
    {
      page_key: 'house', section_key: 'history', sort_order: 2,
      title_en: 'Since 1955', title_vi: 'Từ Năm 1955',
      body_en: 'Since 1955, the house has been run by the same family, passing knowledge of cutting and construction from one generation to the next. The workshop has moved within the Old Quarter more than once, but it has never left it.',
      body_vi: 'Từ năm 1955, nhà may vẫn do cùng một gia đình điều hành, truyền lại kiến thức về cắt và dựng áo từ thế hệ này sang thế hệ khác. Xưởng may đã từng chuyển địa điểm trong khu phố cổ, nhưng chưa bao giờ rời khỏi nơi này.',
    },
    {
      page_key: 'house', section_key: 'phung_hung', sort_order: 3,
      title_en: 'On Phùng Hưng', title_vi: 'Trên Phố Phùng Hưng',
      body_en: 'Phùng Hưng sits at the edge of the Old Quarter, a street shaped by trade and, for a long stretch of its history, by the railway arches running behind it. Cloth merchants and tailors have worked this stretch of Hanoi for generations — Minh Quang is one house among that continuity, not apart from it.',
      body_vi: 'Phùng Hưng nằm ở rìa khu phố cổ, một con phố được định hình bởi thương mại và, trong một giai đoạn dài, bởi những vòm cầu đường sắt chạy phía sau. Các thương nhân vải vóc và thợ may đã làm việc trên đoạn phố này của Hà Nội qua nhiều thế hệ — Minh Quang là một trong những nhà may thuộc dòng chảy đó, không tách biệt khỏi nó.',
    },
    {
      page_key: 'house', section_key: 'philosophy', sort_order: 4,
      title_en: "One Method Doesn't Fit Everyone", title_vi: 'Không Một Công Thức Nào Dành Cho Tất Cả',
      body_en: "A jacket built for a Hanoi summer is not built the same way as one for a cooler climate, and a suit for a wedding is not cut the same way as one for the office. We don't apply one method to every client — the cloth, the occasion and the person in front of us decide the approach.",
      body_vi: 'Một chiếc áo khoác may cho mùa hè Hà Nội không được dựng giống như một chiếc cho khí hậu lạnh hơn, và một bộ suit cho đám cưới không được cắt giống như một bộ để đi làm. Chúng tôi không áp dụng một công thức duy nhất cho mọi khách hàng — vải, dịp mặc và chính người đang đứng trước mặt chúng tôi mới là điều quyết định cách làm.',
    },

    // --- TAILORING ---
    {
      page_key: 'tailoring', section_key: 'intro', sort_order: 1,
      title_en: null, title_vi: null,
      body_en: 'We make suits, jackets, trousers, shirts and formalwear for weddings. None of it is kept in stock — each piece begins with a conversation about how and where it will be worn.',
      body_vi: 'Chúng tôi may suit, áo khoác, quần âu, sơ mi và trang phục cho lễ cưới. Không có món nào được may sẵn để bán — mỗi bộ trang phục bắt đầu từ một cuộc trò chuyện về việc nó sẽ được mặc ở đâu và như thế nào.',
    },

    // --- OUR GARMENTS ---
    {
      page_key: 'garments', section_key: 'intro', sort_order: 1,
      title_en: null, title_vi: null,
      body_en: 'A closer look at finished work — suits, shirts and trousers as they come off the cutting table, photographed rather than described. No price list here, just the clothes themselves.',
      body_vi: 'Một góc nhìn gần hơn về những sản phẩm đã hoàn thiện — suit, sơ mi và quần âu sau khi rời bàn cắt, được ghi lại bằng hình ảnh thay vì lời miêu tả. Ở đây không có bảng giá, chỉ có chính những bộ trang phục.',
    },
    {
      page_key: 'tailoring', section_key: 'suits', sort_order: 2,
      title_en: 'Suits', title_vi: 'Suit',
      body_en: "A suit here is built around how you'll actually wear it — for the office five days a week, or for the handful of occasions a year that call for one. That decision shapes the canvas, the shoulder and the cloth weight before it shapes anything else.",
      body_vi: 'Một bộ suit ở đây được dựng dựa trên cách bạn thực sự sẽ mặc nó — cho công việc năm ngày một tuần, hay cho vài dịp hiếm hoi trong năm cần đến nó. Quyết định đó ảnh hưởng đến lớp dựng, vai áo và trọng lượng vải trước khi ảnh hưởng đến bất cứ điều gì khác.',
    },
    {
      page_key: 'tailoring', section_key: 'jackets', sort_order: 3,
      title_en: 'Jackets', title_vi: 'Áo Khoác',
      body_en: 'A jacket worn on its own asks for a different cut than one worn under a coat or as half of a suit. We treat it as its own garment, not a suit missing its trousers.',
      body_vi: 'Một chiếc áo khoác mặc riêng lẻ cần một kiểu cắt khác với một chiếc mặc dưới áo choàng hoặc là một nửa bộ suit. Chúng tôi coi nó là một món đồ độc lập, không phải một bộ suit thiếu quần.',
    },
    {
      page_key: 'tailoring', section_key: 'trousers', sort_order: 4,
      title_en: 'Trousers', title_vi: 'Quần Âu',
      body_en: 'Trousers are cut to sit and move the way you actually sit and move — at a desk, in a car, on a motorbike. Small adjustments here matter more than they look like they would.',
      body_vi: 'Quần âu được cắt để ngồi và di chuyển đúng như cách bạn thực sự ngồi và di chuyển — ở bàn làm việc, trong ô tô, trên xe máy. Những điều chỉnh nhỏ ở đây quan trọng hơn vẻ ngoài của chúng.',
    },
    {
      page_key: 'tailoring', section_key: 'shirts', sort_order: 5,
      title_en: 'Shirts', title_vi: 'Sơ Mi',
      body_en: "Shirting is chosen for Hanoi's climate as much as for the occasion — lighter cottons for the humid months, closer weaves for air-conditioned offices. Collar and cuff are built to hold their shape through repeated washing and ironing.",
      body_vi: 'Vải sơ mi được chọn theo khí hậu Hà Nội cũng nhiều như theo dịp mặc — cotton mỏng nhẹ cho những tháng oi ả, vải dệt sít hơn cho văn phòng có điều hòa. Cổ áo và măng-sét được dựng để giữ form qua nhiều lần giặt và ủi.',
    },
    {
      page_key: 'tailoring', section_key: 'wedding', sort_order: 6,
      title_en: 'Formalwear & Wedding', title_vi: 'Lễ Phục & Cưới Hỏi',
      body_en: "Formalwear for a wedding is planned around a single day that has to go right, on a timeline that usually can't move. We start earlier than usual and build in time for a second fitting.",
      body_vi: 'Trang phục lễ cưới được chuẩn bị cho một ngày duy nhất không được phép sai sót, theo một mốc thời gian thường không thể lùi lại. Chúng tôi bắt đầu sớm hơn bình thường và luôn để dành thời gian cho một buổi thử đồ thứ hai.',
    },

    // --- OUR PEOPLE ---
    {
      page_key: 'people', section_key: 'intro', sort_order: 1,
      title_en: null, title_vi: null,
      body_en: "Ask who makes a Minh Quang garment and the honest answer is: several people, not one name on a door. Cutters draft and adjust every pattern by hand. Coat makers and trouser makers build to that pattern, each specialising in their part of the garment. Someone presses and finishes. Someone answers the phone and remembers what you ordered last time. All of it adds up to what you're wearing.",
      body_vi: 'Nếu hỏi ai là người làm ra một sản phẩm của Minh Quang, câu trả lời trung thực là: nhiều người, không phải chỉ một cái tên trên biển hiệu. Thợ cắt dựng và chỉnh từng rập bằng tay. Thợ may áo và thợ may quần dựng theo rập đó, mỗi người chuyên một phần của trang phục. Có người là ủi và hoàn thiện. Có người nghe điện thoại và nhớ lần trước bạn đặt gì. Tất cả cộng lại tạo nên bộ trang phục bạn đang mặc.',
    },

    // --- THE PROCESS ---
    {
      page_key: 'process', section_key: 'intro', sort_order: 1,
      title_en: null, title_vi: null,
      body_en: 'Eight steps, roughly, from a first conversation to a finished garment you can wear for years. Not every commission needs all of them in the same order, but this is the shape the process usually takes.',
      body_vi: 'Khoảng tám bước, từ cuộc trò chuyện đầu tiên đến một bộ trang phục hoàn chỉnh bạn có thể mặc trong nhiều năm. Không phải đơn hàng nào cũng cần đủ tất cả các bước theo đúng thứ tự này, nhưng đó là hình dạng chung mà quy trình thường đi qua.',
    },

    // --- CLOTH ---
    {
      page_key: 'cloth', section_key: 'intro', sort_order: 1,
      title_en: null, title_vi: null,
      body_en: "Our cloth library runs from lightweight tropical wools and linen — suited to Hanoi's climate for most of the year — to fine worsteds, cashmere blends and shirtings sourced from established European mills. We keep a working selection rather than a large one, and we're glad to order in something specific when a client asks.",
      body_vi: 'Kho vải của chúng tôi trải dài từ len nhiệt đới nhẹ và vải lanh — phù hợp với khí hậu Hà Nội phần lớn thời gian trong năm — đến len worsted cao cấp, cashmere pha và vải sơ mi từ các xưởng dệt lâu đời của châu Âu. Chúng tôi giữ một lựa chọn vừa đủ dùng thay vì một kho hàng đồ sộ, và luôn sẵn lòng đặt riêng một loại vải cụ thể khi khách yêu cầu.',
    },

    // --- VISIT ---
    {
      page_key: 'visit', section_key: 'intro', sort_order: 1,
      title_en: null, title_vi: null,
      body_en: "The house is easiest to understand in person. Call ahead if you'd like to book a specific time, or come by during opening hours — someone is usually free to talk.",
      body_vi: 'Cách dễ nhất để hiểu về nhà may là ghé thăm trực tiếp. Gọi trước nếu bạn muốn đặt một khung giờ cụ thể, hoặc ghé qua trong giờ mở cửa — thường sẽ có người rảnh để trò chuyện.',
    },
  ];

  await knex('page_content').insert(rows);
};

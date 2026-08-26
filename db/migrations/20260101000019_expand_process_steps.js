/**
 * Expands The Process from 8 flat steps into 14 steps grouped under 8
 * named stages (Before We Cut / Cutting / Preparation / First Fitting /
 * Assembly / Second Fitting / Finishing / Aftercare) — richer, closer to
 * the house's real workflow, while staying in plain customer-facing
 * language rather than a raw production checklist. Replaces the old
 * step set entirely; photos previously attached to the old 8 steps don't
 * carry over automatically (different step_keys), so photos need
 * re-attaching in Admin > The Process afterward.
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('process_steps', (t) => {
    t.string('stage_en', 100).nullable();
    t.string('stage_vi', 100).nullable();
  });

  await knex('process_steps').del();

  const steps = [
    {
      step_key: 'consultation', sort_order: 1, stage_en: 'Before We Cut', stage_vi: 'Trước Khi Cắt',
      title_en: 'Consultation', title_vi: 'Tư Vấn',
      body_en: "A first conversation about what you need the garment for, how often you'll wear it, and what hasn't worked in the past. This usually takes longer than people expect.",
      body_vi: 'Cuộc trò chuyện đầu tiên về mục đích sử dụng trang phục, tần suất bạn sẽ mặc, và những điều chưa từng ổn ở những lần may trước. Bước này thường mất nhiều thời gian hơn mọi người nghĩ.',
    },
    {
      step_key: 'cloth', sort_order: 2, stage_en: 'Before We Cut', stage_vi: 'Trước Khi Cắt',
      title_en: 'Cloth', title_vi: 'Chọn Vải',
      body_en: 'We bring out a working selection based on the conversation — weight, weave and colour narrowed down together rather than handed over as a catalogue.',
      body_vi: 'Chúng tôi mang ra một lựa chọn vải phù hợp dựa trên cuộc trò chuyện trước đó — trọng lượng, kiểu dệt và màu sắc được thu hẹp dần cùng khách, thay vì đưa ra cả một cuốn catalogue.',
    },
    {
      step_key: 'measurement', sort_order: 3, stage_en: 'Before We Cut', stage_vi: 'Trước Khi Cắt',
      title_en: 'Measurement', title_vi: 'Đo Số Đo',
      body_en: "A full set of measurements is taken, along with notes on posture and how you stand — details a tape measure alone doesn't capture.",
      body_vi: 'Chúng tôi lấy đầy đủ số đo, cùng với ghi chú về dáng đứng và tư thế — những chi tiết mà riêng thước dây không thể nắm bắt hết.',
    },
    {
      step_key: 'pattern-cutting', sort_order: 4, stage_en: 'Cutting', stage_vi: 'Cắt',
      title_en: 'Pattern Cutting', title_vi: 'Ra Rập',
      body_en: 'A pattern is drafted specifically for your measurements, then adjusted by hand at the cutting table — this is where most of the judgment in the process happens. Now and then, a cutter with enough years behind them skips the paper altogether and cuts straight onto the cloth.',
      body_vi: 'Một rập được dựng riêng theo số đo của bạn, sau đó được chỉnh tay ngay tại bàn cắt — đây là công đoạn thể hiện nhiều nhất kinh nghiệm và phán đoán của người thợ. Thi thoảng, một người thợ cắt đã đủ nhiều năm trong nghề sẽ bỏ qua bước vẽ rập trên giấy và cắt thẳng lên vải.',
    },
    {
      step_key: 'fabric-cutting', sort_order: 5, stage_en: 'Cutting', stage_vi: 'Cắt',
      title_en: 'Fabric Cutting', title_vi: 'Cắt Vải',
      body_en: "Once the pattern is right, it's laid onto the cloth and cut — checking the grain and any pattern-matching (stripes, checks) before a single piece is separated.",
      body_vi: 'Khi rập đã chuẩn, nó được đặt lên vải và cắt — kiểm tra canh sợi vải và việc khớp họa tiết (kẻ sọc, ô vuông) trước khi cắt rời bất kỳ mảnh nào.',
    },
    {
      step_key: 'preparation', sort_order: 6, stage_en: 'Preparation', stage_vi: 'Chuẩn Bị',
      title_en: 'Preparation', title_vi: 'Chuẩn Bị',
      body_en: 'Depending on the garment, the chest piece is either fused or built as a floating canvas basted in by hand — a construction choice made earlier in the process, not a fixed rule applied to everything.',
      body_vi: 'Tùy vào từng loại trang phục, phần ngực áo được ép dựng bằng keo hoặc dựng bằng lớp canvas thả tự do, khâu tay — đây là lựa chọn về cấu trúc đã được quyết định từ trước, không phải một quy tắc áp dụng cho mọi sản phẩm.',
    },
    {
      step_key: 'details', sort_order: 7, stage_en: 'Preparation', stage_vi: 'Chuẩn Bị',
      title_en: 'Details', title_vi: 'Chi Tiết',
      body_en: 'Small details are set at this stage too — a complimentary monogram if you’d like one, and the lining positioned ready for construction.',
      body_vi: 'Một số chi tiết nhỏ cũng được chuẩn bị ở giai đoạn này — thêu tên miễn phí nếu bạn muốn, và lớp lót được định vị sẵn sàng cho công đoạn dựng áo.',
    },
    {
      step_key: 'first-fitting', sort_order: 8, stage_en: 'First Fitting', stage_vi: 'Thử Đồ Lần Một',
      title_en: 'First Fitting', title_vi: 'Thử Đồ Lần Một',
      body_en: 'The garment comes together enough to try on — checking balance, length and how it sits in movement, not just standing still. Adjustments are marked directly on the cloth.',
      body_vi: 'Trang phục được ráp đủ để thử — kiểm tra sự cân đối, độ dài và form dáng khi chuyển động, không chỉ khi đứng yên. Các điều chỉnh được đánh dấu trực tiếp lên vải.',
    },
    {
      step_key: 'lining-pockets-canvas', sort_order: 9, stage_en: 'Assembly', stage_vi: 'Dựng Áo',
      title_en: 'Lining, Pockets & Canvas', title_vi: 'Lót, Túi & Canvas',
      body_en: 'Construction continues upstairs: the lining is built in, pockets are made and set, and the canvas is secured — each done by hand where it affects how the finished garment will move and hold its shape.',
      body_vi: 'Việc dựng áo tiếp tục ở xưởng trên tầng: lớp lót được ráp vào, túi áo được may và đặt vào vị trí, lớp canvas được cố định — mỗi công đoạn đều làm bằng tay ở những chỗ ảnh hưởng đến cách trang phục hoàn thiện chuyển động và giữ form.',
    },
    {
      step_key: 'assembly', sort_order: 10, stage_en: 'Assembly', stage_vi: 'Dựng Áo',
      title_en: 'Assembly', title_vi: 'Ráp Hoàn Chỉnh',
      body_en: 'The pieces are aligned, joined and basted together, then checked, adjusted and pressed to keep their shape. The collar is attached, and every dimension is re-measured before final sewing begins.',
      body_vi: 'Các mảnh vải được canh chỉnh, ghép và lược lại với nhau, sau đó được kiểm tra, điều chỉnh và là ép để giữ form dáng. Cổ áo được gắn vào, và mọi số đo được đo lại trước khi bước vào công đoạn may chính thức.',
    },
    {
      step_key: 'second-fitting', sort_order: 11, stage_en: 'Second Fitting', stage_vi: 'Thử Đồ Lần Hai',
      title_en: 'Second Fitting', title_vi: 'Thử Đồ Lần Hai',
      body_en: 'Not every commission needs this step, but many do — a second check before the final details go in, catching anything the first fitting couldn’t.',
      body_vi: 'Không phải đơn may nào cũng cần bước này, nhưng phần lớn là có — một lần kiểm tra thứ hai trước khi hoàn thiện các chi tiết cuối, để xử lý những gì lần thử đầu chưa phát hiện ra.',
    },
    {
      step_key: 'buttons-stitching', sort_order: 12, stage_en: 'Finishing', stage_vi: 'Hoàn Thiện',
      title_en: 'Buttons & Stitching', title_vi: 'Cúc & Đường Chỉ',
      body_en: 'Buttons and buttonholes are finished by hand or by machine, depending on the garment and what suits it best — along with the pick stitching along the lapel and edges, a fine line that also helps the cloth hold its roll.',
      body_vi: 'Cúc áo và khuyết áo được hoàn thiện bằng tay hoặc bằng máy, tùy theo từng loại trang phục và điều gì phù hợp nhất — cùng với đường chỉ đột dọc ve áo và các mép, một đường chỉ tinh tế cũng giúp giữ form cuộn tự nhiên của vải.',
    },
    {
      step_key: 'pressing', sort_order: 13, stage_en: 'Finishing', stage_vi: 'Hoàn Thiện',
      title_en: 'Pressing', title_vi: 'Là Ép',
      body_en: "A final press sets the garment's shape properly — done with steam and weight, not just heat, so the shape holds rather than just looking pressed for a day.",
      body_vi: 'Lần là ép cuối cùng giúp định hình trang phục đúng chuẩn — thực hiện bằng hơi nước và lực ép, không chỉ đơn thuần là nhiệt, để form áo được giữ lâu dài chứ không chỉ đẹp trong một ngày.',
    },
    {
      step_key: 'aftercare', sort_order: 14, stage_en: 'Aftercare', stage_vi: 'Chăm Sóc Sau May',
      title_en: 'Aftercare', title_vi: 'Chăm Sóc Sau May',
      body_en: 'The relationship does not end at delivery. Alterations, pressing and adjustments as your fit changes are part of what it means to have something made here.',
      body_vi: 'Mối quan hệ không kết thúc khi giao hàng. Sửa đồ, là ủi và điều chỉnh khi vóc dáng bạn thay đổi đều là một phần của việc sở hữu một sản phẩm may tại đây.',
    },
  ];

  await knex('process_steps').insert(steps);

  // Update the intro line's step count reference (was "Eight steps, roughly...").
  await knex('page_content')
    .where({ page_key: 'process', section_key: 'intro', body_en: 'Eight steps, roughly, from a first conversation to a finished garment you can wear for years. Not every commission needs all of them in the same order, but this is the shape the process usually takes.' })
    .update({
      body_en: 'From a first conversation to a finished garment you can wear for years — roughly a dozen steps, grouped here into stages. Not every commission needs all of them in the same order, but this is the shape the process usually takes.',
      body_vi: 'Từ cuộc trò chuyện đầu tiên đến một bộ trang phục hoàn chỉnh bạn có thể mặc trong nhiều năm — khoảng hơn chục bước, được nhóm lại theo từng giai đoạn. Không phải đơn hàng nào cũng cần đủ tất cả các bước theo đúng thứ tự này, nhưng đó là hình dạng chung mà quy trình thường đi qua.',
    });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('process_steps', (t) => {
    t.dropColumn('stage_en');
    t.dropColumn('stage_vi');
  });
};

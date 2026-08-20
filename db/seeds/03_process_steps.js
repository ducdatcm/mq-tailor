exports.seed = async function (knex) {
  await knex('process_steps').del();

  const steps = [
    {
      step_key: 'consultation', sort_order: 1,
      title_en: 'Consultation', title_vi: 'Tư Vấn',
      body_en: "A first conversation about what you need the garment for, how often you'll wear it, and what hasn't worked in the past. This usually takes longer than people expect.",
      body_vi: 'Cuộc trò chuyện đầu tiên về mục đích sử dụng trang phục, tần suất bạn sẽ mặc, và những điều chưa từng ổn ở những lần may trước. Bước này thường mất nhiều thời gian hơn mọi người nghĩ.',
    },
    {
      step_key: 'cloth', sort_order: 2,
      title_en: 'Cloth', title_vi: 'Chọn Vải',
      body_en: 'We bring out a working selection based on the conversation — weight, weave and colour narrowed down together rather than handed over as a catalogue.',
      body_vi: 'Chúng tôi mang ra một lựa chọn vải phù hợp dựa trên cuộc trò chuyện trước đó — trọng lượng, kiểu dệt và màu sắc được thu hẹp dần cùng khách, thay vì đưa ra cả một cuốn catalogue.',
    },
    {
      step_key: 'measurement', sort_order: 3,
      title_en: 'Measurement', title_vi: 'Đo Số Đo',
      body_en: "A full set of measurements is taken, along with notes on posture and how you stand — details a tape measure alone doesn't capture.",
      body_vi: 'Chúng tôi lấy đầy đủ số đo, cùng với ghi chú về dáng đứng và tư thế — những chi tiết mà riêng thước dây không thể nắm bắt hết.',
    },
    {
      step_key: 'cutting', sort_order: 4,
      title_en: 'Cutting', title_vi: 'Cắt Vải',
      body_en: 'A pattern is drafted and adjusted at the cutting table before the cloth is cut. This is where most of the judgment in the process happens.',
      body_vi: 'Một rập được dựng và chỉnh sửa ngay tại bàn cắt trước khi vải được cắt. Đây là nơi phần lớn kinh nghiệm và phán đoán của người thợ được thể hiện.',
    },
    {
      step_key: 'fitting', sort_order: 5,
      title_en: 'Fitting', title_vi: 'Thử Đồ',
      body_en: 'The garment comes together in stages, with at least one fitting along the way to check balance, length and how it sits in movement, not just standing still.',
      body_vi: 'Trang phục được hoàn thiện theo từng giai đoạn, với ít nhất một buổi thử đồ để kiểm tra sự cân đối, độ dài và form dáng khi chuyển động, không chỉ khi đứng yên.',
    },
    {
      step_key: 'making', sort_order: 6,
      title_en: 'Making', title_vi: 'Hoàn Thiện',
      body_en: 'Construction continues at the workshop upstairs — canvassing, pressing and finishing carried out by hand where it matters most to the result.',
      body_vi: 'Việc dựng áo tiếp tục tại xưởng trên tầng — dựng lớp canvas, là ép và hoàn thiện được thực hiện bằng tay ở những công đoạn ảnh hưởng nhiều nhất đến kết quả cuối cùng.',
    },
    {
      step_key: 'final-fitting', sort_order: 7,
      title_en: 'Final Fitting', title_vi: 'Thử Đồ Lần Cuối',
      body_en: "A last check before the garment leaves the workshop — small adjustments are still possible here, and we'd rather make them than let something go out wrong.",
      body_vi: 'Kiểm tra lần cuối trước khi trang phục rời khỏi xưởng — vẫn có thể chỉnh sửa nhỏ ở bước này, và chúng tôi luôn ưu tiên sửa hơn là để một sản phẩm chưa đúng rời đi.',
    },
    {
      step_key: 'aftercare', sort_order: 8,
      title_en: 'Aftercare', title_vi: 'Chăm Sóc Sau May',
      body_en: 'The relationship does not end at delivery. Alterations, pressing and adjustments as your fit changes are part of what it means to have something made here.',
      body_vi: 'Mối quan hệ không kết thúc khi giao hàng. Sửa đồ, là ủi và điều chỉnh khi vóc dáng bạn thay đổi đều là một phần của việc sở hữu một sản phẩm may tại đây.',
    },
  ];

  await knex('process_steps').insert(steps);
};

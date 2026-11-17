/**
 * Short FAQ shown on the Visit page, edited in Admin > FAQ. Starts with the
 * three questions customers ask most, saved as hidden drafts: the answers
 * depend on the house's own timings, so the owner fills them in and ticks
 * "Visible on the site" before anything is published.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('faqs', (t) => {
    t.increments('id').primary();
    t.string('question_en', 255).notNullable();
    t.string('question_vi', 255);
    t.text('answer_en');
    t.text('answer_vi');
    t.integer('sort_order').defaultTo(0);
    t.boolean('active').defaultTo(false);
    t.timestamps(true, true);
  });

  await knex('faqs').insert([
    {
      sort_order: 1, active: false,
      question_en: 'How long does a garment take?',
      question_vi: 'May một bộ đồ mất bao lâu?',
      answer_en: 'A first suit usually takes about [X] weeks from your first visit to the finished garment, including fittings. Shirts and trousers are quicker, around [X] weeks.',
      answer_vi: 'Một bộ suit đầu tiên thường mất khoảng [X] tuần từ lần đầu ghé tiệm đến khi hoàn thiện, đã gồm các buổi thử đồ. Sơ mi và quần âu nhanh hơn, khoảng [X] tuần.',
    },
    {
      sort_order: 2, active: false,
      question_en: 'How many fittings will I need?',
      question_vi: 'Tôi cần thử đồ mấy lần?',
      answer_en: 'Usually [X] fittings for a first suit. Once we have your pattern, later orders often need fewer.',
      answer_vi: 'Thường là [X] buổi thử cho bộ suit đầu tiên. Khi đã có rập của bạn, các lần may sau thường cần ít buổi hơn.',
    },
    {
      sort_order: 3, active: false,
      question_en: 'I am only in Hanoi for a short stay. Can you still make something for me?',
      question_vi: 'Tôi chỉ ở Hà Nội vài ngày. Nhà may có kịp may cho tôi không?',
      answer_en: 'Yes, in many cases. Tell us your dates when you book and we will plan the fittings around your stay. [Add how you handle delivery abroad, if you do.]',
      answer_vi: 'Có, trong nhiều trường hợp. Hãy cho chúng tôi biết lịch của bạn khi đặt hẹn để sắp xếp các buổi thử phù hợp. [Thêm cách gửi đồ ra nước ngoài, nếu có.]',
    },
  ]);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('faqs');
};

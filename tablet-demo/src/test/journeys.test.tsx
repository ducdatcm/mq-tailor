import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { OptionId, ProductId } from '../catalog/catalog';
import { App } from '../App';
import { vi } from '../content/vi';
import { en } from '../content/en';

type User = ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  window.location.hash = '';
});

const option = (id: OptionId) => document.querySelector<HTMLButtonElement>(`[data-option="${id}"]`)!;
const product = (id: ProductId) => document.querySelector<HTMLButtonElement>(`[data-product="${id}"]`)!;
const button = (name: string | RegExp) => screen.getByRole('button', { name });

async function begin(user: User, p: ProductId, mode: 'manual' | 'preset' = 'manual') {
  render(<App />);
  await user.click(product(p));
  if (mode === 'preset') await user.click(document.querySelector('[data-mode="preset"]')!);
  await user.click(button(vi.start.cta));
}

async function pick(user: User, id: OptionId) {
  await user.click(option(id));
}

/** Double-breasted closures live under their own family tab. */
async function pickDouble(user: User, id: OptionId) {
  await user.click(button(vi.configure.familyDouble));
  await pick(user, id);
}

const next = (user: User) => user.click(button(vi.configure.next));

/** The order screen: type the three details and confirm. */
async function fillAndConfirmOrder(user: User, orderId = 'MQ-0001') {
  await user.type(screen.getByLabelText(vi.order.orderId), orderId);
  await user.type(screen.getByLabelText(vi.order.customer), 'Nguyễn Văn A');
  await user.type(screen.getByLabelText(vi.order.phone), '0912345678');
  await user.click(button(vi.order.confirm));
}

describe('A1–A2 products show only their own groups', () => {
  it('A1: a suit has jacket and trousers, configured independently', async () => {
    const user = userEvent.setup();
    await begin(user, 'suit');
    expect(button(/Áo suit/)).toBeInTheDocument();
    expect(button(/Quần suit/)).toBeInTheDocument();

    await pick(user, 'closure.sb1');
    await user.click(button(/Quần suit/));
    expect(option('pleats.flat')).toBeInTheDocument();
    expect(option('closure.sb1')).toBeNull();
    await pick(user, 'pleats.two');

    await user.click(button(/Áo suit/));
    expect(option('closure.sb1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('A2: blazer shows only jacket groups; trousers only trouser groups', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    expect(screen.queryByRole('button', { name: /Quần/ })).toBeNull();
    expect(screen.getByRole('navigation', { name: vi.configure.stepsLabel }).querySelectorAll('li')).toHaveLength(8);
  });

  it('A2: standalone trousers have five groups and no jacket', async () => {
    const user = userEvent.setup();
    await begin(user, 'trousers');
    expect(screen.getByRole('navigation', { name: vi.configure.stepsLabel }).querySelectorAll('li')).toHaveLength(5);
    expect(option('pleats.flat')).toBeInTheDocument();
  });
});

describe('A3–A4 choosing and navigating', () => {
  it('A3: one value is selected at a time and the summary follows', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    await pick(user, 'closure.sb1');
    await pick(user, 'closure.sb2');
    expect(option('closure.sb1')).toHaveAttribute('aria-pressed', 'false');
    expect(option('closure.sb2')).toHaveAttribute('aria-pressed', 'true');
    const summary = screen.getByRole('complementary', { name: vi.configure.summaryTitle });
    expect(within(summary).getByText(vi.options['closure.sb2'].label)).toBeInTheDocument();
  });

  it('A4: back, forward and jumping keep earlier choices', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    await pick(user, 'closure.sb2');
    await next(user);
    await pick(user, 'lapel.peak');
    await user.click(button(vi.configure.back));
    expect(option('closure.sb2')).toHaveAttribute('aria-pressed', 'true');
    await next(user);
    expect(option('lapel.peak')).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('A5 missing groups', () => {
  it('names the missing groups and blocks confirmation', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    await pick(user, 'closure.sb2');
    await user.click(button(vi.configure.openReview));

    expect(screen.getByRole('alert')).toHaveTextContent('Còn thiếu 10 nhóm');
    for (const name of ['Kiểu ve', 'Dáng vai', 'Túi ngoài', 'Túi ngực', 'Xẻ sau', 'Tay áo', 'Kiểu khuy tay', 'Lót áo', 'Loại khuy', 'Khuyết Milan']) {
      expect(within(screen.getByRole('alert')).getByRole('button', { name })).toBeInTheDocument();
    }
    expect(button(vi.review.confirm)).toBeDisabled();

    // the link opens that exact group
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Xẻ sau' }));
    expect(screen.getByRole('heading', { level: 1, name: /Xẻ sau/ })).toBeInTheDocument();
  });
});

describe('A6 presets', () => {
  it('applying the house suggestion then changing one detail changes only that detail', async () => {
    const user = userEvent.setup();
    await begin(user, 'suit', 'preset');
    expect(option('closure.sb2')).toHaveAttribute('aria-pressed', 'true');
    await user.click(button(/Quần suit/));
    await user.click(within(screen.getByRole('complementary')).getByRole('button', { name: /Gấu quần/ })); // sidebar jump
    await pick(user, 'hem.turnUp');
    await user.click(within(screen.getByRole('complementary')).getByRole('button', { name: vi.configure.openReview }));

    const rows = Array.from(document.querySelectorAll<HTMLElement>('.sheet-row'));
    const values = Object.fromEntries(rows.map((r) => [r.dataset.group!, r.querySelector('.sheet-value')!.textContent]));
    expect(values.hem).toBe(vi.options['hem.turnUp'].label);
    expect(values.closure).toBe(vi.options['closure.sb2'].label);
    expect(values.pleats).toBe(vi.options['pleats.flat'].label);
    expect(values.backPockets).toBe(vi.options['backPockets.two'].label);
  });

  it('"Nhờ nhà may gợi ý" does not select anything until Apply is pressed', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    await user.click(button(vi.configure.askHouse));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(vi.options['closure.sb2'].label)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: vi.suggestion.decline }));
    expect(option('closure.sb2')).toHaveAttribute('aria-pressed', 'false');

    await user.click(button(vi.configure.askHouse));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: vi.suggestion.apply }));
    expect(option('closure.sb2')).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('A7 double-breasted 6×2 and the lapel', () => {
  async function setup(user: User) {
    await begin(user, 'blazer');
    await pick(user, 'closure.sb2');
    await next(user);
    await pick(user, 'lapel.notch');
    await user.click(button(vi.configure.back));
  }

  it('asks first; accepting changes both', async () => {
    const user = userEvent.setup();
    await setup(user);
    await pickDouble(user, 'closure.db6x2');
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('ve nhọn');
    const summary = screen.getByRole('complementary');
    expect(within(summary).getByText(vi.options['closure.sb2'].label)).toBeInTheDocument(); // nothing changed yet

    await user.click(within(dialog).getByRole('button', { name: vi.lapelRule.accept }));
    expect(option('closure.db6x2')).toHaveAttribute('aria-pressed', 'true');
    await next(user);
    expect(option('lapel.peak')).toHaveAttribute('aria-pressed', 'true');
  });

  it('cancelling keeps both exactly as they were', async () => {
    const user = userEvent.setup();
    await setup(user);
    await pickDouble(user, 'closure.db6x2');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: vi.lapelRule.cancel }));
    await user.click(button(vi.configure.familySingle));
    expect(option('closure.sb2')).toHaveAttribute('aria-pressed', 'true');
    await next(user);
    expect(option('lapel.notch')).toHaveAttribute('aria-pressed', 'true');
  });

  it('notch is visibly unavailable while 6×2 is selected, and can be re-enabled by changing the closure', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    await pickDouble(user, 'closure.db6x2');
    await next(user);
    expect(option('lapel.notch')).toHaveAttribute('aria-disabled', 'true');
    expect(option('lapel.shawl')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getAllByText(vi.lapelRule.disabledReason)).toHaveLength(2);
    await user.click(option('lapel.notch'));
    expect(option('lapel.notch')).toHaveAttribute('aria-pressed', 'false');

    await user.click(button(vi.configure.changeClosure));
    await user.click(button(vi.configure.familySingle));
    await pick(user, 'closure.sb1');
    await next(user);
    await pick(user, 'lapel.notch');
    expect(option('lapel.notch')).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('closure families and new options', () => {
  it('shows single-breasted first, switches to double-breasted, and follows the current choice', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    expect(option('closure.sb3')).toBeInTheDocument();
    expect(option('closure.db6x2')).toBeNull();

    await user.click(button(vi.configure.familyDouble));
    for (const id of ['closure.db6x2', 'closure.db6x1', 'closure.db4x2', 'closure.db4x1'] as const) {
      expect(option(id)).toBeInTheDocument();
    }
    expect(option('closure.sb1')).toBeNull();

    await pick(user, 'closure.db4x1');
    await next(user);
    await user.click(button(vi.configure.back));
    // coming back, the family that holds the choice is open
    expect(option('closure.db4x1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers shawl lapels and roped shoulders, and the shawl lapel is unavailable with double-breasted', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    await pick(user, 'closure.sb2');
    await next(user);
    await pick(user, 'lapel.shawl');
    expect(option('lapel.shawl')).toHaveAttribute('aria-pressed', 'true');
    await next(user);
    await pick(user, 'shoulder.roped');
    expect(option('shoulder.roped')).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(screen.getByRole('complementary')).getByRole('button', { name: /Kiểu cài áo/ }));
    await pickDouble(user, 'closure.db4x2');
    // a shawl lapel was chosen, so the double-breasted choice asks before changing it
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Ve sam');
    await user.click(within(dialog).getByRole('button', { name: vi.lapelRule.accept }));
    await next(user);
    expect(option('lapel.peak')).toHaveAttribute('aria-pressed', 'true');
    expect(option('lapel.shawl')).toHaveAttribute('aria-disabled', 'true');
    expect(option('lapel.notch')).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('A8 language', () => {
  it('switches the whole screen and keeps every selection', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    await pickDouble(user, 'closure.db6x2');
    await user.click(button(/English/));

    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.groups.closure.name);
    expect(option('closure.db6x2')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText(en.options['closure.db6x2'].label).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(vi.options['closure.db6x2'].label)).toHaveLength(0);

    await user.click(button(en.configure.openReview));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.review.title);
    await user.click(button(/Tiếng Việt/));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(vi.review.title);
  });
});

describe('A9 edit from review', () => {
  it('opens the right group and returns to an accurate summary', async () => {
    const user = userEvent.setup();
    await begin(user, 'suit', 'preset');
    await user.click(button(vi.configure.openReview));
    await user.click(button('Chỉnh sửa: Gấu quần'));

    expect(screen.getByRole('heading', { level: 1, name: /Gấu quần/ })).toBeInTheDocument();
    await pick(user, 'hem.turnUp');
    await user.click(button(vi.configure.doneBackToReview));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(vi.review.title);
    const row = document.querySelector('[data-group="hem"]')!;
    expect(row).toHaveTextContent(vi.options['hem.turnUp'].label);
    expect(document.querySelector('[data-group="closure"]')).toHaveTextContent(vi.options['closure.sb2'].label);
  });
});

describe('A10–A11 confirmation and revisions', () => {
  it('A10: rapid repeated clicks give one design confirmation, then the order is confirmed on its own screen', async () => {
    const user = userEvent.setup();
    await begin(user, 'trousers', 'preset');
    await user.click(button(vi.configure.openReview));
    const confirm = button(vi.review.confirm);
    act(() => {
      confirm.click();
      confirm.click();
      confirm.click();
    });

    // the design is confirmed; the order details come next
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(vi.order.title);
    expect(button(vi.order.confirm)).toBeDisabled();
    expect(screen.getByText(vi.order.confirmBlocked)).toBeInTheDocument();

    await fillAndConfirmOrder(user);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(vi.confirmed.title);
    expect(screen.getByText('MQ-0001')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Lần xác nhận 1')).toBeInTheDocument();
    expect(button(vi.confirmed.exportPdf)).toBeInTheDocument();
  });

  it('the order screen explains what is wrong with a phone number and keeps the confirm button off', async () => {
    const user = userEvent.setup();
    await begin(user, 'trousers', 'preset');
    await user.click(button(vi.configure.openReview));
    await user.click(button(vi.review.confirm));
    await user.type(screen.getByLabelText(vi.order.orderId), 'MQ-9');
    await user.type(screen.getByLabelText(vi.order.customer), 'Lan');
    await user.type(screen.getByLabelText(vi.order.phone), '12ab');
    await user.tab();
    expect(screen.getByText(vi.order.errorPhone)).toBeInTheDocument();
    expect(button(vi.order.confirm)).toBeDisabled();
  });

  it('A11: editing keeps the old version until reconfirmed, then shows the new one with only that change marked', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer', 'preset');
    await user.click(button(vi.configure.openReview));
    await user.click(button(vi.review.confirm));
    await fillAndConfirmOrder(user);
    expect(screen.getByText('Lần xác nhận 1')).toBeInTheDocument();

    await user.click(button(vi.confirmed.edit));
    expect(screen.getByText(/Bản đã xác nhận \(lần 1\) vẫn giữ nguyên/)).toBeInTheDocument();
    expect(button(vi.review.confirm)).toBeDisabled(); // nothing changed yet

    await user.click(button('Chỉnh sửa: Xẻ sau'));
    await pick(user, 'vents.single');
    await user.click(button(vi.configure.doneBackToReview));

    // the earlier confirmed version is still reachable and unchanged
    await user.click(button(vi.review.viewConfirmed));
    expect(document.querySelector('[data-group="vents"]')).toHaveTextContent(vi.options['vents.double'].label);
    await user.click(button(vi.confirmed.edit));

    await user.click(button(vi.review.confirm));
    // the details typed for version 1 are still there; the order is confirmed again for version 2
    expect(screen.getByLabelText(vi.order.orderId)).toHaveValue('MQ-0001');
    await user.click(button(vi.order.confirm));
    expect(screen.getByText('Lần xác nhận 2')).toBeInTheDocument();
    expect(document.querySelector('[data-group="vents"]')).toHaveTextContent(vi.options['vents.single'].label);
    const changed = document.querySelectorAll('.sheet-row.is-changed');
    expect(changed).toHaveLength(1);
    expect(changed[0]).toHaveTextContent(vi.options['vents.double'].label);
  });
});

describe('A12 new session', () => {
  it('asks before discarding, then starts clean', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer', 'preset');
    await user.click(button(vi.newSession));

    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: vi.reset.cancel }));
    expect(option('closure.sb2')).toHaveAttribute('aria-pressed', 'true'); // kept

    await user.click(button(vi.newSession));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: vi.reset.confirm }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(vi.start.title);

    await user.click(product('blazer'));
    await user.click(button(vi.start.cta));
    expect(option('closure.sb2')).toHaveAttribute('aria-pressed', 'false');
    expect(button(vi.configure.openReview)).toBeInTheDocument();
  });

  it('resets straight away when there is nothing to lose', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    await user.click(button(vi.newSession));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(vi.start.title);
  });
});

describe('A14 keyboard', () => {
  it('can complete a choice with the keyboard; modal traps focus, closes on Escape and restores focus', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');

    const ask = button(vi.configure.askHouse);
    ask.focus();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    // Tab cycles inside the dialog and never escapes it
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(ask).toHaveFocus();

    option('closure.sb1').focus();
    await user.keyboard(' ');
    expect(option('closure.sb1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('every option card has an accessible name and a separate enlarge control', async () => {
    const user = userEvent.setup();
    await begin(user, 'blazer');
    expect(option('closure.sb1')).toHaveAccessibleName(/Một hàng 1 khuy/);
    await user.click(button(/Phóng to hình: Một hàng 1 khuy/));
    expect(screen.getByRole('dialog', { name: vi.options['closure.sb1'].label })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Start screen', () => {
  it('requires a product and never pre-selects design options in the manual flow', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(button(vi.start.cta)).toBeDisabled();
    expect(screen.getByText(vi.start.needProduct)).toBeInTheDocument();
    await user.click(product('suit'));
    expect(button(vi.start.cta)).toBeEnabled();
    await user.click(button(vi.start.cta));
    expect(document.querySelectorAll('[data-option][aria-pressed="true"]')).toHaveLength(0);
  });

  it('shows the demo indicator but asks for no personal information', () => {
    render(<App />);
    expect(screen.getByText(vi.demoBadge)).toBeInTheDocument();
    expect(document.querySelectorAll('input, textarea, select')).toHaveLength(0);
  });
});

import type { OrderForm } from '../state/types';

export type OrderField = keyof OrderForm;
export type OrderError = 'required' | 'tooLong' | 'phoneInvalid';

const LIMITS: Record<OrderField, number> = { orderId: 40, customerName: 80, phone: 20 };

/** Digits in a phone number, ignoring spaces, dots, dashes, brackets and a leading +. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function cleanOrder(form: OrderForm): OrderForm {
  return {
    orderId: form.orderId.trim(),
    customerName: form.customerName.trim().replace(/\s+/g, ' '),
    phone: form.phone.trim().replace(/\s+/g, ' '),
  };
}

/** What is wrong with each field (empty object = the order can be confirmed). */
export function validateOrder(form: OrderForm): Partial<Record<OrderField, OrderError>> {
  const f = cleanOrder(form);
  const errors: Partial<Record<OrderField, OrderError>> = {};
  (Object.keys(LIMITS) as OrderField[]).forEach((k) => {
    if (!f[k]) errors[k] = 'required';
    else if (f[k].length > LIMITS[k]) errors[k] = 'tooLong';
  });
  if (!errors.phone) {
    const d = phoneDigits(f.phone).length;
    if (!/^[+\d(][\d\s().-]*$/.test(f.phone) || d < 8 || d > 15) errors.phone = 'phoneInvalid';
  }
  return errors;
}

export const isOrderValid = (form: OrderForm) => Object.keys(validateOrder(form)).length === 0;

import type { Lang } from '../state/types';
import type { Copy } from './copy';
import { en } from './en';
import { vi } from './vi';

const COPY: Record<Lang, Copy> = { vi, en };

export function getCopy(lang: Lang): Copy {
  return COPY[lang];
}

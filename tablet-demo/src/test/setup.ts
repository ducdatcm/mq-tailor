import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  try {
    window.sessionStorage.clear();
  } catch {
    /* storage unavailable */
  }
});

afterEach(() => cleanup());

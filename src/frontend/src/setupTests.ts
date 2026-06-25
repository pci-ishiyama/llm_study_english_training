import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom は scrollIntoView を実装していないため、モックを追加
Element.prototype.scrollIntoView = function () {
  // no-op in test environment
};

afterEach(() => {
  cleanup();
});

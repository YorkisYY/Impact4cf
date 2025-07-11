import 'whatwg-fetch';
import '@jest/globals';
import '@testing-library/jest-dom';

declare global {
  interface JestMatchers<R> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp): R;
    // Add other matchers used in your tests
    toBeVisible(): R;
    toContainElement(element: HTMLElement | null): R;
    toHaveAttribute(attr: string, value?: string): R;
  }
}

// Mock BroadcastChannel for Node environment
global.BroadcastChannel = class {
  constructor() {}
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
} as any;
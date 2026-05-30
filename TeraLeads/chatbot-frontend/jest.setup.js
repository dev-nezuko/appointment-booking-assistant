// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock
if (typeof window !== 'undefined') {
  window.localStorage = localStorageMock
}

// Mock window.location
delete window.location
window.location = { href: '' }


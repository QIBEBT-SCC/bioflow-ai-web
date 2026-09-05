import '@testing-library/jest-dom/vitest'

Element.prototype.scrollIntoView = () => undefined

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver

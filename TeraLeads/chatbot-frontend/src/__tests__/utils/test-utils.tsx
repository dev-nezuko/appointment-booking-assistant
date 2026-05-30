import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '@/state/store'

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: AllTheProviders,
    ...options,
  })
}

export * from '@testing-library/react'
export { customRender as render }

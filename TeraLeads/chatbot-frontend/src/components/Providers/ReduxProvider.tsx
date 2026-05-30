'use client'

import { Provider } from 'react-redux'
import { store } from '@/state/store'

interface ReduxProviderProps {
  children: React.ReactNode
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>
}

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: string
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface AppointmentInfo {
  date: string
  time: string
  type?: string
  status?: string
}

interface ChatState {
  messages: Message[]
  sessionId: string | null
  isLoading: boolean
  connectionStatus: ConnectionStatus
  error: string | null
  pendingAppointment: AppointmentInfo | null
}

const initialState: ChatState = {
  messages: [],
  sessionId: null,
  isLoading: false,
  connectionStatus: 'disconnected',
  error: null,
  pendingAppointment: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setPendingAppointment: (state, action: PayloadAction<AppointmentInfo | null>) => {
      state.pendingAppointment = action.payload
    },
    clearChat: (state) => {
      state.messages = []
      state.sessionId = null
      state.error = null
      state.pendingAppointment = null
    },
  },
})

export const {
  setSessionId,
  addMessage,
  setMessages,
  setLoading,
  setConnectionStatus,
  setError,
  setPendingAppointment,
  clearChat,
} = chatSlice.actions
export default chatSlice.reducer


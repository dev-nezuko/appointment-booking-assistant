import chatReducer, {
  addMessage,
  setSessionId,
  setMessages,
  setLoading,
  setConnectionStatus,
  setError,
  clearChat,
} from '@/state/slices/chatSlice'

describe('chatSlice', () => {
  const initialState = {
    messages: [],
    sessionId: null,
    isLoading: false,
    connectionStatus: 'disconnected' as const,
    error: null,
    pendingAppointment: null,
  }

  it('should return initial state', () => {
    expect(chatReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle setSessionId', () => {
    const sessionId = 'session-123'
    const actual = chatReducer(initialState, setSessionId(sessionId))

    expect(actual.sessionId).toBe(sessionId)
  })

  it('should handle addMessage', () => {
    const message = {
      id: '1',
      text: 'Hello',
      sender: 'user' as const,
      timestamp: '2024-01-01T00:00:00Z',
    }
    const actual = chatReducer(initialState, addMessage(message))

    expect(actual.messages).toHaveLength(1)
    expect(actual.messages[0]).toEqual(message)
  })

  it('should handle setMessages', () => {
    const messages = [
      {
        id: '1',
        text: 'Hello',
        sender: 'user' as const,
        timestamp: '2024-01-01T00:00:00Z',
      },
    ]
    const actual = chatReducer(initialState, setMessages(messages))

    expect(actual.messages).toEqual(messages)
  })

  it('should handle setLoading', () => {
    expect(chatReducer(initialState, setLoading(true)).isLoading).toBe(true)
    expect(chatReducer(initialState, setLoading(false)).isLoading).toBe(false)
  })

  it('should handle setConnectionStatus', () => {
    const actual = chatReducer(initialState, setConnectionStatus('connected'))

    expect(actual.connectionStatus).toBe('connected')
  })

  it('should handle setError', () => {
    const error = 'Something went wrong'
    const actual = chatReducer(initialState, setError(error))

    expect(actual.error).toBe(error)
  })

  it('should handle clearChat', () => {
    const stateWithData = {
      messages: [{ id: '1', text: 'Hi', sender: 'user' as const, timestamp: '' }],
      sessionId: 'session-1',
      isLoading: false,
      connectionStatus: 'connected' as const,
      error: 'error',
      pendingAppointment: { date: '2024-01-01', time: '10:00' },
    }
    const actual = chatReducer(stateWithData, clearChat())

    expect(actual.messages).toHaveLength(0)
    expect(actual.sessionId).toBeNull()
    expect(actual.error).toBeNull()
  })
})

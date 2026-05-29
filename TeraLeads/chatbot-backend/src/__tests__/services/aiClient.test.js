const aiClient = require('../../services/aiClient')

const reply = (body, init = { status: 200 }) =>
  Promise.resolve(new Response(JSON.stringify(body), init))

afterEach(() => {
  jest.restoreAllMocks()
})

describe('aiClient.sendMessage', () => {
  it('posts the turn in the shape the FastAPI model expects', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation(() => reply({ response: 'ok', metadata: {} }))

    await aiClient.sendMessage({ sessionId: 'session-1', message: 'hi', userId: '4' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/chat$/)
    expect(JSON.parse(init.body)).toEqual({ session_id: 'session-1', message: 'hi', user_id: 4 })
  })

  it('reads the booking state from metadata', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      reply({
        response: 'Is this correct?',
        metadata: {
          status: 'ready_to_book',
          appointment_data: { date: '2030-01-10', time: '11:00:00', service_type: 'Check-up' },
        },
      })
    )

    const result = await aiClient.sendMessage({ sessionId: 's', message: 'm', userId: 1 })

    expect(result.booking).toEqual({
      status: 'ready_to_book',
      missingFields: [],
      alternatives: [],
      appointment: { date: '2030-01-10', time: '11:00', type: 'Check-up' },
    })
  })

  it('turns a non-2xx answer into a 502 with the status in the message', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() => reply({ detail: 'boom' }, { status: 503 }))

    await expect(
      aiClient.sendMessage({ sessionId: 's', message: 'm', userId: 1 })
    ).rejects.toMatchObject({ statusCode: 502, message: expect.stringContaining('503') })
  })

  it('reports an unreachable service as a 502', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

    await expect(
      aiClient.sendMessage({ sessionId: 's', message: 'm', userId: 1 })
    ).rejects.toMatchObject({ statusCode: 502 })
  })
})

describe('toBooking', () => {
  it('returns null when the AI service sent no status', () => {
    expect(aiClient.toBooking(undefined)).toBeNull()
    expect(aiClient.toBooking({})).toBeNull()
  })

  it('trims offered slots to HH:MM', () => {
    const booking = aiClient.toBooking({
      status: 'unavailable',
      missing_fields: ['time'],
      alternatives: ['09:00:00', '09:30:00'],
    })
    expect(booking.alternatives).toEqual(['09:00', '09:30'])
    expect(booking.appointment).toBeNull()
  })
})

type ApiErrorResponse = {
  status?: number
  data?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getApiErrorResponse(error: unknown): ApiErrorResponse | undefined {
  if (!isRecord(error) || !isRecord(error.response)) return undefined

  return {
    status: typeof error.response.status === 'number' ? error.response.status : undefined,
    data: isRecord(error.response.data) ? error.response.data : undefined,
  }
}

export function getApiErrorMessage(error: unknown): string | undefined {
  const message = getApiErrorResponse(error)?.data?.message
  return typeof message === 'string' ? message : undefined
}

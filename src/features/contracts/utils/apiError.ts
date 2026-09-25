import axios from "axios"

interface ErrorBody {
  code?: string
  message?: string
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return undefined
  }
  return error.response?.data?.code
}

export function getApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return undefined
  }
  return error.response?.data?.message
}

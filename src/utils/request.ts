import Taro from '@tarojs/taro'
import { API_BASE, ROUTES } from '@/constants'

export interface ApiErrorShape {
  status: number
  code: string
  detail: string
}

export class ApiError extends Error {
  status: number
  code: string
  detail: string

  constructor(shape: ApiErrorShape) {
    super(shape.detail || shape.code)
    this.status = shape.status
    this.code = shape.code
    this.detail = shape.detail
  }
}

export function readToken(): string {
  return Taro.getStorageSync('rak-control:v2:access_token') || ''
}

export function setToken(token: string) {
  if (token) Taro.setStorageSync('rak-control:v2:access_token', token)
  else Taro.removeStorageSync('rak-control:v2:access_token')
}

let redirecting = false

async function recoverSession() {
  setToken('')
  if (redirecting) return
  redirecting = true
  try {
    await Taro.reLaunch({ url: ROUTES.login })
  } finally {
    redirecting = false
  }
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: Record<string, unknown>
  auth?: boolean
}

/** 真 API 预留；当前业务走 local-db service */
export async function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, auth = true } = options
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (auth) {
    const token = readToken()
    if (token) header.Authorization = `Bearer ${token}`
  }

  try {
    const res = await Taro.request({
      url: url.startsWith('http') ? url : `${API_BASE}${url}`,
      method,
      data,
      header,
      timeout: 15000,
    })
    const status = res.statusCode
    const body = res.data as Record<string, unknown>
    if (status >= 200 && status < 300) return body as T

    const code = String((body as { code?: string })?.code || 'internal_error')
    const detail = String((body as { detail?: string })?.detail || '请求失败')
    const err = new ApiError({ status, code, detail })
    if ((status === 401 || status === 403) && auth) await recoverSession()
    throw err
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError({
      status: 0,
      code: 'network_error',
      detail: '网络异常，请稍后重试',
    })
  }
}

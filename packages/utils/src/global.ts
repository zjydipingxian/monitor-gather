import type { Breadcrumb, TransportData } from 'monitor-core'
import type { EventTypes } from 'monitor-shared'
import type { Logger } from './logger'
import { UAParser } from 'ua-parser-js'
import { variableTypeDetection } from './is'

// Monitor的全局变量
export interface MonitorSupport {
  logger: Logger
  hasError: false // 某段时间代码是否报错
  _loopTimer: number // 白屏循环检测的timer
  transportData: TransportData // 数据上报
  options?: { [key: string]: any }
  replaceFlag: {
    // 订阅消息
    [key in EventTypes]?: boolean
  }
  deviceInfo: {
    // 设备信息
    [key: string]: any
  }
  breadcrumb: Breadcrumb
}

interface MonitorGlobal {
  console?: Console
  __Monitor__?: MonitorSupport
}

// 检查当前执行环境是否为Node.js环境。
export const isNodeEnv = variableTypeDetection.isProcess(
  typeof process !== 'undefined' ? process : 0,
)

// 检查当前环境是否为浏览器环境。
export const isBrowserEnv = variableTypeDetection.isWindow(
  typeof window !== 'undefined' ? window : 0,
)
export function getGlobal<T>() {
  if (isBrowserEnv) {
    return window as unknown as MonitorGlobal & T
  }
  if (isNodeEnv) {
    return process as unknown as MonitorGlobal & T
  }
}

const _global = getGlobal<Window>()
const _support = getGlobalMonitorSupport()

const uaResult = new UAParser().getResult()

// 获取设备信息
_support.deviceInfo = {
  browserVersion: uaResult.browser.version, // 浏览器版本号 107.0.0.0
  browser: uaResult.browser.name, // 浏览器类型 Chrome
  osVersion: uaResult.os.version, // 操作系统 电脑系统 10
  os: uaResult.os.name, // Windows
  ua: uaResult.ua,
  device: uaResult.device.model ? uaResult.device.model : 'Unknow',
  device_type: uaResult.device.type ? uaResult.device.type : 'Pc',
}

_support.replaceFlag = _support.replaceFlag || {}
const replaceFlag = _support.replaceFlag

export function getFlag(replaceType: EventTypes): boolean {
  return !!replaceFlag[replaceType]
}

export function setFlag(replaceType: EventTypes, isSet: boolean): void {
  if (replaceFlag[replaceType])
    return
  replaceFlag[replaceType] = isSet
}

// 获取全部变量__Monitor__的引用地址
export function getGlobalMonitorSupport() {
  _global.__Monitor__ = _global.__Monitor__ || ({} as MonitorSupport)
  return _global.__Monitor__
}

export function supportsHistory(): boolean {
  const chrome = (_global as any).chrome
  const isChromePackagedApp = chrome && chrome.app && chrome.app.runtime
  const hasHistoryApi
    = 'history' in _global
    && !!(_global.history as History).pushState
    && !!(_global.history as History).replaceState
  return !isChromePackagedApp && hasHistoryApi
}

export { _global, _support }

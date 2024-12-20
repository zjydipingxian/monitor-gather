import type { Callback, IAnyObject } from '@zhongjiayao/monitor-types'
import { globalVar } from '@zhongjiayao/monitor-shared'
import { variableTypeDetection } from './is'
import { logger } from './logger'

// 获取当前的时间戳
export function getTimestamp(): number {
  return Date.now()
}

export function typeofAny(target: any): string {
  return Object.prototype.toString.call(target).slice(8, -1).toLowerCase()
}

// 验证选项的类型
export function validateOption(target: any, targetName: string, expectType: string): any {
  if (!target)
    return

  if (typeofAny(target) === expectType)
    return true
  console.error(`${targetName}期望传入${expectType}类型，目前是${typeofAny(target)}类型`)
}

export function generateUUID(): string {
  let d = new Date().getTime()
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return uuid
}

export function getLocationHref(): string {
  if (typeof document === 'undefined' || document.location == null)
    return ''
  return document.location.href
}

/**
 *
 * 重写对象上面的某个属性
 * ../param source 需要被重写的对象
 * ../param name 需要被重写对象的key
 * ../param replacement 以原有的函数作为参数，执行并重写原有函数
 * ../param isForced 是否强制重写（可能原先没有该属性）
 * ../returns void
 */
export function replaceAop(
  source: IAnyObject,
  name: string,
  replacement: Callback,
  isForced = false,
) {
  if (source === undefined)
    return
  if (name in source || isForced) {
    const original = source[name]
    const wrapped = replacement(original)
    if (typeof wrapped === 'function') {
      source[name] = wrapped
    }
  }
}

export function on(target: any, eventName: string, handler: Callback, options = false) {
  target.addEventListener(eventName, handler, options)
}

export function interceptStr(str: string, interceptLength: number): string {
  if (variableTypeDetection.isString(str)) {
    return (
      str.slice(0, interceptLength)
      + (str.length > interceptLength ? `:截取前${interceptLength}个字符` : '')
    )
  }
  return ''
}

export function unknownToString(target: unknown): string {
  if (variableTypeDetection.isString(target)) {
    return target as string
  }
  if (variableTypeDetection.isUndefined(target)) {
    return 'undefined'
  }
  return JSON.stringify(target)
}

export function throttle(fn: any, delay: number) {
  let canRun = true
  return function (this: any, ...args: any[]) {
    if (!canRun)
      return
    fn.apply(this, args)
    canRun = false
    setTimeout(() => {
      canRun = true
    }, delay)
  }
}

/**
 * 获取版本号的主版本号
 * @param version 版本号
 * @returns 主版本号
 */
export function getBigVersion(version: string) {
  return Number(version.split('.')[0])
}

/**
 * 静默console
 * @param callback 回调函数
 */
// eslint-disable-next-line ts/no-unsafe-function-type
export function silentConsoleScope(callback: Function) {
  globalVar.isLogAddBreadcrumb = false
  callback()
  globalVar.isLogAddBreadcrumb = true
}

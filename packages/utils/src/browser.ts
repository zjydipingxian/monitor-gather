import { EventTypes } from 'monitor-shared'
import { _support, setFlag } from './global'

export function setSilentFlag({
  silentXhr = true,
  silentFetch = true,
  silentClick = true,
  silentHistory = true,
  silentError = true,
  silentHashchange = true,
  silentUnhandledrejection = true,
  silentWhiteScreen = false,
  silentConsole = false,
}): void {
  setFlag(EventTypes.XHR, !silentXhr)
  setFlag(EventTypes.FETCH, !silentFetch)
  setFlag(EventTypes.CLICK, !silentClick)
  setFlag(EventTypes.HISTORY, !silentHistory)
  setFlag(EventTypes.ERROR, !silentError)
  setFlag(EventTypes.HASHCHANGE, !silentHashchange)
  setFlag(EventTypes.UNHANDLEDREJECTION, !silentUnhandledrejection)
  setFlag(EventTypes.WHITESCREEN, !silentWhiteScreen)
  setFlag(EventTypes.CONSOLE, !silentConsole)
}

export function htmlElementAsString(target: HTMLElement): string {
  const tagName = target.tagName.toLowerCase()
  if (tagName === 'body') {
    return ''
  }
  let classNames = target.classList.value

  classNames = classNames !== '' ? ` class='${classNames}'` : ''
  const id = target.id ? ` id="${target.id}"` : ''
  // eslint-disable-next-line unicorn/prefer-dom-node-text-content
  const innerText = target.innerText
  return `<${tagName}${id}${classNames !== '' ? classNames : ''}>${innerText}</${tagName}>`
}

/**
 * 将地址字符串转换成对象，
 * 输入：'https://github.com/xy-sea/web-see?token=123&name=11'
 * 输出：{
 *  "host": "github.com",
 *  "path": "/xy-sea/web-see",
 *  "protocol": "https",
 *  "relative": "/xy-sea/web-see?token=123&name=11"
 * }
 */
export function parseUrlToObj(url: string) {
  if (!url) {
    return {}
  }
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/)
  if (!match) {
    return {}
  }
  const query = match[6] || ''
  const fragment = match[8] || ''
  return {
    host: match[4],
    path: match[5],
    protocol: match[2],
    relative: match[5] + query + fragment,
  }
}

// 对每一个错误详情，生成唯一的编码
export function getErrorUid(input: string): string {
  return window.btoa(encodeURIComponent(input))
}

export function hashMapExist(hash: string): boolean {
  const exist = _support.errorMap.has(hash)
  if (!exist) {
    _support.errorMap.set(hash, true)
  }
  return exist
}

import type { voidFun } from 'monitor-shared'
import { promises } from 'node:dns'
import { notify, options, subscribeEvent, transportData } from 'monitor-core'
import { EventTypes, HttpTypes } from 'monitor-shared'
import { EMethods, type ReplaceHandler } from 'monitor-types'
import { _global, getGlobalMonitorSupport, getLocationHref, getTimestamp, isExistProperty, logger, on, replaceAop, supportsHistory, throttle, variableTypeDetection } from 'monitor-utils'

/**
 * 根据不同的事件类型，调用相应的替换/监听函数
 * 用于初始化各种监听器
 */
/**
 * 根据不同的事件类型，调用相应的替换/监听函数
 * 用于初始化各种监听器
 */
function replace(type: EventTypes): void {
  switch (type) {
    case EventTypes.WHITESCREEN:
      whiteScreen() // 白屏监控
      break
    case EventTypes.XHR:
      xhrReplace() // XMLHttpRequest 请求监控
      break
    case EventTypes.FETCH:
      fetchReplace() // Fetch 请求监控
      break
    case EventTypes.ERROR:
      listenError() // 全局错误监控
      break
    case EventTypes.HISTORY:
      historyReplace() // 路由历史控
      break
    case EventTypes.UNHANDLEDREJECTION:
      unhandledrejectionReplace() // Promise 未处理异常监控
      break
    case EventTypes.CLICK:
      domReplace() // DOM点击事件监控
      break
    case EventTypes.HASHCHANGE:
      listenHashchange() // hash路由变化监控
      break
    default:
      break
  }
}

function whiteScreen() {
  logger.warn('暂未支持 whiteScreen')
}

/**
 * 重写 XMLHttpRequest 的相关方法来实现请求监控
 */
function xhrReplace() {
  if (!('XMLHttpRequest' in _global)) {
    return
  }

  const originalXhrProto = XMLHttpRequest.prototype

  // 重写 open 方法，记录请求的初始信息
  replaceAop(originalXhrProto, 'open', (originalOpen: voidFun) => {
    return function (this: any, ...args: any[]): void {
      // 在 xhr 对象上添加监控数据
      this.monitor_xhr = {
        method: variableTypeDetection.isString(args[0]) ? args[0].toUpperCase() : args[0],
        url: args[1],
        sTime: getTimestamp(), // 记录请求开始时间
        type: HttpTypes.XHR,
      }
      originalOpen.apply(this, args)
    }
  })

  // 重写 send 方法，添加请求完成的监听器
  replaceAop(originalXhrProto, 'send', (originalSend: voidFun) => {
    return function (this: any, ...args: any[]): void {
      const { method, url } = this.monitor_xhr

      // 监听请求完成事件
      on(this, 'loadend', function (this: any) {
        // 过滤掉监控上报的请求和用户配置需要过滤的请求
        if (
          (method === EMethods.Post && transportData.isSdkTransportUrl(url))
          || isFilterHttpUrl(url)
        ) {
          return
        }

        // 收集响应数据
        const { responseType, response, status } = this
        this.monitor_xhr.requestData = args[0]
        const eTime = getTimestamp()
        this.monitor_xhr.time = this.monitor_xhr.sTime
        this.monitor_xhr.Status = status

        // 处理响应数据，只在接口出错时保存
        if (['', 'json', 'text'].includes(responseType)) {
          if (options.handleHttpStatus && typeof options.handleHttpStatus == 'function') {
            this.monitor_xhr.response = response && variableTypeDetection.isString(response) ? response : JSON.parse(response)
          }
        }

        // 计算请求耗时
        this.monitor_xhr.elapsedTime = eTime - this.monitor_xhr.sTime
        // 通知订阅者
        notify(EventTypes.XHR, this.monitor_xhr)
      })
      originalSend.apply(this, args)
    }
  })
}

function fetchReplace() {
  if (!('fetch' in _global)) {
    logger.warn('不支持fetch')
    return
  }

  replaceAop(_global, 'fetch', (originalFetch: voidFun) => {
    return function (url: any, config: Partial<Request> = {}): void {
      const sTime = getTimestamp()
      const method = (config && config.method) || 'GET'

      let fetchData = {
        type: HttpTypes.FETCH,
        method,
        requestData: config && config.body,
        url,
        response: '',
      }
      // 获取配置的headers
      const headers = new Headers(config.headers || {})

      Object.assign(headers, {
        setRequestHeader: headers.set,
      })
      config = Object.assign({}, config, headers)

      return originalFetch.apply(_global, [url, config]).then((res: Response) => {
        // 克隆一份，防止被标记已消费
        const tempRes = res.clone()
        const eTime = getTimestamp()

        fetchData = Object.assign({}, fetchData, {
          elapsedTime: eTime - sTime,
          Status: tempRes.status,
          time: sTime,
        })

        tempRes.text().then((data: any) => {
          // 同理，进接口进行过滤
          if (
            (method === EMethods.Post && transportData.isSdkTransportUrl(url))
            || isFilterHttpUrl(url)
          ) {
            return
          }
          // 用户设置handleHttpStatus函数来判断接口是否正确，只有接口报错时才保留response
          if (options.handleHttpStatus && typeof options.handleHttpStatus == 'function') {
            fetchData.response = data
          }
          notify(EventTypes.FETCH, fetchData)
        })
      })
    }
  })
}
function listenError() {
  on(
    _global,
    'error',
    (e: ErrorEvent) => {
      notify(EventTypes.ERROR, e)
    },
    true,
  )
}

let lastHref: string = getLocationHref()
/**
 * 监控路由变化
 * 包括 history API 的变化和 popstate 事件
 */
function historyReplace() {
  // 是否支持history
  if (!supportsHistory()) {
    logger.warn('不支持history')
    return
  };

  const oldOnpopstate = _global.onpopstate

  // 重写 popstate 事件处理
  _global.onpopstate = function (this: any, ...args: any): void {
    const to = getLocationHref()
    const from = lastHref
    lastHref = to
    // 通知路由变化
    notify(EventTypes.HISTORY, {
      from,
      to,
    })

    oldOnpopstate && oldOnpopstate.apply(this, args)
  }

  /**
   * 创建一个包装函数来重写 history.pushState 和 history.replaceState 方法
   * @param originalHistoryFn 原始的 history 方法 (pushState 或 replaceState)
   * @returns 包装后的新函数
   */

  function historyReplaceFn(originalHistoryFn: voidFun): voidFun {
    return function (this: any, ...args: any[]): void {
      // 获取 URL 参数 (在 pushState/replaceState 中是第三个参数)
      // pushState/replaceState 的参数格式为: (state, title, url?)
      const url = args.length > 2 ? args[2] : undefined

      if (url) {
        const from = lastHref // 记录跳转前的 URL
        const to = String(url) // 转换目标 URL 为字符串
        lastHref = to // 更新最后访问的 URL

        // 触发路由变化事件，通知订阅者
        notify(EventTypes.HISTORY, {
          from, // 跳转前的 URL
          to, // 跳转后的 URL
        })
      }

      // 调用原始的 history 方法，保持原有功能
      return originalHistoryFn.apply(this, args)
    }
  }

  // 重写 history 相关方法
  replaceAop(_global.history, 'pushState', historyReplaceFn)
  replaceAop(_global.history, 'replaceState', historyReplaceFn)
}

/**
 * 监听全局未处理的 Promise 异常
 * 当 Promise 被拒绝但没有对应的 catch 处理时触发
 */
function unhandledrejectionReplace() {
  // 监听全局的 unhandledrejection 事件
  // 该事件在 Promise 被拒绝且没有处理程序时触发
  on(_global, EventTypes.UNHANDLEDREJECTION, (ev: PromiseRejectionEvent) => {
    // ev.promise：被拒绝的 Promise 对象
    // ev.reason：Promise 被拒绝的原因

    // 通知订阅者有未处理的 Promise 异常发生
    notify(EventTypes.UNHANDLEDREJECTION, ev)
  })
}

/**
 * 监听全局的点击事件
 * 用于收集用户的点击行为数据
 */
function domReplace() {
  // 检查环境中是否存在 document 对象
  // 如果不存在则直接返回，避免在非浏览器环境中执行
  if (!('document' in _global))
    return

  // 节流，默认0s
  const clickThrottle = throttle(notify, options.throttleDelayTime)

  // 为 document 添加点击事件监听器
  // 参数说明:
  // - _global.document: 监听目标
  // - 'click': 监听的事件类型
  // - 回调函数: 当点击事件发生时执行
  // - true: 使用事件捕获而不是事件冒泡
  on(
    _global.document,
    'click',
    function (this: any): void {
      clickThrottle(EventTypes.CLICK, {
        category: 'click',
        data: this,
      })
    },
    true,
  )
}

function listenHashchange() {
  // 通过onpopstate事件，来监听hash模式下路由的变化
  if (isExistProperty(_global, 'onhashchange')) {
    on(_global, EventTypes.HASHCHANGE, (e: HashChangeEvent) => {
      notify(EventTypes.HASHCHANGE, e)
    })
  }
}

export function addReplaceHandler(handler: ReplaceHandler) {
  if (!subscribeEvent(handler)) {
    return
  }
  replace(handler.type as EventTypes)
}

// 判断当前接口是否为需要过滤掉的接口
function isFilterHttpUrl(url: string): boolean {
  return options.filterXhrUrlRegExp && options.filterXhrUrlRegExp.test(url)
}

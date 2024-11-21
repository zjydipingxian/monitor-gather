import { breadcrumb } from 'monitor-core'
import { EventTypes, STATUS_CODE } from 'monitor-shared'
import { getTimestamp, htmlElementAsString } from 'monitor-utils'
import { HandleEvents } from './handleEvents'
import { addReplaceHandler } from './replace'

export function setupReplace(): void {
  // 白屏检测
  addReplaceHandler({
    type: EventTypes.WHITESCREEN,
    callback: () => {
      // TODO
    },
  })

  // 重写XMLHttpRequest
  addReplaceHandler({
    callback: (data) => {
      HandleEvents.handleHttp(data, EventTypes.XHR)
    },
    type: EventTypes.XHR,

  })

  // 重写fetch
  addReplaceHandler({
    callback: (data) => {
      HandleEvents.handleHttp(data, EventTypes.FETCH)
    },
    type: EventTypes.FETCH,
  })

  // 捕获错误
  addReplaceHandler({
    callback: (error) => {
      HandleEvents.handleError(error)
    },
    type: EventTypes.ERROR,
  })

  // 添加handleUnhandledRejection事件   也就是 promise catch
  addReplaceHandler({
    callback: (data) => {
      HandleEvents.handleUnhandledRejection(data)
    },
    type: EventTypes.UNHANDLEDREJECTION,
  })

  // 监听点击事件
  addReplaceHandler({
    callback: (data) => {
      const htmlString = htmlElementAsString(data.data.activeElement as HTMLElement)
      if (htmlString) {
        breadcrumb.push({
          type: EventTypes.CLICK,
          status: STATUS_CODE.OK,
          category: breadcrumb.getCategory(EventTypes.CLICK),
          data: htmlString,
          time: getTimestamp(),
        })
      }
    },
    type: EventTypes.CLICK,
  })

  // 监听hashchange事件
  addReplaceHandler({
    callback: (e: HashChangeEvent) => {
      HandleEvents.handleHashchange(e)
    },
    type: EventTypes.HASHCHANGE,
  })

  // 监听history模式路由的变化
  addReplaceHandler({
    callback: (data) => {
      HandleEvents.handleHistory(data)
    },
    type: EventTypes.HISTORY,
  })
}

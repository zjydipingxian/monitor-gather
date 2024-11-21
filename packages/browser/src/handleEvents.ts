import type { ErrorTarget, HttpData, RouteHistory } from 'monitor-types'
import ErrorStackParser from 'error-stack-parser'
import { breadcrumb, httpTransform, options, resourceTransform, transportData } from 'monitor-core'
import { EventTypes, STATUS_CODE } from 'monitor-shared'
import { getTimestamp, isError, parseUrlToObj, unknownToString } from 'monitor-utils'

export const HandleEvents = {
  // 处理xhr、fetch回调
  handleHttp: (data: HttpData, type: EventTypes) => {
    const result = httpTransform(data)

    // 添加用户行为，去掉自身上报的接口行为
    if (!data.url.includes(options.dsn)) {
      breadcrumb.push({
        type,
        category: breadcrumb.getCategory(type),
        data: result,
        status: result.status as STATUS_CODE,
        time: data.time,
      })
    }

    if (result.status === 'error') {
      // 上报接口错误
      transportData.send({ ...result, type, status: STATUS_CODE.ERROR })
    }
  },
  handleError(ev: ErrorTarget): Promise<void> {
    const target = ev.target

    // JS 代码
    if (!target || (ev.target && !ev.target.localName)) {
      const stackFrame = ErrorStackParser.parse(!target ? ev : ev.error)[0]
      const { fileName, columnNumber, lineNumber } = stackFrame
      const errorData = {
        type: EventTypes.ERROR,
        status: STATUS_CODE.ERROR,
        time: getTimestamp(),
        message: ev.message,
        fileName,
        line: lineNumber,
        column: columnNumber,
      }

      breadcrumb.push({
        type: EventTypes.ERROR,
        category: breadcrumb.getCategory(EventTypes.ERROR),
        data: errorData,
        time: getTimestamp(),
        status: STATUS_CODE.ERROR,
      })

      return transportData.send(errorData)
    }

    // 资源加载报错
    if (target?.localName) {
      // 提取资源加载的信息
      const data = resourceTransform(target)
      breadcrumb.push({
        type: EventTypes.RESOURCE,
        category: breadcrumb.getCategory(EventTypes.RESOURCE),
        status: STATUS_CODE.ERROR,
        time: getTimestamp(),
        data,
      })

      return transportData.send({
        ...data,
        type: EventTypes.RESOURCE,
        status: STATUS_CODE.ERROR,
      })
    }
  },

  // 处理未处理的 Promise 拒绝
  handleUnhandledRejection(ev: PromiseRejectionEvent): void {
    const data = {
      type: EventTypes.UNHANDLEDREJECTION,
      status: STATUS_CODE.ERROR,
      time: getTimestamp(),
      message: unknownToString(ev.reason),
    }

    if (isError(ev.reason)) {
      data.message = unknownToString(ev.reason.message || ev.reason.stack)
    }

    breadcrumb.push({
      type: EventTypes.UNHANDLEDREJECTION,
      category: breadcrumb.getCategory(EventTypes.UNHANDLEDREJECTION),
      time: getTimestamp(),
      status: STATUS_CODE.ERROR,
      data,
    })

    if (isError(ev.reason)) {
      const stackFrame = ErrorStackParser.parse(ev.reason)[0]
      const { fileName, columnNumber, lineNumber } = stackFrame
      transportData.send({ ...data, fileName, line: lineNumber, column: columnNumber })
      return
    }

    transportData.send(data)
  },

  // 处理 hash模式
  handleHashchange(data: HashChangeEvent): void {
    const { oldURL, newURL } = data

    const { relative: from } = parseUrlToObj(oldURL)
    const { relative: to } = parseUrlToObj(newURL)

    breadcrumb.push({
      type: EventTypes.HASHCHANGE,
      category: breadcrumb.getCategory(EventTypes.HASHCHANGE),
      data: {
        from,
        to,
      },
      time: getTimestamp(),
      status: STATUS_CODE.OK,
    })
  },

  // 处理 history 模式
  handleHistory(data: RouteHistory): void {
    const { from, to } = data
    // 定义parsedFrom变量，值为relative
    const { relative: parsedFrom } = parseUrlToObj(from)
    const { relative: parsedTo } = parseUrlToObj(to)
    breadcrumb.push({
      type: EventTypes.HISTORY,
      category: breadcrumb.getCategory(EventTypes.HISTORY),
      data: {
        from: parsedFrom || '/',
        to: parsedTo || '/',
      },
      time: getTimestamp(),
      status: STATUS_CODE.OK,
    })
  },
}

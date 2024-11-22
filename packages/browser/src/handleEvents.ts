import type { ErrorTarget, HttpData, RouteHistory } from 'monitor-types'
import ErrorStackParser from 'error-stack-parser'
import { breadcrumb, httpTransform, options, resourceTransform, transportData } from 'monitor-core'
import { BreadCrumbTypes, EventTypes, STATUS_CODE } from 'monitor-shared'
import { getErrorUid, getTimestamp, hashMapExist, isError, parseUrlToObj, unknownToString } from 'monitor-utils'

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
  /**
   * 处理错误事件
   * 包括 JS 运行时错误和资源加载错误
   * @param ev 错误事件对象
   */
  handleError(ev: ErrorTarget): Promise<void> {
    const target = ev.target

    // 处理 JS 运行时错误
    // 当没有target或target没有localName时,说明是JS错误而不是资源加载错误
    if (!target || (ev.target && !ev.target.localName)) {
      // 解析错误堆栈信息
      const stackFrame = ErrorStackParser.parse(!target ? ev : ev.error)[0]
      const { fileName, columnNumber, lineNumber } = stackFrame

      // 构建错误数据对象
      const errorData = {
        type: EventTypes.ERROR,
        status: STATUS_CODE.ERROR,
        time: getTimestamp(), // 获取错误发生时间戳
        message: ev.message, // 错误信息
        fileName, // 发生错误的文件名
        line: lineNumber, // 发生错误的行号
        column: columnNumber, // 发生错误的列号
      }

      // 添加到用户行为追踪
      breadcrumb.push({
        type: EventTypes.ERROR,
        category: breadcrumb.getCategory(EventTypes.ERROR),
        data: errorData,
        time: getTimestamp(),
        status: STATUS_CODE.ERROR,
      })

      const hash: string = getErrorUid(
        `${EventTypes.ERROR}-${ev.message}-${fileName}-${columnNumber}`,
      )

      // 开启repeatCodeError第一次报错才上报
      if (!options.repeatCodeError || (options.repeatCodeError && !hashMapExist(hash))) {
        // 上报错误数据
        return transportData.send(errorData)
      }
    }

    // 处理资源加载错误(如图片、脚本等)
    // target.localName存在说明是HTML元素(资源)加载错误
    if (target?.localName) {
      // 通过resourceTransform提取资源加载的详细信息
      const data = resourceTransform(target)

      // 添加到用户行为追踪
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

  /**
   * 处理未捕获的Promise异常
   * @param ev PromiseRejectionEvent 事件对象,包含了Promise被拒绝的原因
   */
  handleUnhandledRejection(ev: PromiseRejectionEvent): void {
    // 构建基础的错误数据对象
    const data = {
      type: EventTypes.UNHANDLEDREJECTION, // 事件类型为未处理的Promise异常
      status: STATUS_CODE.ERROR, // 状态码为错误
      time: getTimestamp(), // 获取当前时间戳
      message: unknownToString(ev.reason), // 将错误原因转换为字符串
    }

    // 如果错误原因是Error对象,则使用其message或stack作为错误信息
    if (isError(ev.reason)) {
      data.message = unknownToString(ev.reason.message || ev.reason.stack)
    }

    // 将错误信息添加到用户行为追踪系统
    breadcrumb.push({
      type: EventTypes.UNHANDLEDREJECTION,
      category: breadcrumb.getCategory(EventTypes.UNHANDLEDREJECTION),
      time: getTimestamp(),
      status: STATUS_CODE.ERROR,
      data,
    })

    // 如果错误原因是Error对象,则解析其堆栈信息
    if (isError(ev.reason)) {
      // 解析错误堆栈获取文件名、行号、列号等信息
      const stackFrame = ErrorStackParser.parse(ev.reason)[0]
      const { fileName, columnNumber, lineNumber } = stackFrame

      const hash: string = getErrorUid(
        `${EventTypes.UNHANDLEDREJECTION}-${data.message}-${fileName}-${columnNumber}`,
      )
      // 开启repeatCodeError第一次报错才上报
      if (!options.repeatCodeError || (options.repeatCodeError && !hashMapExist(hash))) {
        // 发送包含详细错误位置的数据
        transportData.send({ ...data, fileName, line: lineNumber, column: columnNumber })
        return
      }
    }

    const hash: string = getErrorUid(
      `${EventTypes.UNHANDLEDREJECTION}-${data.message}`,
    )
    if (!options.repeatCodeError || (options.repeatCodeError && !hashMapExist(hash))) {
      // 如果不是Error对象,则只发送基础错误数据
      transportData.send(data)
    }
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

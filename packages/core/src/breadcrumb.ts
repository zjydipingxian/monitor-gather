import type { BreadcrumbData, InitOptions } from 'monitor-types'
import { BreadCrumbTypes, EventTypes } from 'monitor-shared'
import { _support, getTimestamp, validateOption } from 'monitor-utils'

export class Breadcrumb {
  maxBreadcrumbs = 20 // 用户行为存放的最大长度
  beforePushBreadcrumb: unknown = null // 用于存储用户自定义的在添加行为之前的处理函数
  stack: BreadcrumbData[]
  constructor() {
    this.stack = []
  }

  // 添加用户行为
  push(data: BreadcrumbData) {
    // 判断是不是 beforePushBreadcrumb 函数
    if (typeof this.beforePushBreadcrumb === 'function') {
      const result = this.beforePushBreadcrumb(data) as BreadcrumbData
      if (!result)
        return
      this.immediatePush(result)

      return
    }

    this.immediatePush(data)
  }

  // 立即添加
  immediatePush(data: BreadcrumbData): void {
    data.time || (data.time = getTimestamp())

    // 栈溢出最先那个移除出去
    if (this.stack.length >= this.maxBreadcrumbs) {
      this.stack.shift()
    }

    this.stack.push(data)
    this.stack.sort((a, b) => a.time - b.time)
  }

  // 移除并返回堆栈中的第一个元素
  shift(): boolean {
    return this.stack.shift() !== undefined
  }

  clear(): void {
    this.stack = []
  }

  // 返回堆栈中的所有行为数据
  getStack(): BreadcrumbData[] {
    return this.stack
  }

  // 据事件类型返回对应的行为类别
  getCategory(type: EventTypes): BreadCrumbTypes {
    switch (type) {
      // 接口请求
      case EventTypes.XHR:
      case EventTypes.FETCH:
        return BreadCrumbTypes.HTTP

        // 用户点击
      case EventTypes.CLICK:
        return BreadCrumbTypes.CLICK

      // 路由变化
      case EventTypes.HISTORY:
      case EventTypes.HASHCHANGE:
        return BreadCrumbTypes.ROUTE

      // 加载资源
      case EventTypes.RESOURCE:
        return BreadCrumbTypes.RESOURCE

      // Js代码报错
      case EventTypes.UNHANDLEDREJECTION:
      case EventTypes.ERROR:
        return BreadCrumbTypes.CODE_ERROR

      // 用户自定义
      default:
        return BreadCrumbTypes.CUSTOMER
    }
  }

  // 用于绑定初始化选项，例如设置 maxBreadcrumbs 和 beforePushBreadcrumb
  bindOptions(options: InitOptions): void {
    const { maxBreadcrumbs, beforePushBreadcrumb } = options
    validateOption(maxBreadcrumbs, 'maxBreadcrumbs', 'number')
    && (this.maxBreadcrumbs = maxBreadcrumbs || 20)

    validateOption(beforePushBreadcrumb, 'beforePushBreadcrumb', 'function')
    && (this.beforePushBreadcrumb = beforePushBreadcrumb)
  }
}

const breadcrumb = _support.breadcrumb || (_support.breadcrumb = new Breadcrumb())
export { breadcrumb }

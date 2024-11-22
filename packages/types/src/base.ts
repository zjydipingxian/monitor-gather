import type { EventTypes } from '@zhongjiayao/monitor-shared'
import type { BreadcrumbData } from './breadcrumb'

export interface Callback {
  (...args: any[]): any
}

export interface IAnyObject {
  [key: string]: any
}

export interface ReplaceHandler {
  type: EventTypes
  callback: Callback
}

/**
 * 资源加载失败
 */
export interface ResourceError {
  time: number
  message: string // 加载失败的信息
  name: string // 脚本类型：js脚本
}

export interface ResourceTarget {
  src?: string
  href?: string
  localName?: string
}

/**
 * 代码错误
 */
export interface CodeError {
  column: number
  line: number
  message: string
  fileName: string // 发出错误的文件
}

/**
 * http请求
 */
export interface HttpData {
  type?: string
  method?: string
  time: number
  url: string // 接口地址
  elapsedTime: number // 接口时长
  message: string // 接口信息
  Status?: number // 接口状态编码
  status?: string // 接口状态
  requestData?: {
    httpType: string // 请求类型 xhr fetch
    method: string // 请求方式
    data: any
  }
  response?: {
    Status: number // 接口状态
    data?: any
  }
}

/**
 * 上报的数据接口
 */

export interface ReportData extends HttpData, ResourceError, CodeError {
  type: string // 事件类型
  pageUrl: string // 页面地址
  time: number // 发生时间
  uuid: string // 页面唯一标识
  apiKey: string // 项目id
  status: string // 事件状态
  sdkVersion: string // 版本信息
  breadcrumb?: BreadcrumbData[] // 用户行为

  // 设备信息
  deviceInfo: {
    browserVersion: string | number // 版本号
    browser: string // Chrome
    osVersion: string | number // 电脑系统 10
    os: string // 设备系统
    ua: string // 设备详情
    device: string // 设备种类描述
    device_type: string // 设备种类，如pc
  }
  [key: string]: any
}

export interface ErrorTarget {
  target?: {
    localName?: string
  }
  error?: any
  message?: string
}

export interface RouteHistory {
  from: string
  to: string
}

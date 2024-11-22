import ErrorStackParser from 'error-stack-parser'
import { EventTypes, STATUS_CODE } from 'monitor-shared'
import { getTimestamp, isError, logger, unknownToString } from 'monitor-utils'
import { breadcrumb } from './breadcrumb'
import { transportData } from './reportData'

/**
 * 自定义事件上报函数
 * @param options 上报参数对象
 * @param {string} options.message - 自定义消息，默认为'customMsg'
 * @param {any} options.error - 错误对象，默认为空字符串
 * @param {EventTypes} options.type - 事件类型，默认为CUSTOM
 */
export function log({ message = 'customMsg', error = '', type = EventTypes.CUSTOM }: any): void {
  try {
    // 初始化错误信息对象
    let errorInfo = {}

    // 如果传入的是错误对象，解析错误堆栈信息
    if (isError(error)) {
      // 使用ErrorStackParser解析错误堆栈，获取第一帧信息
      const result = ErrorStackParser.parse(!error.target ? error : error.error || error.reason)[0]
      // 提取行号和列号信息
      errorInfo = { ...result, line: result.lineNumber, column: result.columnNumber }
    }

    // 将事件添加到用户行为追踪系统
    breadcrumb.push({
      type, // 事件类型
      status: STATUS_CODE.ERROR, // 状态码
      category: breadcrumb.getCategory(EventTypes.CUSTOM), // 事件分类
      data: unknownToString(message), // 消息内容
      time: getTimestamp(), // 时间戳
    })

    // 发送数据到服务器
    transportData.send({
      type, // 事件类型
      status: STATUS_CODE.ERROR, // 状态码
      message: unknownToString(message), // 消息内容
      time: getTimestamp(), // 时间戳
      ...errorInfo, // 错误详细信息（如果存在）
    })
  }
  catch (error) {
    // 如果上报过程中出现错误，记录到日志
    logger.error('上报自定义事件时报错：', error)
  }
}

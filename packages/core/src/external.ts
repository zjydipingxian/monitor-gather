import ErrorStackParser from 'error-stack-parser'
import { EventTypes, STATUS_CODE } from 'monitor-shared'
import { getTimestamp, isError, logger, unknownToString } from 'monitor-utils'
import { breadcrumb } from './breadcrumb'
import { transportData } from './reportData'
// 自定义上报事件
export function log({ message = 'customMsg', error = '', type = EventTypes.CUSTOM }: any): void {
  try {
    let errorInfo = {}

    if (isError(error)) {
      const result = ErrorStackParser.parse(!error.target ? error : error.error || error.reason)[0]
      errorInfo = { ...result, line: result.lineNumber, column: result.columnNumber }
    }

    breadcrumb.push({
      type,
      status: STATUS_CODE.ERROR,
      category: breadcrumb.getCategory(EventTypes.CUSTOM),
      data: unknownToString(message),
      time: getTimestamp(),
    })

    transportData.send({
      type,
      status: STATUS_CODE.ERROR,
      message: unknownToString(message),
      time: getTimestamp(),
      ...errorInfo,
    })
  }
  catch (error) {
    logger.error('上报自定义事件时报错：', error)
  }
}

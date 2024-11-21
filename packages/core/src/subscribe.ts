import type { EventTypes } from 'monitor-shared'
import type { ReplaceHandler } from 'monitor-types'
import { getFlag, nativeTryCatch, setFlag } from 'monitor-utils'

type ReplaceCallback = (data: any) => void
const handlers: { [key in EventTypes]?: ReplaceCallback[] } = {}

export function subscribeEvent(handler: ReplaceHandler): boolean {
  if (!handler || getFlag(handler.type))
    return

  setFlag(handler.type, true)
  handlers[handler.type] = handlers[handler.type] || []
  handlers[handler.type]?.push(handler.callback)

  return true
}

export function notify(type: EventTypes, data?: any): void {
  if (!type || !handlers[type])
    return

  // 获取对应事件的回调函数并执行，回调函数为addReplaceHandler事件中定义的事件
  handlers[type]?.forEach((callback) => {
    nativeTryCatch(
      () => {
        callback(data)
      },
      () => {

      },
    )
  })
}

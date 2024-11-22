import type { BreadCrumbTypes, EventTypes, STATUS_CODE } from '@zhongjiayao/monitor-shared'

export interface BreadcrumbData {
  type: EventTypes // 事件类型
  category: BreadCrumbTypes // 用户入栈行为类型
  status: STATUS_CODE // 行为状态
  time: number // 发生时间
  data: any
}

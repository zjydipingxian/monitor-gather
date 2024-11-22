export type voidFun = () => void

export enum HttpTypes {
  XHR = 'xhr',
  FETCH = 'fetch',
}

/**
 * 事件类型
 */
export enum EventTypes {
  XHR = 'xhr',
  FETCH = 'fetch',
  CLICK = 'click',
  HISTORY = 'history',
  ERROR = 'error',
  HASHCHANGE = 'hashchange',
  UNHANDLEDREJECTION = 'unhandledrejection', // promise
  RESOURCE = 'resource',
  DOM = 'dom',
  VUE = 'Vue',
  REACT = 'react',
  CUSTOM = 'custom',
  CONSOLE = 'console',
  PERFORMANCE = 'performance',
  WHITESCREEN = 'whiteScreen',
}

export enum HTTP_CODE {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
}

/**
 * 状态
 */
export enum STATUS_CODE {
  ERROR = 'error',
  OK = 'ok',
}

/**
 * 用户行为
 */
export enum BreadCrumbTypes {
  HTTP = 'Http',
  CLICK = 'click',
  ROUTE = 'Route',
  CUSTOMER = 'custom', // 自定义事件
  XHR = 'xhr',
  FETCH = 'fetch',
  UNHANDLEDREJECTION = 'unhandledrejection',
  VUE = 'Vue',
  RESOURCE = 'resource', // 资源加载事件
  CODE_ERROR = 'Code Error', // 代码错误
}

/**
 * 接口错误状态
 *
 *
 */
export enum SpanStatus {
  // 表示操作成功完成
  Ok = 'ok',

  // 表示操作超时
  DeadlineExceeded = 'deadline_exceeded',

  // 表示未通过身份验证
  Unauthenticated = 'unauthenticated',

  // 表示权限不足
  PermissionDenied = 'permission_denied',

  // 表示资源未找到
  NotFound = 'not_found',

  // 表示资源耗尽
  ResourceExhausted = 'resource_exhausted',

  // 表示参数无效
  InvalidArgument = 'invalid_argument',

  // 表示功能未实现
  Unimplemented = 'unimplemented',

  // 表示服务不可用
  Unavailable = 'unavailable',

  // 表示内部错误
  InternalError = 'internal_error',

  // 表示未知错误
  UnknownError = 'unknown_error',

  // 表示操作被取消
  Cancelled = 'cancelled',

  // 表示资源已存在
  AlreadyExists = 'already_exists',

  // 表示前置条件失败
  FailedPrecondition = 'failed_precondition',

  // 表示操作被中止
  Aborted = 'aborted',

  // 表示超出范围
  OutOfRange = 'out_of_range',

  // 表示数据丢失
  DataLoss = 'data_loss',
}

const globalVar = {
  isLogAddBreadcrumb: true,
  crossOriginThreshold: 1000,
}
export { globalVar }

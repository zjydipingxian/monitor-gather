import type { InitOptions } from '@zhongjiayao/monitor-types'
import { initOptions, log } from '@zhongjiayao/monitor-core'
import { SDK_NAME, SDK_VERSION } from '@zhongjiayao/monitor-shared'
import { _global } from '@zhongjiayao/monitor-utils'
import { setupReplace } from './load'

/**
 * 浏览器环境下的初始化函数
 * @param options 初始化配置项
 */
function webInit(options: InitOptions): void {
  // 检查必要的配置项：dsn和apiKey是否存在
  if (!options.dsn || !options.apiKey) {
    return console.error(`缺少必须配置项：${!options.dsn ? 'dsn' : 'apiKey'} `)
  }

  // 检查环境是否支持XMLHttpRequest / fetch，以及监控是否被禁用
  if ((!('XMLHttpRequest' in _global) || !('fetch' in _global)) || options.disabled) {
    return
  }

  // 初始化配置项
  initOptions(options)
  // 设置替换函数，用于拦截和处理各种事件
  setupReplace()
}

/**
 * SDK的主要初始化入口函数
 * @param options 初始化配置项
 */
function init(options: InitOptions): void {
  webInit(options)
}

// 导出必要的函数和常量
export { init, log, SDK_NAME, SDK_VERSION }

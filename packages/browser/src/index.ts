import type { InitOptions } from 'monitor-types'
import { initOptions, log } from 'monitor-core'
import { SDK_NAME, SDK_VERSION } from 'monitor-shared'
import { _global } from 'monitor-utils'
import { setupReplace } from './load'

function webInit(options: InitOptions): void {
  if (!options.dsn || !options.apiKey) {
    return console.error(`缺少必须配置项：${!options.dsn ? 'dsn' : 'apiKey'} `)
  }
  if (!('XMLHttpRequest' in _global) || options.disabled) {
    return
  }
  initOptions(options)
  setupReplace()
}
function init(options: InitOptions): void {
  webInit(options)
}

export { init, log, SDK_NAME, SDK_VERSION }

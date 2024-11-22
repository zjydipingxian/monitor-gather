import type { InitOptions } from '@zhongjiayao/monitor-types'
import type { ViewModel, VueInstance } from './types'
import { init } from '@zhongjiayao/monitor-browser'
import { EventTypes } from '@zhongjiayao/monitor-shared'
import { getFlag, setFlag, silentConsoleScope } from '@zhongjiayao/monitor-utils'
import { handleVueError } from './helper'

const hasConsole = typeof console !== 'undefined'

const MonitorVue = {
  install(Vue: VueInstance, options: InitOptions): void {
    if (getFlag(EventTypes.VUE) || !Vue || !Vue.config) {
      return
    }
    setFlag(EventTypes.VUE, true)

    // vue项目在Vue.config.errorHandler中上报错误
    Vue.config.errorHandler = function (err: Error, vm: ViewModel, info: string): void {
      // eslint-disable-next-line no-useless-call
      handleVueError.apply(null, [err, vm, info, Vue])

      if (hasConsole && !Vue.config.silent) {
        silentConsoleScope(() => {
          console.error(`Error in ${info}: "${err.toString()}"`, vm)
          console.error(err)
        })
      }
    }

    init(options)
  },
}

export { MonitorVue }

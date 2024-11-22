import type { ViewModel, VueInstance } from './types'
import { EventTypes } from '@null/monitor-shared'
import { getFlag, setFlag, silentConsoleScope } from '@null/monitor-utils'
import { handleVueError } from './helper'

const hasConsole = typeof console !== 'undefined'

const MonitorVue = {
  install(Vue: VueInstance): void {
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
  },
}

export { MonitorVue }

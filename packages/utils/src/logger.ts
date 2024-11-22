import { _global, _support } from './global'
import { variableTypeDetection } from './is'

const PREFIX = '@null/monitor Logger'
export class Logger {
  private enabled = false
  private _console: Console = {} as Console

  constructor() {
    _global.console = console || _global.console
    if (console || _global.console) {
      const logType = [
        'log',
        'debug',
        'info',
        'warn',
        'error',
        'assert',
      ] as const
      logType.forEach((level) => {
        if (!_global.console) {
          return
        }
        if (!(level in _global.console)) {
          return
        }
        (this._console as any)[level] = _global.console[level]
      })
    }
  }

  disable(): void {
    this.enabled = false
  }

  bindOptions(debug: boolean = true): void {
    if (variableTypeDetection.isNull(debug) || variableTypeDetection.isUndefined(debug)) {
      debug = true
    }
    this.enabled = !!debug
  }

  enable(): void {
    this.enabled = true
  }

  getEnableStatus() {
    return this.enabled
  }

  log(...args: any[]): void {
    if (!this.enabled) {
      return
    }
    this._console.log(`${PREFIX}[Log]:`, ...args)
  }

  warn(...args: any[]): void {
    if (!this.enabled) {
      return
    }
    this._console.warn(`${PREFIX}[Warn]:`, ...args)
  }

  error(...args: any[]): void {
    if (!this.enabled) {
      return
    }
    this._console.error(`${PREFIX}[Error]:`, ...args)
  }
}

const logger = _support.logger || (_support.logger = new Logger())
export { logger }

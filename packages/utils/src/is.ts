export const nativeToString = Object.prototype.toString

function isType(type: string) {
  return function (value: any) {
    return nativeToString.call(value) === `[object ${type}]`
  }
}

/**
 * 检测变量类型
 * @param type
 */
export const variableTypeDetection = {
  isNumber: isType('Number'),
  isString: isType('String'),
  isBoolean: isType('Boolean'),
  isNull: isType('Null'),
  isUndefined: isType('Undefined'),
  isSymbol: isType('Symbol'),
  isFunction: isType('Function'),
  isObject: isType('Object'),
  isArray: isType('Array'),
  isProcess: isType('process'),
  isWindow: isType('Window'),
}

export function isEmpty(wat: any): boolean {
  return (
    (variableTypeDetection.isString(wat) && wat.trim() === '')
    || wat === undefined
    || wat === null
  )
}

export function isError(error: Error): boolean {
  switch (nativeToString.call(error)) {
    case '[object Error]':
      return true
    case '[object Exception]':
      return true
    case '[object DOMException]':
      return true
    default:
      return false
  }
}

export function isExistProperty(obj: any, key: any): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

import type { ViewModel, VueInstance } from './types'
import { breadcrumb, transportData } from '@zhongjiayao/monitor-core'
import { EventTypes, STATUS_CODE } from '@zhongjiayao/monitor-shared'
import { getBigVersion, getLocationHref, getTimestamp, variableTypeDetection } from '@zhongjiayao/monitor-utils'

export function handleVueError(err: Error, vm: ViewModel, info: string, Vue: VueInstance) {
  const version = Vue?.version

  let data = {
    type: EventTypes.ERROR,
    status: STATUS_CODE.ERROR,
    message: `${err.message}(${info})`,
    url: getLocationHref(),
    name: err.name,
    time: getTimestamp(),
  }

  if (variableTypeDetection.isString(version)) {
    switch (getBigVersion(version)) {
      case 2:
        data = { ...data, ...vue2VmHandler(vm) }
        break
      case 3:
        data = { ...data, ...vue3VmHandler(vm) }
        break
    }
  }

  breadcrumb.push({
    type: EventTypes.VUE,
    category: breadcrumb.getCategory(EventTypes.VUE),
    data,
    status: STATUS_CODE.ERROR,
    time: getTimestamp(),
  })

  // 发送数据
  transportData.send(data)
}

function vue2VmHandler(vm: ViewModel) {
  let componentName = ''
  if (vm.$root === vm) {
    componentName = 'root'
  }
  else {
    const name = vm._isVue
      ? (vm.$options && vm.$options.name)
      || (vm.$options && vm.$options._componentTag)
      : vm.name
    componentName
      = (name ? `component <${name}>` : 'anonymous component')
      + (vm._isVue && vm.$options && vm.$options.__file
        ? ` at ${vm.$options && vm.$options.__file}`
        : '')
  }
  return {
    componentName,
    propsData: vm.$options && vm.$options.propsData,
  }
}
function vue3VmHandler(vm: ViewModel) {
  let componentName = ''
  if (vm.$root === vm) {
    componentName = 'root'
  }
  else {
    // eslint-disable-next-line no-console
    console.log(vm.$options)
    const name = vm.$options && vm.$options.name
    componentName = name ? `component <${name}>` : 'anonymous component'
  }
  return {
    componentName,
    propsData: vm.$props,
  }
}

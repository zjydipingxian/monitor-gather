import type { IAnyObject } from '@zhongjiayao/monitor-types'

export interface VueInstance {
  // 允许添加任意字符串键的属性，值可以是任意类型
  [key: string]: any

  // Vue 的配置对象，类型是 VueConfiguration
  config: VueConfiguration

  // Vue 的版本号
  version: string

  // Vue 的混入方法，用于注入生命周期钩子或其他选项
  mixin: (hooks: { [key: string]: () => void }) => void

  // Vue 的工具方法对象
  util: {
    // 警告输出方法
    warn: (...input: any) => void
  }
}

export interface VueConfiguration {
  // 是否取消 Vue 所有的日志与警告
  silent?: boolean

  // 全局错误处理函数
  // err: 错误对象
  // vm: 发生错误的组件实例
  // info: Vue特定的错误信息，比如错误发生的生命周期钩子
  errorHandler?: (err: Error, vm: ViewModel, info: string) => void

  // 全局警告处理函数
  // msg: 警告信息
  // vm: 组件实例
  // trace: 组件层级关系追踪
  warnHandler?: (msg: string, vm: ViewModel, trace: string) => void

  // 自定义按键修饰符别名
  // 可以用来给键码设置别名
  // 例如: { 'enter': 13 }
  keyCodes?: { [key: string]: number | Array<number> }
}

// ViewModel接口定义了Vue组件实例的结构
export interface ViewModel {
  // 允许添加任意字符串键的属性，值可以是任意类型
  [key: string]: any

  // $root表示当前组件树的根Vue实例
  // Record<string, unknown>表示一个对象，键是字符串，值是unknown类型
  $root?: Record<string, unknown>

  // $options包含了当前组件的选项配置
  $options?: {
    // 允许添加任意字符串键的属性
    [key: string]: any
    // 组件的名称
    name?: string
    // 传递给组件的props数据
    propsData?: IAnyObject
    // 组件在模板中使用的标签名
    _componentTag?: string
    // 组件文件的路径
    __file?: string
    // 组件接收的props定义
    props?: IAnyObject
  }

  // $props包含了传递给组件的所有prop值
  $props?: Record<string, unknown>
}

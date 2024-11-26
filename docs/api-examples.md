# 安装

::: tip :100: Node版本
Node.js >= 16.0.0
:::

::: code-group

```pnpm [pnpm]
pnpm install @zhongjiayao/monitor-web
```

```npm [npm]
npm install @zhongjiayao/monitor-web
```

```yarn [yarn]
yarn install @zhongjiayao/monitor-web
```

:::

## Vue2 安装说明

```js
import { init, MonitorVue } from '@zhongjiayao/monitor-web'

init({
  dsn: 'http://text.com/reportData', // 上报的地址
  apiKey: 'project1', // 项目唯一的id
  userId: '89757', // 用户id
  repeatCodeError: true, // 开启错误上报去重，重复的代码错误只上报一次
})

// 或者 直接使用插件模式

Vue.use(MonitorVue, {
  dsn: 'http://text.com/reportData', // 上报的地址
  apiKey: 'project1', // 项目唯一的id
  userId: '89757', // 用户id
  repeatCodeError: true, // 开启错误上报去重，重复的代码错误只上报一次
})
```

## Vue3 安装说明

```js
const app = createApp(App)
app.use(MonitorVue, {
  dsn: 'http://text.com/reportData',
  apiKey: 'project1',
  userId: '89757',
})
```

## web 安装说明

```js
<script src="https://unpkg.com/@zhongjiayao/monitor-web@0.1.5/dist/web-global.js"></script>
<script>
  window.monitorWeb.init({
    dsn: 'http://text.com/reportData',
    apiKey: 'project1',
    userId: '89757',
  })
</script>
```

## 常规配置项

|          Name          | Type       | Default | Description                                                                                                                                                                                                             |
| :--------------------: | ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|         `dsn`          | `string`   | `""`    | (必传项) 上报接口的地址，post 方法                                                                                                                                                                                      |
|        `apiKey`        | `string`   | `""`    | (必传项) 每个项目对应一个 apiKey，唯一标识                                                                                                                                                                              |
|        `userId`        | `string`   | `""`    | 用户 id                                                                                                                                                                                                                 |
|       `disabled`       | `boolean`  | `false` | 默认是开启 SDK，为 true 时，会将 sdk 禁用                                                                                                                                                                               |
|  `filterXhrUrlRegExp`  | `regExp`   | `null`  | 默认为空，所有的接口请求都会被监听，不为空时，filterXhrUrlRegExp.test(xhr.url)为 true 时过滤指定的接口                                                                                                                  |
|     `useImgUpload`     | `boolean`  | `false` | 为 true 时，使用图片打点上报的方式，参数通过 data=encodeURIComponent(reportData) 拼接到 url 上，默认为 false                                                                                                            |
|  `throttleDelayTime`   | `number`   | `0`     | 设置全局 click 点击事件的节流时间                                                                                                                                                                                       |
|       `overTime`       | `number`   | `10`    | 设置接口超时时长，默认 10s                                                                                                                                                                                              |
|    `maxBreadcrumbs`    | `number`   | `20`    | 用户行为存放的最大容量，超过 20 条，最早的一条记录会被覆盖掉                                                                                                                                                            |
|   `repeatCodeError`    | `boolean`  | `false` | 是否开启去除重复的代码报错，开启的话重复的代码错误只上报一次                                                                                                                                                            |
| `beforePushBreadcrumb` | `function` | `null`  | (自定义 hook) 添加到行为列表前的 hook，有值时，所有的用户行为都要经过该 hook 处理，若返回 false，该行为不会添加到列表中                                                                                                 |
|   `beforeDataReport`   | `function` | `null`  | (自定义 hook) 数据上报前的 hook，有值时，所有的上报数据都要经过该 hook 处理，若返回 false，该条数据不会上报                                                                                                             |
|   `handleHttpStatus`   | `function` | `null`  | (自定义 hook) 根据接口返回的 response 判断请求是否正确，返回 true 表示接口正常，反之表示接口报错(只有接口报错时才保留 response), 该函数的参数为 { url, response, requestData, elapsedTime, time, method, type, Status } |

## 默认监控配置项

|            Name            | Type      | Default | Description                                                           |
| :------------------------: | --------- | ------- | --------------------------------------------------------------------- |
|        `silentXhr`         | `boolean` | `true`  | 默认会监控 xhr，为 false 时，将不再监控                               |
|       `silentFetch`        | `boolean` | `true`  | 默认会监控 fetch，为 false 时，将不再监控                             |
|       `silentClick`        | `boolean` | `true`  | 默认会全局监听 click 点击事件，为 false                               |
|       `silentError`        | `boolean` | `true`  | 默认会监控 error，为 false 时，将不再监控                             |
| `silentUnhandledrejection` | `boolean` | `true`  | 默认会监控 unhandledrejection，为 false 时，将不再监控                |
|      `silentHistory`       | `boolean` | `true`  | 默认会监控 popstate、pushState、replaceState，为 false 时，将不再监控 |
|     `silentHashchange`     | `boolean` | `true`  | 默认会监控 hashchange，为 false 时，将不再监控                        |

## 错误去重

repeatCodeError 设置为 true 时，将开启一个缓存 map，存入已发生错误的 hash，上报错误时先判断该错误是否已存在，不存在则上报

在用户的一次会话中，如果产生了同一个错误，那么将这同一个错误上报多次是没有意义的；
在用户的不同会话中，如果产生了同一个错误，那么将不同会话中产生的错误进行上报是有意义的；

为什么有上面的结论呢？

在用户的同一次会话中，如果点击一个按钮出现了错误，那么再次点击同一个按钮，必定会出现同一个错误，而这出现的多次错误，影响的是同一个用户、同一次访问；所以将其全部上报是没有意义的；
而在同一个用户的不同会话中，如果出现了同一个错误，那么这不同会话里的错误进行上报就显得有意义了

monitor-gather 根据错误堆栈信息，将`错误信息、错误文件、错误行号`聚合生成一个 hash 值，是这个错误唯一的 ID

## 自定义 hook 示例

handleHttpStatus

```js
Vue.use(MonitorVue, {
  dsn: 'http://test.com/reportData',
  apiKey: 'abcd',
  // handleHttpStatus 返回true表示接口正常，反之表示接口报错
  handleHttpStatus(data) {
    const { url, response } = data
    // code为200，接口正常，反之亦然
    const { code } = typeof response === 'string' ? JSON.parse(response) : response
    if (url.includes('/getErrorList')) {
      return code === 200
    }
    else {
      return true
    }
  },
})
```

## 手动上报错误示例

```javascript
import { log } from '@zhongjiayao/monitor-web'

log({
  type: 'custom',
  message: '手动报错信息',
  error: new Error('报错'),
})
```

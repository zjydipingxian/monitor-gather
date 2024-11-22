console.log('initMonitor', monitorWeb)

Vue.use(monitorWeb.MonitorVue, {
  apiKey: "32323",
  userId: '123123', // 用户id
  debug: true,
  silentConsole: false,
  maxBreadcrumbs: 10,
  dsn: 'http://localhost:2021/errors/upload',
})

// window.monitorWeb.init();
console.log('initMonitor', monitorWeb)

RootVue.use(monitorWeb.MonitorVue)

window.monitorWeb.init({
  apiKey: "32323",
  userId: '123123', // 用户id
  debug: true,
  silentConsole: true,
  maxBreadcrumbs: 10,
  dsn: 'http://localhost:2021/errors/upload',
});
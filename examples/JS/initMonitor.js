

window.monitorWeb.init({
  apiKey: "32323",
  userId: '123123', // 用户id
  dsn: 'http://localhost:2021/errors/upload',
  debug: true,
  beforeDataReport(data) {
    data.zjy = '123123'
    return data
  },
  handleHttpStatus(data) {
    console.log("🚀 ~ handleHttpStatus ~ data:", data)
    return true
  }
})






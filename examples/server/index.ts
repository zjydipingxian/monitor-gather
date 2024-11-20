import http from 'http'
import chalk from 'chalk'
import express from 'express'
import open from 'open'
import { FilePaths, port, ServerUrls } from './config'

const app = express()
// eslint-disable-next-line no-console
const log = console.log

const url = `http://localhost:${port}/JS/index.html`

Object.entries(FilePaths).forEach(([path, resolvePath]) => {
  app.use(path, express.static(resolvePath))
})

// mock
app.get(ServerUrls.normalGet, (_req, res) => {
  res.send('get 正常请求响应体')
})

app.get(ServerUrls.exceptionGet, (_req, res) => {
  res.status(500).send('get 异常响应体!!!')
})

app.post(ServerUrls.normalPost, (_req, res) => {
  res.send('post 正常请求响应体')
})

app.post(ServerUrls.exceptionPost, (_req, res) => {
  res.status(500).send('post 异常响应体!!!')
})

app.post(ServerUrls.errorsUpload, (_req, res) => {
  res.send('错误上报成功')
})

const server = http.createServer(app)

server.listen(port, () => {})
if (process.env.NODE_ENV === 'demo') {
  log(
    chalk.white(
      `${chalk.green('➜ ')
      } examples is available at: ${
        chalk.green(`http://localhost:${port}`)}`,
    ),
  )
  // void open(url)
}
// console.log('1111')

import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/error/upload', () => {
    return HttpResponse.json({
      message: '上传成功',
    })
  }),
  http.get('/normal', () => {
    return HttpResponse.json({
      code: 200,
      message: '这是正常接口',
    })
  }),
]

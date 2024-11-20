import { resolve } from 'path'
export const port = 2021
const resolveDirname = (target: string) => resolve(__dirname, target)
const JsFilePath = resolveDirname('../JS')
const webFilePath = resolve('./packages/web/dist')

export const FilePaths = {
  '/JS': JsFilePath,
  '/webDist': webFilePath,
}
export const ServerUrls = {
  normalGet: '/normal',
  exceptionGet: '/exception',
  normalPost: '/normal/post',
  exceptionPost: '/exception/post',
  errorsUpload: '/errors/upload',
}

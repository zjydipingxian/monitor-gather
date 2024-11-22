import { resolve } from 'path'

export const port = 2021
const resolveDirname = (target: string) => resolve(__dirname, target)
const JsFilePath = resolveDirname('../JS')
const VueFilePath = resolveDirname('../Vue');
const Vue3FilePath = resolveDirname('../Vue3');
const webFilePath = resolve('./packages/web/dist')

export const FilePaths = {
  '/JS': JsFilePath,
  '/webDist': webFilePath,
  '/Vue': VueFilePath,
  '/Vue3': Vue3FilePath,
}
export const ServerUrls = {
  normalGet: '/normal',
  exceptionGet: '/exception',
  normalPost: '/normal/post',
  exceptionPost: '/exception/post',
  errorsUpload: '/errors/upload',
}

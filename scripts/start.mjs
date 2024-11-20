import { execa } from 'execa'

const examples = execa('pnpm', ['run', 'demo'], { stdio: 'inherit' })

// 启动 es-build-config 脚本
const esBuild = execa('pnpm', ['run', 'es-build:dev'], { stdio: 'inherit' })

// 启动 examples

esBuild.catch((error) => {
  console.error('esBuild 启动失败:', error)
  process.exit(1)
})

examples.catch((error) => {
  console.error('examples 脚本启动失败:', error)
  process.exit(1)
})

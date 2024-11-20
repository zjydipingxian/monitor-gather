import fs from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import chokidar from 'chokidar'
import { Presets, SingleBar } from 'cli-progress'
import esbuild from 'esbuild'
import minimist from 'minimist'
import ora from 'ora'

// 根目录
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// 获取 packages 下面的子包目录

const packagesDir = fs
  .readdirSync(resolve(__dirname, '../packages'))
  .filter((dir) => {
    // 过滤掉不是文件夹的目录
    return fs.statSync(resolve(__dirname, '../packages', dir)).isDirectory()
  })

// 获取当前环境
// eslint-disable-next-line node/prefer-global/process
const args = minimist(process.argv.slice(2))
const env = args._.length ? args._[0] : 'dev'
const isProduction = env === 'prod'
// 动态设置并发构建数量
// const maxConcurrentBuilds = Math.min(os.cpus().length, packagesDir.length)

// 开始记录构建时间
console.time('Total Build Time')

async function buildPackage(target) {
  const spinner = ora(`Building ${target}...`).start()

  // 构建函数
  const build = async () => {
    // 获取每个子包里面的 package.json 内容
    const pkg = require(`../packages/${target}/package.json`)

    const formats = ['iife', 'cjs', 'esm']
    const outdir = resolve(__dirname, '../packages', target, 'dist')

    await Promise.all(
      formats.map(format =>
        esbuild.build({
          entryPoints: [
            resolve(__dirname, '../packages', target, 'src', 'index.ts'),
          ],
          bundle: true,
          sourcemap: !isProduction, // 生产环境不生成 sourcemap
          minify: isProduction, // 生产环境进行代码压缩
          format,
          globalName: pkg.buildOptions?.name,
          outfile: resolve(
            outdir,
            `${target}-${format === 'iife' ? 'global' : format}.js`,
          ),
          // 根目录的 tsconfig.json
          tsconfig: resolve(__dirname, '../tsconfig.json'),
        }),
      ),
    )

    spinner.succeed(`Built ${target}`)
  }

  if (!isProduction) {
    // 初始化监听器
    const watcher = chokidar.watch([`./packages/${target}/src/**/*.ts`], {
      ignored: /(^|[/\\])\../,
    })

    // 监听文件添加、修改和删除事件
    watcher.on('add', build)
    watcher.on('change', build)
    watcher.on('unlink', build)
  }

  // 首次构建
  await build()
}

async function buildAllPackages() {
  const progressBar = new SingleBar({}, Presets.shades_classic)
  progressBar.start(packagesDir.length, 0)

  // 使用 Promise.all 并限制并发数量
  const concurrentBuilds = []
  for (let i = 0; i < packagesDir.length; i++) {
    const target = packagesDir[i]
    concurrentBuilds.push(buildPackage(target))
  }

  await Promise.all(concurrentBuilds)

  progressBar.stop()
  // 结束记录构建时间
  console.timeEnd('Total Build Time')
}

buildAllPackages().catch((error) => {
  console.error('Error building packages:', error)
  // eslint-disable-next-line node/prefer-global/process
  process.exit(1)
})

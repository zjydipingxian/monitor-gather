import os from 'os'
import esbuild from 'esbuild'
import minimist from 'minimist'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import fs from 'fs-extra'
import chokidar from 'chokidar'
import ora from 'ora'
import { SingleBar, Presets } from 'cli-progress'

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
const args = minimist(process.argv.slice(2))
const env = args._.length ? args._[0] : 'dev'
const isProduction = env === 'prod'
// 动态设置并发构建数量
const maxConcurrentBuilds = Math.min(os.cpus().length, packagesDir.length)

// 开始记录构建时间
console.time('Total Build Time')

const buildPackage = async (target) => {
  const spinner = ora(`Building ${target}...`).start()
  
  try {
    // 构建函数
    const build = async () => {
      try {
        // 获取每个子包里面的 package.json 内容
        const pkg = require(`../packages/${target}/package.json`)

        const formats = ['iife', 'cjs', 'esm']
        const outdir = resolve(__dirname, '../packages', target, 'dist')

        // 确保输出目录存在
        await fs.ensureDir(outdir)

        await Promise.all(
          formats.map((format) =>
            esbuild.build({
              entryPoints: [
                resolve(__dirname, '../packages', target, 'src', 'index.ts'),
              ],
              bundle: true,
              sourcemap: !isProduction,
              minify: isProduction,
              format: format,
              globalName: pkg.buildOptions?.name,
              outfile: resolve(
                outdir,
                `${target}-${format === 'iife' ? 'global' : format}.js`
              ),
              tsconfig: resolve(__dirname, '../tsconfig.json'),
              platform: 'browser',
              target: ['es2015'],
            }).catch(error => {
              spinner.fail(`Failed to build ${target} (${format}): ${error.message}`)
              throw error
            })
          )
        )

        spinner.succeed(`Built ${target}`)
      } catch (error) {
        spinner.fail(`Failed to build ${target}`)
        throw error
      }
    }

    if (!isProduction) {
      // 优化文件监听，添加防抖
      let timeoutId
      const debouncedBuild = () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          try {
            await build()
          } catch (error) {
            console.error(`Watch build failed for ${target}:`, error)
          }
        }, 100)
      }

      const watcher = chokidar.watch(
        resolve(__dirname, '../packages', target, 'src', '**/*.ts'),
        {
          ignored: /(^|[\/\\])\../,
          persistent: true,
          ignoreInitial: true,
          ignorePermissionErrors: true
        }
      )

      // 使用优化后的事件处理
      watcher.on('all', debouncedBuild)
      
      // 添加清理逻辑
      process.on('SIGINT', () => {
        watcher.close()
        process.exit(0)
      })
    }

    await build()
  } catch (error) {
    spinner.fail(`Failed to build ${target}`)
    throw error
  }
}

const buildAllPackages = async () => {
  const progressBar = new SingleBar({}, Presets.shades_classic)
  progressBar.start(packagesDir.length, 0)
  let completed = 0

  // 实现并发限制
  const limit = (fn, n) => {
    const queue = []
    const running = new Set()

    const next = () => {
      if (queue.length === 0 || running.size >= n) return
      const task = queue.shift()
      running.add(task)
      task().finally(() => {
        running.delete(task)
        next()
      })
    }

    return async (target) => {
      return new Promise((resolve, reject) => {
        queue.push(async () => {
          try {
            const result = await fn(target)
            completed++
            progressBar.update(completed)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
        next()
      })
    }
  }

  const limitedBuildPackage = limit(buildPackage, maxConcurrentBuilds)

  try {
    await Promise.all(packagesDir.map(target => limitedBuildPackage(target)))
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  } finally {
    progressBar.stop()
    console.timeEnd('Total Build Time')
  }
}

// 添加错误处理
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  process.exit(1)
})

buildAllPackages().catch((error) => {
  console.error('Error building packages:', error)
  process.exit(1)
})
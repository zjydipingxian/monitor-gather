import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs-extra'
import chalk from 'chalk';

import { rollup, watch } from 'rollup'
import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'; // 解析TypeScript
import { nodeResolve } from '@rollup/plugin-node-resolve'; // 查找和打包node_modules中的第三方模
import commonJS from '@rollup/plugin-commonjs'; // 查找和打包node_modules中的第三方模块
import terser from '@rollup/plugin-terser'

import ora from 'ora'
import minimist from 'minimist'
import { SingleBar, Presets } from 'cli-progress'

const __dirname = dirname(fileURLToPath(import.meta.url))
// 获取当前环境
const args = minimist(process.argv.slice(2))
const env = args._.length ? args._[0] : 'dev'
const isProduction = env === 'prod'
// 开发环境默认启用 watch，除非明确指定 --no-watch
const shouldWatch = !isProduction



// 获取所有包
const packagesDir = fs
  .readdirSync(resolve(__dirname, '../packages'))
  .filter((dir) => fs.statSync(resolve(__dirname, '../packages', dir)).isDirectory())

const createRollupConfig = (target) => {
  // 读取包的 package.json
  const pkg = fs.readJSONSync(resolve(__dirname, `../packages/${target}/package.json`))
  // 入口文件路径
  const input = resolve(__dirname, `../packages/${target}/src/index.ts`)




  // 定义输出格式
  const formats = [
    {
      format: 'es',  // ES Module 格式
      file: `packages/${target}/dist/${target}-esm.js`
    },
    {
      format: 'cjs',  // CommonJS 格式
      file: `packages/${target}/dist/${target}-cjs.js`
    },
    {
      format: 'iife',  // 浏览器可直接使用的格式
      file: `packages/${target}/dist/${target}-global.js`,
      name: pkg.buildOptions?.name || target.replace(/-/g, '_'),
    }
  ]

  // Rollup 插件配置
  const plugins = [
    json({
      namedExports: false,
    }),
    nodeResolve({
      preferBuiltins: true,
      extensions: ['.ts', '.js', '.json']  // 添加扩展名解析
    }),  // 解析 node_modules 中的依赖
    commonJS(),     // 将 CommonJS 模块转换为 ES Module
    typescript({    // 处理 TypeScript
      tsconfig: resolve(__dirname, '../tsconfig.json'),
      compilerOptions: {
        // 如果需要覆盖其他 tsconfig 选项，可以在这里添加
        sourceMap: !isProduction,
        declarationMap: !isProduction,
        resolveJsonModule: true,
        // 添加这个配置来覆盖 tsconfig.json 中的 module 设置
        module: 'ESNext',
        // 确保输出符合 ES 模块规范
        target: 'ESNext',
        // 添加以下配置
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        preserveSymlinks: true
      },
      outputToFilesystem: true  // 显式设置这个选项
      // declaration: false,  // 类型声明文件单独生成
    }),
    isProduction && terser()  // 生产环境压缩代码
  ].filter(Boolean)

  // 返回所有格式的配置
  // 返回所有配置，包括 .d.ts 配置
  return [...formats.map(f => ({
    input,
    output: {
      format: f.format,
      file: resolve(__dirname, '..', f.file),
      name: f.name,
      sourcemap: !isProduction,
    },
    plugins
  }))]
}

const buildPackage = async (target) => {
  const spinner = ora(`Building ${target}...`).start()

  try {

    const configs = createRollupConfig(target)

    if (shouldWatch) {
      // 监听模式
      const watcher = watch(configs)

      watcher.on('event', event => {
        switch (event.code) {
          case 'START':
            spinner.start(`Watching ${target}...`)
            break
          case 'BUNDLE_START':
            spinner.text = `Rebuilding ${target}...`
            break
          case 'BUNDLE_END':
            spinner.succeed(`Built ${target} in ${event.duration}ms`)
            break
          case 'ERROR':
            spinner.fail(`Error building ${target}: ${event.error}`)
            console.error(event.error)
            break
        }
      })

      // 优雅退出
      const cleanup = () => {
        spinner.info('Closing watcher...')
        watcher.close()
        process.exit(0)
      }

      process.on('SIGTERM', cleanup)
      process.on('SIGINT', cleanup)

      // 返回 watcher 以便外部管理
      return watcher
    } else {
      // 并行处理多种格式的构建
      await Promise.all(
        configs.map(async (config) => {
          const bundle = await rollup(config);
          await bundle.write(config.output);
          await bundle.close(); // 记得关闭 bundle
        })
      );

      spinner.succeed(chalk.red(`Built ${target}`))
      return true;
    }

  } catch (error) {
    spinner.fail(`Failed to build ${target}: ${error.message}`)
    throw error
  }


}


const buildAllPackages = async () => {
  console.time('Total Build Time')

  // 创建进度条
  const progressBar = !shouldWatch ? new SingleBar({
    format: 'Building [{bar}] {percentage}% | {value}/{total} Packages | {package}',
    hideCursor: true
  }, Presets.shades_classic) : null;

  if (progressBar) {
    progressBar.start(packagesDir.length, 0, { package: '' });
  }

  const watchers = [];
  const buildResults = {
    success: [],
    failed: []
  };

  try {
    // 并行构建所有包
    await Promise.all(
      packagesDir.map(async (target) => {
        try {
          if (!shouldWatch) {
            progressBar?.update(buildResults.success.length + buildResults.failed.length, {
              package: target
            });
          }

          const result = await buildPackage(target);

          if (shouldWatch && result) {
            watchers.push(result);
          }

          buildResults.success.push(target);
        } catch (error) {
          buildResults.failed.push({ target, error });
          console.error(chalk.red(`\nFailed to build ${target}:`), error);
        } finally {
          if (!shouldWatch) {
            progressBar?.increment();
          }
        }
      })
    );

    // 构建完成后的总结
    if (!shouldWatch) {
      progressBar?.stop();
      console.timeEnd('Total Build Time');

      // 打印构建结果
      console.log('\n📦 Build Summary:');
      console.log(chalk.green(`✓ Successfully built ${buildResults.success.length} packages`));

      if (buildResults.success.length > 0) {
        console.log(chalk.green('  Successfully built packages:'));
        buildResults.success.forEach(pkg => {
          console.log(chalk.green(`  - ${pkg}`));
        });
      }

      if (buildResults.failed.length > 0) {
        console.log(chalk.red(`\n✗ Failed to build ${buildResults.failed.length} packages:`));
        buildResults.failed.forEach(({ target, error }) => {
          console.log(chalk.red(`  - ${target}: ${error.message}`));
        });
        process.exit(1);
      }
    } else {
      console.log(chalk.blue('\n👀 Watching for changes... (Press Ctrl+C to exit)'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Build failed:'), error);
    // 清理所有 watchers
    watchers.forEach(w => w.close());
    process.exit(1);
  }
}

// 添加错误处理
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n💥 Unhandled rejection:'), error);
  process.exit(1);
});

// 添加优雅退出
process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 构建过程终止'));
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 构建过程中断'));
  process.exit(0);
});

buildAllPackages().catch((error) => {
  console.error('Error building packages:', error)
  process.exit(1)
})
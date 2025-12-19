#!/usr/bin/env node
/* eslint-disable no-undef */
import { Command } from 'commander'
import pageLoader from '../src/page-loger.js'

const program = new Command()
const { process } = global
program
  .description('Page loader utility')
  .argument('<url>')
  .option('-V, --version', 'output the version number')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .action((url) => {
    pageLoader(url, program.opts().output)
    // .then((filepath) => {
    //   console.log(filepath)
    // })
    // .catch((error) => {
    //   console.error(`Error: ${error.message}`)
    //   process.exit(1)
    // })
  })
program.parse()
// #!/usr/bin/env node

// import { Command } from 'commander'
// import { downloadPage } from '../src/page-loader.js'
// import { readFile } from 'fs/promises'

// const __dirname = new URL('.', import.meta.url).pathname

// const readPackageJson = async () => {
//   try {
//     const packagePath = new URL('../package.json', import.meta.url)
//     const packageData = await readFile(packagePath, 'utf8')
//     return JSON.parse(packageData)
//   }
//   catch (error) {
//     return { version: '1.0.0' }
//   }
// }

// const main = async () => {
//   const packageData = await readPackageJson()

//   const program = new Command()

//   program
//     .name('page-loader')
//     .description('Page loader utility')
//     .version(packageData.version)
//     .argument('<url>', 'URL to download')
//     .option('-o, --output [dir]', 'output dir', process.cwd())
// .action(async (url, options) => {
//   try {
//     const filepath = await downloadPage(url, options.output)
//     console.log(filepath)
//   }
//   catch (error) {
//     console.error(`Error: ${error.message}`)
//     process.exit(1)
//   }
//     })

//   program.parse()
// }

// main().catch(console.error)
// import pageLoader from '../src/page-loader.js'

// const main = async () => {
//   try {
//     const [url, outputDir = process.cwd()] = process.argv.slice(2)

//     if (!url) {
//       console.error('Ошибка: URL обязателен')
//       console.error('Использование: page-loader <url> [output-dir]')
//       process.exit(1)
//     }

//     const filepath = await pageLoader(url, outputDir)
//     console.log(`Страница успешно загружена и сохранена в ${filepath}`)
//     process.exit(0)
//   } catch (error) {
//     console.error('Ошибка:', error.message)
//     process.exit(1)
//   }
// }

// main()

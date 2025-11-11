#!/usr/bin/env node

import { Command } from 'commander'
import { downloadPage } from '../src/page-loader.js'
import { readFile } from 'fs/promises'

const __dirname = new URL('.', import.meta.url).pathname

const readPackageJson = async () => {
  try {
    const packagePath = new URL('../package.json', import.meta.url)
    const packageData = await readFile(packagePath, 'utf8')
    return JSON.parse(packageData)
  }
  catch (error) {
    return { version: '1.0.0' }
  }
}

const main = async () => {
  const packageData = await readPackageJson()

  const program = new Command()

  program
    .name('page-loader')
    .description('Page loader utility')
    .version(packageData.version)
    .argument('<url>', 'URL to download')
    .option('-o, --output [dir]', 'output dir', process.cwd())
    .action(async (url, options) => {
      try {
        const filepath = await downloadPage(url, options.output)
        console.log(filepath)
      }
      catch (error) {
        console.error(`Error: ${error.message}`)
        process.exit(1)
      }
    })

  program.parse()
}

main().catch(console.error)

#!/usr/bin/env node
/* eslint-disable no-undef */
import { Command } from 'commander'
import pageLoader from '../src/page-loader.js'

const program = new Command()
const { process } = global

program
  .description('Page loader utility')
  .argument('<url>')
  .option('-V, --version', 'output the version number')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .action(async (url) => {
    try {
      const options = program.opts()
      const result = await pageLoader(url, options.output)
      console.log(`Page ${url} was successfully downloaded to ${result.htmlFile}`)
      process.exit(0)
    }
    catch (error) {
      console.error('Error:', error.message)
      process.exit(1)
    }
  })

program.parse()

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
  )
program.parse()

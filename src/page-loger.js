

// import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { URL } from 'url'
import * as cheerio from 'cheerio'
import { generateName } from './utils.js'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('axios-debug-log');
const axios = require('axios');
import debug from 'debug'
import Listr from 'listr'

const log = debug('page-loader')

const pageLoader = (url, outputDir) => {
const parseUrl = new URL(url)
log('распарсенная ссылка', parseUrl)
log('часть ссылки',`${parseUrl.host}${parseUrl.pathname}`)
const urlWithoutProtocol = `${parseUrl.host}${parseUrl.pathname}`
const filename = `${urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
log('название файла', filename)
  log('ссылка для скачивания', url)
  log('папка для скачивания', outputDir)
axios.get(url)
  .then(response => {
    log(' ' , response.data)
    return response.data
  })
  .then((data1) => {
    log('ожидаем получить', data1)
    fs.writeFile(`${outputDir}/${filename}`, data1)
    return `${outputDir}/${filename}`
})
// .then(filename => console.log(filename))
}


export default pageLoader

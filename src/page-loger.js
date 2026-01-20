

import fsp from 'fs/promises'
import path from 'path'
import { URL } from 'url'
import * as cheerio from 'cheerio'
// import { generateName } from './utils.js'
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
const partName = `${parseUrl.host}${parseUrl.pathname}`.replace(/[^a-zA-Z0-9]/g, '-')
log('часть названия файла', partName)
const filename = `${partName}.html`;
const dirName = `${partName}_files`

log('название файла', filename)
  log('ссылка для скачивания', url)
  log('папка для скачивания', outputDir)
return fsp.mkdir(`${outputDir}${dirName}`)
  .then(()=>{
  return axios.get(url)
  })
  .then(response => {
    log(' ' , response.data)
    return response.data
  })
  .then(html => {
    log('ожидаем получить', html)
    fsp.writeFile(`${outputDir}/${filename}`, html) 
    return html
  })
  .then((html) => {
    const $ = cheerio.load(html)
    log('часть пути к картинке', $('img').attr('src'))
    return axios.get(`${parseUrl.origin}${$('img').attr('src')}`, { responseType: 'arraybuffer' })
           
  })
  .then(img => {
    log('содержание img', img)
fsp.writeFile(`${outputDir}/${dirName}/img` , img.data)
  })

}


export default pageLoader

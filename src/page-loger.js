import fsp from 'fs/promises'
import path from 'path'
import { URL } from 'url'
import * as cheerio from 'cheerio'
// import { generateName } from './utils.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
require('axios-debug-log')
const axios = require('axios')
import debug from 'debug'
import Listr from 'listr'

const log = debug('page-loader')

const pageLoader = (url, outputDir) => {
  const parseUrl = new URL(url)
  log('распарсенная ссылка', parseUrl)
  log('часть ссылки', `${parseUrl.host}${parseUrl.pathname}`)
  const partName = `${parseUrl.host}${parseUrl.pathname}`.replace(/[^a-zA-Z0-9]/g, '-')
  log('часть названия файла', partName)
  const filename = `${partName}.html`
  const dirName = `${partName}_files`

  log('название файла', filename)
  log('ссылка для скачивания', url)
  log('папка для скачивания', outputDir)
  let linkImg
  let linkCss
  let linkScript

  return fsp.mkdir(`${outputDir}/${dirName}`)
    .then(() => {
      return axios.get(url)
    })
    .then((response) => {
      log(' ', response.data)
      return response.data
    })
    .then((html) => {
      log('ожидаем получить', html)
      fsp.writeFile(`${outputDir}/${filename}`, html)
      return html
    })
    .then((html) => {
      const $ = cheerio.load(html)
      log('часть пути к картинке', $('img').attr('src'))

      const resourcePromises = []

      log('путь к картинке', `${parseUrl.origin}${$('img').attr('src')}`)
      const imageUrl = `${parseUrl.origin}${$('img').attr('src')}`
      let parseImageUrl = new URL(imageUrl)
      parseImageUrl = path.parse(parseImageUrl.pathname)
      log('распарсенная ссылка на картинку', parseImageUrl)
      const imagePath = `${parseUrl.host}${parseImageUrl.dir}/${parseImageUrl.name}`.replace(/[^a-zA-Z0-9]/g, '-') + parseImageUrl.ext
      log('название файла картинки', imagePath)
      linkImg = imagePath
      // const img = axios.get(imageUrl, { responseType: 'arraybuffer' })
      resourcePromises.push(axios.get(imageUrl, { responseType: 'arraybuffer' }))

      log('путь к другим ресурсам', `${parseUrl.origin}${$('link').attr('href')}`)
      const cssUrl = `${parseUrl.origin}${$('link').attr('href')}`
      let parseCssUrl = new URL(cssUrl)
      parseCssUrl = path.parse(parseCssUrl.pathname)
      log('распарсенная ссылка на css', parseCssUrl)
      const cssPath = `${parseUrl.host}${parseCssUrl.dir}/${parseCssUrl.name}`.replace(/[^a-zA-Z0-9]/g, '-') + parseCssUrl.ext
      log('название файла css', cssPath)
      linkCss = cssPath
      // const css = axios.get(cssUrl, { responseType: 'arraybuffer' })
      resourcePromises.push(axios.get(cssUrl, { responseType: 'arraybuffer' }))

      log('путь к другим ресурсам', `${parseUrl.origin}${$('script').attr('src')}`)
      const scriptUrl = `${parseUrl.origin}${$('script').attr('src')}`
      let parseScriptUrl = new URL(scriptUrl)
      parseScriptUrl = path.parse(parseScriptUrl.pathname)
      log('распарсенная ссылка на script', parseScriptUrl)
      const scriptPath = `${parseUrl.host}${parseScriptUrl.dir}/${parseScriptUrl.name}`.replace(/[^a-zA-Z0-9]/g, '-') + parseScriptUrl.ext
      log('название файла script', scriptPath)
      linkScript = scriptPath
      // const script = axios.get(scriptUrl, { responseType: 'arraybuffer' })
      resourcePromises.push(axios.get(scriptUrl, { responseType: 'arraybuffer' }))
      return Promise.all(resourcePromises)
        .then((resources) => {
          log('содержание resurses', resources)
          log('содержание img', resources[0].data)
          fsp.writeFile(`${outputDir}/${dirName}/${linkImg}`, resources[0].data)
          log('содержание css', resources[1].data)
          fsp.writeFile(`${outputDir}/${dirName}/${linkCss}`, resources[1].data)
          log('содержание css', resources[2].data)
          fsp.writeFile(`${outputDir}/${dirName}/${linkScript}`, resources[2].data)
        })
    })
}

export default pageLoader



import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { URL } from 'url'
import * as cheerio from 'cheerio'
import { generateName } from './utils.js'
import 'axios-debug-log'
import debug from 'debug'
import Listr from 'listr'

const log = debug('page-loader')

const pageLoader = (url, outputDir) => {

  log('ссылка для скачивания', url)
  log('папка для скачивания', outputDir)
axios.get(url)
  .then(function (response) {
    
    log(' ' ,response.data)
  })
  
}

export default pageLoader

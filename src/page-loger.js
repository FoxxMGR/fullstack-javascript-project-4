import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { URL } from 'url'
import * as cheerio from 'cheerio'
import { generateName } from './utils.js'

const downloadResource = (url, filepath) => {
  return axios({
    method: 'get',
    url,
    responseType: 'arraybuffer',
  })
    .then((response) => {
      return fs.writeFile(filepath, Buffer.from(response.data))
    })
}

const pageLoader = (url, outputDir) => {
  const filename = generateName(url, '.html')
  const dirname = generateName(url, '_files')
  const filepath = path.resolve(outputDir, filename)
  const dirpath = path.resolve(outputDir, dirname)
  let $
  let htmlData
  //   const html = axios.get(url)
  //     .then(respons => respons.data)
  //     .then(data => fs.writeFile(filepath, data))
  //     .then(() => fs.mkdir(dirpath))
  //     .then(() => console.log(filepath))

  //   return html
  // }
  const html = axios.get(url)
    .then((response) => {
      htmlData = response.data

      $ = cheerio.load(htmlData)

      return fs.mkdir(dirpath, { recursive: true })
    })
    .then(() => {
      const images = $('img')
      const downloadPromises = []

      for (let i = 0; i < images.length; i++) {
        const img = $(images[i])
        const src = img.attr('src')

        if (src) {
          try {
            const imgUrl = new URL(src, url).toString()

            const imgPath = new URL(imgUrl).pathname
            const extension = path.extname(imgPath) || '.png'

            const imgNameWithoutExt = generateName(imgUrl, '')
            const cleanName = imgNameWithoutExt.replace(/(-jpg|-png|-jpeg|-gif)$/, '')
            const imgFilename = `${cleanName}${extension}`
            const imgFilepath = path.join(dirpath, imgFilename)

            const relativePath = path.join(dirname, imgFilename)

            img.attr('src', relativePath)

            downloadPromises.push(downloadResource(imgUrl, imgFilepath))
          }
          catch (error) {
            console.warn(`Не удалось обработать изображение ${src}:`, error.message)
          }
        }
      }

      return Promise.allSettled(downloadPromises)
    })
    .then(() => {
      const modifiedHtml = $.html()

      return fs.writeFile(filepath, modifiedHtml)
    })
    .then(() => {
      console.log(filepath)

      return filepath
    })
    .catch((error) => {
      console.error('Ошибка при загрузке страницы:', error.message)
      throw error
    })

  return html
}
export default pageLoader

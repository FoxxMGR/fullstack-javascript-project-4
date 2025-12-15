// import axios from 'axios'
// import fs from 'fs/promises'
// import path from 'path'
// import { URL } from 'url'
// import * as cheerio from 'cheerio'
// import { generateName } from './utils.js'

// const downloadResource = (url, filepath) => {
//   return axios({
//     method: 'get',
//     url,
//     responseType: 'arraybuffer',
//   })
//     .then((response) => {
//       return fs.writeFile(filepath, response.data)
//     })
//     .catch((error) => {
//       console.warn(`Не удалось скачать ресурс ${url}:`, error.message)
//       throw error
//     })
// }

// const pageLoader = (url, outputDir) => {
//   const filename = generateName(url, '.html')
//   const dirname = generateName(url, '_files')
//   const filepath = path.resolve(outputDir, filename)
//   const dirpath = path.resolve(outputDir, dirname)
//   let $
//   // let htmlData
//   //   const html = axios.get(url)
//   //     .then(respons => respons.data)
//   //     .then(data => fs.writeFile(filepath, data))
//   //     .then(() => fs.mkdir(dirpath))
//   //     .then(() => console.log(filepath))

//   //   return html
//   // }
//   const html = axios.get(url)
//     .then((response) => {
//       const htmlData = response.data

//       $ = cheerio.load(htmlData)

//       return fs.mkdir(dirpath, { recursive: true })
//     })
//     .then(() => {
//       const images = $('img')
//       const downloadPromises = []

//       for (let i = 0; i < images.length; i++) {
//         const img = $(images[i])
//         const src = img.attr('src')

//         if (src) {
//           try {
//             const imgUrl = new URL(src, url).toString()

//             const imgPath = new URL(imgUrl).pathname
//             const extension = path.extname(imgPath) || '.png'

//             const imgNameWithoutExt = generateName(imgUrl, '')
//             const cleanName = imgNameWithoutExt.replace(/(-jpg|-png|-jpeg|-gif)$/, '')
//             const imgFilename = `${cleanName}${extension}`
//             const imgFilepath = path.join(dirpath, imgFilename)

//             const relativePath = path.join(dirname, imgFilename)

//             img.attr('src', relativePath)

//             downloadPromises.push(downloadResource(imgUrl, imgFilepath))
//           }
//           catch (error) {
//             console.warn(`Не удалось обработать изображение ${src}:`, error.message)
//           }
//         }
//       }

//       return Promise.allSettled(downloadPromises)
//     })
//     .then(() => {
//       const modifiedHtml = $.html()

//       return fs.writeFile(filepath, modifiedHtml)
//     })
//     .then(() => {
//       console.log(filepath)

//       return filepath
//     })
//     .catch((error) => {
//       console.error('Ошибка при загрузке страницы:', error.message)
//       throw error
//     })

//   return html
// }
// export default pageLoader
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { URL } from 'url'
import * as cheerio from 'cheerio'
import { generateName } from './utils.js'
import 'axios-debug-log'
import debug from 'debug'

const log = debug('page-loader');

const downloadResource = (url, filepath) => {
  return axios({
    method: 'get',
    url,
    responseType: 'arraybuffer',
  })
    .then((response) => {
      return fs.writeFile(filepath, response.data)
    })
    .catch((error) => {
      // console.warn(`Не удалось скачать ресурс ${url}:`, error.message)
      log(url)
      throw error
    })
}

const isLocalResource = (resourceUrl, pageUrl) => {
  try {
    const pageOrigin = new URL(pageUrl).origin
    const resourceOrigin = new URL(resourceUrl, pageUrl).origin
    return resourceOrigin === pageOrigin
  }
  catch (error) {
    return false
  }
}

const getResourceFilename = (resourceUrl, pageUrl) => {
  try {
    const absoluteUrl = new URL(resourceUrl, pageUrl).toString()
    const parsedUrl = new URL(absoluteUrl)

    // Получаем расширение из пути
    const extension = path.extname(parsedUrl.pathname)

    // Генерируем базовое имя (без расширения)
    const baseName = generateName(absoluteUrl, '')

    // Определяем окончательное расширение
    let finalExtension = extension

    // Если расширения нет в пути, определяем по типу контента
    if (!finalExtension) {
      // Для CSS ссылок (даже без .css в пути)
      if (resourceUrl.includes('.css') || resourceUrl.endsWith('/css')) {
        finalExtension = '.css'
      }
      // Для JS ссылок
      else if (resourceUrl.includes('.js') || resourceUrl.endsWith('/js')) {
        finalExtension = '.js'
      }
      // Для канонических ссылок и других HTML
      else {
        finalExtension = '.html'
      }
    }

    return {
      url: absoluteUrl,
      filename: baseName + finalExtension,
    }
  }
  catch (error) {
    console.warn(`Не удалось обработать URL ${resourceUrl}:`, error.message)
    return null
  }
}

const pageLoader = (url, outputDir) => {
  const filename = generateName(url, '.html')
  const dirname = generateName(url, '_files')
  const filepath = path.resolve(outputDir, filename)
  const dirpath = path.resolve(outputDir, dirname)

  let $

  return axios.get(url)
    .then((response) => {
      const htmlData = response.data
      $ = cheerio.load(htmlData)
      return fs.mkdir(dirpath, { recursive: true })
    })
    .then(() => {
      const downloadPromises = []

      // Обработка тегов img
      $('img').each((i, element) => {
        const src = $(element).attr('src')
        if (!src) return

        const resourceInfo = getResourceFilename(src, url)
        if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

        const filepath = path.join(dirpath, resourceInfo.filename)
        const relativePath = path.join(dirname, resourceInfo.filename)

        $(element).attr('src', relativePath)
        log(`Список на скачивание `, resourceInfo)
        downloadPromises.push(downloadResource(resourceInfo.url, filepath))
      })

      // Обработка тегов link
      $('link').each((i, element) => {
        const href = $(element).attr('href')
        const rel = $(element).attr('rel')

        if (!href) return

        // Для канонических ссылок используем .html расширение
        if (rel === 'canonical') {
          const resourceInfo = getResourceFilename(href, url)
          if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

          const filepath = path.join(dirpath, resourceInfo.filename)
          const relativePath = path.join(dirname, resourceInfo.filename)

          $(element).attr('href', relativePath)
          downloadPromises.push(downloadResource(resourceInfo.url, filepath))
        }
        // Для CSS файлов
        else if (rel === 'stylesheet' || href.includes('.css')) {
          const resourceInfo = getResourceFilename(href, url)
          if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

          const filepath = path.join(dirpath, resourceInfo.filename)
          const relativePath = path.join(dirname, resourceInfo.filename)

          $(element).attr('href', relativePath)
          log(`Список на скачивание `, resourceInfo)
          downloadPromises.push(downloadResource(resourceInfo.url, filepath))
        }
      })

      // Обработка тегов script
      $('script').each((i, element) => {
        const src = $(element).attr('src')
        if (!src) return

        const resourceInfo = getResourceFilename(src, url)
        if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

        const filepath = path.join(dirpath, resourceInfo.filename)
        const relativePath = path.join(dirname, resourceInfo.filename)

        $(element).attr('src', relativePath)
        log(`Список на скачивание `, resourceInfo)
        downloadPromises.push(downloadResource(resourceInfo.url, filepath))
      })

      // console.log(`Найдено ${downloadPromises.length} локальных ресурсов для скачивания`)
      
      return Promise.allSettled(downloadPromises)
    })
    .then((results) => {
      // Логирование результатов скачивания
      log('список ресурсов', results)
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          // console.warn(`Ресурс ${index} не удалось скачать:`, result.reason.message)
          log(`Ресурс ${index} не удалось скачать:`, result.request)
          log(`Ресурс ${index} не удалось скачать:`, result.reason.message)
          log(`Ресурс ${index} не удалось скачать:`, result.reason.message)
        }
      })

      const modifiedHtml = $.html()
      return fs.writeFile(filepath, modifiedHtml)
    })
    .then(() => {
      console.log(`Страница сохранена в: ${filepath}`)
      return filepath
    })
    .catch((error) => {
      console.error('Ошибка при загрузке страницы:', error.message)
      throw error
    })
}

export default pageLoader

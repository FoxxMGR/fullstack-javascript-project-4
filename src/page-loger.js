// // import axios from 'axios'
// // import fs from 'fs/promises'
// // import path from 'path'
// // import { URL } from 'url'
// // import * as cheerio from 'cheerio'
// // import { generateName } from './utils.js'

// // const downloadResource = (url, filepath) => {
// //   return axios({
// //     method: 'get',
// //     url,
// //     responseType: 'arraybuffer',
// //   })
// //     .then((response) => {
// //       return fs.writeFile(filepath, response.data)
// //     })
// //     .catch((error) => {
// //       console.warn(`Не удалось скачать ресурс ${url}:`, error.message)
// //       throw error
// //     })
// // }

// // const pageLoader = (url, outputDir) => {
// //   const filename = generateName(url, '.html')
// //   const dirname = generateName(url, '_files')
// //   const filepath = path.resolve(outputDir, filename)
// //   const dirpath = path.resolve(outputDir, dirname)
// //   let $
// //   // let htmlData
// //   //   const html = axios.get(url)
// //   //     .then(respons => respons.data)
// //   //     .then(data => fs.writeFile(filepath, data))
// //   //     .then(() => fs.mkdir(dirpath))
// //   //     .then(() => console.log(filepath))

// //   //   return html
// //   // }
// //   const html = axios.get(url)
// //     .then((response) => {
// //       const htmlData = response.data

// //       $ = cheerio.load(htmlData)

// //       return fs.mkdir(dirpath, { recursive: true })
// //     })
// //     .then(() => {
// //       const images = $('img')
// //       const downloadPromises = []

// //       for (let i = 0; i < images.length; i++) {
// //         const img = $(images[i])
// //         const src = img.attr('src')

// //         if (src) {
// //           try {
// //             const imgUrl = new URL(src, url).toString()

// //             const imgPath = new URL(imgUrl).pathname
// //             const extension = path.extname(imgPath) || '.png'

// //             const imgNameWithoutExt = generateName(imgUrl, '')
// //             const cleanName = imgNameWithoutExt.replace(/(-jpg|-png|-jpeg|-gif)$/, '')
// //             const imgFilename = `${cleanName}${extension}`
// //             const imgFilepath = path.join(dirpath, imgFilename)

// //             const relativePath = path.join(dirname, imgFilename)

// //             img.attr('src', relativePath)

// //             downloadPromises.push(downloadResource(imgUrl, imgFilepath))
// //           }
// //           catch (error) {
// //             console.warn(`Не удалось обработать изображение ${src}:`, error.message)
// //           }
// //         }
// //       }

// //       return Promise.allSettled(downloadPromises)
// //     })
// //     .then(() => {
// //       const modifiedHtml = $.html()

// //       return fs.writeFile(filepath, modifiedHtml)
// //     })
// //     .then(() => {
// //       console.log(filepath)

// //       return filepath
// //     })
// //     .catch((error) => {
// //       console.error('Ошибка при загрузке страницы:', error.message)
// //       throw error
// //     })

// //   return html
// // }
// // export default pageLoader
// import axios from 'axios'
// import fs from 'fs/promises'
// import path from 'path'
// import { URL } from 'url'
// import * as cheerio from 'cheerio'
// import { generateName } from './utils.js'
// import 'axios-debug-log'
// import debug from 'debug'

// const log = debug('page-loader');

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
//       // console.warn(`Не удалось скачать ресурс ${url}:`, error.message)
//       log(url)
//       throw error
//     })
// }

// const isLocalResource = (resourceUrl, pageUrl) => {
//   try {
//     const pageOrigin = new URL(pageUrl).origin
//     const resourceOrigin = new URL(resourceUrl, pageUrl).origin
//     return resourceOrigin === pageOrigin
//   }
//   catch (error) {
//     return false
//   }
// }

// const getResourceFilename = (resourceUrl, pageUrl) => {
//   try {
//     const absoluteUrl = new URL(resourceUrl, pageUrl).toString()
//     const parsedUrl = new URL(absoluteUrl)

//     // Получаем расширение из пути
//     const extension = path.extname(parsedUrl.pathname)

//     // Генерируем базовое имя (без расширения)
//     const baseName = generateName(absoluteUrl, '')

//     // Определяем окончательное расширение
//     let finalExtension = extension

//     // Если расширения нет в пути, определяем по типу контента
//     if (!finalExtension) {
//       // Для CSS ссылок (даже без .css в пути)
//       if (resourceUrl.includes('.css') || resourceUrl.endsWith('/css')) {
//         finalExtension = '.css'
//       }
//       // Для JS ссылок
//       else if (resourceUrl.includes('.js') || resourceUrl.endsWith('/js')) {
//         finalExtension = '.js'
//       }
//       // Для канонических ссылок и других HTML
//       else {
//         finalExtension = '.html'
//       }
//     }

//     return {
//       url: absoluteUrl,
//       filename: baseName + finalExtension,
//     }
//   }
//   catch (error) {
//     console.warn(`Не удалось обработать URL ${resourceUrl}:`, error.message)
//     return null
//   }
// }

// const pageLoader = (url, outputDir) => {
//   const filename = generateName(url, '.html')
//   const dirname = generateName(url, '_files')
//   const filepath = path.resolve(outputDir, filename)
//   const dirpath = path.resolve(outputDir, dirname)

//   let $

//   return axios.get(url)
//     .then((response) => {
//       const htmlData = response.data
//       $ = cheerio.load(htmlData)
//       return fs.mkdir(dirpath, { recursive: true })
//     })
//     .then(() => {
//       const downloadPromises = []

//       // Обработка тегов img
//       $('img').each((i, element) => {
//         const src = $(element).attr('src')
//         if (!src) return

//         const resourceInfo = getResourceFilename(src, url)
//         if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

//         const filepath = path.join(dirpath, resourceInfo.filename)
//         const relativePath = path.join(dirname, resourceInfo.filename)

//         $(element).attr('src', relativePath)
//         log(`Список на скачивание `, resourceInfo)
//         downloadPromises.push(downloadResource(resourceInfo.url, filepath))
//       })

//       // Обработка тегов link
//       $('link').each((i, element) => {
//         const href = $(element).attr('href')
//         const rel = $(element).attr('rel')

//         if (!href) return

//         // Для канонических ссылок используем .html расширение
//         if (rel === 'canonical') {
//           const resourceInfo = getResourceFilename(href, url)
//           if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

//           const filepath = path.join(dirpath, resourceInfo.filename)
//           const relativePath = path.join(dirname, resourceInfo.filename)

//           $(element).attr('href', relativePath)
//           downloadPromises.push(downloadResource(resourceInfo.url, filepath))
//         }
//         // Для CSS файлов
//         else if (rel === 'stylesheet' || href.includes('.css')) {
//           const resourceInfo = getResourceFilename(href, url)
//           if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

//           const filepath = path.join(dirpath, resourceInfo.filename)
//           const relativePath = path.join(dirname, resourceInfo.filename)

//           $(element).attr('href', relativePath)
//           log(`Список на скачивание `, resourceInfo)
//           downloadPromises.push(downloadResource(resourceInfo.url, filepath))
//         }
//       })

//       // Обработка тегов script
//       $('script').each((i, element) => {
//         const src = $(element).attr('src')
//         if (!src) return

//         const resourceInfo = getResourceFilename(src, url)
//         if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

//         const filepath = path.join(dirpath, resourceInfo.filename)
//         const relativePath = path.join(dirname, resourceInfo.filename)

//         $(element).attr('src', relativePath)
//         log(`Список на скачивание `, resourceInfo)
//         downloadPromises.push(downloadResource(resourceInfo.url, filepath))
//       })

//       // console.log(`Найдено ${downloadPromises.length} локальных ресурсов для скачивания`)

//       return Promise.allSettled(downloadPromises)
//     })
//     .then((results) => {
//       // Логирование результатов скачивания
//       log('список ресурсов', results)
//       results.forEach((result, index) => {
//         if (result.status === 'rejected') {
//           // console.warn(`Ресурс ${index} не удалось скачать:`, result.reason.message)
//           log(`Ресурс ${index} не удалось скачать:`, result.request)
//           log(`Ресурс ${index} не удалось скачать:`, result.reason.message)
//           log(`Ресурс ${index} не удалось скачать:`, result.reason.message)
//         }
//       })

//       const modifiedHtml = $.html()
//       return fs.writeFile(filepath, modifiedHtml)
//     })
//     .then(() => {
//       console.log(`Страница сохранена в: ${filepath}`)
//       return filepath
//     })
//     .catch((error) => {
//       console.error('Ошибка при загрузке страницы:', error.message)
//       throw error
//     })
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

const log = debug('page-loader')

const downloadResource = (url, filepath) => {
  return axios({
    method: 'get',
    url,
    responseType: 'arraybuffer',
    validateStatus: status => status === 200,
  })
    .then((response) => {
      return fs.writeFile(filepath, response.data)
    })
    .then(() => {
      log(`Ресурс ${url} успешно скачан`)
      return true
    })
    .catch((error) => {
      if (error.response) {
        throw new Error(`Не удалось скачать ресурс ${url}: HTTP ${error.response.status} ${error.response.statusText}`)
      }
      else if (error.request) {
        throw new Error(`Не удалось скачать ресурс ${url}: сетевая ошибка - ${error.message}`)
      }
      else {
        throw new Error(`Не удалось скачать ресурс ${url}: ${error.message}`)
      }
    })
}

const isLocalResource = (resourceUrl, pageUrl) => {
  try {
    const pageOrigin = new URL(pageUrl).origin
    const resourceOrigin = new URL(resourceUrl, pageUrl).origin
    return resourceOrigin === pageOrigin
  }
  catch {
    return false
  }
}

const getResourceFilename = (resourceUrl, pageUrl) => {
  try {
    const absoluteUrl = new URL(resourceUrl, pageUrl).toString()
    const parsedUrl = new URL(absoluteUrl)

    const extension = path.extname(parsedUrl.pathname)
    const baseName = generateName(absoluteUrl, '')
    let finalExtension = extension

    if (!finalExtension) {
      if (resourceUrl.includes('.css') || resourceUrl.endsWith('/css')) {
        finalExtension = '.css'
      }
      else if (resourceUrl.includes('.js') || resourceUrl.endsWith('/js')) {
        finalExtension = '.js'
      }
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
    log(`Не удалось обработать URL ${resourceUrl}:`, error.message)
    return null
  }
}

const pageLoader = (url, outputDir) => {
  let currentDirpath = null
  let current$ = null
  let currentFilepath = null

  // Шаг 1: Проверяем существование директории
  return fs.access(outputDir)
    .then(() => {
      // Шаг 2: Проверяем права на запись
      return fs.access(outputDir, fs.constants.W_OK)
    })
    .then(() => {
      // Шаг 3: Генерируем имена файлов
      const filename = generateName(url, '.html')
      const dirname = generateName(url, '_files')
      currentFilepath = path.resolve(outputDir, filename)
      currentDirpath = path.resolve(outputDir, dirname)

      // Шаг 4: Загружаем основную страницу
      return axios.get(url, {
        validateStatus: status => status === 200,
      })
    })
    .then((response) => {
      // Шаг 5: Обрабатываем HTML
      const htmlData = response.data
      current$ = cheerio.load(htmlData)
      return currentDirpath
    })
    .catch((error) => {
      // Обработка ошибок загрузки страницы
      if (error.response) {
        throw new Error(`Не удалось загрузить страницу ${url}: HTTP ${error.response.status}`)
      }
      else if (error.request) {
        throw new Error(`Не удалось загрузить страницу ${url}: сетевая ошибка`)
      }
      else if (error.code === 'ENOENT') {
        throw new Error(`Директория ${outputDir} не существует или недоступна`)
      }
      else if (error.code === 'EACCES') {
        throw new Error(`Нет прав на запись в директорию ${outputDir}`)
      }
      else {
        throw new Error(`Не удалось загрузить страницу ${url}: ${error.message}`)
      }
    })
    .then((dirpath) => {
      // Шаг 6: Пытаемся создать директорию
      return fs.mkdir(dirpath, { recursive: true })
        .then(() => dirpath)
    })
    .catch((mkdirError) => {
      // Шаг 7: Если не удалось создать, проверяем что существует
      if (mkdirError.code === 'EEXIST') {
        return fs.stat(currentDirpath)
          .then((stats) => {
            if (stats.isDirectory()) {
              return currentDirpath
            }
            throw new Error(`Не удалось создать директорию ${currentDirpath}: по пути уже существует файл`)
          })
      }
      throw new Error(`Не удалось создать директорию ${currentDirpath}: ${mkdirError.message}`)
    })
    .then((dirpath) => {
      // Шаг 8: Обработка ресурсов на странице
      const dirname = generateName(url, '_files')
      const downloadPromises = []
      const resourceUrls = []

      // Обработка тегов img
      current$('img').each((i, element) => {
        const src = current$(element).attr('src')
        if (!src) return

        const resourceInfo = getResourceFilename(src, url)
        if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

        const resourceFilepath = path.join(dirpath, resourceInfo.filename)
        const relativePath = path.join(dirname, resourceInfo.filename)

        current$(element).attr('src', relativePath)
        resourceUrls.push(resourceInfo.url)
        downloadPromises.push(downloadResource(resourceInfo.url, resourceFilepath))
      })

      // Обработка тегов link
      current$('link').each((i, element) => {
        const href = current$(element).attr('href')
        const rel = current$(element).attr('rel')

        if (!href) return

        if (rel === 'canonical') {
          const resourceInfo = getResourceFilename(href, url)
          if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

          const resourceFilepath = path.join(dirpath, resourceInfo.filename)
          const relativePath = path.join(dirname, resourceInfo.filename)

          current$(element).attr('href', relativePath)
          resourceUrls.push(resourceInfo.url)
          downloadPromises.push(downloadResource(resourceInfo.url, resourceFilepath))
        }
        else if (rel === 'stylesheet' || href.includes('.css')) {
          const resourceInfo = getResourceFilename(href, url)
          if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

          const resourceFilepath = path.join(dirpath, resourceInfo.filename)
          const relativePath = path.join(dirname, resourceInfo.filename)

          current$(element).attr('href', relativePath)
          resourceUrls.push(resourceInfo.url)
          downloadPromises.push(downloadResource(resourceInfo.url, resourceFilepath))
        }
      })

      // Обработка тегов script
      current$('script').each((i, element) => {
        const src = current$(element).attr('src')
        if (!src) return

        const resourceInfo = getResourceFilename(src, url)
        if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

        const resourceFilepath = path.join(dirpath, resourceInfo.filename)
        const relativePath = path.join(dirname, resourceInfo.filename)

        current$(element).attr('src', relativePath)
        resourceUrls.push(resourceInfo.url)
        downloadPromises.push(downloadResource(resourceInfo.url, resourceFilepath))
      })

      log(`Найдено ${downloadPromises.length} локальных ресурсов для скачивания`)

      return Promise.allSettled(downloadPromises)
        .then(results => ({ results, resourceUrls, dirpath }))
    })
    .then(({ results, resourceUrls, dirpath }) => {
      // Шаг 9: Обработка результатов скачивания
      const downloadErrors = []
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          downloadErrors.push({
            url: resourceUrls[index],
            error: result.reason.message,
          })
          log(`Ресурс ${resourceUrls[index]} не удалось скачать:`, result.reason.message)
        }
      })

      if (downloadErrors.length > 0) {
        const errorMessage = downloadErrors
          .map((err, idx) => `${idx + 1}. ${err.url}: ${err.error}`)
          .join('\n')
        // throw new Error(`Не удалось скачать некоторые ресурсы:\n${errorMessage}`)
      }

      return { dirpath }
    })
    .then(() => {
      // Шаг 10: Сохраняем HTML
      const modifiedHtml = current$.html()
      return fs.writeFile(currentFilepath, modifiedHtml)
        .then(() => currentFilepath)
    })
    .then((filepath) => {
      // Шаг 11: Завершаем
      log(`Страница сохранена в: ${filepath}`)
      return filepath
    })
}

export default pageLoader

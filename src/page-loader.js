import fsp from 'fs/promises'
import path from 'path'
import { URL } from 'url'
import axios from 'axios'
import debug from 'debug'

import * as utils from './utils.js'
import * as downloader from './downloader.js'
import * as htmlProcessor from './html-processor.js'

const log = debug('page-loader')

/**
 * Основная функция pageLoader
 */
const pageLoader = (url, outputDir) => {
  const parseUrl = new URL(url)
  log('распарсенная ссылка', parseUrl)

  // Генерируем имена файлов
  const filename = utils.generateName(url, '.html')
  const dirname = utils.generateName(url, '_files')

  const filepath = path.resolve(outputDir, filename)
  const dirpath = path.resolve(outputDir, dirname)

  log('название файла', filename)
  log('ссылка для скачивания', url)
  log('папка для скачивания', outputDir)

  return fsp.mkdir(dirpath, { recursive: true })
    .then(() => {
      log('Директория создана:', dirpath)
      return axios.get(url)
    })
    .then((response) => {
      log('Получен HTML страницы')
      return htmlProcessor.processHtml(response.data, url, {
        getResourceFilename: utils.getResourceFilename,
        isLocalResource: utils.isLocalResource,
      })
    })
    .then(({ $, resources, canonicalLinks }) => {
      if (resources.length === 0) {
        log('Нет локальных ресурсов для скачивания')
        const html = $.html()
        return fsp.writeFile(filepath, html)
          .then(() => ({
            htmlFile: filepath,
            resourcesDir: dirpath,
            message: 'Нет локальных ресурсов для загрузки',
            resources: [],
          }))
      }

      log(`Найдено ${resources.length} локальных ресурсов для скачивания`)

      // Подготавливаем ресурсы для скачивания
      const resourcesToDownload = resources.map(resource => ({
        url: resource.url,
        filepath: path.join(dirpath, resource.filename),
        resource,
        filename: resource.filename, // Добавляем filename для удобства
      }))

      // Скачиваем все ресурсы
      return downloader.downloadResources(resourcesToDownload)
        .then((downloadResults) => {
          log(`Ресурсы загружены: успешно ${downloadResults.successfulCount}, с ошибками ${downloadResults.failedCount}`)

          // Обновляем HTML с локальными путями
          const updatedHtml = htmlProcessor.updateHtmlWithLocalPaths(
            $,
            resources,
            canonicalLinks,
            dirname,
          )

          // Сохраняем обновленный HTML
          return fsp.writeFile(filepath, updatedHtml)
            .then(() => ({
              htmlFile: filepath,
              resourcesDir: dirpath,
              resources: resources.map(r => ({
                type: r.type,
                originalUrl: r.originalUrl,
                filename: r.filename,
                url: r.url,
              })),
              downloads: downloadResults,
              summary: {
                total: downloadResults.total,
                successful: downloadResults.successfulCount,
                failed: downloadResults.failedCount,
              },
            }))
        })
    })
    .catch((error) => {
      log('Ошибка при загрузке страницы:', error)
      throw error
    })
}

export default pageLoader

import fsp from 'fs/promises'
import path from 'path'
import { URL } from 'url'
import axios from 'axios'
import Listr from 'listr'
import debug from 'debug'

import * as utils from './utils.js'
import * as downloader from './downloader.js'
import * as htmlProcessor from './html-processor.js'

const log = debug('page-loader')

/**
 * Основная функция pageLoader с Listr
 */
const pageLoader = (url, outputDir = process.cwd()) => {
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

  // ПРОВЕРКА ДОСТУПНОСТИ ДИРЕКТОРИИ
  return fsp.access(outputDir, fsp.constants.W_OK)
    .then(() => {
      log('Создание директории:', dirpath)
      return fsp.mkdir(dirpath, { recursive: true })
    })
    .then(() => {
      log('Загрузка страницы:', url)
      return axios.get(url)
    })
    .then((response) => {
      log('Получен HTML страницы')

      const processed = htmlProcessor.processHtml(
        response.data,
        url,
        {
          getResourceFilename: utils.getResourceFilename,
          isLocalResource: utils.isLocalResource,
        },
      )

      log(`Найдено ${processed.resources.length} локальных ресурсов`)

      // Если нет ресурсов - сразу сохраняем HTML
      if (processed.resources.length === 0) {
        const html = processed.$.html()
        log('Нет локальных ресурсов для скачивания')

        return fsp.writeFile(filepath, html)
          .then(() => {
            log(`Страница сохранена в: ${filepath}`)
            return {
              htmlFile: filepath,
              resourcesDir: dirpath,
              message: 'Нет локальных ресурсов для загрузки',
              summary: {
                total: 0,
                successful: 0,
                failed: 0,
              },
            }
          })
      }

      // Подготавливаем ресурсы для скачивания
      const resourcesToDownload = processed.resources.map(resource => ({
        url: resource.url,
        filepath: path.join(dirpath, resource.filename),
        resource,
        filename: resource.filename,
      }))

      // Создаем Listr ТОЛЬКО для загрузки ресурсов - отдельная задача для каждого ресурса
      const downloadTasks = resourcesToDownload.map(resource => ({
        title: `${path.basename(resource.filename)}`,
        task: () => downloader.downloadResource(resource.url, resource.filepath),
      }))

      const tasks = new Listr(downloadTasks, {
        concurrent: true,
        exitOnError: false,
        renderer: 'default',
      })

      return tasks.run()
        .then(() => {
          // Все ресурсы успешно загружены
          const downloadResults = {
            total: resourcesToDownload.length,
            successfulCount: resourcesToDownload.length,
            failedCount: 0,
            errors: [],
            successful: resourcesToDownload,
          }

          log(`Все ресурсы загружены: ${downloadResults.successfulCount}/${downloadResults.total}`)

          // Обновляем HTML с локальными путями после загрузки ресурсов
          const updatedHtml = htmlProcessor.updateHtmlWithLocalPaths(
            processed.$,
            processed.resources,
            dirname,
          )

          return fsp.writeFile(filepath, updatedHtml)
            .then(() => {
              log(`Страница сохранена в: ${filepath}`)

              const result = {
                htmlFile: filepath,
                resourcesDir: dirpath,
                resources: processed.resources.map(r => ({
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
              }

              return result
            })
        })
        .catch((error) => {
          // Обрабатываем ошибки загрузки
          log(`Ошибка загрузки ресурсов:`, error)
          throw error
        })
    })
}

export default pageLoader

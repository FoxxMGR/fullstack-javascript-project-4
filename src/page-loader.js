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

  // Создаем задачи Listr
  const tasks = new Listr([
    {
      title: 'Подготовка структуры',
      task: () => fsp.mkdir(dirpath, { recursive: true })
        .then(() => {
          log('Директория создана:', dirpath)
        }),
    },
    {
      title: 'Загрузка страницы',
      task: ctx => axios.get(url)
        .then((response) => {
          log('Получен HTML страницы')
          ctx.response = response
        }),
    },
    {
      title: 'Анализ HTML',
      task: (ctx) => {
        // processHtml возвращает ОБЪЕКТ, не Promise!
        const result = htmlProcessor.processHtml(
          ctx.response.data,
          url,
          {
            getResourceFilename: utils.getResourceFilename,
            isLocalResource: utils.isLocalResource,
          },
        )

        ctx.processed = result

        // Возвращаем строку для обновления заголовка
        return `Найдено ${result.resources.length} ресурсов`
      },
    },
    {
      title: 'Обработка ресурсов',
      task: (ctx, task) => {
        // Если нет ресурсов, сразу сохраняем HTML и завершаем
        if (ctx.processed.resources.length === 0) {
          log('Нет локальных ресурсов для скачивания')
          const html = ctx.processed.$.html()
          ctx.skipDownload = true
          ctx.finalHtml = html
          task.title = 'Нет ресурсов для загрузки'
          return
        }

        log(`Найдено ${ctx.processed.resources.length} локальных ресурсов для скачивания`)

        // Подготавливаем ресурсы для скачивания
        ctx.resourcesToDownload = ctx.processed.resources.map(resource => ({
          url: resource.url,
          filepath: path.join(dirpath, resource.filename),
          resource,
          filename: resource.filename,
        }))

        task.title = `Подготовка ${ctx.processed.resources.length} ресурсов`
      },
    },
    {
      title: 'Скачивание ресурсов',
      enabled: ctx => !ctx.skipDownload,
      task: (ctx, task) => downloader.downloadResources(ctx.resourcesToDownload)
        .then((downloadResults) => {
          ctx.downloadResults = downloadResults

          // Динамически обновляем заголовок с результатами
          const successCount = downloadResults.successfulCount
          const total = downloadResults.total
          const failedCount = downloadResults.failedCount

          if (failedCount > 0) {
            task.title = `Скачано: ${successCount}/${total} (ошибок: ${failedCount})`
          }
          else {
            task.title = `Скачано: ${successCount}/${total}`
          }

          log(`Ресурсы загружены: успешно ${successCount}, с ошибками ${failedCount}`)
        }),
    },
    {
      title: 'Обновление HTML',
      task: (ctx) => {
        if (ctx.skipDownload) {
          // Если не было скачивания, используем уже подготовленный HTML
          ctx.updatedHtml = ctx.finalHtml
          return
        }

        // Обновляем HTML с локальными путями
        ctx.updatedHtml = htmlProcessor.updateHtmlWithLocalPaths(
          ctx.processed.$,
          ctx.processed.resources,
          dirname,
        )
      },
    },
    {
      title: 'Сохранение файлов',
      task: ctx => fsp.writeFile(filepath, ctx.updatedHtml)
        .then(() => {
          log(`Страница сохранена в: ${filepath}`)
        }),
    },
  ], {
    concurrent: false, // Задачи выполняются последовательно
    exitOnError: true, // Прервать выполнение при ошибке
    renderer: 'default', // Изменено на 'default' чтобы не было лишних console.log
  })

  // Запускаем задачи и возвращаем результат
  return tasks.run()
    .then((ctx) => {
      // Формируем финальный результат
      const result = {
        htmlFile: filepath,
        resourcesDir: dirpath,
        resources: ctx.processed?.resources?.map(r => ({
          type: r.type,
          originalUrl: r.originalUrl,
          filename: r.filename,
          url: r.url,
        })) || [],
      }

      // Добавляем информацию о скачивании, если оно было
      if (ctx.downloadResults) {
        result.downloads = ctx.downloadResults
        result.summary = {
          total: ctx.downloadResults.total,
          successful: ctx.downloadResults.successfulCount,
          failed: ctx.downloadResults.failedCount,
        }
      }
      else if (ctx.skipDownload) {
        result.message = 'Нет локальных ресурсов для загрузки'
        result.summary = {
          total: 0,
          successful: 0,
          failed: 0,
        }
      }

      return result
    })
    .catch((error) => {
      log('Ошибка при загрузке страницы:', error)
      throw error
    })
}

export default pageLoader

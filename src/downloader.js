import axios from 'axios'
import fsp from 'fs/promises'
import debug from 'debug'

const log = debug('page-loader:downloader')

/**
 * Скачивает ресурс и сохраняет его
 */
export const downloadResource = (url, filepath) => {
  return axios({
    method: 'get',
    url,
    responseType: 'arraybuffer',
    validateStatus: status => status === 200,
  })
    .then((response) => {
      return fsp.writeFile(filepath, response.data)
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

/**
 * Скачивает несколько ресурсов
 */
export const downloadResources = (resources) => {
  const downloadPromises = resources.map(resource =>
    downloadResource(resource.url, resource.filepath),
  )

  return Promise.allSettled(downloadPromises)
    .then((results) => {
      const downloadErrors = []
      const successful = []

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          downloadErrors.push({
            url: resources[index].url,
            error: result.reason.message,
          })
          log(`Ресурс ${resources[index].url} не удалось скачать:`, result.reason.message)
        }
        else {
          successful.push(resources[index])
        }
      })

      return {
        successful,
        errors: downloadErrors,
        total: resources.length,
        successfulCount: successful.length,
        failedCount: downloadErrors.length,
      }
    })
}

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
  })
    .then((response) => {
      return fsp.writeFile(filepath, response.data)
    })
    .then(() => {
      log(`Ресурс ${url} успешно скачан`)
      return true
    })
}

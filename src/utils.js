import path from 'path'
import { URL } from 'url'
import debug from 'debug'

const log = debug('page-loader:utils')

/**
 * Создает имя файла для ресурса как в тестах
 */
export const createResourceName = (resourceUrl, baseUrl) => {
  try {
    const absoluteUrl = new URL(resourceUrl, baseUrl)
    const parsed = path.parse(absoluteUrl.pathname)

    // Берем host из baseUrl и заменяем точки на дефисы
    const host = new URL(baseUrl).hostname.replace(/[^a-zA-Z0-9]/g, '-')

    // Берем dir без начального слэша
    let dirPart = ''
    if (parsed.dir && parsed.dir !== '/') {
      dirPart = parsed.dir
        .slice(1) // Убираем начальный /
        .replace(/\//g, '-') + '-'
    }

    // name и ext уже есть в parsed
    const name = parsed.name || 'resource'
    const ext = parsed.ext || (() => {
      // Если нет расширения, пытаемся определить
      const lowerUrl = resourceUrl.toLowerCase()
      if (lowerUrl.includes('.css')) return '.css'
      if (lowerUrl.includes('.js')) return '.js'
      if (lowerUrl.includes('.png')) return '.png'
      if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return '.jpg'
      return '.html'
    })()

    return `${host}-${dirPart}${name}${ext}`
  }
  catch (error) {
    log(`Ошибка создания имени для ${resourceUrl}:`, error.message)
    return `resource-${Date.now()}.bin`
  }
}

/**
 * Генерирует имя для основного HTML файла
 */
export const generateName = (url, suffix) => {
  const parsedUrl = new URL(url)
  const host = parsedUrl.hostname.replace(/[^a-zA-Z0-9]/g, '-')
  const urlPath = parsedUrl.pathname === '/'
    ? ''
    : parsedUrl.pathname.replace(/[^a-zA-Z0-9]/g, '-')
  return `${host}${urlPath}${suffix}`
}

/**
 * Проверяет, является ли ресурс локальным
 */
export const isLocalResource = (resourceUrl, pageUrl) => {
  try {
    const pageOrigin = new URL(pageUrl).origin
    const resourceOrigin = new URL(resourceUrl, pageUrl).origin
    return resourceOrigin === pageOrigin
  }
  catch {
    return false
  }
}

/**
 * Получает имя файла для ресурса
 */
export const getResourceFilename = (resourceUrl, pageUrl) => {
  try {
    const absoluteUrl = new URL(resourceUrl, pageUrl).toString()
    const filename = createResourceName(resourceUrl, pageUrl)

    return {
      url: absoluteUrl,
      filename,
    }
  }
  catch (error) {
    log(`Не удалось обработать URL ${resourceUrl}:`, error.message)
    return null
  }
}

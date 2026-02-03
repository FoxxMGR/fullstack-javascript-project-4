import * as cheerio from 'cheerio'
import path from 'path'

/**
 * Собирает информацию о ресурсах из HTML
 */
export const collectResources = ($, url, {
  getResourceFilename,
  isLocalResource,
}) => {
  const resources = []

  // Обработка тегов img
  $('img').each((i, element) => {
    const src = $(element).attr('src')
    if (!src) return

    const resourceInfo = getResourceFilename(src, url)
    if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

    resources.push({
      element,
      originalUrl: src,
      url: resourceInfo.url,
      filename: resourceInfo.filename,
      type: 'image',
      attribute: 'src',
    })
  })

  // Обработка тегов link
  $('link').each((i, element) => {
    const href = $(element).attr('href')
    const rel = $(element).attr('rel')

    if (!href) return

    const resourceInfo = getResourceFilename(href, url)
    if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

    // Определяем тип ресурса
    let type = 'link'
    if (rel === 'stylesheet' || href.includes('.css')) {
      type = 'css'
    }

    resources.push({
      element,
      originalUrl: href,
      url: resourceInfo.url,
      filename: resourceInfo.filename,
      type,
      attribute: 'href',
    })
  })

  // Обработка тегов script
  $('script').each((i, element) => {
    const src = $(element).attr('src')
    if (!src) return

    const resourceInfo = getResourceFilename(src, url)
    if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

    resources.push({
      element,
      originalUrl: src,
      url: resourceInfo.url,
      filename: resourceInfo.filename,
      type: 'script',
      attribute: 'src',
    })
  })

  return { resources }
}

/**
 * Обновляет HTML с локальными путями
 */
export const updateHtmlWithLocalPaths = ($, resources, dirname) => {
  resources.forEach((resource) => {
    const relativePath = path.join(dirname, resource.filename)
    $(resource.element).attr(resource.attribute, relativePath)
  })

  return $.html()
}

/**
 * Обрабатывает HTML страницы
 */
export const processHtml = (html, url, utils) => {
  const $ = cheerio.load(html)
  const { resources } = collectResources($, url, utils)

  return {
    $,
    resources,
  }
}

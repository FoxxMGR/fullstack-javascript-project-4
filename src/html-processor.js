import * as cheerio from 'cheerio'
import path from 'path'
import debug from 'debug'

const log = debug('page-loader:html-processor')

/**
 * Собирает информацию о ресурсах из HTML
 */
export const collectResources = ($, url, {
  getResourceFilename,
  isLocalResource,
}) => {
  const resources = []
  const canonicalLinks = []

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

    if (rel === 'canonical') {
      const resourceInfo = getResourceFilename(href, url)
      if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

      canonicalLinks.push({
        element,
        originalUrl: href,
        url: resourceInfo.url,
        filename: resourceInfo.filename,
        type: 'canonical',
        attribute: 'href',
      })
    }
    else if (rel === 'stylesheet' || href.includes('.css')) {
      const resourceInfo = getResourceFilename(href, url)
      if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

      resources.push({
        element,
        originalUrl: href,
        url: resourceInfo.url,
        filename: resourceInfo.filename,
        type: 'css',
        attribute: 'href',
      })
    }
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

  return { resources, canonicalLinks }
}

/**
 * Обновляет HTML с локальными путями
 */
export const updateHtmlWithLocalPaths = ($, resources, canonicalLinks, dirname) => {
  // Обновляем обычные ресурсы
  resources.forEach((resource) => {
    const relativePath = path.join(dirname, resource.filename)
    $(resource.element).attr(resource.attribute, relativePath)
  })

  // Обновляем канонические ссылки
  canonicalLinks.forEach((link) => {
    const relativePath = path.join(dirname, link.filename)
    $(link.element).attr(link.attribute, relativePath)
  })

  return $.html()
}

/**
 * Обрабатывает HTML страницы
 */
export const processHtml = (html, url, utils) => {
  const $ = cheerio.load(html)
  const { resources, canonicalLinks } = collectResources($, url, utils)

  log(`Найдено ${resources.length} локальных ресурсов и ${canonicalLinks.length} канонических ссылок`)

  return {
    $,
    resources,
    canonicalLinks,
    originalHtml: html,
  }
}

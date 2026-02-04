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

  const tagConfigs = [
    {
      selector: 'img',
      attr: 'src',
    },
    {
      selector: 'link',
      attr: 'href',
    },
    {
      selector: 'script',
      attr: 'src',
    },
  ]

  tagConfigs.forEach((config) => {
    $(config.selector).each((_, element) => {
      const attrValue = $(element).attr(config.attr)
      if (!attrValue) return

      const resourceInfo = getResourceFilename(attrValue, url)
      if (!resourceInfo || !isLocalResource(resourceInfo.url, url)) return

      resources.push({
        element,
        originalUrl: attrValue,
        url: resourceInfo.url,
        filename: resourceInfo.filename,
        attribute: config.attr,
      })
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

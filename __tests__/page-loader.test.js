import fs from 'fs'
import path from 'path'
import nock from 'nock'
import os from 'os'

import pageLoader from '../src/page-loader.js'
import { expect, test, beforeEach } from '@jest/globals'

nock.disableNetConnect()

const getFixturePath = filename => path.resolve('./__fixtures__/', filename)

let pathTmp

beforeEach(async () => {
  pathTmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pageLoader-'))
})

test('pageLoader downloads page with all resources and replaces URLs', async () => {
  const htmlFixturePath = getFixturePath('downloaded.html')
  const cssFixturePath = getFixturePath('application.css')
  const scriptFixturePath = getFixturePath('runtime.js')
  const imageFixturePath = getFixturePath('logo.png')

  const htmlFixture = await fs.promises.readFile(htmlFixturePath, 'utf-8')
  const cssFixture = await fs.promises.readFile(cssFixturePath, 'utf-8')
  const scriptFixture = await fs.promises.readFile(scriptFixturePath, 'utf-8')
  const imageFixture = await fs.promises.readFile(imageFixturePath)

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, htmlFixture)
    .get('/courses')
    .reply(200, htmlFixture, {
      'Content-Type': 'text/html',
    })
    .get('/assets/application.css')
    .reply(200, cssFixture, {
      'Content-Type': 'text/css',
    })
    .get('/packs/js/runtime.js')
    .reply(200, scriptFixture, {
      'Content-Type': 'application/javascript',
    })
    .get('/assets/professions/nodejs.png')
    .reply(200, imageFixture, {
      'Content-Type': 'image/png',
    })

  await pageLoader('https://ru.hexlet.io/courses', pathTmp)

  const pageLoaderHtmlPath = path.resolve(pathTmp, 'ru-hexlet-io-courses.html')
  const pageLoaderHtml = await fs.promises.readFile(pageLoaderHtmlPath, 'utf-8')

  const expectedHtmlPath = getFixturePath('expected.html')
  const expectedHtml = await fs.promises.readFile(expectedHtmlPath, 'utf-8')

  expect(expectedHtml).toEqual(pageLoaderHtml)

  const expectedCssFixturePath = getFixturePath('application.css')
  const expectedCss = await fs.promises.readFile(expectedCssFixturePath, 'utf-8')

  const expectedJsFixturePath = getFixturePath('runtime.js')
  const expectedJs = await fs.promises.readFile(expectedJsFixturePath, 'utf-8')

  const expectedImgFixturePath = getFixturePath('logo.png')
  const expectedImg = await fs.promises.readFile(expectedImgFixturePath)

  const downloadedCssPath = path.resolve(
    pathTmp,
    'ru-hexlet-io-courses_files',
    'ru-hexlet-io-assets-application.css',
  )
  const downloadedCss = await fs.promises.readFile(downloadedCssPath, 'utf-8')
  expect(downloadedCss).toEqual(expectedCss)

  const downloadedJsPath = path.resolve(
    pathTmp,
    'ru-hexlet-io-courses_files',
    'ru-hexlet-io-packs-js-runtime.js',
  )
  const downloadedJs = await fs.promises.readFile(downloadedJsPath, 'utf-8')
  expect(downloadedJs).toEqual(expectedJs)

  const downloadedImgPath = path.resolve(
    pathTmp,
    'ru-hexlet-io-courses_files',
    'ru-hexlet-io-assets-professions-nodejs.png',
  )
  const downloadedImg = await fs.promises.readFile(downloadedImgPath)
  expect(downloadedImg).toEqual(expectedImg)
})

test('pageLoader throws error on network failure', async () => {
  nock('https://example.com')
    .get('/')
    .replyWithError('Network error')

  await expect(pageLoader('https://example.com', pathTmp))
    .rejects
    .toThrow('Network error')
})

test('pageLoader throws error on HTTP 404', async () => {
  nock('https://example.com')
    .get('/')
    .reply(404, 'Not Found')

  await expect(pageLoader('https://example.com', pathTmp))
    .rejects
    .toThrow('Request failed with status code 404')
})

test('pageLoader throws error on HTTP 500', async () => {
  nock('https://example.com')
    .get('/')
    .reply(500, 'Internal Server Error')

  await expect(pageLoader('https://example.com', pathTmp))
    .rejects
    .toThrow('Request failed with status code 500')
})

test('pageLoader throws error on non-existent directory', async () => {
  const url = 'https://example.com'
  const nonExistentDir = '/non/existent/directory'

  await expect(pageLoader(url, nonExistentDir))
    .rejects
    .toThrow(/ENOENT/)
})

test('pageLoader throws error on directory without write permission', async () => {
  const url = 'https://example.com'
  const protectedDir = '/root'

  await expect(pageLoader(url, protectedDir))
    .rejects
    .toThrow(/EACCES/)
})

test('pageLoader works with no local resources', async () => {
  const htmlFixturePath = getFixturePath('no-local-resources.html')
  const htmlNoResources = await fs.promises.readFile(htmlFixturePath, 'utf-8')

  nock('https://example.com')
    .get('/')
    .reply(200, htmlNoResources)

  // Проверяем что функция выполняется успешно (без ошибок)
  const result = await pageLoader('https://example.com', pathTmp)

  // Проверяем структуру возвращаемого объекта
  expect(result).toHaveProperty('htmlFile')
  expect(result).toHaveProperty('resourcesDir')
  expect(result).toHaveProperty('message')
  expect(result.message).toBe('Нет локальных ресурсов для загрузки')
  expect(result.summary).toEqual({
    total: 0,
    successful: 0,
    failed: 0,
  })

  // Проверяем что файл создан
  const expectedFilePath = path.join(pathTmp, 'example-com.html')
  const fileExists = await fs.promises.access(expectedFilePath)
    .then(() => true)
    .catch(() => false)

  expect(fileExists).toBe(true)

  // Проверяем содержимое файла
  const downloadedHtml = await fs.promises.readFile(expectedFilePath, 'utf-8')
  expect(downloadedHtml).toBe(htmlNoResources)
})

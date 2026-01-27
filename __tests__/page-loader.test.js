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
  // await fs.promises.rmdir(path.join(os.tmpdir(), 'pageLoader-'))
  pathTmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pageLoader-'))
})

test('log', async () => {
  // Пути к предполагаемым фикстурам
  const htmlFixturePath = getFixturePath('downloaded.html') // Основной HTML
  const cssFixturePath = getFixturePath('application.css') // CSS файл
  const scriptFixturePath = getFixturePath('runtime.js') // JavaScript файл
  const imageFixturePath = getFixturePath('logo.png') // Изображение

  // Читаем фикстуры
  const htmlFixture = await fs.promises.readFile(htmlFixturePath, 'utf-8')
  const cssFixture = await fs.promises.readFile(cssFixturePath, 'utf-8')
  const scriptFixture = await fs.promises.readFile(scriptFixturePath, 'utf-8')
  const imageFixture = await fs.promises.readFile(imageFixturePath)

  // 1. Перехватываем запрос к основной странице
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, htmlFixture)
    .get('/assets/application.css')
    .reply(200, cssFixture, {
      'Content-Type': 'text/css', // Указываем правильный Content-Type
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

  // Читаем файл из этой папки, тот файл который мы скачали.
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

import fs from 'fs'
import path from 'path'
import nock from 'nock'
import os from 'os'
import axios from 'axios'
// import httpAdapter from 'axios/lib/adapters/http'
import pageLoader from '../src/page-loger.js'
import { expect, test } from '@jest/globals'

nock.disableNetConnect()
// axios.defaults.adapter = httpAdapter

const getFixturePath = filename => path.resolve('./__fixtures__/', filename)

let pathTmp

beforeEach(async () => {
  pathTmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pageLoader-'))
})

test('log', async () => {
  const fixturePath = getFixturePath('ru-hexlet-io-courses.html')
  const expectedHtml = await fs.promises.readFile(fixturePath, 'utf-8')
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, expectedHtml)
  console.log(expectedHtml)

  // С помощью программы пагелоадер скачиваем файл  и сохраняем в какую то папку

  await pageLoader('https://ru.hexlet.io/courses', pathTmp)

  // Читаем файл из этой папки, тот файл который мы скачали.
  const downloadedHtmlPath = path.resolve(pathTmp, 'ru-hexlet-io-courses.html')
  const downloadedHtml = await fs.promises.readFile(downloadedHtmlPath, 'utf-8')

  // Подставляем в сравнение файл
  expect(expectedHtml).toEqual(downloadedHtml)
})

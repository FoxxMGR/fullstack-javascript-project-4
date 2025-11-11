import nock from 'nock'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { downloadPage, generateFilename } from '../src/page-loader.js'

describe('Page Loader', () => {
  let tempDir
  const testUrl = 'https://ru.hexlet.io/courses'
  const testHtml = '<html><body>Test content</body></html>'

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
    nock.cleanAll()
  })

  describe('generateFilename', () => {
    it('should generate correct filename from URL', () => {
      expect(generateFilename(testUrl)).toBe('ru-hexlet-io-courses.html')
    })

    it('should handle URLs with special characters', () => {
      const url = 'https://example.com/path?query=value&other=123'
      expect(generateFilename(url)).toBe('example-com-path-query-value-other-123.html')
    })

    it('should handle URLs with multiple subdomains', () => {
      const url = 'https://sub1.sub2.example.com/page'
      expect(generateFilename(url)).toBe('sub1-sub2-example-com-page.html')
    })
  })

  describe('downloadPage', () => {
    it('should download page and save to file', async () => {
      nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, testHtml)

      const filepath = await downloadPage(testUrl, tempDir)

      const expectedFilename = 'ru-hexlet-io-courses.html'
      const expectedPath = path.join(tempDir, expectedFilename)

      expect(filepath).toBe(expectedPath)

      const content = await fs.readFile(filepath, 'utf-8')
      expect(content).toBe(testHtml)
    })

    it('should use current directory when no output dir specified', async () => {
      nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, testHtml)

      const filepath = await downloadPage(testUrl)

      expect(filepath).toMatch(/ru-hexlet-io-courses\.html$/)
    })

    it('should throw error when URL is invalid', async () => {
      await expect(downloadPage('invalid-url', tempDir))
        .rejects
        .toThrow()
    })

    it('should throw error when server returns 404', async () => {
      nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(404)

      await expect(downloadPage(testUrl, tempDir))
        .rejects
        .toThrow()
    })

    it('should throw error when output directory does not exist', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent')

      nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, testHtml)

      await expect(downloadPage(testUrl, nonExistentDir))
        .rejects
        .toThrow()
    })
  })
})

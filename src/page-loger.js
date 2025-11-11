import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const generateFilename = (url) => {
  const urlWithoutProtocol = url.replace(/^https?:\/\//, '')
  const filename = urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')
  return `${filename}.html`
}

const downloadPage = (url, outputDir = process.cwd()) => {
  return new Promise((resolve, reject) => {
    axios.get(url, { responseType: 'arraybuffer' })
      .then((response) => {
        const filename = generateFilename(url)
        const filepath = path.resolve(outputDir, filename)

        fs.writeFile(filepath, response.data)
          .then(() => resolve(filepath))
          .catch(error => reject(error))
      })
      .catch(error => reject(error))
  })
}

export { downloadPage, generateFilename }

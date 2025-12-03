import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, URLSearchParams } from 'url'
import { generateFilename } from './utils.js'

const pageLoader = (url, outputDir) => {
  const filename = generateFilename(url)
  // console.log(filename)
  const filepath = path.resolve(outputDir, filename)
  const html = axios.get(url)
    .then((respons) => respons.data)
    // .then((data) => console.log(data))
    .then((data) => fs.writeFile(filepath, data))
    .then(() => console.log(filepath))
  return html
}

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// const downloadPage = (url, outputDir = process.cwd()) => {
//   return new Promise((resolve, reject) => {
//     axios.get(url, { responseType: 'arraybuffer' })
//       .then((response) => {
//         const filename = generateFilename(url)
//         const filepath = path.resolve(outputDir, filename)

//   fs.writeFile(filepath, response.data)
//     .then(() => resolve(filepath))
//     .catch(error => reject(error))
// })
//       .catch(error => reject(error))
//   })
// }

export default pageLoader

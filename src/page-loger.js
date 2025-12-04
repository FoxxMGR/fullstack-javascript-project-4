import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
// import { fileURLToPath, URLSearchParams } from 'url'
import { generateName } from './utils.js'

const pageLoader = (url, outputDir) => {
  const filename = generateName(url, '.html')
  const dirname = generateName(url, '_files')
  // console.log(filename)
  const filepath = path.resolve(outputDir, filename)
  const dirpath = path.resolve(outputDir, dirname)
  const html = axios.get(url)
    .then((respons) => respons.data)
    // .then((data) => console.log(data))
    .then((data) => fs.writeFile(filepath, data))
    .then(() => fs.mkdir(dirpath))
    .then()
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

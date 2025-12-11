// const generateName = (url, type) => {
//   const urlWithoutProtocol = url.replace(/^https?:\/\//, '')
//   const filename = urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')
//   return `${filename}${type}`
// }

// export { generateName }
import path from 'path';

export const generateName = (url, suffix = '') => {
  try {
    const parsedUrl = new URL(url)
    
    // Получаем путь без расширения
    let pathname = parsedUrl.pathname
    
    // Удаляем расширение файла из пути (если есть)
    const extension = path.extname(pathname) 
    
    if (extension) {
      pathname = pathname.slice(0, -extension.length)
    }

    // Объединяем hostname и pathname
    let name = parsedUrl.hostname + pathname

    // Удаляем начальный и конечный слэши
    name = name.replace(/^\/+|\/+$/g, '')

    // Заменяем все не-буквенно-цифровые символы на дефисы
    name = name.replace(/[^a-zA-Z0-9]/g, '-')

    // Убираем множественные дефисы
    name = name.replace(/-+/g, '-')

    // Убираем дефисы в начале и конце
    name = name.replace(/^-+|-+$/g, '')

    return name + suffix
  }
  catch (error) {
    throw new Error(`Invalid URL: ${error}`)
  }
}

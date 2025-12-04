const generateName = (url, type) => {
  const urlWithoutProtocol = url.replace(/^https?:\/\//, '')
  const filename = urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')
  return `${filename}${type}`
}

export { generateName }

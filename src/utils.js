const generateFilename = (url) => {
  const urlWithoutProtocol = url.replace(/^https?:\/\//, '')
  const filename = urlWithoutProtocol.replace(/[^a-zA-Z0-9]/g, '-')
  return `${filename}.html`
}

export { generateFilename }

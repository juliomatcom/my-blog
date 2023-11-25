import fs from 'node:fs'
import path from 'node:path'

const dirname = path.dirname(new URL(import.meta.url).pathname)

function getLayoutSync () {
  const layoutPath = path.join(dirname, '../../pages/index.html')
  return fs.readFileSync(layoutPath, 'utf8')
}

export {
  getLayoutSync
}

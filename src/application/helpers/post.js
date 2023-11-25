function getPostDate (filename) {
  const matchDate = /(\d{4}-\d{2}-\d{2})/
  return new Date(filename.match(matchDate)[0].replace('.md', ''))
}

function getPostTitle (str) {
  return str.split('\n')[0].replace('#', '')
}

export {
  getPostDate,
  getPostTitle
}

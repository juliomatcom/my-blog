function getPostTitle (str) {
  return str.split('\n')[0].replace('#', '').trim()
}

export {
  getPostTitle
}

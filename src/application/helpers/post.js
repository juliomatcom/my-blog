function getPostTitle (str) {
  return str.split('\n')[0].replace('#', '')
}

export {
  getPostTitle
}

function render ({ layout, posts }) {
  const postList = posts
    .map(
      ({ title, link }) => `<li><a title="Read:${title}" href="${link}">${title}</a></li>`
    ).join('')

  const html = layout
    .replace('<!--content-->', `
    <div class="center">
      <a title="Go to my GitHub page" href="https://github.com/juliomatcom" target="_blank">
        <img src="/images/icons8-github-30a.png" alt="GitHub" class="github-icon"/>
        <img src="https://avatars.githubusercontent.com/u/8549955?v=4" alt="Profile" class="avatar"/>
      </a>
      <p>
        <code>Software Engineer | DDD & Microservices Enthusiast | Homelab Explorer 🚀</code>
      </p>
    </div>
    <span class="typewriter">My blog</span>
    <ul class="posts">${postList}</ul>
  `)
    .replace('<!--title-->', 'Julio Cesar Martin - Software Engineer')
    .replace('<!--meta_content-->', '<meta name="description" content="Julio Cesar Martin - Software Engineer">')
  return html
}

export default render

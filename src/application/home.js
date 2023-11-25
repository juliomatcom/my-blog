function render ({ layout, postList }) {
  const html = layout
    .replace('<!--content-->', `
    <div class="center">
      <a title="Go to my GitHub page" href="https://github.com/juliomatcom" target="_blank">
        <img src="/icons8-github-30a.png" alt="GitHub" class="github-icon"/>
        <img src="https://avatars.githubusercontent.com/u/8549955?v=4" alt="Profile" class="avatar"/>
      </a>
    </div>
    <span class="typewriter">My blog</span>
    <ul>${postList}</ul>
  `)
    .replace('<!--title-->', 'Julio Cesar Martin')
  return html
}

export default render

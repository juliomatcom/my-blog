document.getElementById('contactMe').addEventListener('click', contactMe)
addFooter()
selectActiveMeny()

function contactMe (e) {
  const m = ['juliomatcom', '@', 'gmail.com']
  window.open('mailto:' + m.join(''), '_blank')
  e.preventDefault()
}

function addFooter () {
  const footer = document.querySelector('footer p')
  footer.innerHTML = `&copy; ${new Date().getFullYear()} Julio César Martín`
}

function selectActiveMeny () {
  const currentPath = window.location.pathname
  const links = document.querySelectorAll('nav a')
  links.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active')
    }
  })
}

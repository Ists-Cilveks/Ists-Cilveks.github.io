// Add <style> that hides elements of languges other than the one selected (in the URL) and add buttons that let the user change languages
// Use in a <script> tag with an attribute: my-languges="en,lv"

/* <style> insertion based on https://stackoverflow.com/a/524721/10630826 */
let head = document.head || document.getElementsByTagName('head')[0]
let style = document.createElement('style')
head.appendChild(style)
style.type = 'text/css'
style.id = "language-hider"

let languagesString = document.currentScript.getAttribute("my-languges")
if (languagesString == null) {
  var languages = []
} else {
  var languages = languagesString.split(',')
}

if (languages.length > 1) {
  // Add the language selection
  let header = document.getElementById("main-header")
  // TODO: if no header exists, make one.
  let languageDiv = document.createElement('div')
  languageDiv.className = "language-select"
  header.appendChild(languageDiv)

  for (let l = 0; l < languages.length; l++) {
    const lang = languages[l];
    let btn = document.createElement('div')
    btn.innerText = lang.toUpperCase()
    btn.className = "basic-btn language-btn"
    btn.addEventListener("click", function (event) {
      setLanguage(lang)
      animatePop(event, 'leafy', undefined, 5, 35, -20, 20);
    })
    languageDiv.appendChild(btn)
  }
}

function resetLanguageFromURL() {
  // Set the language to whatever the 'l' query is set to, or English as a default
  let urlParams = new URLSearchParams(window.location.search)
  let language = urlParams.get('l')  

  // Resorts to English if you attempt to use an unsupported language
  if (!languages.includes(language)) {
    language = 'en'
    const url = new URL(window.location)
    url.searchParams.delete('l')
    history.pushState(null, '', url)
  }

  setLanguageStyles(language)
}
function setLanguageStyles(language) {
  // Hide all language-specific elements except for the selected language (English by default).
  // Elements of one language inside an element of (another) language aren't translated, so this selects all the elements that need to be shown/hidden to change the language of the page. To be clear, this is jank.
  let style = document.getElementById('language-hider')
  style.textContent = "[lang]:not([lang] [lang]):not([lang='"+language+"']) {display: none;}"
}
function setLanguage(language) {
  // Set the URL query and styles
  // https://stackoverflow.com/a/41542008/10630826
  if ('URLSearchParams' in window) {
    const url = new URL(window.location)
    url.searchParams.set('l', language)
    history.pushState(null, '', url)
  }
  setLanguageStyles(language)
}

resetLanguageFromURL()
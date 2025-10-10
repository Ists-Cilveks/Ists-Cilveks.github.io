const allThemes = {
  "dark": {
    "icon-name": "theme-icon-dark",
    "bg-color": "#3a2005",
    "highlights": "#f20898",
    "light-up": "#e5ff00",
    "framing": "#9dff00",
    "deep-framing": "#00a341",
    "is-light-mode": "0",
  },
  "light": {
    "icon-name": "theme-icon-light",
    "bg-color": "#fff5ea",
    "highlights": "#f20898",
    "light-up": "#bae900",
    "framing": "#70d900",
    "deep-framing": "#00a341",
    "is-light-mode": "1",
  },
}

let header = document.getElementById("main-header")
// TODO: if no header exists, make one.
let themeDiv = document.createElement('div')
themeDiv.className = "theme-select"
header.appendChild(themeDiv)

let btn = document.createElement('button')
btn.style.width = "2em"
insertSVG("/js/theme icons.svg")
btn.innerHTML = `
<svg style="width: 100%; fill: black;" viewbox="0 0 48.697 46.475">
  <use id="theme-button-use-element" xlink:href="#theme-icon-dark">
  </use>
</svg>
`

btn.className = "basic-btn theme-btn"
btn.addEventListener("click", function (event) {
  switchTheme(true)
  themeIsSystemDefault = false
  animatePop(event, btn, undefined, 'pop', 6, undefined, undefined, 50, undefined);
})
themeDiv.appendChild(btn)

let theme = localStorage.getItem("theme")
let themeIsSystemDefault

if (theme == null) { // not set by user, default to system theme if available, or finally to dark theme
  themeIsSystemDefault = true

  const lightThemeMq = window.matchMedia("(prefers-color-scheme: light)");
  if (lightThemeMq.matches) {
    setTheme("light")
  } else {
    setTheme("dark")
  }

  lightThemeMq.addEventListener(undefined, e => {
    if (!themeIsSystemDefault) { // don't keep following the system theme if the user has changed it manually
      return
    }
    if (e.matches) {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  });
}
else { // set by user
  themeIsSystemDefault = false

  setTheme(theme)
}

function setTheme(newTheme, storeLocally=false){
  if (newTheme in allThemes) {
    theme = newTheme
  }
  else {
    theme = "dark"
  }

  let themeObj = allThemes[theme]
  for (const [key, value] of Object.entries(themeObj)) {
    // FIXME: sets some variables that aren't necessary (like icon-name, which is just used in this script)
    document.documentElement.style.setProperty("--"+key, value);
  }

  let use = document.getElementById("theme-button-use-element")
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', "#"+themeObj["icon-name"]);
  if (storeLocally) {
    localStorage.setItem("theme", newTheme)
  }

  recomputePalette()
}
function switchTheme(storeLocally=false){
  if (theme=="dark") {
    setTheme("light", storeLocally)
  }
  else { // should i also check for cases other than light?
    setTheme("dark", storeLocally)
  }
}

recomputePalette()

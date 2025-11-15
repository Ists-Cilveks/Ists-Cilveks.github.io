// Given the basic colors of a color palette, flesh it out with mixed colors and set the corresponding css properties to those.

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

class Palette {
  constructor() {
    this.listeners = []
    // this.recompute()
    this.sourceColors = {
      // 'is-light-mode': 'isLightMode',
      'bg-color': 'BG',
      'highlights': 'highlights',
      'light-up': 'lightUp',
      'framing': 'framing',
      'deep-framing': 'deepFraming',
    }
  }

  setFromThemeName (name) {
    this.setFromTheme(allThemes[name])
  }

  setFromTheme (theme) {
    let thisPalette = this

    let setFromName = function (key) {
      let newColor = theme[key]
      thisPalette.setColor(key, ColorFromHex(newColor))
    }
    
    this.isLightMode = theme["is-light-mode"]
    Object.keys(this.sourceColors).forEach(function(key, index) {
      setFromName(key)
    });
  }

  recompute () {
    // calculating new values
    let newCol = {}
    let thisPalette = this

    let setColor = function (name, value) {
      thisPalette.setColor(name, value)
      document.body.style.setProperty('--'+name, value.rgb())
    }
    
    setColor('hc-bg', this.isLightMode=="1" ? colors.white : colors.black)
    setColor('hc-fg', this.isLightMode=="1" ? colors.black : colors.white)
    setColor('secondary-bg-color', this.BG.mix(this.deepFraming, 0.2))
    setColor('secondary-bg-lowered', this['secondary-bg-color'].mix(colors.black, 0.2).mix(this.BG, 0.4))
    // set('subtle-framing', deepFraming.mix(this['hc-fg'], 0.4).mix(BG, 0.5))
    setColor('main-color', this['hc-fg'].mix(this.highlights, 0.15))
    // set('title', this['hc-fg'].mix(this.highlights, 0.75)) // mneh, doesn't look good
    setColor('title', this['main-color'])
    setColor('subtle-hc-fg', this['hc-fg'].mix(this.BG, 0.3))
    setColor('subtler', this['subtle-hc-fg'].mix(this.highlights, 0.2))
    setColor('subtle-light', this['subtle-hc-fg'].mix(this.lightUp, 0.4))
    setColor('subtle-lowered', this['subtler'].mix(this.BG, 0.3))
    setColor('subtle-glow', this['subtler'].mix(this.framing, 0.5)) // TODO: won't work if framing is not a light and bright color
    setColor('subtle-tinted', this['subtle-hc-fg'].mix(this.highlights, 0.7))
    
    setColor('subtle-framing', this.deepFraming.mix(this['hc-fg'], 0.05).mix(this.BG, 0.3))

    this.isDarkMode = this.isLightMode=="1" ? "0" : "1"
    document.body.style.setProperty('--is-dark-mode', this.isDarkMode)
    this["is-dark-mode"] = this.isDarkMode

    this.callListeners()
  }

  addListener (listener) {
    "Add a function that will get called whenever this palette changes"
    this.listeners.push(listener)
  }

  callListeners () {
    for (const listener of this.listeners) {
      listener()
    }
  }

  setColor (key, newColor) {
    // TODO: is this good? Will this cause strange unexpected problems because of the palette changing in the middle of being used?
    if (key in this) {
      this[key].set(newColor)
    }
    else {
      this[key] = newColor.copy()
      if (key in this.sourceColors) {
        let shorthandKey = this.sourceColors[key]
        this[shorthandKey] = this[key]
      }
    }
  }
}

var globalPalette = new Palette()

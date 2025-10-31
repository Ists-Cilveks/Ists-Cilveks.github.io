// Given the basic colors of a color palette, flesh it out with mixed colors and set the corresponding css properties to those.

class Palette {
  constructor() {
    this.listeners = []
    // this.recompute()
  }

  recompute () {
    // reading properties
    let palette_original_style = window.getComputedStyle(document.body)
    let getColor = (name) => ColorFromHex(palette_original_style.getPropertyValue(name))
    
    this.isLightMode = palette_original_style.getPropertyValue("--is-light-mode")
    this.BG = getColor('--bg-color')
    this.highlights = getColor('--highlights')
    this.lightUp = getColor('--light-up')
    this.framing = getColor('--framing')
    this.deepFraming = getColor('--deep-framing')
    
    // calculating new values
    let newCol = {}
    
    newCol['hc-bg'] = this.isLightMode=="1" ? colors.white.copy() : colors.black.copy()
    newCol['hc-fg'] = this.isLightMode=="1" ? colors.black.copy() : colors.white.copy()
    newCol['secondary-bg-color'] = this.BG.mix(this.deepFraming, 0.2)
    newCol['secondary-bg-lowered'] = newCol['secondary-bg-color'].mix(colors.black, 0.2).mix(this.BG, 0.4)
    // newCol['subtle-framing'] = deepFraming.mix(newCol['hc-fg'], 0.4).mix(BG, 0.5)
    newCol['main-color'] = newCol['hc-fg'].mix(this.highlights, 0.15)
    // newCol['title'] = newCol['hc-fg'].mix(this.highlights, 0.75) // mneh, doesn't look good
    newCol['title'] = newCol['main-color']
    newCol['subtle-hc-fg'] = newCol['hc-fg'].mix(this.BG, 0.3)
    newCol['subtler'] = newCol['subtle-hc-fg'].mix(this.highlights, 0.2)
    newCol['subtle-light'] = newCol['subtle-hc-fg'].mix(this.lightUp, 0.4)
    newCol['subtle-lowered'] = newCol['subtler'].mix(this.BG, 0.3)
    newCol['subtle-glow'] = newCol['subtler'].mix(this.framing, 0.5) // TODO: won't work if framing is not a light and bright color
    newCol['subtle-tinted'] = newCol['subtle-hc-fg'].mix(this.highlights, 0.7)
    
    newCol['subtle-framing'] = this.deepFraming.mix(newCol['hc-fg'], 0.05).mix(this.BG, 0.3)

    let thisPalette = this
    
    // assigning properties
    Object.keys(newCol).forEach(function(key, index) {
      document.body.style.setProperty('--'+key, newCol[key].rgb())
      thisPalette.setColor(key, newCol[key])
    });
    
    this.isDarkMode = this.isLightMode=="1" ? "0" : "1"
    document.body.style.setProperty('--is-dark-mode', this.isDarkMode)
    this["is-dark-mode"] = this.isDarkMode

    this.callListeners()
  }

  addListener (listener) {
    this.listeners.append(listener)
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
      this[key] = newColor
    }
  }
}

var globalPalette = new Palette()

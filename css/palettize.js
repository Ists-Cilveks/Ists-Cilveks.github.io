// Given the basic colors of a color palette, flesh it out with mixed colors and set the corresponding css properties to those.

// reading properties
let palette_original_style = window.getComputedStyle(document.body)
let getColor = (name) => ColorFromHex(palette_original_style.getPropertyValue(name))

isLightMode = palette_original_style.getPropertyValue("--is-light-mode")
BG = getColor('--bg-color')
highlights = getColor('--highlights')
lightUp = getColor('--light-up')
framing = getColor('--framing')
deepFraming = getColor('--deep-framing')

// calculating new values
newCol = {}

newCol['--hc-bg'] = isLightMode=="1" ? colors.white : colors.black
newCol['--hc-fg'] = isLightMode=="1" ? colors.black : colors.white
newCol['--secondary-bg-color'] = BG.mix(framing, 0.15)
newCol['--secondary-bg-lowered'] = BG.mix(framing, 0.1)
newCol['--main-color'] = newCol['--hc-fg'].mix(highlights, 0.15)
// newCol['--title'] = newCol['--hc-fg'].mix(highlights, 0.75) // mneh, doesn't look good
newCol['--title'] = newCol['--main-color']
newCol['--subtle-hc-fg'] = newCol['--hc-fg'].mix(BG, 0.3)
newCol['--subtler'] = newCol['--subtle-hc-fg'].mix(highlights, 0.2)
newCol['--subtle-light'] = newCol['--subtle-hc-fg'].mix(lightUp, 0.4)
newCol['--subtle-lowered'] = newCol['--subtler'].mix(BG, 0.3)
newCol['--subtle-glow'] = newCol['--subtler'].mix(framing, 0.5) // TODO: won't work if framing is not a light and bright color
newCol['--subtle-tinted'] = newCol['--subtle-hc-fg'].mix(highlights, 0.7)

newCol['--subtle-framing'] = framing.mix(BG, 0.4)

// assigning properties
Object.keys(newCol).forEach(function(key,index) {
    document.body.style.setProperty(key, newCol[key].rgb())
});

document.body.style.setProperty('--is-dark-mode', isLightMode=="1" ? "0" : "1")
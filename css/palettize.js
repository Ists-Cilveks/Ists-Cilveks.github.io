// Given the basic colors of a color palette, flesh it out with mixed colors and set the corresponding css properties to those.

// reading properties
let palette_original_style = window.getComputedStyle(document.body)
let getColor = (name) => ColorFromHex(palette_original_style.getPropertyValue(name))

isLightMode = palette_original_style.getPropertyValue("--is-light-mode")
BG = getColor('--bg-color')
highlights = getColor('--highlights')
framing = getColor('--framing')

// calculating new values
newCol = {}
newCol['--hc-bg'] = isLightMode=="1" ? colors.white : colors.black
newCol['--hc-fg'] = isLightMode=="1" ? colors.black : colors.white
newCol['--secondary-bg-color'] = BG.mix(framing, 0.15)
newCol['--main-color'] = newCol['--hc-fg'].mix(highlights, 0.15)
newCol['--subtle-hc-fg'] = newCol['--hc-fg'].mix(BG, 0.4)
newCol['--subtler'] = newCol['--subtle-hc-fg'].mix(highlights, 0.1)
newCol['--subtle-tinted'] = newCol['--subtle-hc-fg'].mix(highlights, 0.2)

// assigning properties
Object.keys(newCol).forEach(function(key,index) {
    document.body.style.setProperty(key, newCol[key].rgb())
});

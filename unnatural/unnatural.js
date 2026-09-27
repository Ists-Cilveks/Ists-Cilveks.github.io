const phi = (1+5**(1/2))/2
const logphi = Math.log(phi)

const Unnatural = {
  base: 9,
  UTF8Digits: {
    "0":"1", "1":"φ", "2":"θ", "3":"ᘔ", "4":"ᘔ<sub>φ</sub>", "5":"ᘔ<sub>θ</sub>", "6":"ε", "7":"ε<sub>φ</sub>", "8":"ε<sub>θ</sub>",
    ".":".", "-":"/",
  },

  digit_utf8: function(d){
    if (d in this.UTF8Digits) {
      return this.UTF8Digits[d]
    }
    return d
  },
  digit_svg: function(d){
    let text = document.createTextNode(d)
    if (d in this.UTF8Digits) {
      if (d == "-") return text
      if (d == ".") d = "dot"
      else d = String(1+Number(d))
      
      let w = 800
      let h_em = 1
      let id = "unnatural-"+d
      let font = document.getElementById("unnatural-font")
      if (font) {
        let el = font.getElementById(id)
        if (!el) return text
        let neww = el.getAttribute("horiz-adv-x").split(",")[0]
        if (neww) {
          w = Number(neww)
        }
      }
      let w_em = h_em*w/1000

      let container = document.createElement("span")
      container.style = "height: "+h_em+"em; width: "+w_em+"em; display: inline-block; position: relative"
      let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      container.appendChild(svg)
      svg.style = "height: "+h_em+"em; position: absolute; left: -0.13em;"
      svg.setAttribute("viewBox", "0 0 1000 1000")
      var use = document.createElementNS("http://www.w3.org/2000/svg", 'use')
      use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#"+id)
      svg.appendChild(use)
      return container
      // var useSVG = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      // useSVG.setAttributeNS('http://www.w3.org/1999/xlink','href','http://ists-cilveks.github.io/buttons/me.png');
      // useSVG.setAttribute('x','10');
      // useSVG.setAttribute('y','40');
      // useSVG.setAttribute('width','180');
      // useSVG.setAttribute('height','120');
      // return useSVG
    }
    return text
  },

  represent_standard: function(v) {
    return (Math.log(v)/logphi).toString(this.base) // Represent in base 9
  },
  represent_utf8: function(v) {
    let standardRepresentation = this.represent_standard(v)
    let res = ""
    for (const digit of standardRepresentation) {
      res += this.digit_utf8(digit)
    }
    return res
  },

  writeUnnaturalToOutput_utf8: function(out, val) {
    out.innerHTML = this.represent_utf8(val)
  },
  writeUnnaturalToOutput_svg: function(out, val) {
    let standardRepresentation = this.represent_standard(val)
    out.innerHTML = ""
    for (const digit of standardRepresentation) {
      out.appendChild(this.digit_svg(digit))
    }
  },

  writeUnnaturalToOutput: function(out, val) {
    this.writeUnnaturalToOutput_svg(out, val)
  },

  replaceSpecialElements: function(document) {
    for (const digit of "012345678.") {
      let classSuffix = digit
      if (digit==".") classSuffix = "dot"
      else classSuffix = String(Number(digit)+1)
      for (let el of document.getElementsByClassName("unnatural-"+classSuffix)) {
        let prettyNumber = this.digit_svg(digit)
        el.innerHTML = ""
        prettyNumber.style.fontSize = "163%"
        prettyNumber.style.bottom = "-0.25em"
        el.appendChild(prettyNumber)
      }
    }
  },
}

const invisibleSVGContainer = document.createElement("div")
invisibleSVGContainer.style.display = "none"
invisibleSVGContainer.style.display = "invisible-svg-container"
document.body.appendChild(invisibleSVGContainer)

function insertSVG(fileName) {
  // using https://stackoverflow.com/a/14070928/10630826
  xhr = new XMLHttpRequest()
  xhr.open("GET", fileName, false)
  xhr.overrideMimeType("image/svg+xml") // just to be on the safe side; not needed if your server delivers SVG with correct MIME type
  xhr.onload = function(e) {
    // You might also want to check for xhr.readyState/xhr.status here
    doc = xhr.responseXML.documentElement
    invisibleSVGContainer.appendChild(doc)
  };
  xhr.send("");
}
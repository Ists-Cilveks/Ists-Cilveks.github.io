const invisibleSVGContainer = document.createElement("div")
invisibleSVGContainer.style.display = "none"
invisibleSVGContainer.id = "invisible-svg-container"
document.body.appendChild(invisibleSVGContainer)

function insertSVG(fileName, container=invisibleSVGContainer, customOnload) {
  // using https://stackoverflow.com/a/14070928/10630826
  const xhr = new XMLHttpRequest()
  xhr.open("GET", fileName, true)
  xhr.overrideMimeType("image/svg+xml") // just to be on the safe side; not needed if your server delivers SVG with correct MIME type
  xhr.onload = function(e) {
    // You might also want to check for xhr.readyState/xhr.status here
    let svgElement = xhr.responseXML.documentElement
    container.appendChild(svgElement)
    if (customOnload) customOnload(e, svgElement)
  };
  xhr.send("");
}
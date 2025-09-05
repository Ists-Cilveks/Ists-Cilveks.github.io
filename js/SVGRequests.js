function insertSVG(fileName, containerID) {
  // using https://stackoverflow.com/a/14070928/10630826
  xhr = new XMLHttpRequest()
  xhr.open("GET", fileName, false)
  xhr.overrideMimeType("image/svg+xml") // just to be on the safe side; not needed if your server delivers SVG with correct MIME type
  xhr.onload = function(e) {
    // You might also want to check for xhr.readyState/xhr.status here
    let cont = document.getElementById(containerID)
    doc=xhr.responseXML.documentElement
    cont.appendChild(doc)
  };
  xhr.send("");
}
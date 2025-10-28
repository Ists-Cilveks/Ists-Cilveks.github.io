let finished = false

// Make necessary elements if not defined in the given document
if (!document.getElementById('vn-stage')) {
  let stage = document.createElement('div')
  stage.id = 'vn-stage'
  stage.addEventListener("click", progressText)
  stage.lang = "en" // TODO: how to handle translations?
  document.body.appendChild(stage)
  
  let td = document.createElement('div')
  td.id = 'vn-temp-display'
  stage.appendChild(td)

  let tb = document.createElement('div')
  tb.id = 'vn-textbox'
  stage.appendChild(tb)

  let clickToProgress = document.createElement('p')
  clickToProgress.innerHTML = "<p>Click to progress the text, or <a onclick='viewInline()'>click here</a> to view this in a normal format.</p>"
  tb.appendChild(clickToProgress)
}
// Get necessary elements (potentially freshly made ↑)
const vnStage = document.getElementById('vn-stage')
const textbox = document.getElementById('vn-textbox')
const tempDisplay = document.getElementById('vn-temp-display')
const allContent = document.getElementById('vn-content')
let lastAddedContent
let contentDiv = document.getElementById("vn-content").firstElementChild

var characters = []
class Character {
  constructor(name, displayName, accessibleName, container, svgPath) {
    this.name = name
    this.displayName = displayName
    this.accessibleName = accessibleName
    // TODO: <span role="img" aria-label="Kit">K¡t</span>
    if (container) {
      this.container = container
    } else {
      this.container = document.createElement("div")
      this.container.className = "character-container"
      this.container.id = name+"-container"
      document.getElementById("vn-stage").appendChild(this.container)
    }
    if (svgPath) {
      insertSVG(svgPath, this.container, function(e, characterSVG) {
        characterSVG.setAttribute("height", "80vh") // FIXME: images should be scaled equally (bigger images remain bigger), instead of all being a certain height
        characterSVG.removeAttribute("width")
      })
    }
    this.expression = "neutral"
    this.hide()
  }

  setExpression (newExp) {
    const currentExpressionID = this.name+"-"+this.expression
    const newExpressionID = this.name+"-"+newExp
    document.getElementById(currentExpressionID).style.display = "none"
    document.getElementById(newExpressionID).style.display = "inline"
    this.expression = newExp
    this.show()
  }

  setPosition (newPos) {
    this.container.classList.remove()
    this.position = newPos
    this.container.classList.add()
  }

  hide () {
    this.hidden = true
    this.container.style.display = "none"
  }
  show () {
    this.hidden = false
    this.container.style.display = "block"
  }
}

characters.push(new Character("kit", "K¡t", "Kit", undefined, "/vn/kit/kit.svg"))
characters.push(new Character("sparkledog", "sparkledog", "sparkledog", undefined, "/vn/sparkledog/sparkledog.svg"))

function viewInline() {
  vnStage.style.display = "none"
  allContent.style.display = "block"
  takeNextElement = function(){} // Hack to stop the viewInline link from removing the first line before it's seen
}

function takeNextElement() {
  let newContent = contentDiv.firstElementChild
  if (!newContent) {
    let newContentDiv = contentDiv.nextElementSibling
    if(!newContentDiv) { // out of content
      return
    }
    contentDiv = newContentDiv
    newContent = contentDiv.firstElementChild
  }
  const classes = newContent.classList

  // Add to appropriate place
  if (classes.contains("vn-show-off")) {
    tempDisplay.appendChild(newContent)
  } else {
    textbox.appendChild(newContent)
  }
  lastAddedContent = newContent
  // Last line of text
  
  if (classes.contains("vn-end-text")) {
    finished = true
  }  

  // Look for expressions
  for (const char of characters) {
    let action
    for (const cl of classes) {
      if (cl.startsWith(char.name+"-")) {
        action = cl.slice(char.name.length+1)
        break
      }
    }
    
    if (action == "hide") {
      char.hide()
    }
    else if (action.startsWith("pos-")) {
      position = action.slice(4)
      char.setPosition(position)
    }
    else if (action) {
      char.setExpression(action)
    }
  }

  for (const cl of classes) {
    if (cl=="vn-take-next") {
      takeNextElement()
    }
  }
}
function progressText() {
  // Escape from hidden state
  if (textbox.style.display == "none") {
    textbox.style.display = "initial"
    return
  }

  if (finished) { // Don't change the text if the last line has been reached
    return
  }

  // TODO: if animating text, skip to end of animation

  // TODO: how to prevent this from happening if there is no more text to show? Should I have a separate final textbox state instead of staying on the last line?
  textbox.textContent = ""
  tempDisplay.textContent = ""

  // Get next element
  takeNextElement()
}

document.addEventListener("keydown", function (event) {
  let key = event.key
  switch (key) {
    case "ArrowRight":
    case "Enter":
    case " ":
      progressText()
      break
  }
  key = key.toLocaleLowerCase()
  switch (key) {
    case "h":
      textbox.style.display = textbox.style.display == "none" ? "initial" : "none"
  }
})

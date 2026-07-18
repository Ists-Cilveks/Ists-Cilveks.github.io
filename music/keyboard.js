
const oscList = []; // keyboard oscillators
let mainGainNode = null;
let synthGainNode = null;
const keyboard = document.querySelector(".keyboard");
const wavePicker = document.querySelector("select[name='waveform']");
let customWaveform = null;
let sineTerms = null;
let cosineTerms = null;

let synthKeys = []
function createKey(note, octave, freq, keyboardKey) {
  const keyElement = document.createElement("div");
  
  keyElement.className = "key";
  keyElement.dataset["octave"] = octave;
  keyElement.dataset["note"] = note;
  keyElement.dataset["frequency"] = freq;

  const labelElement = document.createElement("div");
  // labelElement.appendChild(document.createTextNode(keyboardKey));
  labelElement.appendChild(document.createTextNode(note));
  labelElement.appendChild(document.createElement("sub")).textContent = octave;
  keyElement.appendChild(labelElement);

  if (note.length === 2) {
    keyElement.className += " accidental"
  }

  keyElement.addEventListener("mousedown", notePressed);
  keyElement.addEventListener("mouseup", noteReleased);
  keyElement.addEventListener("mouseover", notePressed);
  keyElement.addEventListener("mouseleave", noteReleased);

  synthKeys.push(keyElement)
  return keyElement;
}
function playTone(freq) {
  const osc = audioContext.createOscillator();
  osc.connect(synthGainNode);

  const type = wavePicker.options[wavePicker.selectedIndex].value;

  if (type === "custom") {
    osc.setPeriodicWave(customWaveform);
  } else {
    osc.type = type;
  }

  osc.frequency.value = freq;
  osc.start();

  return osc;
}
function notePressed(event) {
  if (event.buttons & 1) {
    const dataset = event.target.dataset;

    if (!dataset["pressed"] && dataset["octave"]) {
      const octave = Number(dataset["octave"]);
      oscList[octave][dataset["note"]] = playTone(dataset["frequency"]);
      dataset["pressed"] = "yes";
    }
  }
}
function noteReleased(event) {
  const dataset = event.target.dataset;

  if (dataset && dataset["pressed"]) {
    const octave = Number(dataset["octave"]);

    if (oscList[octave] && oscList[octave][dataset["note"]]) {
      oscList[octave][dataset["note"]].stop();
      delete oscList[octave][dataset["note"]];
      delete dataset["pressed"];
    }
  }
}

const keyCodes = [
  // "Space",
  // "ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight",
  // "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "Enter",
  // "Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight",
  // "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backspace",
  // "Escape",
  "Digit1", "KeyQ", "Digit2", "KeyW", "KeyE", "Digit4", "KeyR", "Digit5", "KeyT", "KeyY", "Digit7", "KeyU", "Digit8", "KeyI", "Digit9", "KeyO", "KeyP", "Minus", "BracketLeft", "Equal", "BracketRight", "Backslash", 
];
function keyNote(event) {
  let index = keyCodes.indexOf(event.code)
  if (index == -1) return
  const elKey = synthKeys[index+23];
  if (elKey) {
    if (event.type === "keydown") {
      elKey.tabIndex = -1;
      elKey.focus();
      elKey.classList.add("active");
      notePressed({ buttons: 1, target: elKey });
    } else {
      elKey.classList.remove("active");
      noteReleased({ buttons: 1, target: elKey });
    }
    event.preventDefault();
  }
}
addEventListener("keydown", keyNote);
addEventListener("keyup", keyNote);

function setupKeyboard() {
  // Create the keys; skip any that are sharp or flat; for
  // our purposes we don't need them. Each octave is inserted
  // into a <div> of class "octave".

  noteFreq.forEach((keys, idx) => {
    const keyList = Object.entries(keys);
    const octaveElem = document.createElement("div");
    octaveElem.className = "octave";
    // console.log(keyList);
    
    keyList.forEach((key) => {
      // if (key[0].length === 1) {
      if (true) {
        octaveElem.appendChild(createKey(key[0], idx, key[1], ""));
      }
    });

    keyboard.appendChild(octaveElem);
  });

  document
    .querySelector("div[data-note='B'][data-octave='5']")
    .scrollIntoView(false);

  sineTerms = new Float32Array([0, 0, 1, 0, 1]);
  cosineTerms = new Float32Array(sineTerms.length);
  customWaveform = audioContext.createPeriodicWave(cosineTerms, sineTerms);

  for (let i = 0; i < 9; i++) {
    oscList[i] = {};
  }
}
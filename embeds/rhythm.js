var canvas=document.getElementById("rhythm-canvas");
	var context=canvas.getContext("2d");
	var rhythmContainer=document.getElementById("rhythm-container");
	var rhythmPlayButton=document.getElementById("rhythm-play-button");
	var paused=true;
	var keys=[];
	var currentlyHeldLanes=[];
	var width=100;
	var height=100;
	var t=0;
	var startTime=0;

	var missPeriod=200;
	const magicOffset=0;

var style_in_rhythmJS = window.getComputedStyle(document.body)
var getCSSColor = (name) => ColorFromString(style_in_rhythmJS.getPropertyValue(name))
var themeColors = {
	BG: getCSSColor('--bg-color'),
	secondaryBG: getCSSColor('--secondary-bg-color'),
	HC_BG: getCSSColor('--hc-bg'),
	HC_FG: getCSSColor('--hc-fg'),
	main: getCSSColor('--main-color'),
	highlights: getCSSColor('--highlights'),
	framing: getCSSColor('--framing'),
	subtler: getCSSColor('--subtler'),
	subtleTinted: getCSSColor('--subtle-tinted'),
	lightUp: getCSSColor('--light-up'),
	deepFraming: getCSSColor('--deep-framing'),
}
var noteColors = {
	onBeat: themeColors.highlights,
	offBeat: themeColors.framing.mix(themeColors.deepFraming),
	quarter: themeColors.lightUp.mix(themeColors.deepFraming, 0.2),
	other: themeColors.main.mix(themeColors.BG, 0.3),
}

resize();

function pathUnitDownArrow() {
	// creates a path along the outline of a down arrow, centered at (0, 0), with a height and width of roughly 2
	context.beginPath()
	context.moveTo(0, 0.9)
	context.lineTo(0.9, 0)
	context.lineTo(0.9, -0.2)
	context.lineTo(0.6, -0.5)
	context.lineTo(0.3, -0.2)
	context.lineTo(0.3, -0.7)
	context.lineTo(-0.3, -0.7)
	context.lineTo(-0.3, -0.2)
	context.lineTo(-0.6, -0.5)
	context.lineTo(-0.9, -0.2)
	context.lineTo(-0.9, 0)
	context.closePath()
}
function drawArrow(offset, lane, fill, stroke, lineWidth=0) {
	context.fillStyle=fill;
	context.strokeStyle=stroke;
	context.lineWidth=lineWidth;
	// context.fillRect((lane-1)*width/4, height+(t-arrow_t)/100, width/4, width/4);
	const cx = (lane-0.5)*width/4
	const cy = height+offset-width/10
	const r = width/4/2*0.8
	let rot
	switch (lane) {
		case 1:
			rot = Math.PI*0.5
			break
		case 2:
			rot = 0
			break
		case 3:
			rot = Math.PI
			break
		case 4:
			rot = Math.PI*1.5
			break
	}
	// context.fillRect(cx-r, cy-r, 2*r, 2*r)
	context.translate(cx, cy)
	context.scale(r, r)
	context.rotate(rot)
	pathUnitDownArrow()
	if (fill != null) context.fill()
	if (stroke != null) context.stroke()
	context.resetTransform()
}
function drawDrag(startOffset, endOffset, lane, fill, stroke, lineWidth=0) {
	context.fillStyle=fill;
	context.strokeStyle=stroke;
	context.lineWidth=lineWidth*width;
	const cx = (lane-0.5)*width/4
	const startY = height+startOffset-width/10
	const endY = height+endOffset-width/10
	const relativeEndY = endY-startY
	const r = width/4/2*0.5
	context.translate(cx, startY)

	context.beginPath()
	context.moveTo(-r, 0)
	context.lineTo(-r, relativeEndY)
	context.lineTo(0, relativeEndY-r)
	context.lineTo(r, relativeEndY)
	context.lineTo(r, 0)
	context.closePath()

	if (fill != null) context.fill()
	if (stroke != null) context.stroke()

	context.resetTransform()
}
function drawNote(note) {
	const offset = t - note.t
	const lane = note.Lane
	
	drawArrow(offset, lane, color.rgb(), themeColors.HC_BG.rgb(), 0.1)
}
function drawNoteDrag(note) {
	const startOffset = t - note.t
	const endOffset = t - note.EndTime
	const lane = note.Lane
	let bgColor
	if (note.isBeingHeld) {
		bgColor = themeColors.secondaryBG
		console.log(bgColor.rgba())
	} else {
		bgColor = themeColors.HC_FG.copy()
		bgColor.a = 0.1
	}
	drawDrag(startOffset, endOffset, lane, bgColor.rgba(), themeColors.HC_BG.rgba(), 0.01)
}
function drawReceptor(lane, lineWidth=0.03) {
	drawArrow(0, lane, null, themeColors.main.rgb(), lineWidth)
}
function drawGhostNote(lane, missedBy) {
	// Draws a faint note at the position where it was hit. Helps to see if you're early or late
	const badness = Math.abs(missedBy)/missPeriod
	let color = colors.white.mix(colors.red, badness)
	color.a = 0.3
	const drawingOffset = missedBy/3 // ¯\_(ツ)_/¯
	drawArrow(drawingOffset, lane, color.rgba(), null)
}

function notePressed(lane, eventTime)	{
	currentlyHeldLanes[lane] = true
	const tp = eventTime-startTime
	let possibleNotes = []
	
	// find the closest note
	let closestNote
	let missedBy
	for (let i = 0; i < 40; i++) { // FIXME: jank if there are a lot of notes in other lanes. but meh.
		if (noteData.HitObjects.length <= i) break
		const note = noteData.HitObjects[i]
		if (note.Lane == lane) {
			possibleNotes.push([note, i])
			if (note.t >= tp) { // a later note, so no even later notes could be the closest
				break
			}
		}
	}
	if (possibleNotes.length==0) { // no notes remotely close
		return
	}
	else if (possibleNotes.length==1) { // one note, easy
		closestNote = possibleNotes[0]
		missedBy = tp - closestNote[0].t
	}
	else if (possibleNotes.length>=2) { // at least 2 notes, need to compare the last 2
		const n1 = possibleNotes.pop()
		const n2 = possibleNotes.pop()
		const t1 = tp - n1[0].t // how far each note is from the keypress time
		const t2 = tp - n2[0].t
		if (Math.abs(t1)<Math.abs(t2)) {
			missedBy = t1
			closestNote = n1
		}
		else {
			missedBy = t2
			closestNote = n2
		}
	}
	if (Math.abs(missedBy) > missPeriod) { // too imprecise to count as a hit
		return
	}
	const closestIndex = closestNote[1]
	closestNote = closestNote[0]
	
	// announce that closestNote has been pressed
	recentHits.push({
		"missedBy": missedBy,
		"time": performance.now(),
		"note": closestNote,
	})

	if ("EndTime" in closestNote) {
		closestNote.isBeingHeld = true
		currentlyHeldNotes[lane] = closestNote
	}
	else {
		noteData.HitObjects.splice(closestIndex, 1)
	}
}
function noteReleased(lane, eventTime) {
	currentlyHeldLanes[lane] = false
	note = currentlyHeldNotes[lane]
	if (!note) return
	currentlyHeldNotes[lane] = undefined
	note.isBeingHeld = false

	recentRealeases.push({
		"missedBy": eventTime - note.EndTime,
		"time": performance.now(),
		"note": note,
	})
	// TODO: preferably remove the note once it's finished
}

var recentHits = []
var recentRealeases = []
var currentlyHeldNotes = []
var noteData

fetch('/embeds/tlpog.json')
	.then((response) => response.json())
	.then(function(json){
		noteData=json
		for (const note of noteData) {
			note.color = 
		}
		rhythmPlayButton.removeAttribute("disabled")
	});

var audio = document.getElementById("rhythm-track")
audio.volume = 0.3;
audio.addEventListener("play", function(){
	paused=false;
	requestAnimationFrame(startPlaying);
	// console.log("Unpaused")
})
audio.addEventListener("pause", function(){
	paused=true;
	// console.log("Paused")
})

function syncToAudio(curTime) {
	startTime=curTime-audio.currentTime*1000
}

function startPlaying(curTime) {
	syncToAudio(curTime)
	draw(curTime);
}

var secondarySyncDone = false; // FIXME: dumb fix

function draw(curTime) {
	t = curTime-startTime + magicOffset

	if (t>500 && !secondarySyncDone) {
		secondarySyncDone = true
		syncToAudio(performance.now())
	}

	if (!paused) {

		context.clearRect(0, 0, canvas.width, canvas.height);

		// Get rid of offscreen notes and draw holds
		for (let i = 0; i < 20; i++) { // FIXME: jank when there's a lot of notes.
			if (noteData.HitObjects.length <= i) break
			const note = noteData.HitObjects[i]
			const isLong = "EndTime" in note
			const disappearTime = isLong ? note.EndTime : note.t // What time determines when a note is offscreen? (either the time of a normal note or the end time of a held note)
			if (t > disappearTime+missPeriod) { // Remove missed notes
				noteData.HitObjects.splice(i, 1)
				i--
				continue
			}
			// if (t > note.t) {} // TODO: visual effect from missing a note
			if (isLong) {
				drawNoteDrag(note)
			}
		}

		// Draw receptors
		for (let lane = 1; lane <= 4; lane++) {
			if (currentlyHeldLanes[lane]) {
				// drawGhostNote(lane, 0) // doesn't look very good together with the missed note indicators. TODO: maybe change the color?
				drawReceptor(lane, 0.1)
			} else {
				drawReceptor(lane, 0.05)
			}
		}

		// Draw ghost notes and thickened receptors
		for (let i = 0; i < recentHits.length; i++) {
			const hit = recentHits[i]
			// const timeSinceHit = curTime - hit.time
			const timeSinceHit = performance.now() - hit.time
			if (timeSinceHit > 500) { // no longer recent
				recentHits.splice(i, 1)
				i--
				continue
			}
			// ...otherwise
			const lane = hit.note.Lane
			
			const missedBy = hit.missedBy
			drawGhostNote(lane, missedBy)

			// let lineWidth = Math.max(0, (200-timeSinceHit)*0.1) // Pretty funny, but not what I intended. TODO: incorporate this somehow
			let lineWidth = Math.max(0, (200-timeSinceHit)*0.003)
			drawReceptor(lane, lineWidth)
		}

		// Draw notes
		for (let i = 0; i < 20; i++) {
			if (noteData.HitObjects.length <= i) break
			const note = noteData.HitObjects[i]
			const disappearTime = "EndTime" in note ? note.EndTime : note.t // What time determines when a note is offscreen? (either the time of a normal note or the end time of a held note)
			if (t > disappearTime+missPeriod) { // Remove missed notes
				noteData.HitObjects.splice(i, 1)
				i--
				continue
			}
			// if (t > note.t) {} // TODO: visual effect from missing a note
			drawNote(note)
		}

		requestAnimationFrame(draw);
	}
}

function resize() {
	width=canvas.width=rhythmContainer.clientWidth
	height=canvas.height=rhythmContainer.clientHeight
	draw()
}
if (!paused) {
	audio.play();
}
resize()

// canvas.addEventListener("mousemove",function(){
//   // lastx=event.clientX;
//   // lasty=event.clientY;
//   var n=1;
//   lastx=(event.clientX+lastx*n)/(n+1);
//   lasty=(event.clientY+lasty*n)/(n+1);
// });
// window.addEventListener("dblclick",function(){location.reload();});
canvas.addEventListener("mousedown",function(event){
	const lane = Math.floor(event.offsetX/width*4)+1
	if (1 <= lane && lane <= 4) {
		notePressed(lane, event.timeStamp)
	}
});
window.addEventListener("keyup",function(event){
	var curKey=event.key;
	keys[curKey]=false;
	// console.log(keys);
	switch (curKey) {
		case "a"://a
			noteReleased(1, event.timeStamp)
			break;
		case "s"://s
			noteReleased(2, event.timeStamp)
			break;
		case "k"://k
			noteReleased(3, event.timeStamp)
			break;
		case "l"://l
			noteReleased(4, event.timeStamp)
			break;
		// case 37://left
		//   move.left();
		//   break;
	}
});
window.addEventListener("keydown",function(event){
	var curKey=event.key;
	if (event.repeat) { // Don't interpret held down keys as being rapidly mashed
		return
	}
	keys[curKey]=true;
	// if (curKey<58 && curKey>48) {//numbers - pixsize
	//   pixSize=2**(curKey-49);
	//   // var pixSize=14;
	//   gridWidth=canvas.width/pixSize; gridHeight=canvas.height/pixSize;
	//   initialiseGrid();
	//   draw();
	// }
	// console.log(keys);
	// console.log(curKey);
	switch (curKey) {
		case " "://space - pause
			if (paused) {
				audio.play()
			}
			else {
				audio.pause()
			}
			break;
		// case 68://d - draw
		// 	draw();
		// 	break;
		case "a"://a
			notePressed(1, event.timeStamp)
			break;
		case "s"://s
			notePressed(2, event.timeStamp)
			break;
		case "k"://k
			notePressed(3, event.timeStamp)
			break;
		case "l"://l
			notePressed(4, event.timeStamp)
			break;
		// case 37://left
		//   move.left();
		//   break;
	}
});
window.addEventListener("resize",function(){resize();})


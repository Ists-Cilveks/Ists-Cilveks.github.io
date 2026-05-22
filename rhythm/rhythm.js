class RhythmGame {
	constructor() {
		this.canvas=document.getElementById("rhythm-canvas");
		this.context=this.canvas.getContext("2d");
		this.rhythmContainer=document.getElementById("rhythm-container");
		this.playButton=document.getElementById("rhythm-play-button");
		this.paused=true;
		this.keys=[];
		this.currentlyHeldLanes=[];
		this.width=100;
		this.height=100;
		this.t=0;
		this.startTime=0;
	
		this.missPeriod=200;
		this.magicOffset=0;

		this.noteColors = {
			onBeat: globalPalette.highlights,
			offBeat: globalPalette.framing.mix(globalPalette.deepFraming),
			quarter: globalPalette.lightUp.mix(globalPalette.deepFraming, 0.2),
			other: globalPalette["main-color"].mix(globalPalette.BG, 0.3),
		}
		globalPalette.addListener(function () {window.requestAnimationFrame(this.draw)})

		this.resize()

		this.recentHits = []
		this.recentRealeases = []
		this.currentlyHeldNotes = []
		this.noteData = {"TimingPoints": [], "HitObjects": []}

		const dataPath = document.currentScript.getAttribute("data-chart")
		if (dataPath != null) {this.fetchJSONChart(dataPath)}

		if (!this.paused) {
			this.audio.play();
		}
		this.resize() // TODO: why twice? try removing one

		this.audio = document.getElementById("rhythm-track")
		this.secondarySyncDone = true; // FIXME: dumb fix
		let game = this
		if (this.audio != null) {
			this.secondarySyncDone = false
			this.audio.volume = 0.3;
			function play(){
				game.paused=false;
				game.syncToAudio(performance.now())
				game.draw()
			}
			this.audio.addEventListener("play", play)
			function pause(){
				game.paused=true;
			}
			this.audio.addEventListener("pause", pause)
		}


		function startRhythmGame() {game.startRhythmGame()}
		this.playButton.addEventListener("click", startRhythmGame)

		// canvas.addEventListener("mousemove",function(){
		//   // lastx=event.clientX;
		//   // lasty=event.clientY;
		//   var n=1;
		//   lastx=(event.clientX+lastx*n)/(n+1);
		//   lasty=(event.clientY+lasty*n)/(n+1);
		// });
		// window.addEventListener("dblclick",function(){location.reload();});
		function mousedownEvent(event) {
			const lane = Math.floor(event.offsetX/this.width*4)+1
			if (1 <= lane && lane <= 4) {
				game.notePressed(lane, event.timeStamp)
			}
		}
		this.canvas.addEventListener("mousedown", mousedownEvent);
		function keyupEvent(event) {
			var curKey=event.key;
			game.keys[curKey]=false;
			// console.log(keys);
			switch (curKey) {
				case "a":
				case "ArrowLeft":
					game.noteReleased(1, event.timeStamp)
					break;
				case "s":
				case "ArrowDown":
					game.noteReleased(2, event.timeStamp)
					break;
				case "k":
				case "ArrowUp":
					game.noteReleased(3, event.timeStamp)
					break;
				case "l":
				case "ArrowRight":
					game.noteReleased(4, event.timeStamp)
					break;
			}
		}
		this.rhythmContainer.addEventListener("keyup", keyupEvent);
		function keydownEvent(event) {
			var curKey=event.key;
			if (event.repeat) { // Don't interpret held down keys as being rapidly mashed
				return
			}
			game.keys[curKey]=true;
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
					if (game.paused) {
						game.startRhythmGame()
					}
					else {
						game.stopRhythmGame()
					}
					break;
				case "a":
				case "ArrowLeft":
					game.notePressed(1, event.timeStamp)
					break;
				case "s":
				case "ArrowDown":
					game.notePressed(2, event.timeStamp)
					break;
				case "k":
				case "ArrowUp":
					game.notePressed(3, event.timeStamp)
					break;
				case "l":
				case "ArrowRight":
					game.notePressed(4, event.timeStamp)
					break;
			}
		}
		this.rhythmContainer.addEventListener("keydown", keydownEvent);
		function resize(event) { game.resize() }
		window.addEventListener("resize", resize)
	}

	pathUnitDownArrow() {
		let context = this.context
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
	drawArrow(offset, lane, fill, stroke, lineWidth=0) {
		let context = this.context
		context.fillStyle=fill;
		context.strokeStyle=stroke;
		context.lineWidth=lineWidth;
		// context.fillRect((lane-1)*width/4, height+(t-arrow_t)/100, width/4, width/4);
		const cx = (lane-0.5)*this.width/4
		const cy = this.height+offset-this.width/10
		const r = this.width/4/2*0.8
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
		this.pathUnitDownArrow()
		if (fill != null) context.fill()
		if (stroke != null) context.stroke()
		context.resetTransform()
	}
	drawDrag(startOffset, endOffset, lane, fill, stroke, lineWidth=0) {
		let context = this.context
		context.fillStyle=fill;
		context.strokeStyle=stroke;
		context.lineWidth=lineWidth*this.width;
		const cx = (lane-0.5)*this.width/4
		const startY = this.height+startOffset-this.width/10
		const endY = this.height+endOffset-this.width/10
		const relativeEndY = endY-startY
		const r = this.width/4/2*0.5
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
	drawNote(note) {
		const offset = this.t - note.t
		const lane = note.Lane
		const color = this.noteColors[note.positionName]
		this.drawArrow(offset, lane, color.rgb(), globalPalette["hc-bg"].rgb(), 0.1)
	}
	drawNoteDrag(note) {
		const startOffset = this.t - note.t
		const endOffset = this.t - note.EndTime
		const lane = note.Lane
		let bgColor
		if (note.isBeingHeld) {
			bgColor = this.noteColors[note.positionName].mix(globalPalette["hc-bg"], 0.4)
		} else {
			bgColor = this.noteColors[note.positionName]
			bgColor.a = 0.2
		}
		this.drawDrag(startOffset, endOffset, lane, bgColor.rgba(), globalPalette["hc-bg"].rgba(), 0.01)
	}
	drawReceptor(lane, lineWidth=0.03) {
		this.drawArrow(0, lane, null, globalPalette["main-color"].rgb(), lineWidth)
	}
	drawGhostNote(lane, missedBy) {
		// Draws a faint note at the position where it was hit. Helps to see if you're early or late
		const badness = Math.abs(missedBy)/this.missPeriod
		let color = colors.white.mix(colors.red, badness)
		color.a = 0.3
		const drawingOffset = missedBy/3 // ¯\_(ツ)_/¯
		this.drawArrow(drawingOffset, lane, color.rgba(), null)
	}

	notePressed(lane, eventTime)	{
		this.currentlyHeldLanes[lane] = true
		const tp = eventTime-this.startTime
		let possibleNotes = []
		
		// find the closest note
		let closestNote
		let missedBy
		for (let i = 0; i < 40; i++) { // FIXME: jank if there are a lot of notes in other lanes. but meh.
			if (this.noteData.HitObjects.length <= i) break
			const note = this.noteData.HitObjects[i]
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
		if (Math.abs(missedBy) > this.missPeriod) { // too imprecise to count as a hit
			return
		}
		const closestIndex = closestNote[1]
		closestNote = closestNote[0]
		
		// announce that closestNote has been pressed
		this.recentHits.push({
			"missedBy": missedBy,
			"time": performance.now(),
			"note": closestNote,
		})

		if ("EndTime" in closestNote) {
			closestNote.isBeingHeld = true
			this.currentlyHeldNotes[lane] = closestNote
		}
		else {
			this.noteData.HitObjects.splice(closestIndex, 1)
		}
	}
	noteReleased(lane, eventTime) {
		this.currentlyHeldLanes[lane] = false
		let note = this.currentlyHeldNotes[lane]
		if (!note) return
		this.currentlyHeldNotes[lane] = undefined
		note.isBeingHeld = false

		this.recentRealeases.push({
			"missedBy": eventTime - note.EndTime,
			"time": performance.now(),
			"note": note,
		})
		// TODO: preferably remove the note once it's finished
	}

	getNotePositionName(note, timingPoint) {
		// Try reading from the data
		let name = note["PositionName"]
		if (name != undefined) {
			return name
		}

		// Otherwise use the timingPoint to determine
		const beatLength = 60000 / timingPoint.Bpm
		const position = (((note.t - timingPoint.t) % beatLength + beatLength) % beatLength) / beatLength
		let tempPosition = Math.abs(position-0.5) // V shaped
		if (tempPosition > 0.45) {
			name = "onBeat"
		} else if (tempPosition < 0.05) {
			name = "offBeat"
		}
		else {
			tempPosition = Math.abs(tempPosition-0.25) // VV shaped
			if (tempPosition < 0.05) {
				name = "quarter"
			}
			else {
				name = "other"
			}
		}
		return name
	}
	addNoteData(data) {
		this.noteData.HitObjects = this.noteData.HitObjects.concat(data.HitObjects)
		this.noteData.TimingPoints = this.noteData.TimingPoints.concat(data.TimingPoints)
		for (const note of data.HitObjects) {
			const timingPoint = data.TimingPoints[0] // FIXME: won't work for charts with multiple timing points
			note.positionName = this.getNotePositionName(note, timingPoint)
		}
		this.playButton.removeAttribute("disabled")
	}

	fetchJSONChart(path) {
		const rhythmGame = this
		fetch(path)
		.then((response) => response.json())
		.then(function(json){
			rhythmGame.addNoteData(json)
		});
	}

	syncToAudio(curTime) {
		this.startTime=curTime-this.audio.currentTime*1000
	}



	draw(curTime) {
		let t
		if (!this.paused) {
			this.t = t = performance.now()-this.startTime + this.magicOffset
		}
		
		if (this.secondarySyncDone) {
			
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

			// Get rid of offscreen notes and draw holds
			for (let i = 0; i < 20; i++) { // FIXME: jank when there's a lot of notes.
				if (this.noteData.HitObjects.length <= i) break
				const note = this.noteData.HitObjects[i]
				const isLong = "EndTime" in note
				const disappearTime = isLong ? note.EndTime : note.t // What time determines when a note is offscreen? (either the time of a normal note or the end time of a held note)
				if (!this.paused && t > disappearTime+this.missPeriod) { // Remove missed notes
					this.noteData.HitObjects.splice(i, 1)
					i--
					continue
				}
				// if (t > note.t) {} // TODO: visual effect from missing a note
				if (isLong) {
					this.drawNoteDrag(note)
				}
			}

			// Draw receptors
			for (let lane = 1; lane <= 4; lane++) {
				if (this.currentlyHeldLanes[lane]) {
					// this.drawGhostNote(lane, 0) // doesn't look very good together with the missed note indicators. TODO: maybe change the color?
					this.drawReceptor(lane, 0.1)
				} else {
					this.drawReceptor(lane, 0.05)
				}
			}

			// Draw ghost notes and thickened receptors
			for (let i = 0; i < this.recentHits.length; i++) {
				const hit = this.recentHits[i]
				// const timeSinceHit = curTime - hit.time
				const timeSinceHit = performance.now() - hit.time
				if (!this.paused && timeSinceHit > 500) { // no longer recent
					this.recentHits.splice(i, 1)
					i--
					continue
				}
				// ...otherwise
				const lane = hit.note.Lane
				
				const missedBy = hit.missedBy
				this.drawGhostNote(lane, missedBy)

				// let lineWidth = Math.max(0, (200-timeSinceHit)*0.1) // Pretty funny, but not what I intended. TODO: incorporate this somehow
				let lineWidth = Math.max(0, (200-timeSinceHit)*0.003)
				this.drawReceptor(lane, lineWidth)
			}

			// Draw notes
			for (let i = 0; i < 20; i++) {
				if (this.noteData.HitObjects.length <= i) break
				const note = this.noteData.HitObjects[i]
				const disappearTime = "EndTime" in note ? note.EndTime : note.t // What time determines when a note is offscreen? (either the time of a normal note or the end time of a held note)
				if (t > disappearTime+this.missPeriod) { // Remove missed notes
					this.noteData.HitObjects.splice(i, 1)
					i--
					continue
				}
				// if (t > note.t) {} // TODO: visual effect from missing a note
				this.drawNote(note)
			}
		}
		
		
		// Do secondary sync
		if (t>500 && !this.secondarySyncDone) {
			this.secondarySyncDone = true
			this.syncToAudio(performance.now())
		}

		if (!this.paused) {
			let game = this
			function draw() {game.draw()}
			requestAnimationFrame(draw);
		}
	}

	resize() {
		this.width=this.canvas.width=this.rhythmContainer.clientWidth
		this.height=this.canvas.height=this.rhythmContainer.clientHeight
		if (this.secondarySyncDone) {this.draw()}
	}


	startRhythmGame() {
		document.getElementById('info-before-rhythm-game').style.display = 'none'
		
		this.audio.play()
		this.rhythmContainer.focus()
	}
	stopRhythmGame() {
		this.audio.pause()
	}
}

game = new RhythmGame()
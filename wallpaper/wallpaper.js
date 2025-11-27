const TAU=2*Math.PI;
const PHI=(Math.sqrt(5)+1)/2;

function rand(max=1) {
  return Math.random()*max;
}
function rand0(max=1) {
  return (Math.random()-0.5)*max;
}
function randInt(max=2) {
  return Math.floor(Math.random()*max);
}
function randProb(p=0.5) {
  return p>Math.random();
}
function randRange(a, b) {
  return Math.random()*(b-a)+a;
}
function clamp(num, val=1) {//num to clamp, special value
  return 1-(val/(num+val));
}
function colorLerp(x, n1, n2) {
  return n2.sub(n1).mult(x).add(n1);
}
function cutoff(x, min, max) {
  if (min!=undefined && x<min) {
    return min;
  }
  if (max!=undefined && x>max) {
    return max;
  }
  return x;
}
function closenessPenalty(x, coefficient) { //what number to divide x by for to not reach 1
  return 1-coefficient-coefficient/(x-1);
}
function round(v, p=2) {
  return Math.round(v*10**p+Number.EPSILON)/10**p;
}
function lerp(x, v1, v2) {
  return x*(v2-v1)+v1;
}
function map(x, a1, a2, b1, b2) {
  if (a1==a2) return (b1+b2)/2;
  return (x-a1)/(a2-a1)*(b2-b1)+b1;
}
function arrayContains(arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]==val) return true;
  }
  return false;
}


function smootherStep(x) {
  return x * x * x * (x * (x * 6 - 15) + 10);
}
function getSmoothWeightedAverage(x, v1=0, v2=1) {//lerp, but with smootherstep
  return x * x * x * (x * (x * 6 - 15) + 10)*(v2-v1)+v1;
}
function getWeightedSquareAverage(x, y, v1, v2, v3, v4) {//smooth interpolation
  return getSmoothWeightedAverage(y, getSmoothWeightedAverage(x, v1, v2), getSmoothWeightedAverage(x, v3, v4));
}
function getNoise(i, j, seed=0) {//perlin noise
  var fi=Math.floor(i);
  var fj=Math.floor(j);
  var reli=i-fi;
  var relj=j-fj;
  function getCurrentDot(iOff, jOff) {
    var ang=((fi+iOff)*2+((fj+jOff+seed)*(seed+1))**2)**2;
    // var ang=((fi+iOff)+(fj+jOff)*2)**2;
    return Math.cos(ang)*(reli-iOff)+Math.sin(ang)*(relj-jOff);
  }
  return getWeightedSquareAverage(reli, relj, getCurrentDot(0, 0), getCurrentDot(1, 0), getCurrentDot(0, 1), getCurrentDot(1, 1))*0.8591+0.5;
}

class OffsetGrid {
  constructor(grid, offsetX, offsetY) {
    this.grid = grid
    this.width = this.grid.width
    this.height = this.grid.height
    this.offsetX = offsetX
    this.offsetY = offsetY
  }

  attemptRead (i, j) {
    return this.grid.attemptRead(i+this.offsetX, j+this.offsetY)
  }

  attemptWrite (val, i, j) {
    this.grid.attemptWrite(val, i+this.offsetX, j+this.offsetY)
  }

  minDistToEdge (i, j) {
    return this.grid.minDistToEdge(i+this.offsetX, j+this.offsetY)
  }
}

class Grid {
  constructor(width, height, initialValue=undefined) {
    this.width = width
    this.height = height
    this.grid = []
    for (var i = 0; i < this.width; i++) {
      this.grid[i]=[];
      for (var j = 0; j < this.height; j++) {
        this.grid[i][j]=initialValue;
      }
    }
  }

  initialiseNoise (size, seed=0) { //populate grid with perlin noise
    for (var i = 0; i < this.width; i++) {
      this.grid[i]=[];
      for (var j = 0; j < this.height; j++) {
        this.grid[i][j]=getNoise(i/size, j/size, seed);
      }
    }
  }

  attemptRead (i, j) {
    if (i>=0 && i<this.width && j>=0 && j<this.height) {
      return this.grid[Math.floor(i)][Math.floor(j)];
    }
  }

  attemptWrite (val, i, j) {
    if (val!=undefined && i>=0 && i<this.width && j>=0 && j<this.height) {
      this.grid[Math.floor(i)][Math.floor(j)]=val;
    }
  }

  minDistToEdge (i, j) {
    var minDistToVerticalEdge=Math.min(this.width-i, i);
    var minDistToHorizontalEdge=Math.min(this.height-j, j);
    var minDistToEdge=Math.min(minDistToHorizontalEdge, minDistToVerticalEdge);
    return minDistToEdge
  }
}


class AveragingRule {
  "A kind of rule that applies some symmetry, averaging between the values in a circular region."

  constructor(generator, x, y, ruleSize) {
    this.generator = generator
    this.x = x
    this.y = y
    this.ruleSize = ruleSize
  }

  getWeight (i, j, grid) {
    var minDistToEdge=grid.minDistToEdge(i, j);

    if (minDistToEdge<=0) return 0 // position is outside the screen, this point can't contribute anything
    
    let curWeight=1;
    if (minDistToEdge<40/this.generator.pixSize) {// position is close to the edge of the screen, weight < 1
      curWeight=smootherStep(minDistToEdge/(40/this.generator.pixSize));
    }

    return curWeight
  }

  enforce () {
    let gridInParent = new OffsetGrid(this.generator.grid, this.x, this.y)
    let newGrid = new OffsetGrid(
      new Grid(this.ruleSize, this.ruleSize),
      this.ruleSize/2,
      this.ruleSize/2,
    )

    for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {
      for (var j = -this.ruleSize/2; j < this.ruleSize/2; j++) {
        // TODO: also check if in screen bounds? (Not wanted if we do torus-like boundary looping though)
        if (i**2+j**2>=(this.ruleSize/2)**2) continue
        
        let averagingResults = this.getAverageFor(i, j, gridInParent)

        let oldValue = gridInParent.attemptRead(i, j)
        if (isNaN(oldValue)) continue // (i, j) was out of bounds
        
        // this.generator.attemptGridWrite(0.8, i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
        let newValue = lerp(averagingResults.weight, averagingResults.average, oldValue)
        newGrid.attemptWrite(newValue, i, j)
        // this.generator.attemptGridWrite(lerp(smootherStep(curLen/this.ruleSize*2), runningAverage, this.generator.attemptGridRead(this.x+i, this.y+j)), i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
        // gridInParent.attemptWrite(0.8, i, j)
        // this.generator.attemptGridWrite(runningAverage, i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
      }
    }
    // grid=newGrid;
    for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {//add found values in newGrid to grid
      for (var j = -this.ruleSize/2; j < this.ruleSize/2; j++) {
        let newValue = newGrid.attemptRead(i, j)
        gridInParent.attemptWrite(newValue, i, j)
        // drawPixel(this.x+i, this.y+j);// NOTE: definitely don't do this, apparently (multiple unnecessary draws slow down calculations significantly)
      }
    }
  }
}

class PhyllotaxisRule extends AveragingRule {
  constructor(generator, x, y, angle, ruleSize, leafDist) {
    super(generator, x, y, ruleSize)
    this.angle = angle
    this.leafDist = leafDist

    this.minI=Math.max(-this.ruleSize/2, -this.x);
    this.maxI=Math.min(this.ruleSize/2, generator.gridWidth+1-this.x);
    this.minJ=Math.max(-this.ruleSize/2, -this.y);
    this.maxJ=Math.min(this.ruleSize/2, generator.gridHeight+1-this.y);
    this.rotationTrig=[];
    for (var i = -10; i <= 10; i++) {
      this.rotationTrig.push([Math.cos(this.angle*i), Math.sin(this.angle*i)]);
    }
  }

  getAverageFor (i, j, gridInParent) {
    // var curAng=Math.atan2(j, i);
    var curLen=Math.sqrt(i**2+j**2);

    var runningTotal=0; var runningWeight=0;
    // for (var leaf = 0; leaf < this.sectors; leaf++) {
    // for (var leaf = -10; leaf < 10; leaf++) {
    for (var rot=0; rot < this.rotationTrig.length; rot++) {
      // var curx = this.x+Math.cos(curAng+this.angle*leaf)*(Math.sqrt(curLen**2+this.leafDist*leaf))
      // var cury = this.y+Math.sin(curAng+this.angle*leaf)*(Math.sqrt(curLen**2+this.leafDist*leaf))
      // var curx = this.x+Math.cos(curAng+this.angle*(rot-10))*(Math.sqrt(curLen**2+this.leafDist*(rot-10)))
      // var cury = this.y+Math.sin(curAng+this.angle*(rot-10))*(Math.sqrt(curLen**2+this.leafDist*(rot-10)))
      var curx = this.x+(i*this.rotationTrig[rot][0]-j*this.rotationTrig[rot][1])*(Math.sqrt(curLen**2+this.leafDist*(rot-10)))/curLen
      var cury = this.y+(i*this.rotationTrig[rot][1]+j*this.rotationTrig[rot][0])*(Math.sqrt(curLen**2+this.leafDist*(rot-10)))/curLen
      var minDistToEdge=gridInParent.minDistToEdge(i, j);

      if (minDistToEdge<0) continue // position is outside the screen, weight = 0
      
      if (minDistToEdge<40/pixSize) { // current position is close to the edge of the screen, weight < 1
        var curWeight=smootherStep(minDistToEdge/(40/pixSize));
      }
      else {//not close to the edge, weight = 1
        var curWeight=1;
      }
      var curTotalAdd=this.generator.attemptGridRead(curx, cury)*curWeight;// TODO: in case of 0 weight skip
      if (isNaN(curTotalAdd)) continue // out of bounds

      runningTotal+=curTotalAdd;
      runningWeight+=curWeight;
    }
    if (runningWeight==0) return [0, 0]
    let averageValue=runningTotal/runningWeight;
    let weight = smootherStep(curLen/this.ruleSize*2)

    return {
      "average": averageValue,
      "weight": weight,
    }
  }
}

class RotationRule extends AveragingRule {
  constructor(generator, x, y, sectors, ruleSize) {
    super(generator, x, y, ruleSize)
    this.sectors = sectors

    // cos and sin values to quickly rotate points
    this.rotationTrig=[];
    for (var i = 0; i < this.sectors; i++) {
      this.rotationTrig.push([Math.cos(TAU*i/this.sectors), Math.sin(TAU*i/this.sectors)]);
    }
  }

  getAverageFor (i, j, gridInParent) {
    // var curAng=Math.atan2(j, i);
    var curLen=Math.sqrt(i**2+j**2);

    // if ((this.phase+TAU/this.sectors<=TAU)?//only do averaging for one sector
    //   (curAng>this.phase && curAng<=this.phase+TAU/this.sectors):
    //   (curAng>this.phase || curAng<=this.phase+TAU/this.sectors-TAU)
    //   ) {
    var runningTotal=0; var runningWeight=0;
    for (var sec = 0; sec < this.sectors; sec++) {
      // var curx = this.x+Math.cos(curAng+TAU*sec/this.sectors)*curLen)
      // var cury = this.y+Math.sin(curAng+TAU*sec/this.sectors)*curLen)
      let rotI = i*this.rotationTrig[sec][0]-j*this.rotationTrig[sec][1]
      let rotJ = i*this.rotationTrig[sec][1]+j*this.rotationTrig[sec][0]

      let curWeight = this.getWeight(i, j, gridInParent)
      if (curWeight<=0) continue // position is outside the screen, this point can't contribute anything

      var curTotalAdd=gridInParent.attemptRead(rotI, rotJ)*curWeight;
      if (isNaN(curTotalAdd)) continue // out of bounds TODO: isn't this already covered by curWeight<=0 ?
      
      runningTotal+=curTotalAdd;
      runningWeight+=curWeight;
    }

    if (runningWeight==0) return [0, 0]
    let averageValue=runningTotal/runningWeight;
    let weight = smootherStep(curLen/this.ruleSize*2)


    return {
      "average": averageValue,
      "weight": weight,
    }
  }
}


class WallpaperGenerator {
  constructor(passedCanvas, pixSize=5, fadeTop=false) {
    this.canvas = passedCanvas
    this.container = this.canvas.parentElement
    this.resize(false);
    
    this.context = this.canvas.getContext("2d")
    this.fadeTop = fadeTop

    this.loops=0;
    this.paused=false;
    this.frameskip=1;
    this.keys=[];

    let wallpaperGradient = new Gradient([globalPalette.framing, 0, globalPalette.BG, 0.4, globalPalette.BG, 0.6, globalPalette.highlights, 0.8, globalPalette['main-color'], 1]);
    let thisGenerator = this
    globalPalette.addListener(function () {
      thisGenerator.draw()
    })
    
    this.useGradient=wallpaperGradient;
    
    this.globSeed=rand(10)+1;
    this.pixSize=pixSize;
    this.gridWidth=this.width/this.pixSize; this.gridHeight=this.height/this.pixSize;
    this.grid = new Grid(this.gridWidth, this.gridHeight);
    this.outlineBoundary=0.5;
    
    this.rules=[];

    var numRandomRules=3;
    if (false) {//random rules
      // for (var i = 0; i < 20; i++) {//make vertical mirror rules
      //   this.rules.push({
      //     x: rand(generator.gridWidth),
      //     y: rand(generator.gridHeight),
      //     ruleSize: randRange(20, 50),
      //     enforce: function() {
      //       // for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {
      //       for (var i = -this.ruleSize/2; i < 0; i++) {
      //         for (var j = -this.ruleSize/2; j < this.ruleSize/2; j++) {
      //           if (i**2+j**2<=(this.ruleSize/2)**2) {
      //             var curVal1=this.attemptGridRead(this.x+i, this.y+j);
      //             var curVal2=this.attemptGridRead(this.x-i, this.y+j);
      //             this.attemptGridWrite(curVal1, this.x-i, this.y+j);
      //             this.attemptGridWrite(curVal2, this.x+i, this.y+j);
      //           }
      //         }
      //       }
      //     }
      //   })
      // }

      // for (var i = 0; i < 10; i++) {//make bright spot rules
      //   this.rules.push({
      //     x: rand(generator.gridWidth),
      //     y: rand(generator.gridHeight),
      //     ruleSize: randRange(10, 40),
      //     enforce: function() {
      //       // for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {
      //       for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {
      //         for (var j = -this.ruleSize/2; j < this.ruleSize/2; j++) {
      //           this.attemptGridWrite(1, this.x-i, this.y+j);
      //         }
      //       }
      //     }
      //   })
      // }

      // for (var i = 0; i < 7; i++) {//make rotation symmetry rules
      //   this.rules.push({
      //     x: (rand(0.8)+0.1)*generator.gridWidth,
      //     y: (rand(0.8)+0.1)*generator.gridHeight,
      //     // x: generator.gridWidth/2,
      //     // y: generator.gridHeight/2,
      //     // x: rand(generator.gridWidth),
      //     // y: rand(generator.gridHeight),
      //     // sectors: 30,
      //     // sectors: 3,
      //     sectors: Math.floor(lerp(Math.random()**2, 5, 18)),
      //     // phase: 0,
      //     ruleSize: randRange(240, 560)/pixSize,
      //     // ruleSize: this.height/pixSize*1.5,
      //     // ruleSize: this.height/pixSize,
      //     enforce: this.enforceFuncs.rotation
      //   })
      // }

      for (var i = 0; i < numRandomRules; i++) {//make phyllotaxis rules
        this.rules.push({
          // x: (rand(0.8)+0.1)*generator.gridWidth,
          // y: (rand(0.8)+0.1)*generator.gridHeight,
          x: generator.gridWidth/2,
          y: generator.gridHeight/2,
          // x: rand(generator.gridWidth),
          // y: rand(generator.gridHeight),
          angle: TAU*(2-PHI),
          // ruleSize: randRange(240, 560)/pixSize,
          ruleSize: this.height/pixSize*2,
          // ruleSize: this.height/pixSize,
          // leafDist: randRange(70, 200)/pixSize,
          // leafDist: 600/pixSize,
          // leafDist: 200/pixSize,
          leafDist: 70/pixSize,
          enforce: this.enforceFuncs.phyllotaxis
        })
      }

      // var delArr=[];
      var newPositions=[];
      // var units=50/pixSize;
      var units=140/pixSize;
      for (var i = 0; i < this.rules.length; i++) {//go through positions of all rules and make them push away from eachother
        newPositions[i] = [this.rules[i].x, this.rules[i].y];
        for (var j = 0; j < this.rules.length; j++) {
          if (i!=j) {
            var offset = [this.rules[i].x-this.rules[j].x, this.rules[i].y-this.rules[j].y];
            // if (offset.len()<60/pixSize) {
            //   delArr.push(i);
            // }
            newPositions[i]=newPositions[i].add(offset.unit().mult(0.5**(offset.len()/units+1)*units));
          }
        }
      }
      // this.rules=this.rules.filter(function(value, index, arr) {//remove all elements with indices present in delArr
      //   return !arrayContains(delArr, index);
      // })
      for (var i = 0; i < this.rules.length; i++) {//set rule positions from newPositions
        // this.context.fillStyle="rgb(255, 0, 0)";
        // this.context.fillRect(this.rules[i].x*pixSize, this.rules[i].y*pixSize, pixSize, pixSize);
        this.rules[i].x=newPositions[i].x;
        this.rules[i].y=newPositions[i].y;
        // this.context.fillStyle="rgb(255, 0, 255)";
        // this.context.fillRect(this.rules[i].x*pixSize, this.rules[i].y*pixSize, pixSize, pixSize);
      }
    }
    
    if (true) {//custom placed rules
      // this.addPhyllotaxisRule(0.5, 0.5, 2200)
      // this.addPhyllotaxisRule(0.7, 0.2, 2100)
      this.addPhyllotaxisRule(0.3, 0.7, 600)
      // this.addPhyllotaxisRule(0.1, 0.7, 1700)
      // this.addPhyllotaxisRule(0.7, 0.65, 1700)

      // this.addRotationRule(0.4, 0.72, 7, 1750)
      this.addRotationRule(0.62, 0.4, 5, 4100)

      // this.addRotationRule(0.1, 0.7, 3, 1700)
      // this.addRotationRule(0.9, 0.65, 3, 1700)

      //pairs of odd numbers or their multiples
      // this.addRotationRule(0.4, 0.58, 10, 1550)
      // this.addRotationRule(0.58, 0.4, 10, 1550)
      // this.addRotationRule(0.62, 0.3, 2, 1500)
    }

    this.initialiseGrid();
    
    for (var go=0; go<3; go++) {
      this.gridOperations();
    }
    
    this.draw();
  }

  drawPixel(i, j) {
    if (i>=0 && i<this.gridWidth && j>=0 && j<this.gridHeight) {
      var i=Math.floor(i); var j=Math.floor(j);

      var value = this.grid.grid[i][j]

      // Fade out near the top
      if (this.fadeTop) {
        value = getSmoothWeightedAverage(Math.min(1, 3*j/this.gridHeight), 0.5, value)
      }
      
      // this.context.fillStyle="hsl(0,0%,"+this.grid[i][j]*100+"%)";//grayscale values
      this.context.fillStyle = this.useGradient.get(value).rgb();//gradient of values

      this.context.fillRect(i*this.pixSize, j*this.pixSize, this.pixSize, this.pixSize);
    }
  }

  initialiseGrid() {
    this.grid.initialiseNoise(30/this.pixSize, this.globSeed)
  }

  attemptGridRead(i, j) {
    return this.grid.attemptRead(i, j)
  }
  attemptGridWrite(val, i, j) {
    this.grid.attemptWrite(val, i, j)
  }


  gridOperations() {
    for (var randRuleLoops = 0; randRuleLoops < 100; randRuleLoops++) {
      var ruleChoice=rand();
      if (ruleChoice<0.03) this.randomDefectInMonochromaticPlace()
      else if (true) this.randomAreaIncreaseContrast()
      // else {//mirror around vertical line
      //   var x=rand(this.gridWidth);
      //   var y=rand(this.gridHeight);
      //   var ruleSize=randRange(20, 50);
      //   for (var i = -ruleSize/2; i < 0; i++) {
      //     for (var j = -ruleSize/2; j < ruleSize/2; j++) {
      //       if (i**2+j**2<=(ruleSize/2)**2) {
      //         var curVal1=this.attemptGridRead(x+i, y+j);
      //         var curVal2=this.attemptGridRead(x-i, y+j);
      //         this.attemptGridWrite(curVal1, x-i, y+j);
      //         this.attemptGridWrite(curVal2, x+i, y+j);
      //       }
      //     }
      //   }
      // }
    }
    for (var constRuleLoops = 0; constRuleLoops < this.rules.length; constRuleLoops++) {// TODO: random order(?)
      this.rules[constRuleLoops].enforce();
    }
  }

  randomAreaIncreaseContrast() {
    var x=rand(this.gridWidth);
    var y=rand(this.gridHeight);
    // var ruleSize=lerp(Math.random()**2, 200, 10)/this.pixSize;
    // var ruleSize=lerp(Math.random()**2, 200, 10)/this.pixSize;
    var ruleSize=lerp(Math.random()**2, 25, 200)/this.pixSize;
    // var ruleSize=70;
    // var ruleSize=20;

    let gridInParent = new OffsetGrid(this.grid, x-ruleSize/2, y-ruleSize/2)

    var min=1; var max=0;
    for (var i = -ruleSize/2; i < ruleSize/2; i++) {//find min and max values in search area
      for (var j = -ruleSize/2; j < ruleSize/2; j++) {
        var curVal=gridInParent.attemptRead(i, j);
        if (curVal>max) max=curVal;
        if (curVal<min) min=curVal;
      }
    }
    for (var i = -ruleSize/2; i < ruleSize/2; i++) {// draw
      for (var j = -ruleSize/2; j < ruleSize/2; j++) {
        let dist = 1-(Math.sqrt(i**2+j**2)/ruleSize*2) // current pixel closeness to circle center (1 - coincident, 0 - ruleSize pixels away)
        if (dist < 0) dist = 0 // make sure not to invert colors
        let oldValue = gridInParent.attemptRead(i, j)
        if (isNaN(oldValue)) continue // out of bounds
        let newValue = lerp(
          smootherStep(dist),
          oldValue,
          map(oldValue, min, max, 0, 1)
        )
        if (isNaN(newValue)) {
          console.log(map(oldValue, min, max, 0, 1), oldValue, min, max);
          
        }
        gridInParent.attemptWrite(newValue, i, j);
      }
    }
  }
  randomDefectInMonochromaticPlace(givenX, givenY) { // TODO: refactor to have separate function for custom defects and just random defects
    var x=givenX||rand(this.gridWidth);
    var y=givenY||rand(this.gridHeight);
    var ruleSize=lerp(Math.random()**2, 20, 80)/this.pixSize;
    // var ruleSize=70;
    // var ruleSize=20;

    let gridInParent = new OffsetGrid(this.grid, x, y)

    var runningTotal=0; var runningWeight=0;
    for (var i = -ruleSize/2; i < ruleSize/2; i++) {//find current values in search area
      for (var j = -ruleSize/2; j < ruleSize/2; j++) {
        var curWeight=cutoff(Math.sqrt(i**2+j**2)/ruleSize*2, 0);
        // var curWeight=smootherStep(cutoff(Math.sqrt(i**2+j**2)/ruleSize*2, 0));//less efficient and possibly useless
        var curTotalAdd=(gridInParent.attemptRead(i, j)*2-1)*curWeight;
        if (isNaN(curTotalAdd)) continue // out of bounds

        runningTotal+=curTotalAdd;
        runningWeight+=curWeight;
      }
    }
    var runningAverage=runningTotal/runningWeight;
    // console.log(runningTotal, "/", runningWeight, "=", runningAverage);
    var fillColor=runningTotal>0 ? 0 : 1;
    // var fillColor=0.25-runningAverage/2;
    // console.log(fillColor);
    for (var i = -ruleSize/2; i < ruleSize/2; i++) {//draw
      for (var j = -ruleSize/2; j < ruleSize/2; j++) {
        // TODO: colors are changed more when they're extreme (????? is that needed)
        gridInParent.attemptWrite(//draw on grid in fillcolor
          lerp(//lerp between background color and fillColor based on closeness
            smootherStep(
              cutoff(//make sure not to draw negative colors
                1-(Math.sqrt(i**2+j**2)/ruleSize*2),//current pixel closeness to circle center (1=coindident, 0=rulesize pixels away)
                0
              )
            ),
            gridInParent.attemptRead(i, j),
            fillColor
          ),
          i,
          j
        );
        // this.attemptGridWrite(1, fillColor, this.attemptGridRead(x+i, y+j)), x+i, y+j);
      }
    }
  }

  addPhyllotaxisRule(x, y, size, leafDist, angle) {
    this.rules.push(
      new PhyllotaxisRule(
        this,
        x*this.gridWidth,
        y*this.gridHeight,
        angle || TAU*(2-PHI),
        size/this.pixSize || randRange(240, 560)/this.pixSize,
        leafDist/this.pixSize || randRange(70, 200)/this.pixSize,
      )
    )
  }
  addRotationRule(x, y, sectors, size) {
    this.rules.push(
      new RotationRule(
        this,
        x*this.gridWidth || (rand(0.8)+0.1)*this.gridWidth,
        y*this.gridHeight || (rand(0.8)+0.1)*this.gridHeight,
        sectors || Math.floor(lerp(Math.random()**2, 5, 18)),
        size/this.pixSize/5 || randRange(240, 560)/this.pixSize,
      )
    )
  }


  draw() {
    if (!this.paused) {
      // if (loops% frameskip <1) {//animation
        this.context.clearRect(0, 0, this.width, this.height);
        for (var i = 0; i < this.gridWidth; i++) {
          for (var j = 0; j < this.gridHeight; j++) {
            this.drawPixel(i, j);
          }
        }
      // }
      this.loops++;
      // window.requestAnimationFrame(this.draw);
    }
  }

  changeSeed(s) {
    this.globSeed=s;
    this.restart();
    this.draw();
  }
  restart() {
    this.loops=0;
  }
  resize(draw=true) {
    this.width = this.canvas.width = this.container.clientWidth
    this.height = this.canvas.height = this.container.clientHeight
    this.canvas.style.width = this.width+"px"
    this.canvas.style.height = this.height+"px"
    this.restart()
    if (draw) this.draw()
  }

  interactBasic(x, y) {
    this.randomDefectInMonochromaticPlace(x/this.pixSize, y/this.pixSize)
    for (var allRuleLoops = 0; allRuleLoops < 1; allRuleLoops++) {
      this.gridOperations();
    }
    this.draw();
  }
}


let wallpaperFadeTop = document.currentScript.hasAttribute("fade-top")


const wallpaperCanvas=document.getElementById("wallpaper-canvas")
const myWallpaper = new WallpaperGenerator(wallpaperCanvas, pixSize=5, fadeTop=wallpaperFadeTop)

// canvas.addEventListener("mousemove",function(){
//   // lastx=event.clientX;
//   // lasty=event.clientY;
//   var n=1;
//   lastx=(event.clientX+lastx*n)/(n+1);
//   lasty=(event.clientY+lasty*n)/(n+1);
// });
// window.addEventListener("dblclick",function(){location.reload();});
wallpaperCanvas.addEventListener("click", function(event) {
  myWallpaper.interactBasic(event.clientX, event.clientY)
});
wallpaperCanvas.addEventListener("keydown",function(event){
  switch (event.key) {
    case " ":
      myWallpaper.interactBasic()
      break;
  }
});
window.addEventListener("resize",function(){myWallpaper.resize();})
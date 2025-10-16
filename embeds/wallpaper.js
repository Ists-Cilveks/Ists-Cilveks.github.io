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
  return (x-a1)/(a2-a1)*(b2-b1)+b1;
}
function arrayContains(arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]==val) return true;
  }
  return false;
}


function Vec2(x=0, y=0) {
  this.x=x;
  this.y=y;
  this.copy=function() {
    return new Vec2(this.x, this.y);
  }
  this.add=function(v1, v2) {// FIXME: doesn't always work with both values
    if (v2) {
      return new Vec2(this.x+v1, this.y+v2);
    }
    return new Vec2(this.x+v1.x, this.y+v1.y);
  }
  this.sub=function(v) {
    return new Vec2(this.x-v.x, this.y-v.y);
  }
  this.mult=function(n) {
    return new Vec2(this.x*n, this.y*n);
  }
  this.div=function(n) {
    return new Vec2(this.x/n, this.y/n);
  }
  this.dot=function(v) {
    return v.x*this.x + v.y*this.y;
  }
  this.iHatLanding=function(v) {
    return new Vec2(v.x*this.x-v.y*this.y, v.x*this.y+v.y*this.x);
  }
  this.len=function() {
    return Math.sqrt(this.x**2+this.y**2);
  }
  this.dist=function(v) {
    return Math.sqrt((this.x-v.x)**2+(this.y-v.y)**2);
  }
  this.sqDist=function(v) {
    return (this.x-v.x)**2+(this.y-v.y)**2;
  }
  this.unit=function() {
    var len=Math.sqrt(this.x**2+this.y**2);
    return new Vec2(this.x/len, this.y/len);
  }
  this.dir=function() {//angle to x axis in radians
    return Math.atan2(this.y, this.x);
  }
  this.taxi=function() {//taxicab distance length
    return this.x+this.y;
  }
  this.screen=function() {//coordinates for drawing
    return new Vec2(this.x*height, this.y*height);
  }
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


class PhyllotaxisRule {
  constructor(generator, x, y, angle, ruleSize, leafDist) {
    this.generator = generator
    this.x = x
    this.y = y
    this.angle = angle
    this.ruleSize = ruleSize
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

  enforce () {
    // gridToNewGrid();
    var newGrid=[];//optimise this too
    for (var i = 0; i < this.ruleSize; i++) {
      newGrid[i]=[]
      for (var j = 0; j < this.ruleSize; j++) {
        newGrid[i][j]=undefined;
      }
    }

    // for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {
    //   for (var j = -this.ruleSize/2; j < this.ruleSize/2; j++) {
    for (var i = this.minI; i < this.maxI; i++) {
      for (var j = this.minJ; j < this.maxJ; j++) {
        // TODO: check if in screen bounds (?)
        // if (i**2+j**2<=(this.ruleSize/2)**2 && this.x+i>=0 && this.x+i<this.generator.gridWidth+1 && this.y+j>=0 && this.y+j<this.generator.gridHeight+1) {
        if (i**2+j**2<=(this.ruleSize/2)**2) {
          // var curAng=Math.atan2(j, i)+PI;
          var curAng=Math.atan2(j, i);
          var curLen=Math.sqrt(i**2+j**2);
          // if ((this.phase+TAU/this.sectors<=TAU)?//only do averaging for one sector
          //   (curAng>this.phase && curAng<=this.phase+TAU/this.sectors):
          //   (curAng>this.phase || curAng<=this.phase+TAU/this.sectors-TAU)
          //   ) {

          var runningTotal=0; var runningWeight=0;
          // for (var leaf = 0; leaf < this.sectors; leaf++) {
          // for (var leaf = -10; leaf < 10; leaf++) {
          for (var rot=0; rot < this.rotationTrig.length; rot++) {
            var curPos=new Vec2(
              // this.x+Math.cos(curAng+this.angle*leaf)*(Math.sqrt(curLen**2+this.leafDist*leaf)),
              // this.y+Math.sin(curAng+this.angle*leaf)*(Math.sqrt(curLen**2+this.leafDist*leaf))
              // this.x+Math.cos(curAng+this.angle*(rot-10))*(Math.sqrt(curLen**2+this.leafDist*(rot-10))),
              // this.y+Math.sin(curAng+this.angle*(rot-10))*(Math.sqrt(curLen**2+this.leafDist*(rot-10)))
              this.x+(i*this.rotationTrig[rot][0]-j*this.rotationTrig[rot][1])*(Math.sqrt(curLen**2+this.leafDist*(rot-10)))/curLen,
              this.y+(i*this.rotationTrig[rot][1]+j*this.rotationTrig[rot][0])*(Math.sqrt(curLen**2+this.leafDist*(rot-10)))/curLen
            )
            var minDistToVerticalEdge=Math.min(this.generator.gridWidth-curPos.x, curPos.x);
            var minDistToHorizontalEdge=Math.min(this.generator.gridHeight-curPos.y, curPos.y);
            var minDistToEdge=Math.min(minDistToHorizontalEdge, minDistToVerticalEdge);

            if (minDistToEdge>0) {//position is outside the screen, weight = 0
              if (minDistToEdge<40/pixSize) {//current position is close to the edge of the screen, weight < 1
                var curWeight=smootherStep(minDistToEdge/(40/pixSize));
              }
              else {//not close to the edge, weight = 1
                var curWeight=1;
              }
              var curTotalAdd=this.generator.attemptGridRead(curPos.x, curPos.y)*curWeight;// TODO: in case of 0 weight skip
              if (!isNaN(curTotalAdd)) {
                runningTotal+=curTotalAdd;
                runningWeight+=curWeight;
              }
            }
          }
          var runningAverage=runningTotal/runningWeight;
          // this.generator.attemptGridWrite(lerp(smootherStep(curLen/this.ruleSize*2), runningAverage, this.generator.attemptGridRead(this.x+i, this.y+j)), this.x+i, this.y+j, newGrid)
          // this.generator.attemptGridWrite(runningAverage, this.x+i, this.y+j, newGrid)
          this.generator.attemptGridWrite(lerp(smootherStep(curLen/this.ruleSize*2), runningAverage, this.generator.attemptGridRead(this.x+i, this.y+j)), i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
          // this.generator.attemptGridWrite(runningAverage, i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
        }
      }
    }
    // grid=newGrid;
    // for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {//add found values in newGrid to grid
    //   for (var j = -this.ruleSize/2; j < this.ruleSize/2; j++) {
    for (var i = this.minI; i < this.maxI; i++) {
      for (var j = this.minJ; j < this.maxJ; j++) {
        this.attemptGridWrite(this.attemptGridRead(i+this.ruleSize/2, j+this.ruleSize/2, newGrid), this.x+i, this.y+j)
        // this.drawPixel(this.x+i, this.y+j);// NOTE: definitely don't do this, apparently (multiple unnecessary draws slow down calculations significantly)
      }
    }
    // console.table(newGrid);
  }
}

class RotationRule {
  constructor(generator, x, y, sectors, ruleSize) {
    this.generator = generator
    this.x = x
    this.y = y
    this.sectors = sectors
    this.ruleSize = ruleSize

    this.minI=Math.max(-this.ruleSize/2, -this.x);
    this.maxI=Math.min(this.ruleSize/2, generator.gridWidth+1-this.x);
    this.minJ=Math.max(-this.ruleSize/2, -this.y);
    this.maxJ=Math.min(this.ruleSize/2, generator.gridHeight+1-this.y);
    this.rotationTrig=[];
    for (var i = 0; i < this.sectors; i++) {
      this.rotationTrig.push([Math.cos(TAU*i/this.sectors), Math.sin(TAU*i/this.sectors)]);
    }
  }

  enforce () {
    // gridToNewGrid();
    var newGrid=[];
    for (var i = 0; i < this.ruleSize; i++) {
      newGrid[i]=[]
      for (var j = 0; j < this.ruleSize; j++) {
        newGrid[i][j]=undefined;
      }
    }

    for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {
      for (var j = -this.ruleSize/2; j < this.ruleSize/2; j++) {
        // TODO: check if in screen bounds (?)
        if (i**2+j**2<=(this.ruleSize/2)**2) {
          var curAng=Math.atan2(j, i);
          var curLen=Math.sqrt(i**2+j**2);
          // if ((this.phase+TAU/this.sectors<=TAU)?//only do averaging for one sector
          //   (curAng>this.phase && curAng<=this.phase+TAU/this.sectors):
          //   (curAng>this.phase || curAng<=this.phase+TAU/this.sectors-TAU)
          //   ) {

          var runningTotal=0; var runningWeight=0;
          var TEMPVALUE = randProb(0.0001)
          for (var sec = 0; sec < this.sectors; sec++) {
            // var curPos=new Vec2(this.x+Math.cos(curAng+TAU*sec/this.sectors)*curLen, this.y+Math.sin(curAng+TAU*sec/this.sectors)*curLen)
            var curPos=new Vec2(
              this.x+i*this.rotationTrig[sec][0]-j*this.rotationTrig[sec][1],
              this.y+i*this.rotationTrig[sec][1]+j*this.rotationTrig[sec][0]
            )
            var minDistToVerticalEdge=Math.min(this.generator.gridWidth-curPos.x, curPos.x);
            var minDistToHorizontalEdge=Math.min(this.generator.gridHeight-curPos.y, curPos.y);
            var minDistToEdge=Math.min(minDistToHorizontalEdge, minDistToVerticalEdge);

            if (minDistToEdge<40/this.generator.pixSize) {//current position is close to the edge of the screen, weight < 1
              if (minDistToEdge<=0) {//position is outside the screen, weight = 0
                var curWeight=0;
              }
              else {
                var curWeight=smootherStep(minDistToEdge/(40/this.generator.pixSize));
              }
            }
            else {//not close to the edge, weight = 1
              var curWeight=1;
            }

            var curTotalAdd=this.generator.attemptGridRead(curPos.x, curPos.y)*curWeight;// TODO: in case of 0 weight skip
            if (!isNaN(curTotalAdd)) {
              runningTotal+=curTotalAdd;
              runningWeight+=curWeight;
            }
          }
          var runningAverage=runningTotal/runningWeight;
          
          this.generator.attemptGridWrite(lerp(smootherStep(curLen/this.ruleSize*2), runningAverage, this.generator.attemptGridRead(this.x+i, this.y+j)), i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
          if(TEMPVALUE) {
            console.log(runningTotal, runningWeight, runningAverage, this.x+i, this.y+j, this.generator.attemptGridRead(this.x+i, this.y+j));
            this.generator.attemptGridWrite(1, i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
          }
          // this.generator.attemptGridWrite(runningAverage, i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
          // this.generator.attemptGridWrite(0.8, i+this.ruleSize/2, j+this.ruleSize/2, newGrid)
        }
      }
    }
    // grid=newGrid;
    for (var i = -this.ruleSize/2; i < this.ruleSize/2; i++) {//add found values in newGrid to grid
      for (var j = -this.ruleSize/2; j < this.ruleSize/2; j++) {
        // this.generator.attemptGridWrite(this.generator.attemptGridRead(i+this.ruleSize/2, j+this.ruleSize/2, newGrid), this.x+i, this.y+j)
        // drawPixel(this.x+i, this.y+j);// NOTE: definitely don't do this, apparently (multiple unnecessary draws slow down calculations significantly)
      }
    }
    // console.table(newGrid);
  }
}


class WallpaperGenerator {
  constructor(passedCanvas) {
    this.canvas = passedCanvas
    this.context = this.canvas.getContext("2d")

    this.loops=0;
    this.paused=false;
    var frameskip=1;
    var keys=[];
    this.height=100;

    var style = window.getComputedStyle(document.body)
    var themeColors = {
      BG: ColorFromString(style.getPropertyValue('--bg-color')),
      secondaryBG: ColorFromString(style.getPropertyValue('--secondary-bg-color')),
      HC_BG: ColorFromString(style.getPropertyValue('--hc-bg')),
      HC_FG: ColorFromString(style.getPropertyValue('--hc-fg')),
      main: ColorFromString(style.getPropertyValue('--main-color')),
      highlights: ColorFromString(style.getPropertyValue('--highlights')),
      framing: ColorFromString(style.getPropertyValue('--framing')),
      subtler: ColorFromString(style.getPropertyValue('--subtler')),
      subtleTinted: ColorFromString(style.getPropertyValue('--subtle-tinted')),
    }
    gradients["theme"] = new Gradient([themeColors.framing, 0, themeColors.BG, 0.4, themeColors.BG, 0.6, themeColors.highlights, 0.8, themeColors.main, 1]);    

    this.useGradient=gradients.theme;

    

    resize();
    this.globSeed=rand(10)+1;
    this.pixSize=5;
    // this.pixSize=14;
    this.gridWidth=this.canvas.width/this.pixSize; this.gridHeight=this.canvas.height/this.pixSize;
    this.grid=[];
    this.newGrid=[];
    this.outlineBoundary=0.5;

    this.rules=[];

    var numRandomRules=3;
    if (false) {//random rules
      // for (var i = 0; i < 20; i++) {//make vertical mirror rules
      //   // this.rules.push(new Vec2(rand(generator.gridWidth), rand(generator.gridHeight)))
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
      //   // this.rules.push(new Vec2(rand(generator.gridWidth), rand(generator.gridHeight)))
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
      //     // ruleSize: this.canvas.height/pixSize*1.5,
      //     // ruleSize: this.canvas.height/pixSize,
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
          ruleSize: this.canvas.height/pixSize*2,
          // ruleSize: this.canvas.height/pixSize,
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
        newPositions[i]=new Vec2(this.rules[i].x, this.rules[i].y);
        for (var j = 0; j < this.rules.length; j++) {
          if (i!=j) {
            var offset=new Vec2(this.rules[i].x-this.rules[j].x, this.rules[i].y-this.rules[j].y);
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
      // this.addPhyllotaxisRule(0.3, 0.7, 1600)
      // this.addPhyllotaxisRule(0.1, 0.7, 1700)
      // this.addPhyllotaxisRule(0.7, 0.65, 1700)

      // this.addRotationRule(0.4, 0.72, 7, 1750)
      this.addRotationRule(0.62, 0.4, 5, 2100)

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

  quickVec2TopLeftSquare(p, width=4, color=colors.yellow) {
    this.context.fillStyle=color.rgb() || color;
    this.context.fillRect(p.x, p.y, width, width);
  }

  drawPixel(i, j) {
    if (i>=0 && i<this.gridWidth && j>=0 && j<this.gridHeight) {
      // var i=Math.floor(i); var j=Math.floor(j);
      var i=Math.floor(i); var j=Math.floor(j);

      // var aboveBoundaryTotal=0;
      // var aboveBoundary1Total=0;
      // var aboveBoundary2Total=0;
      // if (i>=0 && i<this.gridWidth-1 && j>=0 && j<this.gridHeight-1) {
      //   // aboveBoundaryTotal=
      //   //   (grid[i][j]>outlineBoundary) +
      //   //   (grid[i+1][j]>outlineBoundary) +
      //   //   (grid[i][j+1]>outlineBoundary) +
      //   //   (grid[i+1][j+1]>outlineBoundary)
      //
      //   aboveBoundary1Total=
      //     (grid[i][j]>0.38) +
      //     (grid[i+1][j]>0.38) +
      //     (grid[i][j+1]>0.38) +
      //     (grid[i+1][j+1]>0.38)
      //   aboveBoundary2Total=
      //     (grid[i][j]>0.62) +
      //     (grid[i+1][j]>0.62) +
      //     (grid[i][j+1]>0.62) +
      //     (grid[i+1][j+1]>0.62)
      // }

      // if (randProb(0.01)) {
      //   console.log(aboveBoundaryTotal);
      // }

      // console.count("aBT:"+aboveBoundaryTotal)

      // var c=colorLerp(this.grid[i][j], colors.black, colors.white);
      // quickVec2TopLeftSquare(
      //   new Vec2(i*this.pixSize, j*this.pixSize),
      //   this.pixSize,
      //   c
      // )
      
      var value = this.grid[i][j]

      value = getSmoothWeightedAverage(Math.min(1, 3*j/this.gridHeight), 0.5, value)
      // this.context.fillStyle="hsl(0,0%,"+this.grid[i][j]*100+"%)";//grayscale values
      this.context.fillStyle = this.useGradient.get(value).rgb();//gradient of values
      // this.context.fillStyle=(aboveBoundaryTotal==2 || aboveBoundaryTotal==3) ? colors.black.rgb() : colors.white.rgb();//pixel outline
      // this.context.fillStyle=(aboveBoundary1Total==2||aboveBoundary1Total==3||aboveBoundary2Total==2||aboveBoundary2Total==3) ? colors.black.rgb() : colors.white.rgb();//pixel outline
      this.context.fillRect(i*this.pixSize, j*this.pixSize, this.pixSize, this.pixSize);
    }
  }

  initialiseGrid() {
    for (var i = 0; i < this.gridWidth; i++) {//populate grid with perlin noise
      this.grid[i]=[];
      for (var j = 0; j < this.gridHeight; j++) {
        this.grid[i][j]=getNoise(i*this.pixSize/30, j*this.pixSize/30, this.globSeed);
      }
    }
    
  }

  attemptGridRead(i, j) {
    if (i>=0 && i<this.grid.length && j>=0 && j<this.grid[0].length) {
      return this.grid[Math.floor(i)][Math.floor(j)];
    }
  }
  attemptGridWrite(val, i, j) {
    if (val!=undefined && !isNaN(val) && i>=0 && i<this.grid.length && j>=0 && j<this.grid[0].length) {
      this.grid[Math.floor(i)][Math.floor(j)]=val;
    }
  }

  gridToNewGrid() {
    newGrid=[];
    for (var i = 0; i < grid.length; i++) {
      newGrid[i]=[];
      for (var j = 0; j < grid[i].length; j++) {
        newGrid[i][j]=grid[i][j];
      }
    }
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
    var ruleSize=lerp(Math.random()**2, 15, 200)/this.pixSize;
    // var ruleSize=70;
    // var ruleSize=20;
    var min=1; var max=0;
    for (var i = -ruleSize/2; i < ruleSize/2; i++) {//find min and max values in search area
      for (var j = -ruleSize/2; j < ruleSize/2; j++) {
        var curVal=this.attemptGridRead(x+i, y+j);
        if (curVal>max) max=curVal;
        if (curVal<min) min=curVal;
      }
    }
    for (var i = -ruleSize/2; i < ruleSize/2; i++) {//draw
      for (var j = -ruleSize/2; j < ruleSize/2; j++) {
        this.attemptGridWrite(//draw on grid in fillcolor
          lerp(//lerp between background color and fillColor based on closeness
            smootherStep(
              cutoff(//make sure not to draw negative colors
                1-(Math.sqrt(i**2+j**2)/ruleSize*2),//current pixel closeness to circle center (1=coindident, 0=rulesize pixels away)
                0
              )
            ),
            this.attemptGridRead(x+i, y+j),
            map(this.attemptGridRead(x+i, y+j), min, max, 0, 1)
          ),
          x+i,
          y+j
        );
        // this.attemptGridWrite(1, fillColor, this.attemptGridRead(x+i, y+j)), x+i, y+j);
      }
    }
  }
  randomDefectInMonochromaticPlace() {
    var x=rand(this.gridWidth);
    var y=rand(this.gridHeight);
    var ruleSize=lerp(Math.random()**2, 10, 80)/this.pixSize;
    // var ruleSize=70;
    // var ruleSize=20;
    var runningTotal=0; var runningWeight=0;
    for (var i = -ruleSize/2; i < ruleSize/2; i++) {//find current values in search area
      for (var j = -ruleSize/2; j < ruleSize/2; j++) {
        var curWeight=cutoff(Math.sqrt(i**2+j**2)/ruleSize*2, 0);
        // var curWeight=smootherStep(cutoff(Math.sqrt(i**2+j**2)/ruleSize*2, 0));//less efficient and possibly useless
        var curTotalAdd=(this.attemptGridRead(x+i, y+j)*2-1)*curWeight;
        if (!isNaN(curTotalAdd)) {
          runningTotal+=curTotalAdd;
          runningWeight+=curWeight;
        }
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
        this.attemptGridWrite(//draw on grid in fillcolor
          lerp(//lerp between background color and fillColor based on closeness
            smootherStep(
              cutoff(//make sure not to draw negative colors
                1-(Math.sqrt(i**2+j**2)/ruleSize*2),//current pixel closeness to circle center (1=coindident, 0=rulesize pixels away)
                0
              )
            ),
            this.attemptGridRead(x+i, y+j),
            fillColor
          ),
          x+i,
          y+j
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
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
    restart();
    this.draw();
  }
  restart() {
    this.loops=0;
  }
  resize() {
    height=this.canvas.height
    restart();
  }
}

var canvas=document.getElementById("wallpaper-canvas")
const myWallpaper = new WallpaperGenerator(canvas)

// canvas.addEventListener("mousemove",function(){
//   // lastx=event.clientX;
//   // lasty=event.clientY;
//   var n=1;
//   lastx=(event.clientX+lastx*n)/(n+1);
//   lasty=(event.clientY+lasty*n)/(n+1);
// });
// window.addEventListener("dblclick",function(){location.reload();});
window.addEventListener("click",function(){
  for (var allRuleLoops = 0; allRuleLoops < 1; allRuleLoops++) {
    myWallpaper.gridOperations();
  }
  myWallpaper.draw();
});
// window.addEventListener("keyup",function(){
//   var curKey=event.keyCode;
//   keys[curKey]=false;
//   // console.log(keys);
// });
// window.addEventListener("keydown",function(){
//   var curKey=event.keyCode;
//   keys[curKey]=true;
//   // if (curKey<58 && curKey>48) {//numbers - pixsize
//   //   this.pixSize=2**(curKey-49);
//   //   // this.pixSize=14;
//   //   this.gridWidth=canvas.width/this.pixSize; this.gridHeight=canvas.height/this.pixSize;
//   //   this.initialiseGrid();
//   //   this.draw();
//   // }
//   // console.log(keys);
//   // console.log(curKey);
//   switch (curKey) {
//     case 32://space - pause
//       this.paused=!this.paused;
//       console.log(this.paused?"Paused":"Unthis.paused");
//       this.draw();
//       break;
//     case 68://d - draw
//       this.draw();
//       break;
//     // case 37://left
//     //   move.left();
//     //   break;
//   }
// });
// window.addEventListener("resize",function(){resize();})
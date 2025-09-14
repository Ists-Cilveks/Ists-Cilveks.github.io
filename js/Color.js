function Color(r=255, g=0, b=255, a=1) {
  this.r=r;
  this.g=g;
  this.b=b;
  this.a=a;
  this.copy=function() {
    return new Color(this.r, this.g, this.b, this.a);
  }
  this.each=function(f) {
    return new Color(f(this.r), f(this.g), f(this.b));
  }
  this.modify=function(amp) {
    return this.each(function(n) {
      var x=n+rand0(amp);
      if (x>255) {
        return 255;
      }
      else if (x<0) {
        return 0;
      }
      else {
        return x;
      }
    });
  }
  this.add=function(v) {
    return new Color(this.r+v.r, this.g+v.g, this.b+v.b);
  }
  this.lighten=function(v) {
    return new Color(v*(256-this.r)+this.r, v*(256-this.g)+this.g, v*(256-this.b)+this.b);
  }
  this.sub=function(v) {
    return new Color(this.r-v.r, this.g-v.g, this.b-v.b);
  }
  this.mult=function(v) {
    return new Color(this.r*v, this.g*v, this.b*v);
  }
  this.rgb=function() {
    return "rgb("+this.r+","+this.g+","+this.b+")";
  }
  this.rgba=function() {
    return "rgb("+this.r+","+this.g+","+this.b+","+this.a+")";
  }
  this.square=function() {
    return new Color(this.r**2, this.g**2, this.b**2, this.a);
  }
  this.sqrt=function() {
    return new Color(Math.sqrt(this.r), Math.sqrt(this.g), Math.sqrt(this.b), this.a);
  }
  this.mix=function(that, amount=0.5) {
    // Returns this color tinted to have some amount of that mixed into it.
    
    // return this.sub(that).mult(1-amount).add(that); // simple, ugly mixing
    // TODO: color spaces. this squares the colors based on that minutephysics video, but idk what the best calculation is here.
    return this.square().sub(that.square()).mult(1-amount).add(that.square()).sqrt();

    // TODO: take into account alpha. I think currently it just removes alpha.
  }
}

function ColorFromHex(hex) { //from https://stackoverflow.com/a/5624139/10630826 on 26.12.2021
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? new Color(
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ) : null;
}
function ColorFromRGB(rgb) {
  var numStrings = rgb.replace(/^rgba?\(|\s+|\)$/g,'').split(',')
  return new Color(
    parseInt(numStrings[0]),
    parseInt(numStrings[1]),
    parseInt(numStrings[2]),
    parseInt(numStrings[3]),
  )
}
function ColorFromString(str) {
  if (str.startsWith("#")) {
    return ColorFromHex(str)
  } else if (str.startsWith("rgb")) {
    return ColorFromRGB(str)
  }
}

function Gradient(v) {
  this.colors=[];
  this.values=[];
  for (var i = 0; i < v.length; i+=2) {
    this.colors[i/2]=v[i];
    this.values[i/2]=v[i+1];
  }
  this.get=function(x) {
    for (var i = 0; i < this.values.length; i++) {
      if (this.values[i]>x) {
        if (i==0) {
          return this.colors[0].copy();
        }
        else {
          return this.colors[i-1].mix(this.colors[i], (x-this.values[i-1])/(this.values[i]-this.values[i-1]));
        }
      }
    }
    return this.colors[this.colors.length-1].copy();
  }
}

//colors and color gradients used
var colors={
  mist: new Color(110, 130, 210),
  sky: new Color(50, 150, 210),
  darkBrown: new Color(40, 17, 2),
  lightBrown: new Color(200, 160, 60),
  sand: new Color(200, 170, 120),

  white: new Color(255, 255, 255),
  black: new Color(0, 0, 0),
  red: new Color(255, 0, 0),
  green: new Color(0, 255, 0),
  blue: new Color(0, 0, 255),
  yellow: new Color(255, 255, 0),
  magenta: new Color(255, 0, 255),
  cyan: new Color(0, 255, 255),

  darkRed: new Color(127, 0, 0),
  darkGreen: new Color(0, 127, 0),
  darkBlue: new Color(0, 0, 127),
  darkYellow: new Color(127, 127, 0),
  darkMagenta: new Color(127, 0, 127),
  darkCyan: new Color(0, 127, 127),
  veryDarkRed: new Color(63, 0, 0),
  veryDarkGreen: new Color(0, 63, 0),
  veryDarkBlue: new Color(0, 0, 63),
  veryDarkYellow: new Color(63, 63, 0),
  veryDarkMagenta: new Color(63, 0, 63),
  veryDarkCyan: new Color(0, 63, 63),

  orange: new Color(255, 127, 0),
  gray: new Color(127, 127, 127),
  darkGray: new Color(63, 63, 63),
  darkGray: new Color(63, 63, 63),
  slate: new Color(50, 67, 127),
  // brown: new Color(64, 32, 0),
}

var gradients={
  leafy: new Gradient([colors.veryDarkGreen, 0, colors.green, 0.5, colors.yellow, 1]),
  rainbow: new Gradient([colors.black, 0, colors.red, 0.1, colors.yellow, 0.26, colors.green, 0.42, colors.cyan, 0.58, colors.blue, 0.74, colors.magenta, 0.9, colors.white, 1]),
  natural: new Gradient([colors.black, 0, colors.green, 0.6, colors.yellow, 0.8, colors.white, 0.9, colors.red, 1]),
  tech: new Gradient([colors.black, 0, colors.darkBlue, 0.3, colors.cyan, 0.6, colors.white, 1]),
  flame: new Gradient([colors.black, 0, colors.darkBlue, 0.1, colors.white, 0.24, colors.yellow, 0.38, colors.red, 0.7, colors.black, 1]),
  middleBand: new Gradient([colors.black, 0.4, colors.white, 0.401, colors.white, 0.599, colors.black, 0.6]),
  middleNarrowBand: new Gradient([colors.white, 0.47, colors.black, 0.472, colors.black, 0.528, colors.white, 0.53]),
  blendingTest: new Gradient([colors.green, 0, colors.red, 1]),
}
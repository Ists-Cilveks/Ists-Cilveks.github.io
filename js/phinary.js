const phi = (1+5**(1/2))/2
const theta = phi**2
const ona = phi**3
const onaphi = phi**4
const onathey = phi**5
const epsi = phi**6

const FIB = {}
if (true) {
  let lastFibWord = [true]
  let fibWord = [true, false]
  for (let i = 0; i < 15; i++) {
    let newFibWord = fibWord.concat(lastFibWord)
    lastFibWord = fibWord
    fibWord = newFibWord
  }
  let fibNums = [1, 2]
  let reverse = {1: 0, 2: 1}
  for (let i = 2; i < 50; i++) {
    fibNums[i] = fibNums[i-1] + fibNums[i-2];
    reverse[fibNums[i]] = i
  }
  FIB.word = fibWord
  FIB.sequence = fibNums
  FIB.reverse = reverse
}

class Zeckendorf { // The "Fibonacci base" representation of n
  rep = []
  n = 0
  constructor(n) {
    if (typeof(n) == "object") { // From array
      this.rep = n
      this.n = Zeckendorf.toInt(this.rep)
    }
    else if (typeof(n) == "number") { // From int
      this.n = n
      this.rep = Zeckendorf.fromInt(n)
    }
    return this
  }

  static fromInt(n) {
    let res = []
    let maxLevel = Math.ceil(Math.log(n)/Math.log(phi) + 1)
    for (let i = maxLevel; i >= 0; i--) {
      const fib = FIB.sequence[i];
      if (n >= fib) {
        n -= fib
        res[i] = true
      }
      else {
        res[i] = false
      }
    }
    return res
  }
  static toInt(arr) {
    let n = 0
    for (let i = 0; i < arr.length; i++) {
      n += arr[i] * FIB.sequence[i]
    }
    return n
  }
  static getLevel(n) {
    return new Zeckendorf(n).getLevel()
  }
  
  getLevel() {
    for (let i = 0; i < this.rep.length; i++) {
      const bit = this.rep[i];
      if (bit) {
        return i
      }
    }
    return Infinity
  }

  updateN() {
    this.n = Zeckendorf.toInt(this.rep)
  }

  increment() {
    this.n += 1
    if (this.rep[0]) {
      this.rep[0] = false
      this.rep[1] = true
    }
    else this.rep[0] = true
    for (let i = 0; i < this.rep.length-2; i++) {
      if (this.rep[i] && this.rep[i+1]) {
        this.rep[i] = false
        this.rep[i+1] = false
        this.rep[i+2] = true
        i++
      }
      else {
        break
      }
    }
    if (this.rep[this.rep.length-2] && this.rep[this.rep.length-1]) {
      this.rep[this.rep.length-2] = false
      this.rep[this.rep.length-1] = false
      this.rep.push(true)
    }
  }
}

class Phinary { // Base phi number, with no consecutive 1s
  unitIndex = 0 // the index at which rep corresponds to one. must be within the array bounds. equivalent to the number of digits after the "decimal" point.
  rep = [false] // the bits of the phinary representation, least to most significant
  v = 0
  constructor(v, unitIndex = 0) {
    if (typeof(unitIndex) == "number") this.unitIndex = unitIndex
    if (typeof(v) == "object") { // From array
      this.rep = v
      this.updateV()
    }
    else if (typeof(v) == "number") { // From number
      // this.v = v
      this.rep = Phinary.fromNumber(v, unitIndex)
      this.updateV()
    }
    return this
  }

  static fromBeatNumber(n, level = 0) {
    let zeck = new Zeckendorf(n)
    return new Phinary(zeck.rep, level)
  }

  static fromNumber(v, unitIndex = 0) {
    let res = []
    let i = Math.ceil(Math.log(v) / Math.log(phi)) - 1
    if (i < 0) i = 0
    i += unitIndex

    for (; i >= 0; i--) {
      const pow = phi ** (i - unitIndex);
      if (v >= pow) {
        v -= pow
        res[i] = true

        // can skip bc no two are true in a row. We need to fill res with falses too and to do that we have to check whether it's in bounds or not
        if (i-1 >= 0) res[i-1] = false
        i--
      }
      else {
        res[i] = false
      }
    }
    return res
  }
  static toNumber(arr, unitIndex) {
    let v = 0
    for (let i = 0; i < arr.length; i++) {
      v += arr[i] * phi ** (i-unitIndex)
    }
    return v
  }
  static getLevel(v) {
    return new Phinary(v).getLevel()
  }
  
  getLevel() {
    for (let i = 0; i < this.rep.length; i++) {
      const bit = this.rep[i];
      if (bit) {
        return i - unitIndex
      }
    }
    return Infinity
  }

  updateV() {
    this.v = Phinary.toNumber(this.rep, this.unitIndex)
  }

  increment() {
    this.incrementDigit(-this.unitIndex)
  }
  incrementDigit(d) {
    let s = d + this.unitIndex
    if (this.rep[s]) {
      // this.v += 1/phi
      this.rep[s] = false
      this.rep[s+1] = true
    }
    else {
      // this.v += 1
      this.rep[s] = true
    }
    for (let i = s; i < this.rep.length-2; i++) {
      if (this.rep[i] && this.rep[i+1]) {
        this.rep[i] = false
        this.rep[i+1] = false
        this.rep[i+2] = true
        i++
      }
      else {
        break
      }
    }
    if (this.rep[this.rep.length-2] && this.rep[this.rep.length-1]) {
      this.rep[this.rep.length-2] = false
      this.rep[this.rep.length-1] = false
      this.rep.push(true)
    }
    this.updateV()
  }

  copy() {
    return new Phinary(this.v, this.unitIndex)
  }

  getNextAtLevel(level) {
    if (this.unitIndex+level < 0) return this.copy() // asking for higher precision than this number has, so this is already valid // cop-out, but I probably won't need this anyway
    let res = this.copy()
    let hasIncreased = false
    for (let i = 0; i < this.unitIndex+level; i++) {
      if (res.rep[i]) {
        res.rep[i] = false
        hasIncreased = true
      }
      if (res.rep[i] == undefined) {
        res.rep[i] = false
      }
    }
    if (hasIncreased) res.incrementDigit(this.unitIndex+level)
    res.updateV()
    return res
  }
}
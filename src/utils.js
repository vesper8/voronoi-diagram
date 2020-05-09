import { inverseLerp, lerp } from './mathUtils'

// https://gist.github.com/hendriklammers/5231994
function chunk(string, chunkSize) {
	const regex = new RegExp('.{1,' + chunkSize + '}', 'g')
	return string.match(regex)
}

function lerpColors(leftColor, rightColor, factor) {
  return new Color({
    model: 'rgb',
    r: lerp(leftColor.r, rightColor.r, factor),
    g: lerp(leftColor.g, rightColor.g, factor),
    b: lerp(leftColor.b, rightColor.b, factor),
    a: lerp(leftColor.a, rightColor.a, factor),
  })
}

export class Color {
  constructor({ model, r, g, b, a, hex }) {
    this.model = model
    if (model === 'rgb') {
      this.r = r
      this.g = g
      this.b = b
      this.a = a ?? 1
    } else if (model === 'hex') {
      if (hex.startsWith('#')) {
        hex = hex.substring(1)
      }
      const parts = chunk(hex, 2)
      this.r = parseInt(parts[0], 16)
      this.g = parseInt(parts[1], 16)
      this.b = parseInt(parts[2], 16)
      this.a = parts[3] !== undefined ? parseInt(parts[3], 16) / 255 : 1
    }
  }

  toString() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
  }
}

export class Gradient {
  constructor(colors) {
    this.colors = colors
  }

  getColor(factor) {
    let firstColorIndex = -1

    this.colors.forEach(({ factor: colorFactor }, index) => {
      if (factor >= colorFactor) {
        firstColorIndex = index
      }
    })

    if (firstColorIndex === -1) {
      return undefined
    }

    const secondColorIndex = firstColorIndex + 1

    const firstColor = this.colors[firstColorIndex].color
    const secondColor = this.colors[secondColorIndex].color

    const firstColorFactor = this.colors[firstColorIndex].factor
    const secondColorFactor = this.colors[secondColorIndex].factor

    const actualFactor = inverseLerp(firstColorFactor, secondColorFactor, factor)

    return lerpColors(firstColor, secondColor, actualFactor)
  }
}
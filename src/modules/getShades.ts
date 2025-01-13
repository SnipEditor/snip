import { clamp } from './math.ts'

function convertHexToRgb(hex: string) {
  const hexValue = hex.replace('#', '')
  if (hexValue.length === 3) {
    const r = parseInt(`${hexValue[0]}${hexValue[0]}`, 16)
    const g = parseInt(`${hexValue[1]}${hexValue[1]}`, 16)
    const b = parseInt(`${hexValue[2]}${hexValue[2]}`, 16)

    return { r, g, b }
  }
  if (hexValue.length === 6) {
    const r = parseInt(hexValue.substring(0, 2), 16)
    const g = parseInt(hexValue.substring(2, 4), 16)
    const b = parseInt(hexValue.substring(4, 6), 16)

    return { r, g, b }
  }

  throw new Error('Invalid hex value')
}

function convertRgbToHex(r: number, g: number, b: number) {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function convertRgbToHsl(r: number, g: number, b: number) {
  const rPrime = r / 255
  const gPrime = g / 255
  const bPrime = b / 255

  const cMax = Math.max(rPrime, gPrime, bPrime)
  const cMin = Math.min(rPrime, gPrime, bPrime)
  const delta = cMax - cMin
  const luminosityPrime = (cMax + cMin) / 2

  if (cMax === cMin) {
    // All colors are equal => achromatic
    return {
      hue: 0,
      saturation: 0,
      luminosity: Math.round(luminosityPrime * 100),
    }
  }

  const saturationPrime =
    luminosityPrime > 0.5 ? delta / (2 - cMax - cMin) : delta / (cMax + cMin)
  let huePrime = 0
  switch (cMax) {
    case rPrime:
      huePrime = (gPrime - bPrime) / delta + (gPrime < bPrime ? 6 : 0)
      break
    case gPrime:
      huePrime = (bPrime - rPrime) / delta + 2
      break
    case bPrime:
      huePrime = (rPrime - gPrime) / delta + 4
      break
  }

  return {
    hue: Math.round(huePrime * 60),
    saturation: Math.round(saturationPrime * 100),
    luminosity: Math.round(luminosityPrime * 100),
  }
}

function convertHslToRgb(hue: number, saturation: number, luminosity: number) {
  const huePrime = hue / 360
  const saturationPrime = saturation / 100
  const luminosityPrime = luminosity / 100

  const chroma = (1 - Math.abs(2 * luminosityPrime - 1)) * saturationPrime
  const x = chroma * (1 - Math.abs(((huePrime * 6) % 2) - 1))
  const m = luminosityPrime - chroma / 2

  let rPrime = 0,
    gPrime = 0,
    bPrime = 0

  if (0 <= huePrime && huePrime < 1 / 6) {
    rPrime = chroma
    gPrime = x
    bPrime = 0
  } else if (1 / 6 <= huePrime && huePrime < 1 / 3) {
    rPrime = x
    gPrime = chroma
    bPrime = 0
  } else if (1 / 3 <= huePrime && huePrime < 1 / 2) {
    rPrime = 0
    gPrime = chroma
    bPrime = x
  } else if (1 / 2 <= huePrime && huePrime < 2 / 3) {
    rPrime = 0
    gPrime = x
    bPrime = chroma
  } else if (2 / 3 <= huePrime && huePrime < 5 / 6) {
    rPrime = x
    gPrime = 0
    bPrime = chroma
  } else if (5 / 6 <= huePrime && huePrime < 1) {
    rPrime = chroma
    gPrime = 0
    bPrime = x
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  }
}

function convertHexToHsl(hex: string) {
  const { r, g, b } = convertHexToRgb(hex)
  return convertRgbToHsl(r, g, b)
}

function convertHslToHex(hue: number, saturation: number, luminosity: number) {
  const { r, g, b } = convertHslToRgb(hue, saturation, luminosity)
  return convertRgbToHex(r, g, b)
}

export default function getShades(
  baseColorHex: string,
  darkMode: boolean = false,
) {
  const baseHSL = convertHexToHsl(baseColorHex)
  const {
    hue: baseHue,
    saturation: baseSaturation,
    luminosity: baseLuminosity,
  } = baseHSL

  const luminosityDecrease = Math.round(baseHSL.luminosity / 6) * -1
  const luminosityIncrease = Math.round((100 - baseHSL.luminosity) / 5)

  const lowHalfMultiplier = darkMode ? luminosityDecrease : luminosityIncrease
  const highHalfMultiplier = darkMode ? luminosityIncrease : luminosityDecrease

  // Map to a tailwind shade map
  return {
    '50': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + lowHalfMultiplier * 4.5, 0, 100),
    ),
    '100': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + lowHalfMultiplier * 4, 0, 100),
    ),
    '200': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + lowHalfMultiplier * 3, 0, 100),
    ),
    '300': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + lowHalfMultiplier * 2, 0, 100),
    ),
    '400': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + lowHalfMultiplier, 0, 100),
    ),
    '500': baseColorHex,
    '600': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + highHalfMultiplier, 0, 100),
    ),
    '700': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + highHalfMultiplier * 2, 0, 100),
    ),
    '800': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + highHalfMultiplier * 3, 0, 100),
    ),
    '900': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + highHalfMultiplier * 4, 0, 100),
    ),
    '950': convertHslToHex(
      baseHue,
      baseSaturation,
      clamp(baseLuminosity + highHalfMultiplier * 4.5, 0, 100),
    ),
  }
}

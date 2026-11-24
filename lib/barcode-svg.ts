// ==============================================================================
// Pure TypeScript Code 128 Barcode SVG Generator
// Zero external dependencies - Perfect for Thermal Printers (Xprinter / POS)
// ==============================================================================

// Code 128 patterns (widths of alternating bars and spaces)
const CODE128_PATTERNS: number[] = [
  212222, 222122, 222221, 121223, 121322, 131222, 122213, 122312, 132212, 221213, // 0-9
  221312, 231212, 112232, 122132, 122231, 113222, 123122, 123221, 223211, 221132, // 10-19
  221231, 213212, 223112, 312131, 311222, 321122, 321221, 312212, 322112, 322211, // 20-29
  212123, 212321, 232121, 111323, 131123, 131321, 112313, 132113, 132311, 211313, // 30-39
  231113, 231311, 112133, 112331, 132131, 113123, 113321, 133121, 313121, 211331, // 40-49
  231131, 213113, 213311, 213131, 311123, 311321, 331121, 312113, 312311, 332111, // 50-59
  314111, 221411, 431111, 111224, 111422, 121124, 121421, 141122, 141221, 112214, // 60-69
  112412, 122114, 122411, 142112, 142211, 241211, 221114, 413111, 241112, 134111, // 70-79
  111242, 121142, 121241, 114212, 124112, 124211, 411212, 421112, 421211, 212141, // 80-89
  214121, 412121, 111143, 111341, 131141, 114113, 114311, 411113, 411311, 113141, // 90-99
  114131, 311141, 411131, 211412, 211214, 211232, 2331112 // 100-106 (106 is STOP)
];

const START_B = 104;
const STOP = 106;

export function generateCode128Svg(
  text: string,
  options: {
    height?: number;
    moduleWidth?: number;
    includeText?: boolean;
    fontSize?: number;
  } = {}
): string {
  const height = options.height || 50;
  const moduleWidth = options.moduleWidth || 2;
  const includeText = options.includeText !== false;
  const fontSize = options.fontSize || 12;

  // Clean text to ASCII 32..126
  const cleanText = text.replace(/[^\x20-\x7E]/g, "");
  if (!cleanText) return "";

  // Calculate Code 128 symbols
  const symbols: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i) - 32;
    symbols.push(code);
    checksum += code * (i + 1);
  }

  symbols.push(checksum % 103);
  symbols.push(STOP);

  // Build binary bars (1 = bar, 0 = space)
  const binary: number[] = [];
  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    const patternStr = CODE128_PATTERNS[sym].toString();
    let isBar = true;
    for (let j = 0; j < patternStr.length; j++) {
      const width = parseInt(patternStr[j], 10);
      for (let k = 0; k < width; k++) {
        binary.push(isBar ? 1 : 0);
      }
      isBar = !isBar;
    }
  }

  const quietZone = 10;
  const totalModules = binary.length + quietZone * 2;
  const totalWidth = totalModules * moduleWidth;
  const totalHeight = height + (includeText ? fontSize + 6 : 0);

  // Generate SVG Rectangles
  let rects = "";
  let inBar = false;
  let barStart = 0;

  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === 1) {
      if (!inBar) {
        inBar = true;
        barStart = i;
      }
    } else {
      if (inBar) {
        inBar = false;
        const w = (i - barStart) * moduleWidth;
        const x = (barStart + quietZone) * moduleWidth;
        rects += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000000" />`;
      }
    }
  }
  if (inBar) {
    const w = (binary.length - barStart) * moduleWidth;
    const x = (barStart + quietZone) * moduleWidth;
    rects += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000000" />`;
  }

  let textSvg = "";
  if (includeText) {
    textSvg = `<text x="${totalWidth / 2}" y="${height + fontSize + 2}" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="#000000" text-anchor="middle" letter-spacing="2">${cleanText}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${rects}
    ${textSvg}
  </svg>`;
}

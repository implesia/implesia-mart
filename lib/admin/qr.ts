/**
 * QR Code Model 2, byte mode, error correction M, as an SVG.
 * No canvas and no third-party package, so print views work in the browser
 * and in a Cloudflare Workers build. Masks follow ISO/IEC 18004.
 */

const ECC_PER_BLOCK = [
  0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26,
];
const NUM_BLOCKS = [
  0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16,
];
const MAX_VERSION = 20;

function rawDataModules(version: number) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function dataCapacity(version: number) {
  return (
    Math.floor(rawDataModules(version) / 8) -
    ECC_PER_BLOCK[version] * NUM_BLOCKS[version]
  );
}

function appendBits(value: number, length: number, bits: number[]) {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
}

function rsMultiply(x: number, y: number) {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number) {
  const result = Array.from({ length: degree - 1 }, () => 0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = rsMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = rsMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]) {
  const result = divisor.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coef, index) => {
      result[index] ^= rsMultiply(coef, factor);
    });
  }
  return result;
}

function dataCodewords(bytes: Uint8Array, version: number) {
  const capacity = dataCapacity(version);
  const bits: number[] = [];
  appendBits(0x4, 4, bits);
  appendBits(bytes.length, version <= 9 ? 8 : 16, bits);
  for (const byte of bytes) appendBits(byte, 8, bits);
  const room = capacity * 8 - bits.length;
  if (room < 0) throw new Error("QR value is too long");
  appendBits(0, Math.min(4, room), bits);
  while (bits.length % 8 !== 0) bits.push(0);
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) value = (value << 1) | (bits[i + j] ?? 0);
    out.push(value);
  }
  for (let pad = 0; out.length < capacity; pad ^= 1) out.push(pad === 0 ? 0xec : 0x11);
  return out;
}

function interleave(data: number[], version: number) {
  const numBlocks = NUM_BLOCKS[version];
  const blockEccLen = ECC_PER_BLOCK[version];
  const raw = Math.floor(rawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (raw % numBlocks);
  const shortBlockLen = Math.floor(raw / numBlocks);
  const divisor = rsDivisor(blockEccLen);
  const blocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < numBlocks; i += 1) {
    const length = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
    const block = data.slice(offset, offset + length);
    offset += length;
    const ecc = rsRemainder(block, divisor);
    if (i < numShortBlocks) block.push(0);
    blocks.push(block.concat(ecc));
  }
  if (offset !== data.length) throw new Error("QR data length does not match this version");
  const result: number[] = [];
  const width = blocks[0]?.length ?? 0;
  for (let i = 0; i < width; i += 1) {
    for (let j = 0; j < blocks.length; j += 1) {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
        result.push(blocks[j][i] ?? 0);
      }
    }
  }
  return result;
}

function alignmentPositions(version: number, size: number) {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const positions = [6];
  for (let pos = size - 7; positions.length < count; pos -= step) positions.splice(1, 0, pos);
  return positions;
}

function formatBits(mask: number) {
  const data = mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function versionBits(version: number) {
  let rem = version;
  for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (version << 12) | rem;
}

type Grid = { modules: boolean[][]; fn: boolean[][]; size: number };

function setFunction(grid: Grid, x: number, y: number, dark: boolean) {
  if (x < 0 || y < 0 || x >= grid.size || y >= grid.size) return;
  grid.modules[y][x] = dark;
  grid.fn[y][x] = true;
}

function drawFinder(grid: Grid, cx: number, cy: number) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFunction(grid, cx + dx, cy + dy, dist !== 2 && dist !== 4);
    }
  }
}

function drawFormat(grid: Grid, mask: number) {
  const bits = formatBits(mask);
  const bit = (index: number) => ((bits >>> index) & 1) === 1;
  for (let i = 0; i <= 5; i += 1) setFunction(grid, 8, i, bit(i));
  setFunction(grid, 8, 7, bit(6));
  setFunction(grid, 8, 8, bit(7));
  setFunction(grid, 7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) setFunction(grid, 14 - i, 8, bit(i));
  for (let i = 0; i < 8; i += 1) setFunction(grid, grid.size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i += 1) setFunction(grid, 8, grid.size - 15 + i, bit(i));
  setFunction(grid, 8, grid.size - 8, true);
}

function drawPatterns(grid: Grid, version: number) {
  for (let i = 0; i < grid.size; i += 1) {
    setFunction(grid, 6, i, i % 2 === 0);
    setFunction(grid, i, 6, i % 2 === 0);
  }
  drawFinder(grid, 3, 3);
  drawFinder(grid, grid.size - 4, 3);
  drawFinder(grid, 3, grid.size - 4);
  const positions = alignmentPositions(version, grid.size);
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = 0; j < positions.length; j += 1) {
      const corner =
        (i === 0 && j === 0) ||
        (i === 0 && j === positions.length - 1) ||
        (i === positions.length - 1 && j === 0);
      if (corner) continue;
      const x = positions[i] ?? 0;
      const y = positions[j] ?? 0;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFunction(grid, x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }
  drawFormat(grid, 0);
  if (version >= 7) {
    const bits = versionBits(version);
    for (let i = 0; i < 18; i += 1) {
      const dark = ((bits >>> i) & 1) === 1;
      const a = grid.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunction(grid, a, b, dark);
      setFunction(grid, b, a, dark);
    }
  }
}

function drawCodewords(grid: Grid, codewords: number[]) {
  let index = 0;
  for (let right = grid.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < grid.size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? grid.size - 1 - vert : vert;
        if (!grid.fn[y]?.[x] && index < codewords.length * 8) {
          const byte = codewords[index >>> 3] ?? 0;
          grid.modules[y][x] = ((byte >>> (7 - (index & 7))) & 1) === 1;
          index += 1;
        }
      }
    }
  }
}

function maskInvert(mask: number, x: number, y: number) {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5:
      return (x * y) % 2 + (x * y) % 3 === 0;
    case 6:
      return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
    default:
      return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
  }
}

function applyMask(grid: Grid, mask: number) {
  for (let y = 0; y < grid.size; y += 1) {
    for (let x = 0; x < grid.size; x += 1) {
      if (!grid.fn[y][x] && maskInvert(mask, x, y)) grid.modules[y][x] = !grid.modules[y][x];
    }
  }
}

function finderPenaltyAdd(size: number, run: number, history: number[]) {
  const next = history[0] === 0 ? run + size : run;
  history.pop();
  history.unshift(next);
}

function finderPenaltyCount(history: number[]) {
  const n = history[1] ?? 0;
  const core =
    n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n;
  const left = core && (history[0] ?? 0) >= n * 4 && (history[6] ?? 0) >= n ? 1 : 0;
  const right = core && (history[6] ?? 0) >= n * 4 && (history[0] ?? 0) >= n ? 1 : 0;
  return left + right;
}

function finderPenaltyEnd(size: number, dark: boolean, run: number, history: number[]) {
  let length = run;
  if (dark) {
    finderPenaltyAdd(size, length, history);
    length = 0;
  }
  finderPenaltyAdd(size, length + size, history);
  return finderPenaltyCount(history);
}

function penalty(grid: Grid) {
  let score = 0;
  const scoreLine = (colors: boolean[]) => {
    let runColor = false;
    let run = 0;
    const history = [0, 0, 0, 0, 0, 0, 0];
    for (const color of colors) {
      if (color === runColor) {
        run += 1;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else {
        finderPenaltyAdd(grid.size, run, history);
        if (!runColor) score += finderPenaltyCount(history) * 40;
        runColor = color;
        run = 1;
      }
    }
    score += finderPenaltyEnd(grid.size, runColor, run, history) * 40;
  };
  for (let y = 0; y < grid.size; y += 1) scoreLine(grid.modules[y] ?? []);
  for (let x = 0; x < grid.size; x += 1) {
    const column: boolean[] = [];
    for (let y = 0; y < grid.size; y += 1) column.push(Boolean(grid.modules[y]?.[x]));
    scoreLine(column);
  }
  for (let y = 0; y < grid.size - 1; y += 1) {
    for (let x = 0; x < grid.size - 1; x += 1) {
      const color = grid.modules[y][x];
      if (
        color === grid.modules[y][x + 1] &&
        color === grid.modules[y + 1]?.[x] &&
        color === grid.modules[y + 1]?.[x + 1]
      ) {
        score += 3;
      }
    }
  }
  let dark = 0;
  for (const row of grid.modules) {
    for (const cell of row) if (cell) dark += 1;
  }
  const total = grid.size * grid.size;
  const balance = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  return score + balance * 10;
}

function chooseVersion(byteLength: number) {
  for (let version = 1; version <= MAX_VERSION; version += 1) {
    const countBits = version <= 9 ? 8 : 16;
    if (4 + countBits + byteLength * 8 <= dataCapacity(version) * 8) return version;
  }
  throw new Error("QR value is too long");
}

/** Dark modules, top-left first. Throws when `value` is empty or too long for version 20. */
export function qrMatrix(value: string) {
  if (!value) throw new Error("QR value is empty");
  const bytes = new TextEncoder().encode(value);
  const version = chooseVersion(bytes.length);
  const size = version * 4 + 17;
  const row = Array.from({ length: size }, () => false);
  const grid: Grid = {
    size,
    modules: Array.from({ length: size }, () => row.slice()),
    fn: Array.from({ length: size }, () => row.slice()),
  };
  drawPatterns(grid, version);
  drawCodewords(grid, interleave(dataCodewords(bytes, version), version));
  let best = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask += 1) {
    applyMask(grid, mask);
    drawFormat(grid, mask);
    const score = penalty(grid);
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    applyMask(grid, mask);
  }
  applyMask(grid, best);
  drawFormat(grid, best);
  return grid.modules;
}

/** SVG markup for a QR symbol, including a quiet zone. The payload is not written as text. */
export function qrSvg(value: string, options?: { moduleSize?: number; quiet?: number }) {
  const matrix = qrMatrix(value);
  const moduleSize = options?.moduleSize ?? 4;
  const quiet = options?.quiet ?? 4;
  const span = (matrix.length + quiet * 2) * moduleSize;
  const path: string[] = [];
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix.length; x += 1) {
      if (!matrix[y]?.[x]) continue;
      const px = (x + quiet) * moduleSize;
      const py = (y + quiet) * moduleSize;
      path.push(`M${px} ${py}h${moduleSize}v${moduleSize}h-${moduleSize}z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${span} ${span}" width="${span}" height="${span}" aria-hidden="true"><rect width="${span}" height="${span}" fill="#fff"/><path fill="#111" d="${path.join("")}"/></svg>`;
}

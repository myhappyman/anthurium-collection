type QrVersion = 1 | 2 | 3 | 4 | 5;

type VersionInfo = {
  version: QrVersion;
  dataCodewords: number;
  errorCorrectionCodewords: number;
  alignmentPositions: readonly number[];
};

const VERSION_INFO: readonly VersionInfo[] = [
  {
    version: 1,
    dataCodewords: 19,
    errorCorrectionCodewords: 7,
    alignmentPositions: [],
  },
  {
    version: 2,
    dataCodewords: 34,
    errorCorrectionCodewords: 10,
    alignmentPositions: [6, 18],
  },
  {
    version: 3,
    dataCodewords: 55,
    errorCorrectionCodewords: 15,
    alignmentPositions: [6, 22],
  },
  {
    version: 4,
    dataCodewords: 80,
    errorCorrectionCodewords: 20,
    alignmentPositions: [6, 26],
  },
  {
    version: 5,
    dataCodewords: 108,
    errorCorrectionCodewords: 26,
    alignmentPositions: [6, 30],
  },
];

const FORMAT_MASK = 0x5412;
const FORMAT_GENERATOR = 0x537;

function appendBits(target: number[], value: number, length: number) {
  for (let index = length - 1; index >= 0; index -= 1) {
    target.push((value >>> index) & 1);
  }
}

function selectVersion(byteLength: number) {
  const version = VERSION_INFO.find((candidate) => {
    const capacityBits = candidate.dataCodewords * 8;
    return 4 + 8 + byteLength * 8 <= capacityBits;
  });

  if (!version) {
    throw new Error("QR에 넣을 주소가 너무 깁니다. 108바이트 이하로 줄여주세요.");
  }

  return version;
}

function createDataCodewords(bytes: Uint8Array, info: VersionInfo) {
  const bits: number[] = [];
  const capacityBits = info.dataCodewords * 8;

  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);

  for (const byte of bytes) {
    appendBits(bits, byte, 8);
  }

  const terminatorLength = Math.min(4, capacityBits - bits.length);
  appendBits(bits, 0, terminatorLength);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    let value = 0;
    for (let offset = 0; offset < 8; offset += 1) {
      value = (value << 1) | (bits[index + offset] ?? 0);
    }
    codewords.push(value);
  }

  let pad = 0xec;
  while (codewords.length < info.dataCodewords) {
    codewords.push(pad);
    pad ^= 0xec ^ 0x11;
  }

  return codewords;
}

function multiplyInGaloisField(left: number, right: number) {
  let result = 0;
  let multiplicand = left;
  let multiplier = right;

  for (let index = 0; index < 8; index += 1) {
    if ((multiplier & 1) !== 0) {
      result ^= multiplicand;
    }
    multiplier >>>= 1;
    multiplicand = (multiplicand << 1) ^ ((multiplicand >>> 7) * 0x11d);
  }

  return result;
}

function createReedSolomonDivisor(degree: number) {
  const result = Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;

  for (let index = 0; index < degree; index += 1) {
    for (let coefficient = 0; coefficient < degree; coefficient += 1) {
      result[coefficient] = multiplyInGaloisField(
        result[coefficient] ?? 0,
        root,
      );
      if (coefficient + 1 < degree) {
        result[coefficient] =
          (result[coefficient] ?? 0) ^ (result[coefficient + 1] ?? 0);
      }
    }
    root = multiplyInGaloisField(root, 0x02);
  }

  return result;
}

function createErrorCorrectionCodewords(data: readonly number[], degree: number) {
  const divisor = createReedSolomonDivisor(degree);
  const result = Array<number>(degree).fill(0);

  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    for (let index = 0; index < result.length; index += 1) {
      result[index] =
        (result[index] ?? 0) ^
        multiplyInGaloisField(divisor[index] ?? 0, factor);
    }
  }

  return result;
}

function setModule(
  modules: Array<Array<boolean | null>>,
  row: number,
  column: number,
  value: boolean,
) {
  if (modules[row]?.[column] !== undefined) {
    modules[row][column] = value;
  }
}

function drawFinderPattern(
  modules: Array<Array<boolean | null>>,
  centerRow: number,
  centerColumn: number,
) {
  for (let rowOffset = -4; rowOffset <= 4; rowOffset += 1) {
    for (let columnOffset = -4; columnOffset <= 4; columnOffset += 1) {
      const distance = Math.max(Math.abs(rowOffset), Math.abs(columnOffset));
      const value = distance !== 2 && distance !== 4;
      setModule(
        modules,
        centerRow + rowOffset,
        centerColumn + columnOffset,
        value,
      );
    }
  }
}

function drawAlignmentPattern(
  modules: Array<Array<boolean | null>>,
  centerRow: number,
  centerColumn: number,
) {
  for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
    for (let columnOffset = -2; columnOffset <= 2; columnOffset += 1) {
      setModule(
        modules,
        centerRow + rowOffset,
        centerColumn + columnOffset,
        Math.max(Math.abs(rowOffset), Math.abs(columnOffset)) !== 1,
      );
    }
  }
}

function reserveFormatAreas(modules: Array<Array<boolean | null>>) {
  const size = modules.length;

  for (let index = 0; index <= 8; index += 1) {
    if (modules[8]?.[index] === null) {
      setModule(modules, 8, index, false);
    }
    if (modules[index]?.[8] === null) {
      setModule(modules, index, 8, false);
    }
  }

  for (let index = 0; index < 8; index += 1) {
    setModule(modules, 8, size - 1 - index, false);
    setModule(modules, size - 1 - index, 8, false);
  }
}

function createFunctionPattern(info: VersionInfo) {
  const size = info.version * 4 + 17;
  const modules = Array.from({ length: size }, () =>
    Array<boolean | null>(size).fill(null),
  );

  drawFinderPattern(modules, 3, 3);
  drawFinderPattern(modules, 3, size - 4);
  drawFinderPattern(modules, size - 4, 3);

  for (let index = 8; index < size - 8; index += 1) {
    setModule(modules, 6, index, index % 2 === 0);
    setModule(modules, index, 6, index % 2 === 0);
  }

  for (const row of info.alignmentPositions) {
    for (const column of info.alignmentPositions) {
      if (modules[row]?.[column] === null) {
        drawAlignmentPattern(modules, row, column);
      }
    }
  }

  reserveFormatAreas(modules);
  setModule(modules, size - 8, 8, true);

  return modules;
}

function maskCondition(mask: number, row: number, column: number) {
  switch (mask) {
    case 0:
      return (row + column) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return column % 3 === 0;
    case 3:
      return (row + column) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0;
    case 5:
      return ((row * column) % 2) + ((row * column) % 3) === 0;
    case 6:
      return (((row * column) % 2) + ((row * column) % 3)) % 2 === 0;
    case 7:
      return (((row + column) % 2) + ((row * column) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function drawCodewords(
  modules: Array<Array<boolean | null>>,
  codewords: readonly number[],
  mask: number,
) {
  const size = modules.length;
  const bits: number[] = [];

  for (const codeword of codewords) {
    appendBits(bits, codeword, 8);
  }

  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }

    for (let vertical = 0; vertical < size; vertical += 1) {
      const row = upward ? size - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const column = right - offset;
        if (modules[row]?.[column] !== null) {
          continue;
        }
        const bit = bits[bitIndex] ?? 0;
        setModule(
          modules,
          row,
          column,
          Boolean(bit) !== maskCondition(mask, row, column),
        );
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
}

function calculateFormatBits(mask: number) {
  const data = (0b01 << 3) | mask;
  let remainder = data << 10;

  for (let bit = 14; bit >= 10; bit -= 1) {
    if (((remainder >>> bit) & 1) !== 0) {
      remainder ^= FORMAT_GENERATOR << (bit - 10);
    }
  }

  return ((data << 10) | remainder) ^ FORMAT_MASK;
}

function drawFormatBits(
  modules: Array<Array<boolean | null>>,
  mask: number,
) {
  const size = modules.length;
  const bits = calculateFormatBits(mask);
  const bit = (index: number) => ((bits >>> index) & 1) !== 0;

  for (let index = 0; index <= 5; index += 1) {
    setModule(modules, index, 8, bit(index));
  }
  setModule(modules, 7, 8, bit(6));
  setModule(modules, 8, 8, bit(7));
  setModule(modules, 8, 7, bit(8));
  for (let index = 9; index < 15; index += 1) {
    setModule(modules, 8, 14 - index, bit(index));
  }

  for (let index = 0; index < 8; index += 1) {
    setModule(modules, 8, size - 1 - index, bit(index));
  }
  for (let index = 8; index < 15; index += 1) {
    setModule(modules, size - 15 + index, 8, bit(index));
  }
  setModule(modules, size - 8, 8, true);
}

function countRunPenalty(line: readonly boolean[]) {
  let penalty = 0;
  let runColor = line[0] ?? false;
  let runLength = 1;

  for (let index = 1; index < line.length; index += 1) {
    if (line[index] === runColor) {
      runLength += 1;
      if (runLength === 5) {
        penalty += 3;
      } else if (runLength > 5) {
        penalty += 1;
      }
    } else {
      runColor = line[index] ?? false;
      runLength = 1;
    }
  }

  return penalty;
}

function countFinderPenalty(line: readonly boolean[]) {
  let penalty = 0;

  for (let start = 0; start <= line.length - 7; start += 1) {
    const isFinder =
      line[start] === true &&
      line[start + 1] === false &&
      line[start + 2] === true &&
      line[start + 3] === true &&
      line[start + 4] === true &&
      line[start + 5] === false &&
      line[start + 6] === true;

    if (!isFinder) {
      continue;
    }

    const hasWhiteBefore =
      start >= 4 &&
      line.slice(start - 4, start).every((module) => !module);
    const hasWhiteAfter =
      start + 11 <= line.length &&
      line.slice(start + 7, start + 11).every((module) => !module);

    if (hasWhiteBefore || hasWhiteAfter) {
      penalty += 40;
    }
  }

  return penalty;
}

function calculatePenalty(modules: readonly (readonly boolean[])[]) {
  const size = modules.length;
  let penalty = 0;
  let darkModules = 0;

  for (let row = 0; row < size; row += 1) {
    const rowModules = modules[row] ?? [];
    penalty += countRunPenalty(rowModules);
    penalty += countFinderPenalty(rowModules);
    darkModules += rowModules.filter(Boolean).length;

    const columnModules = modules.map(
      (moduleRow) => moduleRow[row] ?? false,
    );
    penalty += countRunPenalty(columnModules);
    penalty += countFinderPenalty(columnModules);
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let column = 0; column < size - 1; column += 1) {
      const color = modules[row]?.[column] ?? false;
      if (
        (modules[row]?.[column + 1] ?? false) === color &&
        (modules[row + 1]?.[column] ?? false) === color &&
        (modules[row + 1]?.[column + 1] ?? false) === color
      ) {
        penalty += 3;
      }
    }
  }

  const totalModules = size * size;
  penalty +=
    Math.floor(Math.abs(darkModules * 20 - totalModules * 10) / totalModules) *
    10;

  return penalty;
}

export function createQrMatrix(value: string): readonly (readonly boolean[])[] {
  const bytes = new TextEncoder().encode(value);
  const info = selectVersion(bytes.length);
  const dataCodewords = createDataCodewords(bytes, info);
  const errorCorrectionCodewords = createErrorCorrectionCodewords(
    dataCodewords,
    info.errorCorrectionCodewords,
  );
  const codewords = [...dataCodewords, ...errorCorrectionCodewords];
  let bestMatrix: boolean[][] | null = null;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask += 1) {
    const modules = createFunctionPattern(info);
    drawCodewords(modules, codewords, mask);
    drawFormatBits(modules, mask);
    const matrix = modules.map((row) =>
      row.map((module) => module ?? false),
    );
    const penalty = calculatePenalty(matrix);

    if (penalty < bestPenalty) {
      bestMatrix = matrix;
      bestPenalty = penalty;
    }
  }

  if (!bestMatrix) {
    throw new Error("QR 매트릭스를 생성하지 못했습니다.");
  }

  return bestMatrix;
}

/**
 * A small .xlsx reader and writer for one worksheet.
 * Writes are stored (uncompressed) ZIP files with inline strings.
 * Reads also accept Deflate worksheets and shared strings, so a file saved
 * by Excel can be previewed when the inventory API is still the local mock.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function workbookBytes(sheetName: string, rows: string[][]): Uint8Array {
  const name = xmlEscape(sheetName || "Sheet1").slice(0, 31);
  const sheet = sheetXml(rows);
  const files: Array<[string, string]> = [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `</Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `</Relationships>`,
    ],
    ["xl/worksheets/sheet1.xml", sheet],
  ];
  return zipStore(files.map(([path, xml]) => ({ name: path, data: encoder.encode(xml) })));
}

export async function readFirstSheet(bytes: Uint8Array): Promise<string[][]> {
  const files = await unzip(bytes);
  const sheet = files.get("xl/worksheets/sheet1.xml");
  if (!sheet) throw new Error("The workbook has no worksheet.");
  const shared = files.get("xl/sharedStrings.xml");
  const strings = shared ? sharedStrings(decoder.decode(shared)) : [];
  return parseSheet(decoder.decode(sheet), strings);
}

function sheetXml(rows: string[][]) {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, column) => {
          const ref = `${columnName(column)}${rowIndex + 1}`;
          const text = value ?? "";
          if (text !== "" && /^-?\d+(?:\.\d+)?$/.test(text)) {
            return `<c r="${ref}"><v>${text}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${body}</sheetData></worksheet>`
  );
}

function columnName(index: number) {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlUnescape(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function sharedStrings(xml: string) {
  const items: string[] = [];
  const pattern = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  for (const match of xml.matchAll(pattern)) {
    const texts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) =>
      xmlUnescape(part[1]),
    );
    items.push(texts.join(""));
  }
  return items;
}

function parseSheet(xml: string, shared: string[]) {
  const matrix: string[][] = [];
  const rowPattern = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  for (const rowMatch of xml.matchAll(rowPattern)) {
    const rowRef = attribute(rowMatch[1], "r");
    const rowIndex = rowRef ? Math.max(0, Number(rowRef) - 1) : matrix.length;
    const cells = matrix[rowIndex] ?? [];
    const cellPattern = /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let columnCursor = 0;
    for (const cellMatch of rowMatch[2].matchAll(cellPattern)) {
      const ref = attribute(cellMatch[1], "r");
      const column = ref ? columnIndex(ref) : columnCursor;
      columnCursor = column + 1;
      cells[column] = cellText(cellMatch[1], cellMatch[2] ?? "", shared);
    }
    matrix[rowIndex] = cells;
  }
  return matrix.map((row) => row.map((cell) => cell ?? ""));
}

function cellText(attrs: string, inner: string, shared: string[]) {
  const type = attribute(attrs, "t");
  if (type === "inlineStr") {
    return [...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) => xmlUnescape(part[1])).join("");
  }
  const value = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
  if (type === "s") {
    const index = Number(value);
    return Number.isInteger(index) ? (shared[index] ?? "") : "";
  }
  return xmlUnescape(value);
}

function attribute(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? xmlUnescape(match[1]) : "";
}

function columnIndex(ref: string) {
  const letters = ref.match(/[A-Z]+/i)?.[0].toUpperCase() ?? "A";
  let n = 0;
  for (const char of letters) n = n * 26 + (char.charCodeAt(0) - 64);
  return n - 1;
}

type ZipEntry = { name: string; data: Uint8Array };

function zipStore(entries: ZipEntry[]) {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const local = concatBytes([
      bytesOf(u32(0x04034b50)),
      bytesOf(u16(20)),
      bytesOf(u16(0)),
      bytesOf(u16(0)),
      bytesOf(u16(0)),
      bytesOf(u16(0)),
      bytesOf(u32(crc)),
      bytesOf(u32(entry.data.length)),
      bytesOf(u32(entry.data.length)),
      bytesOf(u16(name.length)),
      bytesOf(u16(0)),
      name,
      entry.data,
    ]);
    parts.push(local);
    central.push(
      concatBytes([
        bytesOf(u32(0x02014b50)),
        bytesOf(u16(20)),
        bytesOf(u16(20)),
        bytesOf(u16(0)),
        bytesOf(u16(0)),
        bytesOf(u16(0)),
        bytesOf(u16(0)),
        bytesOf(u32(crc)),
        bytesOf(u32(entry.data.length)),
        bytesOf(u32(entry.data.length)),
        bytesOf(u16(name.length)),
        bytesOf(u16(0)),
        bytesOf(u16(0)),
        bytesOf(u16(0)),
        bytesOf(u16(0)),
        bytesOf(u32(0)),
        bytesOf(u32(offset)),
        name,
      ]),
    );
    offset += local.length;
  }
  const centralBytes = concatBytes(central);
  const end = concatBytes([
    bytesOf(u32(0x06054b50)),
    bytesOf(u16(0)),
    bytesOf(u16(0)),
    bytesOf(u16(entries.length)),
    bytesOf(u16(entries.length)),
    bytesOf(u32(centralBytes.length)),
    bytesOf(u32(offset)),
    bytesOf(u16(0)),
  ]);
  return concatBytes([...parts, centralBytes, end]);
}

async function unzip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = new Map<string, Uint8Array>();
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const compressed = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
    const dataStart = nameStart + nameLength + extraLength;
    if (flags & 0x8) break;
    const payload = bytes.subarray(dataStart, dataStart + compressed);
    if (method === 0) files.set(name, payload);
    else if (method === 8) files.set(name, await inflateRaw(payload));
    else throw new Error("This workbook uses a compression method the preview cannot read.");
    offset = dataStart + compressed;
  }
  return files;
}

async function inflateRaw(data: Uint8Array) {
  const streamApi = globalThis.DecompressionStream;
  if (!streamApi) throw new Error("Cannot read a compressed workbook in this environment.");
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const stream = new Blob([copy]).stream().pipeThrough(new streamApi("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function u16(value: number) {
  return [value & 255, (value >> 8) & 255];
}

function u32(value: number) {
  return [value & 255, (value >> 8) & 255, (value >> 16) & 255, (value >>> 24) & 255];
}

function bytesOf(values: number[]) {
  return Uint8Array.from(values);
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

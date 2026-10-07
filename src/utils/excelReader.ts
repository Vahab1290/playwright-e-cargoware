import ExcelJS from 'exceljs';
import path from 'path';

export type DataRow = Record<string, string>;

const DATA_DIR = path.resolve(__dirname, '../../tests/data');

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text).trim();
    if ('result' in value) return String(value.result ?? '').trim();
  }
  return String(value).trim();
}

/** Reads a sheet into row objects keyed by the header row (row 1). */
export async function readSheet(file: string, sheet: string): Promise<DataRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(DATA_DIR, file));
  const ws = workbook.getWorksheet(sheet);
  if (!ws) throw new Error(`Sheet "${sheet}" not found in ${file}`);

  const headers = (ws.getRow(1).values as ExcelJS.CellValue[]).slice(1).map(cellText);
  const rows: DataRow[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const values = (row.values as ExcelJS.CellValue[]).slice(1);
    const obj: DataRow = {};
    headers.forEach((h, i) => (obj[h] = cellText(values[i])));
    if (Object.values(obj).some(Boolean)) rows.push(obj);
  });
  return rows;
}

/** Returns the row whose TestCase column matches `testCase`. */
export async function getTestData(file: string, sheet: string, testCase: string): Promise<DataRow> {
  const row = (await readSheet(file, sheet)).find((r) => r.TestCase === testCase);
  if (!row) throw new Error(`TestCase "${testCase}" not found in ${file} / ${sheet}`);
  return row;
}

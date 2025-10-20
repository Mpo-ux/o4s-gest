import { describe, it, expect } from 'vitest';
import { extractSheetId } from './googleSheets';
import { parseCSV } from './googleSheets';

describe('extractSheetId', () => {
  it('extracts id from full url', () => {
    const url = 'https://docs.google.com/spreadsheets/d/abcd-1234_efgHIJ/edit#gid=0';
    expect(extractSheetId(url)).toBe('abcd-1234_efgHIJ');
  });

  it('returns id when passed id directly', () => {
    const id = 'abcd-1234_efgHIJ';
    expect(extractSheetId(id)).toBe(id);
  });

  it('returns null for invalid string', () => {
    expect(extractSheetId('not-a-sheet')).toBeNull();
  });
});

describe('parseCSV', () => {
  it('parses simple csv', () => {
    const csv = 'a,b,c\n1,2,3\n';
    expect(parseCSV(csv)).toEqual([['a','b','c'],['1','2','3']]);
  });

  it('parses quoted cells with commas and CRLF', () => {
    const csv = 'a,b\n"multi,line,cell",x\r\n1,2,3\n';
    const rows = parseCSV(csv);
    // quoted cell is at first data row, first column (row index 0, col index 0)
    expect(rows[0][0]).toBe('a');
    expect(rows[1][0]).toBe('multi,line,cell');
  });
});

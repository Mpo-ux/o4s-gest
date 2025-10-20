/**
 * Obtém os nomes das abas (sheets) de uma Google Sheet via API
 */
export async function getSheetNames(sheetId: string, accessToken: string): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch sheet names. Check permissions and token.');
  }
  const data = await response.json();
  return (data.sheets || []).map((s: { properties: { title: string } }) => s.properties.title);
}

/**
 * Obtém o título do documento (nome da spreadsheet)
 */
export async function getSpreadsheetTitle(sheetId: string, accessToken: string): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch spreadsheet title. Check permissions and token.');
  }
  const data = await response.json();
  return data?.properties?.title || '';
}
export function extractSheetId(url: string): string | null {
  const patterns = [
    /\/spreadsheets\/d\/((?=.*[0-9_])[A-Za-z0-9-_]{8,})/,
    /^((?=.*[0-9_])[A-Za-z0-9-_]{8,})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function buildPublicCsvUrl(sheetId: string, gid: string = '0'): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Fetch sheet data as CSV and parse into rows.
 * If accessToken is provided, it will be sent as a Bearer token to allow fetching private sheets
 * that the user has access to.
 */
export async function fetchSheetData(sheetId: string, accessToken?: string, sheetNameOrGid?: string): Promise<string[][]> {
  // Permite sheetName ou GID
  let range = '';
  let useGid = false;
  if (sheetNameOrGid) {
    // Se for só dígitos, assume GID
    if (/^\d+$/.test(sheetNameOrGid)) {
      useGid = true;
    } else {
      range = encodeURIComponent(sheetNameOrGid);
    }
  }
  if (useGid) {
    // Buscar nome da aba pelo GID
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties&access_token=${accessToken}`;
    const metaRes = await fetch(metaUrl);
    if (!metaRes.ok) {
      const err = await metaRes.json().catch(() => ({}));
      throw new Error('Failed to fetch sheet meta: ' + (err.error?.message || metaRes.statusText));
    }
    const meta = await metaRes.json();
    const sheet = meta.sheets?.find((s: { properties: { sheetId: number; title: string } }) => String(s.properties.sheetId) === sheetNameOrGid);
    if (!sheet) throw new Error('Sheet/tab with GID not found');
    range = encodeURIComponent(sheet.properties.title);
  }
  if (!range) {
    // fallback: usa primeira aba
    if (!accessToken) throw new Error('Google access token required for sheet name lookup');
    const sheetNames = await getSheetNames(sheetId, accessToken);
    range = encodeURIComponent(sheetNames[0] || 'Sheet1');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?majorDimension=ROWS`;
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Failed to fetch sheet data: ' + (err.error?.message || res.statusText));
  }
  const data = await res.json();
  return data.values || [];
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell);
      if (currentRow.some(cell => cell.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some(cell => cell.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

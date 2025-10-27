import * as XLSX from "xlsx";

export interface ImportedData {
  headers: string[];
  data: Record<string, any>[];
  summary: {
    totalRows: number;
    validRows: number;
    errors: string[];
  };
  sheets?: string[];
  rawData?: Record<string, any[][]>;
  selectedSheet?: string;
  headerRow?: number;
}

export class FileProcessor {
  /**
   * Processa os dados de uma sheet Excel já carregada (rawData) para preview e seleção
   * @param rawData Dados brutos da sheet (array de arrays)
   * @param headerRow Índice da linha de cabeçalho (default 0)
   * @returns ImportedData
   */
  static processSheetData(
    rawData: any[][],
    headerRow: number = 0
  ): ImportedData {
    if (!rawData || rawData.length === 0) {
      throw new Error("Sheet vazia");
    }
    const headers = (rawData[headerRow] || [])
      .map((h: any) => String(h || "").trim())
      .filter((h: string) => h);
    const rows: Record<string, any>[] = [];
    for (let i = headerRow + 1; i < rawData.length; i++) {
      const rowData = rawData[i];
      if (!rowData || rowData.every((cell: any) => !cell)) continue;
      const row: Record<string, any> = {};
      headers.forEach((header: string, idx: number) => {
        const value = rowData[idx];
        row[header] =
          value !== undefined && value !== null ? String(value).trim() : "";
      });
      rows.push(row);
    }
    return {
      headers,
      data: rows,
      summary: {
        totalRows: rawData.length - (headerRow + 1),
        validRows: rows.length,
        errors: [],
      },
    };
  }
  static async processCSVText(text: string): Promise<ImportedData> {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      throw new Error("Ficheiro vazio");
    }
    // Primeira linha como cabeçalhos
    const headers = this.parseCSVLine(lines[0]);
    const data: Record<string, any>[] = [];
    const errors: string[] = [];
    let validRows = 0;
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          errors.push(`Linha ${i + 1}: Número de colunas incorreto`);
          continue;
        }
        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || "";
        });
        data.push(row);
        validRows++;
      } catch (error) {
        errors.push(`Linha ${i + 1}: ${error}`);
      }
    }
    return {
      headers,
      data,
      summary: {
        totalRows: lines.length - 1,
        validRows,
        errors,
      },
    };
  }

  static async processFile(file: File): Promise<ImportedData> {
    const extension = file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "csv":
        return this.processCSV(file);
      case "xlsx":
      case "xls":
        return this.processExcelWithSheets(file);
      default:
        throw new Error("Formato de ficheiro não suportado");
    }
  }

  /**
   * Processa Excel e retorna todas as sheets e dados brutos para seleção dinâmica
   */
  static async processExcelWithSheets(file: File): Promise<ImportedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheets = workbook.SheetNames;
          if (!sheets.length)
            throw new Error("Nenhuma folha encontrada no ficheiro");
          // Extrair dados brutos de todas as sheets
          const rawData: Record<string, any[][]> = {};
          sheets.forEach((sheet) => {
            const ws = workbook.Sheets[sheet];
            rawData[sheet] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          });
          // Por padrão, sheet 0 e header na linha 0
          const defaultSheet = sheets[0];
          const jsonData = rawData[defaultSheet] || [];
          const headers = (jsonData[0] || [])
            .map((h: any) => String(h || "").trim())
            .filter((h: string) => h);
          const rows: Record<string, any>[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i];
            if (!rowData || rowData.every((cell: any) => !cell)) continue;
            const row: Record<string, any> = {};
            headers.forEach((header: string, idx: number) => {
              const value = rowData[idx];
              row[header] =
                value !== undefined && value !== null
                  ? String(value).trim()
                  : "";
            });
            rows.push(row);
          }
          resolve({
            headers,
            data: rows,
            summary: {
              totalRows: jsonData.length - 1,
              validRows: rows.length,
              errors: [],
            },
            sheets,
            rawData,
            selectedSheet: defaultSheet,
            headerRow: 0,
          });
        } catch (error) {
          reject(new Error(`Erro ao processar Excel: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler ficheiro"));
      reader.readAsArrayBuffer(file);
    });
  }

  private static async processCSV(file: File): Promise<ImportedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter((line) => line.trim());

          if (lines.length === 0) {
            throw new Error("Ficheiro vazio");
          }

          // Primeiro linha como cabeçalhos
          const headers = this.parseCSVLine(lines[0]);
          const data: Record<string, any>[] = [];
          const errors: string[] = [];
          let validRows = 0;

          // Processar dados
          for (let i = 1; i < lines.length; i++) {
            try {
              const values = this.parseCSVLine(lines[i]);

              if (values.length !== headers.length) {
                errors.push(`Linha ${i + 1}: Número de colunas incorreto`);
                continue;
              }

              const row: Record<string, any> = {};
              headers.forEach((header, index) => {
                row[header] = values[index]?.trim() || "";
              });

              data.push(row);
              validRows++;
            } catch (error) {
              errors.push(`Linha ${i + 1}: ${error}`);
            }
          }

          resolve({
            headers,
            data,
            summary: {
              totalRows: lines.length - 1,
              validRows,
              errors,
            },
          });
        } catch (error) {
          reject(new Error(`Erro ao processar CSV: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error("Erro ao ler ficheiro"));
      reader.readAsText(file);
    });
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  private static async processExcel(file: File): Promise<ImportedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(buffer, { type: "array" });

          // Usar a primeira folha
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            throw new Error("Nenhuma folha encontrada no ficheiro");
          }

          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as any[][];

          if (jsonData.length === 0) {
            throw new Error("Folha vazia");
          }

          // Primeira linha como cabeçalhos
          const headers = jsonData[0]
            .map((h) => String(h || "").trim())
            .filter((h) => h);
          const rows: Record<string, any>[] = [];
          const errors: string[] = [];
          let validRows = 0;

          // Processar dados
          for (let i = 1; i < jsonData.length; i++) {
            try {
              const rowData = jsonData[i];

              if (!rowData || rowData.every((cell) => !cell)) {
                continue; // Skip empty rows
              }

              const row: Record<string, any> = {};
              headers.forEach((header, index) => {
                const value = rowData[index];
                row[header] =
                  value !== undefined && value !== null
                    ? String(value).trim()
                    : "";
              });

              rows.push(row);
              validRows++;
            } catch (error) {
              errors.push(`Linha ${i + 1}: ${error}`);
            }
          }

          resolve({
            headers,
            data: rows,
            summary: {
              totalRows: jsonData.length - 1,
              validRows,
              errors,
            },
          });
        } catch (error) {
          reject(new Error(`Erro ao processar Excel: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error("Erro ao ler ficheiro"));
      reader.readAsArrayBuffer(file);
    });
  }

  static validateBusinessData(
    data: Record<string, any>[],
    type: "cliente" | "fornecedor"
  ): {
    valid: Record<string, any>[];
    invalid: { row: Record<string, any>; errors: string[] }[];
  } {
    const valid: Record<string, any>[] = [];
    const invalid: { row: Record<string, any>; errors: string[] }[] = [];

    data.forEach((row) => {
      const errors: string[] = [];

      // Validações básicas
      if (type === "cliente") {
        if (!row.nome && !row.name && !row.cliente) {
          errors.push("Nome do cliente é obrigatório");
        }
        if (row.email && !this.isValidEmail(row.email)) {
          errors.push("Email inválido");
        }
        if (row.telefone && !this.isValidPhone(row.telefone)) {
          errors.push("Telefone inválido");
        }
      } else if (type === "fornecedor") {
        if (!row.nome && !row.name && !row.fornecedor) {
          errors.push("Nome do fornecedor é obrigatório");
        }
        if (row.email && !this.isValidEmail(row.email)) {
          errors.push("Email inválido");
        }
        if (row.nif && !this.isValidNIF(row.nif)) {
          errors.push("NIF inválido");
        }
      }

      if (errors.length === 0) {
        valid.push(row);
      } else {
        invalid.push({ row, errors });
      }
    });

    return { valid, invalid };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 9;
  }

  private static isValidNIF(nif: string): boolean {
    const cleanNIF = nif.replace(/\D/g, "");
    return cleanNIF.length === 9;
  }
}

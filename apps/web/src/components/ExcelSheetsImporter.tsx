import React, { useRef, useState } from "react";
import { FileProcessor, ImportedData } from "../utils/fileProcessor";
import { ImportModal } from "./ImportModal";

interface ImporterProps {
  type: "cliente" | "fornecedor";
  onImport: (data: Record<string, any>[]) => void;
}

const ExcelSheetsImporter: React.FC<ImporterProps> = ({ type, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Novos estados para seleção de sheet/header
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [headerRow, setHeaderRow] = useState<number>(0);
  const [previewData, setPreviewData] = useState<ImportedData | null>(null);
  // Novo estado para link Google Sheets
  const [gsheetUrl, setGsheetUrl] = useState("");
  const [gsheetLoading, setGsheetLoading] = useState(false);
  // Função para importar Google Sheets via link público (CSV export)
  const handleGoogleSheetsImport = async () => {
    setError(null);
    setGsheetLoading(true);
    setImportedData(null);
    setPreviewData(null);
    setSelectedSheet(null);
    setHeaderRow(0);
    try {
      // Extrai o ID do link
      const match =
        gsheetUrl.match(/\/d\/([\w-]+)/) || gsheetUrl.match(/id=([\w-]+)/);
      const sheetId = match ? match[1] : null;
      if (!sheetId) throw new Error("Link do Google Sheets inválido");
      // Monta URL de exportação CSV da primeira sheet
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const resp = await fetch(exportUrl);
      if (!resp.ok)
        throw new Error(
          "Não foi possível obter dados do Google Sheets. Certifique-se que o ficheiro é público."
        );
      const csvText = await resp.text();
      // Usa FileProcessor para processar CSV
      const data = await FileProcessor.processCSVText(csvText);
      setImportedData(data);
      setPreviewData(data);
      setModalOpen(true);
    } catch (err: any) {
      setError(err.message || "Erro ao importar Google Sheets");
    } finally {
      setGsheetLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    setImportedData(null);
    setPreviewData(null);
    setSelectedSheet(null);
    setHeaderRow(0);
    try {
      const data = await FileProcessor.processFile(file);
      setImportedData(data);
      // Se for Excel, sheet selecionada = primeira
      if (data.sheets && data.sheets.length > 0) {
        setSelectedSheet(data.sheets[0]);
        setHeaderRow(0);
        // Gera preview inicial
        const preview = FileProcessor.processSheetData(
          data.rawData![data.sheets[0]],
          0
        );
        setPreviewData({
          ...preview,
          sheets: data.sheets,
          rawData: data.rawData,
          selectedSheet: data.sheets[0],
          headerRow: 0,
        });
      } else {
        setPreviewData(data);
        setModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar ficheiro");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  // Atualiza preview ao mudar sheet/header
  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    setHeaderRow(0);
    if (importedData && importedData.rawData && importedData.rawData[sheet]) {
      const preview = FileProcessor.processSheetData(
        importedData.rawData[sheet],
        0
      );
      setPreviewData({
        ...preview,
        sheets: importedData.sheets,
        rawData: importedData.rawData,
        selectedSheet: sheet,
        headerRow: 0,
      });
    }
  };

  const handleHeaderRowChange = (row: number) => {
    setHeaderRow(row);
    if (
      importedData &&
      selectedSheet &&
      importedData.rawData &&
      importedData.rawData[selectedSheet]
    ) {
      const preview = FileProcessor.processSheetData(
        importedData.rawData[selectedSheet],
        row
      );
      setPreviewData({
        ...preview,
        sheets: importedData.sheets,
        rawData: importedData.rawData,
        selectedSheet,
        headerRow: row,
      });
    }
  };

  const handleConfirmImport = (data: Record<string, any>[]) => {
    onImport(data);
    setModalOpen(false);
    setImportedData(null);
    setPreviewData(null);
    setSelectedSheet(null);
    setHeaderRow(0);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button
          type="button"
          onClick={handleOpenFile}
          className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
          disabled={loading}
        >
          <span>📥</span>
          <span>{loading ? "A processar..." : "Importar Ficheiro"}</span>
        </button>
        <input
          id="excel-file-input"
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
          title="Selecionar ficheiro Excel ou CSV para importar"
          aria-label="Selecionar ficheiro Excel ou CSV para importar"
        />
        <span className="text-slate-500 font-medium">ou</span>
        <input
          id="gsheet-url-input"
          type="text"
          value={gsheetUrl}
          onChange={(e) => setGsheetUrl(e.target.value)}
          placeholder="Colar link Google Sheets público"
          className="px-3 py-2 rounded border border-slate-300 w-64"
          disabled={gsheetLoading}
          aria-label="Link Google Sheets público"
        />
        <button
          type="button"
          onClick={handleGoogleSheetsImport}
          className="bg-gradient-to-r from-yellow-500 to-green-500 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-600 hover:to-green-600 transition-all duration-200"
          disabled={gsheetLoading || !gsheetUrl}
        >
          {gsheetLoading ? "A importar..." : "Importar Google Sheets"}
        </button>
        {error && <span className="text-red-600 text-sm ml-2">{error}</span>}
      </div>

      {/* Se for Excel, permitir seleção de sheet e linha de header antes do modal final */}
      {importedData && importedData.sheets && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <div>
              <label
                htmlFor="sheet-select"
                className="block text-sm font-medium mb-1"
              >
                Aba (Sheet):
              </label>
              <select
                id="sheet-select"
                title="Aba (Sheet)"
                value={selectedSheet || importedData.sheets[0]}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="px-3 py-2 rounded border border-slate-300"
                aria-label="Aba (Sheet)"
              >
                {importedData.sheets.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="header-row-input"
                className="block text-sm font-medium mb-1"
              >
                Linha de Header:
              </label>
              <input
                id="header-row-input"
                type="number"
                min={0}
                max={
                  importedData.rawData && selectedSheet
                    ? Math.max(
                        0,
                        (importedData.rawData[selectedSheet]?.length || 1) - 1
                      )
                    : 0
                }
                value={headerRow}
                onChange={(e) => handleHeaderRowChange(Number(e.target.value))}
                className="px-3 py-2 rounded border border-slate-300 w-24"
                aria-label="Linha de Header"
                title="Linha de Header"
              />
            </div>
            <button
              type="button"
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              onClick={() => setModalOpen(true)}
              disabled={!previewData}
            >
              Rever e Importar
            </button>
          </div>
          {/* Preview da tabela */}
          {previewData && (
            <div className="overflow-x-auto max-h-64 border rounded bg-white">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {previewData.headers.map((h) => (
                      <th
                        key={h}
                        className="p-2 border-b font-semibold text-slate-700 bg-slate-100"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      {previewData.headers.map((h) => (
                        <td key={h} className="p-2 border-b text-slate-800">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-slate-500 mt-1">
                A mostrar até 10 linhas para pré-visualização.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de importação final */}
      <ImportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        importedData={previewData}
        type={type}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
};

export default ExcelSheetsImporter;

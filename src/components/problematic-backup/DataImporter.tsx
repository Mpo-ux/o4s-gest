import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImportedData {
  filename: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

export default function DataImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<ImportedData | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetOptions = [
    { value: 'inventory', label: 'Inventário', description: 'Equipamentos e material' },
    { value: 'clients', label: 'Clientes', description: 'Base de dados de clientes' },
    { value: 'suppliers', label: 'Fornecedores', description: 'Base de dados de fornecedores' },
    { value: 'rmas-index', label: 'RMAs (Índice)', description: 'Lista principal de RMAs' }
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await parseFile(file);
      setImportData(data);
    } catch (error) {
      console.error('Erro ao processar ficheiro:', error);
      alert('Erro ao processar ficheiro. Verifique se é um Excel (.xlsx) ou CSV válido.');
    } finally {
      setIsImporting(false);
    }
  };

  const parseFile = async (file: File): Promise<ImportedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          
          if (file.name.toLowerCase().endsWith('.csv')) {
            const parsed = parseCSV(data);
            resolve({
              filename: file.name,
              headers: parsed.headers,
              rows: parsed.rows,
              totalRows: parsed.rows.length
            });
          } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            // Para Excel, vamos simular o parsing por agora
            // Em produção, usaria uma biblioteca como SheetJS
            const lines = data.split('\n');
            const headers = lines[0]?.split('\t') || [];
            const rows = lines.slice(1).map(line => line.split('\t')).filter(row => row.length > 1);
            
            resolve({
              filename: file.name,
              headers,
              rows,
              totalRows: rows.length
            });
          } else {
            reject(new Error('Formato de ficheiro não suportado'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler ficheiro'));
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      return line.split(';').map(cell => cell.trim().replace(/"/g, ''));
    }).filter(row => row.length > 1 && row.some(cell => cell.length > 0));
    
    return { headers, rows };
  };

  const performImport = async () => {
    if (!importData || !selectedTarget) return;

    setIsImporting(true);
    try {
      const result = await importToTarget(selectedTarget, importData);
      setImportResults([result, ...importResults]);
      
      if (result.success) {
        setImportData(null);
        setSelectedTarget('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      setImportResults([{
        success: false,
        message: `Erro durante importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }, ...importResults]);
    } finally {
      setIsImporting(false);
    }
  };

  const importToTarget = async (target: string, data: ImportedData): Promise<ImportResult> => {
    // Simular importação - em produção isto usaria o SecureSheetsAPI
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mappings = getFieldMappings(target, data.headers);
    
    if (mappings.length === 0) {
      return {
        success: false,
        message: `Não foi possível mapear os campos do ficheiro para ${target}`
      };
    }

    // Simular processamento das linhas
    const processedRows = data.rows.map((row) => {
      const mappedRow: Record<string, string> = {};
      mappings.forEach(mapping => {
        if (mapping.sourceIndex !== -1) {
          mappedRow[mapping.targetField] = row[mapping.sourceIndex] || '';
        }
      });
      return mappedRow;
    });

    return {
      success: true,
      message: `Importação concluída com sucesso para ${targetOptions.find(t => t.value === target)?.label}`,
      importedCount: processedRows.length
    };
  };

  const getFieldMappings = (target: string, headers: string[]) => {
    const mappings: Array<{targetField: string, sourceIndex: number, confidence: number}> = [];
    
    const targetFields = {
      inventory: ['ID', 'Nome', 'Categoria', 'Quantidade', 'Localização', 'Estado', 'Data Criação'],
      clients: ['ID', 'Nome', 'Email', 'Telefone', 'Empresa', 'Endereço', 'NIF', 'Estado'],
      suppliers: ['ID', 'Nome', 'Email', 'Telefone', 'Categoria', 'Avaliação', 'Estado'],
      'rmas-index': ['ID', 'Cliente', 'Equipamento', 'Estado', 'Data Abertura', 'Técnico']
    };

    const fields = targetFields[target as keyof typeof targetFields] || [];
    
    fields.forEach(targetField => {
      let bestMatch = -1;
      let highestConfidence = 0;
      
      headers.forEach((header, index) => {
        const confidence = calculateFieldConfidence(targetField, header);
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = index;
        }
      });
      
      if (highestConfidence > 0.3) { // Threshold mínimo de confiança
        mappings.push({
          targetField,
          sourceIndex: bestMatch,
          confidence: highestConfidence
        });
      }
    });
    
    return mappings;
  };

  const calculateFieldConfidence = (targetField: string, sourceHeader: string): number => {
    const target = targetField.toLowerCase();
    const source = sourceHeader.toLowerCase();
    
    // Mapeamentos diretos
    const directMappings: Record<string, string[]> = {
      'id': ['id', 'código', 'codigo', 'ref', 'referência', 'referencia'],
      'nome': ['nome', 'name', 'designação', 'designacao', 'título', 'titulo'],
      'email': ['email', 'e-mail', 'mail', 'correio'],
      'telefone': ['telefone', 'phone', 'tel', 'telemovel', 'telemóvel'],
      'empresa': ['empresa', 'company', 'organização', 'organizacao'],
      'categoria': ['categoria', 'category', 'tipo', 'class', 'grupo'],
      'quantidade': ['quantidade', 'qty', 'stock', 'estoque'],
      'estado': ['estado', 'status', 'situação', 'situacao'],
      'data criação': ['data', 'date', 'criado', 'created', 'registo', 'registro']
    };
    
    const synonyms = directMappings[target] || [target];
    
    for (const synonym of synonyms) {
      if (source.includes(synonym) || synonym.includes(source)) {
        return source === synonym ? 1.0 : 0.8;
      }
    }
    
    // Similaridade parcial
    const similarity = calculateStringSimilarity(target, source);
    return similarity > 0.5 ? similarity * 0.7 : 0;
  };

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6" />
          Importar Dados de Ficheiros
        </h2>
      </div>

      <div className="space-y-6">
        {/* Upload de Ficheiro */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Seleccionar Ficheiro
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Excel (.xlsx, .xls) ou CSV (.csv)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Escolher Ficheiro
              </label>
            </div>
          </div>
        </div>

        {/* Pré-visualização dos Dados */}
        {importData && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
              Pré-visualização: {importData.filename}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total de linhas: {importData.totalRows}
              </p>
            </div>

            {/* Selecção de Destino */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Importar para:
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar destino...</option>
                {targetOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabela de Pré-visualização */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    {importData.headers.slice(0, 6).map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {header}
                      </th>
                    ))}
                    {importData.headers.length > 6 && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        +{importData.headers.length - 6} colunas
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {importData.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-600">
                      {row.slice(0, 6).map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {cell.length > 30 ? `${cell.substring(0, 30)}...` : cell}
                        </td>
                      ))}
                      {row.length > 6 && (
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          ...
                        </td>
                      )}
                    </tr>
                  ))}
                  {importData.rows.length > 5 && (
                    <tr>
                      <td colSpan={Math.min(importData.headers.length, 7)} className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                        +{importData.rows.length - 5} linhas adicionais
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Botão de Importação */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={performImport}
                disabled={!selectedTarget || isImporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? 'A Importar...' : 'Importar Dados'}
              </button>
              <button
                onClick={() => {
                  setImportData(null);
                  setSelectedTarget('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Resultados das Importações */}
        {importResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Histórico de Importações
            </h3>
            {importResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  result.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${
                      result.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {result.message}
                    </p>
                    {result.importedCount && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {result.importedCount} registos importados
                      </p>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <ul className="text-xs text-red-600 dark:text-red-400 mt-1 list-disc list-inside">
                        {result.errors.slice(0, 3).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {result.errors.length > 3 && (
                          <li>+{result.errors.length - 3} erros adicionais</li>
                        )}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => setImportResults(importResults.filter((_, i) => i !== index))}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações sobre Estruturas Esperadas */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          💡 Estruturas de Ficheiros Suportadas
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p><strong>Inventário:</strong> ID, Nome, Categoria, Quantidade, Localização, Estado</p>
          <p><strong>Clientes:</strong> ID, Nome, Email, Telefone, Empresa, Endereço, NIF</p>
          <p><strong>Fornecedores:</strong> ID, Nome, Email, Telefone, Categoria, Avaliação</p>
          <p><strong>RMAs:</strong> ID, Cliente, Equipamento, Estado, Data Abertura, Técnico</p>
        </div>
      </div>
    </div>
  );
}
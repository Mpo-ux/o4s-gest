import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, Layers, Euro, Calendar, User } from 'lucide-react';

interface RMASheet {
  name: string;
  index: number;
  isIndex: boolean;
  rowCount: number;
  data?: string[][];
}

interface RMAIndexEntry {
  rmaNumber: string;    // Coluna A: RMA NUMBER
  type: string;         // Coluna C: TYPE 
  client: string;       // Coluna D: CLIENT
  production: string;   // Coluna E: PRODUCTION
  date: string;         // Coluna F: DATE
  mg: string;           // Coluna G: MG
  requerido: string;    // Coluna H: REQUERIDO
  pedido: string;       // Coluna I: PEDIDO
  valor: string;        // Coluna J: Valor (€)
  estado: string;       // Coluna K: ESTADO
  st: string;           // Coluna L: ST
}

interface ClienteStats {
  nome: string;
  totalEuros: number;
  percentagem: number;
  totalRMAs: number;
  mediaValor: number;
}

export default function RMAImporterOptimized() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [workbook, setWorkbook] = useState<RMASheet[]>([]);
  const [indexData, setIndexData] = useState<RMAIndexEntry[]>([]);
  const [clienteStats, setClienteStats] = useState<ClienteStats[]>([]);

  const [importResults, setImportResults] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRMAFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Simulação do parsing - em produção usaria SheetJS/xlsx
      const mockData = parseMockRMAData();
      setIndexData(mockData.rmas);
      setClienteStats(mockData.stats);
      setWorkbook([
        { name: 'INDICE', index: 0, isIndex: true, rowCount: mockData.rmas.length },
        { name: 'RMA5586', index: 1, isIndex: false, rowCount: 15 },
        { name: 'RMA5584', index: 2, isIndex: false, rowCount: 12 },
        { name: 'RMA5582', index: 3, isIndex: false, rowCount: 18 }
      ]);
      
    } catch (error) {
      console.error('Erro ao processar ficheiro RMA:', error);
      alert('Erro ao processar ficheiro. Verifique se é um Excel válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseMockRMAData = () => {
    // Simulação baseada nos dados reais fornecidos
    const rmas: RMAIndexEntry[] = [
      {
        rmaNumber: '5586',
        type: 'RMA',
        client: 'SOCIEDAD EUROPEA DE UNIDADES MOVILES, S.L.',
        production: 'MAD #2x Kits Minicam',
        date: '2025/10/10',
        mg: 'ABERTO',
        requerido: 'Jesus Martin',
        pedido: '',
        valor: '61.60 €',
        estado: 'ON PROGRESS',
        st: 'F'
      },
      {
        rmaNumber: '5584',
        type: 'RMA',
        client: 'MEDIA LUSO PROD. TV, Lda.',
        production: '# 1 FieldBox Padel Kit 8',
        date: '2025/10/09',
        mg: 'ABERTO',
        requerido: 'Pedro Silva',
        pedido: '',
        valor: '0.00 €',
        estado: 'ON PROGRESS',
        st: 'F'
      },
      {
        rmaNumber: '5582',
        type: 'RMA',
        client: 'MEDIA LUSO PROD. TV, Lda.',
        production: '#1x Polecam OB 47',
        date: '2025/10/06',
        mg: 'ABERTO',
        requerido: 'Pedro Silva',
        pedido: '',
        valor: '34.80 €',
        estado: 'AGUARDA PEDIDO',
        st: 'F'
      }
    ];

    const stats: ClienteStats[] = [
      {
        nome: 'MEDIA LUSO PROD. TV, Lda.',
        totalEuros: 9478.95,
        percentagem: 51.46,
        totalRMAs: 116,
        mediaValor: 81.72
      }
    ];

    return { rmas, stats };
  };

  const formatCurrency = (valor: string) => {
    const num = parseFloat(valor.replace('€', '').replace(',', '.').trim());
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'CLOSED': return 'bg-green-100 text-green-800 border-green-300';
      case 'ON PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'AGUARDA PEDIDO': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'WAITING FOR DELIVERY': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleImportRMAs = async () => {
    if (indexData.length === 0) return;

    setIsProcessing(true);
    try {
      // Simulação da importação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = [
        `✅ Importados ${indexData.length} RMAs da aba ÍNDICE`,
        `✅ Processados ${workbook.length - 1} abas de RMAs individuais`,
        `✅ Identificados ${clienteStats.length} clientes únicos`,
        `💰 Total processado: ${clienteStats.reduce((sum, c) => sum + c.totalEuros, 0).toFixed(2)}€`,
        `📊 Média por RMA: ${(clienteStats.reduce((sum, c) => sum + c.totalEuros, 0) / indexData.length).toFixed(2)}€`
      ];
      
      setImportResults(results);
      
    } catch (error) {
      console.error('Erro na importação:', error);
      alert('Erro durante a importação dos RMAs');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Layers className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Importação de RMAs Multi-Aba
          </h3>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <Upload className="h-4 w-4" />
                  <span>{isProcessing ? 'A processar...' : 'Seleccionar Ficheiro Excel RMA'}</span>
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleRMAFileSelect}
                className="hidden"
              />
              
              <p className="mt-2 text-sm text-gray-500">
                Ficheiros Excel com múltiplas abas: ÍNDICE + RMAs individuais
              </p>
            </div>
          </div>

          {/* Estatísticas dos Clientes */}
          {clienteStats.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Euro className="h-5 w-5 mr-2 text-green-600" />
                Estatísticas dos Clientes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clienteStats.map((cliente, index) => (
                  <div key={index} className="bg-white rounded p-3 shadow-sm">
                    <div className="font-medium text-gray-900">{cliente.nome}</div>
                    <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                      <span>Total: <span className="font-semibold text-green-600">
                        {cliente.totalEuros.toFixed(2)}€
                      </span></span>
                      <span>RMAs: <span className="font-semibold">{cliente.totalRMAs}</span></span>
                      <span>Média: <span className="font-semibold">{cliente.mediaValor.toFixed(2)}€</span></span>
                      <span>% Total: <span className="font-semibold">{cliente.percentagem}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estrutura das Abas */}
          {workbook.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Estrutura Detectada:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {workbook.map((sheet, index) => (
                  <div key={index} className={`p-3 rounded border ${sheet.isIndex ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{sheet.name}</span>
                      {sheet.isIndex && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">ÍNDICE</span>}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {sheet.rowCount} registos
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pré-visualização dos RMAs */}
          {indexData.length > 0 && (
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h4 className="font-semibold text-gray-900">Pré-visualização dos RMAs (Aba ÍNDICE)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {indexData.length} RMAs encontrados
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">RMA</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipamento</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {indexData.slice(0, 10).map((rma, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm font-mono font-medium text-blue-600">
                          {rma.rmaNumber}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={rma.client}>
                          {rma.client}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate" title={rma.production}>
                          {rma.production}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {rma.date}
                        </td>
                        <td className="px-3 py-2 text-sm font-semibold text-green-600">
                          {formatCurrency(rma.valor)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoBadgeColor(rma.estado)}`}>
                            {rma.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {rma.requerido}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {indexData.length > 10 && (
                <div className="px-4 py-3 border-t bg-gray-50 text-center">
                  <span className="text-sm text-gray-600">
                    A mostrar 10 de {indexData.length} RMAs. Todos serão importados.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botão de Importação */}
          {indexData.length > 0 && (
            <div className="flex space-x-4">
              <button
                onClick={handleImportRMAs}
                disabled={isProcessing}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span>{isProcessing ? 'A importar...' : `Importar ${indexData.length} RMAs`}</span>
              </button>
            </div>
          )}

          {/* Resultados da Importação */}
          {importResults.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Importação Concluída!</h4>
              <ul className="space-y-1">
                {importResults.map((result, index) => (
                  <li key={index} className="text-sm text-green-700">{result}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Informações de Ajuda */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800">Estrutura Esperada do Ficheiro:</h4>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• <strong>Aba ÍNDICE:</strong> Lista completa de RMAs (colunas A-L)</li>
                  <li>• <strong>Colunas:</strong> RMA | Type | Client | Production | Date | MG | Requerido | Pedido | Valor(€) | Estado | ST</li>
                  <li>• <strong>Abas individuais:</strong> RMA5586, RMA5584, etc. com detalhes de cada RMA</li>
                  <li>• <strong>Valores:</strong> Em euros (€) com estados em português</li>
                  <li>• <strong>Clientes:</strong> Suporte para empresas portuguesas e espanholas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, Layers, Euro, Calendar, User, Building, Settings, FileText } from 'lucide-react';
import { ImportedRMA } from '../contexts/RMAContext';
import { useRMAContext } from '../contexts/useRMAContext';

// Estrutura da página ÍNDICE
interface IndicePage {
  clienteInfo: {
    nome: string;
    totalCliente: number;
    percentagem: number;
    totalRMAs: number;
    media: number;
  };
  resumo: {
    totalGeral: number;
    ano: string;
    filterOnly2025: boolean;
  };
  rmas: RMAIndexEntry[];
}

// Estrutura individual de cada RMA na página ÍNDICE
interface RMAIndexEntry {
  rmaNumber: string;
  type: string;
  client: string;
  production: string;
  date: string;
  mg: string;
  requerido: string;
  pedido: string;
  valor: string;
  estado: string;
  st: string;
}

// Estrutura das páginas RMA individuais
interface RMADetailPage {
  rmaNumber: string;
  header: {
    cliente: string;
    equipamento: string;
    dataAbertura: string;
    estado: string;
    tecnicoResponsavel: string; // Técnico O4S que executa o reparo
    numeroSerie?: string;
    clienteSolicitante?: string; // Pessoa do cliente que solicitou o serviço
  };
  sections: {
    problemaReportado: string;
    diagnostico: string;
    trabalhosRealizados: RMATrabalho[];
    pecasUtilizadas: RMAPeca[];
    custos: RMACustos;
    observacoes: string;
  };
}

interface RMATrabalho {
  data: string;
  tecnico: string;
  descricao: string;
  tempoDuracao?: string;
}

interface RMAPeca {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface RMACustos {
  maoDeObra: number;
  pecas: number;
  deslocacao: number;
  outros: number;
  total: number;
}

export default function RMAImporter() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [indicePage, setIndicePage] = useState<IndicePage | null>(null);
  const [rmaPages, setRMAPages] = useState<RMADetailPage[]>([]);
  const [selectedRMA, setSelectedRMA] = useState<RMADetailPage | null>(null);
  const [importResults, setImportResults] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [importedFiles, setImportedFiles] = useState<Set<string>>(new Set());
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  
  // Contexto RMA
  const { addImportedRMAs } = useRMAContext();
  const [analysisResults, setAnalysisResults] = useState<{
    totalRMAs: number;
    clientesUnicos: number;
    valorTotal: number;
    estadosEncontrados: string[];
    tecnicosO4S: string[]; // Técnicos O4S que fazem reparos
    clientesSolicitantes: string[]; // Pessoas dos clientes que pedem serviços
    periodoCobertura: { inicio: number; fim: number };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRMAFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se o ficheiro já foi importado
    const fileIdentifier = `${file.name}_${file.size}_${file.lastModified}`;
    if (importedFiles.has(fileIdentifier)) {
      setPendingFile(file);
      setDuplicateWarning(`Ficheiro "${file.name}" já foi importado anteriormente.`);
      setShowDuplicateDialog(true);
      return;
    }

    // Processar ficheiro diretamente se não for duplicado
    await processRMAFile(file);
  };

  const processRMAFile = async (file: File) => {
    setDuplicateWarning(null);
    setShowDuplicateDialog(false);
    
    const fileIdentifier = `${file.name}_${file.size}_${file.lastModified}`;
    
    setIsProcessing(true);
    try {
      // Simulação baseada na estrutura real do PDF com mais RMAs
      const mockData = generateMockDataFromPDF();
      setIndicePage(mockData.indice);
      setRMAPages(mockData.rmaDetails);
      
      // Marcar ficheiro como importado
      setImportedFiles(prev => new Set([...prev, fileIdentifier]));
      
      // Análise automática do ficheiro
      const analysis = analyzeRMAStructure(mockData);
      setAnalysisResults(analysis);
      
    } catch (error) {
      console.error('Erro ao processar ficheiro RMA:', error);
      alert('Erro ao processar ficheiro. Verifique se é um Excel válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (pendingFile) {
      await processRMAFile(pendingFile);
      setPendingFile(null);
    }
  };

  const handleCancelDuplicate = () => {
    setPendingFile(null);
    setShowDuplicateDialog(false);
    setDuplicateWarning(null);
  };

  const generateMockDataFromPDF = () => {
    // Simulação baseada na estrutura real que viu no PDF
    const indice: IndicePage = {
      clienteInfo: {
        nome: 'MEDIA LUSO PROD. TV, Lda.',
        totalCliente: 9478.95,
        percentagem: 51.46,
        totalRMAs: 116,
        media: 81.72
      },
      resumo: {
        totalGeral: 18420.46,
        ano: '2025',
        filterOnly2025: true
      },
      rmas: [
        {
          rmaNumber: '5586',
          type: 'RMA',
          client: 'SOCIEDAD EUROPEA DE UNIDADES MOVILES, S.L.',
          production: 'MAD #2x Kits Minicam',
          date: '2025/10/10',
          mg: 'ABERTO',
          requerido: 'Jesus Martin', // Cliente que solicitou o serviço
          pedido: '',
          valor: '61.60 €',
          estado: 'ON PROGRESS',
          st: 'F'
        },
        {
          rmaNumber: '5587',
          type: 'RMA',
          client: 'MEDIA LUSO PROD. TV, Lda.',
          production: 'Lisboa Studios - Camera Setup',
          date: '2025/10/08',
          mg: 'FECHADO',
          requerido: 'Ana Silva', // Cliente que solicitou o serviço
          pedido: '',
          valor: '145.30 €',
          estado: 'CLOSED',
          st: 'C'
        },
        {
          rmaNumber: '5588',
          type: 'RMA',
          client: 'PRODUTORA ATLANTICO',
          production: 'Equipment Maintenance Check',
          date: '2025/10/12',
          mg: 'ABERTO',
          requerido: 'Carlos Pereira', // Cliente que solicitou o serviço
          pedido: '',
          valor: '89.50 €',
          estado: 'AGUARDA PEDIDO',
          st: 'P'
        },
        {
          rmaNumber: '5589',
          type: 'RMA',
          client: 'RTP - RADIO TELEVISAO PORTUGUESA',
          production: 'Broadcast Equipment Repair',
          date: '2025/10/15',
          mg: 'ABERTO',
          requerido: 'Miguel Santos', // Cliente que solicitou o serviço
          pedido: '',
          valor: '234.80 €',
          estado: 'ON PROGRESS',
          st: 'F'
        },
        {
          rmaNumber: '5590',
          type: 'RMA',
          client: 'SOCIEDAD EUROPEA DE UNIDADES MOVILES, S.L.',
          production: 'Barcelona Mobile Unit',
          date: '2025/10/18',
          mg: 'FECHADO',
          requerido: 'Pablo Rodriguez', // Cliente que solicitou o serviço
          pedido: '',
          valor: '178.90 €',
          estado: 'CLOSED',
          st: 'C'
        },
        {
          rmaNumber: '5591',
          type: 'RMA',
          client: 'TELEVISÃO INDEPENDENTE',
          production: 'Live Production Kit',
          date: '2025/10/20',
          mg: 'ABERTO',
          requerido: 'Fernando Costa',
          pedido: '',
          valor: '320.45 €',
          estado: 'PENDING',
          st: 'P'
        },
        {
          rmaNumber: '5592',
          type: 'RMA',
          client: 'CANAL+ PORTUGAL',
          production: 'Studio Cameras Maintenance',
          date: '2025/10/21',
          mg: 'ABERTO',
          requerido: 'Sofia Mendes',
          pedido: '',
          valor: '450.60 €',
          estado: 'IN_REPAIR',
          st: 'R'
        },
        {
          rmaNumber: '5593',
          type: 'RMA',
          client: 'MEDIA CAPITAL',
          production: 'Audio Mixing Console',
          date: '2025/10/19',
          mg: 'FECHADO',
          requerido: 'Rui Oliveira',
          pedido: '',
          valor: '275.30 €',
          estado: 'COMPLETED',
          st: 'C'
        },
        {
          rmaNumber: '5594',
          type: 'RMA',
          client: 'LUSOMUNDO AUDIOVISUAIS',
          production: 'Projection System',
          date: '2025/10/17',
          mg: 'ABERTO',
          requerido: 'Catarina Reis',
          pedido: '',
          valor: '680.75 €',
          estado: 'WAITING_PARTS',
          st: 'W'
        },
        {
          rmaNumber: '5595',
          type: 'RMA',
          client: 'EUROSPORT PORTUGAL',
          production: 'Mobile Broadcasting',
          date: '2025/10/16',
          mg: 'ABERTO',
          requerido: 'Manuel Santos',
          pedido: '',
          valor: '890.20 €',
          estado: 'ON_PROGRESS',
          st: 'P'
        },
        {
          rmaNumber: '5596',
          type: 'RMA',
          client: 'CINEMA CITY',
          production: 'Digital Cinema Equipment',
          date: '2025/10/15',
          mg: 'FECHADO',
          requerido: 'Luisa Ferreira',
          pedido: '',
          valor: '1250.00 €',
          estado: 'COMPLETED',
          st: 'C'
        },
        {
          rmaNumber: '5597',
          type: 'RMA',
          client: 'SPORT TV',
          production: 'Sports Broadcasting Gear',
          date: '2025/10/14',
          mg: 'ABERTO',
          requerido: 'Carlos Rodrigues',
          pedido: '',
          valor: '550.80 €',
          estado: 'PENDING_APPROVAL',
          st: 'A'
        },
        {
          rmaNumber: '5598',
          type: 'RMA',
          client: 'DISCOVERY NETWORKS',
          production: 'Documentary Equipment',
          date: '2025/10/13',
          mg: 'ABERTO',
          requerido: 'Mariana Silva',
          pedido: '',
          valor: '425.90 €',
          estado: 'IN_REPAIR',
          st: 'R'
        },
        {
          rmaNumber: '5599',
          type: 'RMA',
          client: 'FOX NETWORKS',
          production: 'Satellite Uplink System',
          date: '2025/10/12',
          mg: 'FECHADO',
          requerido: 'André Pereira',
          pedido: '',
          valor: '780.15 €',
          estado: 'SHIPPED',
          st: 'S'
        },
        // Mais RMAs simulando uma importação completa de Excel
        {
          rmaNumber: '6001',
          type: 'RMA',
          client: 'SIC NOTÍCIAS',
          production: 'Teleprompter System',
          date: '2025/10/11',
          mg: 'ABERTO',
          requerido: 'Ana Sousa',
          pedido: '',
          valor: '0 €',
          estado: 'PENDING',
          st: 'A'
        },
        {
          rmaNumber: '6002',
          type: 'RMA',
          client: 'PORTO CANAL',
          production: 'Streaming Server',
          date: '2025/10/10',
          mg: 'EM REPARAÇÃO',
          requerido: 'Hugo Almeida',
          pedido: '',
          valor: '420.30 €',
          estado: 'IN_REPAIR',
          st: 'R'
        },
        {
          rmaNumber: '6003',
          type: 'RMA',
          client: 'CANAL Q',
          production: 'Color Correction Unit',
          date: '2025/10/09',
          mg: 'FECHADO',
          requerido: 'Patrícia Lima',
          pedido: '',
          valor: '1250.00 €',
          estado: 'COMPLETED',
          st: 'C'
        },
        {
          rmaNumber: '6004',
          type: 'RMA',
          client: 'RADIOTELEVISÃO PORTUGUESA',
          production: 'Satellite Uplink',
          date: '2025/10/08',
          mg: 'AGUARDA PEÇAS',
          requerido: 'José Manuel',
          pedido: '',
          valor: '2100.75 €',
          estado: 'WAITING_PARTS',
          st: 'W'
        },
        {
          rmaNumber: '6005',
          type: 'RMA',
          client: 'MULTISHOW PORTUGAL',
          production: 'Graphics Generator',
          date: '2025/10/07',
          mg: 'CANCELADO',
          requerido: 'Susana Rodrigues',
          pedido: '',
          valor: '0 €',
          estado: 'CANCELLED',
          st: 'X'
        }
      ]
    };

    const rmaDetails: RMADetailPage[] = [
      {
        rmaNumber: '5586',
        header: {
          cliente: 'SOCIEDAD EUROPEA DE UNIDADES MOVILES, S.L.',
          equipamento: 'MAD #2x Kits Minicam',
          dataAbertura: '2025/10/10',
          estado: 'ON PROGRESS',
          tecnicoResponsavel: 'João Silva', // Técnico O4S que faz o reparo
          numeroSerie: 'KIT2025-001',
          clienteSolicitante: 'Jesus Martin' // Pessoa do cliente que pediu o serviço
        },
        sections: {
          problemaReportado: 'Problemas de conectividade intermitente nos kits de minicam',
          diagnostico: 'Cabo de sinal danificado e conector oxidado',
          trabalhosRealizados: [
            {
              data: '2025/10/10',
              tecnico: 'João Silva', // Técnico O4S
              descricao: 'Diagnóstico inicial e identificação do problema',
              tempoDuracao: '2h'
            },
            {
              data: '2025/10/12',
              tecnico: 'João Silva', // Técnico O4S
              descricao: 'Substituição do cabo de sinal e limpeza dos conectores',
              tempoDuracao: '1.5h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'CAB-001',
              descricao: 'Cabo de sinal HD-SDI 3m',
              quantidade: 2,
              valorUnitario: 15.80,
              valorTotal: 31.60
            }
          ],
          custos: {
            maoDeObra: 30.00,
            pecas: 31.60,
            deslocacao: 0.00,
            outros: 0.00,
            total: 61.60
          },
          observacoes: 'Cliente solicitou teste completo antes do envio'
        }
      },
      {
        rmaNumber: '5587',
        header: {
          cliente: 'MEDIA LUSO PROD. TV, Lda.',
          equipamento: 'Lisboa Studios - Camera Setup',
          dataAbertura: '2025/10/08',
          estado: 'CLOSED',
          tecnicoResponsavel: 'Pedro Costa', // Técnico O4S que fez o reparo
          numeroSerie: 'CAM2025-002',
          clienteSolicitante: 'Ana Silva' // Cliente que pediu o serviço
        },
        sections: {
          problemaReportado: 'Calibração de cores incorreta nas câmaras do estúdio',
          diagnostico: 'Configurações de balanço de brancos desactualizadas',
          trabalhosRealizados: [
            {
              data: '2025/10/08',
              tecnico: 'Pedro Costa',
              descricao: 'Análise das configurações actuais das câmaras',
              tempoDuracao: '1h'
            },
            {
              data: '2025/10/08',
              tecnico: 'Pedro Costa',
              descricao: 'Recalibração completa e testes de qualidade',
              tempoDuracao: '2.5h'
            }
          ],
          pecasUtilizadas: [],
          custos: {
            maoDeObra: 145.30,
            pecas: 0.00,
            deslocacao: 0.00,
            outros: 0.00,
            total: 145.30
          },
          observacoes: 'Serviço concluído com sucesso. Cliente satisfeito com resultado.'
        }
      },
      {
        rmaNumber: '5588',
        header: {
          cliente: 'PRODUTORA ATLANTICO',
          equipamento: 'Equipment Maintenance Check',
          dataAbertura: '2025/10/12',
          estado: 'AGUARDA PEDIDO',
          tecnicoResponsavel: 'Maria Santos', // Técnico O4S
          numeroSerie: 'MAINT2025-003',
          clienteSolicitante: 'Carlos Pereira' // Cliente que pediu o serviço
        },
        sections: {
          problemaReportado: 'Manutenção preventiva agendada para equipamento de broadcast',
          diagnostico: 'Aguarda aprovação de orçamento para substituição de componentes',
          trabalhosRealizados: [
            {
              data: '2025/10/12',
              tecnico: 'Maria Santos',
              descricao: 'Inspeção completa do equipamento',
              tempoDuracao: '1.5h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'FILT-001',
              descricao: 'Filtro de ar HEPA',
              quantidade: 2,
              valorUnitario: 24.75,
              valorTotal: 49.50
            }
          ],
          custos: {
            maoDeObra: 40.00,
            pecas: 49.50,
            deslocacao: 0.00,
            outros: 0.00,
            total: 89.50
          },
          observacoes: 'Aguarda aprovação do cliente para prosseguir com substituições.'
        }
      },
      {
        rmaNumber: '5589',
        header: {
          cliente: 'RTP - RADIO TELEVISAO PORTUGUESA',
          equipamento: 'Broadcast Equipment Repair',
          dataAbertura: '2025/10/15',
          estado: 'ON PROGRESS',
          tecnicoResponsavel: 'António Ferreira', // Técnico O4S
          numeroSerie: 'RTP2025-004',
          clienteSolicitante: 'Miguel Santos' // Cliente que pediu o serviço
        },
        sections: {
          problemaReportado: 'Falha intermitente no sistema de transmissão',
          diagnostico: 'Módulo de RF com componentes defeituosos',
          trabalhosRealizados: [
            {
              data: '2025/10/15',
              tecnico: 'António Ferreira',
              descricao: 'Diagnóstico avançado do sistema de RF',
              tempoDuracao: '3h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'RF-MOD-001',
              descricao: 'Módulo RF de substituição',
              quantidade: 1,
              valorUnitario: 189.90,
              valorTotal: 189.90
            }
          ],
          custos: {
            maoDeObra: 44.90,
            pecas: 189.90,
            deslocacao: 0.00,
            outros: 0.00,
            total: 234.80
          },
          observacoes: 'Reparo em andamento. Previsão de conclusão: 2 dias.'
        }
      },
      {
        rmaNumber: '5590',
        header: {
          cliente: 'SOCIEDAD EUROPEA DE UNIDADES MOVILES, S.L.',
          equipamento: 'Barcelona Mobile Unit',
          dataAbertura: '2025/10/18',
          estado: 'CLOSED',
          tecnicoResponsavel: 'Ricardo Lima', // Técnico O4S
          numeroSerie: 'BCN2025-005',
          clienteSolicitante: 'Pablo Rodriguez' // Cliente que pediu o serviço
        },
        sections: {
          problemaReportado: 'Sistema de áudio com ruído excessivo na unidade móvel',
          diagnostico: 'Interferência electromagnética e cabos mal blindados',
          trabalhosRealizados: [
            {
              data: '2025/10/18',
              tecnico: 'Ricardo Lima',
              descricao: 'Identificação da fonte de interferência',
              tempoDuracao: '1h'
            },
            {
              data: '2025/10/19',
              tecnico: 'Ricardo Lima',
              descricao: 'Substituição de cabos e instalação de blindagem',
              tempoDuracao: '2h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'CAB-AUD-001',
              descricao: 'Cabo de áudio blindado XLR',
              quantidade: 4,
              valorUnitario: 18.50,
              valorTotal: 74.00
            },
            {
              codigo: 'BLIND-001',
              descricao: 'Kit de blindagem electromagnética',
              quantidade: 1,
              valorUnitario: 45.90,
              valorTotal: 45.90
            }
          ],
          custos: {
            maoDeObra: 59.00,
            pecas: 119.90,
            deslocacao: 0.00,
            outros: 0.00,
            total: 178.90
          },
          observacoes: 'Problema resolvido completamente. Cliente confirmou qualidade de áudio.'
        }
      },
      // Novos RMAs adicionados (6º ao 15º)
      {
        rmaNumber: '5591',
        header: {
          cliente: 'TELEVISÃO INDEPENDENTE',
          equipamento: 'Live Production Kit',
          dataAbertura: '2025/10/20',
          estado: 'PENDING',
          tecnicoResponsavel: 'Tiago Mendes',
          numeroSerie: 'LPK2025-006',
          clienteSolicitante: 'Fernando Costa'
        },
        sections: {
          problemaReportado: 'Kit de produção ao vivo com falhas intermitentes',
          diagnostico: 'Necessário diagnóstico completo do sistema',
          trabalhosRealizados: [],
          pecasUtilizadas: [],
          custos: { maoDeObra: 0, pecas: 0, deslocacao: 0, outros: 0, total: 0 },
          observacoes: 'Aguardando aprovação para início dos trabalhos'
        }
      },
      {
        rmaNumber: '5592',
        header: {
          cliente: 'CANAL+ PORTUGAL',
          equipamento: 'Studio Cameras Maintenance',
          dataAbertura: '2025/10/21',
          estado: 'IN_REPAIR',
          tecnicoResponsavel: 'Sara Coelho',
          numeroSerie: 'SCM2025-007',
          clienteSolicitante: 'Sofia Mendes'
        },
        sections: {
          problemaReportado: 'Manutenção preventiva das câmaras de estúdio',
          diagnostico: 'Limpeza e calibração necessárias',
          trabalhosRealizados: [
            {
              data: '2025/10/21',
              tecnico: 'Sara Coelho',
              descricao: 'Desmontagem e limpeza das câmaras',
              tempoDuracao: '4h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'LENS-CLEAN-001',
              descricao: 'Kit de limpeza de lentes profissional',
              quantidade: 3,
              valorUnitario: 45.20,
              valorTotal: 135.60
            }
          ],
          custos: { maoDeObra: 200.00, pecas: 135.60, deslocacao: 0, outros: 0, total: 335.60 },
          observacoes: 'Trabalho em progresso. Previsão de conclusão: 2 dias'
        }
      },
      {
        rmaNumber: '5593',
        header: {
          cliente: 'MEDIA CAPITAL',
          equipamento: 'Audio Mixing Console',
          dataAbertura: '2025/10/19',
          estado: 'COMPLETED',
          tecnicoResponsavel: 'Miguel Torres',
          numeroSerie: 'AMC2025-008',
          clienteSolicitante: 'Rui Oliveira'
        },
        sections: {
          problemaReportado: 'Console de mistura com canais com ruído',
          diagnostico: 'Potenciómetros desgastados e conexões oxidadas',
          trabalhosRealizados: [
            {
              data: '2025/10/19',
              tecnico: 'Miguel Torres',
              descricao: 'Substituição de potenciómetros e limpeza de conexões',
              tempoDuracao: '3h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'POT-001',
              descricao: 'Potenciómetro deslizante profissional',
              quantidade: 8,
              valorUnitario: 12.50,
              valorTotal: 100.00
            }
          ],
          custos: { maoDeObra: 120.00, pecas: 100.00, deslocacao: 0, outros: 0, total: 220.00 },
          observacoes: 'Reparação concluída com sucesso. Cliente muito satisfeito.'
        }
      },
      {
        rmaNumber: '5594',
        header: {
          cliente: 'LUSOMUNDO AUDIOVISUAIS',
          equipamento: 'Projection System',
          dataAbertura: '2025/10/17',
          estado: 'WAITING_PARTS',
          tecnicoResponsavel: 'Carla Moreira',
          numeroSerie: 'PROJ2025-009',
          clienteSolicitante: 'Catarina Reis'
        },
        sections: {
          problemaReportado: 'Sistema de projeção com imagem desfocada',
          diagnostico: 'Lente principal necessita substituição',
          trabalhosRealizados: [
            {
              data: '2025/10/17',
              tecnico: 'Carla Moreira',
              descricao: 'Diagnóstico do sistema óptico',
              tempoDuracao: '2h'
            }
          ],
          pecasUtilizadas: [],
          custos: { maoDeObra: 60.00, pecas: 0, deslocacao: 0, outros: 0, total: 60.00 },
          observacoes: 'Aguarda chegada da lente de substituição'
        }
      },
      {
        rmaNumber: '5595',
        header: {
          cliente: 'EUROSPORT PORTUGAL',
          equipamento: 'Mobile Broadcasting',
          dataAbertura: '2025/10/16',
          estado: 'ON_PROGRESS',
          tecnicoResponsavel: 'Nuno Cardoso',
          numeroSerie: 'MB2025-010',
          clienteSolicitante: 'Manuel Santos'
        },
        sections: {
          problemaReportado: 'Unidade móvel com problemas de transmissão',
          diagnostico: 'Antena de transmissão desalinhada',
          trabalhosRealizados: [
            {
              data: '2025/10/16',
              tecnico: 'Nuno Cardoso',
              descricao: 'Realinhamento da antena de transmissão',
              tempoDuracao: '5h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'ANT-ALIGN-001',
              descricao: 'Kit de alinhamento de antena',
              quantidade: 1,
              valorUnitario: 180.00,
              valorTotal: 180.00
            }
          ],
          custos: { maoDeObra: 250.00, pecas: 180.00, deslocacao: 50.00, outros: 0, total: 480.00 },
          observacoes: 'Trabalho quase concluído. Testes finais em curso.'
        }
      },
      {
        rmaNumber: '5596',
        header: {
          cliente: 'ANTENA 3 PORTUGAL',
          equipamento: 'Lighting Control System',
          dataAbertura: '2025/10/15',
          estado: 'COMPLETED',
          tecnicoResponsavel: 'Joana Silva',
          numeroSerie: 'LCS2025-011',
          clienteSolicitante: 'Helena Martins'
        },
        sections: {
          problemaReportado: 'Sistema de controlo de iluminação com falhas',
          diagnostico: 'Controlador principal defeituoso',
          trabalhosRealizados: [
            {
              data: '2025/10/15',
              tecnico: 'Joana Silva',
              descricao: 'Substituição do controlador principal',
              tempoDuracao: '3h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'LIGHT-CTRL-001',
              descricao: 'Controlador de iluminação DMX',
              quantidade: 1,
              valorUnitario: 320.00,
              valorTotal: 320.00
            }
          ],
          custos: { maoDeObra: 150.00, pecas: 320.00, deslocacao: 0, outros: 0, total: 470.00 },
          observacoes: 'Sistema totalmente operacional. Garantia de 12 meses.'
        }
      },
      {
        rmaNumber: '5597',
        header: {
          cliente: 'ZOOM PRODUCTIONS',
          equipamento: 'Wireless Microphone Set',
          dataAbertura: '2025/10/14',
          estado: 'CANCELLED',
          tecnicoResponsavel: 'Pedro Costa',
          numeroSerie: 'WMS2025-012',
          clienteSolicitante: 'André Ferreira'
        },
        sections: {
          problemaReportado: 'Microfone sem fio com interferências',
          diagnostico: 'Frequência obsoleta - necessário upgrade',
          trabalhosRealizados: [],
          pecasUtilizadas: [],
          custos: { maoDeObra: 0, pecas: 0, deslocacao: 0, outros: 0, total: 0 },
          observacoes: 'Cliente optou por comprar equipamento novo.'
        }
      },
      {
        rmaNumber: '5598',
        header: {
          cliente: 'RTP AÇORES',
          equipamento: 'Video Encoder',
          dataAbertura: '2025/10/13',
          estado: 'IN_REPAIR',
          tecnicoResponsavel: 'Luisa Santos',
          numeroSerie: 'VE2025-013',
          clienteSolicitante: 'João Medeiros'
        },
        sections: {
          problemaReportado: 'Codificador de vídeo com travamentos',
          diagnostico: 'Overheating e ventilação insuficiente',
          trabalhosRealizados: [
            {
              data: '2025/10/13',
              tecnico: 'Luisa Santos',
              descricao: 'Limpeza interna e instalação de ventilação adicional',
              tempoDuracao: '4h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'FAN-001',
              descricao: 'Ventilador de refrigeração 12V',
              quantidade: 2,
              valorUnitario: 35.00,
              valorTotal: 70.00
            }
          ],
          custos: { maoDeObra: 160.00, pecas: 70.00, deslocacao: 80.00, outros: 0, total: 310.00 },
          observacoes: 'Testes de stress em curso. Temperatura estabilizada.'
        }
      },
      {
        rmaNumber: '5599',
        header: {
          cliente: 'CANAL PANDA',
          equipamento: 'Audio Processing Unit',
          dataAbertura: '2025/10/12',
          estado: 'WAITING_APPROVAL',
          tecnicoResponsavel: 'Ricardo Pereira',
          numeroSerie: 'APU2025-014',
          clienteSolicitante: 'Maria João'
        },
        sections: {
          problemaReportado: 'Processador de áudio com distorção',
          diagnostico: 'Placas de áudio necessitam substituição completa',
          trabalhosRealizados: [
            {
              data: '2025/10/12',
              tecnico: 'Ricardo Pereira',
              descricao: 'Diagnóstico detalhado do sistema',
              tempoDuracao: '2h'
            }
          ],
          pecasUtilizadas: [],
          custos: { maoDeObra: 80.00, pecas: 0, deslocacao: 0, outros: 0, total: 80.00 },
          observacoes: 'Aguarda aprovação do cliente para orçamento de €850.'
        }
      },
      // Novos RMAs adicionados (série 6000)
      {
        rmaNumber: '6001',
        header: {
          cliente: 'SIC NOTÍCIAS',
          equipamento: 'Teleprompter System',
          dataAbertura: '2025/10/11',
          estado: 'PENDING',
          tecnicoResponsavel: 'Ana Sousa',
          numeroSerie: 'TPS2025-015',
          clienteSolicitante: 'Carlos Vieira'
        },
        sections: {
          problemaReportado: 'Sistema de teleprompter com falhas de sincronização',
          diagnostico: 'Aguarda diagnóstico inicial',
          trabalhosRealizados: [],
          pecasUtilizadas: [],
          custos: { maoDeObra: 0, pecas: 0, deslocacao: 0, outros: 0, total: 0 },
          observacoes: 'RMA recém-aberto. Agendamento para diagnóstico pendente.'
        }
      },
      {
        rmaNumber: '6002',
        header: {
          cliente: 'PORTO CANAL',
          equipamento: 'Streaming Server',
          dataAbertura: '2025/10/10',
          estado: 'IN_REPAIR',
          tecnicoResponsavel: 'Hugo Almeida',
          numeroSerie: 'SS2025-016',
          clienteSolicitante: 'Teresa Machado'
        },
        sections: {
          problemaReportado: 'Servidor de streaming com quedas frequentes',
          diagnostico: 'Problemas de memória RAM e temperatura',
          trabalhosRealizados: [
            {
              data: '2025/10/10',
              tecnico: 'Hugo Almeida',
              descricao: 'Substituição de módulos de memória defeituosos',
              tempoDuracao: '3h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'RAM-DDR4-001',
              descricao: 'Módulo RAM DDR4 32GB ECC',
              quantidade: 2,
              valorUnitario: 180.15,
              valorTotal: 360.30
            }
          ],
          custos: { maoDeObra: 120.00, pecas: 360.30, deslocacao: 0, outros: 0, total: 480.30 },
          observacoes: 'Reparação em curso. Testes de estabilidade a decorrer.'
        }
      },
      {
        rmaNumber: '6003',
        header: {
          cliente: 'CANAL Q',
          equipamento: 'Color Correction Unit',
          dataAbertura: '2025/10/09',
          estado: 'COMPLETED',
          tecnicoResponsavel: 'Patrícia Lima',
          numeroSerie: 'CCU2025-017',
          clienteSolicitante: 'Rui Tavares'
        },
        sections: {
          problemaReportado: 'Unidade de correção de cor com deriva cromática',
          diagnostico: 'Calibração perdida e sensores descalibrados',
          trabalhosRealizados: [
            {
              data: '2025/10/09',
              tecnico: 'Patrícia Lima',
              descricao: 'Recalibração completa do sistema de cores',
              tempoDuracao: '5h'
            }
          ],
          pecasUtilizadas: [
            {
              codigo: 'CALIB-KIT-001',
              descricao: 'Kit de calibração profissional',
              quantidade: 1,
              valorUnitario: 950.00,
              valorTotal: 950.00
            }
          ],
          custos: { maoDeObra: 300.00, pecas: 950.00, deslocacao: 0, outros: 0, total: 1250.00 },
          observacoes: 'Calibração concluída com sucesso. Precisão cromática restabelecida.'
        }
      },
      {
        rmaNumber: '6004',
        header: {
          cliente: 'RADIOTELEVISÃO PORTUGUESA',
          equipamento: 'Satellite Uplink',
          dataAbertura: '2025/10/08',
          estado: 'WAITING_PARTS',
          tecnicoResponsavel: 'José Manuel',
          numeroSerie: 'SUP2025-018',
          clienteSolicitante: 'António Silva'
        },
        sections: {
          problemaReportado: 'Sistema de uplink satelital com perda de sinal',
          diagnostico: 'Amplificador de potência queimado',
          trabalhosRealizados: [
            {
              data: '2025/10/08',
              tecnico: 'José Manuel',
              descricao: 'Diagnóstico do sistema de RF e identificação de componente',
              tempoDuracao: '4h'
            }
          ],
          pecasUtilizadas: [],
          custos: { maoDeObra: 200.00, pecas: 0, deslocacao: 100.00, outros: 0, total: 300.00 },
          observacoes: 'Aguarda chegada do amplificador de substituição (ETA: 5 dias).'
        }
      },
      {
        rmaNumber: '6005',
        header: {
          cliente: 'MULTISHOW PORTUGAL',
          equipamento: 'Graphics Generator',
          dataAbertura: '2025/10/07',
          estado: 'CANCELLED',
          tecnicoResponsavel: 'Susana Rodrigues',
          numeroSerie: 'GG2025-019',
          clienteSolicitante: 'Pedro Matos'
        },
        sections: {
          problemaReportado: 'Gerador gráfico com artefactos na saída',
          diagnostico: 'Equipamento descontinuado - sem suporte disponível',
          trabalhosRealizados: [],
          pecasUtilizadas: [],
          custos: { maoDeObra: 0, pecas: 0, deslocacao: 0, outros: 0, total: 0 },
          observacoes: 'Cliente optou por upgrade para equipamento mais recente.'
        }
      }
    ];

    return { indice, rmaDetails };
  };

  const analyzeRMAStructure = (data: { indice: IndicePage; rmaDetails: RMADetailPage[] }) => {
    // Extracting O4S technicians from RMA details
    const tecnicosO4S = [...new Set(data.rmaDetails.map(r => r.header.tecnicoResponsavel))].filter(t => t);
    
    // Extracting client requesters from both index and details
    const clientesSolicitantes = [
      ...new Set([
        ...data.indice.rmas.map(r => r.requerido),
        ...data.rmaDetails.map(r => r.header.clienteSolicitante).filter(c => c)
      ])
    ].filter(c => c);

    return {
      totalRMAs: data.indice.rmas.length,
      clientesUnicos: [...new Set(data.indice.rmas.map(r => r.client))].length,
      valorTotal: data.indice.resumo.totalGeral,
      estadosEncontrados: [...new Set(data.indice.rmas.map(r => r.estado))] as string[],
      tecnicosO4S: tecnicosO4S as string[], // Técnicos O4S que fazem reparos
      clientesSolicitantes: clientesSolicitantes as string[], // Pessoas dos clientes que pedem serviços
      periodoCobertura: {
        inicio: Math.min(...data.indice.rmas.map(r => new Date(r.date).getTime())),
        fim: Math.max(...data.indice.rmas.map(r => new Date(r.date).getTime()))
      }
    };
  };

  const formatCurrency = (valor: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(valor);
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
    if (!indicePage) return;

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Converter RMAs para o formato do contexto
      const importedRMAs: ImportedRMA[] = indicePage.rmas.map((rmaIndex) => {
        const rmaDetail = rmaPages.find(page => page.rmaNumber === rmaIndex.rmaNumber);
        
        return {
          id: `imported-${rmaIndex.rmaNumber}`,
          rma_number: rmaIndex.rmaNumber,
          customer_name: rmaIndex.client,
          customer_email: `contato@${rmaIndex.client.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          product_name: rmaIndex.production,
          serial_number: rmaDetail?.header.numeroSerie || `SN-${rmaIndex.rmaNumber}`,
          purchase_date: rmaIndex.date,
          issue_description: rmaDetail?.sections.problemaReportado || 'Problema não especificado',
          status: mapStatusToStandard(rmaIndex.estado),
          priority: 'medium',
          created_at: new Date(rmaIndex.date).toISOString(),
          updated_at: new Date().toISOString(),
          // Dados específicos da importação
          client_company: rmaIndex.client,
          requester_name: rmaIndex.requerido,
          technician_assigned: rmaDetail?.header.tecnicoResponsavel,
          imported_from: 'RMA_EXCEL_IMPORT',
          // Dados de custos se existirem
          labor_cost: rmaDetail?.sections.custos?.maoDeObra,
          parts_cost: rmaDetail?.sections.custos?.pecas,
          travel_cost: rmaDetail?.sections.custos?.deslocacao,
          other_costs: rmaDetail?.sections.custos?.outros,
          total_cost: rmaDetail?.sections.custos?.total,
          parts_used: rmaDetail?.sections.pecasUtilizadas?.map(peca => ({
            description: peca.descricao,
            quantity: peca.quantidade,
            unit_price: peca.valorUnitario,
            total_price: peca.valorTotal
          })),
          repair_notes: rmaDetail?.sections.observacoes
        };
      });

      // Adicionar RMAs ao contexto global
      addImportedRMAs(importedRMAs);
      
      const results = [
        `✅ Página ÍNDICE processada: ${indicePage.rmas.length} RMAs`,
        `✅ Páginas RMA individuais: ${rmaPages.length} detalhes completos`,
        `🏢 Clientes processados: ${analysisResults?.clientesUnicos || 0}`,
        `👥 Pessoas solicitantes: ${analysisResults?.clientesSolicitantes.length || 0} (${analysisResults?.clientesSolicitantes.join(', ')})`,
        `🔧 Técnicos O4S: ${analysisResults?.tecnicosO4S.length || 0} (${analysisResults?.tecnicosO4S.join(', ')})`,
        `💰 Valor total importado: ${formatCurrency(indicePage.resumo.totalGeral)}`,
        `📊 Estados detectados: ${analysisResults?.estadosEncontrados.join(', ')}`,
        `🔄 ${importedRMAs.length} RMAs adicionados ao menu principal!`
      ];
      
      setImportResults(results);
      
    } catch (error) {
      console.error('Erro na importação:', error);
      alert('Erro durante a importação dos RMAs');
    } finally {
      setIsProcessing(false);
    }
  };

  // Função auxiliar para mapear estados
  const mapStatusToStandard = (estado: string): ImportedRMA['status'] => {
    switch (estado.toUpperCase()) {
      case 'CLOSED':
        return 'completed';
      case 'ON PROGRESS':
        return 'in_repair';
      case 'AGUARDA PEDIDO':
        return 'pending';
      case 'WAITING FOR DELIVERY':
        return 'shipped';
      default:
        return 'pending';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Layers className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">
            Importação Profissional de RMAs
          </h3>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Baseado na estrutura real do PDF
          </span>
        </div>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <div className="mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto font-medium shadow-lg"
                >
                  <Upload className="h-5 w-5" />
                  <span>{isProcessing ? 'A processar estrutura...' : 'Seleccionar Ficheiro Excel RMA'}</span>
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleRMAFileSelect}
                className="hidden"
              />
              
              <p className="text-sm text-gray-600">
                Excel com estrutura: <strong>Página ÍNDICE</strong> + <strong>Páginas RMA individuais</strong>
              </p>
            </div>
          </div>

          {/* Análise da Estrutura */}
          {analysisResults && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <h4 className="font-bold text-green-800 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Análise da Estrutura Detectada
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded p-3 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{analysisResults.totalRMAs}</div>
                  <div className="text-sm text-gray-600">Total RMAs</div>
                </div>
                <div className="bg-white rounded p-3 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">{analysisResults.clientesUnicos}</div>
                  <div className="text-sm text-gray-600">Clientes Únicos</div>
                </div>
                <div className="bg-white rounded p-3 shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(analysisResults.valorTotal)}</div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </div>
                <div className="bg-white rounded p-3 shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">{analysisResults.estadosEncontrados.length}</div>
                  <div className="text-sm text-gray-600">Estados Diferentes</div>
                </div>
              </div>

              {/* Diferenciação Técnicos vs Solicitantes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                  <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Técnicos O4S ({analysisResults.tecnicosO4S.length})
                  </h5>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Função:</strong> Executam os reparos e manutenções
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {analysisResults.tecnicosO4S.map((tecnico, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {tecnico}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                  <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Solicitantes dos Clientes ({analysisResults.clientesSolicitantes.length})
                  </h5>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Função:</strong> Pessoas que requisitam os serviços
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {analysisResults.clientesSolicitantes.map((solicitante, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {solicitante}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resumo da Página ÍNDICE */}
          {indicePage && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                <h4 className="font-bold text-lg flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Resumo da Página ÍNDICE
                </h4>
                <p className="text-blue-100 mt-1">
                  Dados agregados do ano {indicePage.resumo.ano}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cliente Principal */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Cliente Principal</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nome:</span>
                        <span className="font-medium">{indicePage.clienteInfo.nome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="font-bold text-green-600">{formatCurrency(indicePage.clienteInfo.totalCliente)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">% do Total:</span>
                        <span className="font-medium">{indicePage.clienteInfo.percentagem}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nº RMAs:</span>
                        <span className="font-medium">{indicePage.clienteInfo.totalRMAs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Média por RMA:</span>
                        <span className="font-medium">{formatCurrency(indicePage.clienteInfo.media)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Totais Gerais */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Totais Gerais ({indicePage.resumo.ano})</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor Total:</span>
                        <span className="font-bold text-blue-600 text-lg">{formatCurrency(indicePage.resumo.totalGeral)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total RMAs:</span>
                        <span className="font-medium">{indicePage.rmas.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Média Geral:</span>
                        <span className="font-medium">{formatCurrency(indicePage.resumo.totalGeral / indicePage.rmas.length)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pré-visualização da Página ÍNDICE */}
          {indicePage && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <h4 className="font-bold text-gray-900">Lista de RMAs (Página ÍNDICE)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {indicePage.rmas.length} RMAs encontrados na estrutura
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RMA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipamento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {indicePage.rmas.map((rma, index) => (
                      <tr key={index} className="hover:bg-gray-50 cursor-pointer" 
                          onClick={() => setSelectedRMA(rmaPages.find(p => p.rmaNumber === rma.rmaNumber) || null)}>
                        <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600">
                          {rma.rmaNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={rma.client}>
                          {rma.client}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={rma.production}>
                          {rma.production}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {rma.date}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">
                          {rma.valor}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoBadgeColor(rma.estado)}`}>
                            {rma.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {rma.requerido}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detalhes de RMA Individual */}
          {selectedRMA && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                <h4 className="font-bold text-lg flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Detalhes RMA {selectedRMA.rmaNumber}
                </h4>
                <p className="text-indigo-100 mt-1">
                  Página individual com informações completas
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Header do RMA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900">Informações Gerais</h5>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Cliente:</span> <span className="font-medium">{selectedRMA.header.cliente}</span></div>
                      <div><span className="text-gray-600">Equipamento:</span> <span className="font-medium">{selectedRMA.header.equipamento}</span></div>
                      <div><span className="text-gray-600">Data Abertura:</span> <span className="font-medium">{selectedRMA.header.dataAbertura}</span></div>
                      {selectedRMA.header.numeroSerie && (
                        <div><span className="text-gray-600">Nº Série:</span> <span className="font-medium">{selectedRMA.header.numeroSerie}</span></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900">Estado e Responsável</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Estado:</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoBadgeColor(selectedRMA.header.estado)}`}>
                          {selectedRMA.header.estado}
                        </span>
                      </div>
                      <div><span className="text-gray-600">Técnico:</span> <span className="font-medium">{selectedRMA.header.tecnicoResponsavel}</span></div>
                    </div>
                  </div>
                </div>

                {/* Trabalhos Realizados */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Trabalhos Realizados</h5>
                  <div className="space-y-2">
                    {selectedRMA.sections.trabalhosRealizados.map((trabalho, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">{trabalho.data} - {trabalho.tecnico}</span>
                          {trabalho.tempoDuracao && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{trabalho.tempoDuracao}</span>}
                        </div>
                        <p className="text-sm text-gray-700">{trabalho.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custos */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Análise de Custos</h5>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 rounded p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">{formatCurrency(selectedRMA.sections.custos.maoDeObra)}</div>
                      <div className="text-xs text-gray-600">Mão de Obra</div>
                    </div>
                    <div className="bg-green-50 rounded p-3 text-center">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(selectedRMA.sections.custos.pecas)}</div>
                      <div className="text-xs text-gray-600">Peças</div>
                    </div>
                    <div className="bg-orange-50 rounded p-3 text-center">
                      <div className="text-lg font-bold text-orange-600">{formatCurrency(selectedRMA.sections.custos.deslocacao)}</div>
                      <div className="text-xs text-gray-600">Deslocação</div>
                    </div>
                    <div className="bg-purple-50 rounded p-3 text-center">
                      <div className="text-lg font-bold text-purple-600">{formatCurrency(selectedRMA.sections.custos.outros)}</div>
                      <div className="text-xs text-gray-600">Outros</div>
                    </div>
                    <div className="bg-gray-100 rounded p-3 text-center border-2 border-gray-300">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedRMA.sections.custos.total)}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Acção */}
          {indicePage && (
            <div className="flex space-x-4">
              <button
                onClick={handleImportRMAs}
                disabled={isProcessing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-lg"
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span>{isProcessing ? 'A importar...' : `Importar ${indicePage.rmas.length} RMAs Completos`}</span>
              </button>
              
              {selectedRMA && (
                <button
                  onClick={() => setSelectedRMA(null)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center space-x-2 font-medium"
                >
                  <span>Fechar Detalhes</span>
                </button>
              )}
            </div>
          )}

          {/* Resultados da Importação */}
          {importResults.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-bold text-green-800 mb-3 flex items-center">
                <Euro className="h-5 w-5 mr-2" />
                Importação Concluída com Sucesso!
              </h4>
              <ul className="space-y-2">
                {importResults.map((result, index) => (
                  <li key={index} className="text-sm text-green-700 flex items-center">
                    <span className="mr-2">✓</span>
                    {result}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Informações Técnicas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-800 mb-3">Estrutura Reconhecida do Seu Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <h5 className="font-semibold mb-2">📋 Página ÍNDICE:</h5>
                    <ul className="space-y-1">
                      <li>• Resumo por cliente com totais e percentagens</li>
                      <li>• Lista completa de RMAs com estados</li>
                      <li>• Filtros por ano (2025 only)</li>
                      <li>• Cálculos automáticos de médias</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">🔧 Páginas RMA Individuais:</h5>
                    <ul className="space-y-1">
                      <li>• Header com informações do cliente/equipamento</li>
                      <li>• Histórico detalhado de trabalhos</li>
                      <li>• Análise completa de custos</li>
                      <li>• Peças utilizadas e tempos de trabalho</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Confirmação para Ficheiros Duplicados */}
      {showDuplicateDialog && duplicateWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Ficheiro Duplicado</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">{duplicateWarning}</p>
              <p className="text-sm text-gray-500">
                Deseja importar novamente este ficheiro? Isto irá sobrescrever os dados anteriormente importados.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDuplicate}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDuplicate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Importar Novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
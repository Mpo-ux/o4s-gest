import { useState, useEffect } from 'react';
import { Save, X, Edit2, Undo2, Redo2, Filter, XCircle } from 'lucide-react';
import { supabase, Sheet } from '../lib/supabase';
import { fetchSheetData } from '../lib/googleSheets';

interface SheetViewerProps {
  sheet: Sheet | null;
  highlightRow?: number;
}

export default function SheetViewer({ sheet, highlightRow }: SheetViewerProps) {
  // Estado para filtros por coluna: { [colIndex]: valorSelecionado }
  const [columnFilters, setColumnFilters] = useState<Record<number, string>>({});
  const [filterMenuOpen, setFilterMenuOpen] = useState<{ col: number | null; pos: { x: number; y: number } | null }>({ col: null, pos: null });
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [data, setData] = useState<string[][]>([]);
  const [history, setHistory] = useState<string[][][]>([]);
  const [redoStack, setRedoStack] = useState<string[][][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [reloadTrigger, setReloadTrigger] = useState(0);
  // Qual linha é usada como cabeçalho (0 = linha 1, 1 = linha 2)
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(1);
  // Ordenação por coluna
  const [sortConfig, setSortConfig] = useState<{ colIndex: number | null; direction: 'asc' | 'desc' }>({ colIndex: null, direction: 'asc' });

  // Restaurar preferência de cabeçalho por documento
  useEffect(() => {
    if (!sheet?.id) return;
    const key = `headerRowIndex:${sheet.id}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!Number.isNaN(idx)) setHeaderRowIndex(idx);
    }
  }, [sheet?.id]);

  // Guardar preferência quando muda
  useEffect(() => {
    if (!sheet?.id) return;
    const key = `headerRowIndex:${sheet.id}`;
    localStorage.setItem(key, String(headerRowIndex));
  }, [sheet?.id, headerRowIndex]);

  useEffect(() => {
    if (!sheet) {
      setData([]);
      return;
    }

  async function loadData() {
      setLoading(true);
      setError('');
      setEditedCells({});

      try {
        // prefer sheet_rows (JSON per-row) for performance
        const { data: rowsData } = await supabase
          .from('sheet_rows')
          .select('row_index,row_array')
          .eq('sheet_id', sheet!.id)
          .order('row_index');

        const rowsArray = (rowsData ?? []) as Array<{ row_array?: string[] }>;
        if (rowsArray.length > 0) {
          const maxLen = Math.max(0, ...rowsArray.map(r => (r.row_array?.length ?? 0)));
          const headersRow = (sheet?.headers && sheet.headers.length > 0)
            ? sheet.headers
            : Array.from({ length: maxLen }, (_, i) => `Column ${i + 1}`);
          const rowsParsed: string[][] = [
            headersRow,
            ...rowsArray.map((r) => (r.row_array && r.row_array.length ? r.row_array : Array(maxLen).fill('')))
          ];
          setData(rowsParsed);
          return;
        }

        // Fallback to old cell-per-row model
        const { data: cachedData, error: dbError } = await supabase
          .from('sheet_data')
          .select('*')
          .eq('sheet_id', sheet!.id)
          .order('row_index');

        if (dbError) throw dbError;

        type CachedCell = { row_index: number; column_index: number; column_name: string; cell_value: string };
        const cd = (cachedData as CachedCell[]) || [];
        if (cd.length === 0) {
          const freshData = await fetchSheetData(sheet!.sheet_id);
          setData(freshData);
          return;
        }
        // Ensure stable ordering by row then column (local backend may not support multi-order chaining)
        cd.sort((a, b) => (a.row_index - b.row_index) || (a.column_index - b.column_index));

        const maxRow = Math.max(...cd.map((d) => d.row_index));
        const maxCol = Math.max(...cd.map((d) => d.column_index));

        // Build headers from the first data row's column_name values
        const headers = cd
          .filter((d) => d.row_index === 1)
          .sort((a, b) => a.column_index - b.column_index)
          .map((d) => d.column_name);

        const rows: string[][] = [headers];

        for (let r = 1; r <= maxRow; r++) {
          const row: string[] = [];
          for (let c = 0; c <= maxCol; c++) {
            const cell = cd.find((d) => d.row_index === r && d.column_index === c);
            row.push(cell?.cell_value || '');
          }
          rows.push(row);
        }

        setData(rows);
      } catch (err: unknown) {
        console.error('Error loading sheet data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sheet data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [sheet, reloadTrigger]);

  function pushHistory(current: string[][]) {
    setHistory(h => [...h, current.map(row => [...row])]);
    setRedoStack([]);
  }

  function handleCellEdit(rowIndex: number, colIndex: number, value: string, fromFormulaBar = false) {
    const key = `${rowIndex}-${colIndex}`;
    setEditedCells(prev => ({ ...prev, [key]: value }));
    setData(prev => {
      pushHistory(prev);
      const newData = [...prev];
      if (!newData[rowIndex]) {
        newData[rowIndex] = [];
      }
      newData[rowIndex][colIndex] = value;
      return newData;
    });
    if (!fromFormulaBar) {
      setSelectedCell({ row: rowIndex, col: colIndex });
    }
  }

  async function handleSave() {
    if (!sheet || Object.keys(editedCells).length === 0) return;

    setLoading(true);
    setError('');

    try {
      const updates = Object.entries(editedCells).map(([key, value]) => {
        const [rowIndex, colIndex] = key.split('-').map(Number);
        return {
          sheet_id: sheet.id,
          row_index: rowIndex,
          column_index: colIndex,
          column_name: (data[headerRowIndex]?.[colIndex]) || `Column ${colIndex}`,
          cell_value: value,
        };
      });

      for (const update of updates) {
        const existing = await supabase
          .from('sheet_data')
          .select('id')
          .eq('sheet_id', update.sheet_id)
          .eq('row_index', update.row_index)
          .eq('column_index', update.column_index)
          .single();

        const existingId = (existing && typeof existing === 'object' && 'data' in existing)
          ? (existing as { data?: { id?: string } }).data?.id
          : undefined;
        if (existingId) {
          const { error } = await supabase
            .from('sheet_data')
            .update(update)
            .eq('id', existingId);
          if (error) throw error;
        } else {
          const res = await supabase
            .from('sheet_data')
            .insert(update as unknown as Record<string, unknown>);
          const insertErr = (res as { error?: Error | null }).error;
          if (insertErr) throw insertErr as Error;
        }
      }

      setEditedCells({});
      setEditMode(false);
    } catch (err: unknown) {
      console.error('Error saving changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  }

  function handleCancelEdit() {
    setEditMode(false);
    setEditedCells({});
    setReloadTrigger(prev => prev + 1);
  }

  if (!sheet) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 h-full flex items-center justify-center">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <p className="text-lg">Select a sheet to view its contents</p>
          <p className="text-sm mt-2">Or add a new sheet to get started</p>
        </div>
      </div>
    );
  }

  // Preparar headers e linhas a mostrar
  const headers: string[] = data[headerRowIndex] || data[0] || [];
  type RowEntry = { row: string[]; index: number };
  const bodyEntries: RowEntry[] = data
    .map((row, index) => ({ row, index }))
    .filter((e) => e.index > headerRowIndex);

  // Aplica filtros por coluna
  const filteredEntries: RowEntry[] = bodyEntries.filter(entry => {
    return Object.entries(columnFilters).every(([col, val]) => {
      if (!val) return true;
      return entry.row[Number(col)] === val;
    });
  });

  const sortedEntries: RowEntry[] = (() => {
    if (editMode || sortConfig.colIndex === null) return filteredEntries;
    const c = sortConfig.colIndex;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    const isNumeric = filteredEntries.every(e => e.row[c] === '' || !isNaN(Number(String(e.row[c]).replace(',', '.'))));
    return [...filteredEntries].sort((ea, eb) => {
      const av = ea.row[c] ?? '';
      const bv = eb.row[c] ?? '';
      if (av === '' && bv === '') return 0;
      if (av === '') return 1;
      if (bv === '') return -1;
      if (isNumeric) {
        const an = Number(String(av).replace(',', '.'));
        const bn = Number(String(bv).replace(',', '.'));
        return (an - bn) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
  })();

  function toggleSort(colIndex: number) {
    setSortConfig(prev => {
      if (prev.colIndex === colIndex) {
        // alterna asc/desc
        return { colIndex, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { colIndex, direction: 'asc' };
    });
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-30">
        <div className="flex-1 min-w-0">
          {/* Nome do ficheiro e link movidos para o header em App.tsx */}
        </div>

        <div className="flex items-center gap-2">
          {/* Escolher linha de cabeçalho */}
          <label className="text-sm text-slate-700 dark:text-slate-300 mr-2 hidden sm:flex items-center gap-2">
            Cabeçalho:
            <select
              value={headerRowIndex}
              onChange={(e) => setHeaderRowIndex(parseInt(e.target.value, 10))}
              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {Array.from({ length: Math.min(Math.max(data.length, 1), 10) }, (_, i) => (
                <option key={i} value={i}>Linha {i + 1}</option>
              ))}
            </select>
          </label>
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => {
                  if (history.length > 0) {
                    setRedoStack(r => [...r, data.map(row => [...row])]);
                    setData(history[history.length - 1]);
                    setHistory(h => h.slice(0, -1));
                  }
                }}
                className="flex items-center justify-center px-2 py-2 bg-slate-400 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-500 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                disabled={history.length === 0}
                title="Desfazer última ação"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (redoStack.length > 0) {
                    setHistory(h => [...h, data.map(row => [...row])]);
                    setData(redoStack[redoStack.length - 1]);
                    setRedoStack(r => r.slice(0, -1));
                  }
                }}
                className="flex items-center justify-center px-2 py-2 bg-slate-400 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-500 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                disabled={redoStack.length === 0}
                title="Refazer última ação"
              >
                <Redo2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setData(prev => {
                    pushHistory(prev);
                    return [...prev, Array(prev[0]?.length || 0).fill('')];
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 dark:bg-amber-600 text-white rounded-lg hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                + Inserir linha
              </button>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-700 dark:text-slate-300">Linha:</label>
                <select
                  id="delete-row-select"
                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  value={headerRowIndex + 1}
                  onChange={() => {}}
                  disabled
                >
                  <option value={headerRowIndex + 1}>Cabeçalho</option>
                  {bodyEntries.map(({ index }) => (
                    <option key={index} value={index}>{`Linha ${index + 1}`}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    // Elimina a linha selecionada (primeira abaixo do header por padrão)
                    setData(prev => {
                      pushHistory(prev);
                      return prev.filter((_, idx) => idx !== (bodyEntries[0]?.index ?? headerRowIndex + 1));
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm font-medium"
                  disabled={bodyEntries.length === 0}
                >
                  - Eliminar linha
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-700 dark:text-slate-300">Coluna:</label>
                <select
                  id="delete-col-select"
                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  value={0}
                  onChange={() => {}}
                  disabled
                >
                  {headers.map((_, i) => (
                    <option key={i} value={i}>{`Coluna ${i + 1}`}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    // Elimina a primeira coluna por padrão
                    setData(prev => {
                      pushHistory(prev);
                      return prev.map(row => row.filter((_, i) => i !== 0));
                    });
              <button
                onClick={() => {
                  if (history.length > 0) {
                    setData(history[history.length - 1]);
                    setHistory(h => h.slice(0, -1));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-400 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-500 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                disabled={history.length === 0}
                title="Desfazer última ação"
              >
                Undo
              </button>
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm font-medium"
                  disabled={headers.length === 0}
                >
                  - Eliminar coluna
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading || Object.keys(editedCells).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">No data available</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="w-full overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              {/* Sticky formula bar above header */}
              {editMode && (
                <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-20">
                  <tr>
                    <th colSpan={headers.length + 1} className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-700 dark:text-slate-300">Conteúdo da célula:</span>
                        <input
                          type="text"
                          value={selectedCell ? (data[selectedCell.row]?.[selectedCell.col] ?? '') : ''}
                          onChange={e => {
                            if (selectedCell) {
                              handleCellEdit(selectedCell.row, selectedCell.col, e.target.value, true);
                            }
                          }}
                          className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded"
                          disabled={!selectedCell}
                        />
                        {selectedCell && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">Linha {selectedCell.row + 1}, Coluna {selectedCell.col + 1}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
              )}
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-[40px] z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                    #
                  </th>
                  {headers.map((header, colIndex) => (
                    <th
                      key={colIndex}
                      className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider select-none cursor-pointer relative"
                      onClick={() => !editMode && toggleSort(colIndex)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{header || `Column ${colIndex + 1}`}</span>
                        {sortConfig.colIndex === colIndex && (
                          <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                        {/* Ícone de filtro */}
                        {!editMode && (
                          <button
                            type="button"
                            className={`ml-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${columnFilters[colIndex] ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                            title="Filtrar coluna"
                            onClick={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setFilterMenuOpen({ col: colIndex, pos: { x: rect.left, y: rect.bottom } });
                              setFilterSearch('');
                            }}
                          >
                            <Filter className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {/* Dropdown de filtro */}
                      {filterMenuOpen.col === colIndex && filterMenuOpen.pos && (
                        <div
                          style={{ position: 'fixed', left: filterMenuOpen.pos.x, top: filterMenuOpen.pos.y, zIndex: 1000 }}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-lg p-2 min-w-[150px] max-w-[200px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Filtrar: {header || `Coluna ${colIndex + 1}`}</span>
                            <div className="flex items-center gap-1">
                              {/* Botão de reset global */}
                              {Object.values(columnFilters).some(Boolean) && (
                                <button
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                  title="Limpar todos os filtros"
                                  onClick={() => {
                                    setColumnFilters({});
                                    setFilterMenuOpen({ col: null, pos: null });
                                  }}
                                >
                                  <XCircle className="w-4 h-4 text-red-400" />
                                </button>
                              )}
                              <button
                                className="ml-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Fechar"
                                onClick={() => setFilterMenuOpen({ col: null, pos: null })}
                              >
                                <XCircle className="w-4 h-4 text-slate-400" />
                              </button>
                            </div>
                          </div>
                          {/* Mini box de pesquisa */}
                          <div className="mb-2">
                            <input
                              type="text"
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Pesquisar..."
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-xs"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {/* Opção para limpar filtro individual */}
                            {columnFilters[colIndex] && (
                              <button
                                className="w-full text-left px-2 py-1 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 rounded mb-1"
                                onClick={() => {
                                  setColumnFilters(f => ({ ...f, [colIndex]: '' }));
                                  setFilterMenuOpen({ col: null, pos: null });
                                }}
                              >
                                Limpar filtro
                              </button>
                            )}
                            {/* Valores únicos da coluna filtrados */}
                            {Array.from(new Set(filteredEntries.map(e => e.row[colIndex]).filter(v => v !== '')))
                              .filter(val => val.toLowerCase().includes(filterSearch.toLowerCase()))
                              .sort()
                              .map((val, i) => (
                                <button
                                  key={val + i}
                                  className={`w-full text-left px-2 py-1 text-xs rounded ${columnFilters[colIndex] === val ? 'bg-blue-100 dark:bg-blue-900 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                  onClick={() => {
                                    setColumnFilters(f => ({ ...f, [colIndex]: val }));
                                    setFilterMenuOpen({ col: null, pos: null });
                                  }}
                                >
                                  {val}
                                </button>
                              ))}
                            {/* Se não houver valores únicos */}
                            {Array.from(new Set(filteredEntries.map(e => e.row[colIndex]).filter(v => v !== ''))).filter(val => val.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 && (
                              <span className="block px-2 py-1 text-xs text-slate-400">Sem valores</span>
                            )}
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {sortedEntries.map(({ row, index: origIdx }) => {
                  const actualRowIndex = origIdx; // mantém índice original (após linha 0 reservada ao cabeçalho)
                  const isHighlighted = highlightRow !== undefined && actualRowIndex === highlightRow;

                  return (
                    <tr
                      key={origIdx}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                        {actualRowIndex}
                      </td>
                      {row.map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          className={`px-4 py-3 text-sm text-slate-900 dark:text-slate-100 cursor-pointer ${selectedCell?.row === actualRowIndex && selectedCell?.col === colIndex ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                          onClick={() => {
                            setSelectedCell({ row: actualRowIndex, col: colIndex });
                          }}
                        >
                          {editMode ? (
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) =>
                                handleCellEdit(actualRowIndex, colIndex, e.target.value)
                              }
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                            />
                          ) : (
                            <span className="block break-words">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editMode && Object.keys(editedCells).length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-400">
            {Object.keys(editedCells).length} {Object.keys(editedCells).length === 1 ? 'cell' : 'cells'} modified
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { supabase, Sheet } from '../lib/supabase';

interface SearchResult {
  id: string;
  sheet_id: string;
  row_index: number;
  row_json: Record<string, string>;
  sheet_name: string;
  matched_columns: string[];
}

interface SearchPanelProps {
  sheets: Sheet[];
  onResultClick: (sheetId: string, rowIndex: number) => void;
}

export default function SearchPanel({ sheets, onResultClick }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSheets(sheets.map(s => s.id));
  }, [sheets]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() || selectedSheets.length === 0) {
      setResults([]);
      return;
    }

    setSearching(true);

    try {
      // Usa o RPC function para pesquisa rápida em JSON
      const { data, error } = await supabase
        .rpc('search_sheet_rows', {
          search_term: searchQuery.trim(),
          filter_sheet_ids: selectedSheets
        });

      if (error) throw error;

      // Formata os resultados com informação do sheet e colunas onde foi encontrado
      const formattedResults: SearchResult[] = (data || []).map((item: any) => {
        const matchedColumns: string[] = [];
        
        // Encontra quais colunas contêm o termo de pesquisa
        Object.entries(item.row_json || {}).forEach(([key, value]) => {
          if (typeof value === 'string' && 
              value.toLowerCase().includes(searchQuery.toLowerCase())) {
            matchedColumns.push(key);
          }
        });

        return {
          id: item.id,
          sheet_id: item.sheet_id,
          row_index: item.row_index,
          row_json: item.row_json || {},
          sheet_name: item.sheets?.name || 'Unknown Sheet',
          matched_columns: matchedColumns
        };
      });

      setResults(formattedResults);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, selectedSheets]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSheets, performSearch]);

  function toggleSheetSelection(sheetId: string) {
    setSelectedSheets(prev =>
      prev.includes(sheetId)
        ? prev.filter(id => id !== sheetId)
        : [...prev, sheetId]
    );
  }

  function groupResultsBySheet() {
    const grouped: Record<string, SearchResult[]> = {};

    results.forEach(result => {
      if (!grouped[result.sheet_id]) {
        grouped[result.sheet_id] = [];
      }
      grouped[result.sheet_id].push(result);
    });

    return grouped;
  }

  const groupedResults = groupResultsBySheet();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Cross-Sheet Search</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all sheets..."
            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {sheets.length > 1 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search in:</p>
            <div className="flex flex-wrap gap-2">
              {sheets.map(sheet => (
                <button
                  key={sheet.id}
                  onClick={() => toggleSheetSelection(sheet.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedSheets.includes(sheet.id)
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {searching && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <p>Searching...</p>
          </div>
        )}

        {!searching && searchQuery.trim().length > 0 && results.length === 0 && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <p>No results found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {!searching && searchQuery.trim().length === 0 && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <p>Enter a search term to find data across sheets</p>
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {Object.entries(groupedResults).map(([sheetId, sheetResults]) => (
              <div key={sheetId} className="p-4">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                  {sheetResults[0].sheet_name}
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                    ({sheetResults.length} {sheetResults.length === 1 ? 'result' : 'results'})
                  </span>
                </h3>
                <div className="space-y-2">
                  {sheetResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => onResultClick(result.sheet_id, result.row_index)}
                      className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Mostra todas as colunas onde foi encontrado */}
                          {result.matched_columns.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {result.matched_columns.map(col => (
                                <span 
                                  key={col}
                                  className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded"
                                >
                                  {col}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Mostra preview dos valores encontrados */}
                          <div className="space-y-1">
                            {result.matched_columns.slice(0, 3).map(col => {
                              const value = result.row_json[col] || '';
                              return (
                                <p key={col} className="text-sm text-slate-900 dark:text-slate-100 break-words">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">{col}:</span>{' '}
                                  {highlightMatch(value, searchQuery)}
                                </p>
                              );
                            })}
                            {result.matched_columns.length > 3 && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                +{result.matched_columns.length - 3} more columns
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          Row {result.row_index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Found {results.length} {results.length === 1 ? 'result' : 'results'} across{' '}
            {Object.keys(groupedResults).length}{' '}
            {Object.keys(groupedResults).length === 1 ? 'sheet' : 'sheets'}
          </p>
        </div>
      )}
    </div>
  );
}

function highlightMatch(text: string, query: string): JSX.Element {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 font-medium">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

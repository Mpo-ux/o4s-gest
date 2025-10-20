import { useState, useEffect } from 'react';
import { Plus, Trash2, FolderOpen } from 'lucide-react';
import { supabase, Sheet } from '../lib/supabase';
import { extractSheetId, fetchSheetData, getSheetNames, getSpreadsheetTitle } from '../lib/googleSheets';
import { useAuth } from '../contexts/useAuth';
import { useGooglePicker } from '../lib/useGooglePicker';

interface SheetManagerProps {
  onSheetSelect: (sheet: Sheet) => void;
  selectedSheetId?: string;
}

interface SheetInsertPayload {
  user_id: string;
  name: string;
  sheet_url: string;
  sheet_id: string;
  google_access_token?: string;
  google_refresh_token?: string;
}

export default function SheetManager({ onSheetSelect, selectedSheetId }: SheetManagerProps) {
  const { user } = useAuth();
  const { openPicker, isReady: pickerReady } = useGooglePicker();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string | undefined>(undefined);
  const [fetchingSheetNames, setFetchingSheetNames] = useState(false);

  useEffect(() => {
    loadSheets();
  }, []);

  // Ligações ao menu hambúrguer no topo
  useEffect(() => {
    function onOpenPicker() {
      if (pickerReady) {
        openPicker(handlePickerSelect);
      } else {
        // Fallback: abrir o formulário de URL se o picker não estiver pronto
        setShowAddForm(true);
        setError('Google Picker não disponível para contas de teste. Use o formulário de URL abaixo para adicionar folhas partilhadas publicamente.');
      }
    }
    function onToggleUrl() {
      setShowAddForm(v => !v);
    }
    window.addEventListener('app:open-picker', onOpenPicker);
    window.addEventListener('app:toggle-url', onToggleUrl);
    return () => {
      window.removeEventListener('app:open-picker', onOpenPicker);
      window.removeEventListener('app:toggle-url', onToggleUrl);
    };
  }, [pickerReady, openPicker]);

  async function loadSheets() {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('*')
        .order('created_at', { ascending: false });

  if (error) throw error;
  setSheets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading sheets:', err);
      setError('Failed to load sheets');
    }
  }

  async function handleAddSheet() {
    if (!newSheetUrl.trim()) {
      setError('Por favor introduza o URL da folha');
      return;
    }

    const sheetId = extractSheetId(newSheetUrl);
    if (!sheetId) {
      setError('Invalid Google Sheets URL');
      return;
    }


    if (!selectedSheetName || typeof selectedSheetName !== 'string') {
      setError('Por favor selecione uma aba para importar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!user) {
        setError('You must be logged in to add sheets');
        return;
      }

      // obter token e título da spreadsheet (nome do documento)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.provider_token;

      let spreadsheetTitle = newSheetName;
      try {
        if (accessToken) {
          spreadsheetTitle = await getSpreadsheetTitle(sheetId, accessToken);
        }
      } catch {
        // mantém fallback se não conseguir obter o título
      }

      // payload para inserir
      const insertPayload: SheetInsertPayload = {
        user_id: user.id,
        name: spreadsheetTitle || 'Sem título',
        sheet_url: newSheetUrl,
        sheet_id: sheetId,
      };

      if (accessToken) {
        insertPayload.google_access_token = accessToken;
      }

      const { data: insertedSheet, error: insertError } = await supabase
        .from('sheets')
        .insert(insertPayload as unknown as Record<string, unknown>)
        .select()
        .single();

      if (insertError) throw insertError;
      const data = insertedSheet as Sheet;

      // fetch and persist headers (first row) when possible
  const tabName = selectedSheetName || undefined;
      const rows = await fetchSheetData(sheetId, accessToken || undefined, tabName);
      const headers = rows[0] || [];

      await supabase
        .from('sheets')
        .update({ headers })
        .eq('id', data.id);

  await syncSheetData({ ...data, sheet_id: sheetId }, tabName);
      setSheets([data, ...sheets]);
  setNewSheetName('');
      setNewSheetUrl('');
      setSheetNames([]);
      setSelectedSheetName('');
      setShowAddForm(false);
    } catch (err: unknown) {
      console.error('Error adding sheet:', err);
      setError(err instanceof Error ? err.message : 'Failed to add sheet');
    } finally {
      setLoading(false);
    }
  }

  async function syncSheetData(sheet: Sheet, sheetName?: string) {
    try {
      // Attempt to use stored token for private sheets if available
      const { data: sheetRecord } = await supabase
        .from('sheets')
        .select('google_access_token')
        .eq('id', sheet.id)
        .single();

  const accessToken = (sheetRecord as { google_access_token?: string } | null)?.google_access_token;

      const rows = await fetchSheetData(sheet.sheet_id, accessToken, sheetName);
      if (rows.length === 0) return;

      // delete previous cache for the sheet (both models)
      await supabase.from('sheet_data').delete().eq('sheet_id', sheet.id);
      await supabase.from('sheet_rows').delete().eq('sheet_id', sheet.id);

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Build cell rows in batches to avoid payload limits
      const batchSize = 800; // number of cell records per batch (tune as needed)
      const allCells = dataRows.flatMap((row, rowIndex) =>
        row.map((cellValue, colIndex) => ({
          sheet_id: sheet.id,
          row_index: rowIndex + 1,
          column_index: colIndex,
          column_name: headers[colIndex] || `Column ${colIndex}`,
          cell_value: cellValue || '',
        }))
      );

      for (let i = 0; i < allCells.length; i += batchSize) {
        const chunk = allCells.slice(i, i + batchSize);
        const res = await supabase.from('sheet_data').insert(
          chunk as unknown as Record<string, unknown>[]
        );
        const resErr = (res as { error: Error | null }).error;
        if (resErr) throw resErr;
      }

      // Also insert as JSON per-row into sheet_rows for better performance on large sheets
      const rowBatchSize = 200; // rows per batch
      const rowRecords = dataRows.map((row, idx) => {
        const rowIndex = idx + 1;
        const obj: Record<string, string> = {};
        for (let c = 0; c < row.length; c++) {
          const key = headers[c] || `Column ${c}`;
          obj[key] = row[c] || '';
        }

        return {
          sheet_id: sheet.id,
          row_index: rowIndex,
          row_array: row,
          row_json: obj,
        };
      });

      for (let i = 0; i < rowRecords.length; i += rowBatchSize) {
        const chunk = rowRecords.slice(i, i + rowBatchSize);
        const res = await supabase.from('sheet_rows').insert(
          chunk as unknown as Record<string, unknown>[]
        );
        const resErr = (res as { error: Error | null }).error;
        if (resErr) throw resErr;
      }
    } catch (err) {
      console.error('Error syncing sheet data:', err);
      throw err;
    }
  }

  async function handleDeleteSheet(sheetId: string) {
    setDeleteTarget(sheetId);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from('sheets')
        .delete()
        .eq('id', deleteTarget);

      if (error) throw error;
      setSheets(sheets.filter(s => s.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete sheet');
    }
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }
  
  // Handler para quando utilizador seleciona um ficheiro no Google Picker
  async function handlePickerSelect(file: { id: string; name: string; url: string }) {
    setNewSheetName(file.name);
    setNewSheetUrl(file.url);
    setError('');
    
    // Automaticamente buscar as abas
    setFetchingSheetNames(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.provider_token;
      if (!accessToken) {
        setError('You must be logged in to fetch sheet names');
        setFetchingSheetNames(false);
        return;
      }
      const names = await getSheetNames(file.id, accessToken);
      setSheetNames(names);
      if (names.length > 0) setSelectedSheetName(names[0]);
    } catch (err: unknown) {
      setError('Failed to fetch sheet names: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setFetchingSheetNames(false);
    }
  }
  
  // Quando o utilizador insere o URL, tenta buscar as abas disponíveis
  async function handleFetchSheetNames() {
    setSheetNames([]);
    setSelectedSheetName('');
    setError('');
    setFetchingSheetNames(true);
    try {
      const sheetId = extractSheetId(newSheetUrl);
      if (!sheetId) {
        setError('Invalid Google Sheets URL');
        setFetchingSheetNames(false);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.provider_token;
      if (!accessToken) {
        setError('You must be logged in to fetch sheet names');
        setFetchingSheetNames(false);
        return;
      }
      const names = await getSheetNames(sheetId, accessToken);
      setSheetNames(names);
      if (names.length > 0) setSelectedSheetName(names[0]);
    } catch (err: unknown) {
      setError('Failed to fetch sheet names: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setFetchingSheetNames(false);
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Documentos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
            title="Obter por URL"
          >
            <Plus className="w-4 h-4" />
            Obter por URL
          </button>
          <button
            type="button"
            onClick={() => {
              if (pickerReady) {
                openPicker(handlePickerSelect);
              } else {
                setShowAddForm(true);
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium"
            title="Escolher do Drive"
          >
            <FolderOpen className="w-4 h-4" />
            Escolher do Drive
          </button>
          {!pickerReady && (
            <span className="text-xs text-amber-600 dark:text-amber-400 ml-1" title="Google Picker pode não funcionar para contas de teste devido a limitações OAuth.">
              Dica: para testers, use "Obter por URL" com folhas partilhadas publicamente.
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="space-y-3">
            <div className="flex gap-2">
              {/* Picker removido do formulário de adição */}
              <div className="flex-1 text-sm text-slate-600 dark:text-slate-400 flex items-center">
                Selecione uma folha do seu Google Drive
              </div>
            </div>
            {!pickerReady && (
              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                <div className="font-semibold mb-1">Google Picker não disponível</div>
                <div className="space-y-1">
                  <p>Para contas de teste, o Google Picker pode não funcionar devido a limitações de OAuth.</p>
                  <p><strong>Solução:</strong> Partilhe a folha publicamente e use o URL abaixo:</p>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>No Google Sheets, clique em "Partilhar" → "Alterar para qualquer pessoa com o link"</li>
                    <li>Copie o URL e cole aqui</li>
                  </ol>
                </div>
              </div>
            )}
            {/* Campo de nome removido; será preenchido automaticamente pelo título da spreadsheet */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL da folha
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSheetUrl}
                  onChange={(e) => setNewSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={handleFetchSheetNames}
                  disabled={fetchingSheetNames || !newSheetUrl.trim()}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium disabled:opacity-50"
                >
                  {fetchingSheetNames ? 'A carregar...' : 'Listar abas'}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                <strong>Para testers:</strong> Partilhe a folha publicamente (qualquer pessoa com o link pode ver). Para utilizadores autorizados: a app usará o token Google para aceder a folhas privadas.
              </p>
            </div>
            {sheetNames.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selecionar aba</label>
                <select
                  value={selectedSheetName}
                  onChange={e => setSelectedSheetName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  {sheetNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAddSheet}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {loading ? 'A adicionar...' : 'Importar'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewSheetName('');
                  setNewSheetUrl('');
                  setSheetNames([]);
                  setSelectedSheetName('');
                  setError('');
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {sheets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <p>No sheets added yet</p>
            <p className="text-sm mt-1">Click "Add Sheet" to get started</p>
          </div>
        ) : (
          sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                selectedSheetId === sheet.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => onSheetSelect(sheet)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {sheet.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Added {new Date(sheet.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSheet(sheet.id);
                    }}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Delete sheet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 dark:bg-opacity-60">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Confirm delete</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Are you sure you want to delete this sheet? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

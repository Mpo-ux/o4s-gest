import { useState, useEffect } from 'react';
import { LogOut, Moon, Sun, Menu } from 'lucide-react';
import logoC4S from './assets/logo-c4s.png';
import SheetManager from './components/SheetManager';
import SheetViewer from './components/SheetViewer';
import SearchPanel from './components/SearchPanel';
import LoginPage from './components/LoginPage';
import { Sheet, supabase } from './lib/supabase';
import { useAuth } from './contexts/useAuth';
import { useTheme } from './contexts/ThemeContext';

function App() {
  const [activeTab, setActiveTab] = useState<'documentos' | 'pesquisa'>('documentos');
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [highlightRow, setHighlightRow] = useState<number | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadSheets();
    }
  }, [user]);

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
    }
  }

  function handleSheetSelect(sheet: Sheet) {
    setSelectedSheet(sheet);
    setHighlightRow(undefined);
  }

  function handleSearchResultClick(sheetId: string, rowIndex: number) {
    const sheet = sheets.find(s => s.id === sheetId);
    if (sheet) {
      setSelectedSheet(sheet);
      setHighlightRow(rowIndex);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setSheets([]);
      setSelectedSheet(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-300">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between relative">
          {/* Esquerda: menu hambúrguer, logo e nome */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              {menuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      window.dispatchEvent(new Event('app:open-picker'));
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Escolher do Drive
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      window.dispatchEvent(new Event('app:toggle-url'));
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Obter por URL
                  </button>
                </div>
              )}
            </div>
            <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
              <img src={logoC4S} alt="O4S Logo" className="w-10 h-10 object-contain" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-white font-bold text-xl">O4S</span>'); }} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">O4S gest</h1>
          </div>
          {/* Direita: perfil, logout, tema */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar for app interaction buttons (future expansion) */}
      {/* Toolbar removida para evitar duplicação de menu e toggle */}

      <main className="max-w-[1800px] mx-auto px-6 py-6">
      {/* Tabs de navegação */}
      <div className="mb-6 flex gap-2">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${activeTab === 'documentos' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
          onClick={() => setActiveTab('documentos')}
        >
          Documentos
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${activeTab === 'pesquisa' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
          onClick={() => setActiveTab('pesquisa')}
        >
          Pesquisa
        </button>
      </div>
        {/* Main content area, table below toolbar */}
        <div className="pb-8">
          {activeTab === 'documentos' && (
            <ResizableSplit
              left={
                <SheetManager
                  onSheetSelect={handleSheetSelect}
                  selectedSheetId={selectedSheet?.id}
                />
              }
              right={<SheetViewer sheet={selectedSheet} highlightRow={highlightRow} />}
            />
          )}
          {activeTab === 'pesquisa' && (
            <div className="col-span-4 overflow-hidden">
              <SearchPanel
                sheets={sheets}
                onResultClick={handleSearchResultClick}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

// Simple vertical resizable split component with persistent left width
import { useRef } from 'react';
function ResizableSplit({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = localStorage.getItem('split:leftWidth');
    return saved ? Number(saved) : 360; // default px
  });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem('split:leftWidth', String(leftWidth));
  }, [leftWidth]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const min = 240; // min px
      const max = rect.width - 320; // leave space for right
      const next = Math.max(min, Math.min(e.clientX - rect.left, max));
      setLeftWidth(next);
    }
    function onUp() { setDragging(false); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  return (
    <div ref={containerRef} className="w-full flex" style={{ minHeight: '100vh' }}>
      <div style={{ width: leftWidth }} className="pr-3 shrink-0">
        <div className="sticky top-0 max-h-screen overflow-auto">
          {left}
        </div>
      </div>
      <div
        className={`w-1 cursor-col-resize bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 shrink-0 ${dragging ? 'opacity-80' : ''}`}
        onMouseDown={() => setDragging(true)}
        title="Arraste para ajustar a largura"
      />
      <div className="flex-1 pl-3 min-w-0">
        {right}
      </div>
    </div>
  );
}

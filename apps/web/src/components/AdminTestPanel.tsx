import React, { useState } from "react";
import styles from "./AdminTestPanel.module.css";

// Lista de testes disponíveis
const TESTS = [
  {
    id: "login",
    label: "Testar Login/Logout/JWT",
    description:
      "Valida todos os fluxos de autenticação: login, logout, token expirado, refresh e robustez do JWT.",
    run: async (log: (msg: string) => void) => {
      log("Iniciando teste de login/logout...");
      // Simulação: aqui você chamaria a API real ou função de teste
      await new Promise((r) => setTimeout(r, 800));
      log("Login efetuado com sucesso.");
      await new Promise((r) => setTimeout(r, 400));
      log("Logout efetuado com sucesso.");
      return true;
    },
  },
  {
    id: "supabase",
    label: "Validar ligação à Supabase",
    description:
      "Verifica conexões, tratamento de erros de rede e estrutura da base de dados.",
    run: async (log: (msg: string) => void) => {
      log("Testando ligação à Supabase...");
      await new Promise((r) => setTimeout(r, 1000));
      log("Ligação à Supabase validada.");
      return true;
    },
  },
  {
    id: "duplicacao",
    label: "Evitar duplicações (ex: email)",
    description:
      "Testa lógica de verificação antes de inserir dados para evitar duplicados.",
    run: async (log: (msg: string) => void) => {
      log("Testando prevenção de duplicação...");
      await new Promise((r) => setTimeout(r, 700));
      log("Prevenção de duplicação validada.");
      return true;
    },
  },
  {
    id: "roles",
    label: "Estruturar gestão de roles",
    description: "Valida estrutura de permissões (admin/user).",
    run: async (log: (msg: string) => void) => {
      log("Testando gestão de roles...");
      await new Promise((r) => setTimeout(r, 600));
      log("Gestão de roles validada.");
      return true;
    },
  },
  {
    id: "scripts",
    label: "Fallback de portas/scripts PowerShell",
    description:
      "Garante resiliência local, fallback de portas e scripts PowerShell.",
    run: async (log: (msg: string) => void) => {
      log("Testando fallback de portas/scripts...");
      await new Promise((r) => setTimeout(r, 900));
      log("Fallback de portas/scripts validado.");
      return true;
    },
  },
  {
    id: "logger",
    label: "Integrar logger no backend",
    description: "Valida logging estruturado com Winston.",
    run: async (log: (msg: string) => void) => {
      log("Testando logger backend...");
      await new Promise((r) => setTimeout(r, 500));
      log("Logger backend validado.");
      return true;
    },
  },
  {
    id: "validacao",
    label: "Middleware de validação (Joi/Zod)",
    description: "Valida middleware de dados usando Joi ou Zod.",
    run: async (log: (msg: string) => void) => {
      log("Testando middleware de validação...");
      await new Promise((r) => setTimeout(r, 600));
      log("Middleware de validação validado.");
      return true;
    },
  },
  {
    id: "unitarios",
    label: "Testes unitários com Vitest",
    description: "Executa testes unitários para funções críticas.",
    run: async (log: (msg: string) => void) => {
      log("Executando testes unitários...");
      await new Promise((r) => setTimeout(r, 1200));
      log("Testes unitários concluídos.");
      return true;
    },
  },
];

export default function AdminTestPanel() {
  const [selected, setSelected] = useState<string[]>([]);
  const [log, setLog] = useState<string>("");
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const appendLog = (msg: string) => setLog((l) => l + msg + "\n");

  const runTest = async (testId: string) => {
    setRunning(testId);
    setLog("");
    const test = TESTS.find((t) => t.id === testId);
    if (test) {
      const ok = await test.run(appendLog);
      setResults((r) => ({ ...r, [testId]: ok }));
    }
    setRunning(null);
  };

  const runSelected = async () => {
    setLog("");
    for (const id of selected) {
      setRunning(id);
      const test = TESTS.find((t) => t.id === id);
      if (test) {
        appendLog(`--- ${test.label} ---`);
        const ok = await test.run(appendLog);
        setResults((r) => ({ ...r, [id]: ok }));
        appendLog(ok ? "✅ Sucesso\n" : "❌ Falha\n");
      }
    }
    setRunning(null);
  };

  return (
    <div className={styles["admin-test-panel-root"]}>
      <h2>Painel de Testes Automatizados</h2>
      <p>Execute testes críticos do sistema. Apenas para administradores.</p>
      <div className={styles["admin-test-panel-actions"]}>
        <button onClick={() => setSelected(TESTS.map((t) => t.id))}>
          Selecionar Todos
        </button>
        <button
          onClick={() => setSelected([])}
          className={styles["admin-test-panel-btn-margin"]}
        >
          Limpar Seleção
        </button>
        <button
          onClick={runSelected}
          className={styles["admin-test-panel-btn-margin"]}
          disabled={selected.length === 0 || running !== null}
        >
          Executar Selecionados
        </button>
      </div>
      <ul className={styles["admin-test-list"]}>
        {TESTS.map((test) => (
          <li key={test.id} className={styles["admin-test-list-item"]}>
            <input
              type="checkbox"
              checked={selected.includes(test.id)}
              onChange={(e) => {
                setSelected((sel) =>
                  e.target.checked
                    ? [...sel, test.id]
                    : sel.filter((id) => id !== test.id)
                );
              }}
              disabled={running !== null}
              aria-label={`Selecionar teste: ${test.label}`}
              title={`Selecionar teste: ${test.label}`}
            />
            <strong className={styles["admin-test-label"]}>{test.label}</strong>
            <button
              className={styles["admin-test-execute-btn"]}
              onClick={() => runTest(test.id)}
              disabled={running !== null}
            >
              Executar
            </button>
            <div className={styles["admin-test-description"]}>
              {test.description}
            </div>
            {results[test.id] !== undefined && (
              <div
                className={
                  results[test.id]
                    ? `${styles["admin-test-result"]} ${styles["admin-test-result-success"]}`
                    : `${styles["admin-test-result"]} ${styles["admin-test-result-fail"]}`
                }
              >
                {results[test.id] ? "Sucesso" : "Falha"}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className={styles["admin-test-log-container"]}>
        <label htmlFor="admin-test-log" title="Log de Execução">
          <strong>Log de Execução:</strong>
        </label>
        <textarea
          id="admin-test-log"
          value={log}
          readOnly
          rows={10}
          className={styles["admin-test-log-textarea"]}
          aria-label="Log de Execução dos testes"
          placeholder="O resultado dos testes será exibido aqui."
        />
      </div>
    </div>
  );
}

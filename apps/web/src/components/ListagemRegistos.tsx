import React, { useEffect, useState } from "react";

interface ListagemProps {
  type: "cliente" | "fornecedor";
}

const ListagemRegistos: React.FC<ListagemProps> = ({ type }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tentouCarregar, setTentouCarregar] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setTentouCarregar(true);
    fetch(`/api/import/list?type=${type}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
      })
      .catch((err) => setError("Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) return <div className="p-4">A carregar...</div>;
  if (error && tentouCarregar)
    return <div className="p-4 text-red-600">{error}</div>;
  if (!data.length && tentouCarregar && !loading && !error)
    return <div className="p-4">Nenhum registo encontrado.</div>;

  // Headers dinâmicos
  const headers = Object.keys(data[0] || {});

  return (
    <div className="overflow-x-auto border rounded bg-white mt-4">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            {headers.map((h) => (
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
          {data.map((row, idx) => (
            <tr key={idx}>
              {headers.map((h) => (
                <td key={h} className="p-2 border-b text-slate-800">
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListagemRegistos;

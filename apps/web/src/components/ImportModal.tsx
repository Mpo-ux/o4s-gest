import React, { useState } from 'react'
import { ImportedData, FileProcessor } from '../utils/fileProcessor'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  importedData: ImportedData | null
  type: 'cliente' | 'fornecedor'
  onConfirmImport: (data: Record<string, any>[]) => void
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  importedData,
  type,
  onConfirmImport
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [validation, setValidation] = useState<{
    valid: Record<string, any>[]
    invalid: { row: Record<string, any>, errors: string[] }[]
  } | null>(null)

  React.useEffect(() => {
    if (importedData) {
      const validationResult = FileProcessor.validateBusinessData(importedData.data, type)
      setValidation(validationResult)
      
      // Selecionar automaticamente as linhas válidas
      const validIndices = new Set<number>()
      importedData.data.forEach((row, index) => {
        const isValid = validationResult.valid.includes(row)
        if (isValid) {
          validIndices.add(index)
        }
      })
      setSelectedRows(validIndices)
    }
  }, [importedData, type])

  if (!isOpen || !importedData || !validation) return null

  const handleSelectAll = () => {
    if (selectedRows.size === validation.valid.length) {
      setSelectedRows(new Set())
    } else {
      const validIndices = new Set<number>()
      importedData.data.forEach((row, index) => {
        const isValid = validation.valid.includes(row)
        if (isValid) {
          validIndices.add(index)
        }
      })
      setSelectedRows(validIndices)
    }
  }

  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  const handleConfirm = () => {
    const selectedData = importedData.data.filter((_, index) => selectedRows.has(index))
    onConfirmImport(selectedData)
    onClose()
  }

  const getRowValidation = (row: Record<string, any>) => {
    const invalidRow = validation.invalid.find(inv => inv.row === row)
    return invalidRow ? invalidRow.errors : null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                Importar {type === 'cliente' ? 'Clientes' : 'Fornecedores'}
              </h2>
              <p className="text-blue-100 mt-1">
                {importedData.summary.totalRows} registos encontrados
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{validation.valid.length}</div>
              <div className="text-green-600">Registos Válidos</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{validation.invalid.length}</div>
              <div className="text-red-600">Com Erros</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{selectedRows.size}</div>
              <div className="text-blue-600">Selecionados</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Dados para Importar</h3>
            <div className="space-x-2">
              <button
                onClick={handleSelectAll}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
              >
                {selectedRows.size === validation.valid.length ? 'Desselecionar Todos' : 'Selecionar Válidos'}
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === validation.valid.length && validation.valid.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label="Selecionar todos os registos válidos"
                        title="Selecionar/Desselecionar todos"
                      />
                    </th>
                    <th className="p-3 text-left text-slate-700 font-medium">Status</th>
                    {importedData.headers.map(header => (
                      <th key={header} className="p-3 text-left text-slate-700 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importedData.data.map((row, index) => {
                    const errors = getRowValidation(row)
                    const isValid = !errors
                    const isSelected = selectedRows.has(index)

                    return (
                      <tr 
                        key={index} 
                        className={`border-b border-slate-100 hover:bg-slate-50 ${
                          !isValid ? 'bg-red-25' : ''
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRowSelect(index)}
                            disabled={!isValid}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            aria-label={`Selecionar linha ${index + 1}`}
                            title={`Selecionar registo ${index + 1}`}
                          />
                        </td>
                        <td className="p-3">
                          {isValid ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Válido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ⚠ Erro
                            </span>
                          )}
                        </td>
                        {importedData.headers.map(header => (
                          <td key={header} className="p-3 text-slate-700">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Details */}
          {validation.invalid.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-red-700 mb-3">Erros Encontrados</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validation.invalid.map((item, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-800">
                      Linha {importedData.data.indexOf(item.row) + 2}
                    </div>
                    <ul className="text-red-700 text-sm mt-1">
                      {item.errors.map((error, errorIndex) => (
                        <li key={errorIndex}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex justify-between items-center">
            <div className="text-slate-600">
              {selectedRows.size} de {validation.valid.length} registos válidos selecionados
            </div>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedRows.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Importar {selectedRows.size} Registos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
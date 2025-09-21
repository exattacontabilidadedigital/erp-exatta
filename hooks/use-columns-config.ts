"use client"

import { useState, useEffect } from "react"
import { DEFAULT_COLUMNS, type ColumnConfig } from "@/components/lancamentos/lancamentos-columns-config"

const STORAGE_KEY = "lancamentos-columns-config"

export function useColumnsConfig() {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedColumns = localStorage.getItem(STORAGE_KEY)
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns) as ColumnConfig[]
        // Validar se a estrutura está correta
        if (Array.isArray(parsedColumns) && parsedColumns.length > 0) {
          // Migração: garantir que todas as colunas padrão estejam presentes
          const migratedColumns = DEFAULT_COLUMNS.map(defaultCol => {
            const savedCol = parsedColumns.find(col => col.key === defaultCol.key)
            // Se a coluna não existe na configuração salva, usar a padrão
            return savedCol || defaultCol
          })
          
          // Verificar se houve mudanças para atualizar o localStorage
          if (migratedColumns.length !== parsedColumns.length || 
              migratedColumns.some((col, index) => !parsedColumns.find(saved => saved.key === col.key))) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedColumns))
            console.log("Configuração de colunas migrada com novas colunas:", migratedColumns)
          }
          
          setColumns(migratedColumns)
        } else {
          setColumns(DEFAULT_COLUMNS)
        }
      } catch (error) {
        console.error("Erro ao carregar configuração de colunas:", error)
        setColumns(DEFAULT_COLUMNS)
      }
    }
    setIsLoaded(true)
  }, [])

  // Atualizar configurações
  const updateColumns = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns))
  }

  // Resetar para configurações padrão
  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Verificar se uma coluna está visível
  const isColumnVisible = (columnKey: string): boolean => {
    const column = columns.find(col => col.key === columnKey)
    return column ? column.visible : true
  }

  // Contar colunas visíveis
  const getVisibleColumnsCount = (): number => {
    return columns.filter(col => col.visible).length
  }

  return {
    columns,
    updateColumns,
    resetColumns,
    isColumnVisible,
    getVisibleColumnsCount,
    isLoaded
  }
}

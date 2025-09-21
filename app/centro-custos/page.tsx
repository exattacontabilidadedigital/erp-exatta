"use client"
import { DepartamentosForm } from "@/components/departamentos/departamentos-form"
import { ResponsaveisForm } from "@/components/responsaveis/responsaveis-form"
import { TiposCentroCustosForm } from "@/components/tipos-centro-custos/tipos-centro-custos-form"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CentroCustosHeader } from "@/components/centro-custos/centro-custos-header"
import { BarChart3, TreePine, List } from "lucide-react"
import { CentroCustosList } from "@/components/centro-custos/centro-custos-list"
import { CentroCustosTree } from "@/components/centro-custos/centro-custos-tree"
import { CentroCustosResumo } from "@/components/centro-custos/centro-custos-resumo"
import { CentroCustosChart } from "@/components/centro-custos/centro-custos-chart"
import { CentroCustosModal } from "@/components/centro-custos/centro-custos-modal"
import { ImportCentroCustosModal } from "@/components/centro-custos/import-centro-custos-modal"
import { CentroCustosRelatorioModal } from "@/components/centro-custos/centro-custos-relatorio-modal"
import { CentroCustosAnaliseModal } from "@/components/centro-custos/centro-custos-analise-modal"
import { CentroCustosViewModal } from "@/components/centro-custos/centro-custos-view-modal"
import { CentroCustosDeleteModal } from "@/components/centro-custos/centro-custos-delete-modal"
import { CentroCustosRelatorioIndividualModal } from "@/components/centro-custos/centro-custos-relatorio-individual-modal"
import { useAuth } from "@/contexts/auth-context"


export default function CentroCustosPage() {
  const { userData } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDepartamentosModalOpen, setIsDepartamentosModalOpen] = useState(false)
  const [isResponsaveisModalOpen, setIsResponsaveisModalOpen] = useState(false)
  const [isTiposCentroCustosModalOpen, setIsTiposCentroCustosModalOpen] = useState(false)
  const [showChart, setShowChart] = useState(false); // Inicia contraído por padrão
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree'); // Novo estado para modo de visualização
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("centroCustosShowChart");
      setShowChart(stored === "true"); // Só expande se explicitamente salvo como true
    }
  }, []);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false)
  const [isAnaliseModalOpen, setIsAnaliseModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isRelatorioIndividualModalOpen, setIsRelatorioIndividualModalOpen] = useState(false)
  const [selectedCentro, setSelectedCentro] = useState<any>(null)

  const handleNovoCentro = () => {
    setIsModalOpen(true)
  }
  // Eventos para abrir modais de cadastro
  useEffect(() => {
    const openDepartamentos = () => setIsDepartamentosModalOpen(true)
    const openResponsaveis = () => setIsResponsaveisModalOpen(true)
    const openTipos = () => setIsTiposCentroCustosModalOpen(true)
    window.addEventListener("abrirModalDepartamentos", openDepartamentos)
    window.addEventListener("abrirModalResponsaveis", openResponsaveis)
    window.addEventListener("abrirModalTiposCentroCustos", openTipos)
    return () => {
      window.removeEventListener("abrirModalDepartamentos", openDepartamentos)
      window.removeEventListener("abrirModalResponsaveis", openResponsaveis)
      window.removeEventListener("abrirModalTiposCentroCustos", openTipos)
    }
  }, [])

  // Salva o estado do gráfico ao expandir/contrair
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("centroCustosShowChart", showChart.toString());
    }
  }, [showChart]);

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCentro(null)
  }

  const handleImportar = () => {
    setIsImportModalOpen(true)
  }

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false)
  }

  const handleExportar = () => {
    const csvData = [
      ["Código", "Nome", "Responsável", "Orçamento", "Gasto Atual", "Status", "Descrição"],
      ["001", "Administrativo", "João Silva", "R$ 50.000,00", "R$ 35.000,00", "Ativo", "Centro de custos administrativos"],
      ["002", "Vendas", "Maria Santos", "R$ 80.000,00", "R$ 72.000,00", "Ativo", "Centro de custos de vendas"],
      ["003", "Marketing", "Pedro Costa", "R$ 30.000,00", "R$ 28.500,00", "Ativo", "Centro de custos de marketing"],
      ["004", "Produção", "Ana Lima", "R$ 120.000,00", "R$ 95.000,00", "Ativo", "Centro de custos de produção"],
      ["005", "TI", "Carlos Oliveira", "R$ 60.000,00", "R$ 45.000,00", "Ativo", "Centro de custos de tecnologia"],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `centro_custos_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRelatorio = () => {
    setIsRelatorioModalOpen(true)
  }

  const handleCloseRelatorioModal = () => {
    setIsRelatorioModalOpen(false)
  }

  const handleAnalise = () => {
    setIsAnaliseModalOpen(true)
  }

  const handleCloseAnaliseModal = () => {
    setIsAnaliseModalOpen(false)
  }

  const handleVisualizarCentro = (centro: any) => {
    setSelectedCentro(centro)
    setIsViewModalOpen(true)
  }

  const handleEditarCentro = (centro: any) => {
    setSelectedCentro(centro)
    setIsEditModalOpen(true)
  }

  const handleExcluirCentro = (centro: any) => {
    setSelectedCentro(centro)
    setIsDeleteModalOpen(true)
  }

  const handleRelatorioCentro = (centro: any) => {
    setSelectedCentro(centro)
    setIsRelatorioIndividualModalOpen(true)
  }

  const handleAdicionarSubcentro = (centro: any) => {
    setSelectedCentro(centro)
    setIsModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedCentro(null)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedCentro(null)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedCentro(null)
  }

  const handleCloseRelatorioIndividualModal = () => {
    setIsRelatorioIndividualModalOpen(false)
    setSelectedCentro(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modais de cadastro */}
      {isDepartamentosModalOpen && (
        <Dialog open={isDepartamentosModalOpen} onOpenChange={() => setIsDepartamentosModalOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">Departamentos</DialogTitle>
            </DialogHeader>
            <DepartamentosForm />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDepartamentosModalOpen(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {isResponsaveisModalOpen && (
        <Dialog open={isResponsaveisModalOpen} onOpenChange={() => setIsResponsaveisModalOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">Responsáveis</DialogTitle>
            </DialogHeader>
            <ResponsaveisForm />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsResponsaveisModalOpen(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {isTiposCentroCustosModalOpen && (
        <Dialog open={isTiposCentroCustosModalOpen} onOpenChange={() => setIsTiposCentroCustosModalOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">Tipos de Centro de Custo</DialogTitle>
            </DialogHeader>
            <TiposCentroCustosForm />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsTiposCentroCustosModalOpen(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Menu Cadastros */}
      <nav className="bg-white shadow">
       
      </nav>
      <CentroCustosHeader
        onNovoCentro={handleNovoCentro}
        onImportar={handleImportar}
        onExportar={handleExportar}
        onRelatorio={handleRelatorio}
        onAnalise={handleAnalise}
      />

      <main className="container mx-auto px-4">
        {/* Resumo dos Centros de Custos */}
        <div className="pt-4 pb-6">
          <CentroCustosResumo />
        </div>

        {/* Ícone de exibir/ocultar gráfico de distribuição e seletor de modo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tree')}
              className="flex items-center gap-2"
            >
              <TreePine className="w-4 h-4" />
              Árvore
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Lista
            </Button>
          </div>
          <button
            className="p-2 rounded-full hover:bg-blue-100 focus:outline-none"
            title={showChart ? "Ocultar gráfico" : "Exibir gráfico"}
            onClick={() => {
              const newState = !showChart;
              setShowChart(newState);
              localStorage.setItem("centroCustosShowChart", newState.toString());
            }}
          >
            <BarChart3 className={`w-6 h-6 transition-colors ${showChart ? 'text-blue-600' : 'text-gray-400'}`} />
          </button>
        </div>
        {showChart && (
          <div className="mb-6">
            <CentroCustosChart />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 pb-6">
          {/* Visualização Condicional: Árvore ou Lista */}
          {viewMode === 'tree' ? (
            <CentroCustosTree
              onVisualizar={handleVisualizarCentro}
              onAdicionarSubcentro={handleAdicionarSubcentro}
              onEditar={handleEditarCentro}
              onExcluir={handleExcluirCentro}
              onRelatorio={handleRelatorioCentro}
            />
          ) : (
            <CentroCustosList
              onVisualizar={handleVisualizarCentro}
              onEditar={handleEditarCentro}
              onExcluir={handleExcluirCentro}
              onRelatorio={handleRelatorioCentro}
            />
          )}
        </div>
      </main>

      <CentroCustosModal isOpen={isModalOpen} onClose={handleCloseModal} centroPai={selectedCentro} />
      <ImportCentroCustosModal 
        open={isImportModalOpen} 
        onOpenChange={setIsImportModalOpen}
        empresaId={userData?.empresa_id || ''}
        onImportComplete={() => {
          // Atualiza a lista após importação
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("centroCustosAtualizado"));
          }
        }}
      />
      <CentroCustosRelatorioModal isOpen={isRelatorioModalOpen} onClose={handleCloseRelatorioModal} />
      <CentroCustosAnaliseModal isOpen={isAnaliseModalOpen} onClose={handleCloseAnaliseModal} />

      <CentroCustosViewModal isOpen={isViewModalOpen} onClose={handleCloseViewModal} centro={selectedCentro} />
      <CentroCustosModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        centroCusto={selectedCentro}
        isEditing={true}
      />
      <CentroCustosDeleteModal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} centro={selectedCentro} />
      <CentroCustosRelatorioIndividualModal
        isOpen={isRelatorioIndividualModalOpen}
        onClose={handleCloseRelatorioIndividualModal}
        centro={selectedCentro}
      />
    </div>
  )
}

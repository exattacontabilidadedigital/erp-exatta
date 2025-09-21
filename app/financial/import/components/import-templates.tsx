"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  Search,
  TestTube,
  Target,
  AlertCircle,
  Loader2,
  Save,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useImportTemplates } from "@/hooks/use-import-data";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase/client";

export function ImportTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [testPattern, setTestPattern] = useState("");
  const [testText, setTestText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para dados das tabelas relacionadas
  const [planoContas, setPlanoContas] = useState<any[]>([]);
  const [centroCustos, setCentroCustos] = useState<any[]>([]);
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);
  const [clientesFornecedores, setClientesFornecedores] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Hook do banco de dados real
  const { 
    templates, 
    loading, 
    error, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate,
    refetch 
  } = useImportTemplates();

  // Debug logs
  console.log('🎯 ImportTemplates Debug:', {
    templates,
    loading,
    error,
    templatesLength: templates?.length || 0,
    templatesData: templates
  });

  // Debug do useAuth
  const { userData } = useAuth();
  console.log('👤 Auth Debug:', {
    userData,
    empresaId: userData?.empresa_id,
    userId: userData?.id
  });

  // Função para buscar dados das tabelas relacionadas
  const fetchRelatedData = async () => {
    if (!userData?.empresa_id) return;

    setLoadingRelated(true);
    try {
      // Buscar plano de contas
      const { data: planos } = await supabase
        .from('plano_contas')
        .select('id, codigo, nome')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('codigo');

      // Buscar centro de custos
      const { data: centros } = await supabase
        .from('centro_custos')
        .select('id, codigo, nome')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('codigo');

      // Buscar contas bancárias
      const { data: contas } = await supabase
        .from('contas_bancarias')
        .select('id, agencia, conta, banco_id')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('agencia');

      // Buscar clientes/fornecedores
      const { data: clientesFor } = await supabase
        .from('clientes_fornecedores')
        .select('id, nome, tipo')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('nome');

      setPlanoContas(planos || []);
      setCentroCustos(centros || []);
      setContasBancarias(contas || []);
      setClientesFornecedores(clientesFor || []);
      
      console.log('🔧 Dados relacionais carregados:', {
        planoContas: planos?.length || 0,
        centroCustos: centros?.length || 0,
        contasBancarias: contas?.length || 0,
        clientesFornecedores: clientesFor?.length || 0
      });
    } catch (error) {
      console.error('Erro ao buscar dados relacionados:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Effect para buscar dados relacionados
  useEffect(() => {
    if (userData?.empresa_id) {
      fetchRelatedData();
    }
  }, [userData?.empresa_id]);

  // Debug forçado
  useEffect(() => {
    console.log('🔄 ImportTemplates useEffect executado');
    console.log('📊 Templates atuais:', templates);
    console.log('⏳ Loading:', loading);
    console.log('❌ Error:', error);
  }, [templates, loading, error]);

  // Formulário de template
  const [formData, setFormData] = useState({
    nome: "",
    descricao_padrao: "",
    regex_padrao: "",
    categoria: "",
    limite_confianca: 0.8,
    confirmacao_automatica: false,
    ativo: true,
    plano_conta_id: null as string | null,
    centro_custo_id: null as string | null,
    cliente_fornecedor_id: null as string | null,
    conta_bancaria_id: null as string | null
  });

  const filteredTemplates = templates.filter(template =>
    template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.descricao_padrao && template.descricao_padrao.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (template.categoria && template.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Debug filteredTemplates
  console.log('🔍 [ImportTemplates] Filtered Templates:', {
    searchTerm,
    originalTemplates: templates,
    filteredTemplates,
    filteredLength: filteredTemplates.length
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao_padrao: "",
      regex_padrao: "",
      categoria: "",
      limite_confianca: 0.8,
      confirmacao_automatica: false,
      ativo: true,
      plano_conta_id: null,
      centro_custo_id: null,
      cliente_fornecedor_id: null,
      conta_bancaria_id: null
    });
    setTestText("");
    setTestPattern("");
  };

  const handleOpenDialog = (template?: any) => {
    if (template) {
      console.log('🔧 Template sendo editado:', template);
      setEditingTemplate(template);
      setFormData({
        nome: template.nome || "",
        descricao_padrao: template.descricao_padrao || "",
        regex_padrao: template.regex_padrao || "",
        categoria: template.categoria || "",
        limite_confianca: template.limite_confianca || 0.8,
        confirmacao_automatica: template.confirmacao_automatica || false,
        ativo: template.ativo !== false,
        plano_conta_id: template.plano_conta_id || null,
        centro_custo_id: template.centro_custo_id || null,
        cliente_fornecedor_id: template.cliente_fornecedor_id || null,
        conta_bancaria_id: template.conta_bancaria_id || null
      });
      console.log('🔧 FormData após carregar template:', {
        plano_conta_id: template.plano_conta_id,
        centro_custo_id: template.centro_custo_id,
        cliente_fornecedor_id: template.cliente_fornecedor_id,
        conta_bancaria_id: template.conta_bancaria_id
      });
    } else {
      setEditingTemplate(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.descricao_padrao) {
      toast.error("Nome e descrição padrão são obrigatórios");
      return;
    }

    console.log('🔍 Dados do formulário antes de enviar:', formData);
    setIsSubmitting(true);

    try {
      let result;
      
      if (editingTemplate) {
        // Editar template existente
        result = await updateTemplate(editingTemplate.id, formData);
      } else {
        // Criar novo template
        result = await createTemplate(formData);
      }

      console.log('📝 Resultado da operação:', result);
      if (result.success) {
        toast.success(editingTemplate ? "Template atualizado com sucesso!" : "Template criado com sucesso!");
        handleCloseDialog();
        refetch(); // Atualizar lista
      } else {
        toast.error(result.error || "Erro ao salvar template");
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error("Erro inesperado ao salvar template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      const result = await deleteTemplate(id);
      
      if (result.success) {
        toast.success("Template excluído com sucesso!");
        refetch(); // Atualizar lista
      } else {
        toast.error(result.error || "Erro ao excluir template");
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error("Erro inesperado ao excluir template");
    }
  };

  const handleToggleActive = async (id: string, ativo: boolean) => {
    try {
      const result = await updateTemplate(id, { ativo: !ativo });
      
      if (result.success) {
        toast.success(`Template ${!ativo ? 'ativado' : 'desativado'} com sucesso!`);
        refetch(); // Atualizar lista
      } else {
        console.error('Erro detalhado:', result.error);
        toast.error(result.error || "Erro ao atualizar template");
      }
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro inesperado: ${errorMessage}`);
    }
  };

  const handleTestPattern = () => {
    const regexToTest = formData.regex_padrao || testPattern;
    
    if (!regexToTest || !testText) {
      toast.error("Informe o padrão e o texto para testar");
      return;
    }

    try {
      const regex = new RegExp(regexToTest, "i");
      const isMatch = regex.test(testText);
      
      toast.success(
        isMatch ? "✅ Padrão corresponde!" : "❌ Padrão não corresponde",
        {
          description: isMatch ? 
            `O texto "${testText}" foi encontrado pelo padrão "${regexToTest}"` : 
            `O texto "${testText}" não foi encontrado pelo padrão "${regexToTest}"`
        }
      );
    } catch (error) {
      toast.error("Regex inválido", {
        description: "Verifique a sintaxe do padrão regex"
      });
    }
  };

  const generateRegexFromPattern = () => {
    if (!formData.descricao_padrao) {
      toast.error("Informe o padrão primeiro");
      return;
    }

    try {
      // Divide o padrão por | para capturar alternativas
      const keywords = formData.descricao_padrao.split('|').map(k => k.trim());
      
      // Escapa caracteres especiais e cria regex
      const escapedKeywords = keywords.map(keyword => 
        keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      );
      
      // Cria regex que procura por qualquer uma das palavras-chave
      const generatedRegex = `.*(${escapedKeywords.join('|')}).*`;
      
      setFormData(prev => ({ ...prev, regex_padrao: generatedRegex }));
      
      toast.success("Regex gerado com sucesso!", {
        description: `Padrão gerado: ${generatedRegex}`
      });
    } catch (error) {
      toast.error("Erro ao gerar regex", {
        description: "Verifique o padrão informado"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates de Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando templates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates de Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <span className="ml-2">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Templates de Importação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cabeçalho com busca e novo template */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "Editar Template" : "Novo Template"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure padrões para classificação automática de lançamentos.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {/* Nome */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nome" className="text-right">
                      Nome *
                    </Label>
                    <Input
                      id="nome"
                      placeholder="Ex: PIX Recebimento"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>

                  {/* Descrição Padrão */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="descricao_padrao" className="text-right">
                      Padrão *
                    </Label>
                    <Input
                      id="descricao_padrao"
                      placeholder="Ex: PIX RECEBIDO"
                      value={formData.descricao_padrao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao_padrao: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>

                  {/* Regex */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="regex_padrao" className="text-right">
                      Regex
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="regex_padrao"
                          placeholder="Ex: .*(PIX|TED|DOC).*"
                          value={formData.regex_padrao}
                          onChange={(e) => setFormData(prev => ({ ...prev, regex_padrao: e.target.value }))}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateRegexFromPattern}
                          disabled={!formData.descricao_padrao}
                          title="Gerar regex automaticamente do padrão"
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.descricao_padrao && (
                        <div className="text-xs text-muted-foreground">
                          Padrão: {formData.descricao_padrao}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Categoria */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoria" className="text-right">
                      Categoria
                    </Label>
                    <Input
                      id="categoria"
                      placeholder="Ex: Vendas"
                      value={formData.categoria}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>

                  {/* Plano de Contas */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="plano_conta_id" className="text-right">
                      Plano de Contas
                    </Label>
                    <Select 
                      value={formData.plano_conta_id || "none"} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, plano_conta_id: value === "none" ? null : value }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o plano de contas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {planoContas.map((plano) => (
                          <SelectItem key={plano.id} value={plano.id}>
                            {plano.codigo} - {plano.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Centro de Custo */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="centro_custo_id" className="text-right">
                      Centro de Custo
                    </Label>
                    <Select 
                      value={formData.centro_custo_id || "none"} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, centro_custo_id: value === "none" ? null : value }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o centro de custo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {centroCustos.map((centro) => (
                          <SelectItem key={centro.id} value={centro.id}>
                            {centro.codigo} - {centro.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conta Bancária */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="conta_bancaria_id" className="text-right">
                      Conta Bancária
                    </Label>
                    <Select 
                      value={formData.conta_bancaria_id || "none"} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, conta_bancaria_id: value === "none" ? null : value }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a conta bancária" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {contasBancarias.map((conta) => (
                          <SelectItem key={conta.id} value={conta.id}>
                            Ag: {conta.agencia} - Conta: {conta.conta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cliente/Fornecedor */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cliente_fornecedor_id" className="text-right">
                      Cliente/Fornecedor
                    </Label>
                    <Select 
                      value={formData.cliente_fornecedor_id || "none"} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_fornecedor_id: value === "none" ? null : value }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione cliente/fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {clientesFornecedores.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome} ({cliente.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Limite Confiança */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="limite_confianca" className="text-right">
                      Confiança
                    </Label>
                    <Input
                      id="limite_confianca"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.limite_confianca}
                      onChange={(e) => setFormData(prev => ({ ...prev, limite_confianca: parseFloat(e.target.value) || 0 }))}
                      className="col-span-3"
                    />
                  </div>

                  {/* Confirmação Automática */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="confirmacao_automatica" className="text-right">
                      Auto Aprovação
                    </Label>
                    <div className="col-span-3">
                      <Switch
                        id="confirmacao_automatica"
                        checked={formData.confirmacao_automatica}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confirmacao_automatica: checked }))}
                      />
                    </div>
                  </div>

                  {/* Teste de Padrão */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar Padrão
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="test-text" className="text-sm text-muted-foreground">
                          Digite um texto para testar se o regex funciona:
                        </Label>
                        <Input
                          id="test-text"
                          placeholder="Ex: PIX TRANSFERENCIA BANCO XYZ"
                          value={testText}
                          onChange={(e) => setTestText(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTestPattern}
                          disabled={!testText || (!formData.regex_padrao && !testPattern)}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Testar
                        </Button>
                        
                        {/* Botões de exemplo */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTestText("PIX TRANSFERENCIA PARA JOAO")}
                          className="text-xs"
                        >
                          PIX
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTestText("PAGAMENTO FORNECEDOR ABC LTDA")}
                          className="text-xs"
                        >
                          Pagamento
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTestText("RECEBIMENTO CREDITO CLIENTE")}
                          className="text-xs"
                        >
                          Recebimento
                        </Button>
                      </div>
                      
                      {formData.regex_padrao && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <strong>Padrão atual:</strong> {formData.regex_padrao}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela de templates */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Confiança</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum template encontrado" : "Nenhum template cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.nome}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={template.descricao_padrao}>
                          {template.descricao_padrao}
                        </div>
                        {template.regex_padrao && (
                          <div className="text-xs text-muted-foreground truncate" title={template.regex_padrao}>
                            Regex: {template.regex_padrao}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.categoria && (
                          <Badge variant="outline">{template.categoria}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{Math.round((template.limite_confianca || 0.8) * 100)}%</span>
                          {template.confirmacao_automatica && (
                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={template.ativo ? "default" : "secondary"}
                          className={template.ativo ? "bg-green-100 text-green-800" : ""}
                        >
                          {template.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(template)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(template.id, template.ativo)}>
                              {template.ativo ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(template.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
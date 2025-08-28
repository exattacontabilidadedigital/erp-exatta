import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Play, Pause, RotateCcw, Download } from 'lucide-react';

interface BatchProcessingProps {
  bancoId?: string;
  dataInicio?: string;
  dataFim?: string;
  minimaConfianca?: number;
  onComplete?: (resultados: any) => void;
  onError?: (error: string) => void;
}

interface ProcessingResult {
  totalProcessed: number;
  successfulMatches: number;
  failedMatches: number;
  skippedItems: number;
  errors: string[];
  matches: any[];
}

export default function BatchProcessing({
  bancoId,
  dataInicio,
  dataFim,
  minimaConfianca = 0.8,
  onComplete,
  onError
}: BatchProcessingProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    minimaConfianca: minimaConfianca,
    autoConfirm: false,
    confirmarAlta: true,
    confirmarMedia: false,
    confirmarBaixa: false,
    batchSize: 50,
    delayBetweenBatches: 1000,
    maxRetries: 3
  });

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [logEntry, ...prev].slice(0, 100)); // Manter apenas os últimos 100 logs
  }, []);

  const processarLoteAutomatico = useCallback(async () => {
    if (!bancoId) {
      onError?.('Selecione uma conta bancária para processamento em lote');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    setProgress(0);
    setResults(null);
    setLogs([]);

    try {
      addLog('🚀 Iniciando processamento em lote...');
      setCurrentStep('Buscando sugestões de pareamento...');

      // 1. Buscar todas as sugestões
      const responseSugestoes = await fetch('/api/conciliacao/sugerir-pareamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bancoId,
          dataInicio,
          dataFim,
          status: 'pendente'
        }),
      });

      if (!responseSugestoes.ok) {
        throw new Error('Erro ao buscar sugestões');
      }

      const dadosSugestoes = await responseSugestoes.json();
      const sugestoes = dadosSugestoes.sugestoes || [];

      addLog(`📊 Encontradas ${sugestoes.length} sugestões de pareamento`);
      setProgress(10);

      if (sugestoes.length === 0) {
        addLog('ℹ️ Nenhuma sugestão encontrada para processamento');
        setIsProcessing(false);
        return;
      }

      // 2. Filtrar sugestões pela confiança mínima
      const sugestoesElegiveis = sugestoes.filter((s: any) => {
        const confianca = s.confianca;
        return (
          (settings.confirmarAlta && confianca >= 0.8) ||
          (settings.confirmarMedia && confianca >= 0.6 && confianca < 0.8) ||
          (settings.confirmarBaixa && confianca < 0.6)
        );
      });

      addLog(`✅ ${sugestoesElegiveis.length} sugestões elegíveis para processamento automático`);
      setProgress(20);

      if (sugestoesElegiveis.length === 0) {
        addLog('ℹ️ Nenhuma sugestão atende aos critérios de confiança configurados');
        setIsProcessing(false);
        return;
      }

      // 3. Processar em lotes
      const resultados: ProcessingResult = {
        totalProcessed: 0,
        successfulMatches: 0,
        failedMatches: 0,
        skippedItems: 0,
        errors: [],
        matches: []
      };

      const totalSugestoes = sugestoesElegiveis.length;
      const batchSize = settings.batchSize;
      const totalBatches = Math.ceil(totalSugestoes / batchSize);

      setCurrentStep(`Processando ${totalBatches} lotes...`);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (isPaused) {
          addLog('⏸️ Processamento pausado pelo usuário');
          break;
        }

        const startIdx = batchIndex * batchSize;
        const endIdx = Math.min(startIdx + batchSize, totalSugestoes);
        const lote = sugestoesElegiveis.slice(startIdx, endIdx);

        addLog(`📦 Processando lote ${batchIndex + 1}/${totalBatches} (${lote.length} itens)`);

        // Processar cada item do lote
        for (const sugestao of lote) {
          if (isPaused) break;

          try {
            resultados.totalProcessed++;
            
            addLog(`🔄 Confirmando pareamento: ${sugestao.transacao_bancaria.descricao.substring(0, 30)}...`);

            const response = await fetch('/api/conciliacao/confirmar-pareamento', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transacaoBancariaId: sugestao.transacao_bancaria.id,
                lancamentoId: sugestao.lancamento.id,
                observacoes: `Processamento automático em lote - Confiança: ${(sugestao.confianca * 100).toFixed(1)}%`
              }),
            });

            if (response.ok) {
              resultados.successfulMatches++;
              resultados.matches.push(sugestao);
              addLog(`✅ Pareamento confirmado com sucesso (${(sugestao.confianca * 100).toFixed(1)}% confiança)`);
            } else {
              const errorData = await response.json();
              resultados.failedMatches++;
              resultados.errors.push(`Erro ao confirmar pareamento: ${errorData.error}`);
              addLog(`❌ Falha ao confirmar pareamento: ${errorData.error}`, 'error');
            }

          } catch (error) {
            resultados.failedMatches++;
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            resultados.errors.push(errorMsg);
            addLog(`❌ Erro no processamento: ${errorMsg}`, 'error');
          }

          // Atualizar progresso
          const progressPercent = 20 + ((resultados.totalProcessed / totalSugestoes) * 80);
          setProgress(Math.min(progressPercent, 100));
        }

        // Delay entre lotes se configurado
        if (batchIndex < totalBatches - 1 && settings.delayBetweenBatches > 0) {
          addLog(`⏳ Aguardando ${settings.delayBetweenBatches}ms antes do próximo lote...`);
          await new Promise(resolve => setTimeout(resolve, settings.delayBetweenBatches));
        }
      }

      setProgress(100);
      setCurrentStep('Processamento concluído');
      setResults(resultados);

      addLog(`🎉 Processamento concluído!`);
      addLog(`📊 Resumo: ${resultados.successfulMatches} sucessos, ${resultados.failedMatches} falhas`);

      onComplete?.(resultados);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro crítico no processamento: ${errorMsg}`, 'error');
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  }, [bancoId, dataInicio, dataFim, settings, isPaused, addLog, onComplete, onError]);

  const pausarProcessamento = useCallback(() => {
    setIsPaused(true);
    addLog('⏸️ Pausando processamento...', 'warning');
  }, [addLog]);

  const retomarProcessamento = useCallback(() => {
    setIsPaused(false);
    addLog('▶️ Retomando processamento...', 'info');
  }, [addLog]);

  const resetarProcessamento = useCallback(() => {
    setIsProcessing(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentStep('');
    setResults(null);
    setLogs([]);
    addLog('🔄 Processamento resetado');
  }, [addLog]);

  const exportarLogs = useCallback(() => {
    const logsText = logs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processamento-lote-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Processamento em Lote</CardTitle>
          <CardDescription>
            Configure os parâmetros para o processamento automático de pareamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Critérios de confiança */}
          <div className="space-y-3">
            <h4 className="font-medium">Níveis de Confiança para Auto-Confirmação</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmar-alta"
                  checked={settings.confirmarAlta}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, confirmarAlta: !!checked }))
                  }
                />
                <label htmlFor="confirmar-alta" className="text-sm">
                  Alta confiança (≥ 80%) - <span className="text-green-600 font-medium">Recomendado</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmar-media"
                  checked={settings.confirmarMedia}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, confirmarMedia: !!checked }))
                  }
                />
                <label htmlFor="confirmar-media" className="text-sm">
                  Média confiança (60-79%) - <span className="text-yellow-600 font-medium">Cuidado</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmar-baixa"
                  checked={settings.confirmarBaixa}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, confirmarBaixa: !!checked }))
                  }
                />
                <label htmlFor="confirmar-baixa" className="text-sm">
                  Baixa confiança (&lt; 60%) - <span className="text-red-600 font-medium">Não recomendado</span>
                </label>
              </div>
            </div>
          </div>

          {/* Configurações de performance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tamanho do Lote</label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.batchSize}
                onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 50 }))}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Delay entre Lotes (ms)</label>
              <input
                type="number"
                min="0"
                max="5000"
                value={settings.delayBetweenBatches}
                onChange={(e) => setSettings(prev => ({ ...prev, delayBetweenBatches: parseInt(e.target.value) || 1000 }))}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de processamento */}
      <Card>
        <CardHeader>
          <CardTitle>Controles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {!isProcessing ? (
              <Button 
                onClick={processarLoteAutomatico}
                disabled={!bancoId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Processamento
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button 
                    onClick={pausarProcessamento}
                    variant="outline"
                    className="border-yellow-200 text-yellow-600"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button 
                    onClick={retomarProcessamento}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}
              </>
            )}
            
            <Button 
              onClick={resetarProcessamento}
              variant="outline"
              disabled={isProcessing && !isPaused}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>

            {logs.length > 0 && (
              <Button 
                onClick={exportarLogs}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Logs
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progresso */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentStep && (
                <p className="text-sm text-gray-600">{currentStep}</p>
              )}
              {isPaused && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Pause className="h-4 w-4" />
                  <span className="text-sm">Processamento pausado</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados do Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.totalProcessed}</div>
                <div className="text-sm text-gray-600">Total Processado</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.successfulMatches}</div>
                <div className="text-sm text-gray-600">Sucessos</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.failedMatches}</div>
                <div className="text-sm text-gray-600">Falhas</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {results.totalProcessed > 0 ? ((results.successfulMatches / results.totalProcessed) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-gray-600">Taxa de Sucesso</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Erros Encontrados</h4>
                <div className="bg-red-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      {index + 1}. {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs em tempo real */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Logs de Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const empresaId = formData.get('empresaId') as string;
    const usuarioId = formData.get('usuarioId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['application/x-ofx', 'text/csv', 'application/csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !['ofx', 'csv'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Apenas OFX e CSV são aceitos.' },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB permitido.' },
        { status: 400 }
      );
    }

    // Gerar hash do arquivo
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verificar se arquivo já foi importado (por hash)
    const { data: existingBatch } = await supabase
      .from('lotes_importacao')
      .select('id, nome_arquivo')
      .eq('hash_arquivo', hashHex)
      .eq('usuario_upload', usuarioId)
      .single();

    if (existingBatch) {
      return NextResponse.json(
        { 
          error: 'Este arquivo já foi importado anteriormente',
          existingBatch: existingBatch 
        },
        { status: 409 }
      );
    }

    // Determinar tipo do arquivo
    const tipoArquivo = fileExtension === 'ofx' ? 'OFX' : 'CSV';

    // Criar lote de importação
    const { data: lote, error: loteError } = await supabase
      .from('lotes_importacao')
      .insert({
        nome_arquivo: file.name,
        tipo_arquivo: tipoArquivo,
        tamanho_arquivo: file.size,
        hash_arquivo: hashHex,
        status: 'pendente',
        usuario_upload: usuarioId,
        configuracao_processamento: {
          encoding: 'utf-8',
          autoProcessar: false
        }
      })
      .select()
      .single();

    if (loteError) {
      console.error('Erro ao criar lote:', loteError);
      return NextResponse.json(
        { error: 'Erro interno ao processar upload' },
        { status: 500 }
      );
    }

    // Processar arquivo e extrair transações
    const fileContent = new TextDecoder().decode(arrayBuffer);
    
    // Extrair registros do arquivo
    const registros = processFile(fileContent, tipoArquivo);

    // Inserir pré-lançamentos na tabela pre_lancamentos
    const preEntries = registros.map((registro: any) => ({
      lote_id: lote.id,
      data_lancamento: registro.data,
      descricao: registro.descricao,
      valor: registro.valor,
      documento: registro.documento || null,
      categoria_sugerida: registro.categoria || null,
      tipo_movimento: registro.tipo || 'entrada',
      status_aprovacao: 'pendente',
      score_matching: Math.round(Math.random() * 50 + 50), // 50-100
      data_criacao: new Date().toISOString(),
      dados_originais: {
        linha_original: registro.linha,
        arquivo_origem: file.name,
        tipo_original: registro.tipo
      }
    }));

    const { data: insertedEntries, error: entriesError } = await supabase
      .from('pre_lancamentos')
      .insert(preEntries)
      .select();

    if (entriesError) {
      console.error('Erro ao inserir pré-lançamentos:', entriesError);
      // Não falhar o upload por causa disso, apenas logar
    }

    // Atualizar lote com contagem de registros
    await supabase
      .from('lotes_importacao')
      .update({
        total_registros: registros.length,
        status: 'processado',
        registros_processados: registros.length,
        data_processamento: new Date().toISOString()
      })
      .eq('id', lote.id);

    return NextResponse.json({
      success: true,
      lote: {
        id: lote.id,
        nome_arquivo: lote.nome_arquivo,
        tipo_arquivo: lote.tipo_arquivo,
        total_registros: registros.length,
        registros_processados: registros.length,
        status: 'processado'
      },
      registros: registros.slice(0, 5) // Retornar apenas primeiros 5 para preview
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para processar arquivo e extrair transações
function processFile(content: string, tipo: string): any[] {
  if (tipo === 'CSV') {
    return processCSV(content);
  } else {
    return processOFX(content);
  }
}

// Função para processar CSV
function processCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);
    
    // Mapear para formato esperado
    const record: any = {
      linha: index + 1,
      data: parseDate(values[0]) || new Date().toISOString().split('T')[0],
      descricao: values[1]?.replace(/"/g, '') || `Transação ${index + 1}`,
      valor: parseFloat(values[2]) || 0,
      tipo: values[3]?.replace(/"/g, '') || 'indefinido',
      categoria: values[4]?.replace(/"/g, '') || null,
      documento: null
    };
    
    return record;
  }).filter(record => record.descricao && record.valor !== 0);
}

// Função para processar OFX (básico)
function processOFX(content: string): any[] {
  // Parser básico para OFX - implementar parser completo se necessário
  const transactions = [];
  const lines = content.split('\n');
  
  let currentTransaction: any = {};
  let inTransaction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('<STMTTRN>')) {
      inTransaction = true;
      currentTransaction = { linha: i + 1 };
    } else if (line.includes('</STMTTRN>')) {
      if (currentTransaction.descricao && currentTransaction.valor !== undefined) {
        transactions.push(currentTransaction);
      }
      currentTransaction = {};
      inTransaction = false;
    } else if (inTransaction) {
      if (line.includes('<TRNAMT>')) {
        currentTransaction.valor = parseFloat(line.replace(/<\/?TRNAMT>/g, '')) || 0;
      } else if (line.includes('<MEMO>') || line.includes('<NAME>')) {
        currentTransaction.descricao = line.replace(/<\/?[^>]+>/g, '').trim();
      } else if (line.includes('<DTPOSTED>')) {
        const dateStr = line.replace(/<\/?DTPOSTED>/g, '');
        currentTransaction.data = parseOFXDate(dateStr);
      }
    }
  }
  
  return transactions.map((t, index) => ({
    ...t,
    linha: index + 1,
    tipo: t.valor >= 0 ? 'entrada' : 'saida',
    categoria: null,
    documento: null
  }));
}

// Função para parsear linha CSV respeitando aspas
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Função para parsear data
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Remover aspas se houver
  dateStr = dateStr.replace(/"/g, '').trim();
  
  // Tentar diferentes formatos
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // YYYY-MM-DD
        return `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        // DD/MM/YYYY ou DD-MM-YYYY
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
  }
  
  return null;
}

// Função para parsear data OFX
function parseOFXDate(dateStr: string): string {
  // OFX format: YYYYMMDD ou YYYYMMDDHHMMSS
  if (dateStr.length >= 8) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}

// Função temporária para compatibilidade (pode ser removida)
function simulateFileProcessing(content: string, tipo: string) {
  return processFile(content, tipo);
}

export async function GET() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}
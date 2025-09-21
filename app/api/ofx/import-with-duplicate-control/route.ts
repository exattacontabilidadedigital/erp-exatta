// =========================================================
// API PARA IMPORTAÇÃO OFX COM CONTROLE DE DUPLICIDADE
// Implementa estratégia completa anti-duplicatas
// =========================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OFXParserWithDuplicateControl } from '@/lib/ofx-parser-duplicate-control';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando importação OFX com controle de duplicidade...');

    const supabase = createClient();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contaBancariaId = formData.get('contaBancariaId') as string;
    const empresaId = formData.get('empresaId') as string;

    if (!file || !contaBancariaId || !empresaId) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo, conta bancária e empresa são obrigatórios'
      }, { status: 400 });
    }

    console.log('📄 Arquivo recebido:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Ler conteúdo do arquivo
    const fileContent = await file.text();
    console.log('📏 Conteúdo lido:', fileContent.length, 'caracteres');

    // Parse do arquivo OFX
    const ofxData = OFXParserWithDuplicateControl.parse(fileContent, file.name);
    console.log('✅ Parse OFX concluído:', {
      bankId: ofxData.bank_id,
      accountCount: ofxData.accounts.length,
      transactionCount: ofxData.accounts[0]?.transactions.length || 0,
      fileHash: ofxData.file_hash
    });

    // ETAPA 1: Verificar se o arquivo já foi importado
    console.log('🔍 ETAPA 1: Verificando duplicidade do arquivo...');
    const fileDuplicateCheck = await OFXParserWithDuplicateControl.checkFileDuplicate(
      ofxData.file_hash,
      contaBancariaId,
      empresaId,
      supabase
    );

    console.log('📊 Resultado verificação arquivo:', fileDuplicateCheck);

    if (fileDuplicateCheck.isDuplicate) {
      return NextResponse.json({
        success: false,
        isDuplicateFile: true,
        message: 'Este arquivo OFX já foi importado anteriormente',
        existingImport: fileDuplicateCheck.existingImport,
        details: fileDuplicateCheck
      }, { status: 409 }); // 409 Conflict
    }

    // ETAPA 2: Verificar transações duplicadas por FIT_ID
    console.log('🔍 ETAPA 2: Verificando transações duplicadas...');
    const transactions = ofxData.accounts[0]?.transactions || [];
    const fitIds = transactions.map(t => t.fit_id);

    const transactionDuplicateCheck = await OFXParserWithDuplicateControl.checkTransactionDuplicates(
      fitIds,
      contaBancariaId,
      supabase
    );

    console.log('📊 Resultado verificação transações:', {
      total: transactionDuplicateCheck.length,
      duplicadas: transactionDuplicateCheck.filter(t => t.isDuplicate).length
    });

    // ETAPA 3: Filtrar transações para importar apenas as novas
    const filteredTransactions = OFXParserWithDuplicateControl.filterDuplicateTransactions(
      transactions,
      transactionDuplicateCheck
    );

    console.log('📊 Resultado filtragem:', {
      novas: filteredTransactions.newTransactions.length,
      duplicadas: filteredTransactions.duplicateTransactions.length,
      jaConciliadas: filteredTransactions.alreadyConciliated.length
    });

    // Se não há transações novas para importar
    if (filteredTransactions.newTransactions.length === 0) {
      return NextResponse.json({
        success: false,
        isAllDuplicate: true,
        message: 'Todas as transações deste arquivo já foram importadas',
        summary: {
          totalTransactions: transactions.length,
          newTransactions: 0,
          duplicateTransactions: filteredTransactions.duplicateTransactions.length,
          alreadyConciliated: filteredTransactions.alreadyConciliated.length
        }
      }, { status: 409 });
    }

    // ETAPA 4: Criar registro do bank_statement
    console.log('💾 ETAPA 4: Criando registro do extrato...');
    const { data: bankStatement, error: statementError } = await supabase
      .from('bank_statements')
      .insert({
        conta_bancaria_id: contaBancariaId,
        empresa_id: empresaId,
        nome_arquivo: file.name,
        nome_arquivo_original: file.name,
        arquivo_hash: ofxData.file_hash,
        tamanho_arquivo: file.size,
        data_inicio: ofxData.start_date,
        data_fim: ofxData.end_date,
        total_transacoes: filteredTransactions.newTransactions.length,
        saldo_inicial: 0, // Pode ser melhorado depois
        saldo_final: ofxData.accounts[0]?.balance || 0,
        raw_data: fileContent,
        status: 'processado'
      })
      .select()
      .single();

    if (statementError) {
      console.error('❌ Erro ao criar bank_statement:', statementError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar registro do extrato bancário',
        details: statementError
      }, { status: 500 });
    }

    console.log('✅ Bank statement criado:', bankStatement.id);

    // ETAPA 5: Inserir apenas as transações novas
    console.log('💾 ETAPA 5: Inserindo transações novas...');
    const transactionsToInsert = filteredTransactions.newTransactions.map(transaction => ({
      bank_statement_id: bankStatement.id,
      conta_bancaria_id: contaBancariaId,
      empresa_id: empresaId,
      fit_id: transaction.fit_id,
      memo: transaction.memo,
      payee: transaction.payee,
      amount: transaction.amount,
      posted_at: transaction.posted_at,
      transaction_type: transaction.transaction_type,
      check_number: transaction.check_number,
      reference_number: transaction.reference_number,
      status_conciliacao: 'pendente', // Todas iniciam como pendentes
      raw_data: transaction
    }));

    const { data: insertedTransactions, error: transactionsError } = await supabase
      .from('bank_transactions')
      .insert(transactionsToInsert)
      .select();

    if (transactionsError) {
      console.error('❌ Erro ao inserir transações:', transactionsError);
      // Reverter bank_statement se falhou
      await supabase.from('bank_statements').delete().eq('id', bankStatement.id);
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir transações bancárias',
        details: transactionsError
      }, { status: 500 });
    }

    console.log('✅ Transações inseridas:', insertedTransactions?.length || 0);

    // ETAPA 6: Preparar resposta com resumo completo
    const response = {
      success: true,
      message: 'Importação concluída com sucesso',
      bankStatementId: bankStatement.id,
      summary: {
        fileName: file.name,
        fileHash: ofxData.file_hash,
        period: {
          start: ofxData.start_date,
          end: ofxData.end_date
        },
        transactions: {
          total: transactions.length,
          imported: filteredTransactions.newTransactions.length,
          skipped: filteredTransactions.duplicateTransactions.length + filteredTransactions.alreadyConciliated.length,
          duplicates: filteredTransactions.duplicateTransactions.length,
          alreadyConciliated: filteredTransactions.alreadyConciliated.length
        },
        account: {
          bankId: ofxData.bank_id,
          accountId: ofxData.accounts[0]?.account_id,
          balance: ofxData.accounts[0]?.balance
        }
      },
      duplicateInfo: {
        hasPartialDuplicates: filteredTransactions.duplicateTransactions.length > 0 || filteredTransactions.alreadyConciliated.length > 0,
        duplicateTransactions: filteredTransactions.duplicateTransactions.map(t => ({
          fit_id: t.fit_id,
          memo: t.memo,
          amount: t.amount,
          posted_at: t.posted_at
        })),
        alreadyConciliated: filteredTransactions.alreadyConciliated.map(t => ({
          fit_id: t.fit_id,
          memo: t.memo,
          amount: t.amount,
          posted_at: t.posted_at
        }))
      }
    };

    console.log('🎉 Importação concluída com sucesso!');
    console.log('📊 Resumo final:', response.summary);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erro geral na importação:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Endpoint para verificar duplicidade sem importar
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { searchParams } = new URL(request.url);
    const fileHash = searchParams.get('fileHash');
    const contaBancariaId = searchParams.get('contaBancariaId');
    const empresaId = searchParams.get('empresaId');

    if (!fileHash || !contaBancariaId || !empresaId) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros fileHash, contaBancariaId e empresaId são obrigatórios'
      }, { status: 400 });
    }

    console.log('🔍 Verificando duplicidade:', { fileHash, contaBancariaId });

    const duplicateCheck = await OFXParserWithDuplicateControl.checkFileDuplicate(
      fileHash,
      contaBancariaId,
      empresaId,
      supabase
    );

    return NextResponse.json({
      success: true,
      duplicateCheck
    });

  } catch (error) {
    console.error('❌ Erro na verificação de duplicidade:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

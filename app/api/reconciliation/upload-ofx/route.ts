import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { OFXParserEnhanced } from '@/lib/ofx-parser-enhanced';
import { MatchingEngine } from '@/lib/matching-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/reconciliation/upload-ofx iniciado');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bankAccountId = formData.get('bank_account_id') as string;
    const empresaId = formData.get('empresa_id') as string;
    const userId = formData.get('user_id') as string;

    console.log('📊 Dados recebidos:', {
      fileName: file?.name,
      fileSize: file?.size,
      bankAccountId,
      empresaId,
      userId
    });

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    if (!bankAccountId) {
      return NextResponse.json(
        { error: 'ID da conta bancária é obrigatório' },
        { status: 400 }
      );
    }

    // Se empresa_id e user_id não foram fornecidos, tentar obter da conta bancária
    let finalEmpresaId = empresaId;
    let finalUserId = userId;

    if (!finalEmpresaId || !finalUserId) {
      const { data: contaData, error: contaError } = await supabase
        .from('contas_bancarias')
        .select('empresa_id')
        .eq('id', bankAccountId)
        .single();

      if (contaError || !contaData) {
        return NextResponse.json(
          { error: 'Conta bancária não encontrada' },
          { status: 404 }
        );
      }

      finalEmpresaId = contaData.empresa_id;
      // Para user_id, buscar um usuário válido se não fornecido
      if (!finalUserId) {
        const { data: usuarios } = await supabase
          .from('usuarios')
          .select('id')
          .limit(1);
        finalUserId = usuarios?.[0]?.id || null;
      }
    }

    // Validar tipo de arquivo
    const allowedTypes = ['.ofx', '.qfx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use arquivos .ofx ou .qfx' },
        { status: 400 }
      );
    }

    // Ler conteúdo do arquivo
    const fileContent = await file.text();
    console.log('📄 Conteúdo do arquivo lido:', fileContent.substring(0, 200) + '...');
    
    // Validar arquivo OFX
    const validation = OFXParserEnhanced.validateOFX(fileContent);
    console.log('✅ Validação OFX:', validation);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Arquivo OFX inválido: ${validation.error}` },
        { status: 400 }
      );
    }

    // Validar se o OFX pertence à conta selecionada
    const accountValidation = await OFXParserEnhanced.validateAccountMatch(
      fileContent,
      bankAccountId,
      supabase
    );
    
    console.log('🏦 Validação de conta:', accountValidation);
    
    if (!accountValidation.valid) {
      return NextResponse.json(
        { 
          error: accountValidation.error,
          accountInfo: accountValidation.accountInfo
        },
        { status: 400 }
      );
    }

    // Parse do arquivo OFX
    console.log('🔄 Iniciando parsing para banco de dados...');
    const parsedData = OFXParserEnhanced.parseForDatabase(
      fileContent,
      file.name,
      bankAccountId,
      finalEmpresaId
    );

    console.log(`📊 Arquivo processado: ${parsedData.total_transactions} transações`);
    console.log('📋 Dados parseados:', {
      file_name: parsedData.file_name,
      file_hash: parsedData.file_hash,
      period_start: parsedData.period_start,
      period_end: parsedData.period_end,
      total_transactions: parsedData.total_transactions
    });

    // Verificar se já existe um extrato com o mesmo hash para a mesma conta
    const { data: existingStatement } = await supabase
      .from('bank_statements')
      .select('id')
      .eq('bank_account_id', bankAccountId)
      .eq('file_hash', parsedData.file_hash)
      .single();

    if (existingStatement) {
      console.log('⚠️ Arquivo já importado anteriormente, permitindo reimportação...');
      // Permitir reimportação - remover extrato existente
      await supabase
        .from('bank_statements')
        .delete()
        .eq('id', existingStatement.id);
      
      console.log('🗑️ Extrato anterior removido, prosseguindo com nova importação...');
    }

    // Criar extrato bancário
    console.log('💾 Criando extrato bancário...');
    const statementData = {
      bank_account_id: bankAccountId,
      empresa_id: finalEmpresaId,
      file_name: parsedData.file_name,
      file_hash: parsedData.file_hash,
      file_size: parsedData.file_size,
      period_start: parsedData.period_start,
      period_end: parsedData.period_end,
      total_transactions: parsedData.total_transactions,
      processed_transactions: 0,
      matched_transactions: 0,
      status: 'processing',
      raw_ofx_data: parsedData.raw_ofx_data,
      created_by: finalUserId
    };
    
    console.log('📋 Dados do extrato:', statementData);
    
    const { data: bankStatement, error: statementError } = await supabase
      .from('bank_statements')
      .insert(statementData)
      .select()
      .single();

    if (statementError) {
      console.error('❌ Erro ao criar extrato:', statementError);
      return NextResponse.json(
        { error: 'Erro ao criar extrato bancário' },
        { status: 500 }
      );
    }

    // Inserir transações bancárias
    console.log('💾 Inserindo transações bancárias...');
    const bankTransactions = parsedData.transactions.map(txn => ({
      bank_statement_id: bankStatement.id,
      bank_account_id: bankAccountId,
      empresa_id: finalEmpresaId,
      fit_id: txn.fit_id,
      transaction_type: txn.transaction_type,
      posted_at: txn.posted_at.split('T')[0], // Converter para DATE (YYYY-MM-DD)
      amount: txn.amount,
      memo: txn.memo,
      payee: txn.payee,
      check_number: txn.check_number,
      reference_number: txn.reference_number,
      bank_reference: txn.bank_reference,
      reconciliation_status: 'pending'
    }));

    console.log(`📊 Inserindo ${bankTransactions.length} transações...`);
    console.log('📋 Primeira transação:', bankTransactions[0]);

    const { error: transactionsError } = await supabase
      .from('bank_transactions')
      .insert(bankTransactions);

    if (transactionsError) {
      console.error('❌ Erro ao inserir transações:', transactionsError);
      
      // Reverter criação do extrato
      await supabase
        .from('bank_statements')
        .delete()
        .eq('id', bankStatement.id);

      return NextResponse.json(
        { error: 'Erro ao inserir transações bancárias' },
        { status: 500 }
      );
    }

    // Executar matching automático
    console.log('🔍 Iniciando matching automático...');
    let matchingResults = null;
    
    try {
      // Buscar lançamentos do sistema para matching
      const { data: systemTransactions, error: systemError } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('empresa_id', finalEmpresaId)
        .eq('status', 'pago')
        .gte('data_lancamento', parsedData.period_start)
        .lte('data_lancamento', parsedData.period_end);

      if (systemError) {
        console.error('❌ Erro ao buscar lançamentos para matching:', systemError);
      } else {
        console.log(`📊 Lançamentos encontrados para matching: ${systemTransactions?.length || 0}`);
        
        // Buscar as transações bancárias inseridas para obter os IDs reais
        const { data: insertedTransactions, error: insertedError } = await supabase
          .from('bank_transactions')
          .select('*')
          .eq('bank_statement_id', bankStatement.id);

        if (insertedError || !insertedTransactions) {
          console.error('❌ Erro ao buscar transações inseridas:', insertedError);
        } else {
          // Executar matching
          const matchingEngine = new MatchingEngine();
          const importedTransactions = insertedTransactions.map(txn => ({
            id: txn.id, // ID real da transação bancária
            fit_id: txn.fit_id,
            memo: txn.memo || '',
            payee: txn.payee,
            amount: txn.amount,
            posted_at: txn.posted_at,
            transaction_type: txn.transaction_type as 'DEBIT' | 'CREDIT',
            check_number: txn.check_number,
            reference_number: txn.reference_number,
            bank_reference: txn.bank_reference
          }));

          const systemTxnFormatted = (systemTransactions || []).map(txn => ({
            id: txn.id,
            descricao: txn.descricao,
            valor: parseFloat(txn.valor),
            data_lancamento: txn.data_lancamento,
            tipo: txn.tipo as 'receita' | 'despesa' | 'transferencia',
            centro_custo: txn.centro_custo_id,
            plano_conta: txn.plano_conta_id,
            numero_documento: txn.numero_documento,
            conta_bancaria_id: txn.conta_bancaria_id
          }));

          matchingResults = await matchingEngine.processMatching(
            importedTransactions,
            systemTxnFormatted
          );

          console.log(`✅ Matching concluído: ${matchingResults.length} resultados`);
          
          // Salvar matches no banco de dados
          if (matchingResults.length > 0) {
            // Buscar um usuário para usar como created_by
            const { data: usuarios } = await supabase
              .from('usuarios')
              .select('id')
              .limit(1);
            
            const userId = usuarios?.[0]?.id || null;

            // Criar sessão de conciliação
            const { data: reconciliationSession, error: sessionError } = await supabase
              .from('reconciliation_sessions')
              .insert({
                bank_account_id: bankAccountId,
                empresa_id: finalEmpresaId,
                period_start: parsedData.period_start,
                period_end: parsedData.period_end,
                total_bank_transactions: insertedTransactions.length,
                total_system_transactions: systemTransactions?.length || 0,
                matched_transactions: matchingResults.filter(r => r.status === 'conciliado').length,
                pending_transactions: matchingResults.filter(r => r.status === 'sem_match').length,
                ignored_transactions: 0,
                bank_total_debits: insertedTransactions.filter(t => t.transaction_type === 'DEBIT').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                bank_total_credits: insertedTransactions.filter(t => t.transaction_type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0),
                system_total_debits: 0.00,
                system_total_credits: 0.00,
                difference_amount: 0.00,
                status: 'active',
                auto_match_enabled: true,
                confidence_threshold: 0.80,
                created_by: userId
              })
              .select()
              .single();

            if (sessionError) {
              console.error('❌ Erro ao criar sessão de conciliação:', sessionError);
            } else {
              // Salvar matches
              const matchesToInsert = matchingResults
                .filter(result => result.systemTransaction) // Apenas matches com lançamento
                .map(result => ({
                  reconciliation_id: reconciliationSession.id,
                  bank_transaction_id: result.bankTransaction.id,
                  system_transaction_id: result.systemTransaction!.id,
                  match_score: result.matchScore / 100, // Converter para 0-1
                  match_type: result.matchType === 'exact' ? 'automatic' : 'suggested',
                  confidence_level: result.confidenceLevel,
                  status: result.status === 'conciliado' ? 'confirmed' : 'suggested',
                  notes: result.matchReason
                }));

              if (matchesToInsert.length > 0) {
                const { error: matchesError } = await supabase
                  .from('transaction_matches')
                  .insert(matchesToInsert);

                if (matchesError) {
                  console.error('❌ Erro ao salvar matches:', matchesError);
                } else {
                  console.log(`✅ ${matchesToInsert.length} matches salvos no banco`);
                }
              }
            }
          }
        }
      }
    } catch (matchingError) {
      console.error('❌ Erro no processo de matching:', matchingError);
    }

    // Atualizar status do extrato para processado
    await supabase
      .from('bank_statements')
      .update({ 
        status: 'processed',
        processed_transactions: parsedData.total_transactions
      })
      .eq('id', bankStatement.id);

    console.log('✅ Upload e matching concluídos com sucesso');

    return NextResponse.json({
      success: true,
      imported_count: parsedData.total_transactions,
      bank_statement_id: bankStatement.id,
      matching_results: matchingResults ? {
        total: matchingResults.length,
        matched: matchingResults.filter(r => r.systemTransaction).length,
        unmatched: matchingResults.filter(r => !r.systemTransaction).length
      } : null,
      message: `${parsedData.total_transactions} transações importadas com sucesso${matchingResults ? ` e ${matchingResults.filter(r => r.systemTransaction).length} matches encontrados` : ''}`
    });

  } catch (error) {
    console.error('❌ Erro no upload OFX:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🚫 API Ignorar Transação - Iniciando processamento');

    const body = await request.json();
    const { transactionId, reason, userId } = body;

    console.log('📝 Dados recebidos:', {
      transactionId,
      reason: reason?.substring(0, 50) + '...',
      userId
    });

    // Validar dados obrigatórios
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Motivo é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a transação bancária
    const { data: bankTransaction, error: fetchError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar transação bancária:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    console.log('🏦 Transação encontrada:', {
      id: bankTransaction.id,
      descricao: bankTransaction.descricao,
      valor: bankTransaction.valor,
      data: bankTransaction.data
    });

    // Atualizar a transação como ignorada
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({
        status: 'ignored',
        ignore_reason: reason.trim(),
        ignored_at: new Date().toISOString(),
        ignored_by: userId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('❌ Erro ao atualizar transação:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao ignorar transação' },
        { status: 500 }
      );
    }

    // Registrar no histórico/log
    const { error: logError } = await supabase
      .from('reconciliation_logs')
      .insert({
        bank_transaction_id: transactionId,
        action: 'ignored',
        details: {
          reason: reason.trim(),
          ignored_by: userId,
          previous_status: bankTransaction.status || 'pending'
        },
        created_at: new Date().toISOString(),
        created_by: userId
      });

    if (logError) {
      console.warn('⚠️ Erro ao registrar log (não crítico):', logError);
    }

    console.log('✅ Transação ignorada com sucesso:', transactionId);

    return NextResponse.json({
      success: true,
      message: 'Transação ignorada com sucesso',
      data: {
        transactionId,
        reason: reason.trim(),
        ignoredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na API de ignorar:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 API Listar Transações Ignoradas - Iniciando');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Buscar transações ignoradas
    let query = supabase
      .from('bank_transactions')
      .select('*, reconciliation_logs(*)')
      .eq('status', 'ignored')
      .order('ignored_at', { ascending: false });

    if (userId) {
      query = query.eq('ignored_by', userId);
    }

    const { data: ignoredTransactions, error: fetchError } = await query
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('❌ Erro ao buscar transações ignoradas:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar transações ignoradas' },
        { status: 500 }
      );
    }

    // Contar total
    const { count, error: countError } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ignored');

    if (countError) {
      console.warn('⚠️ Erro ao contar transações ignoradas:', countError);
    }

    console.log('✅ Transações ignoradas encontradas:', {
      total: count || 0,
      page,
      limit,
      returned: ignoredTransactions?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: ignoredTransactions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na API de listar ignoradas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔄 API Restaurar Transação Ignorada - Iniciando');

    const body = await request.json();
    const { transactionId, userId } = body;

    console.log('📝 Dados recebidos:', { transactionId, userId });

    // Validar dados obrigatórios
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a transação ignorada
    const { data: bankTransaction, error: fetchError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('status', 'ignored')
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar transação ignorada:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Transação ignorada não encontrada' },
        { status: 404 }
      );
    }

    // Restaurar a transação (voltar ao status anterior ou pendente)
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({
        status: 'pending',
        ignore_reason: null,
        ignored_at: null,
        ignored_by: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('❌ Erro ao restaurar transação:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao restaurar transação' },
        { status: 500 }
      );
    }

    // Registrar no histórico
    const { error: logError } = await supabase
      .from('reconciliation_logs')
      .insert({
        bank_transaction_id: transactionId,
        action: 'restored',
        details: {
          restored_by: userId,
          previous_ignore_reason: bankTransaction.ignore_reason
        },
        created_at: new Date().toISOString(),
        created_by: userId
      });

    if (logError) {
      console.warn('⚠️ Erro ao registrar log de restauração:', logError);
    }

    console.log('✅ Transação restaurada com sucesso:', transactionId);

    return NextResponse.json({
      success: true,
      message: 'Transação restaurada com sucesso',
      data: {
        transactionId,
        restoredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na API de restaurar:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

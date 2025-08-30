import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const auditLog = await request.json();
    
    console.log('📝 Registrando log de auditoria:', auditLog);

    // Inserir log na tabela de auditoria
    const { data, error } = await supabase
      .from('reconciliation_audit_logs')
      .insert({
        id: auditLog.id,
        action: auditLog.action,
        user_id: auditLog.user_id,
        timestamp: auditLog.timestamp,
        details: auditLog.details
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao registrar log de auditoria:', error);
      return NextResponse.json(
        { error: 'Erro ao registrar log de auditoria' },
        { status: 500 }
      );
    }

    console.log('✅ Log de auditoria registrado:', data.id);
    return NextResponse.json({ success: true, log_id: data.id });

  } catch (error) {
    console.error('❌ Erro no endpoint de audit log:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankTransactionId = searchParams.get('bank_transaction_id');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('reconciliation_audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (bankTransactionId) {
      query = query.eq('details->bank_transaction_id', bankTransactionId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar logs de auditoria:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar logs de auditoria' },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: data });

  } catch (error) {
    console.error('❌ Erro no endpoint de audit log:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

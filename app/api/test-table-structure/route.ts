import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const testType = searchParams.get('test');

  try {
    console.log('🔍 Testing table structure:', { table, testType });

    if (testType === 'join') {
      // Testar JOIN problemático
      console.log('🔗 Testing JOIN...');
      
      const { data, error } = await supabase
        .from('transaction_matches')
        .select(`
          id,
          bank_transaction_id,
          bank_transactions!inner(
            id,
            description
          )
        `)
        .limit(5);

      if (error) {
        console.error('❌ JOIN Error:', error);
        return Response.json({ 
          success: false, 
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }

      console.log('✅ JOIN Success:', data);
      return Response.json({ success: true, data, count: data?.length });
    }

    if (table === 'transaction_matches') {
      // Testar transaction_matches
      console.log('📊 Testing transaction_matches...');
      
      const { data, error } = await supabase
        .from('transaction_matches')
        .select('*')
        .limit(5);

      if (error) {
        console.error('❌ transaction_matches Error:', error);
        return Response.json({ success: false, error: error.message });
      }

      console.log('✅ transaction_matches Success:', data);
      return Response.json({ success: true, data, count: data?.length });
    }

    if (table === 'bank_transactions') {
      // Testar bank_transactions
      console.log('📊 Testing bank_transactions...');
      
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .limit(5);

      if (error) {
        console.error('❌ bank_transactions Error:', error);
        return Response.json({ success: false, error: error.message });
      }

      console.log('✅ bank_transactions Success:', data);
      return Response.json({ success: true, data, count: data?.length });
    }

    // Teste geral - buscar informações das tabelas
    console.log('📋 Getting table info...');
    
    const { data: matchesInfo, error: matchesError } = await supabase
      .from('transaction_matches')
      .select('*')
      .limit(1);

    const { data: bankInfo, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .limit(1);

    return Response.json({
      success: true,
      tables: {
        transaction_matches: {
          available: !matchesError,
          error: matchesError?.message,
          sample: matchesInfo?.[0] || null,
          columns: matchesInfo?.[0] ? Object.keys(matchesInfo[0]) : []
        },
        bank_transactions: {
          available: !bankError,
          error: bankError?.message,
          sample: bankInfo?.[0] || null,
          columns: bankInfo?.[0] ? Object.keys(bankInfo[0]) : []
        }
      }
    });

  } catch (error) {
    console.error('❌ General Error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// TESTE SIMPLES - Validação OFX vs Conta Bancária
// Para testar, execute: node teste-validacao-ofx.js

const { OFXParserEnhanced } = require('./lib/ofx-parser-enhanced');

// Mock do Supabase para teste
const mockSupabase = {
  from: (table) => ({
    select: (fields) => ({
      eq: (field, value) => ({
        single: () => {
          // Simular dados de uma conta bancária
          if (table === 'contas_bancarias' && field === 'id') {
            return {
              data: {
                id: 'test-account-id',
                agencia: '1234',
                conta: '12345',
                digito: '6',
                bancos: {
                  codigo: '341',
                  nome: 'Itaú'
                }
              },
              error: null
            };
          }
          return { data: null, error: 'Not found' };
        }
      })
    })
  })
};

// Exemplo de OFX válido (fragmento)
const ofxValido = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKACCTFROM>
          <BANKID>341</BANKID>
          <ACCTID>123456</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20241201</DTSTART>
          <DTEND>20241231</DTEND>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20241215</DTPOSTED>
            <TRNAMT>-150.00</TRNAMT>
            <FITID>12345</FITID>
            <MEMO>Compra supermercado</MEMO>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
`;

// Exemplo de OFX com banco incorreto
const ofxBancoIncorreto = ofxValido.replace('<BANKID>341</BANKID>', '<BANKID>237</BANKID>');

// Exemplo de OFX com conta incorreta
const ofxContaIncorreta = ofxValido.replace('<ACCTID>123456</ACCTID>', '<ACCTID>999999</ACCTID>');

async function testarValidacao() {
  console.log('🧪 Iniciando testes de validação OFX vs Conta...\n');

  // Teste 1: OFX válido
  console.log('1️⃣ Teste: OFX com dados corretos');
  try {
    const resultado1 = await OFXParserEnhanced.validateAccountMatch(
      ofxValido, 
      'test-account-id', 
      mockSupabase
    );
    console.log('✅ Resultado:', resultado1.valid ? 'APROVADO' : 'REJEITADO');
    if (!resultado1.valid) console.log('❌ Erro:', resultado1.error);
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }

  console.log('\n2️⃣ Teste: OFX com banco incorreto');
  try {
    const resultado2 = await OFXParserEnhanced.validateAccountMatch(
      ofxBancoIncorreto, 
      'test-account-id', 
      mockSupabase
    );
    console.log('✅ Resultado:', resultado2.valid ? 'APROVADO' : 'REJEITADO');
    if (!resultado2.valid) console.log('❌ Erro:', resultado2.error);
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }

  console.log('\n3️⃣ Teste: OFX com conta incorreta');
  try {
    const resultado3 = await OFXParserEnhanced.validateAccountMatch(
      ofxContaIncorreta, 
      'test-account-id', 
      mockSupabase
    );
    console.log('✅ Resultado:', resultado3.valid ? 'APROVADO' : 'REJEITADO');
    if (!resultado3.valid) console.log('❌ Erro:', resultado3.error);
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }

  console.log('\n🎯 Testes concluídos!');
}

// Executar testes se arquivo for executado diretamente
if (require.main === module) {
  testarValidacao();
}

module.exports = { testarValidacao };

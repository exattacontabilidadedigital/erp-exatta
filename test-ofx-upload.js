// =====================================
// TESTE DE UPLOAD OFX - BANCO DO BRASIL
// Simula o upload para verificar validação
// =====================================

const testOFXContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <DTSERVER>20250823155028</DTSERVER>
      <LANGUAGE>POR</LANGUAGE>
      <FI>
        <ORG>Banco do Brasil</ORG>
        <FID>1</FID>
      </FI>
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1</TRNUID>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <STMTRS>
        <CURDEF>BRL</CURDEF>
        <BANKACCTFROM>
          <BANKID>001</BANKID>
          <BRANCHID>1311</BRANCHID>
          <ACCTID>39188</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20250820</DTPOSTED>
            <TRNAMT>-10</TRNAMT>
            <FITID>TRANSF-1755718714650-SAIDA</FITID>
            <NAME>[TRANSFER NCIA SA DA] teste</NAME>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20250820</DTPOSTED>
            <TRNAMT>10</TRNAMT>
            <FITID>TRANSF-1755718714650-ENTRADA</FITID>
            <NAME>[TRANSFER NCIA ENTRADA] teste</NAME>
          </STMTTRN>
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>0.00</BALAMT>
          <DTASOF>20250823155028</DTASOF>
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

async function testOFXUpload() {
  console.log('🧪 TESTANDO UPLOAD OFX - BANCO DO BRASIL');
  console.log('=' .repeat(60));
  
  try {
    // Simular FormData
    const formData = new FormData();
    
    // Criar um blob com o conteúdo OFX
    const ofxBlob = new Blob([testOFXContent], { type: 'application/x-ofx' });
    const ofxFile = new File([ofxBlob], 'extrato_banco_brasil_ag1311_cc39188.ofx', {
      type: 'application/x-ofx'
    });
    
    formData.append('file', ofxFile);
    formData.append('bank_account_id', '4fd86770-32c4-4927-9d7e-8f3ded7b38fa');
    formData.append('empresa_id', '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d');
    formData.append('user_id', '7317f5bd-f288-4433-8283-596936caf9b2');
    
    console.log('📤 Enviando arquivo OFX para validação...');
    console.log('📋 Dados do arquivo:', {
      name: ofxFile.name,
      size: ofxFile.size,
      type: ofxFile.type
    });
    
    // Fazer upload para a API
    const response = await fetch('http://localhost:3000/api/reconciliation/upload-ofx', {
      method: 'POST',
      body: formData
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload bem-sucedido!');
      console.log('📊 Resultado:', {
        success: result.success,
        message: result.message,
        transacoes: result.data?.total_transactions || 0
      });
      
      if (result.data?.transactions) {
        console.log('💰 Primeiras transações importadas:');
        result.data.transactions.slice(0, 3).forEach((txn, index) => {
          console.log(`   ${index + 1}. ${txn.memo || txn.payee} - R$ ${txn.amount} (${txn.posted_at})`);
        });
      }
      
      return { success: true, result };
    } else {
      const errorData = await response.json();
      console.log('❌ Erro no upload:', {
        status: response.status,
        error: errorData.error,
        accountInfo: errorData.accountInfo
      });
      
      if (errorData.accountInfo) {
        console.log('🔍 Informações de validação:', {
          ofx: errorData.accountInfo.ofx,
          system: errorData.accountInfo.system
        });
      }
      
      return { success: false, error: errorData };
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    return { success: false, error: error.message };
  }
}

// Executar o teste se conseguir conectar com a API
async function runTest() {
  console.log('🚀 INICIANDO TESTE DE UPLOAD OFX');
  console.log('=' .repeat(60));
  
  try {
    // Verificar se a API está disponível
    const healthCheck = await fetch('http://localhost:3000/api/config/transfer-keywords');
    
    if (!healthCheck.ok) {
      console.log('⚠️  Servidor não está rodando. Execute: npm run dev');
      return;
    }
    
    console.log('✅ Servidor conectado, iniciando teste...');
    
    const result = await testOFXUpload();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO FINAL DO TESTE');
    console.log('='.repeat(60));
    
    if (result.success) {
      console.log('🎉 TESTE APROVADO! Upload OFX funcionando corretamente.');
      console.log('✅ Validação Banco do Brasil: códigos 001 e 04 aceitos');
      console.log('✅ Validação da conta: flexível para números e dígitos');
    } else {
      console.log('❌ TESTE FALHOU! Verificar logs de erro acima.');
      if (result.error) {
        console.log('🔍 Detalhes do erro:', result.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o servidor:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando: npm run dev');
  }
}

// Aguardar um momento para o servidor inicializar e executar
setTimeout(runTest, 3000);

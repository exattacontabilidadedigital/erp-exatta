const http = require('http');

function testServer() {
  console.log('🔍 Testando se o servidor está rodando na porta 3002...');
  
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/lancamentos',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Servidor respondendo! Status: ${res.statusCode}`);
    console.log(`📄 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📋 Resposta recebida (primeiros 200 caracteres):');
      console.log(data.substring(0, 200) + '...');
    });
  });

  req.on('error', (err) => {
    console.error('❌ Erro ao conectar:', err.message);
    console.log('💡 Verifique se o servidor está rodando com: npm run dev');
  });

  req.on('timeout', () => {
    console.error('⏰ Timeout - servidor não respondeu em 5 segundos');
    req.destroy();
  });

  req.end();
}

testServer();

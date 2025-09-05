console.log('🧪 Testando função de desconciliação...');

fetch('http://localhost:3000/api/reconciliation/unlink', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bank_transaction_id: '7aec8041-6b83-4dff-847a-f7d3c6d2defd'
  })
})
.then(response => {
  console.log('📡 Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('📄 Resposta:', text);
  try {
    const json = JSON.parse(text);
    console.log('✅ JSON:', json);
  } catch (e) {
    console.log('❌ Erro ao parsear JSON:', e.message);
  }
})
.catch(error => {
  console.error('❌ Erro:', error);
});

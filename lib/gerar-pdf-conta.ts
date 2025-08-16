import jsPDF from "jspdf"

export function gerarPDFConta(conta: any) {
  const doc = new jsPDF()
  doc.setFont("helvetica")
  doc.setFontSize(16)
  doc.text("Detalhes da Conta Bancária", 20, 20)
  doc.setFontSize(12)
  doc.text(`Banco: ${conta.bancos?.nome || conta.banco_id}`, 20, 35)
  doc.text(`Gerente: ${conta.gerente || '-'}`, 20, 45)
  doc.text(`Agência: ${conta.agencia}`, 20, 55)
  doc.text(`Conta: ${conta.conta}${conta.digito ? '-' + conta.digito : ''}`, 20, 65)
  doc.text(`Tipo de Conta: ${conta.tipo_conta}`, 20, 75)
  doc.text(`Saldo Inicial: R$ ${Number(conta.saldo_inicial).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 85)
  doc.text(`Saldo Atual: R$ ${Number(conta.saldo_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 95)
  const variacao = (conta.saldo_atual ?? 0) - (conta.saldo_inicial ?? 0)
  doc.text(`Variação: R$ ${Number(variacao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 105)
  doc.text(`Status: ${conta.ativo ? 'Ativa' : 'Inativa'}`, 20, 115)
  doc.save(`conta_${conta.id}.pdf`)
}

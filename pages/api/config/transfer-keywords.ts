import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Configuração de keywords por banco/instituição
      const transferKeywordsConfig = {
        default: [
          'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
          'TRANSF-', 'DOC', 'TED', 'PIX',
          'ENVIO', 'RECEBIMENTO', 'REMESSA'
        ],
        bb: [
          'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
          'DOC', 'TED', 'PIX', 'TRANSF ENTRE CONTAS',
          'APLICACAO BB', 'RESGATE BB', 'MOVIMENTACAO INTERNA BB'
        ],
        itau: [
          'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA', 
          'DOC', 'TED', 'PIX', 'TRANSF-',
          'APLICACAO ITAU', 'RESGATE ITAU', 'INVEST EASY'
        ],
        bradesco: [
          'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
          'DOC', 'TED', 'PIX', 'TRANSF-',
          'APLICACAO BRADESCO', 'PRIME', 'EXCLUSIVE'
        ],
        santander: [
          'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
          'DOC', 'TED', 'PIX', 'TRANSF-',
          'APLICACAO SANTANDER', 'SELECT', 'VAN GOGH'
        ],
        caixa: [
          'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
          'DOC', 'TED', 'PIX', 'TRANSF-',
          'APLICACAO CAIXA', 'POUPANCA CAIXA'
        ]
      };

      res.status(200).json(transferKeywordsConfig);
    } catch (error) {
      console.error('Erro ao carregar keywords:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

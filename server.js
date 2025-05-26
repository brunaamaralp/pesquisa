const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*', // Permite qualquer origem em ambiente de demonstração
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// Diretório para armazenar as avaliações
const avaliacoesDir = path.join(__dirname, 'avaliacoes');
if (!fs.existsSync(avaliacoesDir)) {
  fs.mkdirSync(avaliacoesDir, { recursive: true });
}

// Função para salvar avaliações em arquivo local
const saveToFile = (data) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `avaliacao_${timestamp}_${data.nomeMedico || 'anonimo'}.json`;
  const filePath = path.join(avaliacoesDir, fileName);
  
  // Adicionar timestamp à avaliação
  const avaliacaoComTimestamp = {
    ...data,
    timestamp: new Date().toISOString()
  };
  
  // Salvar arquivo
  fs.writeFileSync(filePath, JSON.stringify(avaliacaoComTimestamp, null, 2), 'utf8');
  
  // Também salvar em um arquivo consolidado para facilitar o download
  const consolidatedPath = path.join(avaliacoesDir, 'todas_avaliacoes.json');
  let todasAvaliacoes = [];
  
  if (fs.existsSync(consolidatedPath)) {
    try {
      const fileContent = fs.readFileSync(consolidatedPath, 'utf8');
      todasAvaliacoes = JSON.parse(fileContent);
    } catch (e) {
      console.error('Erro ao ler arquivo consolidado:', e);
    }
  }
  
  todasAvaliacoes.push(avaliacaoComTimestamp);
  fs.writeFileSync(consolidatedPath, JSON.stringify(todasAvaliacoes, null, 2), 'utf8');
  
  return fileName;
};

// Função para gerar HTML para visualização das avaliações
const generateHtml = () => {
  const consolidatedPath = path.join(avaliacoesDir, 'todas_avaliacoes.json');
  let todasAvaliacoes = [];
  
  if (fs.existsSync(consolidatedPath)) {
    try {
      const fileContent = fs.readFileSync(consolidatedPath, 'utf8');
      todasAvaliacoes = JSON.parse(fileContent);
    } catch (e) {
      console.error('Erro ao ler arquivo consolidado:', e);
      return '<h1>Erro ao ler avaliações</h1>';
    }
  }
  
  if (todasAvaliacoes.length === 0) {
    return '<h1>Nenhuma avaliação recebida ainda</h1>';
  }
  
  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Avaliações Recebidas</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #022939; text-align: center; margin-bottom: 30px; }
        h2 { color: #3458f7; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .avaliacao { background-color: #f9f9f9; border-left: 4px solid #00f7a6; padding: 15px; margin-bottom: 30px; }
        .avaliacao-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .servico { margin-bottom: 20px; padding: 15px; border-left: 3px solid #00bfd1; background-color: #f5f5f5; }
        .info { margin-bottom: 10px; }
        .label { font-weight: bold; }
        .observacoes { margin-top: 15px; font-style: italic; }
        .download-btn { display: inline-block; background-color: #3458f7; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .download-btn:hover { background-color: #022939; }
      </style>
    </head>
    <body>
      <h1>Avaliações de Serviços Financeiros para Clínicas Médicas</h1>
      <p>Total de avaliações recebidas: ${todasAvaliacoes.length}</p>
      <a href="/download" class="download-btn">Baixar todas as avaliações (JSON)</a>
  `;
  
  todasAvaliacoes.forEach((avaliacao, index) => {
    const dataFormatada = new Date(avaliacao.timestamp).toLocaleString('pt-BR');
    
    html += `
      <div class="avaliacao">
        <div class="avaliacao-header">
          <h2>Avaliação #${index + 1}</h2>
          <div>
            <span class="label">Data:</span> ${dataFormatada}<br>
            <span class="label">Médico:</span> ${avaliacao.nomeMedico || 'Anônimo'}
          </div>
        </div>
    `;
    
    // Serviço 1
    if (avaliacao.servico1.contrataria > 0 || avaliacao.servico1.potencial > 0) {
      html += `
        <div class="servico">
          <h3>Serviço 1: Organização Financeira da Clínica</h3>
          <div class="info"><span class="label">Probabilidade de contratação:</span> ${avaliacao.servico1.contrataria}/5</div>
          <div class="info"><span class="label">Potencial de mercado:</span> ${avaliacao.servico1.potencial}/5</div>
          ${avaliacao.servico1.observacoes ? `<div class="observacoes"><span class="label">Observações:</span> ${avaliacao.servico1.observacoes}</div>` : ''}
        </div>
      `;
    }
    
    // Serviço 2
    if (avaliacao.servico2.contrataria > 0 || avaliacao.servico2.potencial > 0) {
      html += `
        <div class="servico">
          <h3>Serviço 2: Relatórios Gerenciais com Leitura de Dados</h3>
          <div class="info"><span class="label">Probabilidade de contratação:</span> ${avaliacao.servico2.contrataria}/5</div>
          <div class="info"><span class="label">Potencial de mercado:</span> ${avaliacao.servico2.potencial}/5</div>
          ${avaliacao.servico2.observacoes ? `<div class="observacoes"><span class="label">Observações:</span> ${avaliacao.servico2.observacoes}</div>` : ''}
        </div>
      `;
    }
    
    // Serviço 3
    if (avaliacao.servico3.contrataria > 0 || avaliacao.servico3.potencial > 0) {
      html += `
        <div class="servico">
          <h3>Serviço 3: Terceirização Financeira Completa</h3>
          <div class="info"><span class="label">Probabilidade de contratação:</span> ${avaliacao.servico3.contrataria}/5</div>
          <div class="info"><span class="label">Potencial de mercado:</span> ${avaliacao.servico3.potencial}/5</div>
          ${avaliacao.servico3.observacoes ? `<div class="observacoes"><span class="label">Observações:</span> ${avaliacao.servico3.observacoes}</div>` : ''}
        </div>
      `;
    }
    
    // Serviço 4
    if (avaliacao.servico4.contrataria > 0 || avaliacao.servico4.potencial > 0) {
      html += `
        <div class="servico">
          <h3>Serviço 4: Aconselhamento Financeiro Estratégico</h3>
          <div class="info"><span class="label">Probabilidade de contratação:</span> ${avaliacao.servico4.contrataria}/5</div>
          <div class="info"><span class="label">Potencial de mercado:</span> ${avaliacao.servico4.potencial}/5</div>
          ${avaliacao.servico4.observacoes ? `<div class="observacoes"><span class="label">Observações:</span> ${avaliacao.servico4.observacoes}</div>` : ''}
        </div>
      `;
    }
    
    html += `</div>`;
  });
  
  html += `
      </body>
    </html>
  `;
  
  return html;
};

// Criar diretório público para arquivos estáticos
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Rota para receber avaliações
app.post('/api/avaliacoes', (req, res) => {
  const avaliacaoData = req.body;
  
  // Validação básica
  if (!avaliacaoData) {
    return res.status(400).json({ success: false, message: 'Dados inválidos' });
  }
  
  try {
    // Salvar em arquivo local
    const fileName = saveToFile(avaliacaoData);
    
    // Gerar HTML atualizado
    const html = generateHtml();
    fs.writeFileSync(path.join(publicDir, 'index.html'), html, 'utf8');
    
    // Responder ao cliente
    res.status(200).json({ 
      success: true, 
      message: 'Avaliação recebida com sucesso! Obrigado pela sua participação.',
      fileName
    });
    
  } catch (error) {
    console.error('Erro ao processar avaliação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar avaliação. Por favor, tente novamente.'
    });
  }
});

// Rota para visualizar avaliações
app.get('/', (req, res) => {
  const html = generateHtml();
  res.send(html);
});

// Rota para download de todas as avaliações
app.get('/download', (req, res) => {
  const consolidatedPath = path.join(avaliacoesDir, 'todas_avaliacoes.json');
  
  if (fs.existsSync(consolidatedPath)) {
    res.download(consolidatedPath, 'avaliacoes_servicos_financeiros.json');
  } else {
    res.status(404).send('Nenhuma avaliação encontrada');
  }
});

// Rota para verificar status do servidor
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'online' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(`Visualize as avaliações em http://0.0.0.0:${PORT}/`);
});

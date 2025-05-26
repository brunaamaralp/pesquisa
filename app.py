from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import json

app = Flask(__name__)
CORS(app)  # Habilita CORS para permitir requisições do frontend

# Configuração para o email
EMAIL_DESTINO = "bruna@lucractive.com"

def formatar_avaliacao_email(dados):
    """Formata os dados da avaliação para o corpo do email"""
    nome_medico = dados.get('nomeMedico', 'Não informado')
    avaliacoes = dados.get('avaliacoes', {})
    
    corpo_email = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            h2 {{ color: #022939; }}
            h3 {{ color: #3458f7; margin-top: 20px; }}
            .avaliacao {{ margin-bottom: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }}
            .campo {{ margin-bottom: 15px; }}
            .label {{ font-weight: bold; }}
            .escala {{ font-size: 18px; font-weight: bold; color: #3458f7; }}
        </style>
    </head>
    <body>
        <h2>Nova Avaliação de Serviços Financeiros</h2>
        <p><strong>Médico Avaliador:</strong> {nome_medico}</p>
        <p><strong>Data:</strong> {os.popen('date').read().strip()}</p>
        
    """
    
    for servico_num in range(1, 5):
        servico_key = f'servico{servico_num}'
        if servico_key in avaliacoes:
            servico_data = avaliacoes[servico_key]
            contrataria = servico_data.get('contrataria', 0)
            potencial = servico_data.get('potencial', 0)
            
            corpo_email += f"""
            <div class="avaliacao">
                <h3>Serviço {servico_num}</h3>
                <div class="campo">
                    <div class="label">Contrataria este serviço:</div>
                    <div class="escala">{contrataria}/5</div>
                </div>
                <div class="campo">
                    <div class="label">Potencial de mercado:</div>
                    <div class="escala">{potencial}/5</div>
                </div>
                <div class="campo">
                    <div class="label">Observações:</div>
                    <div>{servico_data.get('observacoes', 'Nenhuma observação')}</div>
                </div>
            </div>
            """
    
    corpo_email += """
    </body>
    </html>
    """
    
    return corpo_email

def enviar_email(destinatario, assunto, corpo_html, nome_medico):
    """Função para enviar email usando SMTP"""
    try:
        # Em um ambiente de produção, você usaria credenciais reais e um servidor SMTP
        # Como estamos em um ambiente de demonstração, apenas simulamos o envio
        
        # Registrar a tentativa de envio em um arquivo de log
        with open('email_log.txt', 'a') as log_file:
            log_file.write(f"Tentativa de envio para: {destinatario}\n")
            log_file.write(f"Assunto: {assunto}\n")
            log_file.write(f"De: {nome_medico}\n")
            log_file.write(f"Conteúdo: {corpo_html[:100]}...\n")
            log_file.write("-" * 50 + "\n")
        
        # Em produção, você usaria código como este:
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = assunto
        msg['From'] = "sistema@lucractive.com"
        msg['To'] = destinatario
        
        parte_html = MIMEText(corpo_html, 'html')
        msg.attach(parte_html)
        
        server = smtplib.SMTP('smtp.seuservidor.com', 587)
        server.starttls()
        server.login('seu_email@dominio.com', 'sua_senha')
        server.send_message(msg)
        server.quit()
        """
        
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {str(e)}")
        return False

@app.route('/api/enviar-avaliacao', methods=['POST'])
def receber_avaliacao():
    """Endpoint para receber avaliações do frontend"""
    try:
        dados = request.json
        
        # Validar dados recebidos
        if not dados or 'avaliacoes' not in dados:
            return jsonify({'sucesso': False, 'mensagem': 'Dados de avaliação inválidos'}), 400
        
        nome_medico = dados.get('nomeMedico', 'Médico não identificado')
        
        # Formatar e enviar email
        corpo_email = formatar_avaliacao_email(dados)
        assunto = f"Nova Avaliação de Serviços - {nome_medico}"
        
        # Salvar a avaliação em um arquivo JSON (backup)
        timestamp = os.popen('date +%Y%m%d_%H%M%S').read().strip()
        nome_arquivo = f"avaliacao_{timestamp}.json"
        
        with open(nome_arquivo, 'w') as f:
            json.dump(dados, f, indent=2)
        
        # Enviar email
        sucesso = enviar_email(EMAIL_DESTINO, assunto, corpo_email, nome_medico)
        
        if sucesso:
            return jsonify({
                'sucesso': True, 
                'mensagem': f'Avaliação enviada com sucesso para {EMAIL_DESTINO}'
            })
        else:
            return jsonify({
                'sucesso': False, 
                'mensagem': 'Erro ao enviar a avaliação. Tente novamente mais tarde.'
            }), 500
            
    except Exception as e:
        return jsonify({'sucesso': False, 'mensagem': f'Erro: {str(e)}'}), 500

if __name__ == '__main__':
    # Criar arquivo de log se não existir
    if not os.path.exists('email_log.txt'):
        with open('email_log.txt', 'w') as f:
            f.write("Log de Emails - Avaliações de Serviços\n")
            f.write("=" * 50 + "\n")
    
    # Em produção, você não usaria debug=True
    app.run(host='0.0.0.0', port=5000, debug=True)

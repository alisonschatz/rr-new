// lib/telegram.js - SISTEMA DE NOTIFICAÇÕES TELEGRAM
// VERSÃO FINAL FUNCIONAL - ESCRITO DO ZERO

// ========== CONFIGURAÇÕES ==========
const BOT_TOKEN = '7718018841:AAFiSbC6eLFcDQ1PBPl4STjArVPpK4lz1qg';
const CHAT_ID = '-1002528864327';
const API_BASE = 'https://api.telegram.org/bot';

// ========== UTILITÁRIOS ==========
const formatMoney = (value) => {
  if (!value) return '0.00';
  return parseFloat(value).toFixed(2);
};

const getCurrentTime = () => {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
};

// ========== FUNÇÃO BASE ==========
const sendTelegramMessage = async (message) => {
  console.log('=== ENVIO TELEGRAM ===');
  console.log('Mensagem:', message);
  console.log('Chat ID:', CHAT_ID);
  
  try {
    const url = `${API_BASE}${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Resposta:', result);
    
    if (response.ok && result.ok) {
      console.log('✅ MENSAGEM ENVIADA COM SUCESSO');
      return true;
    } else {
      console.error('❌ ERRO NA RESPOSTA:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ ERRO DE REDE:', error);
    return false;
  }
};

// ========== NOTIFICAÇÃO DE DEPÓSITO ==========
export const sendDepositNotification = async (data, id) => {
  console.log('💰 INICIANDO NOTIFICAÇÃO DE DEPÓSITO');
  console.log('💰 Dados recebidos:', data);
  console.log('💰 ID recebido:', id);
  
  if (!data || !id) {
    console.error('❌ Dados inválidos para depósito');
    return false;
  }

  const message = `🔔 NOVO DEPOSITO

👤 Cliente: ${data.userName || 'N/A'}
📧 Email: ${data.userEmail || 'N/A'}
💰 Valor: $${formatMoney(data.amount)}
📝 Descricao: ${data.description || 'Sem descricao'}
🆔 ID: ${id.substring(0, 10)}
⏰ Horario: ${getCurrentTime()}

Acesse o painel admin para aprovar ou rejeitar.

#deposito #pendente #admin`;

  console.log('💰 Enviando mensagem...');
  const success = await sendTelegramMessage(message);
  console.log('💰 Resultado:', success ? 'SUCESSO' : 'FALHA');
  
  return success;
};

// ========== NOTIFICAÇÃO DE VERIFICAÇÃO ==========
export const sendProfileVerificationRequest = async (data, id) => {
  console.log('🛡️ INICIANDO NOTIFICAÇÃO DE VERIFICAÇÃO');
  console.log('🛡️ Dados recebidos:', data);
  console.log('🛡️ ID recebido:', id);
  
  if (!data || !id) {
    console.error('❌ Dados inválidos para verificação');
    return false;
  }

  const message = `🛡️ NOVA VERIFICACAO

👤 Usuario: ${data.userName || 'N/A'}
📧 Email: ${data.userEmail || 'N/A'}
📱 Telegram: ${data.telegramNumber || 'N/A'}
🎮 Rival Regions: ${data.rivalRegionsLink || 'N/A'}
🆔 ID Solicitacao: ${id.substring(0, 10)}
👤 ID Usuario: ${data.userId ? data.userId.substring(0, 10) : 'N/A'}
⏰ Horario: ${getCurrentTime()}

Dados para verificacao:
✅ Nome preenchido
✅ Telegram informado  
✅ Rival Regions vinculado

Acesse o painel admin para aprovar ou rejeitar.

#verificacao #pendente #admin`;

  console.log('🛡️ Enviando mensagem...');
  const success = await sendTelegramMessage(message);
  console.log('🛡️ Resultado:', success ? 'SUCESSO' : 'FALHA');
  
  return success;
};

// ========== APROVAÇÃO DE DEPÓSITO ==========
export const sendDepositApprovedNotification = async (data, id) => {
  console.log('✅ INICIANDO NOTIFICAÇÃO DE APROVAÇÃO DE DEPÓSITO');
  
  if (!data || !id) {
    console.error('❌ Dados inválidos');
    return false;
  }

  const message = `✅ DEPOSITO APROVADO

👤 Cliente: ${data.userName || 'N/A'}
💰 Valor: $${formatMoney(data.amount)}
🆔 ID: ${id.substring(0, 10)}
⏰ Aprovado em: ${getCurrentTime()}

💳 Saldo creditado com sucesso!

#deposito #aprovado #sucesso`;

  const success = await sendTelegramMessage(message);
  console.log('✅ Resultado aprovação:', success ? 'SUCESSO' : 'FALHA');
  
  return success;
};

// ========== REJEIÇÃO DE DEPÓSITO ==========
export const sendDepositRejectedNotification = async (data, id, reason) => {
  console.log('❌ INICIANDO NOTIFICAÇÃO DE REJEIÇÃO DE DEPÓSITO');
  
  if (!data || !id) {
    console.error('❌ Dados inválidos');
    return false;
  }

  const message = `❌ DEPOSITO REJEITADO

👤 Cliente: ${data.userName || 'N/A'}
💰 Valor: $${formatMoney(data.amount)}
📝 Motivo: ${reason || 'Nao especificado'}
🆔 ID: ${id.substring(0, 10)}
⏰ Rejeitado em: ${getCurrentTime()}

#deposito #rejeitado`;

  const success = await sendTelegramMessage(message);
  console.log('❌ Resultado rejeição:', success ? 'SUCESSO' : 'FALHA');
  
  return success;
};

// ========== APROVAÇÃO DE VERIFICAÇÃO ==========
export const sendProfileVerificationApproved = async (data, id) => {
  console.log('✅ INICIANDO NOTIFICAÇÃO DE APROVAÇÃO DE VERIFICAÇÃO');
  
  if (!data || !id) {
    console.error('❌ Dados inválidos');
    return false;
  }

  const message = `✅ VERIFICACAO APROVADA

👤 Usuario: ${data.userName || 'N/A'}
🛡️ Status: PERFIL VERIFICADO
🆔 ID: ${id.substring(0, 10)}
⏰ Aprovado em: ${getCurrentTime()}

🎉 O usuario agora possui o selo de verificacao!

#verificacao #aprovada #selo`;

  const success = await sendTelegramMessage(message);
  console.log('✅ Resultado aprovação verificação:', success ? 'SUCESSO' : 'FALHA');
  
  return success;
};

// ========== REJEIÇÃO DE VERIFICAÇÃO ==========
export const sendProfileVerificationRejected = async (data, id, reason) => {
  console.log('❌ INICIANDO NOTIFICAÇÃO DE REJEIÇÃO DE VERIFICAÇÃO');
  
  if (!data || !id) {
    console.error('❌ Dados inválidos');
    return false;
  }

  const message = `❌ VERIFICACAO REJEITADA

👤 Usuario: ${data.userName || 'N/A'}
📝 Motivo: ${reason || 'Nao especificado'}
🆔 ID: ${id.substring(0, 10)}
⏰ Rejeitado em: ${getCurrentTime()}

ℹ️ O usuario pode corrigir e solicitar novamente.

#verificacao #rejeitada`;

  const success = await sendTelegramMessage(message);
  console.log('❌ Resultado rejeição verificação:', success ? 'SUCESSO' : 'FALHA');
  
  return success;
};

// ========== TESTE BÁSICO ==========
export const testTelegramBot = async () => {
  console.log('🧪 INICIANDO TESTE DO BOT');
  
  const message = `🤖 TESTE DO BOT RR EXCHANGE

✅ Bot configurado e funcionando
⏰ Horario: ${getCurrentTime()}
🚀 Sistema: RR Exchange
📱 Grupo: Funcionando

Todas as notificacoes estao ativas:
• Depositos
• Verificacoes  
• Aprovacoes
• Rejeicoes

#teste #bot #funcionando`;

  const success = await sendTelegramMessage(message);
  console.log('🧪 Resultado do teste:', success ? 'SUCESSO' : 'FALHA');
  
  return success;
};

// ========== VERIFICAR CONFIGURAÇÃO ==========
export const isTelegramConfigured = () => {
  const configured = !!(BOT_TOKEN && CHAT_ID && BOT_TOKEN.length > 10);
  console.log('🔧 Telegram configurado:', configured);
  return configured;
};

// ========== INFORMAÇÕES DO BOT ==========
export const getTelegramInfo = () => {
  return {
    hasToken: !!BOT_TOKEN,
    hasChatId: !!CHAT_ID,
    configured: isTelegramConfigured(),
    chatId: CHAT_ID,
    tokenPrefix: BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'N/A'
  };
};

// ========== LOGS INICIAIS ==========
console.log('📱 TELEGRAM.JS CARREGADO');
console.log('🔧 Configuração:', getTelegramInfo());

// ========== EXPORTS ADICIONAIS ==========
export default {
  sendDepositNotification,
  sendProfileVerificationRequest,
  sendDepositApprovedNotification,
  sendDepositRejectedNotification,
  sendProfileVerificationApproved,
  sendProfileVerificationRejected,
  testTelegramBot,
  isTelegramConfigured,
  getTelegramInfo
};

// ========== NOTAS DE DEBUG ==========
/*
PARA DEBUGAR:
1. Verifique se BOT_TOKEN e CHAT_ID estão corretos
2. Teste com testTelegramBot() primeiro
3. Verifique os logs no console
4. Confirme que o bot está no grupo
5. Verifique se não há bloqueios de CORS

FORMATO DAS MENSAGENS:
- Sem Markdown para evitar erros de parsing
- Caracteres especiais removidos (ã, ç, etc.)
- Emojis mantidos para identificação visual
- Hashtags para organização no grupo

ESTRUTURA DOS DADOS:
depositData = {
  userName: string,
  userEmail: string,
  amount: number,
  description: string
}

verificationData = {
  userName: string,
  userEmail: string,
  telegramNumber: string,
  rivalRegionsLink: string,
  userId: string
}
*/
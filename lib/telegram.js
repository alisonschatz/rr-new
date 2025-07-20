// lib/telegram.js - Utilitários para notificações do Telegram

// CONFIGURAÇÕES DO BOT - CONFIGURADO E PRONTO PARA USO
const TELEGRAM_CONFIG = {
  BOT_TOKEN: '7718018841:AAFiSbC6eLFcDQ1PBPl4STjArVPpK4lz1qg',
  ADMIN_CHAT_ID: '7571418194', // Seu Chat ID
  API_URL: 'https://api.telegram.org/bot'
};

// Formatação de dinheiro para mensagem
const formatMoney = (number) => {
  if (!number || number === 0) return '0.00';
  const num = Math.abs(number);
  if (num >= 1000000000000000000) return (num / 1000000000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkkkk';
  if (num >= 1000000000000000) return (num / 1000000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkkk';
  if (num >= 1000000000000) return (num / 1000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkk';
  if (num >= 1000000000) return (num / 1000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkk';
  if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkk';
  if (num >= 1000) return (num / 1000).toFixed(2).replace(/\.?0+$/, '') + 'kkk';
  if (num >= 1) return (num).toFixed(2).replace(/\.?0+$/, '') + 'kk';
  return num.toFixed(2);
};

/**
 * Envia notificação de nova solicitação de depósito para o Telegram
 * @param {Object} depositData - Dados da solicitação de depósito
 * @param {string} depositId - ID da solicitação criada
 */
export const sendDepositNotification = async (depositData, depositId) => {
  try {
    console.log('📱 Enviando notificação para Telegram...');

    // Verificar se as configurações estão definidas
    if (!TELEGRAM_CONFIG.BOT_TOKEN || TELEGRAM_CONFIG.BOT_TOKEN === 'SEU_BOT_TOKEN_AQUI') {
      console.warn('⚠️ Token do bot não configurado - notificação não enviada');
      return false;
    }

    if (!TELEGRAM_CONFIG.ADMIN_CHAT_ID || TELEGRAM_CONFIG.ADMIN_CHAT_ID === 'SEU_CHAT_ID_AQUI') {
      console.warn('⚠️ Chat ID não configurado - notificação não enviada');
      return false;
    }

    // Construir a mensagem
    const message = `
🔔 *NOVA SOLICITAÇÃO DE DEPÓSITO*

👤 *Nome:* ${depositData.userName || 'N/A'}
📧 *Email:* ${depositData.userEmail || 'N/A'}
💰 *Valor:* $ ${formatMoney(depositData.amount)}
📝 *Descrição:* ${depositData.description || 'Sem descrição'}

🆔 *ID:* \`${depositId.substring(0, 8)}...\`
⏰ *Data:* ${new Date().toLocaleString('pt-BR')}

🔗 [Acessar Painel Admin](${window.location.origin}/admin/deposits)

⚡ *Ação necessária:* Aprovar ou rejeitar esta solicitação
`.trim();

    // Dados para envio
    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };

    // Enviar para API do Telegram
    const response = await fetch(
      `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.ok) {
        console.log('✅ Notificação enviada para Telegram com sucesso!');
        return true;
      } else {
        console.error('❌ Erro na resposta do Telegram:', result);
        return false;
      }
    } else {
      console.error('❌ Erro HTTP ao enviar para Telegram:', response.status);
      return false;
    }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação para Telegram:', error);
    return false;
  }
};

/**
 * Envia notificação quando um depósito é aprovado
 * @param {Object} depositData - Dados da solicitação aprovada
 * @param {string} depositId - ID da solicitação
 */
export const sendDepositApprovedNotification = async (depositData, depositId) => {
  try {
    if (!TELEGRAM_CONFIG.BOT_TOKEN || !TELEGRAM_CONFIG.ADMIN_CHAT_ID) {
      return false;
    }

    const message = `
✅ *DEPÓSITO APROVADO*

👤 *Cliente:* ${depositData.userName || 'N/A'}
💰 *Valor:* $ ${formatMoney(depositData.amount)}
🆔 *ID:* \`${depositId.substring(0, 8)}...\`
⏰ *Aprovado em:* ${new Date().toLocaleString('pt-BR')}

💳 *Saldo creditado com sucesso!*
`.trim();

    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    };

    const response = await fetch(
      `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    return response.ok;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de aprovação:', error);
    return false;
  }
};

/**
 * Envia notificação quando um depósito é rejeitado
 * @param {Object} depositData - Dados da solicitação rejeitada
 * @param {string} depositId - ID da solicitação
 * @param {string} reason - Motivo da rejeição
 */
export const sendDepositRejectedNotification = async (depositData, depositId, reason) => {
  try {
    if (!TELEGRAM_CONFIG.BOT_TOKEN || !TELEGRAM_CONFIG.ADMIN_CHAT_ID) {
      return false;
    }

    const message = `
❌ *DEPÓSITO REJEITADO*

👤 *Cliente:* ${depositData.userName || 'N/A'}
💰 *Valor:* $ ${formatMoney(depositData.amount)}
🆔 *ID:* \`${depositId.substring(0, 8)}...\`
⏰ *Rejeitado em:* ${new Date().toLocaleString('pt-BR')}
📝 *Motivo:* ${reason || 'Não especificado'}
`.trim();

    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    };

    const response = await fetch(
      `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    return response.ok;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de rejeição:', error);
    return false;
  }
};

/**
 * Testa a configuração do bot enviando uma mensagem de teste
 */
export const testTelegramBot = async () => {
  try {
    const message = `
🤖 *TESTE DO BOT RR EXCHANGE*

✅ Bot configurado corretamente!
⏰ ${new Date().toLocaleString('pt-BR')}

O sistema de notificações está funcionando.
`.trim();

    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    };

    const response = await fetch(
      `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (response.ok) {
      console.log('✅ Teste do bot realizado com sucesso!');
      return true;
    } else {
      console.error('❌ Falha no teste do bot');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste do bot:', error);
    return false;
  }
};
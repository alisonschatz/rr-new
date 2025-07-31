// lib/telegram.js - CONFIGURADO PARA GRUPO
// CONFIGURAÇÕES DO BOT - CONFIGURADO PARA SEU GRUPO
const TELEGRAM_CONFIG = {
  BOT_TOKEN: '7718018841:AAFiSbC6eLFcDQ1PBPl4STjArVPpK4lz1qg',
  ADMIN_CHAT_ID: '-4930516548', // Chat ID do grupo "Alison e RR Exchange ADMIN Bot"
  API_URL: 'https://api.telegram.org/bot',
  // CONFIGURAÇÕES ESPECÍFICAS PARA GRUPO
  GROUP_CONFIG: {
    DISABLE_NOTIFICATION: false, // Manter notificações ativas
    PARSE_MODE: 'Markdown',
    DISABLE_WEB_PAGE_PREVIEW: true
  }
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
 * Envia notificação de nova solicitação de depósito para o GRUPO Telegram
 */
export const sendDepositNotification = async (depositData, depositId) => {
  try {
    console.log('📱 Enviando notificação para GRUPO Telegram...');

    if (!TELEGRAM_CONFIG.BOT_TOKEN || TELEGRAM_CONFIG.BOT_TOKEN === 'SEU_BOT_TOKEN_AQUI') {
      console.warn('⚠️ Token do bot não configurado');
      return false;
    }

    if (!TELEGRAM_CONFIG.ADMIN_CHAT_ID || TELEGRAM_CONFIG.ADMIN_CHAT_ID === 'SEU_CHAT_ID_DO_GRUPO_AQUI') {
      console.warn('⚠️ Chat ID do grupo não configurado');
      return false;
    }

    // Mensagem otimizada para grupo
    const message = `
🔔 *NOVA SOLICITAÇÃO DE DEPÓSITO*

👤 *Cliente:* ${depositData.userName || 'N/A'}
📧 *Email:* ${depositData.userEmail || 'N/A'}
💰 *Valor:* $ ${formatMoney(depositData.amount)}
📝 *Descrição:* ${depositData.description || 'Sem descrição'}

🆔 *ID:* \`${depositId.substring(0, 8)}...\`
⏰ *Solicitado em:* ${new Date().toLocaleString('pt-BR')}

🔗 [Acessar Painel Admin](${window.location.origin}/admin/deposits)

⚡ *Ação necessária:* Algum admin precisa aprovar ou rejeitar

#depósito #pendente #admin
`.trim();

    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message,
      parse_mode: TELEGRAM_CONFIG.GROUP_CONFIG.PARSE_MODE,
      disable_web_page_preview: TELEGRAM_CONFIG.GROUP_CONFIG.DISABLE_WEB_PAGE_PREVIEW,
      disable_notification: TELEGRAM_CONFIG.GROUP_CONFIG.DISABLE_NOTIFICATION
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
      const result = await response.json();
      if (result.ok) {
        console.log('✅ Notificação enviada para GRUPO Telegram!');
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
    console.error('❌ Erro ao enviar notificação:', error);
    return false;
  }
};

/**
 * Envia notificação quando um depósito é aprovado - PARA GRUPO
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

#depósito #aprovado #sucesso
`.trim();

    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message,
      parse_mode: TELEGRAM_CONFIG.GROUP_CONFIG.PARSE_MODE,
      disable_notification: TELEGRAM_CONFIG.GROUP_CONFIG.DISABLE_NOTIFICATION
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
 * Envia notificação quando um depósito é rejeitado - PARA GRUPO
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

#depósito #rejeitado
`.trim();

    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message,
      parse_mode: TELEGRAM_CONFIG.GROUP_CONFIG.PARSE_MODE,
      disable_notification: TELEGRAM_CONFIG.GROUP_CONFIG.DISABLE_NOTIFICATION
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
 * Testa o bot enviando mensagem para o GRUPO
 */
export const testTelegramBot = async () => {
  try {
    const message = `
🤖 *TESTE DO BOT RR EXCHANGE*

✅ Bot configurado corretamente para o GRUPO!
⏰ ${new Date().toLocaleString('pt-BR')}

O sistema de notificações está funcionando.
Todos os admins do grupo receberão alertas.

#teste #bot #funcionando
`.trim();

    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message,
      parse_mode: TELEGRAM_CONFIG.GROUP_CONFIG.PARSE_MODE,
      disable_notification: false // Notificar no teste
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
      console.log('✅ Teste do bot no GRUPO realizado com sucesso!');
      return true;
    } else {
      console.error('❌ Falha no teste do bot no grupo');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste do bot:', error);
    return false;
  }
};
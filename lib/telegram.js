// lib/telegram.js - SISTEMA COMPLETO DE NOTIFICAÇÕES TELEGRAM
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

// Formatação de dinheiro para mensagens
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

// Função base para enviar mensagens
const sendTelegramMessage = async (message, options = {}) => {
  try {
    if (!TELEGRAM_CONFIG.BOT_TOKEN || TELEGRAM_CONFIG.BOT_TOKEN === 'SEU_BOT_TOKEN_AQUI') {
      console.warn('⚠️ Token do bot não configurado');
      return false;
    }

    if (!TELEGRAM_CONFIG.ADMIN_CHAT_ID || TELEGRAM_CONFIG.ADMIN_CHAT_ID === 'SEU_CHAT_ID_DO_GRUPO_AQUI') {
      console.warn('⚠️ Chat ID do grupo não configurado');
      return false;
    }

    const payload = {
      chat_id: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
      text: message.trim(),
      parse_mode: TELEGRAM_CONFIG.GROUP_CONFIG.PARSE_MODE,
      disable_web_page_preview: TELEGRAM_CONFIG.GROUP_CONFIG.DISABLE_WEB_PAGE_PREVIEW,
      disable_notification: options.silent || TELEGRAM_CONFIG.GROUP_CONFIG.DISABLE_NOTIFICATION,
      ...options
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
    console.error('❌ Erro ao enviar mensagem Telegram:', error);
    return false;
  }
};

// ========== NOTIFICAÇÕES DE DEPÓSITO ==========

/**
 * Envia notificação de nova solicitação de depósito para o GRUPO Telegram
 */
export const sendDepositNotification = async (depositData, depositId) => {
  try {
    console.log('📱 Enviando notificação de depósito para Telegram...');

    const message = `
🔔 *NOVA SOLICITAÇÃO DE DEPÓSITO*

👤 *Cliente:* ${depositData.userName || 'N/A'}
📧 *Email:* ${depositData.userEmail || 'N/A'}
💰 *Valor:* $ ${formatMoney(depositData.amount)}
📝 *Descrição:* ${depositData.description || 'Sem descrição'}

🆔 *ID:* \`${depositId.substring(0, 8)}...\`
⏰ *Solicitado em:* ${new Date().toLocaleString('pt-BR')}

🔗 [Acessar Painel Admin](${typeof window !== 'undefined' ? window.location.origin : ''}/admin/deposits)

⚡ *Ação necessária:* Algum admin precisa aprovar ou rejeitar

#depósito #pendente #admin
`;

    const success = await sendTelegramMessage(message);
    
    if (success) {
      console.log('✅ Notificação de depósito enviada para Telegram!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de depósito:', error);
    return false;
  }
};

/**
 * Envia notificação quando um depósito é aprovado
 */
export const sendDepositApprovedNotification = async (depositData, depositId) => {
  try {
    console.log('📱 Enviando notificação de aprovação de depósito...');

    const message = `
✅ *DEPÓSITO APROVADO*

👤 *Cliente:* ${depositData.userName || 'N/A'}
💰 *Valor:* $ ${formatMoney(depositData.amount)}
🆔 *ID:* \`${depositId.substring(0, 8)}...\`
⏰ *Aprovado em:* ${new Date().toLocaleString('pt-BR')}

💳 *Saldo creditado com sucesso!*

#depósito #aprovado #sucesso
`;

    const success = await sendTelegramMessage(message);
    
    if (success) {
      console.log('✅ Notificação de aprovação enviada para Telegram!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de aprovação:', error);
    return false;
  }
};

/**
 * Envia notificação quando um depósito é rejeitado
 */
export const sendDepositRejectedNotification = async (depositData, depositId, reason) => {
  try {
    console.log('📱 Enviando notificação de rejeição de depósito...');

    const message = `
❌ *DEPÓSITO REJEITADO*

👤 *Cliente:* ${depositData.userName || 'N/A'}
💰 *Valor:* $ ${formatMoney(depositData.amount)}
🆔 *ID:* \`${depositId.substring(0, 8)}...\`
⏰ *Rejeitado em:* ${new Date().toLocaleString('pt-BR')}
📝 *Motivo:* ${reason || 'Não especificado'}

#depósito #rejeitado
`;

    const success = await sendTelegramMessage(message);
    
    if (success) {
      console.log('✅ Notificação de rejeição enviada para Telegram!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de rejeição:', error);
    return false;
  }
};

// ========== NOTIFICAÇÕES DE VERIFICAÇÃO DE PERFIL ==========

/**
 * Envia notificação de nova solicitação de verificação de perfil
 */
export const sendProfileVerificationRequest = async (userData, requestId) => {
  try {
    console.log('🛡️ Enviando solicitação de verificação para Telegram...');

    const message = `
🛡️ *NOVA SOLICITAÇÃO DE VERIFICAÇÃO*

👤 *Usuário:* ${userData.userName || 'N/A'}
📧 *Email:* ${userData.userEmail || 'N/A'}
📱 *Telegram:* ${userData.telegramNumber || 'N/A'}
🎮 *Rival Regions:* [Ver Perfil](${userData.rivalRegionsLink || '#'})

🆔 *ID da Solicitação:* \`${requestId.substring(0, 8)}...\`
👤 *ID do Usuário:* \`${userData.userId.substring(0, 8)}...\`
⏰ *Solicitado em:* ${new Date().toLocaleString('pt-BR')}

📋 *Dados para Verificação:*
• ✅ Nome preenchido
• ✅ Telegram informado
• ✅ Rival Regions vinculado

🔗 [Gerenciar Verificações](${typeof window !== 'undefined' ? window.location.origin : ''}/admin/verifications)

⚡ *Ação necessária:* Verificar dados e aprovar/rejeitar

#verificação #perfil #pendente #admin
`;

    const success = await sendTelegramMessage(message);
    
    if (success) {
      console.log('✅ Solicitação de verificação enviada para Telegram!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de verificação:', error);
    return false;
  }
};

/**
 * Envia notificação quando uma verificação é aprovada
 */
export const sendProfileVerificationApproved = async (userData, requestId) => {
  try {
    console.log('📱 Enviando notificação de aprovação de verificação...');

    const message = `
✅ *VERIFICAÇÃO DE PERFIL APROVADA*

👤 *Usuário:* ${userData.userName || 'N/A'}
🛡️ *Status:* PERFIL VERIFICADO
🆔 *ID:* \`${requestId.substring(0, 8)}...\`
⏰ *Aprovado em:* ${new Date().toLocaleString('pt-BR')}

🎉 *O usuário agora possui o selo de verificação!*

#verificação #aprovada #selo #verificado
`;

    const success = await sendTelegramMessage(message);
    
    if (success) {
      console.log('✅ Notificação de aprovação de verificação enviada!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de aprovação de verificação:', error);
    return false;
  }
};

/**
 * Envia notificação quando uma verificação é rejeitada
 */
export const sendProfileVerificationRejected = async (userData, requestId, reason) => {
  try {
    console.log('📱 Enviando notificação de rejeição de verificação...');

    const message = `
❌ *VERIFICAÇÃO DE PERFIL REJEITADA*

👤 *Usuário:* ${userData.userName || 'N/A'}
🆔 *ID:* \`${requestId.substring(0, 8)}...\`
⏰ *Rejeitado em:* ${new Date().toLocaleString('pt-BR')}
📝 *Motivo:* ${reason || 'Não especificado'}

ℹ️ *O usuário pode corrigir e solicitar novamente*

#verificação #rejeitada
`;

    const success = await sendTelegramMessage(message);
    
    if (success) {
      console.log('✅ Notificação de rejeição de verificação enviada!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de rejeição de verificação:', error);
    return false;
  }
};

// ========== NOTIFICAÇÕES DE TRADING (FUTURAS) ==========

/**
 * Envia notificação quando há uma grande transação no marketplace
 */
export const sendLargeTransactionNotification = async (transactionData) => {
  try {
    console.log('💰 Enviando notificação de transação grande...');

    const message = `
💰 *TRANSAÇÃO DE ALTO VALOR*

🎯 *Recurso:* ${transactionData.resource}
📦 *Quantidade:* ${formatMoney(transactionData.quantity)}
💵 *Valor Total:* $ ${formatMoney(transactionData.totalValue)}
💲 *Preço Unitário:* $ ${formatMoney(transactionData.pricePerUnit)}

👤 *Comprador:* ${transactionData.buyerName || 'N/A'}
🏪 *Vendedor:* ${transactionData.sellerName || 'N/A'}

⏰ *Realizada em:* ${new Date().toLocaleString('pt-BR')}

#transação #marketplace #alto_valor
`;

    const success = await sendTelegramMessage(message, { silent: true });
    
    if (success) {
      console.log('✅ Notificação de transação grande enviada!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de transação:', error);
    return false;
  }
};

// ========== NOTIFICAÇÕES DO SISTEMA ==========

/**
 * Envia notificação de erro crítico do sistema
 */
export const sendSystemErrorNotification = async (errorData) => {
  try {
    console.log('🚨 Enviando notificação de erro do sistema...');

    const message = `
🚨 *ERRO CRÍTICO DO SISTEMA*

⚠️ *Tipo:* ${errorData.type || 'Erro Desconhecido'}
📍 *Local:* ${errorData.location || 'N/A'}
📝 *Descrição:* ${errorData.message || 'Sem descrição'}

🕐 *Ocorrido em:* ${new Date().toLocaleString('pt-BR')}
🆔 *ID do Erro:* \`${errorData.errorId || 'N/A'}\`

⚡ *Ação necessária:* Verificar sistema imediatamente

#sistema #erro #crítico #urgente
`;

    const success = await sendTelegramMessage(message);
    
    if (success) {
      console.log('✅ Notificação de erro do sistema enviada!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de erro do sistema:', error);
    return false;
  }
};

/**
 * Envia notificação quando um novo usuário se registra
 */
export const sendNewUserNotification = async (userData) => {
  try {
    console.log('👋 Enviando notificação de novo usuário...');

    const message = `
👋 *NOVO USUÁRIO REGISTRADO*

👤 *Nome:* ${userData.name || 'N/A'}
📧 *Email:* ${userData.email || 'N/A'}
🕐 *Registrado em:* ${new Date().toLocaleString('pt-BR')}
🔗 *Método:* ${userData.loginMethod || 'Google'}

📊 *Total de usuários aumentou!*

#novo_usuário #registro #crescimento
`;

    const success = await sendTelegramMessage(message, { silent: true });
    
    if (success) {
      console.log('✅ Notificação de novo usuário enviada!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de novo usuário:', error);
    return false;
  }
};

// ========== FUNÇÕES DE TESTE ==========

/**
 * Testa o bot enviando mensagem para o GRUPO
 */
export const testTelegramBot = async () => {
  try {
    console.log('🧪 Testando bot do Telegram...');

    const message = `
🤖 *TESTE DO BOT RR EXCHANGE*

✅ Bot configurado corretamente para o GRUPO!
⏰ ${new Date().toLocaleString('pt-BR')}

🔧 *Funcionalidades Ativas:*
• 💰 Notificações de depósito
• 🛡️ Notificações de verificação
• 🚨 Alertas do sistema
• 📊 Relatórios automáticos

O sistema de notificações está funcionando.
Todos os admins do grupo receberão alertas.

#teste #bot #funcionando #sistema_ok
`;

    const success = await sendTelegramMessage(message, { silent: false });
    
    if (success) {
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

/**
 * Envia relatório diário para o grupo (função futura)
 */
export const sendDailyReport = async (reportData) => {
  try {
    console.log('📊 Enviando relatório diário...');

    const message = `
📊 *RELATÓRIO DIÁRIO RR EXCHANGE*

📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}

👥 *Usuários:*
• Novos registros: ${reportData.newUsers || 0}
• Total de usuários: ${reportData.totalUsers || 0}
• Perfis verificados: ${reportData.verifiedUsers || 0}

💰 *Depósitos:*
• Solicitações: ${reportData.depositRequests || 0}
• Aprovados: ${reportData.approvedDeposits || 0}
• Valor total: $ ${formatMoney(reportData.totalDeposited || 0)}

🛍️ *Marketplace:*
• Transações: ${reportData.transactions || 0}
• Volume negociado: $ ${formatMoney(reportData.tradingVolume || 0)}
• Ordens ativas: ${reportData.activeOrders || 0}

🛡️ *Verificações:*
• Solicitações: ${reportData.verificationRequests || 0}
• Aprovadas: ${reportData.approvedVerifications || 0}

#relatório #diário #estatísticas
`;

    const success = await sendTelegramMessage(message, { silent: true });
    
    if (success) {
      console.log('✅ Relatório diário enviado!');
    }
    
    return success;

  } catch (error) {
    console.error('❌ Erro ao enviar relatório diário:', error);
    return false;
  }
};

// ========== CONFIGURAÇÕES E UTILITÁRIOS ==========

/**
 * Verifica se o bot está configurado corretamente
 */
export const isTelegramConfigured = () => {
  return !!(
    TELEGRAM_CONFIG.BOT_TOKEN && 
    TELEGRAM_CONFIG.BOT_TOKEN !== 'SEU_BOT_TOKEN_AQUI' &&
    TELEGRAM_CONFIG.ADMIN_CHAT_ID && 
    TELEGRAM_CONFIG.ADMIN_CHAT_ID !== 'SEU_CHAT_ID_DO_GRUPO_AQUI'
  );
};

/**
 * Obtém informações sobre o bot
 */
export const getBotInfo = async () => {
  try {
    if (!isTelegramConfigured()) {
      return { configured: false, error: 'Bot não configurado' };
    }

    const response = await fetch(
      `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/getMe`
    );

    if (response.ok) {
      const result = await response.json();
      return {
        configured: true,
        botInfo: result.result,
        chatId: TELEGRAM_CONFIG.ADMIN_CHAT_ID
      };
    } else {
      return { configured: false, error: 'Falha ao conectar com o bot' };
    }

  } catch (error) {
    return { configured: false, error: error.message };
  }
};

// Exportar configurações para uso externo se necessário
export const TELEGRAM_SETTINGS = {
  isConfigured: isTelegramConfigured(),
  chatId: TELEGRAM_CONFIG.ADMIN_CHAT_ID,
  botToken: TELEGRAM_CONFIG.BOT_TOKEN ? 'Configurado' : 'Não configurado'
};

// ========== LOGS E DEBUG ==========

/**
 * Log das configurações do Telegram (sem expor dados sensíveis)
 */
export const logTelegramConfig = () => {
  console.log('📱 Configurações do Telegram:', {
    botConfigured: !!TELEGRAM_CONFIG.BOT_TOKEN && TELEGRAM_CONFIG.BOT_TOKEN !== 'SEU_BOT_TOKEN_AQUI',
    chatConfigured: !!TELEGRAM_CONFIG.ADMIN_CHAT_ID && TELEGRAM_CONFIG.ADMIN_CHAT_ID !== 'SEU_CHAT_ID_DO_GRUPO_AQUI',
    notificationsEnabled: !TELEGRAM_CONFIG.GROUP_CONFIG.DISABLE_NOTIFICATION,
    parseMode: TELEGRAM_CONFIG.GROUP_CONFIG.PARSE_MODE
  });
};

// Log automático quando o módulo é carregado
if (typeof window === 'undefined') { // Apenas no servidor
  logTelegramConfig();
}
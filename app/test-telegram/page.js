// app/test-telegram/page.js - PÁGINA PARA TESTAR TELEGRAM
'use client';

import { useState } from 'react';
import { 
  testTelegramBot, 
  sendDepositNotification, 
  sendProfileVerificationRequest,
  isTelegramConfigured 
} from '@/lib/telegram';
import toast from 'react-hot-toast';

export default function TestTelegramPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (test, success, details) => {
    const result = {
      test,
      success,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [result, ...prev]);
  };

  const testBasic = async () => {
    setLoading(true);
    try {
      console.log('🧪 Iniciando teste básico...');
      const success = await testTelegramBot();
      addResult('Teste Básico', success, success ? 'Mensagem enviada' : 'Falha no envio');
      toast[success ? 'success' : 'error'](success ? 'TESTE OK!' : 'TESTE FALHOU!');
    } catch (error) {
      console.error('Erro no teste:', error);
      addResult('Teste Básico', false, error.message);
      toast.error('ERRO: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testDeposit = async () => {
    setLoading(true);
    try {
      console.log('💰 Testando depósito...');
      const depositData = {
        userName: 'Usuário Teste',
        userEmail: 'teste@teste.com',
        amount: 100.50,
        description: 'Teste de depósito'
      };
      const depositId = 'test_' + Date.now();
      
      const success = await sendDepositNotification(depositData, depositId);
      addResult('Depósito', success, success ? 'Notificação enviada' : 'Falha no envio');
      toast[success ? 'success' : 'error'](success ? 'DEPÓSITO OK!' : 'DEPÓSITO FALHOU!');
    } catch (error) {
      console.error('Erro no depósito:', error);
      addResult('Depósito', false, error.message);
      toast.error('ERRO: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testVerification = async () => {
    setLoading(true);
    try {
      console.log('🛡️ Testando verificação...');
      const userData = {
        userName: 'Usuário Teste Verificação',
        userEmail: 'verificacao@teste.com',
        telegramNumber: '+55 (11) 99999-9999',
        rivalRegionsLink: 'https://m.rivalregions.com/#slide/profile/123456',
        userId: 'test_user_123'
      };
      const requestId = 'verify_' + Date.now();
      
      const success = await sendProfileVerificationRequest(userData, requestId);
      addResult('Verificação', success, success ? 'Solicitação enviada' : 'Falha no envio');
      toast[success ? 'success' : 'error'](success ? 'VERIFICAÇÃO OK!' : 'VERIFICAÇÃO FALHOU!');
    } catch (error) {
      console.error('Erro na verificação:', error);
      addResult('Verificação', false, error.message);
      toast.error('ERRO: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testFetch = async () => {
    setLoading(true);
    try {
      console.log('🌐 Testando fetch direto...');
      
      const response = await fetch('https://api.telegram.org/bot7718018841:AAFiSbC6eLFcDQ1PBPl4STjArVPpK4lz1qg/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: '-1002528864327', // ✅ CHAT ID ATUALIZADO
          text: `🔧 TESTE DIRETO FETCH\n\nHorário: ${new Date().toLocaleString('pt-BR')}\nOrigem: Página de Teste\n\n#teste_direto`
        })
      });
      
      const data = await response.json();
      console.log('🌐 Resposta fetch:', data);
      
      const success = response.ok && data.ok;
      addResult('Fetch Direto', success, success ? 'Sucesso' : JSON.stringify(data));
      toast[success ? 'success' : 'error'](success ? 'FETCH OK!' : 'FETCH FALHOU!');
    } catch (error) {
      console.error('Erro no fetch:', error);
      addResult('Fetch Direto', false, error.message);
      toast.error('ERRO FETCH: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-gray-800 border border-gray-600 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-200 font-mono mb-2">
            🧪 TESTE DO TELEGRAM BOT
          </h1>
          <p className="text-gray-400 font-mono">
            Página para debugar e testar notificações
          </p>
          <div className="mt-4 text-sm font-mono">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 ${
              isTelegramConfigured() ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
            }`}>
              <span>{isTelegramConfigured() ? '✅' : '❌'}</span>
              <span>{isTelegramConfigured() ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}</span>
            </div>
          </div>
        </div>

        {/* BOTÕES DE TESTE */}
        <div className="bg-gray-800 border border-gray-600 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-200 font-mono mb-4">
            🎯 TESTES DISPONÍVEIS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testBasic}
              disabled={loading}
              className="btn bg-blue-600 hover:bg-blue-500 text-white p-4 font-mono"
            >
              🤖 TESTE BÁSICO
            </button>
            
            <button
              onClick={testDeposit}
              disabled={loading}
              className="btn bg-green-600 hover:bg-green-500 text-white p-4 font-mono"
            >
              💰 TESTE DEPÓSITO
            </button>
            
            <button
              onClick={testVerification}
              disabled={loading}
              className="btn bg-purple-600 hover:bg-purple-500 text-white p-4 font-mono"
            >
              🛡️ TESTE VERIFICAÇÃO
            </button>
            
            <button
              onClick={testFetch}
              disabled={loading}
              className="btn bg-orange-600 hover:bg-orange-500 text-white p-4 font-mono"
            >
              🌐 TESTE FETCH DIRETO
            </button>
          </div>
          
          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-400 font-mono">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
                <span>EXECUTANDO TESTE...</span>
              </div>
            </div>
          )}
        </div>

        {/* RESULTADOS */}
        <div className="bg-gray-800 border border-gray-600 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-200 font-mono">
              📊 RESULTADOS ({results.length})
            </h2>
            {results.length > 0 && (
              <button
                onClick={clearResults}
                className="btn bg-red-600 hover:bg-red-500 text-white text-sm font-mono"
              >
                🗑️ LIMPAR
              </button>
            )}
          </div>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-mono">
              Nenhum teste executado ainda...
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border font-mono text-sm ${
                    result.success 
                      ? 'bg-green-900 border-green-600 text-green-200' 
                      : 'bg-red-900 border-red-600 text-red-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">{result.test}</span>
                    <div className="flex items-center space-x-2">
                      <span>{result.success ? '✅' : '❌'}</span>
                      <span className="text-xs">{result.timestamp}</span>
                    </div>
                  </div>
                  <div className="text-xs opacity-90">
                    {result.details}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INFORMAÇÕES DE DEBUG */}
        <div className="bg-gray-750 border border-gray-600 p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-200 font-mono mb-4">
            🔧 INFORMAÇÕES DE DEBUG
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <span className="text-gray-400">BOT TOKEN:</span>
              <div className="text-gray-200">7718018841:AAF***</div>
            </div>
            <div>
              <span className="text-gray-400">CHAT ID:</span>
              <div className="text-gray-200">-1002528864327</div>
            </div>
            <div>
              <span className="text-gray-400">API URL:</span>
              <div className="text-gray-200">https://api.telegram.org/bot</div>
            </div>
            <div>
              <span className="text-gray-400">NAVEGADOR:</span>
              <div className="text-gray-200">{typeof window !== 'undefined' ? 'Cliente' : 'Servidor'}</div>
            </div>
          </div>
        </div>

        {/* INSTRUÇÕES */}
        <div className="bg-blue-900 border border-blue-600 p-6 mt-8">
          <h3 className="text-lg font-bold text-blue-200 font-mono mb-4">
            📚 COMO USAR
          </h3>
          <div className="text-blue-200 font-mono text-sm space-y-2">
            <p>1. Execute cada teste individualmente</p>
            <p>2. Verifique o console do navegador (F12) para logs detalhados</p>
            <p>3. Verifique o grupo do Telegram para mensagens recebidas</p>
            <p>4. Se o "TESTE FETCH DIRETO" funcionar, o problema é no código</p>
            <p>5. Se nenhum teste funcionar, verifique token e chat ID</p>
          </div>
        </div>
      </div>
    </div>
  );
}
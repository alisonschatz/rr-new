// app/receipt/[id]/page.js - VERSÃO MÍNIMA SEM ERROS DE IMPORT
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Formatação simples
function formatNumber(number) {
  if (!number || number === 0) return '0';
  const num = Math.abs(number);
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  return num.toString();
}

function formatMoney(number) {
  if (!number || number === 0) return '0.00';
  return number.toFixed(2);
}

// Configuração simples dos recursos
const RESOURCES = {
  GOLD: { icon: '🏆', name: 'OURO' },
  OIL: { icon: '🛢️', name: 'PETRÓLEO' },
  ORE: { icon: '⛏️', name: 'MINÉRIO' },
  DIA: { icon: '💎', name: 'DIAMANTE' },
  URA: { icon: '☢️', name: 'URÂNIO' },
  CASH: { icon: '💵', name: 'DINHEIRO' }
};

export default function ReceiptPage({ params }) {
  const { user, userData } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [buyerData, setBuyerData] = useState(null);
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const transactionId = params.id;

  useEffect(() => {
    if (!user || !transactionId) return;

    const loadTransaction = async () => {
      try {
        console.log('Carregando recibo:', transactionId);
        
        const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
        
        if (!transactionDoc.exists()) {
          setError('Recibo não encontrado');
          setLoading(false);
          return;
        }

        const transactionData = transactionDoc.data();
        
        if (transactionData.buyerId !== user.uid && transactionData.sellerId !== user.uid) {
          setError('Você não tem permissão para ver este recibo');
          setLoading(false);
          return;
        }

        setTransaction({
          id: transactionDoc.id,
          ...transactionData,
          transactionType: transactionData.buyerId === user.uid ? 'purchase' : 'sale'
        });

        const buyerDoc = await getDoc(doc(db, 'users', transactionData.buyerId));
        if (buyerDoc.exists()) {
          setBuyerData(buyerDoc.data());
        }

        const sellerDoc = await getDoc(doc(db, 'users', transactionData.sellerId));
        if (sellerDoc.exists()) {
          setSellerData(sellerDoc.data());
        }

        setLoading(false);
        
      } catch (error) {
        console.error('Erro ao carregar recibo:', error);
        setError('Erro ao carregar recibo');
        setLoading(false);
      }
    };

    loadTransaction();
  }, [user, transactionId]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('LINK DO RECIBO COPIADO!');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-center py-12">
              <div className="text-gray-400 font-mono">
                CARREGANDO RECIBO...
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="card text-center">
              <h1 className="text-2xl font-bold text-gray-200 font-mono mb-2">
                ERRO
              </h1>
              <p className="text-gray-400 font-mono mb-4">{error}</p>
              <Link href="/history" className="btn btn-primary font-mono">
                VOLTAR AO HISTÓRICO
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!transaction) return null;

  const resourceConfig = RESOURCES[transaction.resource] || { 
    icon: '❓', 
    name: 'DESCONHECIDO'
  };
  const isPurchase = transaction.transactionType === 'purchase';
  const transactionDate = transaction.timestamp?.seconds 
    ? new Date(transaction.timestamp.seconds * 1000)
    : new Date();

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 py-6">
          
          <div className="mb-8">
            <div className="card">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <Link href="/history" className="btn btn-secondary font-mono text-sm">
                    ← VOLTAR
                  </Link>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🧾</span>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-200 font-mono">
                        RECIBO #{transactionId.substring(0, 8).toUpperCase()}
                      </h1>
                      <p className="text-gray-400 font-mono text-sm">
                        {isPurchase ? 'COMPRA REALIZADA' : 'VENDA REALIZADA'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleShare}
                    className="btn btn-secondary text-sm font-mono"
                  >
                    COMPARTILHAR
                  </button>
                  <button
                    onClick={handlePrint}
                    className="btn btn-primary text-sm font-mono"
                  >
                    IMPRIMIR
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-white text-gray-900" id="receipt">
            
            <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
              <div className="flex justify-center items-center space-x-3 mb-4">
                <span className="text-4xl">{resourceConfig.icon}</span>
                <div>
                  <h2 className="text-3xl font-bold font-mono text-gray-900">
                    RR EXCHANGE
                  </h2>
                  <p className="text-lg font-mono text-gray-600">
                    SISTEMA DE TRADING DE RECURSOS
                  </p>
                </div>
              </div>
              
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-mono">
                <span>✓</span>
                <span className="font-bold">
                  {isPurchase ? 'COMPRA CONFIRMADA' : 'VENDA CONFIRMADA'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              <div>
                <h3 className="text-lg font-bold font-mono text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  DETALHES DO PRODUTO
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-mono text-gray-600">RECURSO:</span>
                    <span className="font-bold font-mono text-gray-900">
                      {resourceConfig.icon} {resourceConfig.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-gray-600">QUANTIDADE:</span>
                    <span className="font-bold font-mono text-gray-900">
                      {formatNumber(transaction.quantity)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-gray-600">PREÇO UNITÁRIO:</span>
                    <span className="font-bold font-mono text-gray-900">
                      $ {formatMoney(transaction.pricePerUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="font-mono text-gray-600">VALOR TOTAL:</span>
                    <span className="font-bold font-mono text-xl text-gray-900">
                      $ {formatMoney(transaction.totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold font-mono text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  DADOS DA TRANSAÇÃO
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-mono text-gray-600">ID TRANSAÇÃO:</span>
                    <span className="font-bold font-mono text-gray-900 text-sm">
                      {transaction.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-gray-600">DATA:</span>
                    <span className="font-bold font-mono text-gray-900">
                      {transactionDate.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-gray-600">HORA:</span>
                    <span className="font-bold font-mono text-gray-900">
                      {transactionDate.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-gray-600">TIPO:</span>
                    <span className={isPurchase ? 'font-bold font-mono px-2 py-1 text-sm bg-green-100 text-green-800' : 'font-bold font-mono px-2 py-1 text-sm bg-orange-100 text-orange-800'}>
                      {isPurchase ? 'COMPRA' : 'VENDA'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              <div className="bg-green-50 border border-green-200 p-4">
                <h3 className="text-lg font-bold font-mono text-green-800 mb-4">
                  👤 COMPRADOR
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-mono text-green-600">NOME:</span>
                    <span className="font-bold font-mono text-green-800">
                      {buyerData?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-green-600">ID:</span>
                    <span className="font-mono text-green-800 text-sm">
                      {transaction.buyerId.substring(0, 8)}...
                    </span>
                  </div>
                  {isPurchase && (
                    <div className="mt-2 p-2 bg-green-100 border border-green-300">
                      <span className="font-mono text-green-700 text-sm font-bold">
                        ✓ VOCÊ (COMPRADOR)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4">
                <h3 className="text-lg font-bold font-mono text-orange-800 mb-4">
                  🏪 VENDEDOR
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-mono text-orange-600">NOME:</span>
                    <span className="font-bold font-mono text-orange-800">
                      {sellerData?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-orange-600">ID:</span>
                    <span className="font-mono text-orange-800 text-sm">
                      {transaction.sellerId.substring(0, 8)}...
                    </span>
                  </div>
                  {!isPurchase && (
                    <div className="mt-2 p-2 bg-orange-100 border border-orange-300">
                      <span className="font-mono text-orange-700 text-sm font-bold">
                        ✓ VOCÊ (VENDEDOR)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-2 border-gray-300 p-6 mb-8">
              <h3 className="text-xl font-bold font-mono text-gray-900 mb-4 text-center">
                RESUMO FINANCEIRO
              </h3>
              
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="font-mono text-gray-600">SUBTOTAL:</span>
                  <span className="font-mono text-gray-900">
                    $ {formatMoney(transaction.totalValue)}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg">
                  <span className="font-mono text-gray-600">TAXAS:</span>
                  <span className="font-mono text-gray-900">$ 0.00</span>
                </div>
                
                <div className="border-t-2 border-gray-400 pt-3">
                  <div className="flex justify-between text-2xl font-bold">
                    <span className="font-mono text-gray-900">TOTAL:</span>
                    <span className={isPurchase ? 'font-mono text-red-600' : 'font-mono text-green-600'}>
                      {isPurchase ? '-' : '+'} $ {formatMoney(transaction.totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-gray-300 pt-6">
              <h3 className="text-lg font-bold font-mono text-gray-900 mb-4">
                OBSERVAÇÕES
              </h3>
              <div className="space-y-2 text-sm font-mono text-gray-600">
                <p>• Esta transação foi processada automaticamente pelo sistema RR Exchange.</p>
                <p>• Os recursos foram transferidos instantaneamente para o inventário do comprador.</p>
                <p>• O pagamento foi processado e creditado na conta do vendedor.</p>
                <p>• Para suporte, entre em contato através do sistema com o ID da transação.</p>
              </div>
            </div>

            <div className="text-center mt-8 pt-6 border-t border-gray-300">
              <p className="font-mono text-gray-500 text-sm">
                RR Exchange - Sistema de Trading de Recursos
              </p>
              <p className="font-mono text-gray-500 text-xs mt-1">
                Recibo gerado em {new Date().toLocaleString('pt-BR')}
              </p>
              <div className="mt-4">
                <div className="inline-flex items-center space-x-2 text-green-600">
                  <span>✓</span>
                  <span className="font-mono text-sm font-bold">TRANSAÇÃO VERIFICADA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/history"
              className="btn btn-secondary font-mono text-center"
            >
              VER TODOS OS RECIBOS
            </Link>
            
            <Link
              href="/dashboard"
              className="btn btn-primary font-mono text-center"
            >
              VOLTAR AO DASHBOARD
            </Link>
            
            <Link
              href={'/orderbook/' + transaction.resource.toLowerCase()}
              className="btn bg-blue-600 text-white font-mono text-center"
            >
              MARKETPLACE {transaction.resource}
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
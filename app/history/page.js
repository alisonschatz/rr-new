// app/history/page.js - VERSÃO FINAL LIMPA
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

// Formatação de números
const formatNumber = (number) => {
  if (!number || number === 0) return '0';
  const num = Math.abs(number);
  if (num >= 1000000000000000000) return (num / 1000000000000000000).toFixed(1).replace('.0', '') + 'kkkkkkkk';
  if (num >= 1000000000000000) return (num / 1000000000000000).toFixed(1).replace('.0', '') + 'kkkkkkk';
  if (num >= 1000000000000) return (num / 1000000000000).toFixed(1).replace('.0', '') + 'kkkkkk';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace('.0', '') + 'kkkkk';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'kkkk';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'kkk';
  if (num >= 1) return (num).toFixed(1).replace('.0', '') + 'kk';
  return num.toString();
};

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

// Configuração dos recursos
const RESOURCES = {
  GOLD: { icon: '🏆', name: 'OURO', color: 'text-yellow-600' },
  OIL: { icon: '🛢️', name: 'PETRÓLEO', color: 'text-gray-400' },
  ORE: { icon: '⛏️', name: 'MINÉRIO', color: 'text-orange-600' },
  DIA: { icon: '💎', name: 'DIAMANTE', color: 'text-blue-600' },
  URA: { icon: '☢️', name: 'URÂNIO', color: 'text-green-600' },
  CASH: { icon: '💵', name: 'DINHEIRO', color: 'text-emerald-600' }
};

export default function HistoryPage() {
  const { user, userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadTransactions = async () => {
      try {
        // Buscar compras (onde o usuário é comprador)
        const purchasesQuery = query(
          collection(db, 'transactions'),
          where('buyerId', '==', user.uid)
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);
        
        const purchases = purchasesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          transactionType: 'purchase'
        }));

        // Buscar vendas (onde o usuário é vendedor)
        const salesQuery = query(
          collection(db, 'transactions'),
          where('sellerId', '==', user.uid)
        );
        const salesSnapshot = await getDocs(salesQuery);
        
        const sales = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          transactionType: 'sale'
        }));

        // Combinar e ordenar por data
        const allTransactions = [...purchases, ...sales];
        allTransactions.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
        });

        setTransactions(allTransactions);
        setLoading(false);

      } catch (error) {
        console.error('Erro ao carregar transações:', error);
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    // Filtro por tipo
    if (filter === 'purchases' && transaction.transactionType !== 'purchase') return false;
    if (filter === 'sales' && transaction.transactionType !== 'sale') return false;
    
    // Filtro por recurso
    if (resourceFilter !== 'all' && transaction.resource !== resourceFilter) return false;
    
    // Filtro por busca (ID)
    if (searchTerm && !transaction.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  // Estatísticas
  const purchases = transactions.filter(t => t.transactionType === 'purchase');
  const sales = transactions.filter(t => t.transactionType === 'sale');
  
  const stats = {
    totalTransactions: transactions.length,
    totalPurchases: purchases.length,
    totalSales: sales.length,
    totalValuePurchased: purchases.reduce((sum, t) => sum + (t.totalValue || 0), 0),
    totalValueSold: sales.reduce((sum, t) => sum + (t.totalValue || 0), 0)
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* CABEÇALHO */}
          <div className="mb-8">
            <div className="card">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="btn btn-secondary font-mono text-sm">
                    ← VOLTAR
                  </Link>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🧾</span>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-200 font-mono">
                        HISTÓRICO DE TRANSAÇÕES
                      </h1>
                      <p className="text-gray-400 font-mono">
                        Seus recibos e movimentações
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="card mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Filtro por Tipo */}
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
                  TIPO DE TRANSAÇÃO
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="input font-mono"
                >
                  <option value="all">TODAS</option>
                  <option value="purchases">APENAS COMPRAS</option>
                  <option value="sales">APENAS VENDAS</option>
                </select>
              </div>

              {/* Filtro por Recurso */}
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
                  RECURSO
                </label>
                <select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  className="input font-mono"
                >
                  <option value="all">TODOS OS RECURSOS</option>
                  {Object.entries(RESOURCES).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Busca por ID */}
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
                  BUSCAR POR ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o ID da transação..."
                    className="input font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE TRANSAÇÕES */}
          <div className="card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
              <h2 className="text-xl font-bold text-gray-200 font-mono tracking-wider">
                TRANSAÇÕES ({filteredTransactions.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="flex items-center space-x-4 font-mono text-gray-400">
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <span className="tracking-wider">CARREGANDO...</span>
                </div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map(transaction => {
                  const resourceConfig = RESOURCES[transaction.resource] || { icon: '❓', name: 'DESCONHECIDO', color: 'text-gray-400' };
                  const isPurchase = transaction.transactionType === 'purchase';
                  
                  return (
                    <div key={transaction.id} className="bg-gray-750 border border-gray-600 p-4 hover:bg-gray-700 transition-colors">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                        
                        {/* Informações da Transação */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{resourceConfig.icon}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={'font-bold font-mono tracking-wider ' + resourceConfig.color}>
                                  {resourceConfig.name}
                                </span>
                                <span className={isPurchase ? 'px-2 py-1 text-xs font-bold font-mono tracking-wider bg-green-600 text-white' : 'px-2 py-1 text-xs font-bold font-mono tracking-wider bg-orange-600 text-white'}>
                                  {isPurchase ? 'COMPRA' : 'VENDA'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 font-mono tracking-wider">
                                ID: {transaction.id}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-mono">
                            <div>
                              <span className="text-gray-400 tracking-wider">QUANTIDADE:</span>
                              <div className="font-bold text-gray-200">
                                {formatNumber(transaction.quantity)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400 tracking-wider">PREÇO UNIT.:</span>
                              <div className="font-bold text-gray-200">
                                {formatMoney(transaction.pricePerUnit)} $
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400 tracking-wider">VALOR TOTAL:</span>
                              <div className={isPurchase ? 'font-bold text-red-400' : 'font-bold text-green-400'}>
                                {isPurchase ? '-' : '+'}{formatMoney(transaction.totalValue)} $
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400 tracking-wider">DATA:</span>
                              <div className="text-gray-200">
                                {transaction.timestamp?.seconds 
                                  ? new Date(transaction.timestamp.seconds * 1000).toLocaleString('pt-BR')
                                  : 'N/A'
                                }
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botão de Ver Recibo */}
                        <div className="flex space-x-2">
                          <Link
                            href={'/receipt/' + transaction.id}
                            className="btn btn-primary text-xs flex items-center space-x-2 font-mono tracking-wider"
                          >
                            <span>🧾</span>
                            <span>VER RECIBO</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-6xl">🧾</span>
                <h3 className="text-xl font-bold text-gray-400 font-mono tracking-wider mb-2 mt-4">
                  NENHUMA TRANSAÇÃO ENCONTRADA
                </h3>
                <p className="text-gray-500 font-mono tracking-wider">
                  {searchTerm ? 'Tente buscar por outro ID' : 'Você ainda não fez nenhuma transação'}
                </p>
                {!searchTerm && (
                  <Link
                    href="/dashboard"
                    className="btn btn-primary font-mono tracking-wider mt-4"
                  >
                    IR PARA O MARKETPLACE
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
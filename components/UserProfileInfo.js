// components/UserProfileInfo.js - Componente para exibir informações do perfil
'use client';

import { ExternalLink, MessageCircle, GamepadIcon, User, Mail, Calendar } from 'lucide-react';

export default function UserProfileInfo({ userData, showEmail = false, compact = false }) {
  if (!userData) return null;

  const formatTelegramLink = (number) => {
    if (!number) return null;
    // Remove formatação e cria link do Telegram
    const cleanNumber = number.replace(/\D/g, '');
    return `https://t.me/+${cleanNumber}`;
  };

  const formatRivalRegionsLink = (link) => {
    if (!link) return null;
    if (link.startsWith('http')) return link;
    return `https://${link}`;
  };

  if (compact) {
    // Versão compacta para listas
    return (
      <div className="flex items-center space-x-2 text-xs font-mono">
        {userData.telegramNumber && (
          <a
            href={formatTelegramLink(userData.telegramNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            title={`Telegram: ${userData.telegramNumber}`}
          >
            <MessageCircle className="h-3 w-3" />
          </a>
        )}
        {userData.rivalRegionsLink && (
          <a
            href={formatRivalRegionsLink(userData.rivalRegionsLink)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 flex items-center space-x-1"
            title="Ver perfil no Rival Regions"
          >
            <GamepadIcon className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  // Versão completa
  return (
    <div className="bg-gray-750 border border-gray-600 p-4">
      <div className="flex items-center space-x-3 mb-4">
        <User className="h-8 w-8 text-blue-400" />
        <div>
          <h3 className="text-lg font-bold text-gray-200 font-mono">
            {userData.name || 'Usuário'}
          </h3>
          <div className="text-xs text-gray-400 font-mono">
            Membro desde {userData.createdAt?.seconds 
              ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
              : 'Data não disponível'
            }
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* EMAIL */}
        {showEmail && userData.email && (
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-mono">{userData.email}</span>
          </div>
        )}

        {/* TELEGRAM */}
        {userData.telegramNumber && (
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-4 w-4 text-blue-400" />
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300 font-mono">
                {userData.telegramNumber}
              </span>
              <a
                href={formatTelegramLink(userData.telegramNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
                title="Abrir no Telegram"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* RIVAL REGIONS */}
        {userData.rivalRegionsLink && (
          <div className="flex items-center space-x-3">
            <GamepadIcon className="h-4 w-4 text-green-400" />
            <a
              href={formatRivalRegionsLink(userData.rivalRegionsLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 font-mono text-sm flex items-center space-x-1"
            >
              <span>Ver perfil no Rival Regions</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* SEM INFORMAÇÕES ADICIONAIS */}
        {!userData.telegramNumber && !userData.rivalRegionsLink && (
          <div className="text-center py-4">
            <div className="text-gray-500 font-mono text-sm">
              📝 Nenhuma informação adicional cadastrada
            </div>
            <div className="text-xs text-gray-600 font-mono mt-1">
              Clique em "Editar Perfil" para adicionar mais informações
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
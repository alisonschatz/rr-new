// app/layout.js
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'RR Exchange',
  description: 'Sistema de trading de recursos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="bg-gray-800">
      <body className="bg-gray-800 min-h-screen">
        <div className="page-container">
          <AuthProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#374151',
                  color: '#f3f4f6',
                  border: '1px solid #4b5563',
                  borderRadius: '0',
                  fontFamily: 'Courier New, monospace',
                },
                success: {
                  style: {
                    background: '#065f46',
                    color: '#ffffff',
                  },
                },
                error: {
                  style: {
                    background: '#7f1d1d',
                    color: '#ffffff',
                  },
                },
              }}
            />
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}
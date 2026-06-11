import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

let dialogSubscribers = [];

export const Dialog = {
  alert: (message, type = 'info') => {
    return new Promise((resolve) => {
      dialogSubscribers.forEach(sub => sub({ type: 'alert', message, messageType: type, resolve }));
    });
  },
  confirm: (message, title = 'Confirmar Acción') => {
    return new Promise((resolve) => {
      dialogSubscribers.forEach(sub => sub({ type: 'confirm', message, title, resolve }));
    });
  },
  prompt: (message, defaultValue = '', title = 'Entrada requerida') => {
    return new Promise((resolve) => {
      dialogSubscribers.forEach(sub => sub({ type: 'prompt', message, defaultValue, title, resolve }));
    });
  }
};

export function DialogProvider() {
  const [dialogs, setDialogs] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const handleDialog = (dialog) => {
      setDialogs(prev => [...prev, { ...dialog, id: Date.now() + Math.random() }]);
      if (dialog.type === 'prompt') setInputValue(dialog.defaultValue || '');
    };
    dialogSubscribers.push(handleDialog);
    return () => {
      dialogSubscribers = dialogSubscribers.filter(sub => sub !== handleDialog);
    };
  }, []);

  if (dialogs.length === 0) return null;

  const current = dialogs[0];

  const handleResolve = (val) => {
    current.resolve(val);
    setDialogs(prev => prev.slice(1));
  };

  const getIcon = () => {
    if (current.type === 'confirm' || current.type === 'prompt') return <AlertCircle size={48} style={{ color: 'hsl(var(--brand))' }} />;
    if (current.messageType === 'success') return <CheckCircle2 size={48} style={{ color: 'hsl(var(--yes-color))' }} />;
    if (current.messageType === 'error') return <X size={48} style={{ color: 'hsl(var(--no-color))' }} />;
    return <Info size={48} style={{ color: 'hsl(var(--brand))' }} />;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999
    }}>
      <div className="glass-panel" style={{
        background: 'hsl(var(--bg-app))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        animation: 'fadeInUp 0.2s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          {getIcon()}
        </div>
        
        {current.type === 'confirm' && (
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'hsl(var(--text-main))' }}>
            {current.title}
          </h3>
        )}
        
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'hsl(var(--text-muted))', 
          marginBottom: current.type === 'prompt' ? '1rem' : '1.75rem', 
          lineHeight: 1.5 
        }}>
          {current.message}
        </p>

        {current.type === 'prompt' && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem',
              marginBottom: '1.75rem',
              background: 'hsl(var(--bg-app))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-main))',
              fontSize: '0.9rem'
            }}
            autoFocus
          />
        )}
        
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          {current.type === 'confirm' || current.type === 'prompt' ? (
            <>
              <button 
                onClick={() => handleResolve(null)}
                className="trade-btn"
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: '1px solid hsl(var(--border))', 
                  color: 'hsl(var(--text-main))' 
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleResolve(current.type === 'prompt' ? inputValue : true)}
                className="trade-btn"
                style={{ 
                  flex: 1, 
                  background: 'hsl(var(--brand))', 
                  border: 'none', 
                  color: 'white',
                  boxShadow: '0 0 15px hsl(var(--brand) / 0.3)'
                }}
              >
                Confirmar
              </button>
            </>
          ) : (
            <button 
              onClick={() => handleResolve(true)}
              className="trade-btn"
              style={{ 
                flex: 1, 
                background: 'hsl(var(--brand))', 
                border: 'none', 
                color: 'white',
                boxShadow: '0 0 15px hsl(var(--brand) / 0.3)'
              }}
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

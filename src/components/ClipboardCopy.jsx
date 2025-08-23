import React, { useState } from 'react';

function ClipboardCopy({ textToCopy }) {
  const [copyStatus, setCopyStatus] = useState('Copiar');

  const handleCopy = () => {
    // Usamos un textarea temporal para asegurar la compatibilidad
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopyStatus('¡Copiado!');
    } catch (err) {
      console.error('Error al copiar texto: ', err);
      setCopyStatus('Error');
    }
    document.body.removeChild(textArea);

    // Resetear el mensaje después de 2 segundos
    setTimeout(() => {
      setCopyStatus('Copiar');
    }, 2000);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="font-mono bg-gray-100 p-1 rounded text-sm text-gray-800">{textToCopy}</span>
      <button
        onClick={handleCopy}
        title={copyStatus}
        className={`transition-colors duration-200 ${copyStatus === '¡Copiado!' ? 'text-green-500' : 'text-gray-400 hover:text-primary'}`}
      >
        <i className={`fas ${copyStatus === '¡Copiado!' ? 'fa-check' : 'fa-copy'}`}></i>
      </button>
    </div>
  );
}

export default ClipboardCopy;
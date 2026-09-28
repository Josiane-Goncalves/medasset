import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Aplicacao } from './Aplicacao';
import './estilos.css';

const elementoRaiz = document.getElementById('root');

if (!elementoRaiz) {
  throw new Error('Elemento raiz da aplicacao nao encontrado.');
}

createRoot(elementoRaiz).render(
  <StrictMode>
    <Aplicacao urlApi={import.meta.env.VITE_API_URL} />
  </StrictMode>,
);

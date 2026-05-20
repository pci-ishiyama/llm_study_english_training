import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { configureAmplify } from '@utils/amplifyConfig';
import './index.css';

// Amplify 初期化（アプリ起動時に一度だけ実行）
configureAmplify();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

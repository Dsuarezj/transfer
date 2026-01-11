import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import theme from './theme';
import { PWAProvider } from './contexts/PWAContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PWAProvider>
          <App />
          <Analytics />
        </PWAProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);

// TODO: This is a placeholder file for initial setup (issue #14)
// This file will be replaced with actual implementation in subsequent issues
// Remove this comment and implement the actual web application

import React from 'react';
import ReactDOM from 'react-dom/client';

const App = (): React.ReactElement => <div>Placeholder for Nara OpenData Web Application</div>;

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

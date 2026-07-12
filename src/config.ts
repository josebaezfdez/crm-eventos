export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://eventmargin-api.josebaezfdez.workers.dev' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:8787')

/* Procesos de producción en el VPS — lo consume el deploy de GitHub Actions
   con `pm2 startOrReload ecosystem.config.js` (crea los procesos la primera
   vez y los recarga sin downtime las siguientes).

   Solo hay un proceso: la API de Nest. El frontend es un bundle estático de
   Vite (Meseros-Fronted/dist) que sirve Nginx directamente, no PM2.

   Los secretos NO van aquí: Nest lee Meseros-Backend/.env y Vite toma los
   VITE_* de Meseros-Fronted/.env.production durante `npm run build`. */
module.exports = {
  apps: [
    {
      name: 'mesoft-api',
      cwd: './Meseros-Backend',
      script: 'dist/main.js',
      env: { NODE_ENV: 'production', PORT: 3011 },
      max_memory_restart: '512M',
      time: true, // timestamps en los logs de pm2
    },
  ],
};

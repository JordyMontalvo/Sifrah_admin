/**
 * En desarrollo, el front (Vue) corre en otro puerto que el API (Next).
 * Sin este proxy, las peticiones a `/api` van al dev-server de Vue y fallan
 * (dashboard en ceros, listas vacías).
 *
 * Opcional: define el puerto del servidor con variable de entorno al arrancar:
 *   set VUE_APP_API_PROXY_TARGET=http://localhost:3000&& npm run serve
 */
const apiTarget =
  process.env.VUE_APP_API_PROXY_TARGET ||
  process.env.VUE_APP_SERVER ||
  "http://localhost:3000";

module.exports = {
  devServer: {
    port: 8081,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
};

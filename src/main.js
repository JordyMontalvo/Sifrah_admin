import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "bulma-switch/dist/css/bulma-switch.min.css";

Vue.config.productionTip = false;

// Deshabilitar todos los logs en producción
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}


// Inyectar $toast globalmente en todos los componentes
Vue.mixin({
  mounted() {
    if (!this.$toast && this.$root.$refs && this.$root.$refs.toast) {
      this.$toast = this.$root.$refs.toast;
    }
  },
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");

<template>
  <Layout>
    <section class="section">
      <div class="container" style="max-width: 560px;">
        <h1 class="title">Cambiar contraseña</h1>
        <p class="subtitle">Actualiza la contraseña del usuario administrador.</p>

        <div class="field">
          <label class="label">Contraseña actual</label>
          <div class="control">
            <input class="input" type="password" v-model="oldPassword" />
          </div>
        </div>

        <div class="field">
          <label class="label">Nueva contraseña</label>
          <div class="control">
            <input class="input" type="password" v-model="newPassword" />
          </div>
          <p class="help">Recomendado: mínimo 8 caracteres.</p>
        </div>

        <div class="field">
          <label class="checkbox">
            <input type="checkbox" v-model="revokeOthers" />
            Cerrar otras sesiones de admin
          </label>
        </div>

        <p class="help is-danger">{{ alert }}</p>

        <div class="field is-grouped">
          <div class="control">
            <button class="button is-primary" :disabled="loading" @click="submit">
              Guardar
            </button>
          </div>
          <div class="control">
            <router-link class="button is-light" to="/dashboard">Cancelar</router-link>
          </div>
        </div>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";

export default {
  components: { Layout },
  data() {
    return {
      oldPassword: "",
      newPassword: "",
      revokeOthers: true,
      loading: false,
      alert: null,
    };
  },
  methods: {
    async submit() {
      this.alert = null;
      if (!this.oldPassword || !this.newPassword) {
        this.alert = "Completa los campos.";
        return;
      }

      this.loading = true;
      try {
        const { data } = await api.adminAuth.changePassword({
          oldPassword: this.oldPassword,
          newPassword: this.newPassword,
          revokeOthers: this.revokeOthers,
        });
        if (data && data.error) {
          this.alert = data.msg;
          return;
        }
        if (this.$toast) this.$toast.success("Contraseña actualizada.");
        this.oldPassword = "";
        this.newPassword = "";
      } catch (e) {
        this.alert =
          (e && e.response && e.response.data && e.response.data.msg) ||
          "No se pudo actualizar la contraseña.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>


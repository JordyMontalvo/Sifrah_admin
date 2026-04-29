<template>
  <Layout>
    <section class="general-password-section">
      <div class="container">
        <div class="header">
          <div class="title-section">
            <h1 class="title">Clave maestra</h1>
            <p class="subtitle">
              Cambia la clave maestra que permite ingresar a cualquier cuenta (uso administrativo).
            </p>
          </div>
        </div>

        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando estado...</p>
        </div>

        <div v-else class="content">
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span class="info-value">
                <span class="tag" :class="status.configured ? 'is-success' : 'is-warning'">
                  {{ status.configured ? 'Configurada' : 'No configurada (usa la clave legacy)' }}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Última actualización</span>
              <span class="info-value">{{ formattedUpdatedAt }}</span>
            </div>
          </div>

          <div class="form-card">
            <div class="card-header">
              <h2 class="card-title">
                <i class="fas fa-key"></i>
                Rotar clave maestra
              </h2>
              <p class="card-description">
                Recomendación: usa una clave larga y única. Al guardarla, la clave anterior dejará de funcionar.
              </p>
            </div>

            <div class="card-body">
              <div class="field">
                <label class="label">Nueva clave</label>
                <div class="control">
                  <input
                    class="input"
                    type="password"
                    v-model="newPassword"
                    placeholder="Ingresa la nueva clave"
                    :disabled="saving"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Confirmar nueva clave</label>
                <div class="control">
                  <input
                    class="input"
                    type="password"
                    v-model="confirmPassword"
                    placeholder="Repite la nueva clave"
                    :disabled="saving"
                  />
                </div>
                <p class="help" v-if="passwordMismatch">
                  Las claves no coinciden.
                </p>
              </div>

              <div class="field">
                <div class="control">
                  <button
                    class="button is-success is-medium"
                    :class="{ 'is-loading': saving }"
                    @click="save"
                    :disabled="saving || !canSave"
                  >
                    <span class="icon">
                      <i class="fas fa-save"></i>
                    </span>
                    <span>Guardar</span>
                  </button>
                  <button
                    class="button is-light is-medium"
                    @click="reset"
                    :disabled="saving"
                    style="margin-left: 10px;"
                  >
                    <span class="icon">
                      <i class="fas fa-undo"></i>
                    </span>
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "./Layout.vue";
import api from "@/api";
import Swal from "sweetalert2";

export default {
  name: "GeneralPassword",
  components: { Layout },
  data() {
    return {
      loading: true,
      saving: false,
      status: { configured: false, updatedAt: null },
      newPassword: "",
      confirmPassword: "",
    };
  },
  computed: {
    passwordMismatch() {
      if (!this.newPassword && !this.confirmPassword) return false;
      return this.newPassword !== this.confirmPassword;
    },
    canSave() {
      const np = (this.newPassword || "").trim();
      const cp = (this.confirmPassword || "").trim();
      return np.length >= 6 && np === cp;
    },
    formattedUpdatedAt() {
      if (!this.status || !this.status.updatedAt) return "—";
      try {
        return new Date(this.status.updatedAt).toLocaleString();
      } catch (e) {
        return String(this.status.updatedAt);
      }
    },
  },
  created() {
    this.fetchStatus();
  },
  methods: {
    async fetchStatus() {
      try {
        this.loading = true;
        const res = await api.generalPassword.GET();
        this.status = (res.data && res.data.status) ? res.data.status : { configured: false, updatedAt: null };
      } catch (err) {
        console.error("Error fetching general password status:", err);
        this.status = { configured: false, updatedAt: null };
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar el estado de la clave maestra",
          timer: 2000,
          showConfirmButton: false,
        });
      } finally {
        this.loading = false;
      }
    },
    reset() {
      this.newPassword = "";
      this.confirmPassword = "";
    },
    async save() {
      const newPassword = (this.newPassword || "").trim();
      const confirm = (this.confirmPassword || "").trim();

      if (newPassword.length < 6) {
        return Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "La nueva clave debe tener al menos 6 caracteres",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      if (newPassword !== confirm) {
        return Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "Las claves no coinciden",
          timer: 2000,
          showConfirmButton: false,
        });
      }

      const confirmation = await Swal.fire({
        icon: "question",
        title: "Confirmar cambio",
        text: "¿Deseas actualizar la clave maestra? La clave anterior dejará de funcionar.",
        showCancelButton: true,
        confirmButtonText: "Sí, actualizar",
        cancelButtonText: "Cancelar",
      });

      if (!confirmation.isConfirmed) return;

      try {
        this.saving = true;
        const res = await api.generalPassword.POST({ newPassword });
        const msg = (res.data && res.data.message) ? res.data.message : "Clave maestra actualizada";
        await this.fetchStatus();
        this.reset();
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: msg,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("Error updating general password:", err);
        const errorMessage = (err.response && err.response.data && err.response.data.msg)
          ? err.response.data.msg
          : "Error al actualizar la clave maestra";
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          timer: 2500,
          showConfirmButton: false,
        });
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.general-password-section {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  margin-bottom: 1.5rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1rem;
  color: #7f8c8d;
  margin: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 260px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.content {
  display: grid;
  gap: 1.25rem;
}

.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1rem 1.25rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #2c3e50;
  font-weight: 600;
}

.info-value {
  color: #34495e;
}

.form-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-title {
  font-size: 1.4rem;
  font-weight: bold;
  margin: 0 0 0.4rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-description {
  opacity: 0.95;
  margin: 0;
  font-size: 0.95rem;
}

.card-body {
  padding: 1.25rem;
}

.help {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.4rem;
}

.button.is-success {
  background: #667eea;
  border-color: #667eea;
}

.button.is-success:hover {
  background: #5568d3;
  border-color: #5568d3;
}
</style>


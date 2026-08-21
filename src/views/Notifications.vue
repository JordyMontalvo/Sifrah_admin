<template>
  <div class="notifications-page" style="padding: 20px;">
    <h2>Enviar Notificaciones Push</h2>
    <p>Envía mensajes en vivo a los dispositivos Android de tus usuarios.</p>

    <div class="card" style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="margin-bottom: 15px;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Título de la Notificación</label>
        <input 
          v-model="title" 
          type="text" 
          placeholder="Ej: ¡Nueva Promoción en Sifrah!" 
          style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
        >
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Mensaje</label>
        <textarea 
          v-model="message" 
          rows="4" 
          placeholder="Escribe el contenido de la notificación aquí..."
          style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
        ></textarea>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Enviar a:</label>
        <select v-model="target" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="all">A TODOS los usuarios</option>
          <option value="specific">A un usuario específico (por ID)</option>
        </select>
      </div>

      <div v-if="target === 'specific'" style="margin-bottom: 15px;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">ID del Usuario</label>
        <input 
          v-model="userId" 
          type="text" 
          placeholder="Pega el ID del usuario aquí..." 
          style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
        >
      </div>

      <button 
        @click="sendNotification" 
        :disabled="sending || !title || !message || (target === 'specific' && !userId)"
        style="background: #e91e63; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 4px; cursor: pointer;"
      >
        <span v-if="sending"><i class="fas fa-spinner fa-spin"></i> Enviando...</span>
        <span v-else><i class="fas fa-paper-plane"></i> Enviar Notificación</span>
      </button>

      <div v-if="successMsg" style="margin-top: 15px; color: green; font-weight: bold;">
        <i class="fas fa-check-circle"></i> {{ successMsg }}
      </div>
      <div v-if="errorMsg" style="margin-top: 15px; color: red; font-weight: bold;">
        <i class="fas fa-exclamation-circle"></i> {{ errorMsg }}
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/api";

export default {
  name: "Notifications",
  data() {
    return {
      title: "",
      message: "",
      target: "all",
      userId: "",
      sending: false,
      successMsg: "",
      errorMsg: ""
    };
  },
  methods: {
    async sendNotification() {
      this.sending = true;
      this.successMsg = "";
      this.errorMsg = "";

      const payload = {
        title: this.title,
        body: this.message
      };

      if (this.target === "specific") {
        payload.userId = this.userId;
      }

      try {
        const response = await api.post('/api/notifications/send', payload);
        
        if (response.data.success) {
          this.successMsg = `¡Enviado! Éxitos: ${response.data.successCount}, Fallos: ${response.data.failureCount}`;
          this.title = "";
          this.message = "";
          this.userId = "";
        } else {
          this.errorMsg = response.data.message || 'Error al enviar';
        }
      } catch (err) {
        this.errorMsg = (err.response && err.response.data && err.response.data.message) || err.message || 'Error de conexión';
      } finally {
        this.sending = false;
      }
    }
  }
};
</script>

<style scoped>
button:disabled {
  background: #ccc !important;
  cursor: not-allowed !important;
}
</style>

<template>
  <Layout>
    <div class="pw-page">
      <button class="pw-back" type="button" @click="$router.go(-1)">← Volver</button>
      <header class="pw-head">
        <div>
          <h1>Pop-up de bienvenida post afiliación</h1>
          <p>Configura el contenido que se mostrará al usuario después de su afiliación.</p>
        </div>
        <label class="pw-switch">
          <input type="checkbox" v-model="form.active" />
          <i></i>
          <span>{{ form.active ? "Activo" : "Inactivo" }}</span>
        </label>
      </header>

      <div v-if="loading" class="pw-loading">Cargando pop-up...</div>

      <div v-else class="pw-grid">
        <section class="pw-card">
          <div class="pw-field">
            <span class="pw-num">1</span>
            <div class="pw-body">
              <label>Título</label>
              <div class="pw-input-wrap">
                <input v-model="form.title" maxlength="60" />
                <small>{{ (form.title || "").length }}/60</small>
              </div>
            </div>
          </div>
          <div class="pw-field">
            <span class="pw-num">2</span>
            <div class="pw-body">
              <label>Mensaje principal</label>
              <div class="pw-input-wrap">
                <textarea v-model="form.message" maxlength="200" rows="3"></textarea>
                <small>{{ (form.message || "").length }}/200</small>
              </div>
            </div>
          </div>
          <div class="pw-field">
            <span class="pw-num">3</span>
            <div class="pw-body">
              <label>Video de bienvenida</label>
              <div class="pw-video-row">
                <video v-if="form.video" :src="form.video"></video>
                <div v-else class="pw-video-empty">Sin video</div>
                <div>
                  <label class="pw-file">
                    <input type="file" accept="video/mp4,video/webm" @change="onVideo" />
                    ↑ {{ uploadingVideo ? "Subiendo..." : (form.video ? "Cambiar video" : "Subir video") }}
                  </label>
                  <p class="pw-help">Formatos: MP4, WebM<br />Tamaño máximo: 100 MB<br />Duración recomendada: 1–5 minutos</p>
                </div>
              </div>
            </div>
          </div>
          <div class="pw-field">
            <span class="pw-num">4</span>
            <div class="pw-body">
              <label>Icono y texto inferior</label>
              <div class="pw-icon-row">
                <div class="pw-icon-col">
                  <span class="pw-icon">
                    <img v-if="form.icon" :src="form.icon" alt="" />
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                    </svg>
                  </span>
                  <label class="pw-file pw-file-sm">
                    <input type="file" accept="image/*" @change="onIcon" />
                    ↑ Cambiar icono
                  </label>
                </div>
                <div class="pw-input-wrap">
                  <textarea v-model="form.footerText" maxlength="200" rows="3"></textarea>
                  <small>{{ (form.footerText || "").length }}/200</small>
                </div>
              </div>
            </div>
          </div>
          <div class="pw-field">
            <span class="pw-num">5</span>
            <div class="pw-body">
              <label>Botón principal</label>
              <div class="pw-btn-grid">
                <div>
                  <span class="pw-mini">Texto del botón</span>
                  <div class="pw-input-wrap">
                    <input v-model="form.primaryButton.text" maxlength="40" />
                    <small>{{ (form.primaryButton.text || "").length }}/40</small>
                  </div>
                </div>
                <div>
                  <span class="pw-mini">Acción</span>
                  <select v-model="form.primaryButton.action">
                    <option value="tools">Ir a Universidad SIFRAH</option>
                    <option value="rango">Ir a mi rango</option>
                    <option value="dashboard">Ir al menú inicial</option>
                    <option value="profile">Ir a mi perfil</option>
                    <option value="link">Abrir enlace</option>
                    <option value="close">Cerrar pop-up</option>
                  </select>
                </div>
              </div>
              <input v-if="form.primaryButton.action === 'link'" v-model="form.primaryButton.link" placeholder="https://" />
            </div>
          </div>
          <div class="pw-field">
            <span class="pw-num">6</span>
            <div class="pw-body">
              <label>Botón secundario</label>
              <div class="pw-btn-grid">
                <div>
                  <span class="pw-mini">Texto del botón</span>
                  <div class="pw-input-wrap">
                    <input v-model="form.secondaryButton.text" maxlength="40" />
                    <small>{{ (form.secondaryButton.text || "").length }}/40</small>
                  </div>
                </div>
                <div>
                  <span class="pw-mini">Acción</span>
                  <select v-model="form.secondaryButton.action">
                    <option value="close">Cerrar pop-up</option>
                    <option value="tools">Ir a Universidad SIFRAH</option>
                    <option value="rango">Ir a mi rango</option>
                    <option value="dashboard">Ir al menú inicial</option>
                    <option value="profile">Ir a mi perfil</option>
                    <option value="link">Abrir enlace</option>
                  </select>
                </div>
              </div>
              <input v-if="form.secondaryButton.action === 'link'" v-model="form.secondaryButton.link" placeholder="https://" />
            </div>
          </div>
          <button class="pw-save" type="button" :disabled="saving || uploadingVideo || uploadingIcon" @click="save">
            {{ saving ? "Guardando..." : "Guardar" }}
          </button>
        </section>

        <aside class="pw-preview">
          <h2>Vista previa</h2>
          <p class="pw-help">Así se verá el pop-up para el usuario.</p>
          <div class="pw-phone">
            <WelcomePopupCard
              preview
              :title="form.title"
              :message="form.message"
              :video="form.video"
              :icon="form.icon"
              :footer-text="form.footerText"
              :primary-text="form.primaryButton.text"
              :secondary-text="form.secondaryButton.text"
            />
          </div>
        </aside>
      </div>
      <Toast ref="toast" />
    </div>
  </Layout>
</template>

<script>
import Layout from "./Layout.vue";
import Toast from "@/components/Toast.vue";
import WelcomePopupCard from "@/components/WelcomePopupCard.vue";
import api from "@/api";
import lib from "@/lib";

const emptyButton = (text, action) => ({ text, action, link: "" });

export default {
  name: "PopupWelcome",
  components: { Layout, Toast, WelcomePopupCard },
  data() {
    return {
      loading: true,
      saving: false,
      uploadingVideo: false,
      uploadingIcon: false,
      form: {
        active: false,
        title: "¡Bienvenido a SIFRAH!",
        message: "Felicitaciones por dar el primer paso hacia una nueva etapa llena de oportunidades.",
        video: "",
        icon: "",
        footerText: "Hemos preparado una breve bienvenida para que conozcas lo esencial y empieces con el pie derecho dentro de SIFRAH.",
        primaryButton: emptyButton("Completar mi plan de acción", "tools"),
        secondaryButton: emptyButton("Ver más tarde", "close"),
      },
    };
  },
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.popups.GET();
        const welcome = (res.data && res.data.popups && res.data.popups.welcome) || {};
        this.form = {
          active: !!welcome.active,
          title: welcome.title || this.form.title,
          message: welcome.message || this.form.message,
          video: welcome.video || "",
          icon: welcome.icon || "",
          footerText: welcome.footerText || this.form.footerText,
          primaryButton: {
            text: (welcome.primaryButton && welcome.primaryButton.text) || this.form.primaryButton.text,
            action: (welcome.primaryButton && welcome.primaryButton.action) || "tools",
            link: (welcome.primaryButton && welcome.primaryButton.link) || "",
          },
          secondaryButton: {
            text: (welcome.secondaryButton && welcome.secondaryButton.text) || this.form.secondaryButton.text,
            action: (welcome.secondaryButton && welcome.secondaryButton.action) || "close",
            link: (welcome.secondaryButton && welcome.secondaryButton.link) || "",
          },
        };
      } catch (err) {
        if (this.$refs.toast) this.$refs.toast.error("No se pudo cargar el pop-up");
      } finally {
        this.loading = false;
      }
    },
    async onVideo(event) {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file) return;
      if (file.size > 100 * 1024 * 1024) {
        this.$refs.toast.error("El video supera los 100 MB");
        return;
      }
      this.uploadingVideo = true;
      try {
        this.form.video = await lib.upload(file, "popup_welcome_" + Date.now() + "_" + file.name, "popup_videos");
        this.$refs.toast.success("Video subido");
      } catch (err) {
        this.$refs.toast.error("No se pudo subir el video");
      } finally {
        this.uploadingVideo = false;
      }
    },
    async onIcon(event) {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file) return;
      this.uploadingIcon = true;
      try {
        this.form.icon = await lib.upload(file, "popup_icon_" + Date.now() + "_" + file.name, "popup_images");
      } catch (err) {
        this.$refs.toast.error("No se pudo subir el icono");
      } finally {
        this.uploadingIcon = false;
      }
    },
    async save() {
      this.saving = true;
      try {
        const res = await api.popups.POST({ type: "welcome", ...this.form });
        if (res.data && res.data.error) {
          this.$refs.toast.error(res.data.msg || "No se pudo guardar");
          return;
        }
        this.$refs.toast.success("Pop-up guardado");
      } catch (err) {
        const msg = err.response && err.response.data && err.response.data.msg;
        this.$refs.toast.error(msg || "No se pudo guardar");
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.pw-page { padding: 8px 20px 28px; max-width: 1180px; }
.pw-back { background: none; border: 0; color: #e91e63; font-weight: 700; cursor: pointer; padding: 0; margin-bottom: 10px; }
.pw-head { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 1.1rem; }
.pw-head h1 { font-size: 1.55rem; margin: 0 0 .25rem; color: #111827; }
.pw-head p, .pw-help { color: #64748b; margin: .2rem 0 0; font-size: .88rem; line-height: 1.4; }
.pw-switch { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.pw-switch input { display: none; }
.pw-switch i { width: 44px; height: 24px; border-radius: 999px; background: #e5e7eb; position: relative; display: inline-block; }
.pw-switch i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: .2s; }
.pw-switch input:checked + i { background: #e91e63; }
.pw-switch input:checked + i::after { left: 23px; }
.pw-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) 400px; gap: 18px; }
.pw-card, .pw-preview { background: #fff; border: 1px solid #ececec; border-radius: 18px; padding: 18px; }
.pw-preview h2 { margin: 0 0 4px; font-size: 1.02rem; }
.pw-field { display: flex; gap: 12px; margin-bottom: 18px; }
.pw-num { width: 28px; height: 28px; border-radius: 50%; background: #e91e63; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
.pw-body { flex: 1; }
.pw-body label { display: block; font-weight: 800; margin-bottom: 6px; color: #111827; }
.pw-mini { display: block; color: #64748b; font-size: 12px; margin-bottom: 4px; }
.pw-input-wrap { position: relative; }
.pw-input-wrap small { position: absolute; right: 10px; bottom: 8px; color: #94a3b8; font-size: 11px; }
.pw-body input, .pw-body textarea, .pw-body select { width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 12px; background: #f8fafc; }
.pw-body textarea { padding-bottom: 22px; }
.pw-video-row { display: flex; gap: 14px; align-items: center; }
.pw-video-row video, .pw-video-empty { width: 180px; height: 108px; object-fit: cover; border-radius: 14px; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pw-file { display: inline-flex; border: 1.5px solid #f9a8d4; color: #e91e63; border-radius: 12px; padding: 8px 14px; font-weight: 700; width: fit-content; cursor: pointer; background: #fff; }
.pw-file-sm { font-size: 12px; padding: 6px 10px; }
.pw-file input { display: none; }
.pw-icon-row { display: grid; grid-template-columns: 120px 1fr; gap: 12px; align-items: start; }
.pw-icon-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.pw-icon { width: 54px; height: 54px; border-radius: 50%; background: #fff1f6; color: #e91e63; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid #f9a8d4; }
.pw-icon img, .pw-icon svg { width: 28px; height: 28px; }
.pw-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pw-save { background: #e91e63; color: #fff; border: 0; border-radius: 12px; padding: 10px 18px; font-weight: 700; cursor: pointer; }
.pw-phone { margin-top: 12px; background: #4b5563; border-radius: 22px; padding: 18px 14px; }
.pw-loading { padding: 2rem 0; color: #64748b; }
@media (max-width: 980px) {
  .pw-grid, .pw-btn-grid, .pw-icon-row { grid-template-columns: 1fr; }
}
</style>

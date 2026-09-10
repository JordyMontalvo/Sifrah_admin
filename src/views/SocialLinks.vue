<template>
  <Layout>
    <section class="sl-page">
      <div class="sl-wrap">
        <header class="sl-hero">
          <h1 class="sl-hero-title">Redes sociales</h1>
          <p class="sl-hero-text">
            Edita los enlaces de Facebook, YouTube, TikTok y WhatsApp.
            Los cambios se ven en los íconos de inicio de sesión y en el acceso Soporte del menú.
          </p>
        </header>

        <div v-if="loading" class="sl-loading">
          <div class="sl-spinner"></div>
          <p>Cargando enlaces...</p>
        </div>

        <div v-else class="sl-card">
          <div class="sl-banner">
            <div class="sl-banner-icon">
              <i class="fas fa-share-alt"></i>
            </div>
            <div class="sl-banner-copy">
              <h2 class="sl-banner-title">Enlaces públicos</h2>
              <p class="sl-banner-text">
                Guarda la URL completa. En WhatsApp también puedes ingresar el número con código de país.
              </p>
            </div>
          </div>

          <div class="sl-body">
            <div class="sl-grid">
              <div
                v-for="field in fields"
                :key="field.key"
                class="sl-item"
                :class="'is-' + field.key"
              >
                <label class="sl-label" :for="'sl-' + field.key">
                  <span class="sl-label-icon" :class="field.key">
                    <i :class="field.icon"></i>
                  </span>
                  <span class="sl-label-text">{{ field.label }}</span>
                </label>
                <input
                  :id="'sl-' + field.key"
                  class="sl-input"
                  type="text"
                  inputmode="url"
                  autocomplete="off"
                  spellcheck="false"
                  v-model="form[field.key]"
                  :placeholder="field.placeholder"
                  :disabled="saving"
                />
                <p class="sl-help">{{ field.help }}</p>
              </div>
            </div>

            <div class="sl-preview">
              <div class="sl-preview-copy">
                <h3 class="sl-preview-title">Vista previa</h3>
                <p class="sl-preview-text">Así se verán los íconos al tocarlos.</p>
              </div>
              <div class="sl-preview-icons">
                <a
                  v-if="preview.facebook"
                  :href="preview.facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="sl-preview-icon facebook"
                  title="Facebook"
                >
                  <i class="fab fa-facebook-f"></i>
                </a>
                <a
                  v-if="preview.youtube"
                  :href="preview.youtube"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="sl-preview-icon youtube"
                  title="YouTube"
                >
                  <i class="fab fa-youtube"></i>
                </a>
                <a
                  v-if="preview.tiktok"
                  :href="preview.tiktok"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="sl-preview-icon tiktok"
                  title="TikTok"
                >
                  <i class="fab fa-tiktok"></i>
                </a>
                <a
                  v-if="preview.whatsapp"
                  :href="preview.whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="sl-preview-icon whatsapp"
                  title="WhatsApp"
                >
                  <i class="fab fa-whatsapp"></i>
                </a>
              </div>
            </div>

            <div class="sl-actions">
              <button
                type="button"
                class="sl-btn sl-btn-primary"
                :class="{ 'is-loading': saving }"
                @click="save"
                :disabled="saving"
              >
                <i class="fas fa-save"></i>
                Guardar cambios
              </button>
              <button
                type="button"
                class="sl-btn sl-btn-ghost"
                @click="reset"
                :disabled="saving"
              >
                <i class="fas fa-undo"></i>
                Restablecer
              </button>
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

const EMPTY_FORM = {
  facebook: "",
  youtube: "",
  tiktok: "",
  whatsapp: "",
};

export default {
  name: "SocialLinks",
  components: { Layout },
  data() {
    return {
      loading: true,
      saving: false,
      form: { ...EMPTY_FORM },
      original: { ...EMPTY_FORM },
      fields: [
        {
          key: "facebook",
          label: "Facebook",
          icon: "fab fa-facebook-f",
          placeholder: "https://www.facebook.com/...",
          help: "Enlace del perfil o página.",
        },
        {
          key: "youtube",
          label: "YouTube",
          icon: "fab fa-youtube",
          placeholder: "https://www.youtube.com/@...",
          help: "Enlace del canal.",
        },
        {
          key: "tiktok",
          label: "TikTok",
          icon: "fab fa-tiktok",
          placeholder: "https://www.tiktok.com/@...",
          help: "Enlace del perfil.",
        },
        {
          key: "whatsapp",
          label: "WhatsApp",
          icon: "fab fa-whatsapp",
          placeholder: "https://wa.me/51947254429",
          help: "Número con código de país o enlace wa.me. Se usa en inicio y en Soporte.",
        },
      ],
    };
  },
  computed: {
    preview() {
      return {
        facebook: this.toUrl(this.form.facebook),
        youtube: this.toUrl(this.form.youtube),
        tiktok: this.toUrl(this.form.tiktok),
        whatsapp: this.toWhatsApp(this.form.whatsapp),
      };
    },
  },
  created() {
    this.fetchLinks();
  },
  methods: {
    toUrl(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";
      if (/^https?:\/\//i.test(raw)) return raw;
      return `https://${raw}`;
    },
    toWhatsApp(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";
      if (/^https?:\/\//i.test(raw)) return raw;
      const digits = raw.replace(/[^\d]/g, "");
      if (!digits) return "";
      return `https://wa.me/${digits}`;
    },
    applyLinks(links) {
      const next = {
        facebook: (links && links.facebook) || "",
        youtube: (links && links.youtube) || "",
        tiktok: (links && links.tiktok) || "",
        whatsapp: (links && links.whatsapp) || "",
      };
      this.form = { ...next };
      this.original = { ...next };
    },
    async fetchLinks() {
      try {
        this.loading = true;
        const res = await api.socialLinks.GET();
        const links = (res.data && res.data.links) || {};
        this.applyLinks(links);
      } catch (err) {
        console.error("Error fetching social links:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los enlaces",
          timer: 2000,
          showConfirmButton: false,
        });
      } finally {
        this.loading = false;
      }
    },
    reset() {
      this.form = { ...this.original };
    },
    async save() {
      try {
        this.saving = true;
        const res = await api.socialLinks.POST({
          facebook: this.form.facebook,
          youtube: this.form.youtube,
          tiktok: this.form.tiktok,
          whatsapp: this.form.whatsapp,
        });
        const links = (res.data && res.data.links) || this.form;
        this.applyLinks(links);
        Swal.fire({
          icon: "success",
          title: "Guardado",
          text: "Los enlaces se actualizaron. El inicio y Soporte los usarán al recargar la app.",
          timer: 2200,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("Error saving social links:", err);
        const errorMessage =
          (err.response && err.response.data && err.response.data.msg) ||
          "No se pudieron guardar los enlaces";
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
.sl-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2.25rem 0 3rem;
}

.sl-wrap {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.sl-hero {
  margin-bottom: 1.75rem;
}

.sl-hero-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 0.65rem;
  line-height: 1.25;
}

.sl-hero-text {
  font-size: 1rem;
  line-height: 1.55;
  color: #6b7280;
  margin: 0;
  max-width: 46rem;
}

.sl-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: #6b7280;
}

.sl-spinner {
  width: 46px;
  height: 46px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: sl-spin 1s linear infinite;
  margin-bottom: 0.85rem;
}

@keyframes sl-spin {
  to { transform: rotate(360deg); }
}

.sl-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
  overflow: hidden;
}

.sl-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.sl-banner-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.05rem;
}

.sl-banner-copy {
  min-width: 0;
  flex: 1;
}

.sl-banner-title {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0 0 0.4rem;
  line-height: 1.3;
}

.sl-banner-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  opacity: 0.95;
}

.sl-body {
  padding: 1.75rem;
}

.sl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 1.5rem;
}

.sl-item {
  min-width: 0;
  padding: 1.1rem 1.15rem 1.15rem;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  background: #fafbff;
}

.sl-label {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.7rem;
}

.sl-label-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  font-size: 0.85rem;
}

.sl-label-icon.facebook { background: #1877f2; }
.sl-label-icon.youtube { background: #ff0000; }
.sl-label-icon.tiktok { background: #111; }
.sl-label-icon.whatsapp { background: #25d366; }

.sl-label-text {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.sl-input {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  height: 44px;
  padding: 0 0.9rem;
  border: 1px solid #d7dce5;
  border-radius: 10px;
  background: #fff;
  color: #1f2937;
  font-size: 0.92rem;
  line-height: 1.4;
  overflow-x: auto;
  white-space: nowrap;
}

.sl-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.18);
}

.sl-help {
  margin: 0.55rem 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #6b7280;
}

.sl-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.15rem 1.2rem;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  background: #fff;
}

.sl-preview-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.2rem;
}

.sl-preview-text {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.sl-preview-icons {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}

.sl-preview-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-decoration: none;
}

.sl-preview-icon.facebook { background: #1877f2; }
.sl-preview-icon.youtube { background: #ff0000; }
.sl-preview-icon.tiktok { background: #111; }
.sl-preview-icon.whatsapp { background: #25d366; }

.sl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.sl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 44px;
  padding: 0 1.15rem;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.sl-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.sl-btn-primary {
  background: #667eea;
  color: #fff;
}

.sl-btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.sl-btn-ghost {
  background: #fff;
  color: #374151;
  border-color: #d7dce5;
}

.sl-btn-ghost:hover:not(:disabled) {
  background: #f3f4f6;
}

@media (max-width: 800px) {
  .sl-grid {
    grid-template-columns: 1fr;
  }

  .sl-preview {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

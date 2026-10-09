<template>
  <Layout>
    <div class="legal-admin">
      <header class="legal-head">
        <div>
          <h1 class="title is-4 mb-1">Documentos legales</h1>
          <p class="section-note">
            Redacta Términos y Condiciones y la Política de Privacidad. Al guardar, el socio los ve en su perfil.
          </p>
        </div>
        <button class="button is-primary" type="button" :disabled="saving || loading" @click="save">
          {{ saving ? "Guardando..." : "Guardar" }}
        </button>
      </header>

      <div class="tabs is-boxed">
        <ul>
          <li :class="{ 'is-active': active === 'terms' }">
            <a @click="switchDoc('terms')">Términos y Condiciones</a>
          </li>
          <li :class="{ 'is-active': active === 'privacy' }">
            <a @click="switchDoc('privacy')">Política de Privacidad</a>
          </li>
        </ul>
      </div>

      <div v-if="loading" class="legal-loading">Cargando documentos...</div>

      <div v-else class="legal-panel">
        <div class="legal-toolbar">
          <div class="toolbar-group">
            <button type="button" @mousedown.prevent="format('bold')" title="Negrita"><b>B</b></button>
            <button type="button" @mousedown.prevent="format('italic')" title="Cursiva"><i>I</i></button>
            <button type="button" @mousedown.prevent="format('underline')" title="Subrayado"><u>U</u></button>
          </div>

          <div class="toolbar-divider"></div>

          <div class="toolbar-group">
            <button type="button" @mousedown.prevent="formatBlock('h2')">Título</button>
            <button type="button" @mousedown.prevent="formatBlock('p')">Párrafo</button>
            <button type="button" @mousedown.prevent="format('insertUnorderedList')">Lista</button>
            <button type="button" @mousedown.prevent="format('insertOrderedList')">Numerada</button>
            <button type="button" @mousedown.prevent="addLink">Enlace</button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- Selector de color de letra -->
          <div class="toolbar-group color-group">
            <span class="color-label">Color:</span>
            <div class="color-presets">
              <button
                v-for="c in colorPresets"
                :key="c.value"
                type="button"
                class="color-preset-btn"
                :class="{ 'is-active': currentColor === c.value }"
                :style="{ backgroundColor: c.value }"
                :title="c.name"
                @mousedown.prevent="applyTextColor(c.value)"
              ></button>
            </div>
            <label class="color-picker-label" title="Personalizar color de letra">
              <input
                type="color"
                v-model="currentColor"
                @input="applyTextColor($event.target.value)"
                @change="applyTextColor($event.target.value)"
                class="color-picker-input"
              />
              <span class="color-picker-icon" :style="{ color: currentColor }">🎨</span>
            </label>
          </div>
        </div>
        <div
          ref="editor"
          class="legal-editor"
          contenteditable="true"
          @paste="onPaste"
        ></div>
        <p class="section-note">Última actualización: {{ updatedLabel }}</p>
      </div>

      <Toast ref="toast" />
    </div>
  </Layout>
</template>

<script>
import Layout from "./Layout.vue";
import Toast from "@/components/Toast.vue";
import api from "@/api";

export default {
  name: "LegalDocuments",
  components: { Layout, Toast },
  data() {
    return {
      loading: true,
      saving: false,
      active: "terms",
      currentColor: "#e91e63",
      colorPresets: [
        { name: "Sifrah Rosa", value: "#e91e63" },
        { name: "Negro", value: "#2d2d2d" },
        { name: "Gris", value: "#6b7280" },
        { name: "Azul", value: "#2563eb" },
        { name: "Verde", value: "#16a34a" },
        { name: "Rojo", value: "#dc2626" },
        { name: "Naranja", value: "#d97706" },
        { name: "Morado", value: "#7c3aed" },
      ],
      docs: {
        terms: { html: "", updatedAt: null },
        privacy: { html: "", updatedAt: null },
      },
    };
  },
  computed: {
    updatedLabel() {
      const value = this.docs[this.active] && this.docs[this.active].updatedAt;
      if (!value) return "sin guardar";
      const date = new Date(value);
      if (isNaN(date.getTime())) return "sin guardar";
      const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return date.getDate() + " de " + months[date.getMonth()] + " de " + date.getFullYear();
    },
  },
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.legal.GET();
        const documents = (res.data && res.data.documents) || {};
        ["terms", "privacy"].forEach((key) => {
          const doc = documents[key] || {};
          this.docs[key] = {
            html: doc.html || "",
            updatedAt: doc.updatedAt || null,
          };
        });
        this.$nextTick(() => this.fillEditor());
      } catch (err) {
        if (this.$refs.toast) this.$refs.toast.error("No se pudieron cargar los documentos");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.fillEditor());
      }
    },
    fillEditor() {
      if (!this.$refs.editor) return;
      this.$refs.editor.innerHTML = this.docs[this.active].html || "";
    },
    capture() {
      if (!this.$refs.editor) return;
      this.docs[this.active].html = this.$refs.editor.innerHTML;
    },
    switchDoc(key) {
      if (key === this.active) return;
      this.capture();
      this.active = key;
      this.$nextTick(() => this.fillEditor());
    },
    format(command) {
      document.execCommand(command, false, null);
      this.capture();
    },
    formatBlock(tag) {
      document.execCommand("formatBlock", false, tag);
      this.capture();
    },
    applyTextColor(color) {
      if (!color) return;
      this.currentColor = color;
      document.execCommand("foreColor", false, color);
      this.capture();
    },
    addLink() {
      const url = window.prompt("Pega el enlace", "https://");
      if (!url) return;
      document.execCommand("createLink", false, url);
      this.capture();
    },
    onPaste(event) {
      event.preventDefault();
      const text = (event.clipboardData && event.clipboardData.getData("text/plain")) || "";
      document.execCommand("insertText", false, text);
      this.capture();
    },
    async save() {
      this.capture();
      this.saving = true;
      try {
        const res = await api.legal.POST({
          doc: this.active,
          html: this.docs[this.active].html,
        });
        if (res.data && res.data.error) {
          this.$refs.toast.error(res.data.msg || "No se pudo guardar");
          return;
        }
        const saved = res.data && res.data.document;
        if (saved) {
          this.docs[this.active].html = saved.html;
          this.docs[this.active].updatedAt = saved.updatedAt;
          this.fillEditor();
        }
        this.$refs.toast.success("Documento guardado");
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
.legal-admin {
  padding: 1.5rem;
}
.legal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.section-note {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.4;
}
.legal-panel {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  padding: 12px;
}
.legal-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 12px;
}
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #cbd5e1;
  margin: 0 4px;
}
.legal-toolbar button {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 6px;
  min-width: 34px;
  height: 32px;
  padding: 0 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  transition: all 0.15s ease;
}
.legal-toolbar button:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}
.color-group {
  gap: 8px;
}
.color-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.color-presets {
  display: flex;
  align-items: center;
  gap: 5px;
}
.color-preset-btn {
  min-width: 22px !important;
  width: 22px !important;
  height: 22px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  border: 2px solid #ffffff !important;
  box-shadow: 0 0 0 1px #cbd5e1;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.color-preset-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 2px #e91e63 !important;
}
.color-preset-btn.is-active {
  box-shadow: 0 0 0 2px #e91e63 !important;
}
.color-picker-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 32px;
  height: 32px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}
.color-picker-label:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
.color-picker-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  top: 0;
  left: 0;
}
.color-picker-icon {
  font-size: 15px;
  pointer-events: none;
}
.legal-editor {
  min-height: 420px;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 16px 18px;
  outline: none;
  line-height: 1.6;
  background: #fff;
}
.legal-editor:focus {
  border-color: #e91e63;
}
.legal-editor >>> h2 {
  font-size: 1.15rem;
  margin: 1rem 0 0.4rem;
}
.legal-editor >>> p,
.legal-editor >>> li {
  margin: 0 0 0.6rem;
}
.legal-loading {
  padding: 2rem 0;
  color: #777;
}
</style>

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
          <button type="button" @mousedown.prevent="format('bold')"><b>B</b></button>
          <button type="button" @mousedown.prevent="format('italic')"><i>I</i></button>
          <button type="button" @mousedown.prevent="format('underline')"><u>U</u></button>
          <button type="button" @mousedown.prevent="formatBlock('h2')">Título</button>
          <button type="button" @mousedown.prevent="formatBlock('p')">Párrafo</button>
          <button type="button" @mousedown.prevent="format('insertUnorderedList')">Lista</button>
          <button type="button" @mousedown.prevent="format('insertOrderedList')">Numerada</button>
          <button type="button" @mousedown.prevent="addLink">Enlace</button>
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
  gap: 6px;
  margin-bottom: 10px;
}
.legal-toolbar button {
  border: 1px solid #e5e5e5;
  background: #fafafa;
  border-radius: 8px;
  min-width: 36px;
  height: 34px;
  padding: 0 10px;
  cursor: pointer;
  font-size: 13px;
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
  color: #e91e63;
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

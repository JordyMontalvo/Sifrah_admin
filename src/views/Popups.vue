<template>
  <Layout>
    <div class="pu-page">
      <button class="pu-back" type="button" @click="$router.go(-1)">← Volver</button>
      <header class="pu-head">
        <div>
          <h1>Pop-up de imagen</h1>
          <p>Configura el pop-up visual para usuarios no afiliados o mensajes institucionales.</p>
        </div>
        <button type="button" class="pu-switch" :class="{ on: form.active }" @click="toggleActive">
          <i></i>
          <span>{{ form.active ? "Activo" : "Inactivo" }}</span>
        </button>
      </header>

      <div v-if="loading" class="pu-loading">Cargando pop-ups...</div>

      <div v-else class="pu-grid">
        <section class="pu-card">
          <h2>Tipo de pop-up</h2>
          <p class="pu-help">Selecciona en qué contexto se mostrará este pop-up.</p>
          <div class="pu-types">
            <button type="button" :class="{ on: type === 'unaffiliated' }" @click="switchType('unaffiliated')">
              No afiliados
            </button>
            <button type="button" :class="{ on: type === 'institutional' }" @click="switchType('institutional')">
              Mensaje institucional
            </button>
          </div>

          <div class="pu-line"></div>

          <h2>Imagen del pop-up</h2>
          <p class="pu-help">Sube la imagen que se mostrará completa en el pop-up.</p>
          <div class="pu-upload">
            <div class="pu-thumb">
              <img v-if="form.image" :src="form.image" alt="Pop-up" />
              <span v-else>Sin imagen</span>
            </div>
            <div>
              <label class="pu-file">
                <input type="file" accept="image/jpeg,image/png,image/webp" @change="onImage" />
                ↑ {{ uploading ? "Subiendo..." : (form.image ? "Cambiar imagen" : "Subir imagen") }}
              </label>
              <p class="pu-help">Formatos: JPG, PNG, WebP<br />Tamaño recomendado: 1080 x 1920 px</p>
            </div>
          </div>
          <div class="pu-note">
            <span class="pu-note-icon">🖼</span>
            <p>Este formato utiliza <b>una sola imagen</b> con el mensaje ya incorporado en el diseño.</p>
          </div>
          <button class="pu-save" type="button" :disabled="saving || uploading" @click="save">
            {{ saving ? "Guardando..." : "Guardar" }}
          </button>
        </section>

        <aside class="pu-preview">
          <h2>Vista previa</h2>
          <p class="pu-help">Así se verá el pop-up para el usuario.</p>
          <div class="pu-phone">
            <div class="pu-modal">
              <button class="pu-x" type="button" aria-label="Cerrar">×</button>
              <img v-if="form.image" :src="form.image" alt="" />
              <div v-else class="pu-empty">Sube una imagen para ver la vista previa</div>
            </div>
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
import api from "@/api";
import lib from "@/lib";

export default {
  name: "Popups",
  components: { Layout, Toast },
  data() {
    return {
      loading: true,
      saving: false,
      uploading: false,
      type: "unaffiliated",
      popups: {
        unaffiliated: { active: false, image: "" },
        institutional: { active: false, image: "" },
      },
      form: { active: false, image: "" },
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
        const popups = (res.data && res.data.popups) || {};
        this.popups.unaffiliated = {
          active: !!(popups.unaffiliated && popups.unaffiliated.active),
          image: (popups.unaffiliated && popups.unaffiliated.image) || "",
        };
        this.popups.institutional = {
          active: !!(popups.institutional && popups.institutional.active),
          image: (popups.institutional && popups.institutional.image) || "",
        };
        this.applyType();
      } catch (err) {
        if (this.$refs.toast) this.$refs.toast.error("No se pudieron cargar los pop-ups");
      } finally {
        this.loading = false;
      }
    },
    applyType() {
      const current = this.popups[this.type] || { active: false, image: "" };
      this.form = { active: !!current.active, image: current.image || "" };
    },
    switchType(type) {
      this.popups[this.type] = { ...this.form };
      this.type = type;
      this.applyType();
    },
    async toggleActive() {
      const next = !this.form.active;
      if (next && !this.form.image) {
        this.$refs.toast.error("Sube una imagen antes de activar el pop-up");
        return;
      }
      this.form.active = next;
      await this.save();
    },
    async onImage(event) {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file) return;
      this.uploading = true;
      try {
        const url = await lib.upload(file, "popup_" + this.type + "_" + Date.now() + "_" + file.name, "popup_images");
        this.form.image = url;
        this.$refs.toast.success("Imagen subida");
      } catch (err) {
        this.$refs.toast.error("No se pudo subir la imagen");
      } finally {
        this.uploading = false;
      }
    },
    async save() {
      this.saving = true;
      try {
        const res = await api.popups.POST({
          type: this.type,
          active: this.form.active,
          image: this.form.image,
        });
        if (res.data && res.data.error) {
          this.$refs.toast.error(res.data.msg || "No se pudo guardar");
          return;
        }
        this.popups[this.type] = { ...this.form };
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
.pu-page { padding: 8px 20px 28px; max-width: 1180px; }
.pu-back { background: none; border: 0; color: #e91e63; font-weight: 700; cursor: pointer; padding: 0; margin-bottom: 10px; }
.pu-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1.1rem; }
.pu-head h1 { font-size: 1.7rem; margin: 0 0 .25rem; color: #111827; }
.pu-head p, .pu-help { color: #64748b; margin: 0; font-size: .9rem; line-height: 1.4; }
.pu-switch { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #334155; background: none; border: 0; cursor: pointer; padding: 0; }
.pu-switch i { width: 44px; height: 24px; border-radius: 999px; background: #e5e7eb; position: relative; display: inline-block; }
.pu-switch i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: .2s; }
.pu-switch.on i { background: #e91e63; }
.pu-switch.on i::after { left: 23px; }
.pu-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) 420px; gap: 18px; }
.pu-card, .pu-preview { background: #fff; border: 1px solid #ececec; border-radius: 18px; padding: 20px; }
.pu-card h2, .pu-preview h2 { font-size: 1.02rem; margin: 0 0 .35rem; color: #111827; }
.pu-types { display: flex; gap: 8px; margin: 12px 0 8px; }
.pu-types button { border: 0; border-radius: 999px; padding: 9px 16px; background: #fce7f3; color: #be185d; font-weight: 700; cursor: pointer; }
.pu-types button.on { background: #e91e63; color: #fff; }
.pu-line { height: 1px; background: #f1f5f9; margin: 16px 0; }
.pu-upload { display: flex; gap: 18px; align-items: center; margin: 14px 0; }
.pu-thumb { width: 150px; height: 210px; border-radius: 16px; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; box-shadow: 0 8px 20px rgba(15,23,42,.08); }
.pu-thumb img { width: 100%; height: 100%; object-fit: cover; }
.pu-file { display: inline-flex; align-items: center; border: 1.5px solid #f9a8d4; color: #e91e63; border-radius: 14px; padding: 9px 14px; font-weight: 700; cursor: pointer; background: #fff; }
.pu-file input { display: none; }
.pu-note { background: #fdf2f8; color: #9d174d; border-radius: 16px; padding: 14px; margin: 16px 0; display: flex; gap: 10px; align-items: center; }
.pu-note p { margin: 0; }
.pu-note-icon { width: 38px; height: 38px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; }
.pu-save { background: #e91e63; color: #fff; border: 0; border-radius: 12px; padding: 10px 18px; font-weight: 700; cursor: pointer; }
.pu-phone { margin-top: 12px; background: #4b5563; border-radius: 22px; min-height: 560px; padding: 28px 18px; display: flex; align-items: center; justify-content: center; }
.pu-modal { position: relative; width: 100%; max-width: 280px; background: #fff; border-radius: 26px; overflow: hidden; min-height: 460px; box-shadow: 0 18px 40px rgba(0,0,0,.25); }
.pu-modal img { width: 100%; display: block; }
.pu-empty { padding: 80px 16px; text-align: center; color: #94a3b8; }
.pu-x { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border: 0; border-radius: 50%; background: rgba(255,255,255,.95); color: #64748b; font-size: 18px; }
.pu-loading { padding: 2rem 0; color: #64748b; }
@media (max-width: 980px) {
  .pu-grid { grid-template-columns: 1fr; }
}
</style>

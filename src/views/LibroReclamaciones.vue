<template>
  <Layout>
    <section class="lr">
      <!-- Encabezado -->
      <header class="lr-head">
        <svg class="lr-head__icon" viewBox="0 0 64 48" aria-hidden="true">
          <path d="M4 6c9-3 19-3 28 3v35c-9-6-19-6-28-3z" />
          <path d="M60 6c-9-3-19-3-28 3v35c9-6 19-6 28-3z" />
          <path d="M8 44c8-2 16-1 24 3 8-4 16-5 24-3" />
        </svg>
        <span class="lr-head__divider" aria-hidden="true"></span>
        <div>
          <h1 class="lr-head__title">Libro de Reclamaciones</h1>
          <p class="lr-head__sub">Gestión y seguimiento de reclamos y quejas de consumidores.</p>
        </div>
      </header>

      <!-- Resumen, filtros y exportación -->
      <div class="lr-toolbar">
        <div class="lr-stats">
          <div class="lr-stat lr-stat--main">
            <span class="lr-stat__icon"><i class="far fa-file-alt"></i></span>
            <div>
              <p class="lr-stat__label">Total de registros</p>
              <p class="lr-stat__value">{{ summary.total }}</p>
            </div>
          </div>
          <div class="lr-stat">
            <span class="lr-stat__icon"><i class="fas fa-bullhorn"></i></span>
            <div>
              <p class="lr-stat__label">Reclamos</p>
              <p class="lr-stat__value">{{ summary.reclamos }}</p>
            </div>
          </div>
          <div class="lr-stat">
            <span class="lr-stat__icon"><i class="far fa-comment-dots"></i></span>
            <div>
              <p class="lr-stat__label">Quejas</p>
              <p class="lr-stat__value">{{ summary.quejas }}</p>
            </div>
          </div>
        </div>

        <div class="lr-filters">
          <label class="lr-filter">
            <span>Estado</span>
            <select v-model="filters.status">
              <option value="all">Todos</option>
              <option v-for="(label, key) in statuses" :key="key" :value="key">{{ label }}</option>
            </select>
          </label>
          <label class="lr-filter">
            <span>Tipo</span>
            <select v-model="filters.kind">
              <option value="all">Todos</option>
              <option value="reclamo">Reclamo</option>
              <option value="queja">Queja</option>
            </select>
          </label>
          <div class="lr-filter">
            <span>Fecha</span>
            <div class="lr-daterange">
              <i class="far fa-calendar"></i>
              <input v-model="filters.from" type="date" aria-label="Desde" :max="filters.to || undefined" />
              <span class="lr-daterange__sep">–</span>
              <input v-model="filters.to" type="date" aria-label="Hasta" :min="filters.from || undefined" />
              <button v-if="filters.from || filters.to" type="button" class="lr-daterange__clear" title="Quitar fechas" @click="filters.from = ''; filters.to = ''">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <button type="button" class="lr-btn lr-btn--primary lr-export" :disabled="!filtered.length" @click="exportExcel">
            <i class="fas fa-download"></i> Exportar
          </button>
        </div>
      </div>

      <div class="lr-search">
        <i class="fas fa-search"></i>
        <input v-model.trim="search" type="search" placeholder="Buscar por nombre, documento o N° de registro..." />
      </div>

      <p v-if="loadError" class="lr-alert">{{ loadError }}</p>

      <!-- Tabla -->
      <div class="lr-table-card">
        <div class="lr-table-wrap">
          <table class="lr-table">
            <thead>
              <tr>
                <th>N.º<br />Registro</th>
                <th>Fecha y Hora</th>
                <th>Consumidor</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Producto /<br />Tipo de operación</th>
                <th class="is-center">Monto<br />pagado</th>
                <th class="is-center">Tipo</th>
                <th>Descripción (resumen)</th>
                <th>Estado</th>
                <th class="is-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="11" class="lr-empty"><i class="fas fa-spinner fa-spin"></i> Cargando registros...</td>
              </tr>
              <tr v-else-if="!pageRows.length">
                <td colspan="11" class="lr-empty">
                  {{ complaints.length ? "No hay registros que coincidan con los filtros." : "Aún no hay reclamos ni quejas registrados." }}
                </td>
              </tr>
              <tr v-for="row in pageRows" v-else :key="row.id">
                <td><span class="lr-code">{{ row.code }}</span></td>
                <td class="nowrap">{{ formatDate(row.created_at) }}<br />{{ formatTime(row.created_at) }}</td>
                <td class="lr-consumer">
                  <strong>{{ row.consumer.full_name }}</strong>
                  <small><span class="muted">Domicilio:</span> {{ row.consumer.address }}</small>
                  <small v-if="row.consumer.is_minor" class="lr-minor">Menor de edad · {{ row.consumer.guardian }}</small>
                </td>
                <td class="nowrap">{{ row.consumer.doc_type_label }}<br />{{ row.consumer.doc_number }}</td>
                <td class="lr-contact">
                  <span v-if="row.consumer.phone">{{ row.consumer.phone }}</span>
                  <small v-if="row.consumer.email">{{ row.consumer.email }}</small>
                </td>
                <td class="lr-product">
                  <strong>{{ row.product.operation_type_label }}</strong>
                  <small><span class="muted">Producto:</span> {{ row.product.products }}</small>
                </td>
                <td class="is-center nowrap">{{ formatAmount(row.product.amount) }}</td>
                <td class="is-center">
                  <span class="lr-pill" :class="row.detail.kind === 'queja' ? 'lr-pill--queja' : 'lr-pill--reclamo'">{{ row.detail.kind_label }}</span>
                </td>
                <td><p class="lr-desc" :title="row.detail.description">{{ row.detail.description }}</p></td>
                <td>
                  <span class="lr-status" :class="`lr-status--${row.status}`">
                    <i :class="statusIcon(row.status)"></i> {{ row.status_label }}
                  </span>
                </td>
                <td>
                  <div class="lr-actions">
                    <button type="button" class="lr-icon-btn" title="Ver registro" aria-label="Ver registro" @click="openDetail(row)"><i class="far fa-eye"></i></button>
                    <button type="button" class="lr-icon-btn" title="Descargar PDF" aria-label="Descargar PDF" @click="downloadPdf(row)"><i class="fas fa-download"></i></button>
                    <button type="button" class="lr-icon-btn" title="Responder / cambiar estado" aria-label="Responder" @click="openReply(row)"><i class="fas fa-reply"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="lr-pager">
          <span>Mostrando {{ rangeText }}</span>
          <div class="lr-pager__nav">
            <button type="button" class="lr-icon-btn" :disabled="page <= 1" aria-label="Página anterior" @click="page--"><i class="fas fa-chevron-left"></i></button>
            <button v-for="n in pageNumbers" :key="n" type="button" class="lr-icon-btn lr-page" :class="{ 'is-active': n === page }" @click="page = n">{{ n }}</button>
            <button type="button" class="lr-icon-btn" :disabled="page >= totalPages" aria-label="Página siguiente" @click="page++"><i class="fas fa-chevron-right"></i></button>
          </div>
        </footer>
      </div>

      <!-- Detalle -->
      <div v-if="detail" class="lr-modal" role="dialog" aria-modal="true" @click.self="detail = null">
        <div class="lr-modal__box">
          <header class="lr-modal__head">
            <div>
              <p class="lr-modal__kicker">{{ detail.detail.kind_label }} · {{ formatDate(detail.created_at) }} {{ formatTime(detail.created_at) }}</p>
              <h2>N.º {{ detail.code }}</h2>
            </div>
            <span class="lr-status" :class="`lr-status--${detail.status}`"><i :class="statusIcon(detail.status)"></i> {{ detail.status_label }}</span>
            <button type="button" class="lr-modal__x" aria-label="Cerrar" @click="detail = null"><i class="fas fa-times"></i></button>
          </header>
          <div class="lr-modal__body">
            <h3>Información del consumidor</h3>
            <dl class="lr-dl">
              <dt>Nombres</dt><dd>{{ detail.consumer.names }}</dd>
              <dt>Apellido paterno</dt><dd>{{ detail.consumer.last_name_father }}</dd>
              <dt>Apellido materno</dt><dd>{{ detail.consumer.last_name_mother }}</dd>
              <template v-if="detail.consumer.is_minor">
                <dt>Menor de edad</dt><dd>Sí</dd>
                <dt>Padre, madre o representante</dt><dd>{{ detail.consumer.guardian }}</dd>
              </template>
              <dt>Domicilio</dt><dd>{{ detail.consumer.address }}</dd>
              <dt>Documento</dt><dd>{{ detail.consumer.doc_type_label }} {{ detail.consumer.doc_number }}</dd>
              <dt>{{ detail.consumer.email ? "Correo electrónico" : "Teléfono" }}</dt><dd>{{ detail.consumer.email || detail.consumer.phone }}</dd>
            </dl>
            <h3>Información del producto</h3>
            <dl class="lr-dl">
              <dt>Tipo de operación</dt><dd>{{ detail.product.operation_type_label }}</dd>
              <dt>Producto(s)</dt><dd>{{ detail.product.products }}</dd>
              <dt>Monto pagado</dt><dd>{{ formatAmount(detail.product.amount) }}</dd>
            </dl>
            <h3>Detalle</h3>
            <p class="lr-label">Descripción de los hechos</p>
            <p class="lr-text">{{ detail.detail.description }}</p>
            <p class="lr-label">Solicitud de solución</p>
            <p class="lr-text">{{ detail.detail.request }}</p>
            <template v-if="detail.response">
              <h3>Respuesta</h3>
              <p class="lr-label">
                {{ formatDate(detail.response.updated_at) }} {{ formatTime(detail.response.updated_at) }}
                <span v-if="detail.response.email_sent"> · enviada por correo</span>
              </p>
              <p class="lr-text">{{ detail.response.text }}</p>
            </template>
          </div>
          <footer class="lr-modal__foot">
            <button type="button" class="lr-btn" @click="downloadPdf(detail)"><i class="fas fa-download"></i> Descargar PDF</button>
            <button type="button" class="lr-btn lr-btn--primary" @click="openReply(detail)"><i class="fas fa-reply"></i> Responder</button>
          </footer>
        </div>
      </div>

      <!-- Responder / cambiar estado -->
      <div v-if="reply" class="lr-modal" role="dialog" aria-modal="true" @click.self="closeReply">
        <form class="lr-modal__box lr-modal__box--sm" @submit.prevent="saveReply">
          <header class="lr-modal__head">
            <div>
              <p class="lr-modal__kicker">{{ reply.row.detail.kind_label }} · {{ reply.row.consumer.full_name }}</p>
              <h2>Responder N.º {{ reply.row.code }}</h2>
            </div>
            <button type="button" class="lr-modal__x" aria-label="Cerrar" @click="closeReply"><i class="fas fa-times"></i></button>
          </header>
          <div class="lr-modal__body">
            <p class="lr-label">Solicitud del consumidor</p>
            <p class="lr-text">{{ reply.row.detail.request }}</p>

            <label class="lr-field">
              <span>Estado</span>
              <select v-model="reply.status" @change="reply.error = ''">
                <option v-for="(label, key) in statuses" :key="key" :value="key">{{ label }}</option>
              </select>
            </label>
            <label class="lr-field">
              <span>Respuesta al consumidor <em v-if="reply.status === 'atendido'">*</em></span>
              <textarea v-model="reply.response" rows="6" @input="reply.error = ''" maxlength="2000" placeholder="Escribe la respuesta o las acciones tomadas."></textarea>
              <small class="lr-count">{{ reply.response.length }} / 2000</small>
            </label>
            <label v-if="reply.row.consumer.email" class="lr-check">
              <input v-model="reply.notify" type="checkbox" :disabled="!reply.response.trim()" />
              Enviar la respuesta a {{ reply.row.consumer.email }}
            </label>
            <p v-else class="lr-label">El consumidor dejó un teléfono ({{ reply.row.consumer.phone }}); comunícate con él para darle la respuesta.</p>
            <p v-if="reply.error" class="lr-alert">{{ reply.error }}</p>
          </div>
          <footer class="lr-modal__foot">
            <button type="button" class="lr-btn" @click="closeReply">Cancelar</button>
            <button type="submit" class="lr-btn lr-btn--primary" :disabled="reply.saving">
              <i :class="reply.saving ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i> Guardar
            </button>
          </footer>
        </form>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { downloadComplaintPdf, formatLimaDate, formatLimaTime } from "@/utils/complaintPdf";

const PAGE_SIZE = 10;
const STATUSES = { pendiente: "Pendiente", en_proceso: "En proceso", atendido: "Atendido" };

// Fecha YYYY-MM-DD en hora de Lima, para comparar con los filtros "Desde/Hasta"
function limaDay(value) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}

export default {
  name: "LibroReclamaciones",
  components: { Layout },
  data() {
    return {
      loading: false,
      loadError: "",
      complaints: [],
      statuses: STATUSES,
      filters: { status: "all", kind: "all", from: "", to: "" },
      search: "",
      page: 1,
      detail: null,
      reply: null,
    };
  },
  computed: {
    summary() {
      return {
        total: this.complaints.length,
        reclamos: this.complaints.filter((c) => c.detail.kind === "reclamo").length,
        quejas: this.complaints.filter((c) => c.detail.kind === "queja").length,
      };
    },
    filtered() {
      const { status, kind, from, to } = this.filters;
      const q = this.search.toLowerCase();
      return this.complaints.filter((c) => {
        if (status !== "all" && c.status !== status) return false;
        if (kind !== "all" && c.detail.kind !== kind) return false;
        if (from || to) {
          const day = limaDay(c.created_at);
          if (from && day < from) return false;
          if (to && day > to) return false;
        }
        if (!q) return true;
        return [c.code, String(c.number), c.consumer.full_name, c.consumer.doc_number, c.consumer.email, c.consumer.phone, c.product.products]
          .some((v) => String(v || "").toLowerCase().includes(q));
      });
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filtered.length / PAGE_SIZE));
    },
    pageRows() {
      const start = (this.page - 1) * PAGE_SIZE;
      return this.filtered.slice(start, start + PAGE_SIZE);
    },
    pageNumbers() {
      // Ventana de hasta 5 páginas alrededor de la actual
      const last = this.totalPages;
      let start = Math.max(1, this.page - 2);
      const end = Math.min(last, start + 4);
      start = Math.max(1, end - 4);
      const pages = [];
      for (let n = start; n <= end; n++) pages.push(n);
      return pages;
    },
    rangeText() {
      const total = this.filtered.length;
      if (!total) return "0 registros";
      const start = (this.page - 1) * PAGE_SIZE + 1;
      const end = Math.min(total, this.page * PAGE_SIZE);
      return `${start} – ${end} de ${total} registro${total === 1 ? "" : "s"}`;
    },
  },
  watch: {
    filters: { deep: true, handler() { this.page = 1; } },
    search() { this.page = 1; },
    totalPages(n) { if (this.page > n) this.page = n; },
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.loadError = "";
      try {
        const { data } = await api.complaints.GET();
        if (data && data.error) {
          this.loadError = data.msg || "No se pudieron cargar los registros.";
          return;
        }
        this.complaints = (data && data.complaints) || [];
      } catch (err) {
        this.loadError = "No se pudieron cargar los registros.";
      } finally {
        this.loading = false;
      }
    },
    formatDate(value) {
      return value ? formatLimaDate(value) : "";
    },
    formatTime(value) {
      return value ? formatLimaTime(value) : "";
    },
    formatAmount(value) {
      return value == null ? "—" : `S/ ${Number(value).toFixed(2)}`;
    },
    statusIcon(status) {
      if (status === "atendido") return "fas fa-check";
      if (status === "en_proceso") return "fas fa-sync-alt";
      return "far fa-clock";
    },
    openDetail(row) {
      this.detail = row;
    },
    downloadPdf(row) {
      downloadComplaintPdf(row);
    },
    openReply(row) {
      this.detail = null;
      this.reply = {
        row,
        status: row.status === "pendiente" ? "en_proceso" : row.status,
        response: (row.response && row.response.text) || "",
        notify: false,
        saving: false,
        error: "",
      };
    },
    closeReply() {
      if (this.reply && this.reply.saving) return;
      this.reply = null;
    },
    async saveReply() {
      const r = this.reply;
      if (!r || r.saving) return;
      r.error = "";
      if (r.status === "atendido" && !r.response.trim()) {
        r.error = "Escribe la respuesta dada al consumidor para marcarlo como atendido.";
        return;
      }
      r.saving = true;
      try {
        const { data } = await api.complaints.update({
          id: r.row.id,
          status: r.status,
          response: r.response,
          notify: r.notify && !!r.response.trim(),
        });
        if (!data || data.error) {
          r.error = (data && data.msg) || "No se pudo guardar.";
          return;
        }
        const updated = data.complaint;
        const i = this.complaints.findIndex((c) => c.id === updated.id);
        if (i >= 0) this.$set(this.complaints, i, updated);
        this.reply = null;
        const mailNote = r.notify ? (updated.response && updated.response.email_sent ? " La respuesta se envió por correo." : " No se pudo enviar el correo; la respuesta quedó guardada.") : "";
        Swal.fire({ icon: "success", title: "Guardado", text: `N.º ${updated.code}: ${updated.status_label}.${mailNote}`, timer: 2600, showConfirmButton: false });
      } catch (err) {
        r.error = "No se pudo guardar. Revisa tu conexión.";
      } finally {
        if (this.reply) this.reply.saving = false;
      }
    },
    exportExcel() {
      const rows = this.filtered.map((c) => ({
        "N.º Registro": c.code,
        Fecha: this.formatDate(c.created_at),
        Hora: this.formatTime(c.created_at),
        Estado: c.status_label,
        Tipo: c.detail.kind_label,
        Nombres: c.consumer.names,
        "Apellido paterno": c.consumer.last_name_father,
        "Apellido materno": c.consumer.last_name_mother,
        "Menor de edad": c.consumer.is_minor ? "Sí" : "No",
        "Padre/madre o representante": c.consumer.guardian,
        Domicilio: c.consumer.address,
        "Tipo de documento": c.consumer.doc_type_label,
        "N.º de documento": c.consumer.doc_number,
        Correo: c.consumer.email,
        Teléfono: c.consumer.phone,
        "Tipo de operación": c.product.operation_type_label,
        "Producto(s)": c.product.products,
        "Monto pagado (S/)": c.product.amount == null ? "" : Number(c.product.amount),
        "Descripción de los hechos": c.detail.description,
        "Solicitud de solución": c.detail.request,
        Respuesta: (c.response && c.response.text) || "",
        "Fecha de respuesta": c.response && c.response.updated_at ? `${this.formatDate(c.response.updated_at)} ${this.formatTime(c.response.updated_at)}` : "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reclamaciones");
      const stamp = limaDay(new Date());
      XLSX.writeFile(wb, `Libro-de-Reclamaciones-${stamp}.xlsx`);
    },
  },
};
</script>

<style scoped>
.lr {
  --brand: #e91e63;
  --brand-dark: #c2185b;
  --brand-light: #fdeef4;
  --ink: #111111;
  --muted: #6b7280;
  --line: #e5e7eb;
  padding: 24px 12px 40px;
  color: var(--ink);
  max-width: 1440px;
  margin: 0 auto;
}

/* Encabezado */
.lr-head {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}
.lr-head__icon {
  width: 72px;
  height: 54px;
  flex-shrink: 0;
  fill: none;
  stroke: var(--brand);
  stroke-width: 3.2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.lr-head__divider {
  width: 2px;
  align-self: stretch;
  background: var(--brand);
  border-radius: 2px;
}
.lr-head__title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.15;
}
.lr-head__sub {
  margin: 4px 0 0;
  color: var(--muted);
}

/* Barra superior */
.lr-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px 18px;
  margin-bottom: 16px;
}
.lr-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.lr-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 150px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.lr-stat--main {
  background: var(--brand-light);
  border-color: rgba(233, 30, 99, 0.18);
}
.lr-stat__icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--brand);
  font-size: 1.35rem;
}
.lr-stat--main .lr-stat__icon {
  background: #fff;
}
.lr-stat__label {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}
.lr-stat__value {
  margin: 2px 0 0;
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
}
.lr-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-left: auto;
}
.lr-filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}
.lr-filter select,
.lr-daterange {
  height: 44px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  font-size: 0.95rem;
}
.lr-filter select {
  min-width: 128px;
  padding: 0 10px;
  cursor: pointer;
}
.lr-daterange {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: var(--muted);
}
.lr-daterange input {
  border: 0;
  background: transparent;
  font-size: 0.9rem;
  color: var(--ink);
  width: 116px;
}
.lr-daterange input:focus {
  outline: none;
}
.lr-daterange__sep {
  color: var(--muted);
}
.lr-daterange__clear {
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
}

/* Botones */
.lr-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 18px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}
.lr-btn:hover:not(:disabled) {
  background: #f9fafb;
}
.lr-btn--primary {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}
.lr-btn--primary:hover:not(:disabled) {
  background: var(--brand-dark);
}
.lr-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.lr-export {
  min-width: 136px;
}

/* Buscador */
.lr-search {
  position: relative;
  margin-bottom: 16px;
}
.lr-search i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
}
.lr-search input {
  width: 100%;
  height: 46px;
  padding: 0 16px 0 44px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 0.95rem;
  background: #fff;
}
.lr-search input:focus,
.lr-filter select:focus,
.lr-daterange:focus-within {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.12);
}

.lr-alert {
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fdecea;
  color: #b42318;
}

/* Tabla */
.lr-table-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}
.lr-table-wrap {
  overflow-x: auto;
}
.lr-table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.lr-table th {
  background: var(--brand-light);
  text-align: left;
  font-weight: 700;
  padding: 14px 10px;
  vertical-align: middle;
  line-height: 1.3;
}
.lr-table td {
  padding: 16px 10px;
  border-top: 1px solid var(--line);
  vertical-align: middle;
  line-height: 1.4;
}
.lr-table .is-center {
  text-align: center;
}
.nowrap {
  white-space: nowrap;
}
.lr-code {
  color: var(--brand);
  font-weight: 800;
  font-size: 1.1rem;
}
.lr-consumer,
.lr-contact,
.lr-product {
  min-width: 132px;
}
.lr-consumer strong,
.lr-product strong {
  display: block;
}
.lr-consumer small,
.lr-contact small,
.lr-product small {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
}
.lr-contact span {
  display: block;
  font-weight: 600;
}
.lr-contact small {
  word-break: break-all;
}
.muted {
  color: var(--muted);
}
.lr-minor {
  color: var(--brand);
  font-weight: 600;
}
.lr-desc {
  margin: 0;
  min-width: 160px;
  max-width: 230px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.lr-pill {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.82rem;
  border: 1px solid;
}
.lr-pill--reclamo {
  color: var(--brand);
  border-color: rgba(233, 30, 99, 0.45);
  background: var(--brand-light);
}
.lr-pill--queja {
  color: #7c3aed;
  border-color: rgba(124, 58, 237, 0.4);
  background: #f3edff;
}
.lr-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid;
  font-weight: 700;
  font-size: 0.82rem;
  white-space: nowrap;
}
.lr-status--pendiente {
  color: #b45309;
  background: #fff7e6;
  border-color: #f6c56b;
}
.lr-status--en_proceso {
  color: #1d4ed8;
  background: #eaf2ff;
  border-color: #93b4f5;
}
.lr-status--atendido {
  color: #15803d;
  background: #ecfdf3;
  border-color: #86d6a3;
}
.lr-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.lr-icon-btn {
  width: 38px;
  height: 38px;
  display: inline-grid;
  place-items: center;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  font-size: 0.95rem;
}
.lr-icon-btn:hover:not(:disabled) {
  border-color: var(--brand);
  color: var(--brand);
}
.lr-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.lr-empty {
  text-align: center;
  color: var(--muted);
  padding: 36px 12px !important;
}

/* Paginación */
.lr-pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-top: 1px solid var(--line);
  font-size: 0.9rem;
}
.lr-pager__nav {
  display: flex;
  gap: 8px;
}
.lr-page {
  font-weight: 700;
}
.lr-page.is-active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

/* Modales */
.lr-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(17, 17, 17, 0.5);
}
.lr-modal__box {
  width: 100%;
  max-width: 720px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}
.lr-modal__box--sm {
  max-width: 560px;
}
.lr-modal__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
}
.lr-modal__head > div {
  flex: 1;
  min-width: 0;
}
.lr-modal__head h2 {
  margin: 2px 0 0;
  font-size: 1.35rem;
  font-weight: 800;
}
.lr-modal__kicker {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}
.lr-modal__x {
  border: 0;
  background: none;
  font-size: 1.1rem;
  color: var(--muted);
  cursor: pointer;
  padding: 6px;
}
.lr-modal__body {
  padding: 8px 20px 20px;
  overflow-y: auto;
}
.lr-modal__body h3 {
  margin: 18px 0 8px;
  color: var(--brand);
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.lr-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--line);
}
.lr-dl {
  display: grid;
  grid-template-columns: minmax(150px, 36%) 1fr;
  gap: 6px 12px;
  margin: 0;
}
.lr-dl dt {
  color: var(--muted);
}
.lr-dl dd {
  margin: 0;
  font-weight: 600;
  word-break: break-word;
}
.lr-label {
  margin: 12px 0 4px;
  color: var(--muted);
  font-size: 0.88rem;
}
.lr-text {
  margin: 0;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}
.lr-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  font-weight: 600;
  font-size: 0.92rem;
}
.lr-field em {
  color: var(--brand);
  font-style: normal;
}
.lr-field select,
.lr-field textarea {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  font-family: inherit;
  font-weight: 400;
}
.lr-field select {
  height: 44px;
}
.lr-field textarea {
  resize: vertical;
}
.lr-field select:focus,
.lr-field textarea:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.12);
}
.lr-count {
  align-self: flex-end;
  color: var(--muted);
  font-weight: 400;
}
.lr-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 0.92rem;
  word-break: break-word;
}
.lr-check input {
  accent-color: var(--brand);
  width: 18px;
  height: 18px;
}

@media (max-width: 1100px) {
  .lr-filters {
    margin-left: 0;
  }
}
@media (max-width: 640px) {
  .lr {
    padding: 16px 12px 32px;
  }
  .lr-head__icon {
    width: 52px;
    height: 40px;
  }
  .lr-head__title {
    font-size: 1.45rem;
  }
  .lr-stats,
  .lr-filters {
    width: 100%;
  }
  .lr-stat {
    flex: 1 1 100%;
  }
  .lr-filter,
  .lr-export {
    flex: 1 1 100%;
  }
  .lr-filter select,
  .lr-daterange {
    width: 100%;
  }
  .lr-daterange input {
    flex: 1;
    width: auto;
    min-width: 0;
  }
  .lr-dl {
    grid-template-columns: 1fr;
  }
  .lr-dl dd {
    margin-bottom: 6px;
  }
  .lr-modal__foot {
    flex-direction: column-reverse;
  }
}
</style>

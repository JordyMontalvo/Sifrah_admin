<template>
  <Layout>
    <i class="load" v-if="loading"></i>

    <section v-if="!loading" class="cierre-wrapper">

      <!-- ─── Header ─── -->
      <div class="cierre-header">
        <div>
          <h1 class="cierre-title">⚡ Cierre de Mes</h1>
          <p class="cierre-subtitle">Motor Go (residual) + bonos logro/mantenimiento por rango</p>
        </div>
        <button class="btn-iniciar" :class="{ 'btn-iniciar--loading': calculating }" @click="closed" :disabled="calculating">
          <span v-if="!calculating">🚀 Iniciar Cierre</span>
          <span v-else>⚙️ Calculando...</span>
        </button>
      </div>

      <!-- ─── Summary Cards ─── -->
      <div class="summary-cards" v-if="tree && tree.length">
        <div class="summary-card">
          <span class="summary-card__icon">💰</span>
          <div>
            <span class="summary-card__label">Total Bono Residual</span>
            <strong class="summary-card__value">S/ {{ totalResidual.toFixed(2) }}</strong>
          </div>
        </div>
        <div class="summary-card">
          <span class="summary-card__icon">💎</span>
          <div>
            <span class="summary-card__label">Usuarios con Rango</span>
            <strong class="summary-card__value">{{ usersWithRank }}</strong>
          </div>
        </div>
        <div class="summary-card">
          <span class="summary-card__icon">✅</span>
          <div>
            <span class="summary-card__label">Activos Full</span>
            <strong class="summary-card__value">{{ activosFull }}</strong>
          </div>
        </div>
        <div class="summary-card">
          <span class="summary-card__icon">🌟</span>
          <div>
            <span class="summary-card__label">Activos Simple</span>
            <strong class="summary-card__value">{{ activosSimple }}</strong>
          </div>
        </div>
        <div class="summary-card summary-card--accent">
          <span class="summary-card__icon">🏆</span>
          <div>
            <span class="summary-card__label">Bono logro / mant. rango</span>
            <strong class="summary-card__value">S/ {{ totalRankBonus.toFixed(2) }}</strong>
          </div>
        </div>
        <div class="summary-card summary-card--accent2">
          <span class="summary-card__icon">📌</span>
          <div>
            <span class="summary-card__label">Total preview (residual + rango)</span>
            <strong class="summary-card__value">S/ {{ totalPreviewCierre.toFixed(2) }}</strong>
          </div>
        </div>
      </div>

      <!-- ─── Preview Table ─── -->
      <div class="table-card" v-if="tree && tree.length">
        <div class="table-card__header">
          <h2 class="table-card__title">📊 Previsualización · Residual (Go) y bonos por rango</h2>
          <span class="badge">{{ usersWithRank }} calificados</span>
        </div>
        <div class="table-search">
          <input v-model="search" class="search-input" placeholder="🔍 Buscar usuario..." />
        </div>
        <div class="table-responsive">
          <table class="cierre-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Pts. Personales</th>
                <th>Pts. Grupales</th>
                <th>Rango Alcanzado</th>
                <th>Bono Residual</th>
                <th>Bono rango (logro / mant.)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(node, i) in filteredTree" :key="node.id">
                <td class="td-num">{{ i + 1 }}</td>
                <td class="td-name">{{ node.name }}</td>
                <td>{{ node.points || 0 }}</td>
                <td>
                  <div class="group-points-wrapper">
                    <div class="group-total">Total: {{ (node._total || 0).toFixed(0) }}</div>
                    <div v-if="node.grouped_points_legs && node.grouped_points_legs.length" class="group-legs-array">
                      <div class="legs-list">
                        <div
                          v-for="(leg, idx) in node.grouped_points_legs"
                          :key="`${node.id}-leg-readable-${idx}`"
                          class="legs-list-item"
                        >
                          <span class="legs-user">{{ leg.name || 'Sin nombre' }} · DNI {{ leg.dni || '-' }}</span>
                          <span class="legs-points">{{ Number(leg.total_points || 0).toFixed(0) }} pts</span>
                        </div>
                      </div>
                    </div>
                    <span v-else class="td-zero">[]</span>
                  </div>
                </td>
                <td><span class="rank-badge" :class="rankClass(node.rank)">{{ node.rank }}</span></td>
                <td class="td-bonus">
                  <span v-if="node.residual_bonus > 0">S/ {{ node.residual_bonus.toFixed(2) }}</span>
                  <span v-else class="td-zero">—</span>
                </td>
                <td class="td-rank-bonus">
                  <template v-if="(node.rank_bonus_total || 0) > 0">
                    <strong>S/ {{ Number(node.rank_bonus_total).toFixed(2) }}</strong>
                    <ul v-if="node.rank_bonus_lines && node.rank_bonus_lines.length" class="rank-bonus-lines">
                      <li v-for="(ln, li) in node.rank_bonus_lines" :key="li">
                        <span class="rank-bonus-tipo">{{ ln.tipo }}</span>
                        {{ ln.rank }} · S/ {{ Number(ln.amount).toFixed(2) }}
                      </li>
                    </ul>
                  </template>
                  <span v-else class="td-zero">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-card__footer">
          <button v-if="!saving" class="btn-guardar" @click="save">
            💾 Confirmar y Guardar Cierre
          </button>
          <button v-else class="btn-guardar btn-guardar--loading" disabled>
            ⏳ Guardando en base de datos...
          </button>
        </div>
      </div>

      <!-- ─── History Section ─── -->
      <div class="section-divider"><span>📂 Historial de Cierres</span></div>

      <div v-if="!closeds.length" class="empty-state">
        <span>📭</span>
        <p>No hay cierres registrados aún.</p>
      </div>

      <div class="table-card historical-card" v-for="(cl, ci) in closeds" :key="ci">
        <!-- Closed Header -->
        <div class="table-card__header clickable" @click="cl._open = !cl._open">
          <div class="historical-title-group">
            <h2 class="table-card__title">📅 {{ cl.date | date }}</h2>
            <div class="historical-chips">
              <span class="chip chip--purple">{{ (cl.users || []).length }} usuarios</span>
              <span class="chip chip--green" v-if="cl.data && cl.data.bonus_transactions">
                {{ cl.data.bonus_transactions }} transacciones
              </span>
              <span class="chip chip--blue" v-if="cl.data && cl.data.duration_ms">
                ⚡ {{ cl.data.duration_ms }}ms
              </span>
            </div>
          </div>
          <span class="toggle-icon">{{ cl._open ? '▲' : '▼' }}</span>
        </div>

        <!-- Expandable Content -->
        <div v-if="cl._open">
          <div class="table-search">
            <input v-model="cl._search" class="search-input" placeholder="🔍 Buscar en este cierre..." />
          </div>
          <div class="table-responsive">
            <table class="cierre-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Pts. Grupales</th>
                  <th>Rango Cerrado</th>
                  <th>Bono Residual</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, i) in filteredHistory(cl)" :key="i">
                  <td class="td-num">{{ i + 1 }}</td>
                  <td class="td-name">{{ user.name }}</td>
                  <td>
                    <div class="group-points-wrapper">
                      <div class="group-total">Total: {{ (user.total_points || user.total || 0).toFixed(0) }}</div>
                      <div
                        v-if="user.grouped_points_legs && user.grouped_points_legs.length"
                        class="group-legs-array"
                      >
                        <div class="legs-list">
                          <div
                            v-for="(leg, idx) in user.grouped_points_legs"
                            :key="`hist-${ci}-${i}-leg-${idx}`"
                            class="legs-list-item"
                          >
                            <span class="legs-user">{{ leg.name || 'Sin nombre' }} · DNI {{ leg.dni || '-' }}</span>
                            <span class="legs-points">{{ Number(leg.total_points || 0).toFixed(0) }} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span class="rank-badge" :class="rankClass(user.rank)">{{ user.rank }}</span></td>
                  <td class="td-bonus">
                    <span v-if="user.residual_bonus > 0">S/ {{ user.residual_bonus.toFixed(2) }}</span>
                    <span v-else class="td-zero">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="historical-meta" v-if="cl.data">
            <span>👥 Procesados: {{ cl.data.users_processed || 0 }}</span>
            <span>💳 Transacciones: {{ cl.data.bonus_transactions || 0 }}</span>
            <span>🔄 Resets: {{ cl.data.reset_transactions || 0 }}</span>
          </div>
        </div>
      </div>

    </section>
  </Layout>
</template>

<script>
import Layout from '@/views/Layout'
import api    from '@/api'

export default {
  components: { Layout },
  data() {
    return {
      loading:      true,
      calculating:  false,
      tree:         [],
      affiliations: [],
      activations:  [],
      closeds:      [],
      saving:       false,
      search:       '',
    }
  },
  created() {
    const account = JSON.parse(localStorage.getItem('session'))
    this.$store.commit('SET_ACCOUNT', account)
    this.GET()
  },
  filters: {
    date(val) {
      return new Date(val).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    },
  },
  computed: {
    totalResidual() {
      return (this.tree || []).reduce((sum, n) => sum + (n.residual_bonus || 0), 0)
    },
    totalRankBonus() {
      return (this.tree || []).reduce((sum, n) => sum + (Number(n.rank_bonus_total) || 0), 0)
    },
    totalPreviewCierre() {
      return this.totalResidual + this.totalRankBonus
    },
    usersWithRank() {
      return (this.tree || []).filter(e => e.rank && e.rank !== 'none').length
    },
    activosFull() {
      return (this.tree || []).filter(e => e.activated).length
    },
    activosSimple() {
      return (this.tree || []).filter(e => e._activated).length
    },
    filteredTree() {
      const q = this.search.toLowerCase()
      return (this.tree || [])
        .filter(e => e.rank && e.rank !== 'none')
        .filter(e => !q || (e.name || '').toLowerCase().includes(q))
    },
  },
  methods: {
    rankClass(rank) {
      if (!rank) return ''
      return 'rank-' + rank.toLowerCase().replace(/ /g, '-')
    },
    filteredHistory(cl) {
      const q = (cl._search || '').toLowerCase()
      return (cl.users || []).filter(u => !q || (u.name || '').toLowerCase().includes(q))
    },
    async GET() {
      this.loading = true
      try {
        const { data } = await api.closeds.GET()
        this.closeds = (data.closeds || []).reverse().map(c => ({ ...c, _open: false, _search: '' }))
      } catch (e) {
        console.error('Error loading closures:', e)
      } finally {
        this.loading = false
      }
    },
    async closed() {
      this.calculating = true
      try {
        const { data } = await api.closeds.POST({ action: 'new' })
        this.tree         = data.tree         || []
        this.affiliations = data.affiliations  || []
        this.activations  = data.activations   || []
      } catch (e) {
        console.error('Error calculating:', e)
        alert('❌ Error al calcular el cierre. Revisa la consola del servidor.')
      } finally {
        this.calculating = false
      }
    },
    async save() {
      if (!confirm('⚠️ Está a punto de guardar el cierre. Este proceso actualizará la base de datos y NO se puede revertir. ¿Confirmar?')) return
      this.saving = true
      try {
        const { data } = await api.closeds.POST({ action: 'save', data: {
          tree:         this.tree,
          affiliations: this.affiliations,
          activations:  this.activations,
        }})
        const rb = data && data.rank_bonuses
        let extra = ''
        if (rb && !rb.error && typeof rb.totalAmount === 'number') {
          extra = `\nBonos rango aplicados: S/ ${rb.totalAmount.toFixed(2)} (${(rb.applied || []).length} líneas).`
        } else if (rb && rb.error) {
          extra = `\n⚠️ Bonos rango: error — ${rb.error}`
        }
        alert(`✅ Cierre guardado exitosamente.${extra}`)
        location.reload()
      } catch (e) {
        console.error('Error saving:', e)
        alert('❌ Error al guardar el cierre.')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; }

.cierre-wrapper {
  font-family: 'Inter', sans-serif;
  padding: 24px;
  background: #f4f6f9;
  min-height: 100vh;
}

/* ─── Header ─── */
.cierre-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.cierre-title  { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0; }
.cierre-subtitle { font-size: 0.83rem; color: #a0aec0; margin: 4px 0 0; }

.btn-iniciar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff; border: none;
  padding: 12px 28px; border-radius: 10px;
  font-size: 1rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(102,126,234,0.4);
}
.btn-iniciar:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102,126,234,0.5); }
.btn-iniciar:disabled, .btn-iniciar--loading { opacity: 0.7; cursor: default; }

/* ─── Summary Cards ─── */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px; margin-bottom: 24px;
}
.summary-card {
  background: #fff; border-radius: 12px; padding: 20px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid #667eea;
}
.summary-card__icon { font-size: 2rem; }
.summary-card__label { display: block; font-size: 0.76rem; color: #718096; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
.summary-card__value { font-size: 1.5rem; font-weight: 700; color: #1a202c; }
.summary-card--accent { border-left-color: #d69e2e; }
.summary-card--accent2 { border-left-color: #38a169; }

.td-rank-bonus { vertical-align: top; font-size: 0.82rem; max-width: 240px; }
.rank-bonus-lines { margin: 6px 0 0; padding-left: 1.1rem; color: #4a5568; font-size: 0.76rem; line-height: 1.35; }
.rank-bonus-tipo { text-transform: capitalize; color: #6b46c1; font-weight: 600; margin-right: 4px; }

/* ─── Table Card ─── */
.table-card {
  background: #fff; border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  margin-bottom: 20px; overflow: hidden;
}
.table-card__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid #e2e8f0;
}
.table-card__header.clickable { cursor: pointer; user-select: none; }
.table-card__header.clickable:hover { background: #f7fafc; }
.table-card__title { font-size: 1rem; font-weight: 600; color: #1a202c; margin: 0; }
.toggle-icon { font-size: 0.8rem; color: #a0aec0; }

.historical-title-group { display: flex; flex-direction: column; gap: 6px; }
.historical-chips { display: flex; gap: 8px; flex-wrap: wrap; }

.badge {
  font-size: 0.78rem; color: #718096; background: #f7fafc;
  padding: 4px 12px; border-radius: 20px; border: 1px solid #e2e8f0;
}
.chip {
  font-size: 0.74rem; font-weight: 600; padding: 3px 10px; border-radius: 20px;
}
.chip--purple { background: #e9d8fd; color: #553c9a; }
.chip--green  { background: #c6f6d5; color: #276749; }
.chip--blue   { background: #bee3f8; color: #2a69ac; }

/* ─── Search ─── */
.table-search { padding: 12px 24px; border-bottom: 1px solid #f0f4f8; }
.search-input {
  width: 100%; max-width: 380px;
  padding: 8px 14px; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 0.88rem; outline: none;
  transition: border 0.2s;
}
.search-input:focus { border-color: #667eea; }

/* ─── Table ─── */
.table-responsive { overflow-x: auto; }
.cierre-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.cierre-table thead th {
  background: #f7fafc; color: #4a5568; font-weight: 600;
  padding: 11px 16px; text-align: left;
  text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}
.cierre-table tbody tr { border-bottom: 1px solid #f0f4f8; transition: background 0.15s; }
.cierre-table tbody tr:hover { background: #f7fafc; }
.cierre-table td { padding: 11px 16px; color: #2d3748; }
.td-num   { color: #a0aec0; font-weight: 600; width: 40px; }
.td-name  { font-weight: 500; }
.td-bonus { font-weight: 700; color: #38a169; }
.td-zero  { color: #cbd5e0; }
.group-points-wrapper { display: flex; flex-direction: column; gap: 4px; }
.group-total { font-weight: 600; color: #2d3748; }
.group-legs-array {
  margin-top: 2px;
}
.legs-list {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 6px;
  max-height: 160px;
  overflow: auto;
}
.legs-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 5px 6px;
  border-bottom: 1px dashed #e2e8f0;
  font-size: 0.78rem;
}
.legs-list-item:last-child {
  border-bottom: none;
}
.legs-user {
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.legs-points {
  color: #1f6f43;
  font-weight: 700;
  white-space: nowrap;
}

/* ─── Rank Badges ─── */
.rank-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap;
}
.rank-activo   { background: #e6fffa; color: #2c7a7b; }
.rank-bronce   { background: #fef3c7; color: #92400e; }
.rank-plata    { background: #ebf4ff; color: #2b6cb0; }
.rank-oro      { background: #fffbeb; color: #b7791f; border: 1px solid #f6e05e; }
.rank-rubi,
.rank-diamante,
.rank-doble-diamante,
.rank-triple-diamante,
.rank-diamante-estrella { background: #faf5ff; color: #553c9a; border: 1px solid #d6bcfa; }
.rank-none      { background: #f7fafc; color: #a0aec0; }

/* ─── Save Button ─── */
.table-card__footer { padding: 18px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; }
.btn-guardar {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: #fff; border: none; padding: 12px 32px;
  border-radius: 10px; font-size: 1rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(72,187,120,0.35);
}
.btn-guardar:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(72,187,120,0.5); }
.btn-guardar--loading { opacity: 0.7; cursor: default; }

/* ─── Section Divider ─── */
.section-divider {
  display: flex; align-items: center;
  text-transform: uppercase; font-size: 0.74rem;
  font-weight: 700; color: #a0aec0; letter-spacing: 0.08em;
  margin: 8px 0 20px;
}
.section-divider::before,
.section-divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
.section-divider::before { margin-right: 12px; }
.section-divider::after  { margin-left: 12px; }

/* ─── Historical Meta ─── */
.historical-meta {
  display: flex; gap: 24px; flex-wrap: wrap;
  padding: 12px 24px; font-size: 0.82rem;
  color: #718096; border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

/* ─── Empty State ─── */
.empty-state { text-align: center; padding: 48px; color: #a0aec0; }
.empty-state span { font-size: 3rem; display: block; margin-bottom: 12px; }

.historical-card { margin-bottom: 14px; }
</style>

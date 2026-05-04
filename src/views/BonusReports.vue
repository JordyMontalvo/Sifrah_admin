<template>
  <Layout>
    <div class="bonus-view">
      <header class="bonus-header">
        <div class="header-left">
          <h1>💎 Detalle de Bonificaciones</h1>
          <p>Consulta el desglose detallado de Bono Ahorro, Generacional y Rangos.</p>
        </div>
        <div class="header-right">
          <div class="select-wrapper" v-if="closeds.length">
            <span class="label">Período de Cierre:</span>
            <select v-model="selectedClosedId" @change="onClosureChange" class="closure-select">
              <option v-for="cl in closeds" :key="cl.id" :value="cl.id">
                📅 {{ cl.date | date }} ({{ (cl.users || []).length }} usuarios)
              </option>
            </select>
          </div>
        </div>
      </header>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>Cargando información de bonos...</p>
      </div>

      <template v-else-if="selectedClosure">
        <!-- Summary Dashboard -->
        <div class="stats-dashboard">
          <div class="stat-card pink">
            <div class="stat-icon"><i class="fas fa-piggy-bank"></i></div>
            <div class="stat-info">
              <span class="stat-label">Bono Ahorro Sifrah</span>
              <strong class="stat-value">S/ {{ totalSavingsBonus.toFixed(2) }}</strong>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon"><i class="fas fa-users-rays"></i></div>
            <div class="stat-info">
              <span class="stat-label">Bono Generacional VIP</span>
              <strong class="stat-value">S/ {{ totalGenerationalBonus.toFixed(2) }}</strong>
            </div>
          </div>
          <div class="stat-card gold">
            <div class="stat-icon"><i class="fas fa-trophy"></i></div>
            <div class="stat-info">
              <span class="stat-label">Bonos por Rango</span>
              <strong class="stat-value">S/ {{ totalRankBonus.toFixed(2) }}</strong>
            </div>
          </div>
          <div class="stat-card blue">
            <div class="stat-icon"><i class="fas fa-chart-pie"></i></div>
            <div class="stat-info">
              <span class="stat-label">Bono Residual Go</span>
              <strong class="stat-value">S/ {{ totalResidualBonus.toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="bonus-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon"></i> {{ tab.label }}
          </button>
        </div>

        <!-- Search Bar -->
        <div class="bonus-search">
          <div class="search-inner">
            <i class="fas fa-search"></i>
            <input v-model="search" placeholder="Buscar por nombre o DNI..." />
          </div>
        </div>

        <!-- Tables Section -->
        <div class="table-container">
          <!-- 1. Bono Ahorro Table -->
          <div v-if="activeTab === 'savings'" class="tab-content">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>DNI</th>
                  <th>Rango</th>
                  <th>Monto (S/)</th>
                  <th class="has-text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, i) in filteredSavings" :key="user.user_id || i">
                  <td>{{ i + 1 }}</td>
                  <td class="user-cell">
                    <div class="avatar">{{ user.name | initials }}</div>
                    <div class="name-info">
                      <strong>{{ user.name }}</strong>
                    </div>
                  </td>
                  <td>{{ user.dni }}</td>
                  <td><span :class="['rank-tag', rankClass(user.rank)]">{{ user.rank || 'SIN RANGO' }}</span></td>
                  <td class="amount-cell positive">S/ {{ user.savings_bonus.toFixed(2) }}</td>
                  <td class="has-text-right">
                    <button class="btn-detail" @click="showUserDetail(user)">Ver Todo</button>
                  </td>
                </tr>
                <tr v-if="!filteredSavings.length">
                  <td colspan="6" class="empty-msg">No se encontraron registros de Bono Ahorro.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 2. Bono Generacional Table -->
          <div v-if="activeTab === 'generational'" class="tab-content">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Total Generacional (S/)</th>
                  <th>Detalle de Generaciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, i) in filteredGenerational" :key="user.user_id || i">
                  <td>{{ i + 1 }}</td>
                  <td class="user-cell">
                    <strong>{{ user.name }}</strong>
                    <div class="sub-dni">DNI: {{ user.dni }}</div>
                  </td>
                  <td class="amount-cell purple-text">S/ {{ user.generational_bonus.toFixed(2) }}</td>
                  <td>
                    <div class="gen-lines-mini">
                      <div v-for="(ln, li) in user.generational_lines" :key="li" class="gen-line-item">
                        <span class="gen-level">G{{ ln.generation || ln.level }}</span>
                        <span class="gen-amount">S/ {{ ln.amount.toFixed(2) }}</span>
                        <span class="gen-from">{{ ln.name }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredGenerational.length">
                  <td colspan="4" class="empty-msg">No se encontraron registros de Bono Generacional.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 3. Bonos de Rango Table -->
          <div v-if="activeTab === 'ranks'" class="tab-content">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Rango Cerrado</th>
                  <th>Total Bonos Rango</th>
                  <th>Desglose</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, i) in filteredRankBonuses" :key="user.user_id || i">
                  <td>{{ i + 1 }}</td>
                  <td class="user-cell">
                    <strong>{{ user.name }}</strong>
                    <div class="sub-dni">DNI: {{ user.dni }}</div>
                  </td>
                  <td><span :class="['rank-tag', rankClass(user.rank)]">{{ user.rank }}</span></td>
                  <td class="amount-cell gold-text">S/ {{ user.rank_bonus_total.toFixed(2) }}</td>
                  <td>
                    <div class="rank-lines">
                      <div v-for="(ln, li) in user.rank_bonus_lines" :key="li" class="rank-line-item">
                        <span :class="['type-tag', ln.tipo]">{{ ln.tipo }}</span>
                        <span class="rank-name">{{ ln.rank }}</span>
                        <strong>S/ {{ ln.amount.toFixed(2) }}</strong>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredRankBonuses.length">
                  <td colspan="5" class="empty-msg">No se encontraron registros de Bonos por Rango.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 4. Bono Residual Table -->
          <div v-if="activeTab === 'residual'" class="tab-content">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Total Residual (S/)</th>
                  <th>Niveles</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, i) in filteredResidual" :key="user.user_id || i">
                  <td>{{ i + 1 }}</td>
                  <td class="user-cell">
                    <strong>{{ user.name }}</strong>
                    <div class="sub-dni">DNI: {{ user.dni }}</div>
                  </td>
                  <td class="amount-cell blue-text">S/ {{ user.residual_bonus.toFixed(2) }}</td>
                  <td>
                    <div class="residual-lines-summary">
                      <span v-for="(ln, li) in user.residual_lines" :key="li" class="res-dot" :title="'Nivel ' + ln.level + ': S/ ' + ln.amount.toFixed(2)">
                        L{{ ln.level }}
                      </span>
                      <small v-if="user.residual_lines && user.residual_lines.length > 5">...</small>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredResidual.length">
                  <td colspan="4" class="empty-msg">No se encontraron registros de Bono Residual.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 5. Resumen de Rangos -->
          <div v-if="activeTab === 'rank-summary'" class="tab-content">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Rango</th>
                  <th>Usuarios</th>
                  <th>Total Bonos Ahorro</th>
                  <th>Total Bonos Gen.</th>
                  <th>Total Bonos Rango</th>
                  <th>Total Pagado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rankSummary" :key="row.rank">
                  <td><span :class="['rank-tag', rankClass(row.rank)]">{{ row.rank }}</span></td>
                  <td><strong>{{ row.count }}</strong></td>
                  <td>S/ {{ row.savings.toFixed(2) }}</td>
                  <td>S/ {{ row.generational.toFixed(2) }}</td>
                  <td>S/ {{ row.rankBonus.toFixed(2) }}</td>
                  <td class="amount-cell">S/ {{ row.total.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 6. Reglas y Lógica -->
          <div v-if="activeTab === 'logic'" class="tab-content logic-tab">
            <div class="logic-grid">
              
              <!-- Bono Ahorro Rules -->
              <div class="logic-card">
                <h3><i class="fas fa-piggy-bank"></i> Bono Ahorro Sifrah</h3>
                <p class="logic-desc">Se calcula sobre los puntos excedentes (PR > 160) o puntos totales si hay afiliación.</p>
                <table class="mini-table">
                  <thead>
                    <tr><th>Plan / Paquete</th><th>Porcentaje</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Empresario (Master)</td><td class="has-text-weight-bold">40%</td></tr>
                    <tr><td>Distribuidor (Standard)</td><td class="has-text-weight-bold">30%</td></tr>
                    <tr><td>Ejecutivo (Basic)</td><td class="has-text-weight-bold">21%</td></tr>
                  </tbody>
                </table>
              </div>

              <!-- Bono Logro Rules -->
              <div class="logic-card">
                <h3><i class="fas fa-award"></i> Bono por Logro de Rango</h3>
                <p class="logic-desc">Premio único al alcanzar un nuevo rango por primera vez.</p>
                <div class="award-list">
                  <div class="award-item"><span>Bronce</span><strong>S/ 60</strong></div>
                  <div class="award-item"><span>Plata</span><strong>S/ 300</strong></div>
                  <div class="award-item"><span>Oro</span><strong>S/ 600</strong></div>
                  <div class="award-item"><span>Rubí</span><strong>S/ 1,200</strong></div>
                  <div class="award-item"><span>Esmeralda</span><strong>S/ 2,500</strong></div>
                  <div class="award-item"><span>Diamante</span><strong>S/ 5,000</strong></div>
                </div>
              </div>

              <!-- Residual Rules -->
              <div class="logic-card wide">
                <h3><i class="fas fa-chart-pie"></i> Tabla de Porcentajes Residuales</h3>
                <p class="logic-desc">Porcentajes pagados por nivel según el rango cerrado. Compresión dinámica aplicada.</p>
                <div class="table-scroll">
                  <table class="mini-table compact">
                    <thead>
                      <tr>
                        <th>Rango</th>
                        <th>N1</th><th>N2</th><th>N3</th><th>N4</th><th>N5</th><th>N6</th><th>N7</th><th>N8</th><th>N9</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(pcts, rank) in residualLogic" :key="rank">
                        <td><span :class="['rank-tag', rankClass(rank)]">{{ rank }}</span></td>
                        <td v-for="(p, idx) in pcts" :key="idx" :class="{ 'zero-pct': p === 0 }">
                          {{ p > 0 ? (p*100).toFixed(0) + '%' : '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Rank Requirements -->
              <div class="logic-card wide">
                <h3><i class="fas fa-tasks"></i> Requisitos de Calificación de Rango</h3>
                <p class="logic-desc">Criterios necesarios para cerrar cada rango en el motor Go.</p>
                <div class="table-scroll">
                  <table class="mini-table">
                    <thead>
                      <tr>
                        <th>Rango</th>
                        <th>Pts. Umbral</th>
                        <th>Frontales Mín.</th>
                        <th>VMP (Pierna Mayor)</th>
                        <th>Reconsumo Mín.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in rankRequirements" :key="r.rank">
                        <td><strong>{{ r.rank }}</strong></td>
                        <td>{{ r.threshold }} pts</td>
                        <td>{{ r.frontals }}</td>
                        <td>{{ r.vmp }} pts</td>
                        <td>{{ r.reconsumo }} pts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>Selecciona un cierre para ver el detalle de los bonos.</p>
      </div>
    </div>

    <!-- User Detail Modal (Optional but nice) -->
    <div v-if="userInModal" class="bonus-modal" @click.self="userInModal = null">
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Resumen de Bonos: {{ userInModal.name }}</p>
          <button class="delete" aria-label="close" @click="userInModal = null"></button>
        </header>
        <section class="modal-card-body">
           <div class="modal-grid">
             <div class="modal-info-box">
               <label>Rango Alcanzado</label>
               <span :class="['rank-tag', rankClass(userInModal.rank)]">{{ userInModal.rank }}</span>
             </div>
             <div class="modal-info-box">
               <label>Puntos Totales</label>
               <strong>{{ (userInModal.total_points || 0).toFixed(0) }} pts</strong>
             </div>
           </div>

           <div class="modal-bonus-list">
             <div class="modal-bonus-row" v-if="userInModal.savings_bonus > 0">
               <div class="bonus-main">
                 <i class="fas fa-piggy-bank"></i>
                 <span>Bono Ahorro Sifrah</span>
               </div>
               <div class="bonus-val">S/ {{ userInModal.savings_bonus.toFixed(2) }}</div>
             </div>
             <div class="modal-bonus-row" v-if="userInModal.generational_bonus > 0">
               <div class="bonus-main">
                 <i class="fas fa-users-rays"></i>
                 <span>Bono Generacional VIP</span>
               </div>
               <div class="bonus-val">S/ {{ userInModal.generational_bonus.toFixed(2) }}</div>
             </div>
             <div class="modal-bonus-row" v-if="userInModal.rank_bonus_total > 0">
               <div class="bonus-main">
                 <i class="fas fa-trophy"></i>
                 <span>Bonos por Rango</span>
               </div>
               <div class="bonus-val">S/ {{ userInModal.rank_bonus_total.toFixed(2) }}</div>
             </div>
             <div class="modal-bonus-row" v-if="userInModal.residual_bonus > 0">
               <div class="bonus-main">
                 <i class="fas fa-chart-pie"></i>
                 <span>Bono Residual</span>
               </div>
               <div class="bonus-val">S/ {{ userInModal.residual_bonus.toFixed(2) }}</div>
             </div>
             <div class="modal-total-row">
               <span>TOTAL BONIFICACIONES</span>
               <strong>S/ {{ (userInModal.savings_bonus + userInModal.generational_bonus + userInModal.rank_bonus_total + userInModal.residual_bonus).toFixed(2) }}</strong>
             </div>
           </div>
        </section>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from '@/views/Layout'
import api    from '@/api'

export default {
  components: { Layout },
  filters: {
    date(val) {
      if (!val) return ''
      return new Date(val).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    },
    initials(name) {
      if (!name) return '?'
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }
  },
  computed: {
    totalSavingsBonus() {
      if (!this.selectedClosure) return 0
      return (this.selectedClosure.users || []).reduce((s, u) => s + (u.savings_bonus || 0), 0)
    },
    totalGenerationalBonus() {
      if (!this.selectedClosure) return 0
      return (this.selectedClosure.users || []).reduce((s, u) => s + (u.generational_bonus || 0), 0)
    },
    totalRankBonus() {
      if (!this.selectedClosure) return 0
      return (this.selectedClosure.users || []).reduce((s, u) => s + (this.getRankBonusTotal(u)), 0)
    },
    totalResidualBonus() {
      if (!this.selectedClosure) return 0
      return (this.selectedClosure.users || []).reduce((s, u) => s + (u.residual_bonus || 0), 0)
    },

    filteredSavings() {
      if (!this.selectedClosure) return []
      const q = this.search.toLowerCase()
      return (this.selectedClosure.users || [])
        .filter(u => u.savings_bonus > 0)
        .filter(u => !q || u.name.toLowerCase().includes(q) || (u.dni && u.dni.includes(q)))
        .sort((a, b) => b.savings_bonus - a.savings_bonus)
    },
    filteredGenerational() {
      if (!this.selectedClosure) return []
      const q = this.search.toLowerCase()
      return (this.selectedClosure.users || [])
        .filter(u => u.generational_bonus > 0)
        .filter(u => !q || u.name.toLowerCase().includes(q) || (u.dni && u.dni.includes(q)))
        .sort((a, b) => b.generational_bonus - a.generational_bonus)
    },
    filteredRankBonuses() {
      if (!this.selectedClosure) return []
      const q = this.search.toLowerCase()
      return (this.selectedClosure.users || [])
        .map(u => ({ ...u, rank_bonus_total: this.getRankBonusTotal(u), rank_bonus_lines: this.getRankBonusLines(u) }))
        .filter(u => u.rank_bonus_total > 0)
        .filter(u => !q || u.name.toLowerCase().includes(q) || (u.dni && u.dni.includes(q)))
        .sort((a, b) => b.rank_bonus_total - a.rank_bonus_total)
    },
    filteredResidual() {
      if (!this.selectedClosure) return []
      const q = this.search.toLowerCase()
      return (this.selectedClosure.users || [])
        .filter(u => u.residual_bonus > 0)
        .filter(u => !q || u.name.toLowerCase().includes(q) || (u.dni && u.dni.includes(q)))
        .sort((a, b) => b.residual_bonus - a.residual_bonus)
    },
    rankSummary() {
      if (!this.selectedClosure) return []
      const summary = {}
      ;(this.selectedClosure.users || []).forEach(u => {
        const r = u.rank || 'SIN RANGO'
        if (!summary[r]) {
          summary[r] = { rank: r, count: 0, savings: 0, generational: 0, rankBonus: 0, total: 0 }
        }
        const rb = this.getRankBonusTotal(u)
        summary[r].count++
        summary[r].savings += (u.savings_bonus || 0)
        summary[r].generational += (u.generational_bonus || 0)
        summary[r].rankBonus += rb
        summary[r].total += (u.savings_bonus || 0) + (u.generational_bonus || 0) + rb + (u.residual_bonus || 0)
      })
      return Object.values(summary).sort((a, b) => b.total - a.total)
    }
  },
  async created() {
    await this.fetchClosures()
  },
  data() {
    return {
      loading: true,
      closeds: [],
      selectedClosedId: null,
      selectedClosure: null,
      activeTab: 'savings',
      search: '',
      userInModal: null,
      tabs: [
        { id: 'savings', label: 'Bono Ahorro', icon: 'fas fa-piggy-bank' },
        { id: 'generational', label: 'Bono Generacional', icon: 'fas fa-users-rays' },
        { id: 'ranks', label: 'Bonos de Rango', icon: 'fas fa-trophy' },
        { id: 'residual', label: 'Bono Residual', icon: 'fas fa-chart-pie' },
        { id: 'rank-summary', label: 'Resumen Rangos', icon: 'fas fa-medal' },
        { id: 'logic', label: 'Reglas y Lógica', icon: 'fas fa-book' },
      ],
      residualLogic: {
        "ACTIVO": [0.15, 0.15, 0, 0, 0, 0, 0, 0, 0],
        "BRONCE": [0.15, 0.15, 0.15, 0.05, 0, 0, 0, 0, 0],
        "PLATA": [0.15, 0.15, 0.15, 0.10, 0.05, 0, 0, 0, 0],
        "ORO": [0.15, 0.15, 0.15, 0.15, 0.05, 0.05, 0, 0, 0],
        "RUBÍ": [0.15, 0.15, 0.15, 0.15, 0.10, 0.05, 0.025, 0, 0],
        "ESMERALDA": [0.15, 0.15, 0.15, 0.15, 0.10, 0.05, 0.025, 0.025, 0.01],
        "DIAMANTE": [0.15, 0.15, 0.15, 0.15, 0.10, 0.075, 0.025, 0.025, 0.01],
        "EMBAJADOR SIFRAH": [0.15, 0.15, 0.15, 0.15, 0.10, 0.075, 0.05, 0.05, 0.05],
      },
      rankRequirements: [
        { rank: 'BRONCE', threshold: 500, frontals: 2, vmp: 300, reconsumo: 160 },
        { rank: 'PLATA', threshold: 1500, frontals: 3, vmp: 600, reconsumo: 160 },
        { rank: 'ORO', threshold: 3500, frontals: 3, vmp: 1350, reconsumo: 160 },
        { rank: 'RUBÍ', threshold: 7500, frontals: 4, vmp: 2100, reconsumo: 160 },
        { rank: 'ESMERALDA', threshold: 20000, frontals: 4, vmp: 5500, reconsumo: 160 },
        { rank: 'DIAMANTE', threshold: 45000, frontals: 4, vmp: 12000, reconsumo: 160 },
        { rank: 'D. DIAMANTE', threshold: 85000, frontals: 5, vmp: 19000, reconsumo: 160 },
      ]
    }
  },
  methods: {
    async fetchClosures() {
      this.loading = true
      try {
        const { data } = await api.closeds.GET()
        this.closeds = (data.closeds || []).reverse()
        if (this.closeds.length) {
          this.selectedClosedId = this.closeds[0].id
          this.selectedClosure = this.closeds[0]
        }
      } catch (e) {
        console.error('Error fetching closures:', e)
      } finally {
        this.loading = false
      }
    },
    onClosureChange() {
      this.selectedClosure = this.closeds.find(c => c.id === this.selectedClosedId)
    },
    getRankBonusTotal(user) {
      if (!this.selectedClosure || !this.selectedClosure.data) return 0
      const userId = user.user_id || user.userId
      const logro = Array.isArray(this.selectedClosure.data.rank_bonus_logro) ? this.selectedClosure.data.rank_bonus_logro : []
      const mant = Array.isArray(this.selectedClosure.data.rank_bonus_mantenimiento) ? this.selectedClosure.data.rank_bonus_mantenimiento : []
      return [...logro, ...mant]
        .filter(x => x && x.user_id === userId)
        .reduce((s, x) => s + Number(x.amount || 0), 0)
    },
    getRankBonusLines(user) {
       if (!this.selectedClosure || !this.selectedClosure.data) return []
      const userId = user.user_id || user.userId
      const logro = Array.isArray(this.selectedClosure.data.rank_bonus_logro) ? this.selectedClosure.data.rank_bonus_logro : []
      const mant = Array.isArray(this.selectedClosure.data.rank_bonus_mantenimiento) ? this.selectedClosure.data.rank_bonus_mantenimiento : []
      return [...logro, ...mant].filter(x => x && x.user_id === userId)
    },
    rankClass(rank) {
      if (!rank) return ''
      return 'rank-' + rank.toLowerCase().replace(/ /g, '-')
    },
    showUserDetail(user) {
      const rbTotal = this.getRankBonusTotal(user)
      this.userInModal = { ...user, rank_bonus_total: rbTotal }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

.bonus-view {
  font-family: 'Outfit', sans-serif;
  padding: 2rem;
  background: #fdfdfd;
  min-height: 100vh;
}

.bonus-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.header-left h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.header-left p {
  color: #666;
  margin-top: 0.25rem;
}

.closure-select {
  padding: 0.6rem 1rem;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: white;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.label {
  font-weight: 600;
  margin-right: 0.75rem;
  color: #444;
}

/* Dashboard Cards */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  padding: 1.5rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  color: white;
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover { transform: translateY(-5px); }

.stat-card.pink { background: linear-gradient(135deg, #FF6B95 0%, #FF26B9 100%); }
.stat-card.purple { background: linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%); color: #444; } /* Lighter for contrast */
.stat-card.purple .stat-label, .stat-card.purple .stat-value { color: #2D3436; }
.stat-card.gold { background: linear-gradient(135deg, #F9D423 0%, #FF4E50 100%); }
.stat-card.blue { background: linear-gradient(135deg, #48C6EF 0%, #6F86D6 100%); }

.stat-icon {
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.25);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-info { display: flex; flex-direction: column; }
.stat-label { font-size: 0.85rem; font-weight: 500; opacity: 0.9; text-transform: uppercase; }
.stat-value { font-size: 1.6rem; font-weight: 700; }

/* Tabs */
.bonus-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  background: transparent;
  color: #777;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn:hover { background: #f5f5f5; color: #333; }
.tab-btn.active { background: #1a1a1a; color: white; }

/* Search */
.bonus-search { margin-bottom: 1.5rem; }
.search-inner {
  position: relative;
  max-width: 400px;
}
.search-inner i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
}
.search-inner input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.8rem;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
}
.search-inner input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }

/* Table */
.table-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  overflow: hidden;
}

.premium-table {
  width: 100%;
  border-collapse: collapse;
}

.premium-table th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #4b5563;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.premium-table td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.95rem;
}

.user-cell { display: flex; align-items: center; gap: 1rem; }
.avatar {
  width: 40px; height: 40px;
  background: #edf2f7;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: #4a5568; font-size: 0.8rem;
}

.amount-cell { font-weight: 700; font-size: 1.1rem; }
.amount-cell.positive { color: #10b981; }
.amount-cell.purple-text { color: #8b5cf6; }
.amount-cell.gold-text { color: #f59e0b; }
.amount-cell.blue-text { color: #3b82f6; }

.sub-dni { font-size: 0.8rem; color: #9ca3af; margin-top: 0.2rem; }

.rank-tag {
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.rank-none { background: #f3f4f6; color: #9ca3af; }
.rank-bronce { background: #fff7ed; color: #9a3412; border: 1px solid #ffedd5; }
.rank-plata { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
.rank-oro { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
.rank-rubi { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
.rank-esmeralda { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
.rank-diamante { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
.rank-doble-diamante { background: #faf5ff; color: #6b21a8; border: 1px solid #f3e8ff; }
.rank-triple-diamante { background: #fdf2f8; color: #9d174d; border: 1px solid #fce7f3; }
.rank-diamante-imperial { background: #1a1a1a; color: #ffd700; border: 1px solid #ffd700; }
.rank-diamante-corona { background: #000; color: #fff; border: 1px solid #333; }
.rank-embajador-sifrah { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }

.gen-lines-mini, .rank-lines {
  display: flex; flex-direction: column; gap: 0.4rem;
}
.gen-line-item, .rank-line-item {
  display: flex; align-items: center; gap: 0.6rem;
  font-size: 0.82rem;
}
.gen-level { background: #f5f3ff; color: #6d28d9; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700; }
.type-tag { padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; }
.type-tag.logro { background: #f0fdf4; color: #166534; }
.type-tag.mantenimiento { background: #eff6ff; color: #1e40af; }

.btn-detail {
  background: #1a1a1a; color: white;
  border: none; padding: 0.4rem 0.8rem;
  border-radius: 8px; cursor: pointer;
  font-weight: 500; font-size: 0.85rem;
}

.empty-msg { padding: 3rem; text-align: center; color: #9ca3af; font-style: italic; }

/* Modal */
.bonus-modal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); z-index: 3000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.modal-card {
  background: white; width: 100%; max-width: 500px;
  border-radius: 20px; overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}
.modal-card-head { padding: 1.5rem; background: #f9fafb; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
.modal-card-title { font-weight: 700; margin: 0; }
.modal-card-body { padding: 1.5rem; }

.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.modal-info-box { display: flex; flex-direction: column; gap: 0.4rem; }
.modal-info-box label { font-size: 0.75rem; color: #666; text-transform: uppercase; }

.modal-bonus-list { display: flex; flex-direction: column; gap: 1rem; }
.modal-bonus-row {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 0.75rem; border-bottom: 1px dashed #eee;
}
.bonus-main { display: flex; align-items: center; gap: 0.75rem; color: #444; }
.bonus-val { font-weight: 700; font-size: 1.1rem; }
.modal-total-row {
  margin-top: 1rem; padding: 1rem; background: #1a1a1a; color: white;
  border-radius: 12px; display: flex; justify-content: space-between; align-items: center;
}

.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 5rem; color: #aaa; gap: 1rem;
}
.loading-state i, .empty-state i { font-size: 3rem; }

@media (max-width: 768px) {
  .bonus-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .stats-dashboard { grid-template-columns: 1fr; }
  .bonus-tabs { overflow-x: auto; padding-bottom: 1rem; }
  .tab-btn { white-space: nowrap; }
}

/* Logic Tab Styles */
.logic-tab { padding: 1.5rem; }
.logic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5rem;
}
.logic-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}
.logic-card.wide { grid-column: 1 / -1; }
.logic-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1e293b;
}
.logic-card h3 i { color: #6366f1; }
.logic-desc { font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem; }

.mini-table {
  width: 100%;
  font-size: 0.85rem;
  border-collapse: collapse;
}
.mini-table th { text-align: left; padding: 0.5rem; border-bottom: 2px solid #e2e8f0; color: #475569; }
.mini-table td { padding: 0.6rem 0.5rem; border-bottom: 1px solid #e2e8f0; }
.mini-table.compact td { padding: 0.4rem 0.5rem; font-size: 0.8rem; }
.zero-pct { color: #cbd5e1; font-weight: 300; }

.award-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.award-item {
  display: flex;
  justify-content: space-between;
  background: white;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  border: 1px solid #f1f5f9;
}
.award-item strong { color: #059669; }

.table-scroll { overflow-x: auto; }
</style>

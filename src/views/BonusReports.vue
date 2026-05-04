<template>
  <Layout>
    <div class="bonus-view">
      <header class="bonus-header">
        <div class="header-left">
          <h1>📖 Guía de Lógica y Bonificaciones</h1>
          <p>Consulta las reglas oficiales, porcentajes y requisitos de calificación del sistema Sifrah.</p>
        </div>
      </header>

      <div class="logic-container">
        <div class="logic-grid">
          
          <!-- 1. Bono de Afiliación (Directo e Indirecto) -->
          <div class="logic-card wide">
            <h3><i class="fas fa-user-plus"></i> Bono de Afiliación (Inicio Rápido)</h3>
            <p class="logic-desc">Pagos fijos distribuidos hasta 9 niveles según el paquete con el que se afilia el nuevo socio.</p>
            <div class="table-scroll">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Nivel</th>
                    <th>Paquete Ejecutivo (Basic)</th>
                    <th>Paquete Distribuidor (Standard)</th>
                    <th>Paquete Empresario (Master)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in 9" :key="n">
                    <td><strong>Nivel {{ n }}</strong></td>
                    <td :class="{ 'inactive-cell': n > 3 }">S/ {{ affiliationLogic.basic[n-1] }} <small v-if="n > 3">(No aplica)</small></td>
                    <td :class="{ 'inactive-cell': n > 6 }">S/ {{ affiliationLogic.standard[n-1] }} <small v-if="n > 6">(No aplica)</small></td>
                    <td>S/ {{ affiliationLogic.master[n-1] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="logic-note">
              <i class="fas fa-info-circle"></i>
              <span>Nota: La profundidad de cobro depende de TU plan actual (Ejecutivo: 3 niv, Distribuidor: 6 niv, Empresario: 9 niv).</span>
            </div>
          </div>

          <!-- 2. Bono Ahorro Sifrah -->
          <div class="logic-card">
            <h3><i class="fas fa-piggy-bank"></i> Bono Ahorro Sifrah</h3>
            <p class="logic-desc">Se calcula sobre los puntos excedentes (PR > 160) o puntos totales si hay afiliación en el periodo.</p>
            <table class="mini-table">
              <thead>
                <tr><th>Plan del Socio</th><th>Porcentaje de Ahorro</th></tr>
              </thead>
              <tbody>
                <tr><td>Empresario (Master)</td><td class="amount-val">40%</td></tr>
                <tr><td>Distribuidor (Standard)</td><td class="amount-val">30%</td></tr>
                <tr><td>Ejecutivo (Basic)</td><td class="amount-val">21%</td></tr>
              </tbody>
            </table>
          </div>

          <!-- 3. Bono Logro de Rango -->
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
              <div class="award-item"><span>D. Diamante</span><strong>S/ 10,000</strong></div>
              <div class="award-item"><span>T. Diamante</span><strong>S/ 20,000</strong></div>
            </div>
          </div>

          <!-- 4. Bono Residual -->
          <div class="logic-card wide">
            <h3><i class="fas fa-chart-pie"></i> Tabla de Porcentajes Residuales</h3>
            <p class="logic-desc">Porcentajes pagados sobre el reconsumo (PR) según el rango cerrado. Se aplica compresión dinámica.</p>
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

          <!-- 5. Requisitos de Rango -->
          <div class="logic-card wide">
            <h3><i class="fas fa-tasks"></i> Requisitos de Calificación de Rango</h3>
            <p class="logic-desc">Criterios mínimos para cerrar cada rango oficial en el motor Go.</p>
            <div class="table-scroll">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Rango</th>
                    <th>Puntos Totales</th>
                    <th>Líneas Activas</th>
                    <th>VMP (Tope Pierna)</th>
                    <th>Reconsumo Propio</th>
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
  </Layout>
</template>

<script>
import Layout from '@/views/Layout'

export default {
  components: { Layout },
  data() {
    return {
      affiliationLogic: {
        basic: [90, 15, 10, 5, 5, 1, 1, 1, 1],
        standard: [300, 60, 20, 10, 10, 5, 5, 5, 5],
        master: [500, 100, 100, 50, 50, 10, 10, 10, 10]
      },
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
        { rank: 'T. DIAMANTE', threshold: 170000, frontals: 5, vmp: 37500, reconsumo: 160 },
        { rank: 'D. IMPERIAL', threshold: 300000, frontals: 6, vmp: 55000, reconsumo: 160 },
        { rank: 'EMBAJADOR SIFRAH', threshold: 600000, frontals: 6, vmp: 100000, reconsumo: 160 },
      ]
    }
  },
  methods: {
    rankClass(rank) {
      if (!rank) return ''
      return 'rank-' + rank.toLowerCase().replace(/ /g, '-')
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
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.header-left h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.header-left p {
  color: #64748b;
  margin-top: 0.5rem;
  font-size: 1.1rem;
}

.logic-container {
  max-width: 1200px;
  margin: 0 auto;
}

.logic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.logic-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 25px rgba(0,0,0,0.03);
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
}

.logic-card.wide {
  grid-column: 1 / -1;
}

.logic-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #0f172a;
}

.logic-card h3 i {
  color: #6366f1;
}

.logic-desc {
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.mini-table th {
  text-align: left;
  padding: 1rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

.mini-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}

.mini-table.compact td {
  padding: 0.6rem 0.5rem;
  font-size: 0.85rem;
}

.amount-val {
  font-weight: 700;
  color: #6366f1;
  font-size: 1.1rem;
}

.inactive-cell {
  background: #f8fafc;
  color: #94a3b8 !important;
  font-style: italic;
}

.logic-note {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #1d4ed8;
  line-height: 1.4;
}

.award-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.award-item {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e2e8f0;
}

.award-item span {
  font-weight: 600;
  color: #475569;
}

.award-item strong {
  color: #059669;
  font-size: 1rem;
}

.zero-pct {
  color: #cbd5e1;
  font-weight: 300;
}

.table-scroll {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.rank-tag {
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.rank-bronce { background: #fff7ed; color: #9a3412; border: 1px solid #ffedd5; }
.rank-plata { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
.rank-oro { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
.rank-rubi { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
.rank-esmeralda { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
.rank-diamante { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
.rank-embajador-sifrah { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #fff; }

@media (max-width: 768px) {
  .bonus-view { padding: 1rem; }
  .logic-grid { grid-template-columns: 1fr; }
  .award-list { grid-template-columns: 1fr 1fr; }
}
</style>

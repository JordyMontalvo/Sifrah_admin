<template>
  <ul class="snapshot-tree">
    <li>
      <div class="snapshot-node" :class="'rank-' + (node.rank || 'none').toLowerCase().replace(/ /g, '-')">
        <div class="node-name">{{ node.name }} <span class="node-dni" v-if="node.dni">DNI: {{ node.dni }}</span></div>
        <div class="node-rank">{{ node.rank || 'Sin rango' }}</div>
        <div class="node-points">
          <span class="pts-personales" title="Puntos Personales">PP: {{ Number(node.points || 0).toFixed(0) }}</span>
          <span class="pts-grupales" title="Puntos Grupales">PG: {{ Number(node._total || 0).toFixed(0) }}</span>
        </div>
      </div>
      <ul v-if="node.childs && node.childs.length > 0">
        <SnapshotTree v-for="(child, idx) in node.childs" :key="idx" :node="child" />
      </ul>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'SnapshotTree',
  props: {
    node: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.snapshot-tree {
  list-style: none;
  padding-left: 20px;
  position: relative;
  margin: 0;
}
.snapshot-tree::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-left: 2px solid #e2e8f0;
}
.snapshot-tree li {
  position: relative;
  margin: 12px 0;
}
.snapshot-tree li::before {
  content: '';
  position: absolute;
  top: 18px;
  left: -20px;
  width: 20px;
  border-top: 2px solid #e2e8f0;
}
.snapshot-node {
  display: inline-block;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  min-width: 240px;
  transition: transform 0.2s;
}
.snapshot-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.node-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a202c;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.node-dni {
  font-weight: 500;
  color: #718096;
  font-size: 0.75rem;
  background: #edf2f7;
  padding: 2px 6px;
  border-radius: 4px;
}
.node-rank {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 6px;
  color: #4a5568;
}
.node-points {
  margin-top: 8px;
  font-size: 0.8rem;
  display: flex;
  gap: 12px;
}
.pts-personales, .pts-grupales {
  background: #ebf4ff;
  color: #3182ce;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.pts-grupales {
  background: #e6fffa;
  color: #319795;
}

/* Rank Highlights */
.rank-bronce { border-left: 4px solid #cd7f32; }
.rank-plata { border-left: 4px solid #c0c0c0; }
.rank-oro { border-left: 4px solid #ffd700; }
.rank-rubi { border-left: 4px solid #e0115f; }
.rank-esmeralda { border-left: 4px solid #50c878; }
.rank-diamante { border-left: 4px solid #b9f2ff; }
</style>

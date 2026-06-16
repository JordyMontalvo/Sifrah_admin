<template>
  <Layout>
    <section class="savings-categories-section">
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">Categorías Bono Ahorro</h1>
              <p class="page-subtitle">
                Organiza el catálogo de canje con categorías, íconos y visibilidad
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <SavingsCategoriesPanel />
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout.vue";
import SavingsCategoriesPanel from "@/components/SavingsCategoriesPanel.vue";

export default {
  components: { Layout, SavingsCategoriesPanel },
};
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, #e91e63 0%, #cf1658 100%);
  color: white;
  padding: 2rem 0;
  margin-bottom: 1.5rem;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}
.page-subtitle {
  margin: 0.25rem 0 0;
  opacity: 0.9;
}
</style>

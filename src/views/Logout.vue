<template></template>

<script>
import api from "@/api";

export default {
  async created() {
    // Registrar cierre en el servidor (best-effort)
    try {
      await api.adminAuth.logout();
    } catch (_) {}

    try { localStorage.removeItem("adminSession"); } catch (_) {}
    try { localStorage.removeItem("adminAccount"); } catch (_) {}
    try { localStorage.removeItem("session"); } catch (_) {}
    try { localStorage.removeItem("token"); } catch (_) {}

    this.$store.commit("SET_ACCOUNT", null);
    this.$router.push("/login");
  },
};
</script>

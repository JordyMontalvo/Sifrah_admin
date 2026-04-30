<template></template>

<script>

export default {
  created() {
    try { localStorage.removeItem('adminSession') } catch (_) {}
    try { localStorage.removeItem('adminAccount') } catch (_) {}
    try { localStorage.removeItem('session') } catch (_) {}
    try { localStorage.removeItem('token') } catch (_) {}

    this.$store.commit('SET_ACCOUNT', null)
    this.$router.push('/login')
  },
};
</script>

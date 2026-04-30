<template>
  <main class="section" style="max-width: 500px; margin: auto">

    <div class="field">
      <label class="label">Email o DNI</label>
      <div class="control has-icons-left">
        <input class="input" type="text" placeholder="Email o DNI"
          v-model="email"
          :class="{'is-danger': error.email}"
          @keydown="reset('email')">
        <span class="icon is-small is-left">
          <i class="fas fa-user"></i>
        </span>
      </div>
      <!-- <p class="help is-danger">This email is invalid</p> -->
    </div>

    <div class="field">
      <label class="label">Password</label>
      <div class="control has-icons-left">
        <input class="input" type="password" placeholder="Password"
          v-model="password"
          :class="{'is-danger': error.password}"
          @keydown="reset('password')">
        <span class="icon is-small is-left">
          <i class="fas fa-lock"></i>
        </span>
      </div>
      <!-- <p class="help is-danger">This email is invalid</p> -->
    </div>

    <p class="help is-danger">{{ alert | alert }}</p>

    <div class="field is-grouped">
      <div class="control">
        <button class="button is-link" :class="{'is-loading': loading}" @click="submit" :disabled="loading">Login</button>
      </div>
    </div>
  </main>
</template>

<script>
import Layout from '@/views/Layout'
import api    from '@/api'

export default {
  components: { Layout },
  data() {
    return{
      email:    null,
      password: null,
      error: {
        email:    false,
        password: false,
      },
      alert:   null,
      loading: false,
    }
  },
  filters: {
    alert(msg) {
      if (!msg) return ''
      if (msg == 'missing credentials') return 'Completa tus credenciales'
      if (msg == 'invalid account') return 'Cuenta inválida'
      if (msg == 'invalid password') return 'Contraseña incorrecta'
      if (msg == 'missing session') return 'Sesión inválida'
      return msg // Mostrar cualquier otro mensaje (como "Error de conexión")
    },
  },
  async mounted() {
    // Auto-login via magic link ?token= en URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const accountStr = params.get('account')
    if (token) {
      try {
        const account = accountStr ? JSON.parse(decodeURIComponent(accountStr)) : {}
        localStorage.setItem('adminSession', token)
        localStorage.setItem('adminAccount', JSON.stringify(account))
        this.$store.commit('SET_ACCOUNT', account)
        this.$router.push('/dashboard')
      } catch(e) {}
    }
  },
  methods: {
    async submit() {
      if (this.loading) return
      this.loading = true
      this.alert = null

      const { email, password } = this

      // valid fields
      if(!email)    { return this.error.email    = true }
      if(!password) { return this.error.password = true }

      try {
        const { data } = await api.adminAuth.login({ emailOrDni: email, password })
        if (data && data.error) return this.alert = data.msg

        localStorage.setItem('adminSession', data.session)
        localStorage.setItem('adminAccount', JSON.stringify(data.account))

        this.$store.commit('SET_ACCOUNT', data.account)
        this.$router.push('/dashboard')
      } catch (e) {
        console.error('[Login Error]', e);
        const msg = (e && e.response && e.response.data && e.response.data.msg) || 'Error de conexión / Servidor';
        this.alert = msg;
      } finally {
        this.loading = false
      }

    },
    reset(name) {
      this.alert = null

      if(name == 'email')    this.error.email    = false
      if(name == 'password') this.error.password = false
    },
  }
};
</script>

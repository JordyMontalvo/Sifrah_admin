<template>
  <main class="section" style="max-width: 500px; margin: auto">

    <div class="field">
      <label class="label">Email</label>
      <div class="control has-icons-left">
        <input class="input" type="email" placeholder="Email"
          v-model="email"
          :class="{'is-danger': error.email}"
          @keydown="reset('email')">
        <span class="icon is-small is-left">
          <i class="fas fa-envelope"></i>
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
        <button class="button is-link" @click="submit">Login</button>
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
    }
  },
  filters: {
    alert(msg) {
      if (msg == 'missing credentials') return 'Completa tus credenciales'
      if (msg == 'invalid account') return 'Cuenta inválida'
      if (msg == 'invalid password') return 'Contraseña incorrecta'
      if (msg == 'missing session') return 'Sesión inválida'
    },
  },
  methods: {
    async submit() {

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
        const msg = (e && e.response && e.response.data && e.response.data.msg) || 'invalid account'
        this.alert = msg
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

<script>
export default {
  name: 'LoginPage',

  data() {
    return {
      email: "",
      password: "",
      errorText: "",
      busy: false
    };
  },

  methods: {
    getCsrfToken() {
      const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : '';
    },
    async apiFetch(url, options = {}) {
      const method = (options.method || 'GET').toUpperCase();
      const headers = { ...options.headers };
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        headers['x-csrf-token'] = this.getCsrfToken();
      }
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin',
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    },
    async submit() {
      this.busy = true;
      this.errorText = "";
      try {
        await this.apiFetch("/api/auth/login", {
          method: "POST",
          body: {
            email: this.email,
            password: this.password
          }
        });
        await this.$store.dispatch('auth/checkAuth', true);
        this.$router.push('/dashboard');
      } catch (error) {
        this.errorText = String(error?.message || "Login failed");
      } finally {
        this.busy = false;
      }
    }
  }
};
</script>

<template lang="pug">
  section.login-wrap
    article.login-card
      h1 {{ $t('login.title') }}
      p {{ $t('login.subtitle') }}
      form.login-form(@submit.prevent="submit")
        label
          | {{ $t('auth.email') }}
          input#email(name="email" v-model="email" type="email" :placeholder="$t('login.emailPlaceholder')" autocomplete="username")
        label
          | {{ $t('auth.password') }}
          input#password(name="password" v-model="password" type="password" :placeholder="$t('login.passwordPlaceholder')" autocomplete="current-password")
        button(type="submit" :disabled="busy || !email.trim() || !password.trim()") {{ busy ? $t('auth.signingIn') : $t('auth.signIn') }}
      p.error(v-if="errorText") {{ errorText }}
      p.hint {{ $t('login.hint') }}
</template>

<style scoped>
.login-wrap {
  min-height: calc(100vh - 120px);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.login-card {
  width: min(420px, 96%);
  border: 1px solid rgba(114, 135, 161, 0.3);
  border-radius: 16px;
  background: linear-gradient(165deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: 0 14px 38px rgba(17, 37, 63, 0.12);
  padding: 1.1rem;
  display: grid;
  gap: 0.75rem;
}

.login-card h1 {
  margin: 0;
  color: #123055;
  letter-spacing: 0.01em;
}

.login-card > p {
  margin: 0;
  color: #4a617f;
}

.login-form {
  display: grid;
  gap: 0.7rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.86rem;
  font-weight: 700;
  color: #274568;
}

input,
button {
  border: 1px solid #c8d6e5;
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  font: inherit;
}

button {
  background: linear-gradient(135deg, #e0f6fa, #d8f0f4);
  color: #0a4752;
  font-weight: 700;
  cursor: pointer;
}

.error {
  color: #b91c1c;
  font-weight: 700;
}

.hint {
  color: #506684;
  font-size: 0.82rem;
}
</style>

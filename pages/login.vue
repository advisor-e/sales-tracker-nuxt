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
  section.hero.is-fullheight-with-navbar
    .hero-body
      .container
        .columns.is-centered
          .column.is-5-tablet.is-4-desktop
            .box
              p.title.is-4.has-text-centered {{ $t('login.title') }}
              p.subtitle.is-6.has-text-centered.mb-5 {{ $t('login.subtitle') }}
              form(@submit.prevent="submit")
                b-field(:label="$t('auth.email')" label-for="email")
                  b-input#email(
                    v-model="email"
                    type="email"
                    :placeholder="$t('login.emailPlaceholder')"
                    autocomplete="username"
                    name="email"
                    expanded
                  )
                b-field(:label="$t('auth.password')" label-for="password")
                  b-input#password(
                    v-model="password"
                    type="password"
                    :placeholder="$t('login.passwordPlaceholder')"
                    autocomplete="current-password"
                    name="password"
                    expanded
                  )
                b-notification.mt-4(v-if="errorText" type="is-danger is-light" :closable="false") {{ errorText }}
                b-button.mt-4(
                  native-type="submit"
                  type="is-info"
                  :loading="busy"
                  :disabled="!email.trim() || !password.trim()"
                  expanded
                ) {{ $t('auth.signIn') }}
              p.has-text-grey.is-size-7.mt-4.has-text-centered {{ $t('login.hint') }}
</template>

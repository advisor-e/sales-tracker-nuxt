<script setup lang="ts">
const { checkAuth } = useAuth();

const email = ref("");
const password = ref("");
const errorText = ref("");
const busy = ref(false);

async function submit() {
  busy.value = true;
  errorText.value = "";
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value
      }
    });
    // Force refresh auth state so header shows correct user
    await checkAuth(true);
    await navigateTo("/dashboard");
  } catch (error: unknown) {
    const e = error as { data?: { statusMessage?: string }; message?: string };
    errorText.value = String(e?.data?.statusMessage || e?.message || "Login failed");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="login-wrap">
    <article class="login-card">
      <h1>{{ $t('login.title') }}</h1>
      <p>{{ $t('login.subtitle') }}</p>
      <form @submit.prevent="submit" class="login-form">
        <label>
          {{ $t('auth.email') }}
          <input id="email" name="email" v-model="email" type="email" :placeholder="$t('login.emailPlaceholder')" autocomplete="username" />
        </label>
        <label>
          {{ $t('auth.password') }}
          <input id="password" name="password" v-model="password" type="password" :placeholder="$t('login.passwordPlaceholder')" autocomplete="current-password" />
        </label>
        <button type="submit" :disabled="busy || !email.trim() || !password.trim()">{{ busy ? $t('auth.signingIn') : $t('auth.signIn') }}</button>
      </form>
      <p v-if="errorText" class="error">{{ errorText }}</p>
      <p class="hint">{{ $t('login.hint') }}</p>
    </article>
  </section>
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

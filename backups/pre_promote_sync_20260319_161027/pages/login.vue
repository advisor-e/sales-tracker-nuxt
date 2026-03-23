<script setup lang="ts">
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
    await navigateTo("/dashboard");
  } catch (error: any) {
    errorText.value = String(error?.data?.statusMessage || error?.message || "Login failed");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="login-wrap">
    <article class="login-card">
      <h1>Sign In</h1>
      <p>Use your account to access your tenant data.</p>
      <label>
        Email
        <input v-model="email" type="email" placeholder="you@example.com" />
      </label>
      <label>
        Password
        <input v-model="password" type="password" placeholder="********" />
      </label>
      <button :disabled="busy || !email.trim() || !password.trim()" @click="submit">{{ busy ? "Signing in..." : "Sign In" }}</button>
      <p v-if="errorText" class="error">{{ errorText }}</p>
      <p class="hint">First-time bootstrap: set ADMIN_EMAIL and ADMIN_PASSWORD in .env and sign in with those values.</p>
    </article>
  </section>
</template>

<style scoped>
.login-wrap {
  min-height: calc(100vh - 120px);
  display: grid;
  place-items: center;
}

.login-card {
  width: min(420px, 96%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
  display: grid;
  gap: 0.7rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: 600;
}

input,
button {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
}

button {
  cursor: pointer;
}

.error {
  color: #b91c1c;
}

.hint {
  color: #475569;
  font-size: 0.85rem;
}
</style>

export type UserRole = "firm_manager" | "advisor";

interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  role: UserRole;
}

interface AuthState {
  authenticated: boolean;
  user: AuthUser | null;
  checkedAt: number;
  checking: boolean;
}

const AUTH_CACHE_MS = 5 * 60 * 1000; // 5 minutes

export function useAuth() {
  const authState = useState<AuthState>("auth:state", () => ({
    authenticated: false,
    user: null,
    checkedAt: 0,
    checking: false
  }));

  // Capture headers synchronously at composable setup time (safe for SSR)
  const requestHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;

  const isAuthenticated = computed(() => authState.value.authenticated);
  const user = computed(() => authState.value.user);

  const isCacheValid = (): boolean => {
    // Cache is valid if we have a recent check and are on client
    if (import.meta.server) return false;
    return authState.value.checkedAt > 0 &&
           Date.now() - authState.value.checkedAt < AUTH_CACHE_MS;
  };

  const checkAuth = async (force = false): Promise<boolean> => {
    // Skip if already checking
    if (authState.value.checking) {
      return authState.value.authenticated;
    }

    // Skip if cache is valid and not forced
    if (!force && isCacheValid()) {
      return authState.value.authenticated;
    }

    authState.value.checking = true;

    try {
      const res = await $fetch<{ authenticated: boolean; user: AuthUser | null }>("/api/auth/me", {
        headers: requestHeaders
      });

      authState.value.authenticated = Boolean(res.authenticated);
      authState.value.user = res.user || null;
      authState.value.checkedAt = Date.now();
    } catch {
      authState.value.authenticated = false;
      authState.value.user = null;
      authState.value.checkedAt = Date.now();
    } finally {
      authState.value.checking = false;
    }

    return authState.value.authenticated;
  };

  const clearAuth = () => {
    authState.value = {
      authenticated: false,
      user: null,
      checkedAt: 0,
      checking: false
    };
  };

  const logout = async (): Promise<void> => {
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors - still clear local state
    }
    // Clear auth cache
    clearAuth();
    // Clear lists cache
    const { invalidateCache } = useLists();
    invalidateCache();
  };

  return {
    isAuthenticated,
    user,
    checkAuth,
    clearAuth,
    logout,
    isCacheValid
  };
}

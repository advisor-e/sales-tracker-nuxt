const LISTS_CACHE_MS = 5 * 60 * 1000; // 5 minutes

export function useLists() {
  const listsState = useState("lists:state", () => ({
    lists: {},
    loading: false,
    loaded: false
  }));

  const lastFetchTime = useState("lists:fetchTime", () => 0);

  const isCacheValid = () => {
    if (import.meta.server) return false;
    return listsState.value.loaded && Date.now() - lastFetchTime.value < LISTS_CACHE_MS;
  };

  const fetchLists = async (force = false) => {
    // Skip if already loading
    if (listsState.value.loading) {
      return listsState.value.lists;
    }

    // Use cache if valid
    if (!force && isCacheValid()) {
      return listsState.value.lists;
    }

    listsState.value.loading = true;

    try {
      const res = await $fetch("/api/lists");

      listsState.value.lists = res.lists;
      listsState.value.loaded = true;
      lastFetchTime.value = Date.now();
    } catch (err) {
      console.error("Failed to fetch lists:", err);
    } finally {
      listsState.value.loading = false;
    }

    return listsState.value.lists;
  };

  const saveList = async (key, items, colors) => {
    try {
      await $fetch("/api/lists", {
        method: "POST",
        body: { key, items, colors }
      });

      // Update local state
      if (listsState.value.lists[key]) {
        listsState.value.lists[key].items = items;
        if (colors) {
          listsState.value.lists[key].colors = colors;
        }
      }

      return true;
    } catch (err) {
      console.error("Failed to save list:", err);
      return false;
    }
  };

  const getListItems = (key) => {
    return listsState.value.lists[key]?.items || [];
  };

  const getListColors = (key) => {
    return listsState.value.lists[key]?.colors || {};
  };

  const invalidateCache = () => {
    lastFetchTime.value = 0;
    listsState.value.loaded = false;
  };

  return {
    lists: computed(() => listsState.value.lists),
    loading: computed(() => listsState.value.loading),
    loaded: computed(() => listsState.value.loaded),
    fetchLists,
    saveList,
    getListItems,
    getListColors,
    invalidateCache
  };
}

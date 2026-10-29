import { onMounted, onUnmounted, ref, watch } from 'vue';

export function usePanelAutoRefresh(task: (forceRefresh: boolean) => Promise<void>, intervalMs = 15_000) {
  const loading = ref(false);
  const autoRefresh = ref(false);
  const refreshedAt = ref('-');
  let timer: number | undefined;

  async function refresh(forceRefresh = true) {
    if (loading.value) return;
    loading.value = true;
    try {
      await task(forceRefresh);
      refreshedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    } catch {
      // request 层已经统一提示后端错误，这里只负责结束加载态。
    } finally {
      loading.value = false;
    }
  }

  function stopTimer() {
    if (timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  }

  watch(autoRefresh, (enabled) => {
    stopTimer();
    if (!enabled) return;
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(true);
    }, intervalMs);
  });

  onMounted(() => void refresh(false));
  onUnmounted(stopTimer);

  return { loading, autoRefresh, refreshedAt, refresh };
}

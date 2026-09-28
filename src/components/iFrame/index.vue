<template>
  <div v-loading="loading" :style="'height:' + height">
    <!--
      未配置控制台地址：直接给可读提示。
      背景（2026-09-28）：系统监控下 Admin监控/任务调度中心/AI控制台 三个页面都是 iframe 外链控制台，
      地址来自 VITE_APP_* 环境变量；地址缺失或目标服务未启动时，浏览器只会在 iframe 里显示
      「localhost 拒绝了我们的连接请求」，用户无法判断是配置问题还是服务没起。
    -->
    <el-empty v-if="!url" :description="'未配置' + name + '控制台地址'" :style="'height:' + height">
      <template #description>
        <div class="console-empty">
          <p>{{ name }}控制台地址未配置</p>
          <p class="text-gray-400">
            请在前端环境变量中配置对应地址（开发环境见 <code>.env.development</code>，生产为 nginx 反代相对路径）
          </p>
        </div>
      </template>
    </el-empty>

    <!-- 已配置但探测不可达：给出地址与排查入口，避免只看到浏览器错误页 -->
    <el-result v-else-if="state === 'down'" icon="warning" :title="name + '控制台暂不可达'" :sub-title="downHint">
      <template #extra>
        <el-button type="primary" @click="probe">重新检测</el-button>
        <el-button @click="openInNewTab">在新窗口打开</el-button>
      </template>
    </el-result>

    <iframe v-else :src="url" frameborder="no" style="width: 100%; height: 100%" scrolling="auto" />
  </div>
</template>

<script setup lang="ts">
import { propTypes } from '@/utils/propTypes';

const props = defineProps({
  /** 控制台地址；为空表示本环境未部署该控制台（原 isRequired 会在空值时报 Vue 警告） */
  src: propTypes.string.def(''),
  /** 控制台名称，用于提示文案（如「Admin监控（Spring Boot Admin）」） */
  name: propTypes.string.def('监控')
});

const height = ref(document.documentElement.clientHeight - 94.5 + 'px;');
const loading = ref(true);
const url = computed(() => props.src);
/** 可达性状态：unknown=检测中/未检测，ok=可达，down=不可达 */
const state = ref<'unknown' | 'ok' | 'down'>('unknown');
const downHint = computed(
  () =>
    `当前地址：${props.src}；请确认该控制台服务已启动、端口与路径正确后点击「重新检测」。` +
    `（历史现象：地址不可达时浏览器仅在 iframe 内显示“拒绝了我们的连接请求”）`
);

/**
 * 探测控制台是否可达。
 *
 * 为什么用 fetch(mode:'no-cors') 而不是 iframe 的 onload：
 * 跨域 iframe 在「连接被拒」时同样会触发 load 事件（加载的是浏览器错误页），无法区分；
 * no-cors 请求在目标端口未监听时会立刻 reject，可判定为不可达，而在服务正常（含 401/403 登录页）时返回 opaque 响应，
 * 足以区分「服务没起」与「服务已起但需要登录」。
 */
const probe = async () => {
  if (!url.value) {
    return;
  }
  state.value = 'unknown';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url.value, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    state.value = 'ok';
  } catch (error) {
    state.value = 'down';
  } finally {
    clearTimeout(timer);
  }
};

const openInNewTab = () => {
  window.open(url.value, '_blank');
};

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 300);
  probe();
  window.onresize = function temp() {
    height.value = document.documentElement.clientHeight - 94.5 + 'px;';
  };
});
</script>

<style scoped>
.console-empty {
  text-align: center;
  line-height: 1.9;
}
</style>

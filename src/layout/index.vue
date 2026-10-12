<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme }">
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <side-bar v-if="showSidebar" class="sidebar-container" />
    <div :class="{ hasTagsView: needTagsView, sidebarHide: sidebar.hide }" class="main-container">
      <div :class="{ 'fixed-header': fixedHeader }" class="layout-header">
        <navbar @set-layout="setLayout" />
        <tags-view v-if="needTagsView" />
      </div>
      <app-main :class="{ 'with-fixed-header': fixedHeader, 'with-tags-view': needTagsView }" />
      <settings ref="settingRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NavTypeEnum } from '@/enums/NavTypeEnum';
import { useAppStore } from '@/store/modules/app';
import { useSettingsStore } from '@/store/modules/settings';
import { initMessageBox, initPush } from '@/utils/push';
import { AppMain, Navbar, Settings, TagsView } from './components';
import SideBar from './components/Sidebar/index.vue';

const settingsStore = useSettingsStore();
const theme = computed(() => settingsStore.theme);
const sidebar = computed(() => useAppStore().sidebar);
const device = computed(() => useAppStore().device);
const needTagsView = computed(() => settingsStore.tagsView);
const fixedHeader = computed(() => settingsStore.fixedHeader);
const layout = computed(() => settingsStore.navType);

// 根据布局模式判断是否显示侧边栏
const showSidebar = computed(() => {
  if (sidebar.value.hide) return false;
  return layout.value === NavTypeEnum.LEFT || layout.value === NavTypeEnum.MIX;
});

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}));

const { width } = useWindowSize();
const WIDTH = 992; // refer to Bootstrap's responsive design

watch(
  width,
  w => {
    if (w - 1 < WIDTH) {
      useAppStore().toggleDevice('mobile');
      useAppStore().closeSideBar({ withoutAnimation: true });
    } else {
      useAppStore().toggleDevice('desktop');
    }
  },
  { immediate: true }
);

const settingRef = ref<InstanceType<typeof Settings>>();

onMounted(async () => {
  try {
    // FIX: 2026-09-28 站内信聚合接口（GET /resource/message/box）当前后端未实现（go88-resource 仅提供
    // /oss、/oss/config、/email、/sms，go88-api-resource 也只暴露 publishMessage/publishAll），
    // 该调用原先直接 await → 请求 reject 会冒到 layout 顶层，导致每次进后台都弹一次错误提示 + 控制台报错。
    // 解决方案：捕获并降级为告警日志，接口补齐后此处无需再改（功能一旦可用即自动生效）。
    await initMessageBox();
  } catch (error) {
    console.warn('[layout] 站内信接口不可用，已跳过消息拉取：', error);
  } finally {
    initPush();
  }
});

const handleClickOutside = () => {
  useAppStore().closeSideBar({ withoutAnimation: false });
};

const setLayout = () => {
  settingRef.value?.openSetting();
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/mixin.scss';
@use '@/assets/styles/tokens/sass-vars' as *;

.app-wrapper {
  @include mixin.clearfix;
  position: relative;
  height: 100%;
  width: 100%;
  background: var(--app-shell-bg);

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.4;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.layout-header {
  position: relative;
  z-index: 9;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 12px 0;
  background: transparent;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  width: calc(100% - #{$base-sidebar-width} - 12px);
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - 70px);
}

.sidebarHide .fixed-header {
  width: 100%;
}

.mobile .fixed-header {
  width: 100%;
  top: 0;
}
</style>

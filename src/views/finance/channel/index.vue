<template>
  <div class="p-2 app-container finance-channel-page">
    <el-card shadow="hover" class="mb-2">
      <el-form :inline="true" class="query-form">
        <el-form-item label="大类">
          <el-input v-model="queryParams.groupKeyword" placeholder="名称/编码" clearable style="width: 160px" @keyup.enter="getGroups" />
        </el-form-item>
        <el-form-item label="通道">
          <el-input v-model="filters.routeKeyword" placeholder="名称/编码/三方编码" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="filters.methodType" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="item in methodOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="三方供应商">
          <el-select v-model="filters.provider" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in providerOptions" :key="item" :label="item" :value="item" />
            <el-option label="无三方候选" value="__SELF" />
          </el-select>
        </el-form-item>
        <el-form-item label="通道状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getGroups">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <div>
            <h3 class="title">充值大类与通道</h3>
            <div class="hint">大类 = 玩家收银台一级入口；子通道 = 客户端可选渠道，按权重分流到 1~N 个三方通道</div>
          </div>
          <div class="stats">
            <el-tag type="info">大类 {{ groups.length }}</el-tag>
            <el-tag type="info">子通道 {{ stats.total }}（启用 {{ stats.enabled }}）</el-tag>
            <el-tag :type="stats.noUsable ? 'danger' : 'info'">无可用三方 {{ stats.noUsable }}</el-tag>
            <el-tag :type="stats.lowRate ? 'danger' : 'info'">今日成功率&lt;50% {{ stats.lowRate }}</el-tag>
          </div>
          <div class="grow" />
          <el-checkbox v-model="filters.onlyAbnormal">只看异常</el-checkbox>
          <el-button size="small" @click="setAllExpanded(true)">全部展开</el-button>
          <el-button size="small" @click="setAllExpanded(false)">全部收起</el-button>
          <el-button v-hasPermi="['finance:channel:edit']" type="primary" size="small" icon="Plus" @click="openGroupDialog()">新增大类</el-button>
          <el-button size="small" icon="Refresh" @click="getGroups">刷新</el-button>
        </div>
      </template>
      <div v-loading="loading">
        <ChannelGroupTable
          :view-groups="viewGroups"
          :expanded-routes="expandedRoutes"
          :group-move-tip="groupMoveTip"
          :route-move-tip="routeMoveTip"
          @toggle-group="toggleGroup"
          @toggle-route="toggleRoute"
          @move-group="moveGroup"
          @move-route="moveRoute"
          @edit-group="openGroupDialog"
          @edit-route="openRouteDialog"
          @add-route="openNewRouteDialog"
          @delete-route="handleDeleteRoute"
          @switch-route="handleRouteSwitch"
          @switch-group="handleGroupSwitch"
          @save-remark="handleRemark"
          @sort-change="(prop, order) => (sortState = { prop, order })"
        />
      </div>
      <div class="hint mt-2">
        成功率口径：分母只统计非初始状态的充值单（处理中/成功/失败/已取消，不含待支付），分子为成功；样本少于 30 笔不着色。
        通道费率为手填的参考值，不参与任何计算。三方通道由系统自动匹配，增减与启停在「支付渠道中心」维护。点费率/成功率列头只在大类内排序，不改配置顺序。
      </div>
    </el-card>

    <ChannelGroupDialog v-model:visible="groupDialog" :group="editingGroup" :next-sort-no="groups.length + 1" @saved="onGroupSaved" />
    <ChannelRouteDialog
      v-model:visible="routeDialog"
      :groups="groups"
      :initial="routeInitial"
      :p2p-original="p2pOriginal"
      @saved="getGroups"
    />
  </div>
</template>

<script setup name="FinanceChannel" lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import modal from '@/plugins/modal';
import {
  changeChannelGroupStatus, changeChannelRouteSwitch, deleteChannelRoute, listChannelGroups,
  reorderChannelGroups, reorderChannelRoutes, saveChannelGroup, updateChannelRouteRemark
} from '@/api/finance/channel';
import type {
  FinanceChannelGroupForm, FinanceChannelGroupVO, FinanceChannelQuery, FinanceChannelRouteForm, FinanceChannelRouteVO
} from '@/api/finance/channel/types';
import { changeWithdrawChannelStatus, changeWithdrawTabStatus, listWithdrawChannelProfiles, listWithdrawTabs } from '@/api/finance/withdraw-channel';
import type { WithdrawChannelProfileVO, WithdrawTabVO } from '@/api/finance/withdraw-channel/types';
import ChannelGroupTable from './components/ChannelGroupTable.vue';
import type { ViewGroup } from './components/ChannelGroupTable.vue';
import ChannelGroupDialog from './components/ChannelGroupDialog.vue';
import ChannelRouteDialog from './components/ChannelRouteDialog.vue';
import {
  abnormalReason, isP2pGroup, methodOptions, newRouteForm, P2P_GROUP_CODE, P2P_GROUP_TYPE,
  p2pRouteFromProfile, routeToForm, usableCandidates, visibleRoutes
} from './channel-utils';

/**
 * 充值大类与通道（2026-11-06 改版 P0）：按大类合并单元格展示子通道，子通道可展开三方候选；
 * 成功率/成本费率来自 GET /groups?withStats=true，排序走整组 reorder 接口。
 */
const COLLAPSED_KEY = 'finance-channel-collapsed';
const loading = ref(false);
const groups = ref<FinanceChannelGroupVO[]>([]);
const p2pProfiles = ref<WithdrawChannelProfileVO[]>([]);
const withdrawTabs = ref<WithdrawTabVO[]>([]);
const queryParams = reactive<FinanceChannelQuery>({ groupKeyword: '' });
const filters = reactive({ routeKeyword: '', methodType: '', provider: '', status: undefined as number | undefined, onlyAbnormal: false });
const sortState = ref<{ prop: string; order: string | null }>({ prop: '', order: null });
const collapsed = ref<Set<number>>(readCollapsed());
const expandedRoutes = ref<Set<number>>(new Set());

function readCollapsed(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
const saveCollapsed = () => {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed.value]));
  } catch {
    /* 浏览器存储不可用时只影响折叠状态记忆 */
  }
};

const localFiltering = computed(() =>
  !!(filters.routeKeyword.trim() || filters.methodType || filters.provider || filters.status !== undefined || filters.onlyAbnormal));

const routeMatches = (route: FinanceChannelRouteVO) => {
  const kw = filters.routeKeyword.trim().toLowerCase();
  const candidates = route.candidates ?? [];
  if (filters.methodType && route.methodType !== filters.methodType) return false;
  if (filters.status !== undefined && route.status !== filters.status) return false;
  if (filters.provider === '__SELF' && candidates.length) return false;
  if (filters.provider && filters.provider !== '__SELF' && !candidates.some((c) => c.providerName === filters.provider)) return false;
  if (filters.onlyAbnormal && !abnormalReason(route)) return false;
  if (!kw) return true;
  return [route.channelName, route.routeCode, ...candidates.map((c) => c.providerChannelCode), ...candidates.map((c) => c.providerName)]
    .some((text) => (text ?? '').toLowerCase().includes(kw));
};

const sortValue = (route: FinanceChannelRouteVO) => Number((route as any)[sortState.value.prop] ?? -1);
// 排序列：feeRate（手填参考值）、todaySuccessRate、d30SuccessRate，均只在大类内按显示值排序

const viewGroups = computed<ViewGroup[]>(() => groups.value
  .map((group) => {
    let routes = visibleRoutes(group).filter(routeMatches);
    if (sortState.value.order) {
      const dir = sortState.value.order === 'ascending' ? 1 : -1;
      routes = routes.toSorted((a, b) => (sortValue(a) - sortValue(b)) * dir);
    }
    return { group, routes, expanded: !collapsed.value.has(group.groupId) || localFiltering.value };
  })
  .filter((view) => !localFiltering.value || view.routes.length > 0));

const stats = computed(() => {
  const all = groups.value.flatMap(visibleRoutes);
  return {
    total: all.length,
    enabled: all.filter((r) => r.status === 1).length,
    noUsable: all.filter((r) => r.status === 1 && (r.candidates ?? []).length > 0 && usableCandidates(r).length === 0).length,
    lowRate: all.filter((r) => abnormalReason(r) === '今日成功率低于 50%').length
  };
});

const providerOptions = computed(() => [...new Set(groups.value.flatMap((g) => (g.routes ?? [])
  .flatMap((r) => (r.candidates ?? []).map((c) => c.providerName || '')))).values()].filter(Boolean).toSorted());

const groupMoveTip = computed(() => (queryParams.groupKeyword?.trim() ? '按大类筛选时不能调整大类顺序' : ''));
const routeMoveTip = (group: FinanceChannelGroupVO) => {
  if (isP2pGroup(group)) return 'P2P 渠道顺序在提现渠道页维护';
  if (sortState.value.order) return '取消列排序后可调整顺序';
  if (localFiltering.value) return '筛选中不能调整顺序';
  return '';
};

const getGroups = async () => {
  loading.value = true;
  try {
    const [res, p2pRes, tabRes] = await Promise.all([
      listChannelGroups({ groupKeyword: queryParams.groupKeyword }),
      listWithdrawChannelProfiles({ tabCode: P2P_GROUP_CODE, platform: 'go88' }).catch(() => ({ data: [] })),
      listWithdrawTabs().catch(() => ({ data: [] }))
    ]);
    p2pProfiles.value = p2pRes.data ?? [];
    withdrawTabs.value = tabRes.data ?? [];
    const loaded = [...(res.data ?? [])];
    const p2pTab = withdrawTabs.value.find((tab) => tab.tabCode === P2P_GROUP_CODE);
    let p2pGroup = loaded.find(isP2pGroup);
    if (!p2pGroup && !queryParams.groupKeyword?.trim()) {
      p2pGroup = { groupId: -1, groupCode: P2P_GROUP_CODE, groupName: 'P2P 充值', groupType: P2P_GROUP_TYPE, sortNo: 99, status: p2pTab?.status ?? 1, routes: [] };
      loaded.push(p2pGroup);
    }
    if (p2pGroup) {
      if (p2pTab) p2pGroup.status = p2pTab.status;
      p2pGroup.routes = p2pProfiles.value.map((profile) => p2pRouteFromProfile(profile, p2pGroup!.groupId));
    }
    groups.value = loaded;
  } finally {
    loading.value = false;
  }
};

const resetQuery = () => {
  queryParams.groupKeyword = '';
  Object.assign(filters, { routeKeyword: '', methodType: '', provider: '', status: undefined, onlyAbnormal: false });
  getGroups();
};

const toggleGroup = (group: FinanceChannelGroupVO) => {
  const next = new Set(collapsed.value);
  next.has(group.groupId) ? next.delete(group.groupId) : next.add(group.groupId);
  collapsed.value = next;
  saveCollapsed();
};
const setAllExpanded = (open: boolean) => {
  collapsed.value = open ? new Set() : new Set(groups.value.map((g) => g.groupId));
  expandedRoutes.value = open
    ? new Set(groups.value.flatMap((g) => (g.routes ?? []).filter((r) => (r.candidates ?? []).length).map((r) => r.routeId)))
    : new Set();
  saveCollapsed();
};
const toggleRoute = (route: FinanceChannelRouteVO) => {
  const next = new Set(expandedRoutes.value);
  next.has(route.routeId) ? next.delete(route.routeId) : next.add(route.routeId);
  expandedRoutes.value = next;
};

const moveInList = <T,>(list: T[], item: T, dir: number | 'top'): T[] => {
  const out = list.filter((x) => x !== item);
  const index = list.indexOf(item);
  out.splice(dir === 'top' ? 0 : Math.max(0, Math.min(out.length, index + dir)), 0, item);
  return out;
};
const moveGroup = async (group: FinanceChannelGroupVO, dir: number | 'top') => {
  const real = groups.value.filter((g) => g.groupId > 0);
  const ordered = moveInList(real, group, dir);
  await reorderChannelGroups(ordered.map((g) => g.groupId));
  modal.msgSuccess('大类顺序已保存');
  getGroups();
};
const moveRoute = async (group: FinanceChannelGroupVO, route: FinanceChannelRouteVO, dir: number | 'top') => {
  const shown = visibleRoutes(group);
  // 快捷充值隐藏的历史档位行排在最后，保证提交的是完整 ID 集合
  const hidden = (group.routes ?? []).filter((r) => !shown.includes(r));
  const ordered = [...moveInList(shown, route, dir), ...hidden];
  await reorderChannelRoutes(group.groupId, ordered.map((r) => r.routeId));
  modal.msgSuccess('子通道顺序已保存');
  getGroups();
};

const handleRouteSwitch = async (group: FinanceChannelGroupVO, route: FinanceChannelRouteVO, value: number) => {
  if (value === 0) {
    const othersOn = visibleRoutes(group).filter((r) => r.routeId !== route.routeId && r.status === 1).length;
    const warn = othersOn ? '' : `<br/><b style="color:var(--el-color-danger)">这是「${group.groupName}」最后一条启用的子通道，停用后该大类在收银台没有可用通道。</b>`;
    await ElMessageBox.confirm(`确认停用「${route.channelName}」？停用后玩家端立即不再展示该通道。${warn}`, '停用子通道', {
      type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: '确定', cancelButtonText: '取消'
    });
  }
  if (route.methodType === 'P2P') {
    await changeWithdrawChannelStatus(route.withdrawChannelId ?? route.routeId, value);
  } else {
    await changeChannelRouteSwitch(route.routeId, 'status', value);
  }
  modal.msgSuccess('已更新');
  getGroups();
};

const syncP2pTabStatus = async (status: number) => {
  const tab = withdrawTabs.value.find((t) => t.tabCode === P2P_GROUP_CODE);
  if (tab && tab.status !== status) await changeWithdrawTabStatus(tab.tabId, status);
};
const handleGroupSwitch = async (group: FinanceChannelGroupVO, value: number) => {
  if (value === 0) {
    await modal.confirm(`确认停用大类「${group.groupName}」？玩家收银台将隐藏整个大类，子通道自身开关不变。`);
  }
  if (isP2pGroup(group) && group.groupId <= 0) {
    await saveChannelGroup({ groupCode: P2P_GROUP_CODE, groupName: group.groupName, groupType: P2P_GROUP_TYPE, sortNo: group.sortNo, status: value });
  } else {
    await changeChannelGroupStatus(group.groupId, value);
  }
  if (isP2pGroup(group)) await syncP2pTabStatus(value);
  modal.msgSuccess('已更新');
  getGroups();
};

const handleRemark = async (route: FinanceChannelRouteVO, remark: string) => {
  await updateChannelRouteRemark(route.routeId, remark);
  route.channelRemark = remark;
  modal.msgSuccess('备注已保存');
};

const handleDeleteRoute = async (route: FinanceChannelRouteVO) => {
  const count = (route.candidates ?? []).length;
  await modal.confirm(`确认删除子通道「${route.channelName}」？${count ? `已绑定的 ${count} 条三方候选会一并停用。` : ''}`);
  await deleteChannelRoute(route.routeId);
  modal.msgSuccess('删除成功');
  getGroups();
};

const groupDialog = ref(false);
const editingGroup = ref<FinanceChannelGroupVO>();
const openGroupDialog = (group?: FinanceChannelGroupVO) => {
  editingGroup.value = group;
  groupDialog.value = true;
};
const onGroupSaved = async (form: FinanceChannelGroupForm) => {
  if ((form.groupCode ?? '').toUpperCase() === P2P_GROUP_CODE) await syncP2pTabStatus(form.status ?? 1);
  getGroups();
};

const routeDialog = ref(false);
const routeInitial = ref<FinanceChannelRouteForm>();
const p2pOriginal = ref<WithdrawChannelProfileVO>();
const openRouteDialog = (route: FinanceChannelRouteVO) => {
  routeInitial.value = routeToForm(route);
  p2pOriginal.value = route.methodType === 'P2P'
    ? p2pProfiles.value.find((p) => p.withdrawChannelId === route.withdrawChannelId)
    : undefined;
  routeDialog.value = true;
};
const openNewRouteDialog = (group: FinanceChannelGroupVO) => {
  routeInitial.value = newRouteForm(group);
  p2pOriginal.value = undefined;
  routeDialog.value = true;
};

getGroups();
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.title { margin: 0; font-size: 16px; color: var(--el-text-color-primary); }
.hint { color: var(--el-text-color-secondary); font-size: 12px; }
.stats { display: flex; gap: 6px; flex-wrap: wrap; }
.grow { flex: 1; }
</style>

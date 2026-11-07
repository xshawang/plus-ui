<template>
  <el-table
    :data="rows"
    :span-method="spanMethod"
    :row-class-name="rowClass"
    row-key="key"
    border
    size="small"
    class="channel-group-table"
    @sort-change="(e: any) => emit('sort-change', e.prop, e.order)"
  >
    <el-table-column label="充值大类" width="132" fixed="left" align="center">
      <template #default="{ row }">
        <div class="group-cell">
          <img v-if="row.group.groupIcon" :src="row.group.groupIcon" class="group-icon" alt="" />
          <el-icon v-else class="group-icon-default" :size="20"><component :is="defaultIcon(row.group)" /></el-icon>
          <div class="group-name">{{ row.group.groupName }}</div>
          <el-tag size="small" type="info">{{ row.group.groupCode }}</el-tag>
          <el-tooltip v-if="row.group.blacklistEnable === 1" :content="'黑名单会员标签：' + (row.group.blacklistTagCode || '—')">
            <el-tag size="small" type="danger" effect="plain">黑名单</el-tag>
          </el-tooltip>
          <div v-hasPermi="['finance:channel:edit']" class="ops">
            <el-tooltip :content="groupMoveTip" :disabled="!groupMoveTip">
              <span>
                <el-button link type="primary" size="small" :disabled="!!groupMoveTip || row.groupIndex === 0" @click="emit('move-group', row.group, -1)">上移</el-button>
                <el-button link type="primary" size="small" :disabled="!!groupMoveTip || row.groupIndex === row.groupCount - 1" @click="emit('move-group', row.group, 1)">下移</el-button>
                <el-button link type="primary" size="small" :disabled="!!groupMoveTip || row.groupIndex === 0" @click="emit('move-group', row.group, 'top')">置顶</el-button>
              </span>
            </el-tooltip>
          </div>
          <div class="ops">
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" size="small" @click="emit('edit-group', row.group)">修改</el-button>
            <el-button link type="primary" size="small" @click="emit('toggle-group', row.group)">{{ row.kind === 'collapsed' ? '展开' : '收起' }}</el-button>
          </div>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="子通道排序" width="96" align="center">
      <template #default="{ row }">
        <div v-if="row.kind === 'collapsed' || row.kind === 'empty'" class="summary">
          <template v-if="row.kind === 'collapsed'">
            已收起 {{ row.total }} 条子通道（启用 {{ row.enabledCount }}）
            <el-button link type="primary" size="small" @click="emit('toggle-group', row.group)">展开</el-button>
          </template>
          <template v-else>
            暂无子通道
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" size="small" @click="emit('add-route', row.group)">新增子通道</el-button>
          </template>
        </div>
        <span v-else-if="row.kind === 'cand'" class="muted">—</span>
        <el-tooltip v-else :content="routeMoveTip(row.group)" :disabled="!routeMoveTip(row.group)">
          <div v-hasPermi="['finance:channel:edit']" class="ops">
            <el-button link type="primary" size="small" :disabled="!!routeMoveTip(row.group) || row.routeIndex === 0" @click="emit('move-route', row.group, row.route, -1)">上移</el-button>
            <el-button link type="primary" size="small" :disabled="!!routeMoveTip(row.group) || row.routeIndex === row.routeCount - 1" @click="emit('move-route', row.group, row.route, 1)">下移</el-button>
            <el-button link type="primary" size="small" :disabled="!!routeMoveTip(row.group) || row.routeIndex === 0" @click="emit('move-route', row.group, row.route, 'top')">置顶</el-button>
          </div>
        </el-tooltip>
      </template>
    </el-table-column>

    <el-table-column label="通道名称" min-width="150" align="center">
      <template #default="{ row }">
        <template v-if="row.kind === 'route'">
          <div class="name-line">
            <el-icon v-if="(row.route.candidates || []).length" class="chev" :class="{ open: expandedRoutes.has(row.route.routeId) }" @click="emit('toggle-route', row.route)"><ArrowRight /></el-icon>
            <el-button link type="primary" @click="emit('edit-route', row.route)">{{ row.route.channelName }}</el-button>
          </div>
          <div class="tags">
            <el-tag size="small">{{ methodLabel(row.route.methodType) }}</el-tag>
            <el-tooltip v-if="abnormalReason(row.route)" :content="abnormalReason(row.route)"><el-tag size="small" type="danger">异常</el-tag></el-tooltip>
          </div>
        </template>
        <div v-else-if="row.kind === 'cand'" class="cand-name">
          <span class="muted">↳ 三方通道</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="三方匹配" min-width="190" align="center">
      <template #header>三方匹配<div class="sub-head">只读 · 系统自动匹配</div></template>
      <template #default="{ row }">
        <template v-if="row.kind === 'route'">
          <div v-if="(row.route.candidates || []).length" class="chips">
            <el-tag
              v-for="c in row.route.candidates"
              :key="c.candidateId"
              size="small"
              round
              :type="c.usable ? 'primary' : 'info'"
              :class="{ off: !c.usable }"
              class="chip"
            >
              {{ c.providerName }} · {{ c.providerChannelCode }}
            </el-tag>
            <el-tooltip content="三方通道的增减与启停在「支付渠道中心」维护；本页只读">
              <span class="muted">可用 {{ usableCandidates(row.route).length }} / {{ row.route.candidates.length }} 家</span>
            </el-tooltip>
          </div>
          <template v-else>
            <el-tag size="small" :type="selfSourceLabel(row.route) === '未绑定三方' ? 'warning' : 'info'">{{ selfSourceLabel(row.route) }}</el-tag>
          </template>
        </template>
        <template v-else-if="row.kind === 'cand'">
          <div>{{ row.cand.providerName }}</div>
          <div class="muted">{{ row.cand.merchantName || '未绑定商户账号' }}</div>
        </template>
      </template>
    </el-table-column>

    <el-table-column label="通道编码" min-width="110" align="center">
      <template #default="{ row }">
        <span v-if="row.kind === 'route'">{{ row.route.routeCode }}</span>
        <template v-else-if="row.kind === 'cand'">
          <div>{{ row.cand.providerChannelCode }}</div>
          <div class="muted">{{ row.cand.providerPayType }}</div>
        </template>
      </template>
    </el-table-column>

    <el-table-column label="通道币种" width="76" align="center">
      <template #default="{ row }">{{ row.route?.currency }}</template>
    </el-table-column>

    <el-table-column label="通道单笔限额" min-width="160" align="center">
      <template #header>通道单笔限额<div class="sub-head">(最低金额~最高金额)</div></template>
      <template #default="{ row }">
        <template v-if="row.kind === 'route'">
          <span v-if="row.route.methodType === 'CARD'" class="primary">按卡面额</span>
          <template v-else>
            <div class="primary">可输入任意金额</div>
            <div class="muted">({{ formatMoneyRange(row.route.amountMin, row.route.amountMax) }})</div>
            <el-tooltip v-if="effectiveRange(row.route)" content="玩家端实际生效区间 = 三方候选区间 ∩ 子通道区间">
              <div class="warn">三方生效 {{ effectiveRange(row.route) }}</div>
            </el-tooltip>
          </template>
        </template>
        <template v-else-if="row.kind === 'cand'">
          <div>{{ formatMoneyRange(row.cand.amountMin, row.cand.amountMax) }}</div>
          <div v-if="autoOff(row.cand)" class="warn">自动摘流至 {{ row.cand.autoDisabledUntil }}</div>
        </template>
      </template>
    </el-table-column>

    <el-table-column label="通道推荐金额" min-width="170" align="center">
      <template #default="{ row }">
        <template v-if="row.kind === 'route'">
          <el-tooltip v-if="recommendText(row.route)" :content="formatMoneyList(recommendText(row.route))">
            <div class="amounts">{{ recommendText(row.route) }}</div>
          </el-tooltip>
          <span v-else class="muted">未配置</span>
        </template>
      </template>
    </el-table-column>

    <el-table-column label="通道费率" prop="feeRate" width="96" align="center" sortable="custom">
      <template #header>通道费率<div class="sub-head">仅供参考</div></template>
      <template #default="{ row }">
        <template v-if="row.kind === 'route'">
          <el-tooltip content="手填的参考值，不参与结算、选路、排序权重和任何报表">
            <span v-if="Number(row.route.feeRate) > 0">{{ Number(row.route.feeRate).toFixed(2) }}%</span>
            <span v-else class="muted">—</span>
          </el-tooltip>
        </template>
      </template>
    </el-table-column>

    <el-table-column label="今日充值成功率" prop="todaySuccessRate" width="118" align="center" sortable="custom">
      <template #default="{ row }">
        <RateCell v-if="row.kind !== 'collapsed' && row.kind !== 'empty'" :rate="(row.cand || row.route).todaySuccessRate" :total="(row.cand || row.route).todayOrderCount" :success="(row.cand || row.route).todaySuccessCount" />
      </template>
    </el-table-column>

    <el-table-column label="近30日充值成功率" prop="d30SuccessRate" width="126" align="center" sortable="custom">
      <template #default="{ row }">
        <RateCell v-if="row.kind !== 'collapsed' && row.kind !== 'empty'" :rate="(row.cand || row.route).d30SuccessRate" :total="(row.cand || row.route).d30OrderCount" :success="(row.cand || row.route).d30SuccessCount" />
      </template>
    </el-table-column>

    <el-table-column label="通道备注" min-width="120" align="center">
      <template #default="{ row }">
        <template v-if="row.kind === 'route'">
          <el-input
            v-if="editingRemark === row.route.routeId"
            v-model="remarkDraft"
            size="small"
            maxlength="500"
            autofocus
            @keyup.enter="commitRemark(row.route)"
            @keyup.esc="editingRemark = undefined"
            @blur="commitRemark(row.route)"
          />
          <el-button v-else-if="canEditRemark(row.route)" link type="primary" class="remark" @click="startRemark(row.route)">{{ row.route.channelRemark || '编辑' }}</el-button>
          <span v-else>{{ row.route.channelRemark || '—' }}</span>
        </template>
        <span v-else-if="row.kind === 'cand'" class="muted">{{ row.cand.remark || '—' }}</span>
      </template>
    </el-table-column>

    <el-table-column label="停/启用" width="80" align="center">
      <template #default="{ row }">
        <el-switch v-if="row.kind === 'route'" :model-value="row.route.status" :active-value="1" :inactive-value="0" inline-prompt active-text="开" inactive-text="关" @change="(v: any) => emit('switch-route', row.group, row.route, Number(v))" />
        <el-tag v-else-if="row.kind === 'cand'" size="small" :type="candStatus(row.cand).type">{{ candStatus(row.cand).text }}</el-tag>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="120" align="center">
      <template #default="{ row }">
        <template v-if="row.kind === 'route'">
          <el-button v-hasPermi="['finance:channel:edit']" link type="primary" size="small" @click="emit('edit-route', row.route)">修改</el-button>
          <el-button v-if="row.route.methodType !== 'P2P'" v-hasPermi="['finance:channel:edit']" link type="danger" size="small" @click="emit('delete-route', row.route)">删除</el-button>
        </template>
        <el-tooltip v-else-if="row.kind === 'cand'" content="三方通道的增减与启停在「支付渠道中心」维护">
          <span class="muted">只读</span>
        </el-tooltip>
      </template>
    </el-table-column>

    <el-table-column label="前台停/启用" width="96" align="center">
      <template #default="{ row }">
        <el-switch :model-value="row.group.status" :active-value="1" :inactive-value="0" inline-prompt active-text="开" inactive-text="关" @change="(v: any) => emit('switch-group', row.group, Number(v))" />
        <div v-if="row.kind !== 'collapsed'" class="add-route">
          <el-button v-hasPermi="['finance:channel:edit']" link type="primary" size="small" @click="emit('add-route', row.group)">＋子通道</el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FinanceChannelCandidateVO, FinanceChannelGroupVO, FinanceChannelRouteVO } from '@/api/finance/channel/types';
import { formatMoneyList, formatMoneyRange } from '@/utils/money';
import RateCell from './RateCell.vue';
import { abnormalReason, methodLabel, selfSourceLabel, usableCandidates } from '../channel-utils';

export interface ViewGroup {
  group: FinanceChannelGroupVO;
  routes: FinanceChannelRouteVO[];
  expanded: boolean;
}
type RowKind = 'route' | 'cand' | 'collapsed' | 'empty';
interface Row {
  key: string;
  kind: RowKind;
  group: FinanceChannelGroupVO;
  route?: FinanceChannelRouteVO;
  cand?: FinanceChannelCandidateVO;
  first: boolean;
  span: number;
  groupIndex: number;
  groupCount: number;
  routeIndex: number;
  routeCount: number;
  total?: number;
  enabledCount?: number;
}

const props = defineProps<{
  viewGroups: ViewGroup[];
  expandedRoutes: Set<number>;
  /** 非空时禁用大类排序（例如处于筛选中），内容为提示 */
  groupMoveTip: string;
  /** 返回非空时禁用该大类的子通道排序 */
  routeMoveTip: (group: FinanceChannelGroupVO) => string;
}>();

const emit = defineEmits<{
  'toggle-group': [group: FinanceChannelGroupVO];
  'toggle-route': [route: FinanceChannelRouteVO];
  'move-group': [group: FinanceChannelGroupVO, dir: number | 'top'];
  'move-route': [group: FinanceChannelGroupVO, route: FinanceChannelRouteVO, dir: number | 'top'];
  'edit-group': [group: FinanceChannelGroupVO];
  'edit-route': [route: FinanceChannelRouteVO];
  'add-route': [group: FinanceChannelGroupVO];
  'delete-route': [route: FinanceChannelRouteVO];
  'switch-route': [group: FinanceChannelGroupVO, route: FinanceChannelRouteVO, value: number];
  'switch-group': [group: FinanceChannelGroupVO, value: number];
  'save-remark': [route: FinanceChannelRouteVO, remark: string];
  'sort-change': [prop: string, order: string | null];
}>();

const GROUP_ICONS: Record<string, string> = {
  BANKS: 'OfficeBuilding', CARD: 'Postcard', EWALLET: 'Wallet', CRYPTO: 'Coin',
  QUICK_PAY: 'Grid', GIFTCODE: 'Present', P2P: 'Connection'
};
const defaultIcon = (group: FinanceChannelGroupVO) =>
  GROUP_ICONS[(group.groupCode ?? '').toUpperCase()] ?? (group.groupType === 4 ? 'Coin' : 'Money');

const rows = computed<Row[]>(() => {
  const out: Row[] = [];
  const groupCount = props.viewGroups.length;
  props.viewGroups.forEach((view, groupIndex) => {
    const groupRows: Row[] = [];
    const base = { group: view.group, first: false, span: 0, groupIndex, groupCount, routeIndex: 0, routeCount: view.routes.length };
    if (!view.expanded) {
      groupRows.push({ ...base, key: `g${view.group.groupId}`, kind: 'collapsed', total: view.routes.length,
        enabledCount: view.routes.filter((r) => r.status === 1).length });
    } else if (!view.routes.length) {
      groupRows.push({ ...base, key: `g${view.group.groupId}`, kind: 'empty' });
    } else {
      view.routes.forEach((route, routeIndex) => {
        groupRows.push({ ...base, key: `r${route.routeId}`, kind: 'route', route, routeIndex });
        if (props.expandedRoutes.has(route.routeId)) {
          (route.candidates ?? []).forEach((cand) =>
            groupRows.push({ ...base, key: `c${cand.candidateId}`, kind: 'cand', route, cand, routeIndex }));
        }
      });
    }
    groupRows[0].first = true;
    groupRows[0].span = groupRows.length;
    out.push(...groupRows);
  });
  return out;
});

const GROUP_COLUMNS = [0, 14];
const spanMethod = (data: { row: unknown; columnIndex: number }) => {
  const row = data.row as Row;
  const columnIndex = data.columnIndex;
  if (GROUP_COLUMNS.includes(columnIndex)) return row.first ? [row.span, 1] : [0, 0];
  if (row.kind === 'collapsed' || row.kind === 'empty') return columnIndex === 1 ? [1, 13] : [0, 0];
  return [1, 1];
};

const rowClass = (data: { row: unknown }) => rowClassOf(data.row as Row);
const rowClassOf = (row: Row) => [
  row.first ? 'group-first' : '',
  row.kind === 'cand' ? 'cand-row' : '',
  row.kind === 'route' && row.route?.status !== 1 ? 'off-row' : ''
].join(' ');

/** 三方通道状态（只读）：停用 / 自动摘流 / 参与匹配 / 不可用（上游供应商或商户停用，或权重为 0） */
const candStatus = (cand: FinanceChannelCandidateVO): { text: string; type: 'success' | 'warning' | 'info' } => {
  if (cand.enabled !== 1) return { text: '已停用', type: 'info' };
  if (autoOff(cand)) return { text: '自动摘流', type: 'warning' };
  return cand.usable ? { text: '参与匹配', type: 'success' } : { text: '不可用', type: 'info' };
};

const autoOff = (cand: FinanceChannelCandidateVO) =>
  !!cand.autoDisabledUntil && Date.parse(cand.autoDisabledUntil.replace(' ', 'T')) > Date.now();

/** 三方候选区间比子通道区间窄时才提示 */
const effectiveRange = (route: FinanceChannelRouteVO) => {
  if (!route.providerRouteCount) return '';
  const min = Math.max(Number(route.providerAmountMin ?? 0), Number(route.amountMin ?? 0));
  const routeMax = Number(route.amountMax ?? 0);
  const providerMax = Number(route.providerAmountMax ?? 0);
  const max = routeMax > 0 && providerMax > 0 ? Math.min(routeMax, providerMax) : Math.max(routeMax, providerMax);
  if (min === Number(route.amountMin ?? 0) && max === routeMax) return '';
  return formatMoneyRange(min, max);
};

const recommendText = (route: FinanceChannelRouteVO) => {
  if (route.recommendAmounts) return route.recommendAmounts;
  if (route.methodType === 'CARD' && route.denominations && route.denominations !== '[]') {
    return route.denominations.replace(/[[\]\s]/g, '');
  }
  return '';
};

const editingRemark = ref<number>();
const remarkDraft = ref('');
const canEditRemark = (route: FinanceChannelRouteVO) => route.methodType !== 'P2P';
const startRemark = (route: FinanceChannelRouteVO) => {
  remarkDraft.value = route.channelRemark ?? '';
  editingRemark.value = route.routeId;
};
const commitRemark = (route: FinanceChannelRouteVO) => {
  if (editingRemark.value !== route.routeId) return;
  editingRemark.value = undefined;
  const next = remarkDraft.value.trim();
  if (next !== (route.channelRemark ?? '')) emit('save-remark', route, next);
};
</script>

<style scoped>
.group-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.group-icon { width: 32px; height: 32px; object-fit: contain; }
.group-icon-default { width: 32px; height: 32px; border-radius: 50%; background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.group-name { color: var(--el-text-color-primary); font-size: 12px; line-height: 1.3; }
.ops { display: flex; flex-wrap: wrap; justify-content: center; }
.ops .el-button + .el-button { margin-left: 4px; }
.summary { text-align: left; padding-left: 8px; color: var(--el-text-color-secondary); }
.name-line { display: flex; align-items: center; justify-content: center; gap: 2px; }
.chev { cursor: pointer; color: var(--el-text-color-secondary); transition: transform 0.15s; }
.chev.open { transform: rotate(90deg); }
.tags { display: flex; gap: 4px; justify-content: center; margin-top: 2px; }
.chips { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.chip.off { text-decoration: line-through; }
.cand-name { text-align: left; padding-left: 12px; }
.muted { color: var(--el-text-color-secondary); font-size: 12px; }
.primary { color: var(--el-color-primary); }
.warn { color: var(--el-color-warning); font-size: 12px; }
.sub-head { font-weight: 400; font-size: 11px; color: var(--el-text-color-secondary); }
.amounts { color: var(--el-color-primary); word-break: break-all; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.remark { max-width: 110px; overflow: hidden; text-overflow: ellipsis; }
.add-route { margin-top: 6px; }
:deep(.group-first > td) { border-top: 2px solid var(--el-border-color) !important; }
:deep(.cand-row > td) { background: var(--el-fill-color-lighter) !important; }
:deep(.off-row > td .cell) { color: var(--el-text-color-placeholder); }
</style>

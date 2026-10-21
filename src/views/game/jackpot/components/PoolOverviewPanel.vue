<template>
  <div class="jackpot-panel">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="游戏编码">
          <el-input v-model="query.gameCode" placeholder="如 kts_ / vgmn_206" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="池层级">
          <el-input v-model="query.jackpotType" placeholder="如 GRAND / MINI" clearable style="width: 170px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="table-heading">
          <h3>奖池台账（slot_jackpot_pool）</h3>
          <span class="tip">
            口径：池值 = 初始值 + 本轮累积；初始值由平台写入且永不派出，只能在此改（改完 slot 侧同步 DB + Redis 并写审计）；
            本轮累积达必爆点即必爆，派奖后累积清零。「层级参数」取 slot 侧 Redis 实时快照（门槛/上限/期望倍数/份额）。
            注：lobby 侧（199/202/206/98/99/89/101）仍是旧口径「派整池 + 回落 base」，其池值不满足该等式属已知待对齐项
          </span>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="游戏" align="center" min-width="180" show-overflow-tooltip fixed>
          <template #default="{ row }">
            <div class="font-mono">{{ row.gameCode }}</div>
            <div v-if="row.gameName" class="sub">{{ row.gameName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="池层级" align="center" prop="jackpotType" width="130" fixed />
        <el-table-column label="初始值" align="right" width="140">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.initialAmount) }}</span></template>
        </el-table-column>
        <el-table-column label="本轮累积" align="right" width="140">
          <template #default="{ row }"><span class="font-mono text-warn">{{ amount(row.cycleAccumulated) }}</span></template>
        </el-table-column>
        <el-table-column label="当前池值" align="right" width="150">
          <template #default="{ row }"><b class="font-mono text-income">{{ amount(row.currentAmount) }}</b></template>
        </el-table-column>
        <el-table-column label="本轮必爆点" align="right" width="140">
          <template #default="{ row }">
            <span class="font-mono">{{ Number(row.armedTarget) > 0 ? amount(row.armedTarget) : '未武装' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="水位进度" align="right" width="110">
          <template #default="{ row }">{{ progress(row.cycleAccumulated, row.armedTarget) }}</template>
        </el-table-column>
        <el-table-column label="注资比例" align="right" width="100">
          <template #default="{ row }">{{ pct(row.contributionRate) }}</template>
        </el-table-column>
        <el-table-column label="累计爆奖" align="center" prop="totalTriggeredCount" width="100" />
        <el-table-column label="累计注资" align="right" width="140">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.totalContributed) }}</span></template>
        </el-table-column>
        <el-table-column label="上次爆奖" align="center" min-width="230" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.lastTriggeredAt">
              <div>{{ time(row.lastTriggeredAt) }}</div>
              <div class="sub">UID {{ row.lastTriggeredBy || '—' }} / {{ amount(row.lastTriggeredAmount) }}</div>
            </template>
            <span v-else class="sub">—</span>
          </template>
        </el-table-column>
        <el-table-column label="落盘时间" align="center" width="170">
          <template #default="{ row }">{{ time(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="口径校验" align="center" width="110">
          <template #default="{ row }">
            <el-tooltip
              v-if="invariantBroken(row)"
              content="不满足「当前池值 = 初始值 + 本轮累积」：多见于 lobby 旧口径池或初始值回填与池值不一致的行，请人工核对后再改初始值"
              placement="top"
            >
              <el-tag type="warning" size="small">待核对</el-tag>
            </el-tooltip>
            <el-tag v-else type="success" size="small">一致</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:jackpot:edit']" link type="primary" @click="openConfigDialog(row)">
              奖池配置
            </el-button>
            <el-button v-hasPermi="['game:jackpot:list']" link type="primary" @click="openParamDialog(row)">层级参数</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!--
      奖池配置：运营手动配置该层池的参数并让游戏生效。
      可配项严格按设计文档 §3.6「配置只允许调 K_* 与 p_i」：门槛/上限/命中率；初始值一并在此改。
      三态语义：留空 = 不改；填 0 = 清除覆盖（恢复代码默认）；填 >0 = 设为该值。
    -->
    <el-dialog
      v-model="config.visible"
      :title="`奖池配置 - ${config.gameCode} ${config.gameName} / ${config.jackpotType}`"
      width="760px"
      append-to-body
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="保存后由 slot 侧写入 DB 并清闸门标定缓存，下一局判定即按新参数运行（无需重启、无需发版）；变更原因必填，逐字段写入参数变更审计。"
      />
      <el-form label-width="150px" style="margin-top: 12px">
        <el-form-item label="初始值（VND）">
          <el-input-number v-model="config.initialAmount" :min="0" :step="100000" controls-position="right" style="width: 240px" />
          <span class="hint">永不出池，只做展示下限与池值下限</span>
        </el-form-item>
        <el-form-item label="门槛 K_low（VND）">
          <el-input-number v-model="config.gateLow" :min="0" :step="100000" controls-position="right" style="width: 240px" />
          <el-button link type="primary" @click="config.gateLow = 0">清除覆盖</el-button>
          <div class="hint">
            当前生效 {{ amount(config.effectiveLow) }}（代码默认 {{ amount(config.gateLowDefault) }}）；
            允许 {{ amount(config.gateLowMin) }} ~ {{ amount(config.gateLowMax) }}；本轮累积达门槛才进入可触发区
          </div>
        </el-form-item>
        <el-form-item label="上限 K_high（VND）">
          <el-input-number v-model="config.gateHigh" :min="0" :step="100000" controls-position="right" style="width: 240px" />
          <el-button link type="primary" @click="config.gateHigh = 0">清除覆盖</el-button>
          <div class="hint">
            当前生效 {{ amount(config.effectiveHigh) }}（代码默认 {{ amount(config.gateHighDefault) }}）；
            允许 {{ amount(config.gateHighMin) }} ~ {{ amount(config.gateHighMax) }}；
            即本周期必爆点 T 的抽签上界（单池资金暴露硬上限）
          </div>
        </el-form-item>
        <el-form-item label="目标命中率 p">
          <el-input-number
            v-model="config.hitRate"
            :min="0"
            :max="0.5"
            :step="0.000001"
            :precision="8"
            :disabled="!config.hitRateConfigurable"
            controls-position="right"
            style="width: 240px"
          />
          <el-button v-if="config.hitRateConfigurable" link type="primary" @click="config.hitRate = 0">清除覆盖</el-button>
          <div class="hint">
            <template v-if="config.hitRateConfigurable">
              代码默认 {{ config.hitRateDefault }}；允许 {{ config.hitRateMin }} ~ {{ config.hitRateMax }}；
              期望派奖倍数 M = 注资比例 × 份额 ÷ p（当前 M ≈ {{ config.effectiveMultiple }}）
            </template>
            <template v-else>该层未在代码里声明目标命中率（M 由池底种子推导），不支持覆盖</template>
          </div>
        </el-form-item>
        <el-form-item label="变更原因" required>
          <el-input v-model="config.reason" type="textarea" :rows="2" placeholder="如：按运营节奏下调门槛，让奖池更早进入可触发区" />
        </el-form-item>
        <el-form-item label="填写说明">
          <span class="hint">留空 = 本次不改动该字段；填 0 = 清除覆盖、恢复代码默认值；填 &gt;0 = 设为该值。</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="config.loading" @click="submitConfig">确 认</el-button>
        <el-button @click="config.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="paramDialog.visible" :title="`层级参数（含运营覆盖） - ${paramDialog.gameCode}`" width="1100px" append-to-body>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="数据来源：slot 侧 Redis 实时快照（Dubbo）。「当前生效」= 叠加运营覆盖后的值；「代码默认」= GameConfig 推导值；门槛未达不参与判定，累积达上限必爆（本档总注 × 上限倍数）。"
      />
      <!-- 每档规则总览：档位 → 池的性质分布（进度池/固定奖/保留档位/展示池），回答"这一档到底打哪些池" -->
      <el-table v-if="paramTierSummary.length" border size="small" :data="paramTierSummary" style="margin-top: 12px">
        <el-table-column label="投注档位" align="center" width="100">
          <template #default="{ row }">档 {{ row.tier }}</template>
        </el-table-column>
        <el-table-column label="本档总注（门槛/倍数标尺）" align="right" min-width="200">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.tierTotalBet) }}</span></template>
        </el-table-column>
        <el-table-column label="层级数" align="center" width="90" prop="levels" />
        <el-table-column label="池构成" align="left" min-width="300">
          <template #default="{ row }">
            <el-tag v-if="row.progressive" type="success" size="small" class="mr-1">进度池 {{ row.progressive }}</el-tag>
            <el-tag v-if="row.fixed" type="warning" size="small" class="mr-1">固定奖 {{ row.fixed }}</el-tag>
            <el-tag v-if="row.reserved" type="info" size="small" class="mr-1">保留档位 {{ row.reserved }}</el-tag>
            <el-tag v-if="row.display" type="info" size="small" class="mr-1" effect="plain">展示池 {{ row.display }}</el-tag>
            <span v-if="!row.progressive && !row.fixed && !row.reserved && !row.display">—</span>
          </template>
        </el-table-column>
        <el-table-column label="份额合计" align="right" width="120">
          <template #default="{ row }">{{ pct(row.shareSum) }}</template>
        </el-table-column>
      </el-table>
      <el-alert v-if="paramDialog.rows[0]?.source === 'DB'" type="warning" :closable="false" show-icon
                style="margin-top: 10px"
                title="该游戏不是 slot 注册游戏，当前展示 slot_jackpot_pool 的只读落盘快照，不支持在线修改。" />
      <el-table v-loading="paramDialog.loading" border size="small" :data="paramDialog.rows" style="margin-top: 12px">
        <el-table-column label="层级序号" align="center" prop="level" width="90" />
        <el-table-column label="池层级" align="center" prop="jackpotType" width="120" />
        <!-- 型态：进度池 / 固定奖 / 保留档位 / 展示池（决定该层是否注资、是否参与闸门判定） -->
        <el-table-column label="型态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="natureMeta(row.nature).type" size="small">{{ natureMeta(row.nature).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="展示KEY" align="center" prop="jackpotKey" width="110" />
        <el-table-column label="投注档位" align="center" prop="tier" width="90" />
        <el-table-column label="本档总注" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.tierTotalBet) }}</span></template>
        </el-table-column>
        <el-table-column label="注资份额" align="right" width="100">
          <template #default="{ row }">{{ pct(row.share) }}</template>
        </el-table-column>
        <el-table-column label="初始值" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.initialAmount) }}</span></template>
        </el-table-column>
        <el-table-column label="本轮累积" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.cycleAccumulated) }}</span></template>
        </el-table-column>
        <el-table-column label="当前池值" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.currentAmount) }}</span></template>
        </el-table-column>
        <el-table-column label="必爆点" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.armedTarget) }}</span></template>
        </el-table-column>
        <el-table-column label="门槛（生效/默认）" align="right" width="180">
          <template #default="{ row }">
            <span class="font-mono">{{ amount(row.gateLowAmount) }}</span>
            <span class="sub"> / {{ amount(row.gateLowDefault) }}</span>
            <el-tag v-if="row.gateLowOverride != null" type="warning" size="small" class="ml-1">已覆盖</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上限（生效/默认）" align="right" width="180">
          <template #default="{ row }">
            <span class="font-mono">{{ amount(row.gateHighAmount) }}</span>
            <span class="sub"> / {{ amount(row.gateHighDefault) }}</span>
            <el-tag v-if="row.gateHighOverride != null" type="warning" size="small" class="ml-1">已覆盖</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="命中率（生效/默认）" align="right" width="170">
          <template #default="{ row }">
            <span v-if="row.hitRateDefault > 0 || row.hitRateOverride != null">
              {{ row.hitRateOverride != null ? row.hitRateOverride : row.hitRateDefault }}
            </span>
            <span v-else>—</span>
            <el-tag v-if="row.hitRateOverride != null" type="warning" size="small" class="ml-1">已覆盖</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="期望倍数" align="right" width="100">
          <template #default="{ row }">{{ row.expectedMultiple ?? '—' }}</template>
        </el-table-column>
      </el-table>
      <div v-if="!paramDialog.loading && !paramDialog.rows.length" class="empty-tip">
        该游戏没有返回奖池层级参数——可能未接入奖池内核（slot 未注册该 game_code），请确认游戏编码是否正确。
      </div>
      <template #footer><el-button @click="paramDialog.visible = false">关 闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getJackpotPoolConfigs, listJackpotPools, updateJackpotPoolParams } from '@/api/game/jackpot';
import type { JackpotPoolConfigRow, JackpotPoolOverviewVO } from '@/api/game/jackpot/types';
import { amount, pct, progress, time } from '../format';

defineOptions({ name: 'JackpotPoolOverviewPanel' });

const loading = ref(false);
const rows = ref<JackpotPoolOverviewVO[]>([]);
const total = ref(0);
const query = reactive<any>({ pageNum: 1, pageSize: 10, gameCode: undefined, jackpotType: undefined });

/**
 * 奖池配置弹窗状态。
 *
 * gateLow / gateHigh / hitRate 的 null 是有语义的：null = 本次不改动该字段（后端三态语义），
 * 因此**不能**把它们初始化成 0——0 表示「清除覆盖、恢复代码默认值」。
 */
const config = reactive<any>({
  visible: false,
  loading: false,
  gameCode: '',
  gameName: '',
  jackpotType: '',
  initialAmount: 0,
  gateLow: null,
  gateHigh: null,
  hitRate: null,
  reason: '',
  gateLowDefault: 0,
  gateHighDefault: 0,
  gateLowMin: 0,
  gateLowMax: 0,
  gateHighMin: 0,
  gateHighMax: 0,
  hitRateDefault: 0,
  hitRateMin: 0,
  hitRateMax: 0,
  hitRateConfigurable: false,
  effectiveLow: 0,
  effectiveHigh: 0,
  effectiveMultiple: 0
});

/**
 * 池值恒等式校验（当前池值 = 初始值 + 本轮累积）。
 *
 * 为什么放进列表：这是改制后奖池的硬不变量，也是「派奖只派累积、初始值永不派出」的可读证据；
 * 一旦不成立（lobby 旧口径池、或初始值被人为改到高于池值造成倒挂），运营必须人工核对后再动手改初始值。
 */
function invariantBroken(row: JackpotPoolOverviewVO) {
  const current = Number(row.currentAmount ?? 0);
  const initial = Number(row.initialAmount ?? 0);
  const cycle = Number(row.cycleAccumulated ?? 0);
  return Math.abs(current - (initial + cycle)) > 0.009;
}

const paramDialog = reactive<{ visible: boolean; loading: boolean; gameCode: string; rows: JackpotPoolConfigRow[] }>({
  visible: false,
  loading: false,
  gameCode: '',
  rows: []
});

/** 取某层的实时参数快照行（含代码默认值 / 允许窗口 / 当前生效值 / 已有覆盖值） */
async function fetchConfigRow(gameCode: string, jackpotType: string): Promise<JackpotPoolConfigRow | undefined> {
  const res: any = await getJackpotPoolConfigs(gameCode);
  const list: JackpotPoolConfigRow[] = res.data ?? [];
  return list.find((item) => item.jackpotType === jackpotType);
}

async function getList() {
  loading.value = true;
  try {
    const res: any = await listJackpotPools(query);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  query.pageNum = 1;
  getList();
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, gameCode: undefined, jackpotType: undefined });
  getList();
}

/**
 * 打开「奖池配置」：先取该层实时快照回填默认值/允许窗口，
 * 覆盖值只在**已覆盖**时回填——未覆盖的字段留空，避免把当前默认值顺手固化成覆盖
 * （固化后代码侧默认值再调整就再也生不了效）。
 */
async function openConfigDialog(row: JackpotPoolOverviewVO) {
  Object.assign(config, {
    visible: true,
    loading: false,
    gameCode: row.gameCode || '',
    gameName: row.gameName || '',
    jackpotType: row.jackpotType || '',
    initialAmount: row.initialAmount ?? 0,
    gateLow: null,
    gateHigh: null,
    hitRate: null,
    reason: '',
    gateLowDefault: 0,
    gateHighDefault: 0,
    gateLowMin: 0,
    gateLowMax: 0,
    gateHighMin: 0,
    gateHighMax: 0,
    hitRateDefault: 0,
    hitRateMin: 0,
    hitRateMax: 0,
    hitRateConfigurable: false,
    effectiveLow: row.currentAmount ?? 0,
    effectiveHigh: 0,
    effectiveMultiple: 0
  });
  const snapshot = await fetchConfigRow(config.gameCode, config.jackpotType);
  if (!snapshot) {
    ElMessage.warning('未取到该层实时参数（slot 未注册该游戏？），保存仍会由服务端校验允许范围');
    return;
  }
  Object.assign(config, {
    initialAmount: snapshot.initialAmount ?? config.initialAmount,
    gateLow: snapshot.gateLowOverride ?? null,
    gateHigh: snapshot.gateHighOverride ?? null,
    hitRate: snapshot.hitRateOverride ?? null,
    gateLowDefault: snapshot.gateLowDefault ?? 0,
    gateHighDefault: snapshot.gateHighDefault ?? 0,
    gateLowMin: snapshot.gateLowMin ?? 0,
    gateLowMax: snapshot.gateLowMax ?? 0,
    gateHighMin: snapshot.gateHighMin ?? 0,
    gateHighMax: snapshot.gateHighMax ?? 0,
    hitRateDefault: snapshot.hitRateDefault ?? 0,
    hitRateMin: snapshot.hitRateMin ?? 0,
    hitRateMax: snapshot.hitRateMax ?? 0,
    hitRateConfigurable: snapshot.hitRateConfigurable === true,
    effectiveLow: snapshot.gateLowAmount ?? 0,
    effectiveHigh: snapshot.gateHighAmount ?? 0,
    effectiveMultiple: snapshot.expectedMultiple ?? 0
  });
}

/** 提交奖池配置：null = 不改、0 = 清除覆盖、>0 = 设为该值（与后端三态一致） */
async function submitConfig() {
  if (!config.reason || !String(config.reason).trim()) {
    ElMessage.warning('变更原因必填（审计要求）');
    return;
  }
  config.loading = true;
  try {
    await updateJackpotPoolParams({
      gameCode: config.gameCode,
      jackpotType: config.jackpotType,
      gateLow: config.gateLow,
      gateHigh: config.gateHigh,
      hitRate: config.hitRate,
      initialAmount: config.initialAmount,
      reason: String(config.reason).trim()
    });
    ElMessage.success('已保存：slot 侧写库并清标定缓存，下一局判定即按新参数运行');
    config.visible = false;
    getList();
  } finally {
    config.loading = false;
  }
}

/** 打开「层级参数」抽屉（含运营覆盖与代码默认对照） */
async function openParamDialog(row: JackpotPoolOverviewVO) {
  paramDialog.visible = true;
  paramDialog.loading = true;
  paramDialog.gameCode = row.gameCode || '';
  paramDialog.rows = [];
  try {
    const res: any = await getJackpotPoolConfigs(row.gameCode || '');
    // 按「档位 → 层级」排序，让同档的 2~4 个等级相邻，便于逐档核对份额与门槛
    const list: JackpotPoolConfigRow[] = res.data ?? [];
    paramDialog.rows = list.toSorted((a, b) => (a.tier ?? 0) - (b.tier ?? 0) || (a.level ?? 0) - (b.level ?? 0));
  } finally {
    paramDialog.loading = false;
  }
}

/**
 * 池性质 → 展示标签与颜色。
 *
 * 为什么要在前端显式映射而不是直接显示英文枚举：运营要一眼区分"这层会不会涨、会不会爆"，
 * 而四种性质的行为差异很大（见 `api/game/jackpot/types.ts` 的 nature 说明）。
 */
const NATURE_META: Record<string, { label: string; type: 'primary' | 'success' | 'info' | 'warning' | 'danger' }> = {
  PROGRESSIVE: { label: '进度池', type: 'success' },
  FIXED: { label: '固定奖', type: 'warning' },
  RESERVED: { label: '保留档位', type: 'info' },
  DISPLAY: { label: '展示池', type: 'info' }
};

function natureMeta(nature?: string) {
  return NATURE_META[nature || 'DISPLAY'] ?? { label: nature || '未知', type: 'info' as const };
}

/**
 * 每档小计（档位 → 本档总注 / 层级数 / 池构成 / 份额合计）。
 *
 * 为什么需要：逐层表能看"某一层什么参数"，但"这一档到底打哪些池、份额够不够 1"必须按档汇总才看得出——
 * Σ份额 ≠ 1 或某档全是固定奖层（等于该档没有进度池）就是配置事故。
 */
const paramTierSummary = computed(() => {
  const map = new Map<
    number,
    { tier: number; tierTotalBet: number; levels: number; progressive: number; fixed: number; reserved: number; display: number; shareSum: number }
  >();
  for (const row of paramDialog.rows) {
    const tier = row.tier ?? 0;
    const item =
      map.get(tier) ??
      { tier, tierTotalBet: row.tierTotalBet ?? 0, levels: 0, progressive: 0, fixed: 0, reserved: 0, display: 0, shareSum: 0 };
    item.levels += 1;
    item.tierTotalBet = item.tierTotalBet || row.tierTotalBet || 0;
    item.shareSum += row.share ?? 0;
    const nature = row.nature || 'DISPLAY';
    if (nature === 'PROGRESSIVE') item.progressive += 1;
    else if (nature === 'FIXED') item.fixed += 1;
    else if (nature === 'RESERVED') item.reserved += 1;
    else item.display += 1;
    map.set(tier, item);
  }
  return [...map.values()].toSorted((a, b) => a.tier - b.tier);
});

onMounted(getList);
</script>

<style scoped>
.table-heading h3 {
  margin: 0 0 4px;
  font-size: 15px;
}
.tip {
  color: #909399;
  font-size: 12px;
}
.sub {
  color: #909399;
  font-size: 12px;
}
.text-income {
  color: #16a34a;
}
.text-warn {
  color: #e6a23c;
}
.empty-tip {
  padding: 12px 4px 0;
  color: #909399;
  font-size: 12px;
}
.hint {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
</style>

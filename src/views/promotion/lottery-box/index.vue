<template>
  <div class="p-2 app-container promotion-lottery-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>盲盒抽奖</h3>
            <p>盲盒设置 / 盲盒抽奖活动 / 会员盲盒记录 / 中奖记录 / 实物订单；奖池概率总和不得超过 100%。</p>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="盲盒设置" name="setting" />
        <el-tab-pane label="盲盒抽奖" name="config" />
        <el-tab-pane label="盲盒记录" name="record" />
        <el-tab-pane label="中奖记录" name="win" />
        <el-tab-pane label="实物订单" name="order" />
      </el-tabs>

      <!-- 公共设置 -->
      <template v-if="activeTab === 'setting'">
        <el-form v-loading="setting.loading" label-width="200px" class="config-form">
          <el-form-item label="盲盒功能总开关">
            <el-switch v-model="setting.values.box_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="每日抽奖次数上限(0=不限)">
            <el-input-number v-model="setting.values.box_daily_limit" :min="0" :controls="false" style="width: 200px" />
          </el-form-item>
          <el-form-item label="消耗方式">
            <el-select v-model="setting.values.box_cost_type" style="width: 220px">
              <el-option label="免费" value="FREE" />
              <el-option label="金币" value="COIN" />
              <el-option label="幸运值" value="LUCKY" />
            </el-select>
          </el-form-item>
          <el-form-item label="单次消耗数量">
            <el-input-number v-model="setting.values.box_cost_amount" :min="0" :controls="false" style="width: 200px" />
          </el-form-item>
          <el-form-item label="客户端展示中奖记录">
            <el-switch v-model="setting.values.box_show_record" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="活动规则文案">
            <el-input v-model="setting.values.box_rule_desc" type="textarea" :rows="3" style="width: 480px" />
          </el-form-item>
          <el-form-item>
            <el-button v-hasPermi="['promotion:config:edit']" type="primary" :loading="setting.saving" @click="saveSetting">保存设置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <!-- 盲盒抽奖活动 -->
      <template v-else-if="activeTab === 'config'">
        <el-form inline class="query-bar">
          <el-form-item label="活动名称">
            <el-input v-model="query.keyword" placeholder="请输入活动名称" clearable style="width: 180px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="toolbar-line">
          <el-button v-hasPermi="['promotion:lottery:edit']" type="primary" icon="Plus" @click="openConfigForm()">新增盲盒活动</el-button>
        </div>
        <el-table v-loading="loading" border :data="configRows">
          <el-table-column label="活动ID" prop="configId" align="center" width="100" />
          <el-table-column label="活动名称" prop="configName" min-width="180" show-overflow-tooltip />
          <el-table-column label="币种" prop="currency" align="center" width="100" />
          <el-table-column label="消耗方式" align="center" width="120">
            <template #default="{ row }">{{ costTypeText(row.costType) }}</template>
          </el-table-column>
          <el-table-column label="单次消耗" prop="costAmount" align="right" width="110" />
          <el-table-column label="每日上限" align="center" width="110">
            <template #default="{ row }">{{ Number(row.dailyLimit ?? 0) > 0 ? row.dailyLimit : '不限' }}</template>
          </el-table-column>
          <el-table-column label="奖品数" prop="prizeCount" align="right" width="100" />
          <el-table-column label="剩余库存" prop="totalStock" align="right" width="110" />
          <el-table-column label="抽奖次数" prop="recordCount" align="right" width="110" />
          <el-table-column label="活动时间" align="center" width="180">
            <template #default="{ row }">
              <div>{{ row.startAt || '--' }}</div>
              <div>{{ row.endAt || '--' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" :active-value="1" :inactive-value="0" @change="(val: number) => toggleConfig(row as PromoLotteryConfigVO, val)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="180" fixed="right">
            <template #default="{ row }">
              <el-button v-hasPermi="['promotion:lottery:edit']" link type="primary" @click="openConfigForm(row as PromoLotteryConfigVO)">修改</el-button>
              <el-button link type="primary" @click="openPrizeDialog(row as PromoLotteryConfigVO)">奖池管理</el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadRows" />
      </template>

      <!-- 抽奖记录 / 中奖记录 -->
      <template v-else-if="activeTab === 'record' || activeTab === 'win'">
        <el-form inline class="query-bar">
          <el-form-item label="会员账号">
            <el-input v-model="query.account" placeholder="请输入会员账号" clearable style="width: 170px" />
          </el-form-item>
          <el-form-item label="奖品类型">
            <el-select v-model="query.prizeType" placeholder="全部" clearable style="width: 150px">
              <el-option label="金币" :value="1" />
              <el-option label="奖金" :value="2" />
              <el-option label="实物" :value="3" />
              <el-option label="幸运值" :value="4" />
              <el-option label="空奖" :value="5" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              value-format="YYYY-MM-DD HH:mm:ss"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 360px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" border :data="recordRows">
          <el-table-column label="记录ID" prop="recordId" align="center" width="110" />
          <el-table-column label="活动ID" prop="configId" align="center" width="100" />
          <el-table-column label="活动名称" prop="configName" min-width="160" show-overflow-tooltip />
          <el-table-column label="会员ID" prop="uid" align="center" width="130" />
          <el-table-column label="会员账号" prop="account" align="center" width="150" />
          <el-table-column label="奖品名称" prop="prizeName" align="center" width="140" show-overflow-tooltip />
          <el-table-column label="奖品类型" align="center" width="110">
            <template #default="{ row }">{{ prizeTypeText(row.prizeType) }}</template>
          </el-table-column>
          <el-table-column label="奖品价值" align="right" width="120">
            <template #default="{ row }">{{ fmtMoney(row.prizeValue) }}</template>
          </el-table-column>
          <el-table-column label="消耗" align="right" width="110">
            <template #default="{ row }">{{ row.costAmount ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="是否中奖" align="center" width="110">
            <template #default="{ row }">
              <el-tag :type="row.isWin === 1 ? 'success' : 'info'">{{ row.isWin === 1 ? '中奖' : '未中奖' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="抽奖时间" prop="createdAt" align="center" width="170" />
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadRows" />
      </template>

      <!-- 实物订单 -->
      <template v-else>
        <el-form inline class="query-bar">
          <el-form-item label="会员账号">
            <el-input v-model="query.account" placeholder="请输入会员账号" clearable style="width: 170px" />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 150px">
              <el-option label="待发货" :value="1" />
              <el-option label="已发货" :value="2" />
              <el-option label="已签收" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" border :data="orderRows">
          <el-table-column label="订单号" prop="orderNo" align="center" width="200" show-overflow-tooltip />
          <el-table-column label="会员账号" prop="account" align="center" width="140" />
          <el-table-column label="奖品名称" prop="prizeName" align="center" width="150" show-overflow-tooltip />
          <el-table-column label="收货人" prop="receiverName" align="center" width="120" />
          <el-table-column label="收货电话" prop="receiverPhone" align="center" width="140" />
          <el-table-column label="收货地址" prop="receiverAddress" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" align="center" width="110">
            <template #default="{ row }">
              <el-tag :type="orderStatusTag(row.status)">{{ orderStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="快递公司" prop="expressCompany" align="center" width="130" />
          <el-table-column label="快递单号" prop="expressNo" align="center" width="170" />
          <el-table-column label="发货时间" prop="shipAt" align="center" width="170" />
          <el-table-column label="操作" align="center" width="120" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" v-hasPermi="['promotion:lottery:edit']" link type="primary" @click="openShip(row as PromoPhysicalOrderVO)">发货</el-button>
              <span v-else>--</span>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadRows" />
      </template>
    </el-card>

    <!-- 活动表单 -->
    <el-dialog v-model="configDialog.visible" :title="configDialog.title" width="680px" append-to-body destroy-on-close>
      <el-form ref="configFormRef" :model="configForm" :rules="configRules" label-width="160px">
        <el-form-item label="活动名称" prop="configName">
          <el-input v-model="configForm.configName" maxlength="100" />
        </el-form-item>
        <el-form-item label="币种" prop="currency">
          <el-select v-model="configForm.currency" style="width: 200px">
            <el-option label="VND" value="VND" />
            <el-option label="USDT" value="USDT" />
            <el-option label="THB" value="THB" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="configTime"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="消耗方式">
          <el-select v-model="configForm.costType" style="width: 200px">
            <el-option label="免费" :value="1" />
            <el-option label="金币" :value="2" />
            <el-option label="幸运值" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="单次消耗数量">
          <el-input-number v-model="configForm.costAmount" :min="0" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="每日次数上限(0=不限)">
          <el-input-number v-model="configForm.dailyLimit" :min="0" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="封面图URL">
          <el-input v-model="configForm.coverImage" />
        </el-form-item>
        <el-form-item label="活动规则">
          <el-input v-model="configForm.ruleDesc" type="textarea" :rows="3" maxlength="500" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="configForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitConfig">确认</el-button>
        <el-button @click="configDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 奖池管理 -->
    <el-dialog v-model="prizeDialog.visible" title="奖池管理（概率总和不得超过 100%）" width="900px" append-to-body destroy-on-close>
      <div class="toolbar-line">
        <el-button v-hasPermi="['promotion:lottery:edit']" type="primary" icon="Plus" @click="openPrizeForm()">新增奖品</el-button>
        <span class="selected-tip">当前概率合计：{{ (probabilitySum * 100).toFixed(2) }}%</span>
      </div>
      <el-table v-loading="prizeDialog.loading" border :data="prizeRows">
        <el-table-column label="奖品名称" prop="prizeName" min-width="150" show-overflow-tooltip />
        <el-table-column label="类型" align="center" width="110">
          <template #default="{ row }">{{ prizeTypeText(row.prizeType) }}</template>
        </el-table-column>
        <el-table-column label="价值(分)" align="right" width="120">
          <template #default="{ row }">{{ fmtMoney(row.prizeValue) }}</template>
        </el-table-column>
        <el-table-column label="概率" align="right" width="110">
          <template #default="{ row }">{{ (Number(row.probability ?? 0) * 100).toFixed(2) }}%</template>
        </el-table-column>
        <el-table-column label="库存" align="center" width="100">
          <template #default="{ row }">{{ Number(row.stock) < 0 ? '不限' : row.stock }}</template>
        </el-table-column>
        <el-table-column label="已发放" prop="sentCount" align="right" width="100" />
        <el-table-column label="已中奖次数" prop="winCount" align="right" width="120" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 1 ? 'success' : 'info'">{{ row.enabled === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150">
          <template #default="{ row }">
            <el-button v-hasPermi="['promotion:lottery:edit']" link type="primary" @click="openPrizeForm(row as PromoLotteryPrizeVO)">修改</el-button>
            <el-button v-hasPermi="['promotion:lottery:edit']" link type="danger" @click="removePrize(row as PromoLotteryPrizeVO)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 奖品表单 -->
    <el-dialog v-model="prizeFormDialog.visible" :title="prizeFormDialog.title" width="620px" append-to-body destroy-on-close>
      <el-form ref="prizeFormRef" :model="prizeForm" :rules="prizeRules" label-width="150px">
        <el-form-item label="奖品名称" prop="prizeName">
          <el-input v-model="prizeForm.prizeName" maxlength="100" />
        </el-form-item>
        <el-form-item label="奖品类型" prop="prizeType">
          <el-select v-model="prizeForm.prizeType" style="width: 220px">
            <el-option label="金币" :value="1" />
            <el-option label="奖金" :value="2" />
            <el-option label="实物" :value="3" />
            <el-option label="幸运值" :value="4" />
            <el-option label="空奖" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖品价值(分)">
          <el-input-number v-model="prizeForm.prizeValue" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="中奖概率(0~1)">
          <el-input-number v-model="prizeForm.probability" :min="0" :max="1" :precision="6" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="库存(-1=不限)">
          <el-input-number v-model="prizeForm.stock" :min="-1" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="奖品图片URL">
          <el-input v-model="prizeForm.prizeImage" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="prizeForm.sortOrder" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="prizeForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitPrize">确认</el-button>
        <el-button @click="prizeFormDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 发货 -->
    <el-dialog v-model="shipDialog.visible" title="实物订单发货" width="560px" append-to-body destroy-on-close>
      <el-form ref="shipFormRef" :model="shipForm" :rules="shipRules" label-width="130px">
        <el-form-item label="订单号">
          <span>{{ shipForm.orderNo }}</span>
        </el-form-item>
        <el-form-item label="快递公司" prop="expressCompany">
          <el-input v-model="shipForm.expressCompany" maxlength="64" />
        </el-form-item>
        <el-form-item label="快递单号" prop="expressNo">
          <el-input v-model="shipForm.expressNo" maxlength="64" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="shipForm.remark" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitShip">确认发货</el-button>
        <el-button @click="shipDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PromotionLotteryBox" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  deletePromoLotteryPrize,
  listPromoLotteryConfig,
  listPromoLotteryPrize,
  listPromoLotteryRecord,
  listPromoPhysicalOrder,
  savePromoLotteryConfig,
  savePromoLotteryPrize,
  shipPromoPhysicalOrder,
  togglePromoLotteryConfig
} from '@/api/promotion/lottery';
import type { PromoLotteryConfigVO, PromoLotteryPrizeVO, PromoLotteryQuery, PromoPhysicalOrderVO } from '@/api/promotion/lottery/types';
import { usePromoKvConfig } from '@/views/promotion/components/usePromoKvConfig';

/**
 * 盲盒抽奖页（需求文档 03）。
 *
 * 设计要点：
 *   ① 抽奖活动、记录、中奖记录、实物订单四类数据都以 lotteryType=1 过滤，避免与幸运转盘串数据；
 *   ② 奖池概率合计在前端展示、在后端强校验（概率和 > 1 直接拒绝保存），防止概率配置越界；
 *   ③ 实物订单只允许「待发货 → 已发货」，由后端 SQL 的前置状态条件保证。
 */
type Row = Record<string, any>;

const LOTTERY_TYPE = 1;

const { loading, withLoading } = useLoading();
const { loading: saving, withLoading: withSaving } = useLoading();

const activeTab = ref('setting');
const configRows = ref<PromoLotteryConfigVO[]>([]);
const recordRows = ref<Row[]>([]);
const orderRows = ref<PromoPhysicalOrderVO[]>([]);
const total = ref(0);
const timeRange = ref<string[]>([]);
const query = reactive<PromoLotteryQuery & { pageNum: number; pageSize: number }>({ pageNum: 1, pageSize: 10, lotteryType: LOTTERY_TYPE });

const configFormRef = ref();
const configDialog = reactive({ visible: false, title: '' });
const configTime = ref<string[]>([]);
const configForm = reactive({
  configId: undefined as number | undefined,
  lotteryType: LOTTERY_TYPE,
  configName: '',
  currency: 'VND',
  startAt: undefined as string | undefined,
  endAt: undefined as string | undefined,
  costType: 1,
  costAmount: 0,
  dailyLimit: 0,
  coverImage: '',
  ruleDesc: '',
  enabled: 1
});

const configRules = {
  configName: [{ required: true, message: '活动名称不能为空', trigger: 'blur' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }]
};

const prizeDialog = reactive({ visible: false, loading: false, configId: 0 });
const prizeRows = ref<PromoLotteryPrizeVO[]>([]);
const prizeFormRef = ref();
const prizeFormDialog = reactive({ visible: false, title: '' });
const prizeForm = reactive({
  prizeId: undefined as number | undefined,
  configId: 0,
  prizeName: '',
  prizeType: 1,
  prizeValue: 0,
  prizeImage: '',
  probability: 0,
  stock: -1,
  sortOrder: 0,
  enabled: 1
});

const prizeRules = {
  prizeName: [{ required: true, message: '奖品名称不能为空', trigger: 'blur' }],
  prizeType: [{ required: true, message: '请选择奖品类型', trigger: 'change' }]
};

const shipDialog = reactive({ visible: false });
const shipFormRef = ref();
const shipForm = reactive({ orderId: 0, orderNo: '', expressCompany: '', expressNo: '', remark: '' });
const shipRules = {
  expressCompany: [{ required: true, message: '快递公司不能为空', trigger: 'blur' }],
  expressNo: [{ required: true, message: '快递单号不能为空', trigger: 'blur' }]
};

const setting = usePromoKvConfig('lottery-box', [
  { key: 'box_enabled', label: '盲盒功能总开关', type: 'switch' },
  { key: 'box_daily_limit', label: '每日抽奖次数上限', type: 'number' },
  { key: 'box_cost_type', label: '消耗方式', type: 'select' },
  { key: 'box_cost_amount', label: '单次消耗数量', type: 'number' },
  { key: 'box_show_record', label: '客户端展示中奖记录', type: 'switch' },
  { key: 'box_rule_desc', label: '活动规则文案', type: 'select' }
]);

const probabilitySum = computed(() => prizeRows.value.reduce((sum, item) => sum + Number(item.probability ?? 0), 0));

const fmtMoney = (value?: number) =>
  value === undefined || value === null ? '-' : (Number(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });

const costTypeText = (type?: number) => ({ 1: '免费', 2: '金币', 3: '幸运值' } as Record<number, string>)[type ?? -1] ?? '未知';

const prizeTypeText = (type?: number) =>
  ({ 1: '金币', 2: '奖金', 3: '实物', 4: '幸运值', 5: '空奖' } as Record<number, string>)[type ?? -1] ?? '未知';

const orderStatusText = (status?: number) => ({ 1: '待发货', 2: '已发货', 3: '已签收', 4: '已取消' } as Record<number, string>)[status ?? -1] ?? '未知';

const orderStatusTag = (status?: number) => (status === 1 ? 'warning' : status === 2 ? 'success' : 'info');

const loadRows = async () => {
  await withLoading(async () => {
    if (activeTab.value === 'config') {
      const res = (await listPromoLotteryConfig({ ...query, lotteryType: LOTTERY_TYPE })) as { rows?: PromoLotteryConfigVO[]; total?: number };
      configRows.value = res.rows ?? [];
      total.value = res.total ?? 0;
      return;
    }
    if (activeTab.value === 'record' || activeTab.value === 'win') {
      const res = (await listPromoLotteryRecord({
        ...query,
        lotteryType: LOTTERY_TYPE,
        isWin: activeTab.value === 'win' ? 1 : undefined,
        timeStart: timeRange.value?.[0],
        timeEnd: timeRange.value?.[1]
      })) as { rows?: Row[]; total?: number };
      recordRows.value = res.rows ?? [];
      total.value = res.total ?? 0;
      return;
    }
    const res = (await listPromoPhysicalOrder({ ...query, lotteryType: LOTTERY_TYPE })) as { rows?: PromoPhysicalOrderVO[]; total?: number };
    orderRows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const handleTabChange = async () => {
  query.pageNum = 1;
  rowsReset();
  if (activeTab.value === 'setting') {
    await setting.load();
    return;
  }
  await loadRows();
};

const rowsReset = () => {
  configRows.value = [];
  recordRows.value = [];
  orderRows.value = [];
  total.value = 0;
};

const handleSearch = () => {
  query.pageNum = 1;
  loadRows();
};

const handleReset = () => {
  Object.assign(query, { pageNum: 1, pageSize: 10, keyword: undefined, account: undefined, status: undefined, prizeType: undefined });
  timeRange.value = [];
  loadRows();
};

const openConfigForm = (row?: PromoLotteryConfigVO) => {
  configDialog.title = row ? '修改盲盒活动' : '新增盲盒活动';
  configDialog.visible = true;
  configTime.value = row?.startAt && row?.endAt ? [row.startAt, row.endAt] : [];
  Object.assign(configForm, {
    configId: row?.configId,
    lotteryType: LOTTERY_TYPE,
    configName: row?.configName ?? '',
    currency: row?.currency ?? 'VND',
    startAt: row?.startAt,
    endAt: row?.endAt,
    costType: row?.costType ?? 1,
    costAmount: row?.costAmount ?? 0,
    dailyLimit: row?.dailyLimit ?? 0,
    coverImage: row?.coverImage ?? '',
    ruleDesc: row?.ruleDesc ?? '',
    enabled: row?.enabled ?? 1
  });
};

const submitConfig = async () => {
  await configFormRef.value.validate();
  configForm.startAt = configTime.value?.[0];
  configForm.endAt = configTime.value?.[1];
  await withSaving(async () => {
    await savePromoLotteryConfig(configForm);
  });
  modal.msgSuccess('保存成功');
  configDialog.visible = false;
  await loadRows();
};

const toggleConfig = async (row: PromoLotteryConfigVO, enabled: number) => {
  await togglePromoLotteryConfig(row.configId, enabled);
  modal.msgSuccess(enabled === 1 ? '活动已启用' : '活动已停用');
  await loadRows();
};

const openPrizeDialog = async (row: PromoLotteryConfigVO) => {
  prizeDialog.visible = true;
  prizeDialog.configId = row.configId;
  prizeDialog.loading = true;
  try {
    const res = (await listPromoLotteryPrize(row.configId)) as { data?: PromoLotteryPrizeVO[] };
    prizeRows.value = res.data ?? [];
  } finally {
    prizeDialog.loading = false;
  }
};

const reloadPrizes = async () => {
  const res = (await listPromoLotteryPrize(prizeDialog.configId)) as { data?: PromoLotteryPrizeVO[] };
  prizeRows.value = res.data ?? [];
};

const openPrizeForm = (row?: PromoLotteryPrizeVO) => {
  prizeFormDialog.title = row ? '修改奖品' : '新增奖品';
  prizeFormDialog.visible = true;
  Object.assign(prizeForm, {
    prizeId: row?.prizeId,
    configId: prizeDialog.configId,
    prizeName: row?.prizeName ?? '',
    prizeType: row?.prizeType ?? 1,
    prizeValue: row?.prizeValue ?? 0,
    prizeImage: row?.prizeImage ?? '',
    probability: row?.probability ?? 0,
    stock: row?.stock ?? -1,
    sortOrder: row?.sortOrder ?? 0,
    enabled: row?.enabled ?? 1
  });
};

const submitPrize = async () => {
  await prizeFormRef.value.validate();
  await withSaving(async () => {
    await savePromoLotteryPrize({ ...prizeForm, configId: prizeDialog.configId });
  });
  modal.msgSuccess('保存成功');
  prizeFormDialog.visible = false;
  await reloadPrizes();
  await loadRows();
};

const removePrize = async (row: PromoLotteryPrizeVO) => {
  await modal.confirm(`确认删除奖品「${row.prizeName}」？已产生中奖记录的奖品会被拒绝删除。`);
  await deletePromoLotteryPrize(row.prizeId);
  modal.msgSuccess('删除成功');
  await reloadPrizes();
};

const openShip = (row: PromoPhysicalOrderVO) => {
  shipDialog.visible = true;
  Object.assign(shipForm, { orderId: row.orderId, orderNo: row.orderNo, expressCompany: '', expressNo: '', remark: '' });
};

const submitShip = async () => {
  await shipFormRef.value.validate();
  await withSaving(async () => {
    await shipPromoPhysicalOrder({
      orderId: shipForm.orderId,
      expressCompany: shipForm.expressCompany,
      expressNo: shipForm.expressNo,
      remark: shipForm.remark
    });
  });
  modal.msgSuccess('发货成功');
  shipDialog.visible = false;
  await loadRows();
};

const saveSetting = async () => {
  await setting.save();
  modal.msgSuccess('保存成功');
  await setting.load();
};

onMounted(async () => {
  await setting.load();
});
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.table-heading h3 {
  margin: 0 0 4px;
}

.table-heading p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.query-bar {
  margin-top: 8px;
}

.toolbar-line {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-tip {
  color: #909399;
  font-size: 12px;
}

.config-form {
  max-width: 900px;
  margin-top: 12px;
}
</style>

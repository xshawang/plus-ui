<template>
  <div class="cs-channel-config-panel">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="客服名称">
          <el-input v-model="query.csName" placeholder="客服名称" clearable style="width: 180px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="客服类型">
          <el-select v-model="query.csTypeCode" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="item in options.csTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开启状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="开启" :value="1" />
            <el-option label="关闭" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
          <el-button v-hasPermi="[editPerm]" type="primary" icon="Plus" @click="openCreate()">新增</el-button>
          <!-- 「客服代充-设置」原在 财务管理 → 充值设置 的左侧页签，按需求迁到本页签、紧跟「新增」之后 -->
          <el-button v-hasPermi="[editPerm]" icon="Setting" @click="openSettings">客服代充-设置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        配置说明：客服渠道面向会员展示「客服入口 + 收款方式 + 赠送气泡」，并按会员层级维护赠送比例；
        赠送比例在「代充审核 → 新建单据」选定客服渠道后自动带出赠送金额。
        <el-tag v-if="!options.bubbleEnabled" type="warning" size="small" class="ml-2">
          赠送气泡总开关已关闭，渠道气泡暂不生效
        </el-tag>
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>客服代充渠道配置</h3>
            <p>共 {{ total }} 条</p>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="客服类型" prop="csTypeLabel" align="center" width="110" />
        <el-table-column label="客服名称" prop="csName" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="联系账号" prop="contactAccount" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="充值类型" prop="rechargeTypeLabels" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="客服链接" align="left" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" :type="(row as CsChannelVO).linkMode === 'THIRD' ? 'warning' : 'success'">
              {{ (row as CsChannelVO).linkModeLabel }}
            </el-tag>
            <span v-if="(row as CsChannelVO).csLink" class="ml-2">{{ (row as CsChannelVO).csLink }}</span>
          </template>
        </el-table-column>
        <el-table-column label="会员层级" prop="levelName" align="center" width="120" />
        <el-table-column label="支持会员币种" prop="currencyLabels" align="left" min-width="200" show-overflow-tooltip />
        <el-table-column label="赠送气泡" align="center" width="150">
          <template #default="{ row }">
            <template v-if="(row as CsChannelVO).bubbleShow === 1">
              <el-tag size="small" :type="(row as CsChannelVO).bubbleEffective ? 'success' : 'info'">
                {{ colorLabel((row as CsChannelVO).bubbleColor) }}
              </el-tag>
              <span v-if="!(row as CsChannelVO).bubbleEffective" class="text-gray-400 ml-1 text-xs">总开关未开</span>
            </template>
            <span v-else class="text-gray-400">不显示</span>
          </template>
        </el-table-column>
        <el-table-column label="赠送比例" align="center" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!((row as CsChannelVO).giftRatios || []).length" class="text-gray-400">未配置</span>
            <span v-else>
              {{ ((row as CsChannelVO).giftRatios || []).map((r) => `${r.levelName || r.levelId} ${r.giftRate}%`).join(' / ') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="开启状态" align="center" width="110">
          <template #default="{ row }">
            <el-switch
              :model-value="(row as CsChannelVO).status === 1"
              v-hasPermi="[editPerm]"
              @change="(value: string | number | boolean) => toggleStatus(row as CsChannelVO, value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" align="left" min-width="130" show-overflow-tooltip />
        <el-table-column label="操作人" prop="operatorId" align="center" width="100" />
        <el-table-column label="操作时间" prop="updatedAt" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="操作" align="center" fixed="right" width="140">
          <template #default="{ row }">
            <el-button v-hasPermi="[editPerm]" link type="primary" @click="openEdit(row as CsChannelVO)">编辑</el-button>
            <el-button v-hasPermi="[editPerm]" link type="danger" @click="remove(row as CsChannelVO)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>

    <el-dialog v-model="dialogOpen" :title="form.configId ? '编辑客服充值' : '新增客服充值'" width="900px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="客服类型" prop="csTypeCode">
              <el-select v-model="form.csTypeCode" placeholder="请选择客服类型" style="width: 100%">
                <el-option v-for="item in options.csTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开启状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="0">关闭</el-radio>
                <el-radio :value="1">开启</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客服名称" prop="csName">
              <el-input v-model="form.csName" maxlength="50" show-word-limit placeholder="请输入客服名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支持会员币种" prop="currencyCodes">
              <el-select v-model="form.currencyCodes" multiple collapse-tags placeholder="请选择支持会员币种" style="width: 100%">
                <el-option
                  v-for="item in options.currencies"
                  :key="item.value"
                  :label="`${item.label}${item.ratio ? ' ' + item.ratio : ''}`"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系账号">
              <el-input v-model="form.contactAccount" maxlength="64" placeholder="请输入联系账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" maxlength="50" show-word-limit placeholder="请输入备注" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="充值类型">
              <el-checkbox-group v-model="form.rechargeTypes">
                <el-checkbox v-for="item in options.rechargeTypes" :key="item.value" :value="item.value">
                  {{ item.label }}
                </el-checkbox>
              </el-checkbox-group>
              <span class="text-gray-400 text-sm ml-2">仅用于展示与筛选，不联动支付通道</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="客服链接">
              <el-radio-group v-model="form.linkMode">
                <el-radio value="SELF">自有客服</el-radio>
                <el-radio value="THIRD">第三方客服</el-radio>
              </el-radio-group>
              <el-input
                v-model="form.csLink"
                maxlength="500"
                show-word-limit
                class="mt-2"
                placeholder="请输入客服个人链接"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员层级" prop="levelId">
              <el-select v-model="form.levelId" placeholder="请选择会员层级" style="width: 100%">
                <el-option
                  v-for="item in options.levels"
                  :key="item.value"
                  :label="item.label"
                  :value="Number(item.value)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">充值赠送</el-divider>
        <el-form-item label="赠送气泡">
          <el-radio-group v-model="form.bubbleShow" :disabled="!options.bubbleEnabled">
            <el-radio :value="0">不显示</el-radio>
            <el-radio :value="1">显示</el-radio>
          </el-radio-group>
          <span v-if="!options.bubbleEnabled" class="text-gray-400 text-sm ml-2">
            总开关已关闭，暂不可用。
            <el-link type="primary" :underline="false" @click="gotoBubbleSwitch">前往开启</el-link>
          </span>
        </el-form-item>
        <el-form-item label="气泡背景颜色">
          <el-radio-group v-model="form.bubbleColor" :disabled="!options.bubbleEnabled || form.bubbleShow !== 1">
            <el-radio v-for="color in options.bubbleColors" :key="color" :value="color">
              <span class="bubble-color-dot" :style="{ backgroundColor: COLOR_HEX[color] || '#d1d5db' }"></span>
              {{ colorLabel(color) }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="赠送比例">
          <div class="ratio-block">
            <div class="ratio-head">
              <span>指定会员层级</span>
              <span>赠送比例</span>
              <span></span>
            </div>
            <div v-for="(item, index) in form.giftRatios" :key="index" class="ratio-row">
              <el-select v-model="item.levelId" placeholder="请选择会员层级" style="width: 240px">
                <el-option
                  v-for="level in options.levels"
                  :key="level.value"
                  :label="level.label"
                  :value="Number(level.value)"
                />
              </el-select>
              <el-input-number v-model="item.giftRate" :min="0" :max="100" :precision="2" controls-position="right" style="width: 180px" />
              <span class="ml-1">%</span>
              <el-button link type="danger" :disabled="form.giftRatios.length <= 1" @click="removeRatio(index)">删除</el-button>
            </div>
            <el-button link type="primary" icon="Plus" @click="addRatio">新增一行</el-button>
            <div class="text-gray-400 text-sm">同一渠道下会员层级不可重复；会员层级未命中时按「默认层级」行的比例赠送。</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 客服代充-设置（原充值设置页的「客服代充-设置」分组，含赠送气泡总开关） -->
    <el-dialog v-model="settingsOpen" title="客服代充-设置" width="720px" append-to-body>
      <el-alert
        title="客服代充稽核倍数、订单有效期、是否需审核、每日代充上限、后台锁定，以及赠送气泡总开关（关闭时渠道上的气泡配置不生效）。"
        type="info"
        :closable="false"
        class="mb-3"
      />
      <el-form v-loading="settingsLoading" label-width="220px">
        <el-form-item v-for="control in SETTINGS_FIELDS" :key="control.key" :label="control.label">
          <el-switch
            v-if="control.type === 'switch'"
            v-model="settingsValues[control.key] as number"
            :active-value="1"
            :inactive-value="0"
          />
          <el-input-number
            v-else-if="control.type === 'number'"
            v-model="settingsValues[control.key] as number"
            :min="0"
            :max="1000000000"
            controls-position="right"
            style="width: 220px"
          />
          <el-input v-else v-model="settingsValues[control.key] as string" style="width: 320px" />
          <span class="ml-2 text-gray-400 text-sm">{{ settingsDesc[control.key] }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingsOpen = false">取消</el-button>
        <el-button type="primary" :loading="settingsSaving" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { listCsRechargeSettingConfig, saveCsRechargeSettingConfig } from '@/api/finance/recharge-config';
import type { ConfigItemVO } from '@/api/member/config/types';
import {
  changeCsChannelStatus,
  createCsChannel,
  getCsChannel,
  getCsChannelOptions,
  listCsChannels,
  removeCsChannel,
  updateCsChannel
} from '@/api/finance/cs-config';
import type { CsChannelForm, CsChannelOptionsVO, CsChannelQuery, CsChannelVO } from '@/api/finance/cs-config';

/**
 * 客服代充渠道配置面板（客服代充 → 代充配置，需求文档 2_财务/07）。
 *
 * 字段与运营后台《新增客服充值》弹窗一一对应；赠送气泡总开关是独立 KV（cs_bubble_enabled），
 * 关闭时弹窗内气泡配置置灰并提供「前往开启」，与参照页交互保持一致。
 */
const props = withDefaults(defineProps<{ listPerm?: string; editPerm?: string }>(), {
  listPerm: 'finance:cs-config:list',
  editPerm: 'finance:cs-config:edit'
});

const COLOR_HEX: Record<string, string> = { RED: '#f56c6c', GREEN: '#67c23a', BLUE: '#409eff', ORANGE: '#e6a23c' };
const COLOR_LABEL: Record<string, string> = { RED: '红色', GREEN: '绿色', BLUE: '蓝色', ORANGE: '橙色' };

/**
 * 「客服代充-设置」字段定义（finance-cs-recharge-setting 分组）。
 *
 * 为什么在代码里定字段而不是纯动态渲染：与 充值设置 页一致 —— 键的中文名与控件形态由前端定义，
 * 后端只校验"键必须已登记"；这样迁移分组时不会因为 config_desc 文案带单位而改 UI。
 * 首行放赠送气泡总开关，与「新增客服充值」弹窗里的「前往开启」呼应。
 */
const SETTINGS_FIELDS = [
  { key: 'cs_bubble_enabled', label: '赠送气泡总开关', type: 'switch' },
  { key: 'cs_audit_required', label: '客服代充是否需要审核', type: 'switch' },
  { key: 'cs_backend_lock_order', label: '后台锁定代充订单', type: 'switch' },
  { key: 'cs_daily_limit', label: '客服每日代充上限(0=不限)', type: 'number' },
  { key: 'order_expire_minutes', label: '订单有效时间(分钟)', type: 'number' },
  { key: 'turnover_default_principal', label: '默认层级-本金稽核倍数', type: 'text' },
  { key: 'turnover_default_bonus', label: '默认层级-奖金稽核倍数', type: 'text' },
  { key: 'member_currency', label: '客服代充默认会员币种', type: 'text' },
  { key: 'member_currency_rate', label: '会员币种比例展示', type: 'text' }
] as const;
const SETTINGS_GROUP = 'finance-cs-recharge-setting';

const loading = ref(false);
const submitting = ref(false);
const dialogOpen = ref(false);
const settingsOpen = ref(false);
const settingsLoading = ref(false);
const settingsSaving = ref(false);
const settingsValues = reactive<Record<string, number | string>>({});
const settingsDesc = reactive<Record<string, string>>({});
const total = ref(0);
const rows = ref<CsChannelVO[]>([]);
const formRef = ref<FormInstance>();
const options = reactive<CsChannelOptionsVO>({
  csTypes: [],
  rechargeTypes: [],
  currencies: [],
  levels: [],
  bubbleColors: [],
  linkModes: [],
  bubbleEnabled: false
});
const query = reactive<CsChannelQuery>({ csName: '', csTypeCode: '', status: undefined, pageNum: 1, pageSize: 10 });

const emptyForm = (): CsChannelForm => ({
  csTypeCode: '',
  csName: '',
  contactAccount: '',
  rechargeTypes: [],
  linkMode: 'SELF',
  csLink: '',
  levelId: undefined,
  status: 0,
  currencyCodes: [],
  bubbleShow: 0,
  bubbleColor: 'RED',
  remark: '',
  giftRatios: [{ levelId: 1, giftRate: 0 }]
});
const form = reactive<CsChannelForm & { configId?: number }>(emptyForm());

const rules: FormRules = {
  csTypeCode: [{ required: true, message: '请选择客服类型', trigger: 'change' }],
  csName: [{ required: true, message: '请输入客服名称', trigger: 'blur' }],
  currencyCodes: [{ required: true, type: 'array', min: 1, message: '请选择支持会员币种', trigger: 'change' }],
  levelId: [{ required: true, message: '请选择会员层级', trigger: 'change' }]
};

const colorLabel = (color?: string) => COLOR_LABEL[color ?? ''] ?? color ?? '';

const loadOptions = async () => {
  const res = await getCsChannelOptions();
  Object.assign(options, res.data ?? {});
};

const load = async () => {
  loading.value = true;
  try {
    const res = await listCsChannels(query);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.csName = '';
  query.csTypeCode = '';
  query.status = undefined;
  query.pageNum = 1;
  load();
};

const openCreate = () => {
  Object.assign(form, emptyForm(), { configId: undefined });
  // 默认选「默认层级」行，与参照页赠送比例表格的默认行一致
  form.giftRatios = [{ levelId: options.levels.length ? Number(options.levels[0].value) : 1, giftRate: 0 }];
  dialogOpen.value = true;
};

const openEdit = async (row: CsChannelVO) => {
  const res = await getCsChannel(row.configId);
  const data = res.data;
  Object.assign(form, {
    configId: data.configId,
    csTypeCode: data.csTypeCode ?? '',
    csName: data.csName ?? '',
    contactAccount: data.contactAccount ?? '',
    rechargeTypes: (data.rechargeTypes ?? '').split(',').filter((v) => v),
    linkMode: data.linkMode ?? 'SELF',
    csLink: data.csLink ?? '',
    levelId: data.levelId || undefined,
    status: data.status ?? 0,
    currencyCodes: (data.currencyCodes ?? '').split(',').filter((v) => v),
    bubbleShow: data.bubbleShow ?? 0,
    bubbleColor: data.bubbleColor ?? 'RED',
    remark: data.remark ?? '',
    giftRatios: (data.giftRatios ?? []).map((r) => ({ levelId: Number(r.levelId), giftRate: Number(r.giftRate ?? 0) }))
  });
  if (!form.giftRatios?.length) {
    form.giftRatios = [{ levelId: options.levels.length ? Number(options.levels[0].value) : 1, giftRate: 0 }];
  }
  dialogOpen.value = true;
};

const addRatio = () => {
  form.giftRatios = [...(form.giftRatios ?? []), { levelId: undefined, giftRate: 0 }];
};

const removeRatio = (index: number) => {
  const list = [...(form.giftRatios ?? [])];
  list.splice(index, 1);
  form.giftRatios = list;
};

const submit = async () => {
  await formRef.value?.validate();
  if (form.linkMode === 'THIRD' && !form.csLink) {
    modal.msgWarning('第三方客服必须填写客服个人链接');
    return;
  }
  const levelIds = (form.giftRatios ?? []).map((r) => r.levelId).filter((id) => !!id);
  if (new Set(levelIds).size !== levelIds.length) {
    modal.msgWarning('同一客服渠道下会员层级不能重复');
    return;
  }
  submitting.value = true;
  try {
    if (form.configId) {
      await updateCsChannel(form.configId, { ...form });
      modal.msgSuccess('已保存');
    } else {
      await createCsChannel({ ...form });
      modal.msgSuccess('已新增');
    }
    dialogOpen.value = false;
    await load();
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (row: CsChannelVO, value: string | number | boolean) => {
  const status = value ? 1 : 0;
  try {
    await changeCsChannelStatus(row.configId, status);
    modal.msgSuccess(status === 1 ? '已开启' : '已关闭');
  } finally {
    await load();
  }
};

const remove = async (row: CsChannelVO) => {
  await modal.confirm(`确认删除客服渠道「${row.csName}」？删除后不再出现在建单下拉中。`);
  await removeCsChannel(row.configId);
  modal.msgSuccess('已删除');
  await load();
};

/**
 * 打开「客服代充-设置」并回读分组配置。
 *
 * 值口径与充值设置页一致：开关归一化 0/1，数字取 Number，文本保持原样。
 */
const openSettings = async () => {
  settingsOpen.value = true;
  settingsLoading.value = true;
  try {
    const res = (await listCsRechargeSettingConfig()) as { data?: ConfigItemVO[] };
    const byKey = new Map((res.data ?? []).map((item) => [item.configKey, item]));
    SETTINGS_FIELDS.forEach((control) => {
      const item = byKey.get(control.key);
      settingsDesc[control.key] = item?.configDesc ?? '';
      const raw = item?.configValue ?? '';
      if (control.type === 'switch') {
        settingsValues[control.key] = Number(raw) === 1 ? 1 : 0;
      } else if (control.type === 'number') {
        settingsValues[control.key] = Number(raw || 0);
      } else {
        settingsValues[control.key] = raw;
      }
    });
  } finally {
    settingsLoading.value = false;
  }
};

/** 保存「客服代充-设置」：保存后刷新气泡总开关状态与列表（气泡生效列会随总开关变化）。 */
const saveSettings = async () => {
  settingsSaving.value = true;
  try {
    await saveCsRechargeSettingConfig({
      items: SETTINGS_FIELDS.map((control) => ({
        configKey: control.key,
        configValue: String(settingsValues[control.key] ?? '')
      }))
    });
    modal.msgSuccess('保存成功');
    settingsOpen.value = false;
    await loadOptions();
    await load();
  } finally {
    settingsSaving.value = false;
  }
};

/** 「前往开启」：直接打开设置弹窗（赠送气泡总开关在首行），由运营自行开启。 */
const gotoBubbleSwitch = () => openSettings();

onMounted(async () => {
  await loadOptions();
  await load();
});
</script>

<style scoped>
.ratio-block {
  width: 100%;
}
.ratio-head,
.ratio-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ratio-head {
  color: #909399;
  font-size: 13px;
  margin-bottom: 6px;
}
.ratio-head span:first-child {
  width: 240px;
}
.ratio-head span:nth-child(2) {
  width: 180px;
}
.ratio-row {
  margin-bottom: 8px;
}
.bubble-color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}
</style>

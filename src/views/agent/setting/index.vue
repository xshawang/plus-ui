<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <el-tabs v-model="tab">
        <el-tab-pane label="代理公共设置" name="public">
          <el-form label-width="210px" class="cfg-form">
            <el-form-item label="默认人人代理模式">
              <el-select v-model="pub.defaultPeopleModeId" style="width: 260px">
                <el-option v-for="m in modes" :key="m.modeId" :label="m.modeName" :value="String(m.modeId)" />
              </el-select>
            </el-form-item>
            <el-form-item label="默认专业代理模式">
              <el-select v-model="pub.defaultProModeId" style="width: 260px">
                <el-option v-for="m in modes" :key="m.modeId" :label="m.modeName" :value="String(m.modeId)" />
              </el-select>
            </el-form-item>
            <el-form-item label="前台返佣展示格式">
              <el-radio-group v-model="pub.displayFormat">
                <el-radio :value="1">比例</el-radio>
                <el-radio :value="2">金额</el-radio>
                <el-radio :value="3">比例 + 金额</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="领取时间窗">
              <el-time-picker v-model="pub.claimStart" value-format="HH:mm:ss" style="width: 130px" />
              <span class="mx-2">-</span>
              <el-time-picker v-model="pub.claimEnd" value-format="HH:mm:ss" style="width: 130px" />
            </el-form-item>
            <el-form-item label="稽核倍数（0=无需稽核）">
              <el-input-number v-model="pub.auditMultiple" :min="0" :precision="2" :step="0.5" />
            </el-form-item>
            <el-form-item label="有效会员：周期有效投注 ≥（元）"><el-input-number v-model="pub.validBetMin" :min="0" :controls="false" /></el-form-item>
            <el-form-item label="有效会员：周期充值 ≥（元）"><el-input-number v-model="pub.validDepositMin" :min="0" :controls="false" /></el-form-item>
            <el-form-item label="直属单会员返佣上限（元，0不限）">
              日 <el-input-number v-model="pub.capDay" :min="0" :controls="false" style="width: 110px" /> 周
              <el-input-number v-model="pub.capWeek" :min="0" :controls="false" style="width: 110px" /> 月
              <el-input-number v-model="pub.capMonth" :min="0" :controls="false" style="width: 110px" />
            </el-form-item>
            <el-form-item label="开放专业代理申请"><el-switch v-model="pub.proApplyOpen" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="前台展示代理等级"><el-switch v-model="pub.levelShow" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item><el-button v-hasPermi="['agent:config:edit']" type="primary" @click="save('public')">保存</el-button></el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="创建下级设置" name="sub">
          <el-form label-width="210px" class="cfg-form">
            <el-form-item label="允许代理在前台创建下级"><el-switch v-model="sub.allowFrontCreate" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="专业线可创建类型">
              <el-checkbox-group v-model="proTypes">
                <el-checkbox value="1">普通会员</el-checkbox>
                <el-checkbox value="2">下级专业代理</el-checkbox>
              </el-checkbox-group>
              <div class="tip">人人线只能创建普通会员</div>
            </el-form-item>
            <el-form-item label="创建下级专业代理需平台审核"><el-switch v-model="sub.proCreateNeedAudit" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="每日创建上限（0不限）"><el-input-number v-model="sub.dailyCreateLimit" :min="0" /></el-form-item>
            <el-form-item label="专业线最大层数（0不限）"><el-input-number v-model="sub.proMaxDepth" :min="0" /></el-form-item>
            <el-form-item label="每个代理推广链接数"><el-input-number v-model="sub.linkLimit" :min="1" /></el-form-item>
            <el-form-item label="绑定归因有效期（天）"><el-input-number v-model="sub.bindValidDays" :min="0" /></el-form-item>
            <el-form-item label="新下级绑定默认开启"><el-switch v-model="sub.bindNewSubDefault" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="推广二维码"><el-switch v-model="sub.qrEnable" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="代理给下级转账/代充">
              <el-switch v-model="sub.allowTransfer" :active-value="1" :inactive-value="0" disabled />
              <span class="tip ml-2">本期不开放</span>
            </el-form-item>
            <el-form-item><el-button v-hasPermi="['agent:config:edit']" type="primary" @click="save('sub')">保存</el-button></el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="其他公共设置" name="other">
          <el-form label-width="210px" class="cfg-form">
            <el-form-item label="前台代理中心入口"><el-switch v-model="other.centerEnable" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="佣金排行榜"><el-switch v-model="other.rankEnable" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="领取方式">
              <el-radio-group v-model="other.claimMode">
                <el-radio :value="1">手动领取</el-radio>
                <el-radio :value="2">自动领取</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="最低领取金额（元）"><el-input-number v-model="other.claimMin" :min="0" :controls="false" /></el-form-item>
            <el-form-item label="未领取过期天数（0不过期）"><el-input-number v-model="other.expireDays" :min="0" /></el-form-item>
            <el-form-item label="过期处理">
              <el-radio-group v-model="other.expireAction">
                <el-radio :value="1">作废</el-radio>
                <el-radio :value="2">自动领取</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="单张应发 ≥ 进入待审核（元，0不审）"><el-input-number v-model="other.auditThreshold" :min="0" :controls="false" /></el-form-item>
            <el-form-item label="首次出单需审核"><el-switch v-model="other.firstOrderAudit" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="单代理单日佣金告警（元）"><el-input-number v-model="other.dailyAlertAmount" :min="0" :controls="false" /></el-form-item>
            <el-form-item label="代理本人业绩计入自己"><el-switch v-model="other.selfPerfInclude" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="同设备/同IP下级不计有效人数"><el-switch v-model="other.sameDeviceExclude" :active-value="1" :inactive-value="0" /></el-form-item>
            <el-form-item label="风控标记账号">
              <el-radio-group v-model="other.riskMode">
                <el-radio :value="1">不计有效、不计业绩</el-radio>
                <el-radio :value="2">只不计有效</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="申请专业代理：VIP ≥"><el-input-number v-model="other.applyVipMin" :min="0" /></el-form-item>
            <el-form-item label="申请专业代理：累计充值 ≥（元）"><el-input-number v-model="other.applyDepositMin" :min="0" :controls="false" /></el-form-item>
            <el-form-item label="被拒后冷却天数"><el-input-number v-model="other.applyCooldownDays" :min="0" /></el-form-item>
            <el-form-item label="冻结期间佣金">
              <el-radio-group v-model="other.freezeMode">
                <el-radio :value="1">暂停</el-radio>
                <el-radio :value="2">作废</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="前台数据时效">
              <el-radio-group v-model="other.dataMode">
                <el-radio :value="1">T+1 + 今日预估</el-radio>
                <el-radio :value="2">仅 T+1</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="推广域名池（每行一个）">
              <el-input v-model="other.domainPool" type="textarea" :rows="4" maxlength="2048" style="width: 420px" />
            </el-form-item>
            <el-form-item><el-button v-hasPermi="['agent:config:edit']" type="primary" @click="save('other')">保存</el-button></el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="敏感数据展示" name="display" lazy>
          <el-table :data="displays" border row-key="moduleCode">
            <el-table-column label="排序" prop="sortOrder" align="center" width="70" />
            <el-table-column label="模块" prop="moduleName" align="center" width="200" />
            <el-table-column label="显示" align="center" width="80">
              <template #default="{ row }"><el-switch v-model="row.visible" :active-value="1" :inactive-value="0" /></template>
            </el-table-column>
            <el-table-column label="字段（勾选 = 前台可见，服务端按此裁剪）" align="left">
              <template #default="{ row }">
                <el-checkbox v-for="f in row.fields" :key="f.code" v-model="f.on" :true-value="1" :false-value="0" class="mr-3">{{ f.name }}</el-checkbox>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="140">
              <template #default="{ row }">
                <el-button v-hasPermi="['agent:config:edit']" link type="primary" @click="saveDisplay(row)">保存</el-button>
                <el-button v-hasPermi="['agent:config:edit']" link @click="topDisplay(row)">置顶</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="返佣大类" name="category" lazy>
          <el-table :data="categories" border row-key="categoryCode">
            <el-table-column label="编码" prop="categoryCode" align="center" width="80" />
            <el-table-column label="大类名称" align="center" width="160">
              <template #default="{ row }"><el-input v-model="row.categoryName" maxlength="32" /></template>
            </el-table-column>
            <el-table-column label="启用" align="center" width="90">
              <template #default="{ row }"><el-switch v-model="row.status" :active-value="1" :inactive-value="0" /></template>
            </el-table-column>
            <el-table-column label="场馆费率(%)" align="center" width="150">
              <template #default="{ row }"><el-input-number v-model="row.venueFeeRate" :min="0" :max="100" :precision="4" :controls="false" /></template>
            </el-table-column>
            <el-table-column label="包含游戏类型" prop="gameTypes" align="center" />
            <el-table-column label="操作" align="center" width="100">
              <template #default="{ row }">
                <el-button v-hasPermi="['agent:config:edit']" link type="primary" @click="saveCat(row)">保存</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-divider content-position="left">游戏类型 → 返佣大类映射（0 = 不计业绩）</el-divider>
          <el-table :data="maps" border size="small">
            <el-table-column label="游戏类型" align="center" width="200">
              <template #default="{ row }">{{ row.gameType }} {{ row.gameTypeName }}</template>
            </el-table-column>
            <el-table-column label="返佣大类" align="center">
              <template #default="{ row }">
                <el-select v-model="row.categoryCode" style="width: 200px" @change="(v: any) => saveMapRow(row.gameType, v)">
                  <el-option label="不计业绩" :value="0" />
                  <el-option v-for="c in categories" :key="c.categoryCode" :label="c.categoryName" :value="Number(c.categoryCode)" />
                </el-select>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup name="AgentSetting" lang="ts">
import { onMounted, ref, watch } from 'vue';
import modal from '@/plugins/modal';
import {
  getAgentConfig,
  getCategories,
  listDisplayConfig,
  listModes,
  saveAgentConfig,
  saveCategory,
  saveCategoryMap,
  saveDisplayConfig,
  topDisplayConfig
} from '@/api/agent/refactor';

/**
 * 代理设置（方案 §4.8、§9.1、§9.2、§11.1、§4.1）。金额字段库内为分，页面按元编辑。
 */
const MONEY: Record<string, string[]> = {
  public: ['validBetMin', 'validDepositMin', 'capDay', 'capWeek', 'capMonth'],
  sub: [],
  other: ['claimMin', 'auditThreshold', 'dailyAlertAmount', 'applyDepositMin']
};

const tab = ref('public');
const pub = ref<Record<string, any>>({});
const sub = ref<Record<string, any>>({});
const other = ref<Record<string, any>>({});
const proTypes = ref<string[]>([]);
const modes = ref<any[]>([]);
const displays = ref<any[]>([]);
const categories = ref<any[]>([]);
const maps = ref<any[]>([]);

const toYuan = (kind: string, data: Record<string, any>) => {
  const out = { ...data };
  MONEY[kind].forEach((k) => (out[k] = Number(out[k] ?? 0) / 100));
  ['auditMultiple'].forEach((k) => out[k] !== undefined && (out[k] = Number(out[k])));
  return out;
};

const load = async (kind: 'public' | 'sub' | 'other') => {
  const res: any = await getAgentConfig(kind);
  const data = toYuan(kind, res?.data ?? {});
  if (kind === 'public') {
    pub.value = data;
  } else if (kind === 'sub') {
    sub.value = data;
    proTypes.value = String(data.proCreateTypes ?? '1,2').split(',').filter(Boolean);
  } else {
    other.value = data;
  }
};

const save = async (kind: 'public' | 'sub' | 'other') => {
  const src = kind === 'public' ? pub.value : kind === 'sub' ? sub.value : other.value;
  const body: Record<string, any> = { ...src };
  MONEY[kind].forEach((k) => (body[k] = Math.round(Number(body[k] ?? 0) * 100)));
  if (kind === 'sub') {
    body.proCreateTypes = proTypes.value.join(',');
  }
  await saveAgentConfig(kind, body);
  modal.msgSuccess('已保存');
  load(kind);
};

const loadDisplay = async () => {
  const res: any = await listDisplayConfig();
  displays.value = (res?.data ?? []).map((r: any) => {
    let fields: any[] = [];
    try {
      fields = JSON.parse(r.fieldsJson || '[]');
    } catch {
      fields = [];
    }
    return { ...r, fields };
  });
};

const saveDisplay = async (row: any) => {
  const fieldsJson = JSON.stringify(row.fields.map((f: any) => ({ code: f.code, name: f.name, on: Number(f.on) ? 1 : 0 })));
  await saveDisplayConfig({ moduleCode: row.moduleCode, visible: row.visible, sortOrder: row.sortOrder, fieldsJson });
  modal.msgSuccess('已保存');
};

const topDisplay = async (row: any) => {
  await topDisplayConfig(row.moduleCode);
  loadDisplay();
};

const loadCategories = async () => {
  const res: any = await getCategories();
  categories.value = (res?.data?.categories ?? []).map((c: any) => ({ ...c, venueFeeRate: Number(c.venueFeeRate ?? 0) }));
  maps.value = (res?.data?.map ?? []).map((m: any) => ({ ...m, categoryCode: Number(m.categoryCode) }));
};

const saveCat = async (row: any) => {
  await saveCategory({ categoryCode: row.categoryCode, categoryName: row.categoryName, status: row.status, venueFeeRate: row.venueFeeRate });
  modal.msgSuccess('已保存');
  loadCategories();
};

const saveMapRow = async (gameType: number, categoryCode: number) => {
  await saveCategoryMap({ gameType, categoryCode });
  modal.msgSuccess('映射已保存（次日统计生效）');
};

watch(tab, (t) => {
  if (t === 'display') {
    loadDisplay();
  } else if (t === 'category') {
    loadCategories();
  }
});

onMounted(async () => {
  const res: any = await listModes({ status: 1 });
  modes.value = res?.data ?? [];
  await Promise.all([load('public'), load('sub'), load('other')]);
});
</script>

<style scoped>
.cfg-form {
  max-width: 900px;
}

.tip {
  color: #909399;
  font-size: 12px;
}
</style>

<template>
  <el-dialog :model-value="visible" :title="`返佣设置 · ${modeName}`" width="980px" append-to-body destroy-on-close @update:model-value="emit('update:visible', $event)">
    <el-tabs v-model="active" type="card">
      <el-tab-pane v-for="c in cats" :key="c.categoryCode" :name="String(c.categoryCode)">
        <template #label>
          {{ c.categoryName }}<span v-if="Number(c.status) !== 1" class="off">（关闭）</span>
        </template>
        <div class="bar">
          <el-radio-group v-model="c.calcType">
            <el-radio :value="1">比例模式（金额 = 门槛 × 比例，自动计算）</el-radio>
            <el-radio :value="2">固定金额模式</el-radio>
          </el-radio-group>
          <div>
            <el-select v-model="copyTargets" multiple collapse-tags placeholder="复制到其他大类" style="width: 220px">
              <el-option v-for="x in cats.filter((y) => y.categoryCode !== c.categoryCode)" :key="x.categoryCode" :label="x.categoryName" :value="Number(x.categoryCode)" />
            </el-select>
            <el-button v-hasPermi="['agent:mode:edit']" class="ml-2" :disabled="!copyTargets.length" @click="copy(c)">复制配置</el-button>
          </div>
        </div>
        <el-table :data="c.tiers" border size="small">
          <el-table-column label="档位" type="index" width="60" align="center" />
          <el-table-column label="有效人数 ≥（0 不限）" align="center">
            <template #default="{ row }"><el-input-number v-model="row.minValidMembers" :min="0" :controls="false" /></template>
          </el-table-column>
          <el-table-column label="有效投注 ≥（元）" align="center">
            <template #default="{ row }"><el-input-number v-model="row.perfYuan" :min="0" :precision="2" :controls="false" /></template>
          </el-table-column>
          <el-table-column label="返佣比例 %" align="center">
            <template #default="{ row }"><el-input-number v-model="row.rate" :min="0" :max="100" :precision="4" :controls="false" /></template>
          </el-table-column>
          <el-table-column label="返佣金额（元）" align="center">
            <template #default="{ row }">
              <span v-if="c.calcType === 1">{{ ((Number(row.perfYuan || 0) * Number(row.rate || 0)) / 100).toFixed(2) }}</span>
              <el-input-number v-else v-model="row.amountYuan" :min="0" :precision="2" :controls="false" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110" align="center">
            <template #default="{ $index }">
              <el-button link type="primary" @click="c.tiers.splice($index + 1, 0, blank())">新增</el-button>
              <el-button link type="danger" :disabled="c.tiers.length <= 1" @click="c.tiers.splice($index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="foot">
          <span class="tip">取档：本期同时满足“有效人数 ≥”和“该大类业绩 ≥”的最高一档，用该档比例乘整期业绩（全额，不累进）。修改从下一结算周期生效。</span>
          <el-button v-hasPermi="['agent:mode:edit']" type="primary" @click="save(c)">保存「{{ c.categoryName }}」</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane v-if="withFirstDeposit" label="首充人头奖励" name="fd">
        <el-table :data="fd" border size="small">
          <el-table-column label="档位" type="index" width="60" align="center" />
          <el-table-column label="本期首充人数 ≥" align="center">
            <template #default="{ row }"><el-input-number v-model="row.minCount" :min="1" :controls="false" /></template>
          </el-table-column>
          <el-table-column label="奖励金额（元）" align="center">
            <template #default="{ row }"><el-input-number v-model="row.amountYuan" :min="0" :precision="2" :controls="false" /></template>
          </el-table-column>
          <el-table-column label="操作" width="110" align="center">
            <template #default="{ $index }">
              <el-button link type="primary" @click="fd.splice($index + 1, 0, { minCount: undefined, amountYuan: 0 })">新增</el-button>
              <el-button link type="danger" @click="fd.splice($index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="foot">
          <span class="tip">首充人数取本期直属会员中“生涯首充且首充金额 ≥ 模式门槛”的人数，按所达最高档一次性发放。</span>
          <el-button v-hasPermi="['agent:mode:edit']" type="primary" @click="saveFd">保存首充阶梯</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup name="ModeTierDialog" lang="ts">
import { ref, watch } from 'vue';
import modal from '@/plugins/modal';
import { copyModeTiers, getFirstDepositTiers, getModeTiers, saveFirstDepositTiers, saveModeTiers } from '@/api/agent/refactor';

/** 返佣设置：每个大类一张阶梯（门槛与金额页面用元、库内为分；比例为百分数），多奖励模式另有首充人头阶梯 */
const props = defineProps<{ visible: boolean; modeId?: string; modeName?: string; withFirstDeposit?: boolean }>();
const emit = defineEmits<{ 'update:visible': [v: boolean] }>();

const cats = ref<any[]>([]);
const fd = ref<any[]>([]);
const active = ref('');
const copyTargets = ref<number[]>([]);

const blank = () => ({ minValidMembers: 0, perfYuan: undefined, rate: 0, amountYuan: 0 });

const load = async () => {
  if (!props.modeId) {
    return;
  }
  const res: any = await getModeTiers(props.modeId);
  cats.value = (res?.data ?? []).map((c: any) => ({
    ...c,
    calcType: Number(c.calcType ?? 1),
    tiers: (c.tiers?.length ? c.tiers : [{ minValidMembers: 0, minPerf: 0, rate: 0, amount: 0 }]).map((t: any) => ({
      minValidMembers: Number(t.minValidMembers ?? 0),
      perfYuan: Number(t.minPerf ?? 0) / 100,
      rate: Number(t.rate ?? 0),
      amountYuan: Number(t.amount ?? 0) / 100
    }))
  }));
  active.value = cats.value.length ? String(cats.value[0].categoryCode) : '';
  if (props.withFirstDeposit) {
    const r: any = await getFirstDepositTiers(props.modeId);
    fd.value = (r?.data ?? []).map((t: any) => ({ minCount: Number(t.minCount), amountYuan: Number(t.amount ?? 0) / 100 }));
  }
};

const rowsOf = (c: any) =>
  c.tiers.map((t: any) => ({
    minValidMembers: t.minValidMembers ?? 0,
    minPerf: Math.round(Number(t.perfYuan ?? 0) * 100),
    rate: t.rate ?? 0,
    amount: Math.round(Number(t.amountYuan ?? 0) * 100)
  }));

const save = async (c: any) => {
  await saveModeTiers(props.modeId as string, Number(c.categoryCode), { calcType: c.calcType, rows: rowsOf(c) });
  modal.msgSuccess(`「${c.categoryName}」已保存`);
  load();
};

const copy = async (c: any) => {
  await saveModeTiers(props.modeId as string, Number(c.categoryCode), { calcType: c.calcType, rows: rowsOf(c) });
  await copyModeTiers(props.modeId as string, { from: Number(c.categoryCode), targets: copyTargets.value });
  modal.msgSuccess('已复制');
  copyTargets.value = [];
  load();
};

const saveFd = async () => {
  await saveFirstDepositTiers(
    props.modeId as string,
    fd.value.map((t) => ({ minCount: t.minCount, amount: Math.round(Number(t.amountYuan ?? 0) * 100) }))
  );
  modal.msgSuccess('首充阶梯已保存');
  load();
};

watch(
  () => props.visible,
  (v) => v && load()
);
</script>

<style scoped>
.bar,
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0;
}

.tip {
  color: #909399;
  font-size: 12px;
  max-width: 620px;
}

.off {
  color: #c0c4cc;
}
</style>

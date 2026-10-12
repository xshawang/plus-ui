<template>
  <div>
    <el-table v-loading="loading" border :data="rows">
      <el-table-column label="彩种名称(代码)" align="center" width="220">
        <template #default="{ row }">{{ row.lotteryName }}({{ row.lotteryCode }})</template>
      </el-table-column>
      <el-table-column label="币种" align="center" prop="currency" width="150" />
      <el-table-column label="状态" align="center" width="100">
        <template #default="{ row }">{{ row.lotteryStatus === 1 ? '启用' : '停用' }}</template>
      </el-table-column>
      <el-table-column label="开奖周期" align="center" prop="drawWeek" width="120" />
      <el-table-column label="每日期数" align="center" prop="drawsPerDay" width="110" />
      <el-table-column label="开售提前(分)" align="center" prop="saleAheadMinutes" width="140" />
      <el-table-column label="封盘提前(分)" align="center" prop="closeAheadMinutes" width="140" />
      <el-table-column label="开奖方式" align="center" width="120">
        <template #default="{ row }">{{ row.openMode === 2 ? '平台开奖' : '官方开奖' }}</template>
      </el-table-column>
      <el-table-column label="自动开奖" align="center" width="110">
        <template #default="{ row }">{{ row.autoOpen === 1 ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="期号格式" align="center" prop="issueFormat" width="120" />
      <el-table-column label="结果来源" align="center" prop="resultSource" width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="140" />
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="{ row }">
          <el-button v-hasPermi="['game:lottery:edit']" link type="primary" @click="openEdit(row)">修改</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" title="修改彩种参数" width="640px" append-to-body>
      <el-form :model="form" label-width="150px">
        <el-form-item label="彩种名称(代码)">
          <el-input :model-value="`${form.lotteryName}(${form.lotteryCode})`" disabled />
        </el-form-item>
        <el-form-item label="币种"><el-input v-model="form.currency" disabled /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.lotteryStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="开奖周期">
          <el-input v-model="form.drawWeek" placeholder="如 2,4,6 表示周二四六" />
        </el-form-item>
        <el-form-item label="每日期数">
          <el-input-number v-model="form.drawsPerDay" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="开售提前(分)">
          <el-input-number v-model="form.saleAheadMinutes" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="封盘提前(分)">
          <el-input-number v-model="form.closeAheadMinutes" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="开奖方式">
          <el-radio-group v-model="form.openMode">
            <el-radio :value="1">官方开奖</el-radio>
            <el-radio :value="2">平台开奖</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="自动开奖">
          <el-switch v-model="form.autoOpen" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="期号格式">
          <el-input v-model="form.issueFormat" placeholder="yyyy=年，NNN=当年序号，如 yyyyNNN" />
        </el-form-item>
        <el-form-item label="结果来源">
          <el-select v-model="form.resultSource" style="width: 100%">
            <el-option label="OFFICIAL 官方" value="OFFICIAL" />
            <el-option label="MANUAL 手工" value="MANUAL" />
            <el-option label="RNG 平台随机" value="RNG" />
          </el-select>
          <span class="tip">结果来源不得为「客户端」；RNG 结果须绑定 RoundId 且只生成一次</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="dialog.loading" @click="submit">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

/**
 * 彩种参数页签（截图「彩种参数」）。
 *
 * 背景：截图未展开该页签，本批按六合彩类彩种通用口径补齐可维护字段：
 * 状态、开奖周期、每日期数、开售/封盘提前、开奖方式（官方/平台）、是否自动开奖、
 * 期号格式、结果来源（OFFICIAL/MANUAL/RNG）、排序、备注。
 * 其中「开奖方式/结果来源/期号格式」是开奖链路的关键约束：结果必须绑定期号、只生成一次、
 * 不允许由客户端决定（AGENTS.md §7）。
 * 协作关系：/infra/game/lottery/params/* 接口。
 */
const props = defineProps<{ lotteryCode?: string; currency?: string }>();
const loading = ref(false);
const rows = ref<any[]>([]);
const dialog = reactive({ visible: false, loading: false });
const form = reactive<any>({});

async function load() {
  loading.value = true;
  try {
    rows.value = ((await request({ url: '/infra/game/lottery/params/list', method: 'get',
      params: { currency: props.currency } })) as unknown as any)?.data ?? [];
  } finally {
    loading.value = false;
  }
}

function openEdit(row: any) {
  Object.assign(form, row);
  dialog.visible = true;
}

async function submit() {
  if (!form.issueFormat) {
    ElMessage.warning('期号格式不能为空');
    return;
  }
  if (form.resultSource === 'CLIENT') {
    ElMessage.error('结果来源不允许为客户端');
    return;
  }
  dialog.loading = true;
  try {
    await request({ url: '/infra/game/lottery/params', method: 'put', data: form });
    ElMessage.success('保存成功');
    dialog.visible = false;
    load();
  } finally {
    dialog.loading = false;
  }
}

watch(() => props.currency, () => load(), { immediate: true });
onMounted(load);
</script>

<style scoped>
.tip {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}
</style>

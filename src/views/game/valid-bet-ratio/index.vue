<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <el-form :inline="true">
        <el-form-item label="游戏">
          <el-input v-model="query.keyword" placeholder="编码/名称" clearable style="width: 220px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏类型">
          <el-select v-model="query.gameType" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in typeOptions"
              :key="item.gameType"
              :label="item.gameTypeName || String(item.gameType)"
              :value="item.gameType"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
          <el-button v-hasPermi="['game:valid-bet-ratio:edit']" plain @click="handleSeed">补齐缺失游戏</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="游戏编码" prop="gameCode" min-width="140" />
        <el-table-column label="游戏名称" prop="gameName" min-width="180" show-overflow-tooltip />
        <el-table-column label="游戏类型" width="120" align="center">
          <template #default="{ row }">
            {{ row.gameTypeName || row.gameType || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="有效投注比例" prop="ratioPercent" width="140" align="right">
          <template #default="{ row }">{{ Number(row.ratioPercent ?? 0).toFixed(2) }}%</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作人" prop="operatorId" width="120" />
        <el-table-column label="更新时间" prop="updatedAt" width="180" />
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:valid-bet-ratio:edit']" link type="primary" @click="openEdit(row as ValidBetRatioVO)">
              修改
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" title="有效投注比例" width="480px" append-to-body destroy-on-close>
      <el-form label-width="120px">
        <el-form-item label="游戏编码">
          <el-input v-model="form.gameCode" disabled />
        </el-form-item>
        <el-form-item label="游戏名称">
          <el-input v-model="form.gameName" disabled />
        </el-form-item>
        <el-form-item label="比例(%)">
          <el-input-number v-model="form.ratioPercent" :min="0" :max="100" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submit">保存</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="GameValidBetRatio" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  listValidBetRatio,
  listValidBetRatioTypeOptions,
  saveValidBetRatio,
  seedMissingValidBetRatio
} from '@/api/game/valid-bet-ratio';
import type {
  ValidBetRatioQuery,
  ValidBetRatioTypeOption,
  ValidBetRatioVO
} from '@/api/game/valid-bet-ratio';

defineOptions({ name: 'GameValidBetRatio' });

const loading = ref(false);
const rows = ref<ValidBetRatioVO[]>([]);
const typeOptions = ref<ValidBetRatioTypeOption[]>([]);
const query = reactive<ValidBetRatioQuery>({});
const dialog = reactive({ visible: false });
const form = reactive<ValidBetRatioVO>({ gameCode: '', gameName: '', ratioPercent: 100, status: 1, remark: '' });

const loadTypeOptions = async () => {
  try {
    const res: any = await listValidBetRatioTypeOptions();
    typeOptions.value = res.data ?? [];
  } catch {
    typeOptions.value = [];
  }
};

const load = async () => {
  loading.value = true;
  try {
    const res: any = await listValidBetRatio(query);
    rows.value = res.data ?? [];
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.keyword = undefined;
  query.status = undefined;
  query.gameType = undefined;
  load();
};

const openEdit = (row: ValidBetRatioVO) => {
  Object.assign(form, row);
  dialog.visible = true;
};

const submit = async () => {
  await saveValidBetRatio({
    gameCode: form.gameCode,
    gameName: form.gameName,
    ratioPercent: form.ratioPercent,
    status: form.status,
    remark: form.remark
  });
  ElMessage.success('保存成功');
  dialog.visible = false;
  load();
};

const handleSeed = async () => {
  const res: any = await seedMissingValidBetRatio();
  ElMessage.success(`已补齐 ${res.data ?? 0} 款游戏（默认 0%）`);
  load();
};

onMounted(async () => {
  await loadTypeOptions();
  await load();
});
</script>

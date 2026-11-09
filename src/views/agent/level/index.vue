<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <div class="toolbar">
        <span class="text-gray-500">晋级条件 = 累计应发佣金（撤回/拒绝不计）；每日 04:00 批量晋级，只升不降。阈值必须逐级递增。</span>
        <el-button v-hasPermi="['agent:level:edit']" type="primary" icon="Plus" @click="openAdd">新增等级</el-button>
      </div>
      <el-table v-loading="loading" border :data="rows" row-key="levelNo">
        <el-table-column label="等级" align="center" width="90">
          <template #default="{ row }">LV{{ row.levelNo }}</template>
        </el-table-column>
        <el-table-column label="等级名称" align="center" min-width="140">
          <template #default="{ row }">
            <el-input v-if="editing === row.levelNo" v-model="form.levelName" maxlength="32" />
            <span v-else>{{ row.levelName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="徽章图标URL" align="center" min-width="200">
          <template #default="{ row }">
            <el-input v-if="editing === row.levelNo" v-model="form.iconUrl" maxlength="512" />
            <span v-else>{{ row.iconUrl || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="晋级条件(累计佣金,元)" align="center" min-width="180">
          <template #default="{ row }">
            <el-input-number v-if="editing === row.levelNo" v-model="form.amountYuan" :min="0" :precision="2" :controls="false" />
            <span v-else>{{ money(row.upgradeAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前人数" prop="currentCount" align="center" width="100" />
        <el-table-column label="操作" align="center" width="170">
          <template #default="{ row, $index }">
            <template v-if="editing === row.levelNo">
              <el-button link type="primary" @click="save(row)">保存</el-button>
              <el-button link @click="editing = null">取消</el-button>
            </template>
            <template v-else>
              <el-button v-hasPermi="['agent:level:edit']" link type="primary" @click="edit(row)">编辑</el-button>
              <el-button
                v-if="$index === rows.length - 1 && Number(row.levelNo) > 12"
                v-hasPermi="['agent:level:edit']"
                link
                type="danger"
                :disabled="Number(row.currentCount) > 0"
                @click="remove(row)"
              >
                删除
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addVisible" title="新增等级" width="400px" append-to-body>
      <el-form label-width="130px">
        <el-form-item label="等级名称"><el-input v-model="addForm.levelName" placeholder="默认 LV序号" /></el-form-item>
        <el-form-item label="晋级条件(元)">
          <el-input-number v-model="addForm.amountYuan" :min="0" :precision="2" :controls="false" style="width: 180px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="AgentLevel" lang="ts">
import { reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import { addLevel, deleteLevel, listLevels, saveLevel } from '@/api/agent/refactor';

/** 代理等级（方案 §6）：LV1–LV20 行内编辑名称/图标/阈值，可追加等级、删除人数为 0 的最高级（LV13 起） */
const rows = ref<any[]>([]);
const loading = ref(false);
const editing = ref<number | null>(null);
const form = reactive<{ levelName?: string; iconUrl?: string; amountYuan?: number }>({});
const addVisible = ref(false);
const addForm = reactive<{ levelName?: string; amountYuan?: number }>({});

const money = (v: any) => (Number(v ?? 0) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 });

const load = async () => {
  loading.value = true;
  try {
    const res: any = await listLevels();
    rows.value = res?.data ?? [];
  } finally {
    loading.value = false;
  }
};

const edit = (row: any) => {
  editing.value = row.levelNo;
  form.levelName = row.levelName;
  form.iconUrl = row.iconUrl;
  form.amountYuan = Number(row.upgradeAmount ?? 0) / 100;
};

const save = async (row: any) => {
  await saveLevel({
    levelNo: row.levelNo,
    levelName: form.levelName,
    iconUrl: form.iconUrl ?? '',
    upgradeAmount: Math.round(Number(form.amountYuan ?? 0) * 100)
  });
  modal.msgSuccess('已保存');
  editing.value = null;
  load();
};

const openAdd = () => {
  addForm.levelName = '';
  addForm.amountYuan = undefined;
  addVisible.value = true;
};

const submitAdd = async () => {
  if (addForm.amountYuan === undefined || addForm.amountYuan === null) {
    modal.msgWarning('请填写晋级条件');
    return;
  }
  await addLevel({ levelName: addForm.levelName, upgradeAmount: Math.round(addForm.amountYuan * 100) });
  modal.msgSuccess('已新增');
  addVisible.value = false;
  load();
};

const remove = async (row: any) => {
  try {
    await modal.confirm(`确认删除 LV${row.levelNo}？`);
  } catch {
    return;
  }
  await deleteLevel(Number(row.levelNo));
  modal.msgSuccess('已删除');
  load();
};

load();
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>

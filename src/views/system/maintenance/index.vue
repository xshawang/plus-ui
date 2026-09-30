<template>
  <div class="p-2 app-container system-maintenance-page">
    <el-card shadow="hover" class="search-panel">
      <div class="panel-heading">
        <div>
          <span class="panel-kicker">Maintenance Switch</span>
          <h3>维护开关</h3>
          <p class="muted">
            开启维护后，对应入口对非白名单玩家关闭；已下发版本 {{ downlinkVersion || 0 }}
            <span v-if="downlinkAt">（{{ fmt(downlinkAt) }}）</span>。
            白名单路径：系统管理 → 访问控制 → IP白名单。
          </p>
        </div>
        <div class="toolbar-actions">
          <el-button v-hasPermi="['system:maintenance:push']" type="warning" plain icon="Refresh" @click="handlePush">
            强制重推
          </el-button>
          <el-button icon="Refresh" @click="getList">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="模块" prop="moduleName" min-width="140" />
        <el-table-column label="模块编码" prop="moduleCode" min-width="120" />
        <el-table-column label="维护中" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.effective ? 'danger' : 'info'">{{ row.effective ? '维护中' : '正常' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开关状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.isMaintenance === 1 ? 'warning' : 'success'">
              {{ row.isMaintenance === 1 ? '已开启' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计划开始" align="center" width="170">
          <template #default="{ row }">{{ row.scheduleStart ? fmt(row.scheduleStart) : '—' }}</template>
        </el-table-column>
        <el-table-column label="计划结束" align="center" width="170">
          <template #default="{ row }">{{ row.scheduleEnd ? fmt(row.scheduleEnd) : '—' }}</template>
        </el-table-column>
        <el-table-column label="玩家提示（越南语）" prop="messageVi" min-width="240" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['system:maintenance:edit']" link type="primary" @click="handleEdit(row)">
              配置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="模块">
          <el-input :model-value="moduleLabel(form.moduleCode)" disabled />
        </el-form-item>
        <el-form-item label="是否维护中" prop="isMaintenance">
          <el-radio-group v-model="form.isMaintenance">
            <el-radio :value="1">开启维护</el-radio>
            <el-radio :value="0">关闭维护</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计划开始">
          <el-date-picker
            v-model="form.scheduleStart"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="留空表示立即生效"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="计划结束">
          <el-date-picker
            v-model="form.scheduleEnd"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="留空表示长期有效"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="中文提示">
          <el-input v-model="form.message" placeholder="系统维护中，请稍后再试" />
        </el-form-item>
        <el-form-item label="英文提示">
          <el-input v-model="form.messageEn" placeholder="The system is under maintenance." />
        </el-form-item>
        <el-form-item label="越南语提示">
          <el-input v-model="form.messageVi" placeholder="Hệ thống đang bảo trì, vui lòng thử lại sau." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确定并下发</el-button>
          <el-button @click="dialog.visible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Maintenance" lang="ts">
import { listMaintenance, saveMaintenance, pushMaintenance } from '@/api/system/maintenance';
import type { MaintenanceForm, MaintenanceItem } from '@/api/system/maintenance/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import modal from '@/plugins/modal';

const rows = ref<MaintenanceItem[]>([]);
const downlinkVersion = ref(0);
const downlinkAt = ref<string | null>(null);
const { loading, withLoading } = useLoading(true);
const { loading: buttonLoading, withLoading: withButtonLoading } = useLoading();
const formRef = ref<ElFormInstance>();

const { dialog, openDialog } = useDialogState('维护开关配置');

const initForm: MaintenanceForm = {
  moduleCode: '',
  message: '',
  messageEn: '',
  messageVi: '',
  isMaintenance: 0,
  scheduleStart: null,
  scheduleEnd: null
};
const form = ref<MaintenanceForm>({ ...initForm });
const rules = {
  moduleCode: [{ required: true, message: '模块不能为空', trigger: 'change' }],
  isMaintenance: [{ required: true, message: '请选择是否维护中', trigger: 'change' }]
};

const moduleLabels: Record<string, string> = {
  backend: '管理后台',
  lobby: '游戏大厅',
  game: '游戏内',
  download: '下载和推广站',
  client: '客户端'
};
const moduleLabel = (code?: string) => (code ? moduleLabels[code] || code : '—');

const fmt = (value?: string | null) => (value ? String(value).slice(0, 19).replace('T', ' ') : '—');

const getList = async () => {
  await withLoading(async () => {
    const res = await listMaintenance();
    rows.value = res.data?.items ?? [];
    downlinkVersion.value = res.data?.downlinkVersion ?? 0;
    downlinkAt.value = res.data?.downlinkAt ?? null;
  });
};

const handleEdit = (row: MaintenanceItem) => {
  form.value = {
    moduleCode: row.moduleCode,
    message: row.message,
    messageEn: row.messageEn,
    messageVi: row.messageVi,
    isMaintenance: row.isMaintenance ?? 0,
    scheduleStart: row.scheduleStart ?? null,
    scheduleEnd: row.scheduleEnd ?? null
  };
  openDialog(`配置维护开关 - ${row.moduleName}`);
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    const action = form.value.isMaintenance === 1 ? '开启' : '关闭';
    await modal.confirm(`确认${action}「${moduleLabel(form.value.moduleCode)}」的维护状态？保存后立即下发到游戏侧。`);
    await withButtonLoading(async () => {
      const res = await saveMaintenance(form.value);
      downlinkVersion.value = res.data?.version ?? downlinkVersion.value;
    });
    modal.msgSuccess('已保存并下发');
    dialog.visible = false;
    await getList();
  });
};

const handlePush = async () => {
  await modal.confirm('确认把当前配置强制重推到游戏侧？用于 Redis 配置丢失或入口层未生效时兜底。');
  const res = await pushMaintenance();
  modal.msgSuccess(`已重推，版本 ${res.data?.version ?? '-'}`);
  await getList();
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.muted {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>

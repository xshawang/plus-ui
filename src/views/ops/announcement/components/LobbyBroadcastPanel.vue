<template>
  <el-card v-loading="loading" shadow="hover" class="table-panel broadcast-panel">
    <template #header>
      <div class="toolbar-shell">
        <div class="table-heading">
          <h3>大厅顶部广播</h3>
          <p>
            维护
            <code>broadCastConfig.listBroadCast</code>
            ，保存后同步到客户端配置并加密回写
            <code>8go88.bin</code>
            。
          </p>
        </div>
        <div class="toolbar-actions">
          <el-tag :type="broadcast.config.isSequence ? 'success' : 'warning'">
            {{ broadcast.config.isSequence ? '顺序播放' : '随机播放' }}
          </el-tag>
          <el-tag type="info">共 {{ broadcast.listBroadCast.length }} 条</el-tag>
          <el-button icon="Refresh" :loading="loading" @click="loadConfig">重新读取</el-button>
          <el-button
            v-hasPermi="['ops:announcement:edit']"
            type="primary"
            icon="Check"
            :loading="saving"
            @click="saveConfig"
          >
            保存并同步
          </el-button>
        </div>
      </div>
    </template>

    <el-alert
      title="这里的修改属于暂存状态，点击“保存并同步”后才会更新客户端配置表和 8go88.bin。"
      type="info"
      :closable="false"
      show-icon
      class="mb-3"
    />

    <el-form :inline="true" class="broadcast-settings">
      <el-form-item label="播放方式">
        <el-switch v-model="broadcast.config.isSequence" active-text="顺序" inactive-text="随机" inline-prompt />
      </el-form-item>
      <el-form-item label="广播条数">
        <el-input-number v-model="targetCount" :min="1" :max="50" :precision="0" controls-position="right" />
        <el-button class="ml-2" @click="applyTargetCount">调整条数</el-button>
      </el-form-item>
      <el-form-item label="批量时长">
        <el-input-number v-model="batchDuration" :min="1" :max="300" :precision="0" controls-position="right" />
        <span class="unit">秒</span>
        <el-button class="ml-2" @click="applyBatchDuration">应用到全部</el-button>
      </el-form-item>
      <el-form-item>
        <el-button v-hasPermi="['ops:announcement:edit']" type="success" plain icon="Plus" @click="openAdd">
          新增广播
        </el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-if="broadcast.listBroadCast.length > 0"
      border
      :data="broadcast.listBroadCast"
      row-key="rowKey"
      class="data-table"
    >
      <el-table-column label="序号" type="index" width="70" align="center" />
      <el-table-column label="广播内容" min-width="520">
        <template #default="{ row }">
          <span class="broadcast-text">{{ row.text }}</span>
        </template>
      </el-table-column>
      <el-table-column label="播放时长" width="130" align="center">
        <template #default="{ row, $index }">
          <el-input-number
            v-model="row.time"
            :min="1"
            :max="300"
            :precision="0"
            controls-position="right"
            size="small"
            @change="updateDuration($index, $event)"
          />
          <span class="unit">秒</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" align="center" fixed="right">
        <template #default="{ row, $index }">
          <div class="operation-grid">
            <el-button link type="primary" :disabled="$index === 0" @click="moveItem($index, -1)">上移</el-button>
            <el-button
              link
              type="primary"
              :disabled="$index === broadcast.listBroadCast.length - 1"
              @click="moveItem($index, 1)"
            >
              下移
            </el-button>
            <el-button v-hasPermi="['ops:announcement:edit']" link type="primary" @click="openEdit($index)">
              编辑
            </el-button>
            <el-button v-hasPermi="['ops:announcement:edit']" link type="danger" @click="removeItem($index)">
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="broadcast.listBroadCast.length === 0" description="当前没有顶部广播，请新增记录后保存" />

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body destroy-on-close>
      <el-form ref="itemFormRef" :model="itemForm" :rules="rules" label-width="90px">
        <el-form-item label="广播内容" prop="text">
          <el-input
            v-model="itemForm.text"
            type="textarea"
            :rows="7"
            maxlength="1000"
            show-word-limit
            placeholder="支持客户端富文本颜色标签，例如：系统 <color=#f76f00>NẠP/RÚT</c> 已升级"
          />
        </el-form-item>
        <el-form-item label="播放时长" prop="time">
          <el-input-number v-model="itemForm.time" :min="1" :max="300" :precision="0" controls-position="right" />
          <span class="unit">秒</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitItem">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup name="LobbyBroadcastPanel" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { LobbyBroadcastConfig, LobbyBroadcastItem } from '@/api/ops/announcement/types';
import { getLobbyBroadcast, saveLobbyBroadcast } from '@/api/ops/announcement';
import modal from '@/plugins/modal';

const loading = ref(false);
const saving = ref(false);
const targetCount = ref(1);
const batchDuration = ref(10);
const editingIndex = ref<number | null>(null);
const itemFormRef = ref();
const dialog = reactive({ visible: false, title: '' });
const itemForm = reactive<LobbyBroadcastItem>({ text: '', time: 10 });
const broadcast = reactive<LobbyBroadcastConfig>({
  config: { isSequence: true },
  listBroadCast: []
});

const rules = {
  text: [{ required: true, message: '请输入广播内容', trigger: 'blur' }],
  time: [{ required: true, message: '请输入播放时长', trigger: 'change' }]
};

const normalizeRowKeys = () => {
  broadcast.listBroadCast.forEach((item, index) => {
    (item as LobbyBroadcastItem & { rowKey?: string }).rowKey = `${Date.now()}-${index}-${Math.random()}`;
  });
};

const loadConfig = async () => {
  loading.value = true;
  try {
    const res = await getLobbyBroadcast();
    broadcast.config.isSequence = res.data?.config?.isSequence ?? true;
    broadcast.listBroadCast = res.data?.listBroadCast || [];
    normalizeRowKeys();
    targetCount.value = Math.max(1, broadcast.listBroadCast.length);
    batchDuration.value = broadcast.listBroadCast[0]?.time || 10;
  } finally {
    loading.value = false;
  }
};

const applyTargetCount = async () => {
  const nextCount = Math.min(50, Math.max(1, Math.floor(targetCount.value || 1)));
  const currentCount = broadcast.listBroadCast.length;
  if (nextCount < currentCount) {
    await modal.confirm(
      `将从末尾删除 ${currentCount - nextCount} 条广播；该操作在点击“保存并同步”后才写入客户端，确认调整吗？`
    );
    broadcast.listBroadCast.splice(nextCount);
  } else if (nextCount > currentCount) {
    for (let index = currentCount; index < nextCount; index++) {
      broadcast.listBroadCast.push({
        text: '',
        time: batchDuration.value || 10,
        rowKey: `${Date.now()}-${index}`
      } as LobbyBroadcastItem);
    }
  }
  targetCount.value = nextCount;
  normalizeRowKeys();
};

const applyBatchDuration = () => {
  const duration = Math.min(300, Math.max(1, Math.floor(batchDuration.value || 1)));
  batchDuration.value = duration;
  broadcast.listBroadCast.forEach(item => {
    item.time = duration;
  });
  modal.msgSuccess(`已将全部广播时长设为 ${duration} 秒`);
};

const updateDuration = (index: number, value: string | number | undefined) => {
  const duration = Number(value || 1);
  broadcast.listBroadCast[index].time = Math.min(300, Math.max(1, Math.floor(duration)));
};

const openAdd = () => {
  editingIndex.value = null;
  itemForm.text = '';
  itemForm.time = batchDuration.value || 10;
  dialog.title = '新增顶部广播';
  dialog.visible = true;
};

const openEdit = (index: number) => {
  editingIndex.value = index;
  Object.assign(itemForm, broadcast.listBroadCast[index]);
  dialog.title = `编辑第 ${index + 1} 条广播`;
  dialog.visible = true;
};

const submitItem = () => {
  itemFormRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    const item: LobbyBroadcastItem = {
      text: itemForm.text,
      time: itemForm.time
    };
    if (editingIndex.value === null) {
      broadcast.listBroadCast.push(item);
    } else {
      broadcast.listBroadCast.splice(editingIndex.value, 1, item);
    }
    normalizeRowKeys();
    targetCount.value = broadcast.listBroadCast.length;
    dialog.visible = false;
  });
};

const moveItem = (index: number, offset: number) => {
  const target = index + offset;
  if (target < 0 || target >= broadcast.listBroadCast.length) return;
  const [item] = broadcast.listBroadCast.splice(index, 1);
  broadcast.listBroadCast.splice(target, 0, item);
  normalizeRowKeys();
};

const removeItem = async (index: number) => {
  if (broadcast.listBroadCast.length <= 1) {
    modal.msgWarning('顶部广播至少保留 1 条');
    return;
  }
  const row = broadcast.listBroadCast[index];
  await modal.confirm(`确认删除第 ${index + 1} 条广播“${preview(row.text)}”吗？`);
  broadcast.listBroadCast.splice(index, 1);
  targetCount.value = broadcast.listBroadCast.length;
  normalizeRowKeys();
};

const preview = (text?: string) => {
  if (!text) return '空内容';
  return text.length > 30 ? `${text.slice(0, 30)}...` : text;
};

const saveConfig = async () => {
  if (broadcast.listBroadCast.length === 0) {
    modal.msgWarning('顶部广播至少保留 1 条');
    return;
  }
  const emptyIndex = broadcast.listBroadCast.findIndex(item => !item.text?.trim());
  if (emptyIndex >= 0) {
    modal.msgWarning(`第 ${emptyIndex + 1} 条广播内容为空`);
    return;
  }
  const invalidIndex = broadcast.listBroadCast.findIndex(
    item => !Number.isInteger(item.time) || item.time < 1 || item.time > 300
  );
  if (invalidIndex >= 0) {
    modal.msgWarning(`第 ${invalidIndex + 1} 条广播时长必须为 1~300 秒`);
    return;
  }
  await modal.confirm(
    `确认同步 ${broadcast.listBroadCast.length} 条顶部广播？将更新 go88_client_config 并加密回写 8go88.bin。`
  );
  saving.value = true;
  try {
    await saveLobbyBroadcast({
      config: { isSequence: broadcast.config.isSequence },
      listBroadCast: broadcast.listBroadCast.map(({ text, time }) => ({ text, time }))
    });
    modal.msgSuccess('顶部广播已同步到客户端配置，并回写 8go88.bin');
    await loadConfig();
  } finally {
    saving.value = false;
  }
};

onMounted(loadConfig);
</script>

<style scoped lang="scss">
.broadcast-settings {
  padding: 14px 16px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.broadcast-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.operation-grid {
  display: grid;
  grid-template-columns: repeat(2, 48px);
  justify-content: center;
  row-gap: 6px;
  column-gap: 20px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.unit {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
}
</style>

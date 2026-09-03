<template>
  <div class="p-2 app-container catalog-rtp-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>Slot 游戏 RTP 运营配置</h3>
            <span class="text-gray-400 text-sm">保存后由 go88-service-game-slot 热生效（无需重启）</span>
          </div>
          <div class="toolbar-actions">
            <el-button type="primary" plain icon="Refresh" :loading="loading" @click="load">重新加载</el-button>
            <el-button v-hasPermi="['catalog:rtp:save']" type="primary" icon="Check" :loading="saving" @click="handleSave">
              保存配置
            </el-button>
          </div>
        </div>
      </template>

      <div class="mb-3 flex flex-wrap items-center gap-4 text-sm">
        <div class="flex items-center gap-1">
          <span>全局状态</span>
          <el-tag size="small" :type="enabled ? 'success' : 'info'">{{ enabled ? '已启用' : '已停用' }}</el-tag>
        </div>
        <div class="flex items-center gap-1">
          <span>默认 RTP 缩放</span>
          <span class="font-mono">{{ defaultRtpScale }}</span>
        </div>
        <el-tag size="small" type="info">{{ rows.length }} 款游戏</el-tag>
        <span v-if="updatedAt" class="text-gray-400">
          最近生效：{{ formatTime(updatedAt) }}<template v-if="updatedBy">（{{ updatedBy }}）</template>
        </span>
      </div>
      <div class="mb-3 text-xs text-gray-400">
        说明：RTP 缩放控制赔多少（0.10~3.00）；中奖/未中奖保留率控制“摇出的结果是否保留”，
        调小分别会减少/增加中奖频率，两者配合调 RTP 与中奖率。
      </div>

      <el-table v-loading="loading" border class="data-table" :data="rows">
        <el-table-column label="游戏" align="center" width="200">
          <template #default="{ row }">
            <div>{{ row.name }}</div>
            <div class="text-xs text-gray-400 font-mono">{{ row.gameCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="启用" align="center" width="90">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" />
          </template>
        </el-table-column>
        <el-table-column label="RTP 缩放" align="center" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.rtpScale" :min="0.1" :max="3" :step="0.05" :precision="2" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="中奖保留率" align="center" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.winKeepRate" :min="0" :max="1" :step="0.05" :precision="2" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="未中奖保留率" align="center" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.loseKeepRate" :min="0" :max="1" :step="0.05" :precision="2" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="最近更新" align="center" min-width="170">
          <template #default="{ row }">
            <template v-if="row.updatedAt">
              <div>{{ formatTime(row.updatedAt) }}</div>
              <div v-if="row.updatedBy" class="text-xs text-gray-400">{{ row.updatedBy }}</div>
            </template>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="CatalogRtp" lang="ts">
import { getRtpGames, saveRtpConfig } from '@/api/catalog/rtp';
import type { RtpGameRow, RtpSaveBody } from '@/api/catalog/rtp/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { ref } from 'vue';

const rows = ref<RtpGameRow[]>([]);
const enabled = ref(true);
const defaultRtpScale = ref(1);
const updatedAt = ref<number>();
const updatedBy = ref('');
const saving = ref(false);
const { loading, withLoading } = useLoading(true);

const load = async () => {
  await withLoading(async () => {
    const res = await getRtpGames();
    rows.value = (res.data?.list || []).map(row => ({
      ...row,
      enabled: row.enabled !== false,
      rtpScale: row.rtpScale ?? res.data?.defaultRtpScale ?? 1,
      winKeepRate: row.winKeepRate ?? 1,
      loseKeepRate: row.loseKeepRate ?? 1
    }));
    enabled.value = res.data?.enabled !== false;
    defaultRtpScale.value = res.data?.defaultRtpScale ?? 1;
    updatedAt.value = res.data?.updatedAt;
    updatedBy.value = res.data?.updatedBy || '';
  });
};

const handleSave = async () => {
  saving.value = true;
  try {
    const payload: RtpSaveBody = {
      games: rows.value.map(row => ({
        gameCode: row.gameCode,
        enabled: row.enabled !== false,
        rtpScale: row.rtpScale,
        winKeepRate: row.winKeepRate,
        loseKeepRate: row.loseKeepRate
      }))
    };
    await saveRtpConfig(payload);
    modal.msgSuccess('配置已下发并生效');
    await load();
  } finally {
    saving.value = false;
  }
};

const formatTime = (value?: number) => (value == null ? '—' : new Date(value).toLocaleString());

onMounted(() => {
  load();
});
</script>

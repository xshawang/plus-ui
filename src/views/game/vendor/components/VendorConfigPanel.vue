<template>
  <el-card v-loading="loading" shadow="hover">
    <template #header>
      <div class="panel-header">
        <h3>OneAPI 全局接入配置</h3>
        <div>
          <el-tag :type="form.status === 1 ? 'success' : 'info'">{{ form.status === 1 ? '已启用' : '已停用' }}</el-tag>
          <span v-if="form.lastTestAt" class="muted">最近测试：{{ form.lastTestAt }} · {{ form.lastTestResult }}</span>
        </div>
      </div>
    </template>
    <el-form :model="form" label-width="150px" class="config-form">
      <el-divider content-position="left">站点与凭据（保存后加密入库，作为全局配置）</el-divider>
      <el-form-item label="站点地址" required>
        <el-input v-model="form.apiBaseUrl" placeholder="https://<oneapi_site>，Mock 联调填 http://127.0.0.1:9205/mock/oneapi" />
      </el-form-item>
      <el-form-item label="X-API-Key">
        <el-input v-model="form.apiKey" placeholder="不修改请保持掩码" show-password />
      </el-form-item>
      <el-form-item label="API Secret">
        <el-input v-model="form.apiSecret" placeholder="不修改请保持掩码" show-password />
        <el-button v-hasPermi="['game:vendor:secret']" link type="primary" class="ml8" @click="reveal">查看明文</el-button>
      </el-form-item>
      <el-form-item label="username 前缀">
        <el-input v-model="form.usernamePrefix" :disabled="form.prefixLocked === 1" style="width: 200px" />
        <span class="muted ml8">username = 前缀 + uid{{ form.prefixLocked === 1 ? '（已有玩家进入过游戏，已锁定）' : '' }}</span>
      </el-form-item>

      <el-divider content-position="left">币种与金额换算</el-divider>
      <el-form-item label="币种">
        <el-input v-model="form.currency" style="width: 200px" />
        <span class="muted ml8">发送给 OneAPI 的币种，越南盾为 VND(K)</span>
      </el-form-item>
      <el-form-item label="换算倍数">
        <el-radio-group v-model="form.unitMultiplier">
          <el-radio :value="1000">1000（K 单位：1K = 1000 VND）</el-radio>
          <el-radio :value="1">1（不换算）</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="返回余额取整">
        <el-select v-model="form.balanceRoundMode" style="width: 160px"><el-option v-for="m in modes" :key="m.v" :label="m.l" :value="m.v" /></el-select>
        <span class="muted ml8">小数位</span>
        <el-input-number v-model="form.balanceScale" :min="0" :max="3" style="width: 110px" class="ml8" />
      </el-form-item>
      <el-form-item label="入参非整数取整">
        <el-select v-model="form.amountRoundMode" style="width: 160px"><el-option v-for="m in modes" :key="m.v" :label="m.l" :value="m.v" /></el-select>
        <span class="muted ml8">×1000 后不是整数时扣款、加款的取整方式</span>
      </el-form-item>
      <el-form-item label="默认有效投注比例">
        <el-input v-model="form.defaultValidRatio" placeholder='{"DEFAULT":100,"LIVE":100}' />
        <span class="muted">导入游戏时按类别写入「有效投注比例」，已有比例不覆盖</span>
      </el-form-item>

      <el-divider content-position="left">启动与回调</el-divider>
      <el-form-item label="返回大厅地址"><el-input v-model="form.lobbyUrl" placeholder="游戏内返回大厅时跳转的地址" /></el-form-item>
      <el-form-item label="默认语言 / 平台">
        <el-select v-model="form.defaultLanguage" style="width: 140px"><el-option v-for="l in langs" :key="l" :label="l" :value="l" /></el-select>
        <el-select v-model="form.defaultPlatform" style="width: 140px" class="ml8"><el-option label="H5" value="H5" /><el-option label="web" value="web" /></el-select>
      </el-form-item>
      <el-form-item label="回调 IP 白名单">
        <el-input v-model="form.callbackIpAllowlist" type="textarea" :rows="2" placeholder="多个用逗号或换行分隔，支持 CIDR；为空只验签（仅限联调）" />
      </el-form-item>
      <el-form-item label="会话有效期(秒)"><el-input-number v-model="form.sessionTtlSeconds" :min="300" :step="3600" /></el-form-item>
      <el-form-item label="超时(毫秒)">
        <span class="muted">连接</span><el-input-number v-model="form.connectTimeoutMs" :min="500" :step="500" class="ml8" />
        <span class="muted ml8">读取</span><el-input-number v-model="form.readTimeoutMs" :min="1000" :step="1000" class="ml8" />
      </el-form-item>
      <el-form-item label="接入开关">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        <span class="muted ml8">停用后玩家无法进入三方游戏；已在进行中的回调照常处理，避免资金卡住</span>
      </el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
      <el-form-item>
        <el-button v-hasPermi="['game:vendor:edit']" type="primary" @click="save">保存</el-button>
        <el-button v-hasPermi="['game:vendor:edit']" :loading="testing" @click="test">测试连通</el-button>
        <el-button @click="load">重新读取</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getVendorConfig, getVendorSecret, saveVendorConfig, testVendorConfig } from '@/api/game/vendor';
import type { VendorConfigVO } from '@/api/game/vendor/types';

const loading = ref(false);
const testing = ref(false);
const form = reactive<Partial<VendorConfigVO>>({});
const modes = [{ v: 'CEILING', l: '向上取整' }, { v: 'FLOOR', l: '向下取整' }, { v: 'HALF_UP', l: '四舍五入' }];
const langs = ['vi', 'zh', 'en', 'hk', 'th', 'id', 'pt', 'ko', 'ja'];

async function load() {
  loading.value = true;
  try {
    const res: any = await getVendorConfig();
    Object.assign(form, res.data ?? {});
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!form.apiBaseUrl) {
    ElMessage.warning('请填写站点地址');
    return;
  }
  await saveVendorConfig({ ...form });
  ElMessage.success('保存成功');
  load();
}

async function test() {
  testing.value = true;
  try {
    const res: any = await testVendorConfig();
    const d = res.data ?? {};
    if (d.ok) ElMessage.success(`连通正常：${d.vendorCount} 家厂商，耗时 ${d.costMs}ms`);
    else ElMessage.error(`连通失败：${d.status} ${d.message ?? ''}`);
    load();
  } finally {
    testing.value = false;
  }
}

async function reveal() {
  const res: any = await getVendorSecret();
  const d = res.data ?? {};
  ElMessageBox.alert(`X-API-Key：${d.apiKey || '（未配置）'}\nAPI Secret：${d.apiSecret || '（未配置）'}`, '凭据明文（已记录查看审计）',
    { customStyle: { whiteSpace: 'pre-wrap', wordBreak: 'break-all' } as any });
}

onMounted(load);
</script>

<style scoped>
.panel-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.panel-header h3 { margin: 0; font-size: 15px; }
.config-form { max-width: 860px; }
.muted { color: var(--el-text-color-secondary); font-size: 12px; margin-left: 8px; }
.ml8 { margin-left: 8px; }
</style>

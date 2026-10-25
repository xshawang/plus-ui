<template>
  <div class="p-2 app-container ops-apppack-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>APP包管理</h3>
            <p>维护「打包APP / 原生马甲包」：图标、APP包名、应用地址（极速/原生·轻量/完整）与打包状态。</p>
          </div>
          <div class="toolbar-actions">
            <el-input
              v-model="queryParams.keyword"
              placeholder="APP名称 / 包名"
              clearable
              style="width: 180px"
              @keyup.enter="handleQuery"
            />
            <el-button plain icon="Search" @click="handleQuery">搜索</el-button>
            <el-button v-hasPermi="['ops:apppack:edit']" plain icon="Setting" @click="openPublicConfig">公共配置</el-button>
            <el-button v-hasPermi="['ops:apppack:publish']" plain @click="handleBuild(2)">生成IOS包</el-button>
            <el-button v-hasPermi="['ops:apppack:publish']" type="primary" @click="handleBuild(1)">生成Android包</el-button>
            <el-button v-hasPermi="['ops:apppack:add']" plain icon="Plus" @click="openAppDialog()">新增APP</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="打包APP" name="1" />
        <el-tab-pane label="原生马甲包" name="2" />
      </el-tabs>

      <el-table v-loading="loading" border :data="rows" empty-text="暂无数据">
        <el-table-column label="图标" align="center" width="90">
          <template #default="{ row }">
            <el-image v-if="row.appIconUrl" :src="row.appIconUrl" fit="cover" style="width: 44px; height: 44px; border-radius: 6px" />
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="系统" align="center" width="110">
          <template #default="{ row }">
            <span class="system-cell">
              <el-icon><component :is="row.platform === 2 ? 'Apple' : 'Cellphone'" /></el-icon>
              {{ row.platformName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="APP名称" align="center" width="120">
          <template #default="{ row }">{{ row.appName || '—' }}</template>
        </el-table-column>
        <el-table-column label="APP包名" align="center" min-width="200" :show-overflow-tooltip="true">
          <template #default="{ row }">{{ row.packageName || '—' }}</template>
        </el-table-column>

        <!-- 应用地址：一格多行，与「版本号 / 状态 / 操作」三列逐行对齐（图片口径） -->
        <el-table-column label="应用地址" min-width="340">
          <template #default="{ row }">
            <div v-for="res in row.resources" :key="res.resourceId" class="resource-line">
              <span class="resource-name">{{ res.resourceTypeName }}：</span>
              <a class="resource-url" :href="res.resourceUrl || 'javascript:void(0)'" :title="res.resourceUrl" target="_blank">
                {{ res.resourceUrl || '待回填包地址' }}
              </a>
              <span class="resource-size">{{ fmtSize(res.fileSize) }}</span>
            </div>
            <div v-if="!row.resources || !row.resources.length" class="text-gray-400">尚未生成，请点右上角「生成Android包 / 生成IOS包」</div>
          </template>
        </el-table-column>
        <el-table-column label="版本号" align="center" width="95">
          <template #default="{ row }">
            <div v-for="res in row.resources" :key="res.resourceId" class="resource-line">{{ res.versionCode || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="105">
          <template #default="{ row }">
            <div v-for="res in row.resources" :key="res.resourceId" class="resource-line">
              <el-tag :type="packStatusType(res.packStatus)" size="small">{{ res.packStatusName }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <!-- 操作列：图片口径一行 = 一个资源行的「下载 / 替换 / google登录指纹 / Facebook登录密钥」；
             列宽必须容纳四个链接（实测约 300px），否则会被居中裁切成「错位」效果（2026-10-12 修复） -->
        <el-table-column label="操作" align="center" min-width="330">
          <template #default="{ row }">
            <div v-for="res in row.resources" :key="res.resourceId" class="resource-ops">
              <a v-if="res.resourceUrl" :href="res.resourceUrl" target="_blank" class="op-link">下载</a>
              <el-button v-hasPermi="['ops:apppack:edit']" link type="primary" @click="openReplace(row, res)">替换</el-button>
              <el-button
                v-if="res.googleLoginFingerprint"
                v-hasPermi="['ops:apppack:edit']"
                link
                type="primary"
                @click="openSecretDialog(res, 'fingerprint')"
              >google登录指纹</el-button>
              <el-button
                v-if="res.facebookLoginSecret"
                v-hasPermi="['ops:apppack:edit']"
                link
                type="primary"
                @click="openSecretDialog(res, 'secret')"
              >Facebook登录密钥</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.packedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作人" align="center" width="110">
          <template #default="{ row }">{{ row.packedBy || '—' }}</template>
        </el-table-column>
        <el-table-column label="" align="center" width="60" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['ops:apppack:edit']" link type="primary" @click="openAppDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
      <div class="table-footer">共 {{ total }} 条</div>
    </el-card>

    <!-- 公共配置（图片弹窗：极速APP / 原生APP 总开关 + 分端开关 + 资源类型） -->
    <el-dialog v-model="publicDialog.visible" title="公共配置" width="620px" append-to-body>
      <el-form label-width="150px">
        <el-form-item label="极速APP">
          <el-switch v-model="cfg.fast_app_enabled" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="　Android极速APP">
          <el-switch v-model="cfg.fast_app_android" active-value="1" inactive-value="0" :disabled="cfg.fast_app_enabled !== '1'" />
        </el-form-item>
        <el-form-item label="　iOS极速APP">
          <el-switch v-model="cfg.fast_app_ios" active-value="1" inactive-value="0" :disabled="cfg.fast_app_enabled !== '1'" />
        </el-form-item>
        <el-form-item label="原生APP">
          <el-switch v-model="cfg.native_app_enabled" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="　Android原生APP">
          <el-switch v-model="cfg.native_app_android" active-value="1" inactive-value="0" :disabled="cfg.native_app_enabled !== '1'" />
        </el-form-item>
        <el-form-item label="　　Android原生APP资源">
          <el-radio-group v-model="cfg.android_resource_type" :disabled="cfg.native_app_android !== '1'">
            <el-radio value="full">完整资源(约110M)</el-radio>
            <el-radio value="light">轻量资源(约70M,安装后再加载)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="　iOS原生APP">
          <el-switch v-model="cfg.native_app_ios" active-value="1" inactive-value="0" :disabled="cfg.native_app_enabled !== '1'" />
        </el-form-item>
        <el-form-item label="　　iOS原生APP资源">
          <el-radio-group v-model="cfg.ios_resource_type" :disabled="cfg.native_app_ios !== '1'">
            <el-radio value="full">完整资源(约110M)</el-radio>
            <el-radio value="light">轻量资源(约70M,安装后再加载)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publicDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="submitPublicConfig">确 认</el-button>
      </template>
    </el-dialog>

    <!-- 替换（回填）资源行 -->
    <el-dialog v-model="replaceDialog.visible" :title="'替换资源：' + replaceDialog.title" width="620px" append-to-body destroy-on-close>
      <el-form :model="replaceForm" label-width="130px">
        <el-form-item label="包地址">
          <el-input v-model="replaceForm.resourceUrl" placeholder="CI 产出的真实包地址（http/https）" />
        </el-form-item>
        <el-form-item label="文件大小(MB)">
          <el-input-number v-model="replaceForm.fileSizeMb" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="replaceForm.versionCode" placeholder="如 1.1.74 / 6.9.18" />
        </el-form-item>
        <el-form-item label="google登录指纹">
          <el-input v-model="replaceForm.googleLoginFingerprint" placeholder="Android 原生包专用，可留空" />
        </el-form-item>
        <el-form-item label="Facebook登录密钥">
          <el-input v-model="replaceForm.facebookLoginSecret" placeholder="Android 原生包专用，可留空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replaceDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="submitReplace">确 认</el-button>
      </template>
    </el-dialog>

    <!-- 指纹 / 密钥单独维护 -->
    <el-dialog v-model="secretDialog.visible" :title="secretDialog.title" width="560px" append-to-body destroy-on-close>
      <el-input v-model="secretDialog.value" type="textarea" :rows="3" :placeholder="secretDialog.placeholder" />
      <template #footer>
        <el-button @click="secretDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="submitSecret">确 认</el-button>
      </template>
    </el-dialog>

    <!-- 新增 / 编辑 APP -->
    <el-dialog v-model="appDialog.visible" :title="appDialog.title" width="620px" append-to-body destroy-on-close>
      <el-form :model="appForm" label-width="120px">
        <el-form-item label="系统">
          <el-radio-group v-model="appForm.platform">
            <el-radio :value="1">Android</el-radio>
            <el-radio :value="2">iOS</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="APP名称">
          <el-input v-model="appForm.appName" placeholder="如 N188.COM" />
        </el-form-item>
        <el-form-item label="APP包名">
          <el-input v-model="appForm.packageName" placeholder="如 com.owvcg.vvhei2562.yvok" />
        </el-form-item>
        <el-form-item label="APP图标地址">
          <el-input v-model="appForm.appIconUrl" placeholder="图标 URL（选填）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="appForm.sortOrder" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="submitApp">确 认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpsAppPack" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addAppPackage,
  buildAppPackage,
  getAppPackPublicConfig,
  listAppPackage,
  replaceAppResource,
  saveAppPackPublicConfig,
  updateAppPackage
} from '@/api/ops/app-pack';
import type { AppPackageForm, AppPackageQuery, AppPackageVO, AppPackResourceForm, AppPackResourceVO } from '@/api/ops/app-pack/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<AppPackageVO[]>([]);
const total = ref(0);
const activeTab = ref('1');
const publicDialog = reactive({ visible: false });
const replaceDialog = reactive({ visible: false, title: '' });
const secretDialog = reactive({ visible: false, title: '', value: '', placeholder: '', resourceId: 0, field: 'fingerprint' });
const appDialog = reactive({ visible: false, title: '' });

const data = reactive<{
  queryParams: AppPackageQuery;
  replaceForm: AppPackResourceForm & { fileSizeMb?: number };
  appForm: AppPackageForm;
  cfg: Record<string, string>;
}>({
  queryParams: { pageNum: 1, pageSize: 10, appType: 1 },
  replaceForm: {},
  appForm: { platform: 1, sortOrder: 100 },
  cfg: {
    fast_app_enabled: '1',
    fast_app_android: '1',
    fast_app_ios: '1',
    native_app_enabled: '1',
    native_app_android: '1',
    native_app_ios: '1',
    android_resource_type: 'light',
    ios_resource_type: 'full'
  }
});
const { queryParams, replaceForm, appForm, cfg } = toRefs(data);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

/** 字节 → 人类可读（1024 进制，保留两位，与截图 6.82M / 57.91M 口径一致） */
const fmtSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) {
    return '—';
  }
  const units = ['B', 'K', 'M', 'G'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return (idx === 0 ? value : value.toFixed(2)) + units[idx];
};

const packStatusType = (status?: number) => (status === 1 ? 'success' : status === 2 ? 'warning' : 'danger');

/**
 * 表格插槽回传的是 element-plus 的 DefaultRow（弱类型），
 * 模板入口统一用宽松类型接收再收敛到业务字段，避免为每处调用维护类型断言。
 */
type RowLike = Record<string, any>;

const getList = async () => {
  queryParams.value.appType = Number(activeTab.value);
  try {
    await withLoading(async () => {
      const res = await listAppPackage(queryParams.value);
      rows.value = res.data?.rows || [];
      total.value = res.data?.total || 0;
    });
  } catch (error) {
    modal.msgError('APP包列表加载失败，请稍后重试');
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const handleTabChange = () => {
  queryParams.value.pageNum = 1;
  rows.value = [];
  total.value = 0;
  getList();
};

/** 生成包受理（图片「生成IOS包 / 生成Android包」） */
const handleBuild = async (platform: number) => {
  const label = platform === 1 ? 'Android' : 'IOS';
  await modal.confirm(`确认按「公共配置」为当前列表生成 ${label} 安装包？生成后资源行状态为「打包中」，待流水线产出后用「替换」回填。`);
  try {
    const res = await buildAppPackage({ appType: Number(activeTab.value), platform });
    modal.msgSuccess(res.data?.tip || '已受理');
    getList();
  } catch (error) {
    modal.msgError('生成包失败，请检查公共配置与 APP 维护情况');
  }
};

const openPublicConfig = async () => {
  try {
    const res = await getAppPackPublicConfig();
    (res.data || []).forEach((item) => {
      cfg.value[String(item.configKey)] = String(item.configValue ?? '');
    });
    publicDialog.visible = true;
  } catch (error) {
    modal.msgError('公共配置加载失败');
  }
};

const submitPublicConfig = async () => {
  try {
    await saveAppPackPublicConfig({ ...cfg.value });
    modal.msgSuccess('公共配置已保存');
    publicDialog.visible = false;
  } catch (error) {
    modal.msgError('保存失败：开关只能是 0/1，资源类型只能是 full/light');
  }
};

const openReplace = (row: RowLike, res: RowLike) => {
  replaceForm.value = {
    resourceId: res.resourceId,
    appId: row.appId,
    resourceType: res.resourceType,
    platform: res.platform,
    resourceUrl: res.resourceUrl,
    versionCode: res.versionCode,
    fileSizeMb: res.fileSize ? Number((res.fileSize / 1024 / 1024).toFixed(2)) : undefined,
    googleLoginFingerprint: res.googleLoginFingerprint,
    facebookLoginSecret: res.facebookLoginSecret
  };
  replaceDialog.title = `${row.appName} / ${res.resourceTypeName}`;
  replaceDialog.visible = true;
};

const submitReplace = async () => {
  if (!replaceForm.value.resourceUrl) {
    modal.msgWarning('请填写包地址');
    return;
  }
  const payload: AppPackResourceForm = {
    resourceId: replaceForm.value.resourceId,
    resourceUrl: replaceForm.value.resourceUrl,
    versionCode: replaceForm.value.versionCode,
    fileSize: replaceForm.value.fileSizeMb ? Math.round(replaceForm.value.fileSizeMb * 1024 * 1024) : undefined,
    googleLoginFingerprint: replaceForm.value.googleLoginFingerprint,
    facebookLoginSecret: replaceForm.value.facebookLoginSecret
  };
  try {
    await replaceAppResource(payload);
    modal.msgSuccess('已替换并置为「打包成功」');
    replaceDialog.visible = false;
    getList();
  } catch (error) {
    modal.msgError('替换失败：请检查包地址是否为 http(s) 链接');
  }
};

const openSecretDialog = (res: RowLike, field: 'fingerprint' | 'secret') => {
  secretDialog.resourceId = res.resourceId;
  secretDialog.field = field;
  if (field === 'fingerprint') {
    secretDialog.title = 'google 登录指纹';
    secretDialog.placeholder = '粘贴 google 登录指纹';
    secretDialog.value = res.googleLoginFingerprint || '';
  } else {
    secretDialog.title = 'Facebook 登录密钥';
    secretDialog.placeholder = '粘贴 Facebook 登录密钥';
    secretDialog.value = res.facebookLoginSecret || '';
  }
  secretDialog.visible = true;
};

const submitSecret = async () => {
  const payload: AppPackResourceForm =
    secretDialog.field === 'fingerprint'
      ? { resourceId: secretDialog.resourceId, googleLoginFingerprint: secretDialog.value }
      : { resourceId: secretDialog.resourceId, facebookLoginSecret: secretDialog.value };
  try {
    await replaceAppResource(payload);
    modal.msgSuccess('已保存');
    secretDialog.visible = false;
    getList();
  } catch (error) {
    modal.msgError('保存失败');
  }
};

const openAppDialog = (row?: RowLike) => {
  appForm.value = row
    ? {
        appId: row.appId,
        appType: row.appType,
        platform: row.platform,
        appName: row.appName,
        packageName: row.packageName,
        appIconUrl: row.appIconUrl,
        sortOrder: row.sortOrder
      }
    : { appType: Number(activeTab.value), platform: 1, sortOrder: 100 };
  appDialog.title = row ? '编辑 APP' : '新增 APP';
  appDialog.visible = true;
};

const submitApp = async () => {
  if (!appForm.value.appName || !appForm.value.packageName) {
    modal.msgWarning('APP名称与APP包名必填');
    return;
  }
  appForm.value.appType = appForm.value.appType || Number(activeTab.value);
  try {
    if (appForm.value.appId) {
      await updateAppPackage(appForm.value);
    } else {
      await addAppPackage(appForm.value);
    }
    modal.msgSuccess('操作成功');
    appDialog.visible = false;
    getList();
  } catch (error) {
    modal.msgError('保存失败：同类型同系统下 APP 包名不能重复');
  }
};

onMounted(() => getList());
</script>

<style scoped>
.system-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.resource-line {
  height: 24px;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-name {
  color: #909399;
}

.resource-url {
  color: #409eff;
  text-decoration: none;
  margin-left: 4px;
}

.resource-size {
  margin-left: 8px;
  color: #303133;
}

.resource-ops {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 24px;
  line-height: 24px;
  white-space: nowrap;
  /* FIX(2026-10-12)：不再继承 .resource-line 的 overflow:hidden —— 操作列内容一旦超宽会被
     居中裁切，表现为「左半截/右半截」的错位；下面同时覆盖 element-plus 默认的
     .el-button+.el-button 左外边距，避免与 gap 叠加把整行撑出单元格。 */
  overflow: visible;
}

.resource-ops .el-button + .el-button {
  margin-left: 0;
}

.op-link {
  color: #409eff;
  text-decoration: none;
  font-size: 12px;
}

.table-footer {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>

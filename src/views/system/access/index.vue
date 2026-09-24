<template>
  <div class="p-2 app-container system-access-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleQuery">
        <el-tab-pane label="IP白名单" name="ip" />
        <el-tab-pane label="浏览器授权码" name="auth" />
        <el-tab-pane label="浏览器VPN信任域名" name="vpn" />
      </el-tabs>
      <el-form :inline="true" class="query-form" @submit.prevent>
        <el-form-item v-if="activeTab === 'ip'" label="后台域名主">
          <el-link type="primary" :href="domainLink(options.domainHint.backendDomain)" target="_blank">
            {{ options.domainHint.backendDomain || '—' }}
          </el-link>
        </el-form-item>
        <el-form-item v-if="activeTab === 'ip'" label="后台域名备">
          <el-link type="primary" :href="domainLink(options.domainHint.backupDomain)" target="_blank">
            {{ options.domainHint.backupDomain || '—' }}
          </el-link>
        </el-form-item>
        <el-form-item :label="keywordLabel">
          <el-input v-model="queryParams.keyword" :placeholder="keywordPlaceholder" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item v-if="activeTab !== 'ip'" label="状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>{{ tabTitle }}</h3>
            <p>
              共 {{ total }} 条记录；停服期间仅命中白名单且对应权限已勾选的入口保持可用。
            </p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['system:access:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增
            </el-button>
            <el-button
              v-hasPermi="['system:access:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate(rows[0])"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['system:access:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <template v-if="activeTab === 'ip'">
          <el-table-column label="IP" prop="ipAddr" min-width="240" :show-overflow-tooltip="true" />
          <el-table-column label="地区" prop="region" width="180" :show-overflow-tooltip="true" />
          <el-table-column label="访问权限" align="center" min-width="420">
            <template #default="{ row }">
              <el-checkbox :model-value="row.permBackend === 1" disabled>管理后台</el-checkbox>
              <el-checkbox :model-value="row.permLobby === 1" disabled>停服时进入大厅</el-checkbox>
              <el-checkbox :model-value="row.permGame === 1" disabled>停服时进入游戏</el-checkbox>
              <el-checkbox :model-value="row.permDownload === 1" disabled>下载站</el-checkbox>
              <el-checkbox :model-value="row.permClient === 1" disabled>客户端</el-checkbox>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column label="操作人" prop="operatorId" align="center" width="100" />
          <el-table-column label="操作时间" align="center" width="170">
            <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
          </el-table-column>
        </template>
        <template v-else-if="activeTab === 'auth'">
          <el-table-column label="浏览器授权码" prop="authCode" min-width="180" :show-overflow-tooltip="true" />
          <el-table-column label="授权浏览器" prop="browserName" align="center" width="140" />
          <el-table-column label="授权域名" prop="authDomain" min-width="160" />
          <el-table-column label="绑定账号" prop="bindAccount" align="center" width="120" />
          <el-table-column label="到期时间" align="center" width="170">
            <template #default="{ row }">{{ row.expireAt ? fmt(row.expireAt) : '永久' }}</template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="操作人" prop="operatorId" align="center" width="100" />
        </template>
        <template v-else>
          <el-table-column label="信任域名" prop="domain" min-width="200" :show-overflow-tooltip="true" />
          <el-table-column label="适用浏览器" prop="browserName" align="center" width="150" />
          <el-table-column label="VPN出口地区" prop="vpnRegion" align="center" width="170" />
          <el-table-column label="信任级别" align="center" width="110">
            <template #default="{ row }">
              <el-tag :type="row.trustLevel === 1 ? 'success' : 'warning'">
                {{ row.trustLevel === 1 ? '完全信任' : '仅登录' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column label="操作人" prop="operatorId" align="center" width="100" />
        </template>
        <el-table-column label="操作" align="center" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['system:access:edit']" link type="primary" @click="handleUpdate(row)">修改</el-button>
            <el-button v-hasPermi="['system:access:remove']" link type="danger" @click="handleDelete(row)">删除</el-button>
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
    </el-card>

    <!-- IP 白名单新增/修改 -->
    <el-dialog v-model="ipDialog.visible" :title="ipDialog.title" width="640px" append-to-body destroy-on-close>
      <el-form ref="ipFormRef" :model="ipForm" :rules="ipRules" label-width="120px">
        <el-form-item label="IP" prop="ipAddr">
          <el-input v-model="ipForm.ipAddr" placeholder="支持 IPv4 / IPv6" />
        </el-form-item>
        <el-form-item label="地区">
          <el-input v-model="ipForm.region" placeholder="如 Japan, Tokyo（选填）" />
        </el-form-item>
        <el-form-item label="访问权限">
          <el-checkbox v-model="ipPerm.backend" :true-value="1" :false-value="0">管理后台</el-checkbox>
          <el-checkbox v-model="ipPerm.lobby" :true-value="1" :false-value="0">停服时进入大厅</el-checkbox>
          <el-checkbox v-model="ipPerm.game" :true-value="1" :false-value="0">停服时进入游戏</el-checkbox>
          <el-checkbox v-model="ipPerm.download" :true-value="1" :false-value="0">下载站</el-checkbox>
          <el-checkbox v-model="ipPerm.client" :true-value="1" :false-value="0">客户端</el-checkbox>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="ipForm.remark" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitIp">确 定</el-button>
        <el-button @click="ipDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 浏览器授权码新增/修改 -->
    <el-dialog v-model="authDialog.visible" :title="authDialog.title" width="600px" append-to-body destroy-on-close>
      <el-form ref="authFormRef" :model="authForm" :rules="authRules" label-width="120px">
        <el-form-item label="浏览器授权码">
          <el-input v-model="authForm.authCode" placeholder="留空则由服务端自动生成" />
        </el-form-item>
        <el-form-item label="授权浏览器" prop="browserName">
          <el-input v-model="authForm.browserName" placeholder="如 Chrome-153" />
        </el-form-item>
        <el-form-item label="授权域名" prop="authDomain">
          <el-input v-model="authForm.authDomain" placeholder="如 n188.cg.ink" />
        </el-form-item>
        <el-form-item label="绑定账号">
          <el-input v-model="authForm.bindAccount" placeholder="留空表示不限账号" />
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="authForm.expireAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="留空表示永久"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="authForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="authForm.remark" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitAuth">确 定</el-button>
        <el-button @click="authDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- VPN 信任域名新增/修改 -->
    <el-dialog v-model="vpnDialog.visible" :title="vpnDialog.title" width="600px" append-to-body destroy-on-close>
      <el-form ref="vpnFormRef" :model="vpnForm" :rules="vpnRules" label-width="120px">
        <el-form-item label="信任域名" prop="domain">
          <el-input v-model="vpnForm.domain" placeholder="如 n188.cg.ink" />
        </el-form-item>
        <el-form-item label="适用浏览器" prop="browserName">
          <el-input v-model="vpnForm.browserName" placeholder="如 Chrome-153" />
        </el-form-item>
        <el-form-item label="VPN出口地区">
          <el-input v-model="vpnForm.vpnRegion" placeholder="如 Japan, Tokyo" />
        </el-form-item>
        <el-form-item label="信任级别">
          <el-select v-model="vpnForm.trustLevel" style="width: 100%">
            <el-option
              v-for="item in options.trustLevels"
              :key="item.value"
              :label="item.label"
              :value="Number(item.value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="vpnForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="vpnForm.remark" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitVpn">确 定</el-button>
        <el-button @click="vpnDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="SystemAccess" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addBrowserAuth,
  addBrowserVpn,
  addIpWhitelist,
  delBrowserAuth,
  delBrowserVpn,
  delIpWhitelist,
  getAccessOptions,
  listBrowserAuth,
  listBrowserVpn,
  listIpWhitelist,
  updateBrowserAuth,
  updateBrowserVpn,
  updateIpWhitelist
} from '@/api/system/access';
import type {
  AccessOptions,
  AccessQuery,
  BrowserAuthVO,
  BrowserVpnVO,
  IpWhitelistVO
} from '@/api/system/access/types';

const { loading, withLoading } = useLoading(true);
const activeTab = ref('ip');
const rows = ref<any[]>([]);
const total = ref(0);
const ids = ref<string[]>([]);
const multiple = ref(true);
const single = ref(true);
const options = reactive<AccessOptions>({
  sites: [],
  trustLevels: [],
  domainHint: {}
});

const queryParams = ref<AccessQuery>({ pageNum: 1, pageSize: 10 });
const ipDialog = reactive({ visible: false, title: '' });
const authDialog = reactive({ visible: false, title: '' });
const vpnDialog = reactive({ visible: false, title: '' });
const ipFormRef = ref<ElFormInstance>();
const authFormRef = ref<ElFormInstance>();
const vpnFormRef = ref<ElFormInstance>();

const ipForm = ref<Partial<IpWhitelistVO>>({});
const ipPerm = reactive({ backend: 1, lobby: 1, game: 1, download: 1, client: 1 });
const authForm = ref<Partial<BrowserAuthVO>>({});
const vpnForm = ref<Partial<BrowserVpnVO>>({});

const ipRules = { ipAddr: [{ required: true, message: '请输入 IP', trigger: 'blur' }] };
const authRules = {
  browserName: [{ required: true, message: '请输入授权浏览器', trigger: 'blur' }],
  authDomain: [{ required: true, message: '请输入授权域名', trigger: 'blur' }]
};
const vpnRules = {
  domain: [{ required: true, message: '请输入信任域名', trigger: 'blur' }],
  browserName: [{ required: true, message: '请输入适用浏览器', trigger: 'blur' }]
};

const tabTitle = computed(() =>
  activeTab.value === 'ip' ? 'IP白名单' : activeTab.value === 'auth' ? '浏览器授权码' : '浏览器VPN信任域名'
);
const keywordLabel = computed(() => (activeTab.value === 'ip' ? 'IP' : activeTab.value === 'auth' ? '授权码/域名' : '域名'));
const keywordPlaceholder = computed(() =>
  activeTab.value === 'ip' ? '请输入 IP' : activeTab.value === 'auth' ? '请输入授权码/域名/账号' : '请输入域名/地区'
);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');
const domainLink = (domain?: string) => (domain ? `https://${domain}` : '#');

const getList = async () => {
  try {
    await withLoading(async () => {
      const params = { ...queryParams.value };
      let res;
      if (activeTab.value === 'ip') {
        res = await listIpWhitelist(params);
      } else if (activeTab.value === 'auth') {
        res = await listBrowserAuth(params);
      } else {
        res = await listBrowserVpn(params);
      }
      rows.value = res.data?.rows ?? [];
      total.value = res.data?.total ?? 0;
    });
  } catch (error) {
    modal.msgError('列表加载失败，请稍后重试');
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: queryParams.value.pageSize };
  getList();
};

const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map(item => item.id);
  multiple.value = selection.length === 0;
  single.value = selection.length !== 1;
};

const handleAdd = () => {
  if (activeTab.value === 'ip') {
    ipForm.value = {};
    ipPerm.backend = 1;
    ipPerm.lobby = 1;
    ipPerm.game = 1;
    ipPerm.download = 1;
    ipPerm.client = 1;
    ipDialog.title = '新增IP白名单';
    ipDialog.visible = true;
  } else if (activeTab.value === 'auth') {
    authForm.value = { status: 1 };
    authDialog.title = '新增浏览器授权码';
    authDialog.visible = true;
  } else {
    vpnForm.value = { status: 1, trustLevel: 1 };
    vpnDialog.title = '新增浏览器VPN信任域名';
    vpnDialog.visible = true;
  }
};

const handleUpdate = (row: any) => {
  if (!row?.id) {
    return;
  }
  if (activeTab.value === 'ip') {
    ipForm.value = { ...row };
    ipPerm.backend = row.permBackend;
    ipPerm.lobby = row.permLobby;
    ipPerm.game = row.permGame;
    ipPerm.download = row.permDownload;
    ipPerm.client = row.permClient;
    ipDialog.title = '修改IP白名单';
    ipDialog.visible = true;
  } else if (activeTab.value === 'auth') {
    authForm.value = { ...row };
    authDialog.title = '修改浏览器授权码';
    authDialog.visible = true;
  } else {
    vpnForm.value = { ...row };
    vpnDialog.title = '修改浏览器VPN信任域名';
    vpnDialog.visible = true;
  }
};

const submitIp = async () => {
  await ipFormRef.value?.validate();
  const payload = {
    ...ipForm.value,
    permBackend: ipPerm.backend,
    permLobby: ipPerm.lobby,
    permGame: ipPerm.game,
    permDownload: ipPerm.download,
    permClient: ipPerm.client
  };
  if (ipForm.value.id) {
    await updateIpWhitelist(payload);
  } else {
    await addIpWhitelist(payload);
  }
  modal.msgSuccess('操作成功');
  ipDialog.visible = false;
  getList();
};

const submitAuth = async () => {
  await authFormRef.value?.validate();
  if (authForm.value.id) {
    await updateBrowserAuth(authForm.value);
  } else {
    await addBrowserAuth(authForm.value);
  }
  modal.msgSuccess('操作成功');
  authDialog.visible = false;
  getList();
};

const submitVpn = async () => {
  await vpnFormRef.value?.validate();
  if (vpnForm.value.id) {
    await updateBrowserVpn(vpnForm.value);
  } else {
    await addBrowserVpn(vpnForm.value);
  }
  modal.msgSuccess('操作成功');
  vpnDialog.visible = false;
  getList();
};

const handleDelete = async (row?: any) => {
  const delIds = row?.id ? [row.id] : ids.value;
  if (!delIds.length) {
    return;
  }
  await modal.confirm('确认删除所选记录吗？');
  if (activeTab.value === 'ip') {
    await delIpWhitelist(delIds);
  } else if (activeTab.value === 'auth') {
    await delBrowserAuth(delIds);
  } else {
    await delBrowserVpn(delIds);
  }
  modal.msgSuccess('删除成功');
  getList();
};

const loadOptions = async () => {
  const res = await getAccessOptions();
  options.sites = res.data?.sites ?? [];
  options.trustLevels = res.data?.trustLevels ?? [];
  options.domainHint = res.data?.domainHint ?? {};
};

onMounted(() => {
  loadOptions();
  getList();
});
</script>

<style scoped>
.system-access-page :deep(.el-checkbox) {
  margin-right: 10px;
}
</style>

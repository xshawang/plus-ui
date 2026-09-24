<template>
  <div class="p-2 app-container ops-shell-pack-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane name="onSale">
          <template #label>
            <span>出售中</span>
            <el-badge v-if="tabCounts.onSale" :value="tabCounts.onSale" class="ml-1" />
          </template>
        </el-tab-pane>
        <el-tab-pane label="已购买" name="purchased" />
        <el-tab-pane label="待付款" name="pending" />
        <el-tab-pane label="已失效" name="expired" />
        <el-tab-pane label="全部马甲包" name="all" />
        <el-tab-pane label="马甲包对接文档" name="docs" />
      </el-tabs>
      <el-form v-if="activeTab !== 'docs'" :inline="true" class="query-form">
        <el-form-item label="APP名称">
          <el-input v-model="queryParams.keyword" placeholder="请输入APP名称查询" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="商店">
          <el-select v-model="queryParams.storeName" clearable placeholder="全部商店" style="width: 150px">
            <el-option label="Google play" value="Google play" />
          </el-select>
        </el-form-item>
        <el-form-item label="行业">
          <el-select v-model="queryParams.industry" clearable placeholder="全部行业" style="width: 130px">
            <el-option label="游戏" value="游戏" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="activeTab !== 'docs'" shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="rows" empty-text="暂无数据">
        <el-table-column label="ID" prop="packId" align="center" width="110" />
        <el-table-column label="马甲包类型" prop="packType" align="center" width="120" />
        <el-table-column label="APP名称" align="center" width="110">
          <template #default="scope">{{ scope.row.appName || '—' }}</template>
        </el-table-column>
        <el-table-column label="APP图标" align="center" width="90">
          <template #default="scope">
            <el-image v-if="scope.row.appIconUrl" :src="scope.row.appIconUrl" fit="cover" style="width: 40px; height: 40px; border-radius: 6px" />
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="上架商店" prop="storeName" align="center" width="120" />
        <el-table-column label="上架地区" align="center" width="100">
          <template #default="scope">{{ scope.row.regionCode === 'global' ? '全球' : scope.row.regionCode }}</template>
        </el-table-column>
        <el-table-column label="APP包名" prop="appPackageName" align="center" min-width="150" show-overflow-tooltip />
        <el-table-column label="马甲行业" prop="industry" align="center" width="100" />
        <el-table-column label="应用商店地址" prop="storeUrl" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="购买价格" align="center" width="110">
          <template #default="scope">{{ scope.row.priceText || '—' }}</template>
        </el-table-column>
        <el-table-column label="销售状态" align="center" width="110">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.saleStatus)">{{ statusText(scope.row.saleStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="140" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDetail(scope.row)">详情</el-button>
            <el-button v-if="scope.row.saleStatus === 1" v-hasPermi="['ops:shellpack:buy']" link type="success" @click="handlePurchase(scope.row)">购买</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-card v-else shadow="hover" class="table-panel">
      <el-table :data="docs" border empty-text="暂无文档">
        <el-table-column label="文档ID" prop="docId" align="center" width="100" />
        <el-table-column label="文档标题" prop="docTitle" min-width="260" />
        <el-table-column label="类型" prop="docType" align="center" width="120" />
        <el-table-column label="地址" align="center" min-width="240">
          <template #default="scope">{{ scope.row.docUrl || '待配置' }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="activeTab === 'pending' || activeTab === 'purchased'" shadow="hover" class="table-panel mt-2">
      <template #header><span>我的订单</span></template>
      <el-table v-loading="orderLoading" :data="orders" border size="small" empty-text="暂无订单">
        <el-table-column label="订单号" prop="orderNo" align="center" min-width="200" />
        <el-table-column label="马甲包ID" prop="packId" align="center" width="110" />
        <el-table-column label="APP名称" align="center" width="120">
          <template #default="scope">{{ scope.row.appName || '—' }}</template>
        </el-table-column>
        <el-table-column label="金额" align="center" width="110">
          <template #default="scope">{{ scope.row.priceAmount }}{{ scope.row.priceCurrency }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">{{ orderStatusText(scope.row.status) }}</template>
        </el-table-column>
        <el-table-column label="过期时间" align="center" width="170">
          <template #default="scope">{{ fmt(scope.row.expireAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180">
          <template #default="scope">
            <template v-if="scope.row.status === 1">
              <el-button v-hasPermi="['ops:shellpack:buy']" link type="success" @click="handlePay(scope.row)">标记已付款</el-button>
              <el-button v-hasPermi="['ops:shellpack:buy']" link type="danger" @click="handleCancel(scope.row)">取消</el-button>
            </template>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="OpsShellPack" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  cancelShellPackOrder,
  getShellPackTabCounts,
  listShellPack,
  listShellPackDocs,
  listShellPackOrders,
  payShellPackOrder,
  purchaseShellPack
} from '@/api/ops/shell-pack';
import type { ShellPackDocVO, ShellPackOrderVO, ShellPackQuery, ShellPackVO } from '@/api/ops/shell-pack/types';

type ShellPackRow = Record<string, any>;

const { loading, withLoading } = useLoading(true);
const rows = ref<ShellPackVO[]>([]);
const docs = ref<ShellPackDocVO[]>([]);
const orders = ref<ShellPackOrderVO[]>([]);
const tabCounts = ref<Record<string, number>>({});
const orderLoading = ref(false);
const total = ref(0);
const activeTab = ref('onSale');
const queryParams = reactive<ShellPackQuery>({ pageNum: 1, pageSize: 10 });

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');
const statusText = (status?: number) =>
  status === 1 ? '出售中' : status === 2 ? '已购买' : status === 3 ? '待付款' : status === 4 ? '已失效' : '—';
const statusTagType = (status?: number) => (status === 1 ? 'success' : status === 2 ? 'primary' : status === 3 ? 'warning' : 'info');
const orderStatusText = (status?: number) =>
  status === 1 ? '待付款' : status === 2 ? '已付款' : status === 3 ? '已取消' : status === 4 ? '已失效' : '—';

const getList = async () => {
  queryParams.tab = activeTab.value;
  try {
    await withLoading(async () => {
      const res = await listShellPack(queryParams);
      rows.value = res.data?.rows || [];
      total.value = res.data?.total || 0;
    });
  } catch (error) {
    modal.msgError('马甲包列表加载失败，请稍后重试');
  }
};

const loadTabCounts = async () => {
  try {
    const res = await getShellPackTabCounts();
    tabCounts.value = (res.data as Record<string, number>) || {};
  } catch (error) {
    tabCounts.value = {};
  }
};

const loadOrders = async () => {
  orderLoading.value = true;
  try {
    const res = await listShellPackOrders({ status: activeTab.value === 'pending' ? 1 : 2, pageNum: 1, pageSize: 10 });
    orders.value = res.data?.rows || [];
  } catch (error) {
    orders.value = [];
  } finally {
    orderLoading.value = false;
  }
};

const loadDocs = async () => {
  try {
    const res = await listShellPackDocs();
    docs.value = res.data || [];
  } catch (error) {
    docs.value = [];
  }
};

const handleTabChange = () => {
  queryParams.pageNum = 1;
  if (activeTab.value === 'docs') {
    loadDocs();
    return;
  }
  getList();
  if (activeTab.value === 'pending' || activeTab.value === 'purchased') {
    loadOrders();
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.keyword = undefined;
  queryParams.storeName = undefined;
  queryParams.industry = undefined;
  handleQuery();
};

const openDetail = async (row: ShellPackRow) => {
  await modal.alert(
    `马甲包 ${row.packId}%0A类型：${row.packType || '—'}%0A包名：${row.appPackageName || '—'}%0A商店地址：${row.storeUrl || '—'}%0A价格：${row.priceText || '—'}`
  );
};

const handlePurchase = async (row: ShellPackRow) => {
  await modal.confirm(`确认购买马甲包 ${row.packId}（价格 ${row.priceText || '—'}）？购买后进入「待付款」页签。`);
  try {
    const res = await purchaseShellPack(Number(row.packId));
    modal.msgSuccess(res.data?.tip || '订单已创建');
    loadTabCounts();
    getList();
  } catch (error) {
    modal.msgError('购买失败，请稍后重试');
  }
};

const handlePay = async (row: ShellPackRow) => {
  await modal.confirm(`确认订单 ${row.orderNo} 已付款？确认后马甲包将标记为已购买并返回真实包名。`);
  await payShellPackOrder(row.orderId);
  modal.msgSuccess('已标记为已付款');
  loadOrders();
  loadTabCounts();
  getList();
};

const handleCancel = async (row: ShellPackRow) => {
  await modal.confirm(`确认取消订单 ${row.orderNo}？取消后马甲包将回到「出售中」。`);
  await cancelShellPackOrder(row.orderId);
  modal.msgSuccess('订单已取消');
  loadOrders();
  loadTabCounts();
  getList();
};

onMounted(() => {
  getList();
  loadTabCounts();
});
</script>

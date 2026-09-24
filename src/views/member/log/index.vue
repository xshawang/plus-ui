<template>
  <div class="p-2 app-container member-log-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="登录日志" name="login">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="queryParams.uid" placeholder="会员ID" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.loginName" placeholder="会员账号" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="登录IP">
          <el-input v-model="queryParams.loginIp" placeholder="登录IP" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="登录结果">
          <el-select v-model="queryParams.loginResult" placeholder="全部" clearable style="width: 110px">
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="登录时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">默认查询最近 7 天，单次最多 31 天（日志表数据量大，请缩小范围查询）。</div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>会员日志</h3>
            <p>共 {{ total }} 条（只读审计数据，不可修改）</p>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="登录时间" prop="loginAt" align="center" width="180" />
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="登录IP" prop="loginIp" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="登录设备" prop="loginDevice" align="left" min-width="220" show-overflow-tooltip />
        <el-table-column label="登录渠道" prop="loginChannel" align="center" width="100" />
        <el-table-column label="结果" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.loginResult === 1 ? 'success' : 'danger'">{{ row.loginResult === 1 ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" prop="failReason" align="left" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.failReason || '—' }}</template>
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
      </el-tab-pane>

      <!-- 行为日志（游戏端上报：进房/下注/结算/打标等，落 player_behavior_log） -->
      <el-tab-pane label="行为日志" name="behavior">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="会员ID">
              <el-input v-model="behaviorQuery.uid" placeholder="会员ID" clearable style="width: 170px" @keyup.enter="getBehaviorList" />
            </el-form-item>
            <el-form-item label="会员账号">
              <el-input v-model="behaviorQuery.loginName" placeholder="会员账号" clearable style="width: 150px" @keyup.enter="getBehaviorList" />
            </el-form-item>
            <el-form-item label="行为类型">
              <el-select v-model="behaviorQuery.actionType" placeholder="全部" clearable style="width: 160px">
                <el-option label="登录" value="LOGIN" />
                <el-option label="退出" value="LOGOUT" />
                <el-option label="进入游戏" value="GAME_ENTER" />
                <el-option label="退出游戏" value="GAME_EXIT" />
                <el-option label="下注" value="BET" />
                <el-option label="结算" value="SETTLE" />
                <el-option label="充值" value="DEPOSIT" />
                <el-option label="提现" value="WITHDRAW" />
                <el-option label="标签变更" value="TAG_CHANGE" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
            <el-form-item label="来源服务">
              <el-input v-model="behaviorQuery.sourceService" placeholder="如 go88-service-game-lobby" clearable style="width: 220px" @keyup.enter="getBehaviorList" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getBehaviorList">搜索</el-button>
              <el-button icon="Refresh" @click="resetBehaviorQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm">
            口径：由游戏端（Dubbo 或 /infra/member/bridge 内部令牌接口）上报，游戏端上报失败不影响游戏主流程；
            打标/摘标会额外写入 TAG_CHANGE 记录，便于回溯处置动作。
          </div>
        </el-card>

        <el-card shadow="hover" class="table-panel">
          <el-table v-loading="behaviorLoading" border :data="behaviorRows">
            <el-table-column label="事件时间" prop="eventAt" align="center" width="170" />
            <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
            <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column label="行为类型" prop="actionType" align="center" width="130" />
            <el-table-column label="结果" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.actionResult === 1 ? 'success' : 'danger'">{{ row.actionResult === 1 ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="来源服务" prop="sourceService" align="center" min-width="180" show-overflow-tooltip />
            <el-table-column label="IP" prop="ip" align="center" min-width="130" show-overflow-tooltip />
            <el-table-column label="设备指纹" prop="deviceFingerprint" align="center" min-width="150" show-overflow-tooltip />
            <el-table-column label="系统/浏览器" align="center" width="150">
              <template #default="{ row }">{{ (row.os || '-') + ' / ' + (row.browser || '-') }}</template>
            </el-table-column>
            <el-table-column label="明细" prop="detail" align="left" min-width="240" show-overflow-tooltip />
            <el-table-column label="失败原因" prop="failReason" align="left" min-width="140" show-overflow-tooltip />
          </el-table>
          <pagination
            v-show="behaviorTotal > 0"
            v-model:page="behaviorQuery.pageNum"
            v-model:limit="behaviorQuery.pageSize"
            :total="behaviorTotal"
            @pagination="getBehaviorList"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="MemberLog" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import { listMemberLog } from '@/api/member/log';
import type { MemberLogQuery, MemberLogVO } from '@/api/member/log/types';

/** 后端分页体为 {rows,total}（request 拦截器直出 body） */
type PageBody<T> = { rows?: T[]; total?: number };

const { loading, withLoading } = useLoading(true);
const rows = ref<MemberLogVO[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);

const data = reactive<{ queryParams: MemberLogQuery }>({
  queryParams: { pageNum: 1, pageSize: 10 }
});
const { queryParams } = toRefs(data);

const buildParams = (): MemberLogQuery => {
  const params = { ...queryParams.value };
  if (dateRange.value && dateRange.value.length === 2) {
    params.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] };
  }
  return params;
};

const getList = async () => {
  await withLoading(async () => {
    const res = (await listMemberLog(buildParams())) as unknown as PageBody<MemberLogVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  dateRange.value = [];
  getList();
};

onMounted(() => getList());

/* ---------------- 行为日志（游戏端上报，批次 10） ---------------- */
const activeTab = ref('login');
const { loading: behaviorLoading, withLoading: withBehaviorLoading } = useLoading(true);
const behaviorRows = ref<any[]>([]);
const behaviorTotal = ref(0);
const behaviorQuery = reactive<{ pageNum: number; pageSize: number; uid?: number | string; loginName?: string; actionType?: string; sourceService?: string }>({
  pageNum: 1,
  pageSize: 10
});

const getBehaviorList = async () => {
  await withBehaviorLoading(async () => {
    const request = (await import('@/utils/request')).default;
    const res: any = await request({
      url: '/infra/member/log/behavior/list',
      method: 'get',
      params: behaviorQuery
    });
    behaviorRows.value = res?.rows ?? [];
    behaviorTotal.value = res?.total ?? 0;
  });
};

const resetBehaviorQuery = () => {
  behaviorQuery.pageNum = 1;
  behaviorQuery.uid = undefined;
  behaviorQuery.loginName = undefined;
  behaviorQuery.actionType = undefined;
  behaviorQuery.sourceService = undefined;
  getBehaviorList();
};

getBehaviorList();
</script>

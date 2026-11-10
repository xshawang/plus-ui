<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <el-tabs v-model="relationType" @tab-change="search">
        <el-tab-pane label="直接会员" name="direct" />
        <el-tab-pane v-if="!isHumanLower" label="间接会员" name="indirect" />
      </el-tabs>
      <el-form :inline="true">
        <el-form-item>
          <el-date-picker v-model="statDate" type="date" value-format="YYYY-MM-DD" clearable placeholder="快照日期" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="keyword" clearable placeholder="会员UID或账号" style="width: 240px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="responsibleAgentId"
            clearable
            placeholder="归属代理ID"
            style="width: 200px"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="search">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column label="会员ID" prop="uid" min-width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" min-width="150" show-overflow-tooltip />
        <el-table-column label="昵称" prop="nickname" min-width="130" show-overflow-tooltip />
        <el-table-column label="关系" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.directMember) === 1 ? 'success' : 'warning'">
              {{ Number(row.directMember) === 1 ? '直接' : '间接' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="归属代理" prop="responsibleAgentName" min-width="150" show-overflow-tooltip />
        <el-table-column label="相对深度" prop="responsibleDepth" width="100" align="center" />
        <el-table-column label="邀请人" prop="inviterLoginName" min-width="130" show-overflow-tooltip />
        <el-table-column label="注册时间" prop="registeredAt" min-width="170" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPath(row.uid)">路径</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="pageNum" v-model:limit="pageSize" :total="total" @pagination="load" />
    </el-card>

    <el-dialog v-model="pathVisible" title="会员邀请路径" width="620px" append-to-body>
      <el-timeline>
        <el-timeline-item v-for="item in pathRows" :key="item.uid" :timestamp="`深度 ${item.depth}`">
          {{ item.loginName || item.uid }}（{{ item.uid }}）
        </el-timeline-item>
      </el-timeline>
      <div class="path-actions">
        <el-button :disabled="pathOffset === 0" @click="loadPath(-1)">上一页</el-button>
        <span>每页最多 50 个节点</span>
        <el-button :disabled="!pathHasMore" @click="loadPath(1)">下一页</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="AgentMember" lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getAgentMemberPath, listAgentMembers } from '@/api/agent/member';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const isHumanLower = computed(
  () => Boolean(userStore.agentId) && !userStore.agentTop && Number(userStore.agentType) === 1
);
const relationType = ref('direct');
const statDate = ref('');
const keyword = ref('');
const responsibleAgentId = ref('');
const rows = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(50);
const loading = ref(false);
const pathVisible = ref(false);
const pathUid = ref('');
const pathRows = ref<any[]>([]);
const pathOffset = ref(0);
const pathHasMore = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const res: any = await listAgentMembers({
      statDate: statDate.value || undefined,
      relationType: relationType.value,
      keyword: keyword.value || undefined,
      responsibleAgentId: responsibleAgentId.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    });
    rows.value = res?.rows ?? [];
    total.value = res?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const search = () => {
  pageNum.value = 1;
  load();
};

const reset = () => {
  statDate.value = '';
  keyword.value = '';
  responsibleAgentId.value = '';
  search();
};

const openPath = (uid: string) => {
  pathUid.value = uid;
  pathOffset.value = 0;
  pathVisible.value = true;
  loadPath(0);
};

const loadPath = async (direction: number) => {
  if (direction < 0) {
    pathOffset.value = Math.max(0, pathOffset.value - 50);
  } else if (direction > 0) {
    pathOffset.value += 50;
  }
  const res: any = await getAgentMemberPath(pathUid.value, statDate.value || undefined, pathOffset.value, 50);
  pathRows.value = res?.data?.rows ?? [];
  pathHasMore.value = Boolean(res?.data?.hasMore);
};

onMounted(load);
</script>

<style scoped>
.path-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>

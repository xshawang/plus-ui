<template>
  <div class="p-2 agent-home">
    <section class="home-hero">
      <div class="hero-copy">
        <div class="eyebrow">AGENT BUSINESS WORKSPACE</div>
        <div class="title-row">
          <h2>代理经营看板</h2>
          <el-tag v-if="snapshot" effect="plain" :type="snapshot.agent.topLevel ? 'success' : 'info'">
            {{ snapshot.agent.topLevel ? '顶层代理' : '下层代理' }}
          </el-tag>
          <el-tag v-if="snapshot" effect="plain">{{ lineTypeText }}</el-tag>
        </div>
        <p>
          {{ snapshot?.agent.loginName || userStore.nickname || userStore.name || '代理账号' }}
          <span v-if="snapshot?.agent.levelName">· {{ snapshot.agent.levelName }}</span>
          <span v-if="snapshot">· 数据截至 {{ dataThroughDate }}</span>
        </p>
      </div>
      <div class="hero-actions">
        <el-radio-group v-model="period" size="default" @change="load">
          <el-radio-button value="yesterday">昨日</el-radio-button>
          <el-radio-button value="last7">近 7 天</el-radio-button>
          <el-radio-button value="last30">近 30 天</el-radio-button>
        </el-radio-group>
        <el-button icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </div>
    </section>

    <StateBox :loading="loading" :error="error" :reload="load" class="home-state">
      <template v-if="snapshot">
        <div class="basis-strip">
          <span>T+1 官方统计</span>
          <span>{{ snapshot.period.beginDate }} 至 {{ snapshot.period.endDate }}</span>
          <span>时区 {{ snapshot.period.timezone }}</span>
          <span>金额口径与代理数据报表一致</span>
        </div>
        <el-empty v-if="!snapshot.hasData" description="当前周期暂无经营数据" :image-size="72" />
        <template v-else>
          <AgentMetricGrid :snapshot="snapshot" :people-unit="peopleUnit" />
          <div class="middle-grid">
            <AgentTrendPanel :rows="snapshot.trend" />
            <AgentFunnelPanel :summary="snapshot.summary" :people-unit="peopleUnit" />
          </div>
          <AgentBreakdownPanel
            :split="snapshot.split"
            :commission="snapshot.commission"
            :people-unit="peopleUnit"
          />
        </template>
      </template>
    </StateBox>
  </div>
</template>

<script setup name="AgentHome" lang="ts">
import { computed, onMounted, ref } from 'vue';
import StateBox from '@/components/Dashboard/StateBox.vue';
import { getAgentHomeDashboard } from '@/api/agent/home';
import type { AgentHomePeriod, AgentHomeSnapshot } from '@/api/agent/home/types';
import { useUserStore } from '@/store/modules/user';
import AgentBreakdownPanel from './components/AgentBreakdownPanel.vue';
import AgentFunnelPanel from './components/AgentFunnelPanel.vue';
import AgentMetricGrid from './components/AgentMetricGrid.vue';
import AgentTrendPanel from './components/AgentTrendPanel.vue';

const userStore = useUserStore();
const period = ref<AgentHomePeriod>('last7');
const snapshot = ref<AgentHomeSnapshot>();
const loading = ref(false);
const error = ref<string | boolean>(false);

const peopleUnit = computed(() => (period.value === 'yesterday' ? '人数' : '人次'));
const dataThroughDate = computed(() => snapshot.value?.period.dataThroughDate || '暂无日统计数据');
const lineTypeText = computed(() => (Number(snapshot.value?.agent.lineType) === 2 ? '专业代理' : '人人代理'));

const load = async () => {
  loading.value = true;
  error.value = false;
  try {
    const res = await getAgentHomeDashboard(period.value);
    snapshot.value = res.data;
  } catch (reason) {
    error.value = typeof reason === 'string' ? reason : '请求异常';
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style scoped lang="scss">
.agent-home {
  min-height: calc(100vh - 100px);
  background:
    radial-gradient(circle at 8% 0, rgba(78, 122, 255, 0.12), transparent 30%),
    #f4f6fb;
}

.home-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
  padding: 24px 26px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 18px;
  background:
    linear-gradient(120deg, rgba(22, 37, 72, 0.96), rgba(36, 69, 139, 0.9)),
    #1e315c;
  color: #fff;
  box-shadow: 0 18px 42px rgba(23, 40, 77, 0.2);
}

.eyebrow {
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
  letter-spacing: 0.16em;
}

.title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
}

.hero-copy p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.home-state {
  display: grid;
  gap: 16px;
}

.basis-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    padding: 6px 10px;
    border: 1px solid #dfe6f3;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.86);
    color: #65718a;
    font-size: 12px;
  }
}

.middle-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.75fr);
  gap: 16px;
}

@media (max-width: 1100px) {
  .middle-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .home-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .hero-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>

<template>
  <div>
    <el-form :inline="true">
      <el-form-item label="期数">
        <el-select v-model="issueNo" placeholder="期数" clearable style="width: 170px" @change="load">
          <el-option v-for="i in issues" :key="i.issueNo" :label="`第${i.issueNo}期`" :value="String(i.issueNo)" />
        </el-select>
      </el-form-item>
      <el-form-item label="多阶调赔">
        <el-switch v-model="multiLevel" @change="v => switchMultiLevel(v)" />
        <el-tooltip placement="top">
          <template #content>
            <div>开启后按阶梯规则逐级下调赔率；关闭时仅按最低/最高赔率护栏生效。</div>
            <div>若在彩期中修改，赔率将在下期生效；最低赔率及最高赔率修改在本期生效。</div>
          </template>
          <el-icon class="ml"><QuestionFilled /></el-icon>
        </el-tooltip>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="load">搜索</el-button>
        <el-button icon="Refresh" @click="load">重置</el-button>
        <el-button link type="primary" @click="openLogs">操作日志</el-button>
      </el-form-item>
    </el-form>
    <p class="tip-red">{{ tip }}</p>

    <el-table v-loading="loading" border :data="rows">
      <el-table-column type="index" label="序号" align="center" width="80" />
      <el-table-column label="玩法" align="center" prop="playName" min-width="170" />
      <el-table-column label="最低赔率" align="center" prop="minOdds" width="130" />
      <el-table-column label="最高赔率" align="center" prop="maxOdds" width="130" />
      <el-table-column label="降赔设置详情" align="center" prop="levelDetail" min-width="260">
        <template #default="{ row }">{{ row.levelDetail || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120">
        <template #default="{ row }">
          <el-button v-hasPermi="['game:lottery:autoreduce:edit']" link type="primary" @click="openEdit(row)">设置</el-button>
        </template>
      </el-table-column>
    </el-table>
    <p class="tip">共 {{ rows.length }} 条（截图默认为空表，需在「设置」里配置玩法上下限后才产生数据）</p>

    <el-dialog v-model="dialog.visible" title="自动降赔设置" width="640px" append-to-body>
      <el-form label-width="140px">
        <el-form-item label="玩法"><el-input v-model="dialog.playName" disabled /></el-form-item>
        <el-form-item label="最低赔率">
          <el-input-number v-model="dialog.minOdds" :min="0" :precision="3" controls-position="right" />
        </el-form-item>
        <el-form-item label="最高赔率">
          <el-input-number v-model="dialog.maxOdds" :min="0" :precision="3" controls-position="right" />
        </el-form-item>
        <el-form-item label="多阶调赔">
          <el-switch v-model="dialog.multiLevel" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="降赔设置详情">
          <el-input v-model="dialog.levelDetail" type="textarea" :rows="4"
                    placeholder='JSON 数组，如 [{"level":1,"condition":"投注额>=100000","reduceType":"PERCENT","reduceValue":5,"scope":"NEXT"}]' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submit">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logDialog.visible" title="操作日志" width="940px" append-to-body>
      <el-table border :data="logs">
        <el-table-column label="ID" align="center" prop="id" width="80" />
        <el-table-column label="彩种名称(代码)" align="center" prop="lotteryName" width="180" />
        <el-table-column label="期数" align="center" prop="issueNo" width="100" />
        <el-table-column label="玩法" align="center" prop="playName" width="110" />
        <el-table-column label="操作内容" align="center" prop="operateContent" min-width="240" />
        <el-table-column label="操作行为" align="center" width="100">
          <template #default="{ row }">{{ ['—', '手工', '自动', '批量'][row.operateAction] ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="操作人" align="center" prop="operatorId" width="100" />
        <el-table-column label="操作时间" align="center" prop="createdAt" width="170" />
      </el-table>
      <template #footer><el-button @click="logDialog.visible = false">关 闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { QuestionFilled } from '@element-plus/icons-vue';
import { autoReduceHeader, autoReduceList, lotteryHistoryList, saveAutoReduce, setAutoReduceMultiLevel } from '@/api/game/lottery';

/**
 * 自动降赔设置页签（截图「自动降赔设置」）。
 *
 * 背景：截图页头为「彩种 + 期数 + 币种 + 多阶调赔开关 + 搜索/重置 + 操作日志」，
 * 列表列「序号/玩法/最低赔率/最高赔率/降赔设置详情/操作」；提示原文
 * 「若在彩期中修改，赔率将在下期生效；最低赔率及最高赔率修改在本期生效」。
 * 协作关系：/infra/game/lottery/auto-reduce/* 接口；「多阶调赔」为全局开关（sys_config）。
 */
const props = defineProps<{ lotteryCode: string; currency: string; issues: any[] }>();
const loading = ref(false);
const rows = ref<any[]>([]);
const logs = ref<any[]>([]);
const issueNo = ref('');
const multiLevel = ref(false);
const tip = ref('');
const dialog = reactive<any>({ visible: false });
const logDialog = reactive({ visible: false });

async function load() {
  loading.value = true;
  try {
    const header: any = ((await autoReduceHeader({ lotteryCode: props.lotteryCode, currency: props.currency })) as unknown as any)?.data;
    tip.value = header?.tip ?? '';
    multiLevel.value = !!header?.multiLevel;
    rows.value = ((await autoReduceList({ lotteryCode: props.lotteryCode, currency: props.currency, issueNo: issueNo.value })) as unknown as any)?.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function switchMultiLevel(value: any) {
  await setAutoReduceMultiLevel(!!value);
  ElMessage.success('多阶调赔开关已更新');
}

function openEdit(row: any) {
  Object.assign(dialog, { ...row, visible: true });
}

async function submit() {
  if (dialog.maxOdds > 0 && dialog.minOdds > dialog.maxOdds) {
    ElMessage.warning('最低赔率不可大于最高赔率');
    return;
  }
  await saveAutoReduce({
    lotteryCode: props.lotteryCode, currency: props.currency, issueNo: issueNo.value,
    playCode: dialog.playCode, subCode: dialog.subCode, playName: dialog.playName,
    minOdds: dialog.minOdds, maxOdds: dialog.maxOdds, multiLevel: dialog.multiLevel,
    levelDetail: dialog.levelDetail
  });
  ElMessage.success('保存成功（上下限本期生效，赔率规则下期生效）');
  dialog.visible = false;
  load();
}

async function openLogs() {
  const res: any = await lotteryHistoryList({ pageNum: 1, pageSize: 100, module: '自动降赔' });
  logs.value = res.rows ?? [];
  logDialog.visible = true;
}

watch(() => [props.lotteryCode, props.currency], () => load(), { immediate: true });
onMounted(() => {
  if (!issueNo.value && props.issues?.length) {
    issueNo.value = String(props.issues[0].issueNo);
  }
});
</script>

<style scoped>
.ml { margin-left: 6px; }
.tip-red { color: #f56c6c; font-size: 12px; }
.tip { color: #909399; font-size: 12px; }
</style>

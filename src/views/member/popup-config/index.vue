<template>
  <div class="p-2 app-container member-popup-config-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>弹窗配置</h3>
            <p>注册成功弹窗、智能引导充值弹窗、注册挽留弹窗；开关关闭后全端不弹出。</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="loadPopups">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="popups">
        <el-table-column label="弹窗类型" align="center" width="180">
          <template #default="{ row }">{{ popupTypeLabel(row.popupType) }}</template>
        </el-table-column>
        <el-table-column label="是否开启" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 1 ? 'success' : 'info'">{{ row.enabled === 1 ? '开启' : '关闭' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参数摘要" prop="configJson" align="left" min-width="360" show-overflow-tooltip />
        <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
        <el-table-column label="更新时间" prop="updatedAt" align="center" width="170" />
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:popup:edit']" link type="primary" @click="openPopup(row as PopupConfigVO)">配置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="hover" class="table-panel mt-3">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>用户协议</h3>
            <p>按语言维护协议正文与年龄图标；保存后版本号自动 +1，用于前台签署留痕。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:popup:edit']" type="primary" plain icon="Plus" @click="openAgreement()">新增语言</el-button>
            <el-button icon="Refresh" @click="loadAgreements">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="agreementLoading" border :data="agreements">
        <el-table-column label="语言" prop="languageCode" align="center" width="120" />
        <el-table-column label="年龄图标" align="center" width="110">
          <template #default="{ row }">{{ row.ageLimit ? row.ageLimit + '+' : '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本" prop="version" align="center" width="90" />
        <el-table-column label="正文摘要" prop="contentHtml" align="left" min-width="320" show-overflow-tooltip />
        <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
        <el-table-column label="更新时间" prop="updatedAt" align="center" width="170" />
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:popup:edit']" link type="primary" @click="openAgreement(row as UserAgreementVO)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 弹窗配置编辑：按类型渲染各自字段（15 文档） -->
    <el-dialog v-model="popupDialog.visible" :title="'弹窗配置 - ' + popupTypeLabel(popupDialog.form.popupType)" width="680px" append-to-body destroy-on-close>
      <el-form :model="popupDialog" label-width="150px">
        <el-form-item label="是否开启">
          <el-switch v-model="popupDialog.form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <template v-if="popupDialog.form.popupType === 1">
          <el-form-item label="弹窗标题">
            <el-input v-model="popupDialog.config.title" placeholder="支持系统翻译/自定义" />
          </el-form-item>
          <el-form-item label="弹窗文案">
            <el-input v-model="popupDialog.config.content" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="推荐活动ID">
            <el-input v-model="popupDialog.activitiesText" placeholder="逗号分隔，按填写顺序展示；留空=不展示活动" />
          </el-form-item>
        </template>

        <template v-else-if="popupDialog.form.popupType === 2">
          <el-form-item label="弹窗场景">
            <el-checkbox-group v-model="popupDialog.config.scenes">
              <el-checkbox value="LOGIN">每次登录</el-checkbox>
              <el-checkbox value="RETURN_LOBBY">返回游戏大厅</el-checkbox>
              <el-checkbox value="IDLE_MINUTES">大厅停留每 N 分钟</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="停留分钟数">
            <el-input-number v-model="popupDialog.config.idleMinutes" :min="0" :max="600" controls-position="right" />
            <span class="ml-2 text-gray-400 text-sm">仅"大厅停留每 N 分钟"勾选后生效</span>
          </el-form-item>
          <el-form-item label="余额 ≤ 时弹窗">
            <el-input-number v-model="popupDialog.config.balanceThreshold" :min="0" controls-position="right" />
            <span class="ml-2 text-gray-400 text-sm">主钱包可用余额（分）；0=不限制</span>
          </el-form-item>
          <el-form-item label="弹窗标题">
            <el-input v-model="popupDialog.config.title" />
          </el-form-item>
          <el-form-item label="弹窗文案">
            <el-input v-model="popupDialog.config.content" type="textarea" :rows="3" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="挽留文案">
            <el-input v-model="popupDialog.config.content" type="textarea" :rows="3" placeholder="未完成注册流程用户离开时展示" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="popupDialog.saving" @click="submitPopup">保 存</el-button>
        <el-button @click="popupDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="agreementDialog.visible" title="用户协议配置" width="720px" append-to-body destroy-on-close>
      <el-form :model="agreementDialog.form" label-width="120px">
        <el-form-item label="语言代码">
          <el-input v-model="agreementDialog.form.languageCode" placeholder="vi / en / zh_CN" />
        </el-form-item>
        <el-form-item label="年龄图标">
          <el-radio-group v-model="agreementDialog.form.ageLimit">
            <el-radio :value="16">16+</el-radio>
            <el-radio :value="18">18+</el-radio>
            <el-radio :value="21">21+</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="协议正文">
          <el-input v-model="agreementDialog.form.contentHtml" type="textarea" :rows="10" placeholder="支持 HTML 富文本；可用变量 {age} 年龄、{protocol} 协议名" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="agreementDialog.form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="agreementDialog.saving" @click="submitAgreement">保 存</el-button>
        <el-button @click="agreementDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberPopupConfig" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import { ElMessage } from 'element-plus';
import { listPopupConfig, listUserAgreement, savePopupConfig, saveUserAgreement } from '@/api/member/popup';
import type { PopupConfigVO, UserAgreementVO } from '@/api/member/popup';

type DataBody<T> = { data?: T };

const { loading, withLoading } = useLoading(true);
const { loading: agreementLoading, withLoading: withAgreementLoading } = useLoading(true);
const popups = ref<PopupConfigVO[]>([]);
const agreements = ref<UserAgreementVO[]>([]);

const popupDialog = reactive<{
  visible: boolean;
  saving: boolean;
  form: PopupConfigVO;
  config: { title?: string; content?: string; scenes?: string[]; idleMinutes?: number; balanceThreshold?: number };
  activitiesText: string;
}>({ visible: false, saving: false, form: { popupType: 1, enabled: 0 }, config: {}, activitiesText: '' });

const agreementDialog = reactive<{ visible: boolean; saving: boolean; form: UserAgreementVO }>({
  visible: false,
  saving: false,
  form: { languageCode: '', ageLimit: 18, status: 1, contentHtml: '' }
});

const popupTypeLabel = (type?: number) =>
  ({ 1: '注册成功弹窗', 2: '智能引导充值弹窗', 3: '注册挽留弹窗' } as Record<number, string>)[type ?? -1] ?? '未知';

const loadPopups = async () => {
  await withLoading(async () => {
    const res = (await listPopupConfig()) as unknown as DataBody<PopupConfigVO[]>;
    popups.value = res.data ?? [];
  });
};

const loadAgreements = async () => {
  await withAgreementLoading(async () => {
    const res = (await listUserAgreement()) as unknown as DataBody<UserAgreementVO[]>;
    agreements.value = res.data ?? [];
  });
};

const openPopup = (row: PopupConfigVO) => {
  Object.assign(popupDialog.form, { ...row });
  let parsed: any = {};
  try {
    parsed = row.configJson ? JSON.parse(row.configJson) : {};
  } catch {
    parsed = {};
  }
  popupDialog.config = {
    title: parsed.title ?? '',
    content: parsed.content ?? '',
    scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
    idleMinutes: Number(parsed.idleMinutes ?? 0),
    balanceThreshold: Number(parsed.balanceThreshold ?? 0)
  };
  popupDialog.activitiesText = Array.isArray(parsed.activities) ? parsed.activities.join(',') : '';
  popupDialog.visible = true;
};

const submitPopup = async () => {
  const type = popupDialog.form.popupType;
  const config: Record<string, unknown> = {};
  if (type === 1) {
    config.title = popupDialog.config.title ?? '';
    config.content = popupDialog.config.content ?? '';
    config.activities = popupDialog.activitiesText
      ? popupDialog.activitiesText.split(',').map((item) => item.trim()).filter((item) => item.length > 0)
      : [];
  } else if (type === 2) {
    config.scenes = popupDialog.config.scenes ?? [];
    config.idleMinutes = popupDialog.config.idleMinutes ?? 0;
    config.balanceThreshold = popupDialog.config.balanceThreshold ?? 0;
    config.title = popupDialog.config.title ?? '';
    config.content = popupDialog.config.content ?? '';
  } else {
    config.content = popupDialog.config.content ?? '';
  }
  popupDialog.saving = true;
  try {
    await savePopupConfig({ popupType: type, enabled: popupDialog.form.enabled, configJson: JSON.stringify(config) });
    ElMessage.success('保存成功');
    popupDialog.visible = false;
    await loadPopups();
  } catch (e) {
    ElMessage.error('保存失败：' + (e as Error).message);
  } finally {
    popupDialog.saving = false;
  }
};

const openAgreement = (row?: UserAgreementVO) => {
  agreementDialog.form = row
    ? { ...row }
    : { languageCode: '', ageLimit: 18, status: 1, contentHtml: '' };
  agreementDialog.visible = true;
};

const submitAgreement = async () => {
  if (!agreementDialog.form.languageCode) {
    ElMessage.error('请填写语言代码');
    return;
  }
  agreementDialog.saving = true;
  try {
    await saveUserAgreement(agreementDialog.form);
    ElMessage.success('保存成功（版本号已 +1）');
    agreementDialog.visible = false;
    await loadAgreements();
  } catch (e) {
    ElMessage.error('保存失败：' + (e as Error).message);
  } finally {
    agreementDialog.saving = false;
  }
};

onMounted(() => {
  loadPopups();
  loadAgreements();
});
</script>

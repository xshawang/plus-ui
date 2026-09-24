<template>
  <div class="p-2 app-container promotion-activity-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>活动中心</h3>
            <p>活动源管理：活动列表 / 已关闭活动 / 优惠统计 / 分类管理；奖励发放统一在「领取与审核」处理。</p>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="活动列表" name="active" />
        <el-tab-pane label="已关闭活动" name="closed" />
        <el-tab-pane label="优惠统计" name="statistic" />
        <el-tab-pane label="分类管理" name="category" />
      </el-tabs>

      <template v-if="activeTab === 'category'">
        <div class="toolbar-line">
          <el-button v-hasPermi="['promotion:category:edit']" type="primary" icon="Plus" @click="openCategoryDialog()">新增分类</el-button>
        </div>
        <el-table v-loading="loading" border :data="categoryRows">
          <el-table-column label="类型" align="center" width="110">
            <template #default="{ row }">{{ row.categoryType === 1 ? '系统默认' : '自定义' }}</template>
          </el-table-column>
          <el-table-column label="未选中icon" align="center" width="120">
            <template #default="{ row }">
              <el-image v-if="row.iconUnselected" :src="row.iconUnselected" fit="contain" style="width: 40px; height: 40px" />
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column label="选中icon" align="center" width="120">
            <template #default="{ row }">
              <el-image v-if="row.iconSelected" :src="row.iconSelected" fit="contain" style="width: 40px; height: 40px" />
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column label="分类名称" prop="categoryName" align="center" min-width="120" />
          <el-table-column label="展示活动数量" align="center" width="140">
            <template #default="{ row }">
              <el-link type="primary" @click="drillCategory(row as PromoCategoryVO)">{{ row.activityCount ?? 0 }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="是否启用" align="center" width="110">
            <template #default="{ row }">
              <el-switch
                v-model="row.enabled"
                :active-value="1"
                :inactive-value="0"
                :disabled="!canEditCategory(row as PromoCategoryVO)"
                @change="(val: number) => toggleCategory(row as PromoCategoryVO, val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="150">
            <template #default="{ row }">
              <template v-if="canEditCategory(row as PromoCategoryVO)">
                <el-button v-hasPermi="['promotion:category:edit']" link type="primary" @click="openCategoryDialog(row as PromoCategoryVO)">修改</el-button>
                <el-button v-hasPermi="['promotion:category:edit']" link type="danger" @click="removeCategory(row as PromoCategoryVO)">删除</el-button>
              </template>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
          <el-table-column label="操作时间" prop="updatedAt" align="center" width="170" />
        </el-table>
        <div class="summary-bar">共 {{ categoryRows.length }} 条</div>
      </template>

      <template v-else-if="activeTab === 'statistic'">
        <el-form inline class="query-bar">
          <el-form-item label="活动ID">
            <el-input-number v-model="statQuery.activityId" :min="0" :controls="false" style="width: 140px" />
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="statTimeRange"
              type="datetimerange"
              value-format="YYYY-MM-DD HH:mm:ss"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 380px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="loadStatistic">搜索</el-button>
            <el-button icon="Refresh" @click="resetStatistic">重置</el-button>
          </el-form-item>
        </el-form>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          class="stat-tip"
          title="已领取人数：已领取/派发到账总人数；可参与人数：符合活动条件的总人数；已领取金额：已领取/派发到账总金额；活动金额：活动设置总金额/派发/已领取总金额"
        />
        <el-table v-loading="statLoading" border :data="statRows" show-summary :summary-method="statSummary">
          <el-table-column label="活动ID" prop="activityId" align="center" width="110" />
          <el-table-column label="活动名称" prop="activityName" min-width="200" show-overflow-tooltip />
          <el-table-column label="会员币种" prop="currency" align="center" width="110" />
          <el-table-column label="活动类型" prop="activityType" align="center" width="150" show-overflow-tooltip />
          <el-table-column label="已领取人数" prop="claimedUsers" align="right" width="120" />
          <el-table-column label="领取次数" prop="claimTimes" align="right" width="110" />
          <el-table-column label="可参与人数" prop="joinableUsers" align="right" width="120" />
          <el-table-column label="已领取金额" align="right" width="140">
            <template #default="{ row }">{{ fmtMoney(row.claimedAmount) }}</template>
          </el-table-column>
          <el-table-column label="活动金额" align="right" width="140">
            <template #default="{ row }">{{ fmtMoney(row.activityAmount) }}</template>
          </el-table-column>
        </el-table>
        <div class="summary-bar">共 {{ statRows.length }} 条</div>
      </template>

      <template v-else>
        <el-form :model="query" inline class="query-bar">
          <el-form-item label="活动分类">
            <el-select v-model="query.categoryId" placeholder="全部" clearable style="width: 150px">
              <el-option v-for="item in categoryRows" :key="item.categoryId" :label="item.categoryName" :value="item.categoryId" />
            </el-select>
          </el-form-item>
          <el-form-item label="活动类型">
            <el-select v-model="query.activityType" placeholder="全部" clearable style="width: 150px">
              <el-option v-for="item in typeOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="活动ID">
            <el-input-number v-model="query.activityId" :min="0" :controls="false" style="width: 140px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
              <el-option label="草稿" :value="0" />
              <el-option label="进行中" :value="1" />
              <el-option label="运营关闭" :value="2" />
              <el-option label="过期关闭" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="会员层级">
            <el-select v-model="query.memberLevel" placeholder="全部" clearable style="width: 150px">
              <el-option v-for="item in levelOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="参与VIP等级">
            <el-select v-model="query.vipLevel" placeholder="全部" clearable style="width: 140px">
              <el-option v-for="item in vipOptions" :key="item" :label="'VIP' + item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="活动名称">
            <el-input v-model="query.keyword" placeholder="请输入活动名称" clearable style="width: 170px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="toolbar-line">
          <template v-if="activeTab === 'active'">
            <el-button v-hasPermi="['promotion:activity:list']" plain @click="openActivitySetting">活动设置</el-button>
      <el-button v-hasPermi="['promotion:activity:list']" plain @click="openDetail()">详情</el-button>
            <el-button v-hasPermi="['promotion:activity:edit']" type="primary" icon="Plus" @click="openActivityDialog()">新增活动</el-button>
          </template>
        </div>

        <el-table v-loading="loading" border :data="rows" @selection-change="(val: PromoActivityVO[]) => (selectedRows = val)">
          <el-table-column type="selection" width="46" />
          <el-table-column label="ID" prop="instanceId" align="center" width="90" />
          <el-table-column label="活动名称" prop="instanceName" min-width="180" show-overflow-tooltip />
          <el-table-column label="活动分类" prop="categoryName" align="center" width="110" />
          <el-table-column label="活动币种" prop="currency" align="center" width="110" />
          <el-table-column label="活动类型" prop="activityTypeCode" align="center" width="130" show-overflow-tooltip />
          <el-table-column label="活动条件" prop="conditionCode" align="center" width="130" show-overflow-tooltip />
          <el-table-column label="参与层级" prop="joinLevels" min-width="140" show-overflow-tooltip />
          <el-table-column label="参与VIP等级" align="center" width="130">
            <template #default="{ row }">{{ row.joinVipLevels || '不限制' }}</template>
          </el-table-column>
          <el-table-column label="稽核倍数" align="right" width="110">
            <template #default="{ row }">{{ Number(row.auditMultiple ?? 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="活动申领终端" prop="applyTerminals" min-width="160" show-overflow-tooltip />
          <el-table-column label="悬浮图" align="center" width="100">
            <template #default="{ row }">
              <el-image v-if="row.floatImage" :src="row.floatImage" fit="contain" style="width: 36px; height: 36px" />
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="派发方式" prop="dispatchMode" align="center" width="140" />
          <el-table-column label="活动时间" align="center" width="180">
            <template #default="{ row }">
              <div>{{ row.startAt || '--' }}</div>
              <div>{{ row.endAt || '--' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="展示时间" align="center" width="180">
            <template #default="{ row }">
              <div>{{ row.displayStartAt || '--' }}</div>
              <div>{{ row.displayEndAt || '--' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)">{{ statusText(row as PromoActivityVO) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="270" fixed="right">
            <template #default="{ row }">
      <el-button link type="primary" @click="openDetail(row as PromoActivityVO)">详情</el-button>
              <template v-if="activeTab === 'active'">
                <el-button v-hasPermi="['promotion:activity:edit']" link type="primary" @click="openActivityDialog(row as PromoActivityVO)">修改</el-button>
                <el-button v-hasPermi="['promotion:activity:edit']" link type="warning" @click="handleClose(row as PromoActivityVO)">关闭活动</el-button>
                <el-button v-hasPermi="['promotion:activity:edit']" link type="primary" @click="handleCopy(row as PromoActivityVO)">复制</el-button>
                <el-button link type="primary" @click="gotoGrant(row as PromoActivityVO, 'audit')">派发奖励</el-button>
                <el-button link type="primary" @click="gotoGrant(row as PromoActivityVO, 'claimed')">已领取</el-button>
              </template>
              <template v-else>
                <el-button v-hasPermi="['promotion:activity:edit']" link type="danger" @click="handleDelete(row as PromoActivityVO)">删除</el-button>
                <el-button v-hasPermi="['promotion:activity:edit']" link type="primary" @click="handleCopy(row as PromoActivityVO)">复制</el-button>
                <el-button link type="primary" @click="gotoGrant(row as PromoActivityVO, 'claimed')">已领取</el-button>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
          <el-table-column label="操作时间" prop="updatedAt" align="center" width="170" />
        </el-table>

        <pagination
          v-show="total > 0"
          v-model:page="query.pageNum"
          v-model:limit="query.pageSize"
          :total="total"
          @pagination="loadRows"
        />
      </template>
    </el-card>

    <el-dialog v-model="setting.visible" title="活动设置" width="720px" append-to-body destroy-on-close>
      <el-form v-loading="setting.loading" label-width="200px">
        <el-form-item label="活动前端样式">
          <el-select v-model="setting.values.front_style" style="width: 340px">
            <el-option label="展示活动列表（不推荐）" value="LIST" />
            <el-option label="直接查看活动内容（去掉二级页面，推荐）" value="CONTENT" />
            <el-option label="图标菜单" value="ICON" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户端是否展示分类">
          <el-switch v-model="setting.values.show_category" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="活动页面查看方式">
          <el-select v-model="setting.values.page_view_mode" style="width: 340px">
            <el-option label="列表" value="LIST" />
            <el-option label="图标" value="ICON" />
            <el-option label="搜索" value="SEARCH" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动内其他活动展示位置">
          <el-radio-group v-model="setting.values.other_activity_position">
            <el-radio value="BOTTOM">底部</el-radio>
            <el-radio value="TOP">顶部</el-radio>
            <el-radio value="NONE">不展示其他活动</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="客户端是否展示搜索栏">
          <el-radio-group v-model="setting.values.show_search_bar">
            <el-radio :value="0">隐藏</el-radio>
            <el-radio :value="1">展示</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="setting.saving" @click="saveSetting">确认</el-button>
        <el-button @click="setting.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="780px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="活动名称" prop="instanceName">
          <el-input v-model="form.instanceName" maxlength="120" placeholder="请输入活动名称（唯一）" />
        </el-form-item>
        <el-form-item label="活动副标题">
          <el-input v-model="form.subject" maxlength="200" />
        </el-form-item>
        <el-form-item label="活动分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择" style="width: 280px">
            <el-option
              v-for="item in categoryRows.filter((c) => c.enabled === 1)"
              :key="item.categoryId"
              :label="item.categoryName"
              :value="item.categoryId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动类型">
          <el-select v-model="form.activityTypeCode" filterable allow-create placeholder="可选择或自定义" style="width: 280px">
            <el-option v-for="item in typeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动币种">
          <el-select v-model="form.currency" style="width: 200px">
            <el-option label="所有币种" value="ALL" />
            <el-option label="VND" value="VND" />
            <el-option label="USDT" value="USDT" />
            <el-option label="THB" value="THB" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动条件">
          <el-select v-model="form.conditionCode" filterable allow-create style="width: 280px">
            <el-option v-for="item in conditionOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="参与层级">
          <el-select v-model="joinLevelValues" multiple clearable placeholder="不选=不限制" style="width: 100%">
            <el-option v-for="item in levelOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="参与VIP等级">
          <el-select v-model="joinVipValues" multiple clearable placeholder="不选=不限制" style="width: 100%">
            <el-option v-for="item in vipOptions" :key="item" :label="'VIP' + item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="稽核倍数">
          <el-input-number v-model="form.auditMultiple" :min="0" :precision="2" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="活动申领终端">
          <el-select v-model="terminalValues" multiple clearable style="width: 100%">
            <el-option v-for="item in terminalOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="悬浮图URL">
          <el-input v-model="form.floatImage" placeholder="可为空" />
        </el-form-item>
        <el-form-item label="派发方式">
          <el-select v-model="form.dispatchMode" style="width: 260px">
            <el-option label="玩家自领" value="玩家自领" />
            <el-option label="系统自动派发" value="系统自动派发" />
            <el-option label="玩家自领-过期作废" value="玩家自领-过期作废" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="activityTime"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="展示时间">
          <el-date-picker
            v-model="displayTime"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 200px">
            <el-option label="草稿" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="运营关闭" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitForm">确认</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryDialog.visible" :title="categoryDialog.title" width="560px" append-to-body destroy-on-close>
      <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="130px">
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="categoryForm.categoryName" maxlength="50" />
        </el-form-item>
        <el-form-item label="未选中icon">
          <el-input v-model="categoryForm.iconUnselected" placeholder="图标URL" />
        </el-form-item>
        <el-form-item label="选中icon">
          <el-input v-model="categoryForm.iconSelected" placeholder="图标URL" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" :controls="false" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="categoryForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="categorySaving" @click="submitCategory">确认</el-button>
        <el-button @click="categoryDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PromotionActivityCenter" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addPromoCategory,
  closePromoActivity,
  copyPromoActivity,
  deletePromoActivity,
  deletePromoCategory,
  getPromoActivity,
  getPromoActivityOptions,
  listPromoActivity,
  listPromoCategory,
  savePromoActivity,
  togglePromoCategory,
  updatePromoCategory
} from '@/api/promotion/activity';
import type { PromoActivityForm, PromoActivityQuery, PromoActivityVO, PromoCategoryForm, PromoCategoryVO } from '@/api/promotion/activity/types';
import { getPromoStatistic } from '@/api/promotion/report';
import { usePromoKvConfig } from '@/views/promotion/components/usePromoKvConfig';

/**
 * 活动中心页（需求文档 01：活动列表 / 已关闭活动 / 优惠统计 / 分类管理 + 活动设置）。
 *
 * 设计要点：
 *   ① 活动列表与已关闭活动共用同一表格与筛选，靠 scope 区分，避免两处列定义漂移；
 *   ② 优惠统计直接复用「优惠明细」页的服务端聚合口径，不另算一套数；
 *   ③ 活动设置是 KV 配置（/infra/promotion/config/activity-setting），复用通用组合式函数。
 */
type Row = Record<string, any>;

const router = useRouter();
const { loading, withLoading } = useLoading();
const { loading: saving, withLoading: withSaving } = useLoading();
const { loading: categorySaving, withLoading: withCategorySaving } = useLoading();
const { loading: statLoading, withLoading: withStatLoading } = useLoading();

const activeTab = ref('active');
const rows = ref<PromoActivityVO[]>([]);
const total = ref(0);
const selectedRows = ref<PromoActivityVO[]>([]);
const categoryRows = ref<PromoCategoryVO[]>([]);
const typeOptions = ref<string[]>([]);
const levelOptions = ref<string[]>([]);
const vipOptions = ref<string[]>([]);
const terminalOptions = ref<string[]>([]);
const conditionOptions = ref<string[]>([]);

const query = reactive<PromoActivityQuery & { pageNum: number; pageSize: number }>({ pageNum: 1, pageSize: 10, scope: 'active' });
const statQuery = reactive<{ activityId?: number }>({});
const statTimeRange = ref<string[]>([]);
const statRows = ref<Row[]>([]);
const statTotal = reactive<Row>({ claimedUsers: 0, claimTimes: 0, joinableUsers: 0, claimedAmount: 0, activityAmount: 0 });

const formRef = ref();
const dialog = reactive({ visible: false, title: '' });
const form = reactive<PromoActivityForm>({ instanceName: '', currency: 'ALL', status: 0, auditMultiple: 0, frontStyle: 'LIST' });
const activityTime = ref<string[]>([]);
const displayTime = ref<string[]>([]);
const joinLevelValues = ref<string[]>([]);
const joinVipValues = ref<string[]>([]);
const terminalValues = ref<string[]>([]);

const categoryFormRef = ref();
const categoryDialog = reactive({ visible: false, title: '' });
const categoryForm = reactive<PromoCategoryForm>({ categoryName: '', enabled: 1, sortOrder: 0 });

const rules = {
  instanceName: [{ required: true, message: '活动名称不能为空', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择活动分类', trigger: 'change' }]
};

const categoryRules = {
  categoryName: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }]
};

const setting = usePromoKvConfig('activity-setting', [
  { key: 'front_style', label: '活动前端样式', type: 'select' },
  { key: 'show_category', label: '客户端是否展示分类', type: 'switch' },
  { key: 'page_view_mode', label: '活动页面查看方式', type: 'select' },
  { key: 'other_activity_position', label: '活动内其他活动展示位置', type: 'select' },
  { key: 'show_search_bar', label: '客户端是否展示搜索栏', type: 'switch' }
]);

const statusText = (row: PromoActivityVO) => {
  if (row.status === 3) return '过期关闭';
  if (row.status === 2) return row.closeType === 1 ? '运营关闭' : '已关闭';
  if (row.status === 1) return '进行中';
  if (row.status === 0) return '草稿';
  return '未知';
};

const statusTag = (status?: number) => (status === 1 ? 'success' : status === 0 ? 'info' : 'warning');

const fmtMoney = (value?: number) =>
  value === undefined || value === null ? '-' : (Number(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });

const canEditCategory = (row: PromoCategoryVO) => row.categoryType !== 1;

const loadOptions = async () => {
  const res = (await getPromoActivityOptions()) as { data?: Record<string, any> };
  const data = res.data ?? {};
  typeOptions.value = data.activityTypes ?? [];
  levelOptions.value = data.memberLevels ?? [];
  vipOptions.value = data.vipLevels ?? [];
  terminalOptions.value = data.terminals ?? [];
  conditionOptions.value = data.conditions ?? [];
};

const loadCategories = async () => {
  const res = (await listPromoCategory()) as { data?: PromoCategoryVO[] };
  categoryRows.value = res.data ?? [];
};

const loadRows = async () => {
  await withLoading(async () => {
    query.scope = activeTab.value === 'closed' ? 'closed' : 'active';
    const res = (await listPromoActivity(query)) as { rows?: PromoActivityVO[]; total?: number };
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const loadStatistic = async () => {
  await withStatLoading(async () => {
    const res = (await getPromoStatistic({
      activityId: statQuery.activityId,
      timeStart: statTimeRange.value?.[0],
      timeEnd: statTimeRange.value?.[1]
    })) as { data?: { rows?: Row[]; total?: Row } };
    statRows.value = res.data?.rows ?? [];
    Object.assign(statTotal, res.data?.total ?? {});
  });
};

const statSummary = () => [
  '总计',
  '',
  '',
  '',
  statTotal.claimedUsers,
  statTotal.claimTimes,
  statTotal.joinableUsers,
  fmtMoney(statTotal.claimedAmount),
  fmtMoney(statTotal.activityAmount)
];

const resetStatistic = () => {
  statQuery.activityId = undefined;
  statTimeRange.value = [];
  loadStatistic();
};

const handleTabChange = () => {
  if (activeTab.value === 'statistic') {
    loadStatistic();
    return;
  }
  if (activeTab.value === 'category') {
    loadCategories();
    return;
  }
  query.pageNum = 1;
  loadRows();
};

const handleSearch = () => {
  query.pageNum = 1;
  loadRows();
};

const handleReset = () => {
  Object.assign(query, {
    pageNum: 1,
    pageSize: 10,
    categoryId: undefined,
    activityType: undefined,
    activityId: undefined,
    status: undefined,
    memberLevel: undefined,
    vipLevel: undefined,
    keyword: undefined
  });
  loadRows();
};

const drillCategory = (row: PromoCategoryVO) => {
  activeTab.value = 'active';
  query.categoryId = row.categoryId;
  query.pageNum = 1;
  loadRows();
};

const openActivitySetting = async () => {
  setting.visible = true;
  await setting.load();
};

const saveSetting = async () => {
  await setting.save();
  modal.msgSuccess('活动设置已保存');
  setting.visible = false;
};

const openActivityDialog = async (row?: PromoActivityVO) => {
  dialog.title = row ? '修改活动' : '新增活动';
  dialog.visible = true;
  activityTime.value = [];
  displayTime.value = [];
  joinLevelValues.value = [];
  joinVipValues.value = [];
  terminalValues.value = [];
  if (row) {
    const res = (await getPromoActivity(row.instanceId)) as { data?: PromoActivityVO };
    const detail = res.data ?? row;
    Object.assign(form, detail);
    activityTime.value = detail.startAt && detail.endAt ? [detail.startAt, detail.endAt] : [];
    displayTime.value = detail.displayStartAt && detail.displayEndAt ? [detail.displayStartAt, detail.displayEndAt] : [];
    joinLevelValues.value = detail.joinLevels ? detail.joinLevels.split(',').filter(Boolean) : [];
    joinVipValues.value = detail.joinVipLevels ? detail.joinVipLevels.split(',').filter(Boolean) : [];
    terminalValues.value = detail.applyTerminals ? detail.applyTerminals.split(',').filter(Boolean) : [];
  } else {
    Object.assign(form, {
      instanceId: undefined,
      instanceName: '',
      subject: '',
      categoryId: undefined,
      activityTypeCode: '',
      currency: 'ALL',
      conditionCode: '',
      auditMultiple: 0,
      floatImage: '',
      dispatchMode: '玩家自领',
      status: 0,
      frontStyle: 'LIST'
    });
  }
};

const submitForm = async () => {
  await formRef.value.validate();
  form.startAt = activityTime.value?.[0];
  form.endAt = activityTime.value?.[1];
  form.displayStartAt = displayTime.value?.[0];
  form.displayEndAt = displayTime.value?.[1];
  form.joinLevels = joinLevelValues.value.join(',');
  form.joinVipLevels = joinVipValues.value.join(',');
  form.applyTerminals = terminalValues.value.join(',');
  await withSaving(async () => {
    await savePromoActivity(form);
  });
  modal.msgSuccess('保存成功');
  dialog.visible = false;
  await loadRows();
  await loadCategories();
};

const openDetail = async (row?: PromoActivityVO) => {
  const target = row ?? selectedRows.value[0];
  if (!target) {
    modal.msgWarning('请先选择一条活动');
    return;
  }
  const res = (await getPromoActivity(target.instanceId)) as { data?: PromoActivityVO };
  const detail = res.data ?? target;
  modal.alert(
    `<div style="line-height:1.8">
      <div>活动ID：${detail.instanceId}</div>
      <div>活动名称：${detail.instanceName ?? ''}</div>
      <div>活动类型：${detail.activityTypeCode || '-'}</div>
      <div>活动条件：${detail.conditionCode || '-'}</div>
      <div>参与层级：${detail.joinLevels || '不限制'}</div>
      <div>参与VIP：${detail.joinVipLevels || '不限制'}</div>
      <div>稽核倍数：${Number(detail.auditMultiple ?? 0).toFixed(2)}</div>
      <div>活动时间：${detail.startAt || '--'} ~ ${detail.endAt || '--'}</div>
      <div>展示时间：${detail.displayStartAt || '--'} ~ ${detail.displayEndAt || '--'}</div>
    </div>`
  );
};

const handleClose = async (row: PromoActivityVO) => {
  await modal.confirm(`确认关闭活动「${row.instanceName}」？关闭后不影响已产生的发放单。`);
  await closePromoActivity(row.instanceId);
  modal.msgSuccess('活动已关闭');
  await loadRows();
};

const handleDelete = async (row: PromoActivityVO) => {
  await modal.confirm(`确认删除活动「${row.instanceName}」？删除为逻辑删除，保留发放流水可追溯。`);
  await deletePromoActivity(row.instanceId);
  modal.msgSuccess('删除成功');
  await loadRows();
};

const handleCopy = async (row: PromoActivityVO) => {
  await modal.confirm(`确认复制活动「${row.instanceName}」？复制后时间与状态会重置为草稿。`);
  const res = (await copyPromoActivity(row.instanceId)) as { data?: number };
  modal.msgSuccess(`复制成功，新活动ID ${res.data ?? '-'}（状态：草稿）`);
  activeTab.value = 'active';
  await loadRows();
  await loadCategories();
};

const gotoGrant = (row: PromoActivityVO, tab: string) => {
  router.push({ path: '/promotion/grant-audit', query: { activityId: String(row.instanceId), tab } });
};

const openCategoryDialog = (row?: PromoCategoryVO) => {
  categoryDialog.title = row ? '修改分类' : '新增分类';
  categoryDialog.visible = true;
  if (row) {
    Object.assign(categoryForm, {
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      iconUnselected: row.iconUnselected,
      iconSelected: row.iconSelected,
      enabled: row.enabled,
      sortOrder: row.sortOrder
    });
  } else {
    Object.assign(categoryForm, { categoryId: undefined, categoryName: '', iconUnselected: '', iconSelected: '', enabled: 1, sortOrder: 0 });
  }
};

const submitCategory = async () => {
  await categoryFormRef.value.validate();
  await withCategorySaving(async () => {
    if (categoryForm.categoryId) {
      await updatePromoCategory(categoryForm);
    } else {
      await addPromoCategory(categoryForm);
    }
  });
  modal.msgSuccess('保存成功');
  categoryDialog.visible = false;
  await loadCategories();
};

const toggleCategory = async (row: PromoCategoryVO, enabled: number) => {
  await togglePromoCategory(row.categoryId, enabled);
  modal.msgSuccess(enabled === 1 ? '分类已启用' : '分类已停用');
  await loadCategories();
};

const removeCategory = async (row: PromoCategoryVO) => {
  await modal.confirm(`确认删除分类「${row.categoryName}」？分类下仍有活动时将拒绝删除。`);
  await deletePromoCategory(row.categoryId);
  modal.msgSuccess('删除成功');
  await loadCategories();
};

onMounted(async () => {
  await loadOptions();
  await loadCategories();
  await loadRows();
});
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.table-heading h3 {
  margin: 0 0 4px;
}

.table-heading p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.toolbar-line {
  margin: 8px 0;
  display: flex;
  gap: 8px;
}

.query-bar {
  margin-top: 8px;
}

.stat-tip {
  margin: 8px 0;
}

.summary-bar {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}
</style>

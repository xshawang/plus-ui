<template>
  <div class="p-2 app-container member-quest-center-page">
    <el-tabs v-model="activeTab" class="quest-tabs">
      <el-tab-pane label="新人福利设置" name="welfare">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="任务条件">
              <el-select v-model="questQuery.code" placeholder="全部" clearable style="width: 180px">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="任务标题">
              <el-input v-model="questQuery.title" placeholder="任务标题" clearable style="width: 160px" @keyup.enter="getQuestList" />
            </el-form-item>
            <el-form-item label="是否开启">
              <el-select v-model="questQuery.status" placeholder="全部" clearable style="width: 110px">
                <el-option label="开启" :value="1" />
                <el-option label="关闭" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getQuestList">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuestQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm">
            口径：列表按「排序」升序展示并决定前台任务顺序；奖励金额单位均为分；仅「是否开启」的任务允许发放奖励，
            发放为真实入账且幂等（单号 TX:QUEST:会员:任务:周期，重复触发只生效一次）。
          </div>
        </el-card>

        <el-card shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>新人福利设置</h3>
                <p>共 {{ questTotal }} 条</p>
              </div>
              <div class="toolbar-actions">
                <el-button v-hasPermi="['member:quest:edit']" type="primary" plain icon="Plus" @click="openQuestEdit()">新增任务</el-button>
                <el-button v-hasPermi="['member:quest:edit']" type="success" plain icon="Wallet" @click="openGrant()">发放奖励</el-button>
                <el-button icon="Setting" @click="openSetting">全局设置</el-button>
              </div>
            </div>
          </template>
          <el-table v-loading="questLoading" border :data="questRows">
            <el-table-column label="排序" prop="sortOrder" align="center" width="70" />
            <el-table-column label="ID" prop="id" align="center" width="90" />
            <el-table-column label="任务条件" prop="conditionLabel" align="center" min-width="140" show-overflow-tooltip />
            <el-table-column label="任务标题" prop="title" align="left" min-width="150" show-overflow-tooltip />
            <el-table-column label="奖励类型" align="center" width="110">
              <template #default="{ row }">{{ row.rewardTypeLabel ?? '固定' }}</template>
            </el-table-column>
            <el-table-column label="奖励金额(分)" prop="rewardAmount" align="right" width="120" />
            <el-table-column label="额外奖励" align="center" width="100">
              <template #default="{ row }">{{ row.extraPoint ? row.extraPoint : '-' }}</template>
            </el-table-column>
            <el-table-column label="参与会员" prop="audienceTypeLabel" align="center" width="140" show-overflow-tooltip />
            <el-table-column label="是否开启" align="center" width="100">
              <template #default="{ row }">
                <el-switch :model-value="row.status === 1" @change="(val: any) => changeQuestStatus(row as QuestConfigVO, val ? 1 : 0)" />
              </template>
            </el-table-column>
            <el-table-column label="提示气泡" align="center" width="100">
              <template #default="{ row }">
                <el-switch :model-value="row.bubbleFlag === 1" @change="(val: any) => changeQuestBubble(row as QuestConfigVO, val ? 1 : 0)" />
              </template>
            </el-table-column>
            <el-table-column label="操作人" prop="operatorId" align="center" width="110" />
            <el-table-column label="操作时间" prop="operatedAt" align="center" width="170" />
            <el-table-column label="操作" align="center" width="140" fixed="right">
              <template #default="{ row }">
                <el-button v-hasPermi="['member:quest:edit']" link type="primary" @click="openQuestEdit(row as QuestConfigVO)">修改</el-button>
                <el-button link type="primary" @click="openRecord(row as QuestConfigVO)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="questTotal > 0"
            v-model:page="questQuery.pageNum"
            v-model:limit="questQuery.pageSize"
            :total="questTotal"
            @pagination="getQuestList"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="奖励发放记录" name="reward">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="会员ID">
              <el-input v-model="rewardQuery.uid" placeholder="会员ID" clearable style="width: 180px" @keyup.enter="getRewardList" />
            </el-form-item>
            <el-form-item label="会员账号">
              <el-input v-model="rewardQuery.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="getRewardList" />
            </el-form-item>
            <el-form-item label="任务条件">
              <el-select v-model="rewardQuery.questCode" placeholder="全部" clearable style="width: 180px">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="rewardQuery.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="待发放" :value="1" />
                <el-option label="已发放" :value="2" />
                <el-option label="异常" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getRewardList">搜索</el-button>
              <el-button icon="Refresh" @click="resetRewardQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm">口径：发放记录是对账凭据；异常记录可用同一幂等键重试，不会重复入账。</div>
        </el-card>

        <el-card shadow="hover" class="table-panel">
          <el-table v-loading="rewardLoading" border :data="rewardRows">
            <el-table-column label="记录ID" prop="recordId" align="center" width="170" show-overflow-tooltip />
            <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
            <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column label="任务" prop="questTitle" align="center" min-width="140" show-overflow-tooltip />
            <el-table-column label="周期" prop="periodKey" align="center" width="120" />
            <el-table-column label="奖励(分)" prop="rewardAmount" align="right" width="100" />
            <el-table-column label="额外活跃度" prop="extraPoint" align="right" width="110" />
            <el-table-column label="状态" align="center" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 2 ? 'success' : row.status === 4 ? 'danger' : 'warning'">
                  {{ rewardStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="钱包单号" prop="bizNo" align="left" min-width="240" show-overflow-tooltip />
            <el-table-column label="失败原因" prop="failReason" align="left" min-width="140" show-overflow-tooltip />
            <el-table-column label="时间" prop="createdAt" align="center" width="170" />
            <el-table-column label="操作" align="center" width="90" fixed="right">
              <template #default="{ row }">
                <el-button v-hasPermi="['member:quest:edit']" link type="primary" :disabled="row.status === 2" @click="retryReward(row as QuestRewardRecordVO)">重试</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="rewardTotal > 0"
            v-model:page="rewardQuery.pageNum"
            v-model:limit="rewardQuery.pageSize"
            :total="rewardTotal"
            @pagination="getRewardList"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="剩余活跃度" name="activity">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="queryParams.uid" placeholder="会员ID" clearable style="width: 170px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：剩余活跃度 = 总获得 − 总消耗 − 总过期；默认有效期 12 个月；后台增减需带幂等号，重复提交只生效一次。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>任务中心 · 剩余活跃度</h3>
            <p>共 {{ total }} 条</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:quest:edit']" type="primary" plain icon="Plus" @click="openAdd()">新增活跃度</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="币种" prop="currency" align="center" width="110" />
        <el-table-column label="会员ID" align="center" width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="openLogs(row as ActivityPointVO)">{{ row.uid }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="总获得" prop="totalEarned" align="right" width="110" sortable />
        <el-table-column label="总消耗" prop="totalSpent" align="right" width="110" sortable />
        <el-table-column label="总过期" prop="totalExpired" align="right" width="110" sortable />
        <el-table-column label="剩余活跃度" align="right" width="130" sortable>
          <template #default="{ row }">
            <span class="font-bold">{{ row.remainPoint ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" prop="expireAt" align="center" width="180" />
        <el-table-column label="更新时间" prop="updatedAt" align="center" width="180" />
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:quest:edit']" link type="primary" @click="openAdd(row.uid as number)">增加</el-button>
            <el-button link type="primary" @click="openLogs(row as ActivityPointVO)">流水</el-button>
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
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="addDialog.visible" title="新增/扣减活跃度" width="620px" append-to-body destroy-on-close>
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="140px">
        <el-form-item label="会员ID" prop="uid">
          <el-input v-model="addForm.uid" placeholder="请输入会员ID" />
        </el-form-item>
        <el-form-item label="变动类型" prop="changeType">
          <el-select v-model="addForm.changeType" style="width: 100%">
            <el-option label="后台增加" :value="1" />
            <el-option label="后台扣减" :value="2" />
            <el-option label="任务奖励" :value="3" />
            <el-option label="消耗" :value="4" />
            <el-option label="过期" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="活跃度数量" prop="point">
          <el-input-number v-model="addForm.point" :min="1" :max="999999999" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="请求幂等号" prop="requestId">
          <el-input v-model="addForm.requestId" placeholder="重复提交相同值不会重复生效" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitAdd">确 定</el-button>
        <el-button @click="addDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logDialog.visible" :title="'活跃度流水 - 会员 ' + logDialog.uid" width="900px" append-to-body destroy-on-close>
      <el-table v-loading="logLoading" border :data="logRows" max-height="460">
        <el-table-column label="时间" prop="createdAt" align="center" width="180" />
        <el-table-column label="类型" align="center" width="110">
          <template #default="{ row }">{{ changeTypeLabel(row.changeType) }}</template>
        </el-table-column>
        <el-table-column label="变动值" align="right" width="110">
          <template #default="{ row }">
            <span :class="Number(row.changePoint) >= 0 ? 'text-red-500' : 'text-green-600'">{{ row.changePoint }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变动前" prop="beforePoint" align="right" width="110" />
        <el-table-column label="变动后" prop="afterPoint" align="right" width="110" />
        <el-table-column label="备注" prop="remark" align="left" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作人" prop="operatorId" align="center" width="140" />
      </el-table>
    </el-dialog>

    <el-dialog
      v-model="questDialog.visible"
      :title="questForm.id ? '修改新人福利任务' : '新增新人福利任务'"
      width="780px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="questFormRef" :model="questForm" :rules="questRules" label-width="130px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="任务条件" prop="code">
              <el-select v-model="questForm.code" filterable allow-create default-first-option style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务标题" prop="title">
              <el-input v-model="questForm.title" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务类型">
              <el-select v-model="questForm.questType" style="width: 100%">
                <el-option label="新人/一次性" :value="1" />
                <el-option label="每日" :value="2" />
                <el-option label="普通" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种">
              <el-input v-model="questForm.currency" placeholder="VND" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参与会员">
              <el-select v-model="questForm.audienceType" style="width: 100%">
                <el-option v-for="item in audienceOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人群参数">
              <el-input v-model="questForm.audienceParams" placeholder="层级/VIP/标签ID/上级UID，逗号分隔" maxlength="512" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="奖励类型">
              <el-select v-model="questForm.rewardType" style="width: 100%">
                <el-option label="固定金额" :value="1" />
                <el-option label="按充值比例" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="奖励金额(分)" prop="rewardAmount">
              <el-input-number v-model="questForm.rewardAmount" :min="0" :max="999999999" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="奖励比例">
              <el-input-number v-model="questForm.rewardRatio" :min="0" :precision="4" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="额外活跃度">
              <el-input-number v-model="questForm.extraPoint" :min="0" :max="999999999" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务目标值">
              <el-input-number v-model="questForm.targetValue" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发放时机">
              <el-select v-model="questForm.rewardTiming" style="width: 100%">
                <el-option label="自动发放" :value="1" />
                <el-option label="手动领取" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="领取过期(天)">
              <el-input-number v-model="questForm.claimExpireDays" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期开始">
              <!--
                FIX: 2026-09-30 日期格式由 `YYYY-MM-DDTHH:mm:ss`（带 T）改为 `YYYY-MM-DD HH:mm:ss`（空格）。
                原因：后端 QuestConfigDTO.validStart/validEnd 是 LocalDateTime，全局 Jackson
                （go88-common-json/JacksonConfig）只认 `yyyy-MM-dd HH:mm:ss`，带 T 的 ISO 串会 400：
                「请求参数格式错误：Text '2026-10-01T00:00:00' could not be parsed at index 10」。
              -->
              <el-date-picker v-model="questForm.validStart" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期结束">
              <el-date-picker v-model="questForm.validEnd" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="打码倍数">
              <el-input-number v-model="questForm.turnoverMultiple" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="questForm.sortOrder" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否开启">
              <el-switch v-model="questForm.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提示气泡">
              <el-switch v-model="questForm.bubbleFlag" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="任务说明">
              <el-input v-model="questForm.content" type="textarea" :rows="2" maxlength="512" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="规则说明">
              <el-input v-model="questForm.ruleDesc" type="textarea" :rows="2" maxlength="1024" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="questSaving" @click="submitQuestEdit">确 定</el-button>
        <el-button @click="questDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordDialog.visible" :title="'任务完成明细 - ' + recordDialog.title" width="960px" append-to-body destroy-on-close>
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="recordQuery.uid" placeholder="会员ID" clearable style="width: 170px" @keyup.enter="getRecordList" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="recordQuery.loginName" placeholder="会员账号" clearable style="width: 150px" @keyup.enter="getRecordList" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="recordQuery.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="未完成" :value="0" />
            <el-option label="已完成" :value="1" />
            <el-option label="已领取" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getRecordList">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="recordLoading" border :data="recordRows" max-height="420">
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="任务" prop="questTitle" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="进度/目标" align="center" width="120">
          <template #default="{ row }">{{ row.progress ?? 0 }} / {{ row.targetValue ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="statusLabel" align="center" width="100" />
        <el-table-column label="周期日" prop="periodDate" align="center" width="120" />
        <el-table-column label="领取时间" prop="rewardedAt" align="center" width="170" />
      </el-table>
      <pagination
        v-show="recordTotal > 0"
        v-model:page="recordQuery.pageNum"
        v-model:limit="recordQuery.pageSize"
        :total="recordTotal"
        @pagination="getRecordList"
      />
    </el-dialog>

    <el-dialog v-model="grantDialog.visible" title="任务奖励发放（真实入账）" width="620px" append-to-body destroy-on-close>
      <el-form ref="grantFormRef" :model="grantForm" :rules="grantRules" label-width="130px">
        <el-form-item label="会员ID" prop="uid">
          <el-input v-model="grantForm.uid" placeholder="会员ID" />
        </el-form-item>
        <el-form-item label="任务" prop="questId">
          <el-select v-model="grantForm.questId" filterable placeholder="选择任务" style="width: 100%">
            <el-option
              v-for="item in questRows"
              :key="item.id"
              :label="`${item.conditionLabel}（${item.rewardAmount ?? 0} 分）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="周期键">
          <el-input v-model="grantForm.periodKey" placeholder="每日任务填 YYYY-MM-DD；一次性任务留空（=ONCE）" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="grantForm.remark" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
        <el-alert type="warning" :closable="false" title="发放为真实资金入账；同一会员同一任务同一周期重复提交只入账一次。" />
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="grantSaving" @click="submitGrant">确认发放</el-button>
        <el-button @click="grantDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="settingDialog.visible" title="新人福利全局设置" width="680px" append-to-body destroy-on-close>
      <el-form label-width="150px">
        <el-form-item label="默认币种">
          <el-input v-model="settingForm.welfare_currency" />
        </el-form-item>
        <el-form-item label="任务有效期(天)">
          <el-input-number v-model="settingForm.welfare_valid_days" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="领取过期(天)">
          <el-input-number v-model="settingForm.welfare_claim_expire_days" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="发放时机">
          <el-select v-model="settingForm.welfare_reward_timing" style="width: 100%">
            <el-option label="自动发放" value="1" />
            <el-option label="手动领取" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则说明">
          <el-input v-model="settingForm.welfare_rule_desc" type="textarea" :rows="3" maxlength="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="settingSaving" @click="submitSetting">保 存</el-button>
        <el-button @click="settingDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberQuestCenter" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { changeActivityPoint, listActivityLog, listActivityPoint } from '@/api/member/activity';
import type { ActivityChangeForm, ActivityPointLogVO, ActivityPointQuery, ActivityPointVO } from '@/api/member/activity/types';
import {
  grantQuestReward,
  listQuestConfig,
  listQuestRecord,
  listQuestReward,
  listQuestSetting,
  retryQuestReward,
  saveQuestConfig,
  saveQuestSetting,
  toggleQuestBubble,
  toggleQuestStatus
} from '@/api/member/quest';
import type {
  QuestConfigForm,
  QuestConfigQuery,
  QuestConfigVO,
  QuestRecordQuery,
  QuestRecordVO,
  QuestRewardGrantForm,
  QuestRewardRecordVO
} from '@/api/member/quest/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const { loading, withLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);
const { loading: logLoading, withLoading: withLogLoading } = useLoading(false);
const rows = ref<ActivityPointVO[]>([]);
const total = ref(0);
const logRows = ref<ActivityPointLogVO[]>([]);
const addFormRef = ref();
const addDialog = reactive({ visible: false });
const logDialog = reactive<{ visible: boolean; uid: number | string }>({ visible: false, uid: '' });

const data = reactive<{ queryParams: ActivityPointQuery; addForm: ActivityChangeForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  addForm: { uid: '', requestId: '', changeType: 1, point: 100, remark: '' }
});
const { queryParams, addForm } = toRefs(data);

const addRules = {
  uid: [{ required: true, message: '会员ID不能为空', trigger: 'blur' }],
  requestId: [{ required: true, message: '请求幂等号不能为空', trigger: 'blur' }],
  point: [{ required: true, message: '活跃度数量不能为空', trigger: 'blur' }]
};

/* ---------------- 新人福利设置（17 文档） ---------------- */
const activeTab = ref('welfare');
const { loading: questLoading, withLoading: withQuestLoading } = useLoading(false);
const { loading: questSaving, withLoading: withQuestSaving } = useLoading(false);
const { loading: recordLoading, withLoading: withRecordLoading } = useLoading(false);
const { loading: grantSaving, withLoading: withGrantSaving } = useLoading(false);
const { loading: settingSaving, withLoading: withSettingSaving } = useLoading(false);
const { loading: rewardLoading, withLoading: withRewardLoading } = useLoading(false);
const questRows = ref<QuestConfigVO[]>([]);
const questTotal = ref(0);
const questFormRef = ref();
const questDialog = reactive({ visible: false });
const recordRows = ref<QuestRecordVO[]>([]);
const recordTotal = ref(0);
const recordDialog = reactive({ visible: false, title: '' });
const grantFormRef = ref();
const grantDialog = reactive({ visible: false });
const settingDialog = reactive({ visible: false });
const rewardRows = ref<QuestRewardRecordVO[]>([]);
const rewardTotal = ref(0);

// 任务条件枚举（后台可扩展：弹窗下拉支持 allow-create 自定义编码）
const conditionOptions = [
  { value: 'REGISTER', label: '注册奖励' },
  { value: 'BIND_PHONE', label: '绑定手机奖励' },
  { value: 'BIND_EMAIL', label: '绑定邮箱奖励' },
  { value: 'KYC_VERIFY', label: '实名认证奖励' },
  { value: 'FIRST_DEPOSIT', label: '首次充值奖励' },
  { value: 'INVITE_FRIEND', label: '邀请好友奖励' },
  { value: 'FIRST_GAME', label: '首次进入游戏奖励' },
  { value: 'GAME_ROUNDS', label: '完成游戏局数奖励' },
  { value: 'DAILY_LOGIN', label: '每日登录奖励' },
  { value: 'DAILY_BET', label: '每日投注奖励' }
];

const audienceOptions = [
  { value: 1, label: '全体会员' },
  { value: 2, label: '自定义会员' },
  { value: 3, label: '会员层级' },
  { value: 4, label: 'VIP等级' },
  { value: 5, label: '会员标签' },
  { value: 6, label: '指定上级ID(直属)' },
  { value: 7, label: '指定顶层ID(全部下级)' },
  { value: 8, label: '未充值会员' },
  { value: 9, label: '未登录会员' }
];

const defaultQuestForm = (): QuestConfigForm => ({
  id: undefined,
  code: '',
  title: '',
  content: '',
  questType: 1,
  targetValue: 1,
  rewardAmount: 0,
  rewardType: 1,
  rewardRatio: 0,
  extraPoint: 0,
  sortOrder: 0,
  status: 1,
  bubbleFlag: 0,
  audienceType: 1,
  audienceParams: '',
  currency: 'VND',
  claimExpireDays: 7,
  rewardTiming: 1,
  ruleDesc: '',
  turnoverMultiple: 1
});

const questData = reactive({
  questQuery: { pageNum: 1, pageSize: 10 } as QuestConfigQuery,
  recordQuery: { pageNum: 1, pageSize: 10 } as QuestRecordQuery,
  rewardQuery: { pageNum: 1, pageSize: 10 } as QuestRecordQuery,
  questForm: defaultQuestForm(),
  grantForm: { uid: '', questId: '', periodKey: '', remark: '' } as QuestRewardGrantForm,
  settingForm: {
    welfare_currency: 'VND',
    welfare_valid_days: 30,
    welfare_claim_expire_days: 7,
    welfare_reward_timing: '1',
    welfare_rule_desc: ''
  }
});
const { questQuery, recordQuery, rewardQuery, questForm, grantForm, settingForm } = toRefs(questData);

const questRules = {
  code: [{ required: true, message: '任务条件不能为空', trigger: 'change' }],
  title: [{ required: true, message: '任务标题不能为空', trigger: 'blur' }],
  rewardAmount: [{ required: true, message: '奖励金额不能为空（可为 0）', trigger: 'blur' }]
};

const grantRules = {
  uid: [{ required: true, message: '会员ID不能为空', trigger: 'blur' }],
  questId: [{ required: true, message: '请选择任务', trigger: 'change' }]
};

const getQuestList = async () => {
  await withQuestLoading(async () => {
    const res = (await listQuestConfig(questQuery.value)) as unknown as PageBody<QuestConfigVO>;
    questRows.value = res.rows ?? [];
    questTotal.value = res.total ?? 0;
  });
};

const resetQuestQuery = () => {
  questQuery.value = { pageNum: 1, pageSize: 10 };
  getQuestList();
};

const openQuestEdit = (row?: QuestConfigVO) => {
  Object.assign(questForm.value, defaultQuestForm(), row ? { ...row } : {});
  // FIX: 2026-09-30 回显不再把空格改写成带 T 的 ISO 串。原因：日期控件 value-format 已统一为
  // `YYYY-MM-DD HH:mm:ss`（与后端全局 Jackson 一致），再转成 T 会导致回显失败；这里改为把可能的
  // 历史 ISO 串反向归一成空格格式，兼容老数据。
  if (row?.validStart) {
    questForm.value.validStart = String(row.validStart).replace('T', ' ');
  }
  if (row?.validEnd) {
    questForm.value.validEnd = String(row.validEnd).replace('T', ' ');
  }
  questDialog.visible = true;
};

const submitQuestEdit = () => {
  questFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    await withQuestSaving(async () => saveQuestConfig(questForm.value));
    modal.msgSuccess('保存成功');
    questDialog.visible = false;
    await getQuestList();
  });
};

const changeQuestStatus = async (row: QuestConfigVO, status: number) => {
  await toggleQuestStatus(row.id, status);
  modal.msgSuccess(status === 1 ? '已开启' : '已关闭');
  await getQuestList();
};

const changeQuestBubble = async (row: QuestConfigVO, bubbleFlag: number) => {
  await toggleQuestBubble(row.id, bubbleFlag);
  modal.msgSuccess(bubbleFlag === 1 ? '已开启气泡' : '已关闭气泡');
  await getQuestList();
};

const openRecord = async (row: QuestConfigVO) => {
  recordDialog.title = `${row.conditionLabel ?? row.code}（${row.code}）`;
  recordQuery.value = { pageNum: 1, pageSize: 10, questCode: row.code };
  recordDialog.visible = true;
  await getRecordList();
};

const getRecordList = async () => {
  await withRecordLoading(async () => {
    const res = (await listQuestRecord(recordQuery.value)) as unknown as PageBody<QuestRecordVO>;
    recordRows.value = res.rows ?? [];
    recordTotal.value = res.total ?? 0;
  });
};

const openGrant = (row?: QuestConfigVO) => {
  Object.assign(grantForm.value, { uid: '', questId: row?.id ?? '', periodKey: '', remark: '' });
  grantDialog.visible = true;
  if (!questRows.value.length) {
    getQuestList();
  }
};

const submitGrant = () => {
  grantFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    const res = (await withGrantSaving(async () =>
      grantQuestReward(grantForm.value)
    )) as unknown as { data?: { granted?: number; skipped?: number; failed?: number; bizNo?: string } };
    const result = res?.data ?? {};
    modal.msgSuccess(`发放完成：成功 ${result.granted ?? 0} 笔，跳过 ${result.skipped ?? 0} 笔，失败 ${result.failed ?? 0} 笔`);
    grantDialog.visible = false;
    await getRewardList();
  });
};

const openSetting = async () => {
  const res = (await listQuestSetting()) as unknown as { data?: { settingKey: string; settingValue?: string }[] };
  const map: Record<string, string> = {};
  (res.data ?? []).forEach((item) => {
    map[item.settingKey] = item.settingValue ?? '';
  });
  Object.assign(settingForm.value, {
    welfare_currency: map.welfare_currency ?? 'VND',
    welfare_valid_days: Number(map.welfare_valid_days ?? 30),
    welfare_claim_expire_days: Number(map.welfare_claim_expire_days ?? 7),
    welfare_reward_timing: map.welfare_reward_timing ?? '1',
    welfare_rule_desc: map.welfare_rule_desc ?? ''
  });
  settingDialog.visible = true;
};

const submitSetting = async () => {
  const items = Object.entries(settingForm.value).map(([key, value]) => ({ configKey: key, configValue: String(value ?? '') }));
  await withSettingSaving(async () => saveQuestSetting(items));
  modal.msgSuccess('保存成功');
  settingDialog.visible = false;
};

const getRewardList = async () => {
  await withRewardLoading(async () => {
    const res = (await listQuestReward(rewardQuery.value)) as unknown as PageBody<QuestRewardRecordVO>;
    rewardRows.value = res.rows ?? [];
    rewardTotal.value = res.total ?? 0;
  });
};

const resetRewardQuery = () => {
  rewardQuery.value = { pageNum: 1, pageSize: 10 };
  getRewardList();
};

const rewardStatusLabel = (status?: number) =>
  ({ 1: '待发放', 2: '已发放', 3: '已取消', 4: '异常' } as Record<number, string>)[status ?? -1] ?? '—';

const retryReward = async (row: QuestRewardRecordVO) => {
  await retryQuestReward(row.recordId);
  modal.msgSuccess('重试完成（复用同一幂等键，不会重复入账）');
  await getRewardList();
};

const changeTypeLabel = (type?: number) =>
  ({ 1: '后台增加', 2: '后台扣减', 3: '任务奖励', 4: '消耗', 5: '过期' } as Record<number, string>)[type ?? -1] ?? '—';

const getList = async () => {
  await withLoading(async () => {
    const res = (await listActivityPoint(queryParams.value)) as unknown as PageBody<ActivityPointVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  getList();
};

const openAdd = (uid?: number | string) => {
  Object.assign(addForm.value, {
    uid: uid ?? '',
    requestId: 'ACT' + Date.now(),
    changeType: 1,
    point: 100,
    remark: ''
  });
  addDialog.visible = true;
};

const submitAdd = () => {
  addFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    const res = (await withSaving(async () => changeActivityPoint(addForm.value))) as unknown as DataBody<number>;
    modal.msgSuccess(`操作成功，变动后剩余 ${res.data ?? 0}`);
    addDialog.visible = false;
    await getList();
  });
};

const openLogs = async (row: ActivityPointVO) => {
  logDialog.uid = row.uid;
  logDialog.visible = true;
  await withLogLoading(async () => {
    const res = (await listActivityLog(row.uid, undefined, { pageNum: 1, pageSize: 50 })) as unknown as PageBody<ActivityPointLogVO>;
    logRows.value = res.rows ?? [];
  });
};

onMounted(() => {
  getList();
  getQuestList();
  getRewardList();
});
</script>

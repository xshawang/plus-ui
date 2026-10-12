<template>
  <div class="p-2 app-container member-user-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="UID" prop="uid">
            <el-input v-model="queryParams.uid" placeholder="用户UID" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="登录名" prop="loginName">
            <el-input v-model="queryParams.loginName" placeholder="登录名" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="昵称" prop="nickName">
            <el-input v-model="queryParams.nickName" placeholder="昵称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="queryParams.phone" placeholder="手机号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 110px">
              <el-option v-for="(label, value) in userStatusMap" :key="value" :label="label" :value="Number(value)" />
            </el-select>
          </el-form-item>
          <!-- 01 文档：时间维度（注册/最后登录/首充）+ 账号维度（精准账号/模糊账号/UID/手机/真实姓名） -->
          <el-form-item label="时间维度">
            <el-select v-model="queryParams.dateField" placeholder="注册时间" clearable style="width: 130px">
              <el-option label="注册时间" value="REGISTER" />
              <el-option label="最后登录时间" value="LAST_LOGIN" />
              <el-option label="首充时间" value="FIRST_DEPOSIT" />
            </el-select>
          </el-form-item>
          <el-form-item label="账号维度">
            <el-select v-model="queryParams.accountField" placeholder="精准会员账号" clearable style="width: 140px">
              <el-option label="精准会员账号" value="LOGIN_NAME" />
              <el-option label="模糊会员账号" value="LOGIN_NAME_LIKE" />
              <el-option label="会员ID" value="UID" />
              <el-option label="手机号" value="PHONE" />
              <el-option label="真实姓名" value="REAL_NAME" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="queryParams.accountValue" placeholder="请输入账号维度检索值" clearable style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="会员层级">
            <el-select v-model="queryParams.levelId" placeholder="全部" clearable style="width: 150px">
              <el-option v-for="item in levelOptions" :key="item.levelId" :label="item.levelName" :value="item.levelId" />
            </el-select>
          </el-form-item>
          <el-form-item label="会员标签">
            <el-select v-model="queryParams.tagId" placeholder="全部" clearable style="width: 150px">
              <el-option v-for="item in tagOptions" :key="item.tagId" :label="item.tagName" :value="item.tagId" />
            </el-select>
          </el-form-item>
          <el-form-item label="VIP等级">
            <el-input-number v-model="queryParams.vipLevel" :min="0" :max="30" controls-position="right" style="width: 120px" />
          </el-form-item>
          <el-form-item label="账号类型">
            <el-select v-model="queryParams.accountType" placeholder="全部" clearable style="width: 130px">
              <el-option label="正式账号" value="FORMAL" />
              <el-option label="测试账号" value="TEST" />
              <el-option label="主播号" value="STREAMER" />
              <el-option label="代理账号" value="AGENT" />
            </el-select>
          </el-form-item>
          <el-form-item label="注册时间" prop="dateRange">
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
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>用户列表</h3>
            <span class="text-gray-400 text-sm">余额默认展示 VND 账户</span>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:user:add']" type="primary" plain icon="Plus" @click="handleCreate">新增会员</el-button>
            <el-button plain icon="Download" @click="handleExportCurrentPage">导出当前页</el-button>
            <el-button v-hasPermi="['member:user:export']" plain icon="Download" @click="handleExportAll">导出全部</el-button>
            <el-upload
              v-hasPermi="['member:user:import']"
              class="inline-upload"
              :show-file-list="false"
              :auto-upload="false"
              accept=".csv"
              :on-change="handleImportFile"
            >
              <el-button plain icon="Upload">批量导入</el-button>
            </el-upload>
            <el-button type="primary" plain icon="Refresh" @click="handleQuery">刷新</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
          </div>
        </div>
      </template>

      <!-- 01 文档：批量操作（改层级 / 打标 / 冻结 / 解冻） -->
      <div v-if="selectedUids.length > 0" class="toolbar-shell mb-2">
        <div class="table-heading">
          <span>已选择 {{ selectedUids.length }} 名会员</span>
        </div>
        <div class="toolbar-actions">
          <el-select v-model="batchLevelId" placeholder="批量调整层级" clearable style="width: 170px">
            <el-option v-for="item in levelOptions" :key="item.levelId" :label="item.levelName" :value="item.levelId" />
          </el-select>
          <el-button v-hasPermi="['member:user:edit']" plain :disabled="!batchLevelId" @click="handleBatchLevel">应用层级</el-button>
          <el-select v-model="batchTagIds" placeholder="批量打标" multiple clearable style="width: 200px">
            <el-option v-for="item in tagOptions" :key="item.tagId" :label="item.tagName" :value="item.tagId" />
          </el-select>
          <el-button v-hasPermi="['member:user:edit']" plain :disabled="batchTagIds.length === 0" @click="handleBatchTag('BIND')">打标</el-button>
          <el-button v-hasPermi="['member:user:edit']" plain :disabled="batchTagIds.length === 0" @click="handleBatchTag('UNBIND')">摘标</el-button>
          <el-button v-hasPermi="['member:user:edit']" type="danger" plain @click="handleBatchStatus(2)">批量冻结</el-button>
          <el-button v-hasPermi="['member:user:edit']" type="success" plain @click="handleBatchStatus(1)">批量解冻</el-button>
        </div>
      </div>

      <el-table v-loading="loading" border class="data-table" :data="userList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="UID" align="left" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleGoLedger(row)">{{ row.uid }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="登录名" align="center" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleUpdate(row)">{{ row.loginName }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="头像" align="center" width="90">
          <template #default="{ row }">
            <el-avatar v-if="row.avatarUrl" shape="square" :size="40" :src="row.avatarUrl" />
            <el-avatar v-else shape="square" :size="40" icon="User" />
          </template>
        </el-table-column>
        <el-table-column label="昵称" align="center" prop="nickName" min-width="120" show-overflow-tooltip />
        <el-table-column label="手机号" align="center" prop="phone" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="userStatusType(row.status)">{{ userStatusMap[row.status] ?? row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账户余额（VND）" align="right" width="160">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleAdjustBalance(row)">
              {{ formatMoneyInt(row.availableBalance) }}
            </el-link>
            <el-tooltip v-if="Number(row.frozenBalance) > 0" :content="'冻结 ' + formatMoneyInt(row.frozenBalance)" placement="top">
              <el-tag class="ml-1" size="small" type="warning">冻</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="累计充值" align="right" width="140">
          <template #default="{ row }">
            <el-link type="success" :underline="false" @click="handleGoRecharge(row)">
              {{ formatMoney(row.totalRechargeAmount) }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="累计提现" align="right" width="140">
          <template #default="{ row }">
            <el-link type="warning" :underline="false" @click="handleGoWithdraw(row)">
              {{ formatMoney(row.totalWithdrawAmount) }}
            </el-link>
          </template>
        </el-table-column>
        <!-- 01 文档扩展列：层级与标签 / 账号类型与注册验证 / 充提次数与差额首充 / 代理链 -->
        <el-table-column label="层级 / 标签" align="center" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.levelName || '默认层级' }}</div>
            <div class="text-gray-400 text-sm">{{ row.tagNames || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="账号类型 / 注册 / 验证" align="center" min-width="170">
          <template #default="{ row }">
            <div>{{ accountTypeLabel(row.accountType) }}</div>
            <div class="text-gray-400 text-sm">
              {{ registerTypeLabel(row.registerType) }} · {{ verifyTypeLabel(row.verifyType) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="充提次数 / 差额 / 首充" align="right" min-width="190">
          <template #default="{ row }">
            <div>充 {{ row.totalRechargeCount ?? 0 }} 次 · 提 {{ row.totalWithdrawCount ?? 0 }} 次</div>
            <div class="text-gray-400 text-sm">
              差额 {{ formatMoney(row.balanceDiff) }} · 首充 {{ formatMoney(row.firstDepositAmount) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="代理链（邀请人 / 上级 / 顶层）" align="center" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.inviteName || '—' }}<span class="text-gray-400">（邀请人）</span></div>
            <div class="text-gray-400 text-sm">{{ row.parentAgentName || '—' }} / {{ row.topAgentName || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="注册IP" align="center" prop="registerIp" min-width="130" show-overflow-tooltip />
        <el-table-column label="注册时间" align="center" prop="registerAt" width="170">
          <template #default="{ row }">{{ row.registerAt }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="90" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="会员详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleGoDetail(row as MemberUserVO)" />
            </el-tooltip>
            <el-tooltip content="修改用户信息" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(row)" />
            </el-tooltip>
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

    <!-- 新增会员（01 文档 §4 后台人工开户） -->
    <el-dialog v-model="createDialog.visible" title="新增会员" width="680px" append-to-body destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="130px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="会员账号" prop="loginName">
              <el-input v-model="createForm.loginName" maxlength="64" placeholder="全局唯一登录账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登录密码" prop="password">
              <el-input v-model="createForm.password" type="password" show-password placeholder="至少 6 位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提现密码">
              <el-input v-model="createForm.payPassword" type="password" show-password placeholder="可空" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称">
              <el-input v-model="createForm.nickName" maxlength="64" placeholder="默认同账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="createForm.phone" placeholder="可空" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员层级">
              <el-select v-model="createForm.levelId" placeholder="默认层级" clearable style="width: 100%">
                <el-option v-for="item in levelOptions" :key="item.levelId" :label="item.levelName" :value="item.levelId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="VIP等级">
              <el-input-number v-model="createForm.vipLevel" :min="0" :max="30" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号类型">
              <el-select v-model="createForm.accountType" style="width: 100%">
                <el-option label="正式账号" value="FORMAL" />
                <el-option label="测试账号" value="TEST" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册方式">
              <el-select v-model="createForm.registerType" style="width: 100%">
                <el-option label="账号注册" value="ACCOUNT" />
                <el-option label="手机注册" value="PHONE" />
                <el-option label="邮箱注册" value="EMAIL" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="createForm.remark" type="textarea" :rows="2" maxlength="255" placeholder="将写入会员备注履历" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert
          type="info"
          :closable="false"
          title="初始余额请在建号后使用列表中的「加减款」功能调整：资金必须经钱包核心落 user_wallet_ledger 流水，保证可对账。"
        />
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitCreate">确 定</el-button>
        <el-button @click="createDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 用户信息修改 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="900px" append-to-body top="4vh">
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="130px">
        <el-divider content-position="left">账号</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="UID">
              <el-input v-model="form.uid" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="登录名">
              <el-input v-model="form.loginName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Game UID">
              <el-input v-model="form.gameUid" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="手机已验证">
              <el-switch v-model="form.phoneVerified" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="头像">
              <el-input v-model="form.avatarUrl" placeholder="头像地址" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="头像预览">
              <el-avatar v-if="form.avatarUrl" shape="square" :size="40" :src="form.avatarUrl" />
              <el-avatar v-else shape="square" :size="40" icon="User" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="账号状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="(label, value) in userStatusMap" :key="value" :label="label" :value="Number(value)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">等级与风控</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="VIP等级">
              <el-input-number v-model="form.vipLevel" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="俱乐部等级">
              <el-input-number v-model="form.clubLevel" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="风控等级">
              <el-input-number v-model="form.riskLevel" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">注册与登录限制</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="注册IP">
              <el-input v-model="form.registerIp" placeholder="注册IP" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册设备">
              <el-input v-model="form.registerDevice" placeholder="注册设备" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册渠道">
              <el-input-number v-model="form.registerChannel" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="允许多端登录">
              <el-switch v-model="form.allowMultiDevice" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="禁止Web登录">
              <el-switch v-model="form.blockWebLogin" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="TOTP二次验证">
              <el-switch v-model="form.totpEnabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">密码（留空不修改）</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="登录密码" prop="password">
              <el-input v-model="form.password" type="password" show-password placeholder="留空则不修改" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资金密码" prop="payPassword">
              <el-input v-model="form.payPassword" type="password" show-password placeholder="留空则不修改" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 余额调整（敏感操作：需后台账户密码） -->
    <el-dialog v-model="balanceDialog.visible" :title="'调整余额 - ' + balanceDialog.loginName" width="520px" append-to-body>
      <el-form ref="balanceFormRef" :model="balanceForm" :rules="balanceRules" label-width="130px">
        <el-form-item label="用户UID">
          <el-input :model-value="String(balanceForm.uid)" disabled />
        </el-form-item>
        <el-form-item label="当前余额(VND)">
          <span class="font-mono">{{ formatMoneyInt(balanceForm.currentBalance) }}</span>
        </el-form-item>
        <el-form-item label="币种">
          <el-tag>{{ balanceForm.currency }}</el-tag>
        </el-form-item>
        <el-form-item label="目标余额(VND)" prop="targetBalance">
          <el-input-number
            v-model="balanceForm.targetBalance"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="balanceForm.remark" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="调整原因，便于审计" />
        </el-form-item>
        <el-form-item label="后台密码" prop="password">
          <el-input v-model="balanceForm.password" type="password" show-password placeholder="请输入当前后台账户密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="balanceSaving" type="primary" @click="submitBalance">确 定</el-button>
          <el-button @click="balanceDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberUser" lang="ts">
import {
  addMemberUser,
  batchMemberLevel,
  batchMemberStatus,
  batchMemberTag,
  getMemberUser,
  listMemberUser,
  updateMemberBalance,
  updateMemberUser
} from '@/api/member/users';
import type {
  MemberBalanceAdjustForm,
  MemberUserCreateForm,
  MemberUserForm,
  MemberUserQuery,
  MemberUserVO
} from '@/api/member/users/types';
import { listMemberLevelOptions } from '@/api/member/level';
import type { MemberLevelVO } from '@/api/member/level/types';
import { listMemberTagOptions } from '@/api/member/tag';
import type { MemberTagVO } from '@/api/member/tag/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import modal from '@/plugins/modal';
import { reactive, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

/** 账号状态：1正常 2锁定 3注销（player_account.status） */
const userStatusMap: Record<number, string> = {
  1: '正常',
  2: '锁定',
  3: '注销'
};

const userStatusType = (status?: number) => {
  if (status === 1) return 'success';
  if (status === 2) return 'warning';
  if (status === 3) return 'danger';
  return 'info';
};

const showSearch = ref(true);
const userList = ref<MemberUserVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const { loading, withLoading } = useLoading(true);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const queryFormRef = ref<ElFormInstance>();
const userFormRef = ref<ElFormInstance>();

const initFormData: MemberUserForm = {
  uid: undefined,
  loginName: undefined,
  gameUid: undefined,
  nickName: undefined,
  avatarUrl: undefined,
  phone: undefined,
  phoneVerified: 0,
  status: 1,
  vipLevel: 0,
  clubLevel: 0,
  riskLevel: 0,
  registerIp: undefined,
  registerDevice: undefined,
  registerChannel: 0,
  allowMultiDevice: 1,
  blockWebLogin: 0,
  totpEnabled: 0,
  password: undefined,
  payPassword: undefined
};

const data = reactive<{ queryParams: MemberUserQuery; form: MemberUserForm; rules: any }>({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    uid: undefined,
    loginName: undefined,
    nickName: undefined,
    phone: undefined,
    status: undefined,
    registerChannel: undefined,
    currency: 'VND',
    dateField: undefined,
    accountField: undefined,
    accountValue: undefined,
    levelId: undefined,
    tagId: undefined,
    vipLevel: undefined,
    accountType: undefined,
    params: undefined
  },
  form: { ...initFormData },
  rules: {
    nickName: [{ required: true, message: '昵称不能为空', trigger: 'blur' }]
  }
});
const { queryParams, form, rules } = toRefs(data);

const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: userFormRef,
  initialFormData: initFormData
});

const formatMoney = (value?: number) => {
  if (value === null || value === undefined) return '0.00';
  return (Number(value)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/** 余额整数展示（VND 无小数，不展示两位小数） */
const formatMoneyInt = (value?: number) => {
  if (value === null || value === undefined) return '0';
  return Math.round(Number(value)).toLocaleString('en-US');
};

const getList = async () => {
  await withLoading(async () => {
    // FIX: 分页接口 body 为 {rows,total}（request 拦截器直出 body），原写法 res.data?.rows 恒为 undefined，
    // 导致列表永远为空。2026-09-22 Codex
    const res = (await listMemberUser(applyDateRange(queryParams.value))) as unknown as { rows?: MemberUserVO[]; total?: number };
    userList.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  resetExtras: () => {
    resetDateRange();
    queryParams.value.currency = 'VND';
  },
  afterReset: () => handleQuery()
});

/** 点击登录名：打开单个用户全部属性修改弹窗 */
const handleUpdate = async (row?: Partial<MemberUserVO>) => {
  reset();
  const uid = row?.uid;
  if (!uid) return;
  const res = await getMemberUser(uid);
  Object.assign(form.value, res.data);
  form.value.password = undefined;
  form.value.payPassword = undefined;
  showDialog('修改用户 - ' + (res.data?.loginName || uid));
};

const submitForm = () => {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      await updateMemberUser(form.value);
      modal.msgSuccess('操作成功');
      closeDialog();
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const cancel = () => {
  reset();
  closeDialog();
};

/** 余额调整弹窗状态 */
const balanceFormRef = ref<ElFormInstance>();
const balanceSaving = ref(false);
const balanceDialog = reactive<{ visible: boolean; loginName: string }>({ visible: false, loginName: '' });
const balanceForm = reactive<{
  uid?: string | number;
  currency: string;
  currentBalance: number;
  targetBalance: number;
  remark: string;
  password: string;
}>({
  uid: undefined,
  currency: 'VND',
  currentBalance: 0,
  targetBalance: 0,
  remark: '',
  password: ''
});
const balanceRules = {
  targetBalance: [{ required: true, message: '目标余额不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '请输入后台账户密码', trigger: 'blur' }]
};

/** 点击余额：打开调整弹窗 */
const handleAdjustBalance = (row: Partial<MemberUserVO>) => {
  balanceForm.uid = row.uid;
  balanceForm.currency = 'VND';
  balanceForm.currentBalance = Number(row.availableBalance || 0);
  balanceForm.targetBalance = Math.round(balanceForm.currentBalance);
  balanceForm.remark = '';
  balanceForm.password = '';
  balanceDialog.loginName = row.loginName || String(row.uid ?? '');
  balanceDialog.visible = true;
};

/** 提交余额调整（前端按 VND 整数输入，转分后提交） */
const submitBalance = () => {
  balanceFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    balanceSaving.value = true;
    try {
      const payload: MemberBalanceAdjustForm = {
        uid: balanceForm.uid,
        currency: balanceForm.currency,
        balance: Math.round(balanceForm.targetBalance),
        remark: balanceForm.remark || '',
        password: balanceForm.password
      };
      await updateMemberBalance(payload);
      modal.msgSuccess('余额调整成功');
      balanceDialog.visible = false;
      await getList();
    } finally {
      balanceSaving.value = false;
    }
  });
};

/** 点击 UID：进入该用户的账户流水列表 */
const handleGoLedger = (row: MemberUserVO) => {
  router.push({ path: '/member/ledger', query: { uid: String(row.uid) } });
};

/** 点击累计充值：进入充值列表并按 uid 查询 */
const handleGoRecharge = (row: MemberUserVO) => {
  router.push({ path: '/member/recharge', query: { uid: String(row.uid) } });
};

/** 点击累计提现：进入提现列表并按 uid 查询 */
const handleGoWithdraw = (row: MemberUserVO) => {
  router.push({ path: '/member/withdraw', query: { uid: String(row.uid) } });
};

/* ==================== 01 文档：批量操作 / 新增会员 / 详情跳转 ==================== */

const levelOptions = ref<MemberLevelVO[]>([]);
const tagOptions = ref<MemberTagVO[]>([]);
const selectedUids = ref<Array<string | number>>([]);
const batchLevelId = ref<number>();
const batchTagIds = ref<number[]>([]);
const createDialog = reactive({ visible: false });
const createFormRef = ref<ElFormInstance>();
const createForm = reactive<MemberUserCreateForm>({
  loginName: '',
  password: '',
  nickName: '',
  phone: '',
  levelId: undefined,
  vipLevel: 0,
  accountType: 'FORMAL',
  registerType: 'ACCOUNT',
  remark: ''
});
const createRules = {
  loginName: [{ required: true, message: '会员账号不能为空', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '登录密码不能少于 6 位', trigger: 'blur' }]
};

const accountTypeLabel = (type?: string) =>
  ({ FORMAL: '正式账号', TEST: '测试账号', STREAMER: '主播号', AGENT: '代理账号' } as Record<string, string>)[type ?? 'FORMAL'] ?? '正式账号';
const registerTypeLabel = (type?: string) =>
  ({ ACCOUNT: '账号注册', PHONE: '手机注册', EMAIL: '邮箱注册', SOCIAL: '三方注册' } as Record<string, string>)[type ?? 'ACCOUNT'] ?? '账号注册';
const verifyTypeLabel = (type?: string) =>
  ({ NONE: '无验证', SMS: '短信', EMAIL: '邮箱', KYC: '实名' } as Record<string, string>)[type ?? 'NONE'] ?? '无验证';

const loadOptions = async () => {
  const [levels, tags] = await Promise.all([listMemberLevelOptions(), listMemberTagOptions()]);
  levelOptions.value = ((levels as unknown as { data?: MemberLevelVO[] }).data ?? []).slice();
  tagOptions.value = ((tags as unknown as { data?: MemberTagVO[] }).data ?? []).slice();
};

const handleSelectionChange = (selection: MemberUserVO[]) => {
  selectedUids.value = selection.map((item) => item.uid!).filter((uid) => uid !== undefined);
};

const handleBatchLevel = async () => {
  if (!batchLevelId.value || selectedUids.value.length === 0) {
    return;
  }
  const res = (await batchMemberLevel({
    uids: selectedUids.value,
    levelId: batchLevelId.value,
    reason: '会员列表批量调整'
  })) as unknown as { data?: number };
  modal.msgSuccess(`层级调整完成（影响 ${res.data ?? 0} 条）`);
  selectedUids.value = [];
  batchLevelId.value = undefined;
  await getList();
};

const handleBatchTag = async (mode: 'BIND' | 'UNBIND') => {
  if (batchTagIds.value.length === 0 || selectedUids.value.length === 0) {
    return;
  }
  const res = (await batchMemberTag({
    uids: selectedUids.value,
    tagIds: batchTagIds.value,
    mode
  })) as unknown as { data?: number };
  modal.msgSuccess(`${mode === 'BIND' ? '打标' : '摘标'}完成（影响 ${res.data ?? 0} 条）`);
  selectedUids.value = [];
  batchTagIds.value = [];
  await getList();
};

const handleBatchStatus = async (status: number) => {
  if (selectedUids.value.length === 0) {
    return;
  }
  try {
    await modal.confirm(status === 2 ? `确认冻结选中的 ${selectedUids.value.length} 名会员？` : `确认解冻选中的 ${selectedUids.value.length} 名会员？`);
  } catch {
    return;
  }
  const res = (await batchMemberStatus({
    uids: selectedUids.value,
    status,
    reason: status === 2 ? '后台批量冻结' : '后台批量解冻'
  })) as unknown as { data?: number };
  modal.msgSuccess(`操作完成（影响 ${res.data ?? 0} 条）`);
  selectedUids.value = [];
  await getList();
};

const handleCreate = () => {
  Object.assign(createForm, {
    loginName: '',
    password: '',
    payPassword: '',
    nickName: '',
    phone: '',
    levelId: undefined,
    vipLevel: 0,
    accountType: 'FORMAL',
    registerType: 'ACCOUNT',
    remark: ''
  });
  createDialog.visible = true;
};

const submitCreate = () => {
  createFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    const uid = (await addMemberUser(createForm)) as unknown as { data?: number };
    modal.msgSuccess(`新增成功（UID ${uid.data ?? '-'}）；如需初始余额请使用「加减款」`);
    createDialog.visible = false;
    await getList();
  });
};

/**
 * 导出当前页为 CSV（前端本地生成，不经过后端）。
 *
 * 为什么只导出当前页：全量导出需要后端流式导出接口（大批量会员会占内存），
 * 本期先提供当前页导出，全量导出列入 01 文档遗留项。
 */
const handleExportCurrentPage = () => {
  if (userList.value.length === 0) {
    modal.msgWarning('当前页没有可导出的数据');
    return;
  }
  const header = [
    '会员ID', '会员账号', '昵称', '账号状态', '层级', '标签', '账号类型', '注册方式', '验证方式',
    '可用余额(分)', '冻结余额(分)', '累计充值(分)', '累计提现(分)', '充值次数', '提现次数', '充提差额(分)', '首充金额(分)',
    '注册时间', '最后登录时间'
  ];
  const lines = userList.value.map((row) =>
    [
      row.uid, row.loginName, row.nickName, userStatusMap[row.status ?? 1] ?? '', row.levelName ?? '', row.tagNames ?? '',
      accountTypeLabel(row.accountType), registerTypeLabel(row.registerType), verifyTypeLabel(row.verifyType),
      row.availableBalance ?? 0, row.frozenBalance ?? 0, row.totalRechargeAmount ?? 0, row.totalWithdrawAmount ?? 0,
      row.totalRechargeCount ?? 0, row.totalWithdrawCount ?? 0, row.balanceDiff ?? 0, row.firstDepositAmount ?? 0,
      row.registerAt ?? '', row.lastLoginAt ?? ''
    ]
      .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = '\ufeff' + [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `member-list-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/** 跳会员详情页并自动查询 */
const handleGoDetail = (row: MemberUserVO) => {
  const target = router.resolve({ path: '/member/detail' });
  if (target.matched.length === 0) {
    modal.msgWarning('未找到会员详情菜单，请确认已分配该菜单权限');
    return;
  }
  router.push({ path: '/member/detail', query: { uid: String(row.uid) } });
};

onMounted(() => {
  loadOptions();
  getList();
});

/* ---------------- 全量导出 / 批量导入（批次 7） ---------------- */
/** 导出全部：带 Token 拉取 CSV 流并触发下载（剔除分页参数，导出"当前筛选条件下的全量"） */
const handleExportAll = async () => {
  try {
    const { exportMembers } = await import('@/api/member/import-export');
    const params = { ...queryParams.value } as Record<string, unknown>;
    delete params.pageNum;
    delete params.pageSize;
    const { url, token } = exportMembers(params);
    const resp = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (!resp.ok) {
      modal.msgError(`导出失败：HTTP ${resp.status}`);
      return;
    }
    const blob = await resp.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `member-export-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    modal.msgSuccess('导出完成（上限 5 万行）');
  } catch (e) {
    modal.msgError('导出失败：' + (e as Error).message);
  }
};

/** 下载导入模板（列顺序：账号,密码,昵称,手机号,账号类型,VIP等级,层级ID,币种,初始余额,备注） */
const handleDownloadTemplate = () => {
  const header = 'loginName,password,nickName,phone,accountType,vipLevel,levelId,currency,initBalance,remark';
  const sample = 'demo001,go88@123456,Demo,0900000000,FORMAL,0,1,VND,0,导入示例';
  const blob = new Blob(['\uFEFF' + header + '\n' + sample], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'member-import-template.csv';
  link.click();
  URL.revokeObjectURL(link.href);
};

/** 批量导入：单次 ≤500 行，逐行复用"新增会员"链路；失败行返回行号与原因 */
const handleImportFile = async (uploadFile: any) => {
  const file: File = uploadFile?.raw;
  if (!file) {
    return;
  }
  try {
    const { importMembers } = await import('@/api/member/import-export');
    const res: any = await importMembers(file);
    const data = res?.data ?? {};
    const failed: { line: string; reason: string }[] = data.failed ?? [];
    if (failed.length) {
      const detail = failed.slice(0, 3).map((item) => `第${item.line}行：${item.reason}`).join('；');
      modal.msgWarning(`导入完成：成功 ${data.created ?? 0} 条，失败 ${failed.length} 条。${detail}`);
    } else {
      modal.msgSuccess(`导入完成：成功 ${data.created ?? 0} 条`);
    }
    await getList();
  } catch (e) {
    modal.msgError('导入失败：' + (e as Error).message);
  }
};
</script>

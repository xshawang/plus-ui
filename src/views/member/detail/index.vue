<template>
  <div class="p-2 app-container member-detail-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="uidInput" placeholder="请输入会员ID" clearable style="width: 240px" @keyup.enter="handleLoad" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="loading" @click="handleLoad">查询</el-button>
          <el-button icon="Refresh" @click="resetAll">重置</el-button>
        </el-form-item>
        <el-form-item v-if="overview.loginName">
          <span class="text-gray-500">
            账号：{{ overview.loginName }}（{{ overview.currency }}）· 层级：{{ overview.levelName || '默认层级' }} ·
            VIP{{ overview.vipLevel ?? 0 }}
          </span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="overview.uid" shadow="hover" class="table-panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="会员概览" name="overview">
          <div class="member-overview">
            <section class="identity-card">
              <div class="identity-main">
                <el-avatar class="identity-avatar" :size="60">{{ accountInitial }}</el-avatar>
                <div class="identity-copy">
                  <div class="identity-title-row">
                    <h2>{{ overview.loginName || '—' }}</h2>
                    <el-tag :type="statusTagType" effect="dark" round>{{ statusLabel(overview.status) }}</el-tag>
                    <el-tag :type="isTestAccount ? 'warning' : 'success'" effect="plain" round>
                      {{ accountKindLabel }}
                    </el-tag>
                    <el-tag v-if="overview.isStreamer === 1" type="danger" effect="plain" round>主播号</el-tag>
                    <template v-if="overview.tagNames">
                      <button
                        v-for="(name, index) in overview.tagNames.split(',')"
                        :key="name + index"
                        v-hasPermi="['member:user:edit']"
                        type="button"
                        class="member-tag-chip"
                        :style="{ backgroundColor: getTagColor(overview.tagColor, index) }"
                        @click="openTagDialog"
                      >
                        {{ name }}
                      </button>
                    </template>
                    <button v-hasPermi="['member:user:edit']" type="button" class="member-tag-add" @click="openTagDialog">
                      {{ overview.tagNames ? '+ 标签' : '+ 添加标签' }}
                    </button>
                  </div>
                  <div class="member-id-row">
                    <span class="member-id-label">ID</span>
                    <code>{{ overview.uid }}</code>
                    <el-button link type="primary" icon="CopyDocument" @click="copyText(String(overview.uid), '会员ID')">
                      复制
                    </el-button>
                  </div>
                  <div class="identity-meta">
                    <span>{{ overview.currency || 'VND' }} 账户</span>
                    <span>{{ overview.levelName || '默认层级' }}</span>
                    <span>注册于 {{ fmtDateTime(overview.registerAt) }} · {{ relativeTime(overview.registerAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="identity-actions">
                <el-button icon="CopyDocument" @click="copyText(String(overview.uid), '会员ID')">复制ID</el-button>
                <el-button icon="Tickets" @click="goLedger">查看流水</el-button>
                <el-button v-hasPermi="['ops:messagetask:add']" icon="Message" @click="openMessageDialog">发站内信</el-button>
                <el-dropdown trigger="click" @command="handleMoreCommand">
                  <el-button>
                    更多<span class="more-caret">▾</span>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-if="canEditMember && overview.status !== 3"
                        command="toggle-status"
                        :icon="overview.status === 1 ? 'CircleClose' : 'CircleCheck'"
                      >
                        {{ overview.status === 1 ? '冻结账号' : '解冻账号' }}
                      </el-dropdown-item>
                      <el-dropdown-item v-if="canEditMember" command="change-level" icon="Operation">
                        改层级
                      </el-dropdown-item>
                      <el-dropdown-item v-if="canEditMember" command="edit-tags" icon="CollectionTag">
                        管理标签
                      </el-dropdown-item>
                      <el-dropdown-item v-if="canViewPlain" command="plain" icon="View">
                        明文查看
                      </el-dropdown-item>
                      <el-dropdown-item v-if="canEditMember" command="email" icon="Message">
                        维护邮箱
                      </el-dropdown-item>
                      <el-dropdown-item v-if="canEditMember" command="vip" icon="Edit">
                        VIP 改档
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </section>

            <section class="kpi-grid" aria-label="会员关键指标">
              <article class="kpi-card" :class="{ 'kpi-card--warning': hasFundingAnomaly }">
                <div class="kpi-label">
                  总余额
                  <span v-if="hasFundingAnomaly" class="kpi-warning" title="总余额大于 0，但累计充值金额为 0">
                    ⚠ 无充值记录
                  </span>
                </div>
                <div class="kpi-value">{{ fmtFen(totalBalance) }} <small>{{ overview.currency || 'VND' }}</small></div>
                <div class="kpi-note">
                  可用 {{ fmtFen(overview.availableBalance) }}
                  <template v-if="Number(overview.frozenBalance) > 0"> · 冻结 {{ fmtFen(overview.frozenBalance) }}</template>
                </div>
              </article>
              <article class="kpi-card">
                <div class="kpi-label">总充值</div>
                <div class="kpi-value">{{ fmtFen(overview.totalRechargeAmount) }} <small>{{ overview.currency || 'VND' }}</small></div>
                <div class="kpi-note">{{ overview.totalRechargeCount ?? 0 }} 次成功充值</div>
              </article>
              <article class="kpi-card">
                <div class="kpi-label">总提现</div>
                <div class="kpi-value">{{ fmtFen(overview.totalWithdrawAmount) }} <small>{{ overview.currency || 'VND' }}</small></div>
                <div class="kpi-note">{{ overview.totalWithdrawCount ?? 0 }} 次成功提现</div>
              </article>
              <article class="kpi-card">
                <div class="kpi-label">充提差额</div>
                <div class="kpi-value">{{ fmtFen(overview.balanceDiff) }} <small>{{ overview.currency || 'VND' }}</small></div>
                <div class="kpi-note">累计充值 − 累计提现</div>
              </article>
              <article class="kpi-card">
                <div class="kpi-label">打码进度</div>
                <div class="kpi-value kpi-value--turnover">
                  当前 {{ fmtFen(overview.totalValidBetAmount) }} <small>{{ overview.currency || 'VND' }}</small>
                </div>
                <div class="kpi-note">待完成 {{ fmtFen(overview.withdrawRequiredTurnover) }} {{ overview.currency || 'VND' }}</div>
              </article>
              <article class="kpi-card kpi-card--vip">
                <div class="kpi-label">VIP{{ overview.vipLevel ?? 0 }}</div>
                <el-progress
                  class="vip-progress"
                  :percentage="vipProgress"
                  :stroke-width="7"
                  :show-text="false"
                  :status="vipReady ? 'success' : undefined"
                />
                <div class="kpi-note">{{ vipProgressText }}</div>
              </article>
            </section>

            <div class="info-grid">
              <section class="info-card">
                <div class="info-card__header">
                  <h3>账号信息</h3>
                  <el-button v-hasPermi="['member:user:edit']" link type="primary" @click="openTagDialog">管理标签</el-button>
                </div>
                <div class="info-list">
                  <div class="info-row">
                    <span>账号类型</span>
                    <strong>{{ accountKindLabel }}</strong>
                  </div>
                  <div class="info-row">
                    <span>注册方式</span>
                    <strong>{{ registerPlatformLabel }}</strong>
                  </div>
                  <div class="info-row">
                    <span>验证方式</span>
                    <strong>{{ verifyTypeLabel(overview.verifyType) }}</strong>
                  </div>
                  <div class="info-row">
                    <span>会员层级</span>
                    <strong>{{ overview.levelName || '默认层级' }}</strong>
                  </div>
                  <div class="info-row">
                    <span>VIP 等级</span>
                    <strong>VIP{{ overview.vipLevel ?? 0 }}</strong>
                  </div>
                  <div class="info-row">
                    <span>真实姓名</span>
                    <strong>{{ overview.realName || '未实名' }}</strong>
                  </div>
                  <div class="info-row">
                    <span>注册时间</span>
                    <strong>{{ fmtDateTime(overview.registerAt) }} <small>{{ relativeTime(overview.registerAt) }}</small></strong>
                  </div>
                  <div class="info-row">
                    <span>注册 IP</span>
                    <strong class="inline-value">
                      {{ overview.registerIp || '—' }}
                      <el-tag v-if="isLoopbackIp(overview.registerIp)" type="warning" size="small" effect="plain">本地/代理</el-tag>
                      <el-button
                        v-if="overview.registerIp"
                        link
                        type="primary"
                        icon="CopyDocument"
                        @click="copyText(overview.registerIp || '', '注册IP')"
                      />
                    </strong>
                  </div>
                </div>
              </section>

              <section class="info-card">
                <div class="info-card__header">
                  <h3>登录与设备</h3>
                  <el-button link type="primary" @click="activeTab = 'device'">查看设备</el-button>
                </div>
                <div class="info-list">
                  <div class="info-row">
                    <span>最后登录</span>
                    <strong>{{ fmtDateTime(overview.lastLoginAt) }} <small>{{ relativeTime(overview.lastLoginAt) }}</small></strong>
                  </div>
                  <div class="info-row">
                    <span>最后登录 IP</span>
                    <strong class="inline-value">
                      {{ overview.lastLoginIp || '—' }}
                      <el-tag v-if="isLoopbackIp(overview.lastLoginIp)" type="warning" size="small" effect="plain">本地/代理</el-tag>
                      <el-button
                        v-if="overview.lastLoginIp"
                        link
                        type="primary"
                        icon="CopyDocument"
                        @click="copyText(overview.lastLoginIp || '', '登录IP')"
                      />
                    </strong>
                  </div>
                  <div class="info-row">
                    <span>登录终端</span>
                    <strong>{{ loginTerminalLabel }}</strong>
                  </div>
                  <div class="info-row info-row--stack">
                    <span>注册设备指纹</span>
                    <div class="device-value">
                      <code :title="overview.registerDevice || '—'">{{ overview.registerDevice || '—' }}</code>
                      <el-button
                        v-if="overview.registerDevice"
                        link
                        type="primary"
                        icon="CopyDocument"
                        @click="copyText(overview.registerDevice || '', '设备指纹')"
                      />
                    </div>
                  </div>
                  <div class="info-row">
                    <span>奖励钱包</span>
                    <strong>{{ fmtFen(overview.bonusBalance) }} {{ overview.currency || 'VND' }}</strong>
                  </div>
                </div>
              </section>
            </div>

            <section class="remark-card">
              <div class="remark-card__header">
                <div>
                  <h3>备注</h3>
                  <p>保存即追加到备注履历，概览与「历史备注」始终同源。</p>
                </div>
                <el-button link type="primary" @click="showRemarkHistory">历史备注</el-button>
              </div>
              <el-input
                v-model="remarkDraft"
                type="textarea"
                :rows="4"
                maxlength="500"
                show-word-limit
                placeholder="填写会员备注、风控结论或跟进事项"
              />
              <div class="remark-actions">
                <span>备注仅作为运营履历记录，不会修改会员资金或账号状态。</span>
                <el-button
                  v-hasPermi="['member:user:edit']"
                  type="primary"
                  :loading="remarkSaving"
                  :disabled="!remarkDirty"
                  @click="submitInlineRemark"
                >
                  保存备注
                </el-button>
              </div>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane label="联系方式" name="contact">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="手机号（掩码）">{{ contact.phoneMask || '—' }}</el-descriptions-item>
            <el-descriptions-item label="手机已验证">{{ contact.phoneVerified === 1 ? '是' : '否' }}</el-descriptions-item>
            <el-descriptions-item label="真实姓名">{{ contact.realName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="KYC等级">{{ contact.kycLevel ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="KYC状态">{{ kycStatusLabel(contact.kycStatus) }}</el-descriptions-item>
            <el-descriptions-item label="KYC通过时间">{{ contact.kycVerifiedAt || '—' }}</el-descriptions-item>
          </el-descriptions>
          <div class="text-gray-400 text-sm mt-2">合规提示：明文手机号需安全码解密（该能力待接入，见需求文档 02 遗留）。</div>
        </el-tab-pane>

        <el-tab-pane label="个人资料" name="profile">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="昵称">{{ profile.nickname || '—' }}</el-descriptions-item>
            <el-descriptions-item label="头像">
              <el-avatar v-if="profile.avatarUrl" :src="profile.avatarUrl" :size="36" />
              <span v-else>—</span>
            </el-descriptions-item>
            <el-descriptions-item label="性别">{{ genderLabel(profile.gender) }}</el-descriptions-item>
            <el-descriptions-item label="生日">{{ profile.birthday || '—' }}</el-descriptions-item>
            <el-descriptions-item label="国家/语言">{{ (profile.countryCode || '—') + ' / ' + (profile.languageCode || '—') }}</el-descriptions-item>
            <el-descriptions-item label="邀请码">{{ profile.inviteCode || '—' }}</el-descriptions-item>
            <el-descriptions-item label="邀请人UID">{{ profile.inviteUid || '—' }}</el-descriptions-item>
            <el-descriptions-item label="上级代理UID">{{ profile.parentAgentUid || '—' }}</el-descriptions-item>
            <el-descriptions-item label="顶层代理UID">{{ profile.topAgentUid || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane v-if="canViewPlain" label="提现账号" name="withdraw">
          <el-table
            v-loading="tabLoading.withdraw"
            :data="withdrawAccounts"
            border
            empty-text="暂无提现账户记录"
          >
            <el-table-column label="账户类型" align="center" width="150">
              <template #default="{ row }">
                <el-tag :type="withdrawSourceTagType(row as MemberWithdrawAccountVO)" effect="plain">
                  {{ withdrawAccountKind(row as MemberWithdrawAccountVO) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="账号 / 地址" align="left" min-width="300">
              <template #default="{ row }">
                <div v-if="row.accountNo" class="withdraw-plain-value">
                  <code>{{ row.accountNo }}</code>
                  <el-button
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyText(row.accountNo, '提现账号')"
                  />
                  <el-tag type="success" size="small" effect="plain">明文</el-tag>
                </div>
                <div v-else class="withdraw-masked-value">
                  <code>{{ row.accountNoMask || '—' }}</code>
                  <el-tag type="warning" size="small" effect="plain">仅掩码</el-tag>
                  <el-tooltip content="历史银行卡只保存哈希，无法还原完整卡号" placement="top">
                    <span class="withdraw-history-tip">历史数据</span>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="账户名 / 标签" align="center" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.accountName || row.addressLabel || '—' }}
              </template>
            </el-table-column>
            <el-table-column label="银行 / 币种" align="center" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <template v-if="row.coinName">
                  {{ row.coinName }}<span v-if="row.networkName"> · {{ row.networkName }}</span>
                </template>
                <template v-else>
                  {{ row.bankName || row.bankCode || '—' }}
                </template>
              </template>
            </el-table-column>
            <el-table-column label="渠道 / 平台" align="center" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <div>{{ row.channelCode || row.tabCode || '—' }}</div>
                <div v-if="row.platform" class="text-gray-400 text-sm">{{ row.platform }}</div>
              </template>
            </el-table-column>
            <el-table-column label="默认" align="center" width="75">
              <template #default="{ row }">{{ row.isPrimary === 1 ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                  {{ withdrawAccountStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最近使用" align="center" width="170">
              <template #default="{ row }">{{ fmtDateTime(row.lastUsedAt) }}</template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" width="170">
              <template #default="{ row }">{{ fmtDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="账户交易" name="transaction">
          <el-table v-loading="tabLoading.transaction" :data="transactions" border>
            <el-table-column label="时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="流水号" prop="ledgerNo" align="left" min-width="220" show-overflow-tooltip />
            <el-table-column label="账变大类" align="center" width="110">
              <template #default="{ row }">{{ bizTypeLabel(row.bizType) }}</template>
            </el-table-column>
            <el-table-column label="变动金额" align="right" width="140">
              <template #default="{ row }">
                <span :class="Number(row.changeAmount) >= 0 ? 'text-red-500' : 'text-green-600'">{{ fmtFen(row.changeAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="变动前余额" align="right" width="140">
              <template #default="{ row }">{{ fmtFen(row.beforeBalance) }}</template>
            </el-table-column>
            <el-table-column label="变动后余额" align="right" width="140">
              <template #default="{ row }">{{ fmtFen(row.afterBalance) }}</template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="txTotal > 0"
            v-model:page="txQuery.pageNum"
            v-model:limit="txQuery.pageSize"
            :total="txTotal"
            @pagination="loadTransactions"
          />
        </el-tab-pane>

        <el-tab-pane label="投注统计" name="bet">
          <el-table v-loading="tabLoading.bet" :data="betStats" border>
            <el-table-column label="日期" prop="statDate" align="center" width="130" />
            <el-table-column label="游戏" prop="gameCode" align="center" width="140" />
            <el-table-column label="注单数" prop="betCount" align="right" width="110" />
            <el-table-column label="投注金额" align="right" width="140">
              <template #default="{ row }">{{ fmtFen(row.betAmount) }}</template>
            </el-table-column>
            <el-table-column label="派彩金额" align="right" width="140">
              <template #default="{ row }">{{ fmtFen(row.payoutAmount) }}</template>
            </el-table-column>
            <el-table-column label="会员输赢" align="right" width="140">
              <template #default="{ row }">
                <span :class="Number(row.netWinLoss) >= 0 ? 'text-red-500' : 'text-green-600'">{{ fmtFen(row.netWinLoss) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="杀率" align="right" width="110">
              <template #default="{ row }">{{ Number(row.killRate ?? 0).toFixed(2) }}%</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="会员消息" name="message">
          <el-table v-loading="tabLoading.message" :data="messages" border>
            <el-table-column label="时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="类型" align="center" width="100">
              <template #default="{ row }">{{ mailTypeLabel(row.mailType) }}</template>
            </el-table-column>
            <el-table-column label="标题" prop="title" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="内容" prop="content" align="left" min-width="260" show-overflow-tooltip />
            <el-table-column label="已读" align="center" width="80">
              <template #default="{ row }">{{ row.isRead === 1 ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="登录设备" name="device">
          <el-table v-loading="tabLoading.device" :data="devices" border>
            <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column label="最近登录" prop="lastLoginAt" align="center" width="180" />
            <el-table-column label="设备号" prop="deviceFingerprint" align="center" min-width="180" show-overflow-tooltip />
            <el-table-column label="客户端" align="center" min-width="200">
              <template #default="{ row }">
                <div>{{ clientOsText(row) }}</div>
                <div class="text-gray-400 text-sm">{{ clientBrowserText(row) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="IP" prop="lastLoginIp" align="center" min-width="140" />
            <el-table-column label="信任设备" align="center" width="100">
              <template #default="{ row }">{{ row.isTrustDevice === 1 ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="会员日志" name="log">
          <el-table v-loading="tabLoading.log" :data="logs" border>
            <el-table-column label="登录时间" prop="loginAt" align="center" width="180" />
            <el-table-column label="登录IP" prop="loginIp" align="center" min-width="140" />
            <el-table-column label="设备" prop="loginDevice" align="left" min-width="200" show-overflow-tooltip />
            <el-table-column label="结果" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.loginResult === 1 ? 'success' : 'danger'">{{ row.loginResult === 1 ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="失败原因" prop="failReason" align="left" min-width="150" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="历史备注" name="remark">
          <div class="mb-2">
            <el-input v-model="newRemark" type="textarea" :rows="2" placeholder="请输入新备注（将记录变更履历）" style="max-width: 640px" />
            <el-button v-hasPermi="['member:user:edit']" class="ml-2" type="primary" @click="submitRemark">保存备注</el-button>
          </div>
          <el-table v-loading="tabLoading.remark" :data="remarks" border>
            <el-table-column label="时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="原备注" prop="oldRemark" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="新备注" prop="newRemark" align="left" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作人" prop="operatorId" align="center" width="150" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-empty v-else description="请输入会员ID后查询" />

    <el-dialog v-model="plainDialog.visible" title="联系方式明文查看（高敏操作已记日志）" width="720px" append-to-body destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="会员ID">{{ plainDialog.data.uid }}</el-descriptions-item>
        <el-descriptions-item label="会员账号">{{ plainDialog.data.loginName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ plainDialog.data.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机已验证">{{ plainDialog.data.phoneVerified === 1 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ plainDialog.data.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="KYC等级">{{ plainDialog.data.kycLevel || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ plainDialog.data.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱已验证">{{ plainDialog.data.emailVerified === 1 ? '是' : '否' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert class="mt-3" type="warning" :closable="false" :title="plainDialog.data.cardNote || '提现卡号仅存哈希与掩码，无法还原明文'" />
      <el-table class="mt-3" border :data="plainDialog.data.accounts ?? []" max-height="260">
        <el-table-column label="银行" prop="bankName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="开户名" prop="accountName" align="center" min-width="110" show-overflow-tooltip />
        <el-table-column label="卡号(掩码)" prop="accountNoMask" align="center" min-width="150" show-overflow-tooltip />
        <el-table-column label="预留手机" prop="mobile" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="主账号" align="center" width="90">
          <template #default="{ row }">{{ row.isPrimary === 1 ? '是' : '否' }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="plainDialog.visible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="vipDialog.visible" title="VIP 等级调整（写 user_vip_log）" width="520px" append-to-body destroy-on-close>
      <el-form label-width="110px">
        <el-form-item label="会员ID">
          <span>{{ currentUid }}</span>
        </el-form-item>
        <el-form-item label="目标VIP等级">
          <el-input-number v-model="vipDialog.vipLevel" :min="0" :max="99" controls-position="right" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="vipDialog.reason" type="textarea" :rows="3" maxlength="255" placeholder="必填：说明调整依据" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="vipDialog.saving" @click="submitVipAdjust">确 定</el-button>
        <el-button @click="vipDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="emailDialog.visible" title="维护会员邮箱" width="520px" append-to-body destroy-on-close>
      <el-form label-width="110px">
        <el-form-item label="会员ID">
          <span>{{ currentUid }}</span>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="emailDialog.email" placeholder="name@example.com" />
        </el-form-item>
        <el-form-item label="标记已验证">
          <el-switch v-model="emailDialog.verified" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="emailDialog.saving" @click="submitEmail">确 定</el-button>
        <el-button @click="emailDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tagDialog.visible" title="管理会员标签" width="520px" append-to-body destroy-on-close>
      <div class="dialog-member-tip">会员：{{ overview.loginName }}（{{ currentUid }}）</div>
      <el-checkbox-group v-if="tagOptions.length" v-model="tagDialog.tagIds" class="tag-selector">
        <el-checkbox v-for="tag in tagOptions" :key="tag.tagId" :value="tag.tagId">
          <span class="tag-option-dot" :style="{ backgroundColor: tag.tagColor || '#909399' }" />
          {{ tag.tagName }}
        </el-checkbox>
      </el-checkbox-group>
      <el-empty v-else :image-size="72" description="暂无可用标签，请先到「会员标签」页维护" />
      <template #footer>
        <el-button type="primary" :loading="tagDialog.saving" @click="submitTagDialog">保 存</el-button>
        <el-button @click="tagDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="levelDialog.visible" title="调整会员层级" width="520px" append-to-body destroy-on-close>
      <el-form label-width="95px">
        <el-form-item label="会员">
          <span>{{ overview.loginName }}（{{ currentUid }}）</span>
        </el-form-item>
        <el-form-item label="目标层级">
          <el-select v-model="levelDialog.levelId" filterable style="width: 100%">
            <el-option v-for="level in levelOptions" :key="level.levelId" :label="level.levelName" :value="level.levelId" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="levelDialog.reason" type="textarea" :rows="3" maxlength="255" placeholder="必填：说明层级调整依据" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="levelDialog.saving" @click="submitLevelDialog">确 定</el-button>
        <el-button @click="levelDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="messageDialog.visible" title="发送站内信" width="620px" append-to-body destroy-on-close>
      <el-form label-width="85px">
        <el-form-item label="收件会员">
          <span>{{ overview.loginName }}（{{ currentUid }}）</span>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="messageDialog.title" maxlength="80" show-word-limit placeholder="请输入站内信标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="messageDialog.content"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
            placeholder="请输入站内信内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="messageDialog.saving" @click="submitMessageDialog">确认发送</el-button>
        <el-button @click="messageDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberDetail" lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import modal from '@/plugins/modal';
import { useUserStore } from '@/store/modules/user';
import {
  getMemberDetailContact,
  getMemberDetailOverview,
  getMemberDetailProfile,
  listMemberBetStat,
  listMemberMessage,
  listMemberRemarkHistory,
  listMemberTransaction,
  listMemberWithdrawAccount,
  updateMemberRemark
} from '@/api/member/detail';
import type {
  MemberBetStatVO,
  MemberContactVO,
  MemberDetailOverviewVO,
  MemberMessageVO,
  MemberProfileVO,
  MemberRemarkVO,
  MemberTransactionVO,
  MemberWithdrawAccountVO
} from '@/api/member/detail/types';
import { listMemberDevice } from '@/api/member/device';
import type { MemberDeviceVO } from '@/api/member/device/types';
import { listMemberLevelOptions } from '@/api/member/level';
import type { MemberLevelVO } from '@/api/member/level/types';
import { listMemberLog } from '@/api/member/log';
import type { MemberLogVO } from '@/api/member/log/types';
import { listMemberTagOptions, listMemberTagsOfUser } from '@/api/member/tag';
import type { MemberTagVO } from '@/api/member/tag/types';
// FIX(2026-10-10): 会员详情支持"账号 → uid"解析，需要复用会员列表接口（见 handleLoad）
import { batchMemberLevel, batchMemberStatus, batchMemberTag, listMemberUser } from '@/api/member/users';
import type { MemberUserVO } from '@/api/member/users/types';
import { addMessageTask, sendMessageTask } from '@/api/ops/message';

type DataBody<T> = { data?: T };
type PageBody<T> = { rows?: T[]; total?: number };
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const uidInput = ref<string>('');
const activeTab = ref('overview');
const loading = ref(false);
const currentUid = ref<string | number | null>(null);

const overview = reactive<MemberDetailOverviewVO>({ uid: 0 });
const contact = reactive<MemberContactVO>({ uid: 0 });
const profile = reactive<MemberProfileVO>({ uid: 0 });
const withdrawAccounts = ref<MemberWithdrawAccountVO[]>([]);
const transactions = ref<MemberTransactionVO[]>([]);
const messages = ref<MemberMessageVO[]>([]);
const remarks = ref<MemberRemarkVO[]>([]);
const betStats = ref<MemberBetStatVO[]>([]);
const devices = ref<MemberDeviceVO[]>([]);
const logs = ref<MemberLogVO[]>([]);
const newRemark = ref('');
const remarkDraft = ref('');
const remarkSaving = ref(false);
const txTotal = ref(0);
const txQuery = reactive({ pageNum: 1, pageSize: 10 });
const levelOptions = ref<MemberLevelVO[]>([]);
const tagOptions = ref<MemberTagVO[]>([]);

/** 页签懒加载状态：避免一次请求 10 张表 */
const loaded = reactive<Record<string, boolean>>({});
const tabLoading = reactive<Record<string, boolean>>({});

const hasPermission = (permission: string) =>
  userStore.permissions.includes('*:*:*') || userStore.permissions.includes(permission);
const canEditMember = computed(() => hasPermission('member:user:edit'));
const canViewPlain = computed(() => hasPermission('member:detail:plain'));

/**
 * 金额展示（原数展示，不再做「分 → 元」折算）。
 *
 * FIX(2026-10-13 用户口径「所有展示的数据不需要除 100，直接原数展示」)：后端各源金额列
 * （user_wallet_ledger.change_amount / card_dealer_round_bet.bet_amount / 汇总表 bet_amount 等）
 * 存的就是玩家可见金额本身（本地实测：下注 10000 的注单，注单表与钱包流水都是 10000），
 * 前端再除 100 会把金额显示成真实的 1/100（余额 781046 显示成 7810.46）。
 * 函数名保留 fmtFen 仅为减少改动面，语义已是「按原数格式化」。
 */
const fmtFen = (fen?: number | string) => {
  const value = Number(fen ?? 0);
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const statusLabel = (status?: number) => (status === 1 ? '正常' : status === 2 ? '冻结' : status === 3 ? '注销' : '—');
const statusTagType = computed(() => {
  if (overview.status === 1) return 'success';
  if (overview.status === 2) return 'danger';
  return 'info';
});
const accountInitial = computed(() => (overview.loginName || String(overview.uid || '')).slice(0, 1).toUpperCase() || '?');
const isTestAccount = computed(() => overview.accountType === 'TEST');
const accountKindLabel = computed(() => (isTestAccount.value ? '测试账号' : '正常账号'));
const totalBalance = computed(() => Number(overview.availableBalance ?? 0) + Number(overview.frozenBalance ?? 0));
const hasFundingAnomaly = computed(
  () => totalBalance.value > 0 && Number(overview.totalRechargeAmount ?? 0) <= 0
);
const registerPlatformLabel = computed(() => {
  const type = (overview.registerClientType || '').toLowerCase();
  if (type === 'app') return 'App';
  if (type === 'web' || type === 'h5') return 'Web';
  return '—';
});
const loginTerminalLabel = computed(() => {
  const client = (overview.lastLoginClientType || '').toLowerCase();
  const clientLabel = client === 'app' ? 'App' : client === 'web' || client === 'h5' ? 'Web' : overview.lastLoginClientType || '—';
  return [clientLabel, overview.lastLoginOs].filter(Boolean).join(' · ') || '—';
});
const vipReady = computed(
  () =>
    overview.vipUpgradeNeedPay != null &&
    Number(overview.vipUpgradeNeedPay) <= 0 &&
    Number(overview.vipUpgradeNeedRounds ?? 0) <= 0
);
const vipProgress = computed(() => {
  if (overview.vipUpgradeNeedPay == null && overview.vipUpgradeNeedRounds == null) {
    return 100;
  }
  if (vipReady.value) {
    return 100;
  }
  const ratios: number[] = [];
  const rechargeCurrent = Number(overview.totalRechargeAmount ?? 0) / 100;
  const rechargeNeed = Number(overview.vipUpgradeNeedPay ?? 0);
  const rechargeTarget = rechargeCurrent + rechargeNeed;
  if (rechargeTarget > 0) {
    ratios.push(rechargeCurrent / rechargeTarget);
  }
  const roundsCurrent = Number(overview.totalRounds ?? 0);
  const roundsNeed = Number(overview.vipUpgradeNeedRounds ?? 0);
  const roundsTarget = roundsCurrent + roundsNeed;
  if (roundsTarget > 0) {
    ratios.push(roundsCurrent / roundsTarget);
  }
  return ratios.length ? Math.max(0, Math.min(99, Math.floor(Math.min(...ratios) * 100))) : 0;
});
const vipProgressText = computed(() => {
  if (overview.vipUpgradeNeedPay == null && overview.vipUpgradeNeedRounds == null) {
    return '当前已是最高 VIP 等级';
  }
  if (vipReady.value) {
    return '已达升级条件，等待系统自动升级';
  }
  return `距 VIP${Number(overview.vipLevel ?? 0) + 1} 还需充值 ${Number(overview.vipUpgradeNeedPay ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} VND / 打码 ${Number(overview.vipUpgradeNeedRounds ?? 0)} 局`;
});
const remarkDirty = computed(() => remarkDraft.value !== (overview.remark ?? ''));
const genderLabel = (gender?: number) => (gender === 1 ? '男' : gender === 2 ? '女' : '未知');
const kycStatusLabel = (status?: number) => (status === 2 ? '通过' : status === 3 ? '驳回' : status === 1 ? '待审核' : '未提交');
const verifyTypeLabel = (type?: string) =>
  ({ NONE: '无验证', SMS: '短信', EMAIL: '邮箱', KYC: '实名' } as Record<string, string>)[type ?? 'NONE'] ?? '无验证';
const accountTypeLabel = (type?: number) => (type === 1 ? '银行卡' : type === 2 ? 'UPI' : type === 3 ? '手机钱包' : '其他');
const withdrawAccountKind = (row: MemberWithdrawAccountVO) => {
  if (row.accountKind) return row.accountKind;
  if (row.coinName) return '虚拟币地址';
  if (row.sourceType === 'LEGACY_BANK') return '银行卡账户';
  return accountTypeLabel(row.accountType);
};
const withdrawSourceTagType = (row: MemberWithdrawAccountVO) => {
  if (row.sourceType === 'WITHDRAW_BENEFICIARY') return 'primary';
  if (row.sourceType === 'CRYPTO_ADDRESS') return 'info';
  return 'success';
};
const withdrawAccountStatusLabel = (status?: number) =>
  status === 1 ? '正常' : status === 2 ? '冻结' : status === 3 ? '已删除' : '—';
const mailTypeLabel = (type?: number) => (type === 2 ? '活动奖励' : type === 3 ? '好友' : type === 4 ? '客服' : type === 5 ? '公告' : '系统');
const bizTypeLabel = (type?: number) =>
  ({ 1: '充值', 2: '提现', 3: '下注', 4: '派彩', 5: '退款', 6: '人工调账' } as Record<number, string>)[type ?? -1] ?? '其他';

/**
 * 标签取色（与【用户列表】同一套「文字 + 颜色块」效果）。
 *
 * tagColor 与 tagNames 是后端同一次聚合产出的同序逗号拼接，按同一索引取色；
 * 缺失时回落灰色，避免出现无底色文字。
 */
const getTagColor = (tagColor?: string, index?: number) => {
  if (!tagColor) return '#909399';
  return tagColor.split(',')[index ?? 0] || '#909399';
};

/** 客户端展示＝OS + 系统版本（需求口径：客户端包含 os/os_version/browser/browser_version） */
const clientOsText = (row: { os?: string; osVersion?: string }) => [row.os, row.osVersion].filter(Boolean).join(' ') || '—';
const clientBrowserText = (row: { browser?: string; browserVersion?: string }) =>
  [row.browser, row.browserVersion].filter(Boolean).join(' ') || '—';

/** 兼容后端 LocalDateTime 的 T/空格两种序列化格式，并固定到秒级展示。 */
const fmtDateTime = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

const relativeTime = (value?: string) => {
  if (!value) return '—';
  const time = new Date(value.replace(' ', 'T')).getTime();
  if (Number.isNaN(time)) return '';
  const diff = Date.now() - time;
  if (diff < 60_000) return '刚刚';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
};

const isLoopbackIp = (value?: string) => {
  const ip = (value || '').trim().toLowerCase().replace(/^::ffff:/, '');
  return ip === '::1' || ip === 'localhost' || ip === '0.0.0.0' || ip.startsWith('127.');
};

const copyText = async (value: string, label: string) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  modal.msgSuccess(`${label}已复制`);
};

const loadOverview = async (uid: string | number) => {
  const res = (await getMemberDetailOverview(uid)) as unknown as DataBody<MemberDetailOverviewVO>;
  Object.assign(overview, res.data ?? { uid: 0 });
  remarkDraft.value = overview.remark ?? '';
  return res.data;
};

const handleLoad = async () => {
  const input = uidInput.value.trim();
  if (!input) {
    modal.msgWarning('请输入会员ID');
    return;
  }
  loading.value = true;
  try {
    // FIX(2026-10-10): 输入非数字时先按"会员账号"解析出 uid，再调用详情接口。
    // 原因：本页输入框是自由文本，旧实现把内容原样拼进路径（/infra/member/detail/{uid}/overview），
    // 后端 @PathVariable Long uid 直接类型校验失败，返回
    // "请求参数类型不匹配，参数[uid]要求类型为：'java.lang.Long'，但输入值为：'www'"。
    // 解决方案：纯数字按 uid 用；非数字先经会员列表按 loginName 精确查询换取 uid；
    // 查不到/多条时给出明确提示，不再把非法值拼进 URL（同时避免后续各页签接口重复报错）。
    let uid = input;
    if (!/^\d+$/.test(input)) {
      // 注意：后端 loginName 是**模糊**匹配（实测 "g318test" 会命中 g318test1/g318test2），
      // 因此这里必须再按"精确相等"过滤一次，否则会把近似账号当成目标会员。
      const matched = (await listMemberUser({ loginName: input, pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberUserVO>;
      const exact = (matched.rows ?? []).filter((item) => item.loginName === input);
      if (!exact.length) {
        modal.msgWarning(`未找到账号为「${input}」的会员，请输入数字会员ID或正确的会员账号`);
        return;
      }
      if (exact.length > 1) {
        modal.msgWarning(`账号「${input}」匹配到多个会员，请输入数字会员ID精确定位`);
        return;
      }
      uid = String(exact[0].uid);
      uidInput.value = uid;
    }
    currentUid.value = uid;
    const data = await loadOverview(uid);
    if (!data) {
      modal.msgWarning('未查询到该会员');
      return;
    }
    // 切换会员后清空缓存，避免串号
    Object.keys(loaded).forEach((key) => delete loaded[key]);
    loaded.overview = true;
    await loadTab(activeTab.value);
  } finally {
    loading.value = false;
  }
};

const resetAll = () => {
  uidInput.value = '';
  currentUid.value = null;
  Object.assign(overview, { uid: 0 });
  remarkDraft.value = '';
  Object.keys(loaded).forEach((key) => delete loaded[key]);
};

const loadTab = async (tab: string) => {
  if (!currentUid.value) {
    return;
  }
  const uid = currentUid.value;
  tabLoading[tab] = true;
  try {
    if (tab === 'contact') {
      const res = (await getMemberDetailContact(uid)) as unknown as DataBody<MemberContactVO>;
      Object.assign(contact, res.data ?? { uid: 0 });
    } else if (tab === 'profile') {
      const res = (await getMemberDetailProfile(uid)) as unknown as DataBody<MemberProfileVO>;
      Object.assign(profile, res.data ?? { uid: 0 });
    } else if (tab === 'withdraw') {
      const res = (await listMemberWithdrawAccount(uid)) as unknown as DataBody<MemberWithdrawAccountVO[]>;
      withdrawAccounts.value = res.data ?? [];
    } else if (tab === 'transaction') {
      await loadTransactions();
    } else if (tab === 'bet') {
      const res = (await listMemberBetStat(uid)) as unknown as DataBody<MemberBetStatVO[]>;
      betStats.value = res.data ?? [];
    } else if (tab === 'message') {
      const res = (await listMemberMessage(uid, { pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberMessageVO>;
      messages.value = res.rows ?? [];
    } else if (tab === 'device') {
      // includeRegisterDevice=1：按「使用过（uid）或 注册设备指纹」取数（见后端 MemberDeviceMapper）
      const res = (await listMemberDevice({ uid, includeRegisterDevice: 1, pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberDeviceVO>;
      devices.value = res.rows ?? [];
    } else if (tab === 'log') {
      const res = (await listMemberLog({ uid, pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberLogVO>;
      logs.value = res.rows ?? [];
    } else if (tab === 'remark') {
      const res = (await listMemberRemarkHistory(uid, { pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberRemarkVO>;
      remarks.value = res.rows ?? [];
    }
    loaded[tab] = true;
  } finally {
    tabLoading[tab] = false;
  }
};

const loadTransactions = async () => {
  if (!currentUid.value) {
    return;
  }
  const res = (await listMemberTransaction(currentUid.value, txQuery)) as unknown as PageBody<MemberTransactionVO>;
  transactions.value = res.rows ?? [];
  txTotal.value = res.total ?? 0;
};

const submitRemark = async () => {
  if (!currentUid.value) {
    return;
  }
  const res = (await updateMemberRemark({ uid: currentUid.value, remark: newRemark.value })) as unknown as DataBody<number>;
  modal.msgSuccess(`备注已保存（履历 ${res.data ?? 0}）`);
  newRemark.value = '';
  await loadTab('remark');
  // 概览的「备注」与履历同源，保存后立即刷新，保证两个页签看到的是同一个值
  await loadOverview(currentUid.value);
};

/* ---------------- 概览内联备注：与「历史备注」页签共用同一条写入链路 ---------------- */
const submitInlineRemark = async () => {
  if (!currentUid.value) {
    return;
  }
  remarkSaving.value = true;
  try {
    await updateMemberRemark({ uid: currentUid.value, remark: remarkDraft.value });
    modal.msgSuccess('已写入备注履历');
    await loadOverview(currentUid.value);
    // 履历已变：标记该页签待重拉，下次进入「历史备注」时与概览保持一致
    loaded.remark = false;
  } finally {
    remarkSaving.value = false;
  }
};

const showRemarkHistory = () => {
  loaded.remark = false;
  activeTab.value = 'remark';
};

watch(activeTab, async (tab) => {
  if (!loaded[tab]) {
    await loadTab(tab);
  }
});

// 用 watch 监听 query.uid，immediate 让首次也执行
watch(
  () => route.query.uid,
  (uid) => {
    if (uid) {
      uidInput.value = String(uid);
      handleLoad();
    }
  },
  { immediate: true }
);
/* ---------------- 明文查看 / VIP 改档（批次 7） ---------------- */
const plainDialog = reactive<{ visible: boolean; data: any }>({ visible: false, data: {} });
const vipDialog = reactive<{ visible: boolean; vipLevel: number; reason: string; saving: boolean }>({
  visible: false,
  vipLevel: 0,
  reason: '',
  saving: false
});

/** 明文查看：独立权限点 + 服务端写操作日志；卡号只存哈希/掩码，接口会返回提示 */
const openPlain = async () => {
  if (!currentUid.value) {
    return;
  }
  const { ElMessage } = await import('element-plus');
  const { getPlainContact } = await import('@/api/member/profile-adjust');
  try {
    const res: any = await getPlainContact(currentUid.value);
    plainDialog.data = res?.data ?? {};
    plainDialog.visible = true;
  } catch (e) {
    ElMessage.error('查询失败：' + (e as Error).message);
  }
};

const openVipAdjust = () => {
  vipDialog.vipLevel = Number(overview.vipLevel ?? 0);
  vipDialog.reason = '';
  vipDialog.visible = true;
};

const submitVipAdjust = async () => {
  const { ElMessage } = await import('element-plus');
  if (!vipDialog.reason) {
    ElMessage.error('请填写调整原因');
    return;
  }
  const { adjustMemberVip } = await import('@/api/member/profile-adjust');
  vipDialog.saving = true;
  try {
    await adjustMemberVip({ uid: currentUid.value, vipLevel: vipDialog.vipLevel, reason: vipDialog.reason });
    ElMessage.success('改档成功（已写入 user_vip_log）');
    vipDialog.visible = false;
    await handleLoad();
  } catch (e) {
    ElMessage.error('改档失败：' + (e as Error).message);
  } finally {
    vipDialog.saving = false;
  }
};

/* ---------------- 邮箱维护（批次 8：补齐联系方式写入侧） ---------------- */
const emailDialog = reactive<{ visible: boolean; email: string; verified: number; saving: boolean }>({
  visible: false,
  email: '',
  verified: 0,
  saving: false
});

const openEmail = async () => {
  const { ElMessage } = await import('element-plus');
  const { getPlainContact } = await import('@/api/member/profile-adjust');
  try {
    const res: any = await getPlainContact(currentUid.value);
    emailDialog.email = res?.data?.email ?? '';
    emailDialog.verified = res?.data?.emailVerified === 1 ? 1 : 0;
    emailDialog.visible = true;
  } catch (e) {
    ElMessage.error('查询失败：' + (e as Error).message);
  }
};

const submitEmail = async () => {
  const { ElMessage } = await import('element-plus');
  const request = (await import('@/utils/request')).default;
  if (!emailDialog.email) {
    ElMessage.error('请填写邮箱');
    return;
  }
  emailDialog.saving = true;
  try {
    await request({
      url: '/infra/member/detail/email',
      method: 'post',
      data: { uid: currentUid.value, email: emailDialog.email, emailVerified: emailDialog.verified }
    });
    ElMessage.success('邮箱已保存（已写操作日志）');
    emailDialog.visible = false;
    await handleLoad();
  } catch (e) {
    ElMessage.error('保存失败：' + (e as Error).message);
  } finally {
    emailDialog.saving = false;
  }
};

/* ---------------- 概览快捷操作：流水、冻结、层级、标签、站内信 ---------------- */
const currentTagIds = ref<number[]>([]);
const tagDialog = reactive<{ visible: boolean; tagIds: number[]; saving: boolean }>({
  visible: false,
  tagIds: [],
  saving: false
});
const levelDialog = reactive<{ visible: boolean; levelId?: number; reason: string; saving: boolean }>({
  visible: false,
  levelId: undefined,
  reason: '',
  saving: false
});
const messageDialog = reactive<{ visible: boolean; title: string; content: string; saving: boolean }>({
  visible: false,
  title: '',
  content: '',
  saving: false
});

const ensureLevelOptions = async () => {
  if (levelOptions.value.length) return;
  const res = (await listMemberLevelOptions()) as unknown as DataBody<MemberLevelVO[]>;
  levelOptions.value = res.data ?? [];
};

const ensureTagOptions = async () => {
  if (tagOptions.value.length) return;
  const res = (await listMemberTagOptions()) as unknown as DataBody<MemberTagVO[]>;
  tagOptions.value = res.data ?? [];
};

const loadCurrentTagIds = async () => {
  if (!currentUid.value) {
    currentTagIds.value = [];
    return;
  }
  const res = (await listMemberTagsOfUser([currentUid.value])) as unknown as DataBody<number[]>;
  currentTagIds.value = res.data ?? [];
};

const openTagDialog = async () => {
  if (!currentUid.value) return;
  await Promise.all([ensureTagOptions(), loadCurrentTagIds()]);
  tagDialog.tagIds = [...currentTagIds.value];
  tagDialog.visible = true;
};

const submitTagDialog = async () => {
  if (!currentUid.value) return;
  const before = new Set(currentTagIds.value);
  const after = new Set(tagDialog.tagIds);
  const addIds = tagDialog.tagIds.filter((id) => !before.has(id));
  const removeIds = currentTagIds.value.filter((id) => !after.has(id));
  if (!addIds.length && !removeIds.length) {
    tagDialog.visible = false;
    return;
  }
  tagDialog.saving = true;
  try {
    if (addIds.length) {
      await batchMemberTag({ uids: [currentUid.value], tagIds: addIds, mode: 'BIND' });
    }
    if (removeIds.length) {
      await batchMemberTag({ uids: [currentUid.value], tagIds: removeIds, mode: 'UNBIND' });
    }
    await loadOverview(currentUid.value);
    await loadCurrentTagIds();
    tagDialog.visible = false;
    modal.msgSuccess('会员标签已更新');
  } finally {
    tagDialog.saving = false;
  }
};

const openLevelDialog = async () => {
  if (!currentUid.value) return;
  await ensureLevelOptions();
  levelDialog.levelId = overview.levelId ?? undefined;
  levelDialog.reason = '';
  levelDialog.visible = true;
};

const submitLevelDialog = async () => {
  if (!currentUid.value || !levelDialog.levelId) {
    modal.msgWarning('请选择目标层级');
    return;
  }
  if (!levelDialog.reason.trim()) {
    modal.msgWarning('请填写层级调整原因');
    return;
  }
  levelDialog.saving = true;
  try {
    await batchMemberLevel({
      uids: [currentUid.value],
      levelId: levelDialog.levelId,
      reason: levelDialog.reason.trim()
    });
    levelDialog.visible = false;
    modal.msgSuccess('会员层级已调整');
    await loadOverview(currentUid.value);
  } finally {
    levelDialog.saving = false;
  }
};

const toggleMemberStatus = async () => {
  if (!currentUid.value || overview.status === 3) return;
  const freezing = overview.status === 1;
  try {
    await modal.confirm(
      freezing
        ? `确认冻结会员「${overview.loginName}」？冻结后该会员将无法正常登录。`
        : `确认解冻会员「${overview.loginName}」？`
    );
  } catch {
    return;
  }
  await batchMemberStatus({
    uids: [currentUid.value],
    status: freezing ? 2 : 1,
    reason: freezing ? '会员详情页手动冻结' : '会员详情页手动解冻'
  });
  modal.msgSuccess(freezing ? '会员已冻结' : '会员已解冻');
  await loadOverview(currentUid.value);
};

const handleMoreCommand = async (command: string) => {
  if (command === 'toggle-status') await toggleMemberStatus();
  if (command === 'change-level') await openLevelDialog();
  if (command === 'edit-tags') await openTagDialog();
  if (command === 'plain') await openPlain();
  if (command === 'email') await openEmail();
  if (command === 'vip') openVipAdjust();
};

const goLedger = () => {
  if (!currentUid.value) return;
  router.push({ path: '/member/ledger', query: { uid: String(currentUid.value) } });
};

const openMessageDialog = () => {
  if (!currentUid.value) return;
  messageDialog.title = '';
  messageDialog.content = '';
  messageDialog.visible = true;
};

const submitMessageDialog = async () => {
  if (!currentUid.value) return;
  if (!messageDialog.title.trim() || !messageDialog.content.trim()) {
    modal.msgWarning('请填写站内信标题和内容');
    return;
  }
  try {
    await modal.confirm(`确认向会员「${overview.loginName}」发送这封站内信？`);
  } catch {
    return;
  }
  messageDialog.saving = true;
  try {
    const result = (await addMessageTask({
      taskName: `会员站内信-${String(currentUid.value).slice(-10)}-${Date.now()}`,
      channel: 1,
      title: messageDialog.title.trim(),
      content: messageDialog.content.trim(),
      targetScope: 3,
      scopeParamsJson: JSON.stringify({ uids: [String(currentUid.value)] }),
      sendType: 1
    })) as unknown as DataBody<number>;
    if (!result.data) {
      throw new Error('站内信任务创建失败');
    }
    await sendMessageTask({ id: result.data });
    messageDialog.visible = false;
    loaded.message = false;
    modal.msgSuccess('站内信已发送');
  } finally {
    messageDialog.saving = false;
  }
};
</script>

<style scoped>
.member-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 8px;
}

.identity-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background:
    radial-gradient(circle at 100% 0, var(--el-color-primary-light-9), transparent 45%),
    var(--el-bg-color);
}

.identity-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.identity-avatar {
  flex: none;
  color: #fff;
  font-size: 25px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 8px 20px rgb(64 158 255 / 22%);
}

.identity-copy {
  min-width: 0;
}

.identity-title-row,
.member-id-row,
.identity-meta,
.identity-actions,
.inline-value,
.device-value,
.remark-actions,
.info-card__header,
.remark-card__header {
  display: flex;
  align-items: center;
}

.identity-title-row {
  flex-wrap: wrap;
  gap: 8px;
}

.identity-title-row h2 {
  margin: 0 4px 0 0;
  color: var(--el-text-color-primary);
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.member-tag-chip,
.member-tag-add {
  height: 24px;
  padding: 0 9px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  line-height: 24px;
  transition:
    transform 0.16s ease,
    opacity 0.16s ease;
}

.member-tag-chip {
  color: #fff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%);
}

.member-tag-add {
  border: 1px dashed var(--el-border-color);
  color: var(--el-color-primary);
  background: transparent;
}

.member-tag-chip:hover,
.member-tag-add:hover {
  opacity: 0.82;
  transform: translateY(-1px);
}

.member-id-row {
  gap: 7px;
  margin-top: 9px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.member-id-row code {
  color: var(--el-text-color-regular);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  letter-spacing: 0.02em;
}

.member-id-label {
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

.identity-meta {
  flex-wrap: wrap;
  gap: 0;
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.identity-meta span:not(:last-child)::after {
  margin: 0 8px;
  color: var(--el-border-color);
  content: '·';
}

.identity-actions {
  flex: none;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: 480px;
}

.identity-actions .el-button {
  margin-left: 0;
}

.more-caret {
  margin-left: 3px;
  font-size: 10px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 12px;
}

.kpi-card {
  min-width: 0;
  padding: 16px 17px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.kpi-card--warning {
  border-color: var(--el-color-warning-light-5);
  background: linear-gradient(180deg, var(--el-color-warning-light-9), var(--el-bg-color) 70%);
}

.kpi-card--vip {
  grid-column: span 2;
}

.kpi-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.kpi-value {
  overflow: hidden;
  margin-top: 8px;
  color: var(--el-text-color-primary);
  font-size: clamp(20px, 2vw, 25px);
  font-weight: 750;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-value small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 500;
}

.kpi-value--turnover {
  font-size: clamp(17px, 1.7vw, 21px);
}

.kpi-note {
  overflow: hidden;
  margin-top: 7px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.45;
  text-overflow: ellipsis;
}

.kpi-warning {
  flex: none;
  padding: 2px 6px;
  border-radius: 999px;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-8);
  font-size: 10px;
}

.vip-progress {
  margin-top: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.info-card,
.remark-card {
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.info-card__header {
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-card__header h3,
.remark-card__header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: grid;
  grid-template-columns: 105px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 42px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  font-size: 13px;
}

.info-row:last-child {
  border-bottom: 0;
}

.info-row > span {
  color: var(--el-text-color-secondary);
}

.info-row > strong {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-weight: 600;
  text-align: right;
}

.info-row > strong small {
  margin-left: 5px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-weight: 400;
}

.info-row--stack {
  align-items: flex-start;
  padding: 10px 0;
}

.inline-value,
.device-value {
  justify-content: flex-end;
  gap: 6px;
}

.inline-value .el-button,
.device-value .el-button {
  margin-left: 0;
}

.device-value {
  min-width: 0;
}

.device-value code {
  overflow: hidden;
  max-width: 100%;
  color: var(--el-text-color-regular);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remark-card__header {
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.remark-card__header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.remark-actions {
  justify-content: space-between;
  gap: 16px;
  margin-top: 10px;
}

.remark-actions > span {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.dialog-member-tip {
  margin-bottom: 14px;
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  font-size: 12px;
}

.tag-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 14px;
}

.tag-option-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 50%;
  vertical-align: 1px;
}

.withdraw-plain-value,
.withdraw-masked-value {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.withdraw-plain-value code,
.withdraw-masked-value code {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

.withdraw-plain-value .el-button,
.withdraw-masked-value .el-button {
  margin-left: 0;
}

.withdraw-history-tip {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

@media (width <= 1100px) {
  .identity-card {
    flex-direction: column;
  }

  .identity-actions {
    justify-content: flex-start;
    max-width: none;
  }

  .kpi-card--vip {
    grid-column: span 1;
  }
}

@media (width <= 760px) {
  .identity-card {
    padding: 18px;
  }

  .identity-title-row h2 {
    font-size: 23px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-row {
    grid-template-columns: 92px minmax(0, 1fr);
  }

  .remark-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .tag-selector {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { teacherApi } from '@/api/services'
import { formatDateTime } from '@/utils/format'
import {
  APPEAL_STATUS_OPTIONS,
  GRADING_MODE_OPTIONS,
  labelBy,
  typeBy,
} from '@/constants/enums'
import JsonPreview from '@/components/JsonPreview.vue'
import AttemptQuestionReview from '@/components/AttemptQuestionReview.vue'

const reviewLoading = ref(false)
const reviewList = ref([])
const reviewPage = ref(1)
const reviewSize = ref(10)
const reviewTotal = ref(0)
const reviewQuery = reactive({
  assignmentId: '',
  needsReview: true,
})

const evidenceVisible = ref(false)
const evidenceLoading = ref(false)
const evidence = ref(null)

const gradeVisible = ref(false)
const gradeLoading = ref(false)
const gradeForm = reactive({
  answerId: undefined,
  score: 0,
  comment: '',
})

const appealLoading = ref(false)
const appealList = ref([])
const appealPage = ref(1)
const appealSize = ref(10)
const appealTotal = ref(0)
const appealStatus = ref(undefined)

const handleVisible = ref(false)
const handleLoading = ref(false)
const handleEvidenceLoading = ref(false)
const currentAppeal = ref(null)
const handleEvidence = ref(null)
const handleForm = reactive({
  appealId: undefined,
  action: 'approve',
  finalScore: undefined,
  decisionComment: '',
})

function toOptionalId(value) {
  const number = Number(value)
  if (!number || Number.isNaN(number) || number < 1) {
    return undefined
  }
  return number
}

function appealStatusText(value) {
  return labelBy(APPEAL_STATUS_OPTIONS, value, '未知')
}

async function loadReviews() {
  reviewLoading.value = true
  try {
    const data = await teacherApi.reviewAnswers({
      assignmentId: toOptionalId(reviewQuery.assignmentId),
      needsReview: reviewQuery.needsReview,
      page: reviewPage.value,
      size: reviewSize.value,
    })
    reviewList.value = data.list || []
    reviewTotal.value = data.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载待复核列表失败')
  } finally {
    reviewLoading.value = false
  }
}

async function openEvidence(answerId) {
  evidenceVisible.value = true
  evidenceLoading.value = true
  evidence.value = null
  try {
    evidence.value = await teacherApi.answerEvidence(answerId)
  } catch (error) {
    ElMessage.error(error.message || '加载作答详情失败')
  } finally {
    evidenceLoading.value = false
  }
}

function openGrade(answerId, currentScore = 0) {
  gradeForm.answerId = answerId
  gradeForm.score = currentScore || 0
  gradeForm.comment = ''
  gradeVisible.value = true
}

async function submitGrade() {
  gradeLoading.value = true
  try {
    await teacherApi.manualGrade(gradeForm.answerId, {
      score: gradeForm.score,
      comment: gradeForm.comment,
    })
    ElMessage.success('人工评分已提交')
    gradeVisible.value = false
    await loadReviews()
  } catch (error) {
    ElMessage.error(error.message || '评分失败')
  } finally {
    gradeLoading.value = false
  }
}

async function llmRetry(answerId) {
  try {
    const res = await teacherApi.llmRetry(answerId, { times: 1 })
    const ids = res?.llmCallIds || []
    ElMessage.success(`已触发重试，调用次数：${ids.length}`)
    await loadReviews()
  } catch (error) {
    ElMessage.error(error.message || '重试失败')
  }
}

async function loadAppeals() {
  appealLoading.value = true
  try {
    const data = await teacherApi.appeals({
      status: appealStatus.value,
      page: appealPage.value,
      size: appealSize.value,
    })
    appealList.value = data.list || []
    appealTotal.value = data.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载申诉列表失败')
  } finally {
    appealLoading.value = false
  }
}

async function openHandleAppeal(row) {
  currentAppeal.value = row
  handleForm.appealId = row.appealId
  handleForm.action = 'approve'
  handleForm.finalScore = undefined
  handleForm.decisionComment = ''
  handleEvidence.value = null
  handleVisible.value = true
  handleEvidenceLoading.value = true
  try {
    handleEvidence.value = await teacherApi.answerEvidence(row.answerId)
  } catch (error) {
    ElMessage.error(error.message || '加载题目详情失败')
  } finally {
    handleEvidenceLoading.value = false
  }
}

async function submitHandleAppeal() {
  handleLoading.value = true
  try {
    await teacherApi.handleAppeal(handleForm.appealId, {
      action: handleForm.action,
      finalScore: handleForm.finalScore,
      decisionComment: handleForm.decisionComment,
    })
    ElMessage.success('申诉处理成功')
    handleVisible.value = false
    await loadAppeals()
    await loadReviews()
  } catch (error) {
    ElMessage.error(error.message || '处理失败')
  } finally {
    handleLoading.value = false
  }
}

onMounted(() => {
  loadReviews()
  loadAppeals()
})
</script>

<template>
  <el-tabs>
    <el-tab-pane label="待复核答卷">
      <el-card class="page-card">
        <div class="page-toolbar">
          <el-input v-model="reviewQuery.assignmentId" clearable placeholder="作业ID" style="width: 180px" />
          <el-select v-model="reviewQuery.needsReview" style="width: 150px">
            <el-option :value="true" label="仅看待复核" />
            <el-option :value="false" label="查看全部" />
          </el-select>
          <el-button type="primary" @click="reviewPage = 1; loadReviews()">查询</el-button>
          <el-button @click="reviewQuery.assignmentId = ''; reviewQuery.needsReview = true; reviewPage = 1; loadReviews()">重置</el-button>
        </div>

        <el-table :data="reviewList" border v-loading="reviewLoading">
          <el-table-column prop="answerId" label="答案ID" width="90" />
          <el-table-column prop="attemptId" label="作答ID" width="90" />
          <el-table-column prop="studentId" label="学生ID" width="90" />
          <el-table-column prop="questionId" label="题目ID" width="90" />
          <el-table-column prop="questionType" label="题型" width="90" />
          <el-table-column prop="score" label="满分" width="70" />
          <el-table-column prop="currentFinalScore" label="当前分" width="90" />
          <el-table-column label="需复核" width="90">
            <template #default="{ row }">
              <el-tag :type="row.needsReview ? 'warning' : 'success'">{{ row.needsReview ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEvidence(row.answerId)">查看详情</el-button>
              <el-button link type="success" @click="openGrade(row.answerId, row.currentFinalScore)">评分</el-button>
              <el-button link type="warning" @click="llmRetry(row.answerId)">大模型重试</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="table-pager"
          background
          layout="total, sizes, prev, pager, next"
          :current-page="reviewPage"
          :page-size="reviewSize"
          :page-sizes="[10, 20, 50]"
          :total="reviewTotal"
          @size-change="(v) => { reviewSize = v; reviewPage = 1; loadReviews() }"
          @current-change="(v) => { reviewPage = v; loadReviews() }"
        />
      </el-card>
    </el-tab-pane>

    <el-tab-pane label="申诉处理">
      <el-card class="page-card">
        <div class="page-toolbar">
          <el-select v-model="appealStatus" clearable style="width: 180px" placeholder="申诉状态">
            <el-option
              v-for="opt in APPEAL_STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-button type="primary" @click="appealPage = 1; loadAppeals()">查询</el-button>
          <el-button @click="appealStatus = undefined; appealPage = 1; loadAppeals()">重置</el-button>
        </div>

        <el-table :data="appealList" border v-loading="appealLoading">
          <el-table-column prop="appealId" label="申诉ID" width="90" />
          <el-table-column prop="assignmentId" label="作业ID" width="90" />
          <el-table-column prop="assignmentTitle" label="作业标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="answerId" label="答案ID" width="90" />
          <el-table-column prop="studentId" label="学生ID" width="90" />
          <el-table-column prop="reasonText" label="申诉理由" min-width="240" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="typeBy(APPEAL_STATUS_OPTIONS, row.appealStatus)">
                {{ labelBy(APPEAL_STATUS_OPTIONS, row.appealStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openHandleAppeal(row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="table-pager"
          background
          layout="total, sizes, prev, pager, next"
          :current-page="appealPage"
          :page-size="appealSize"
          :page-sizes="[10, 20, 50]"
          :total="appealTotal"
          @size-change="(v) => { appealSize = v; appealPage = 1; loadAppeals() }"
          @current-change="(v) => { appealPage = v; loadAppeals() }"
        />
      </el-card>
    </el-tab-pane>
  </el-tabs>

  <el-drawer v-model="evidenceVisible" title="作答详情" size="82%">
    <div v-loading="evidenceLoading" class="drawer-stack">
      <el-card class="page-card">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="答案ID">{{ evidence?.answerId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学生">
            {{ evidence?.student?.displayName || '-' }} ({{ evidence?.student?.id || '-' }})
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <AttemptQuestionReview
        v-if="evidence"
        :snapshot="evidence.questionSnapshot"
        :student-answer="evidence.studentAnswer"
      />

      <el-card class="page-card">
        <h3 class="card-title">评分记录</h3>
        <el-empty v-if="!(evidence?.gradingRecords || []).length" description="暂无评分记录" />
        <div v-for="(record, idx) in evidence?.gradingRecords || []" :key="idx" class="record-item">
          <p class="muted">
            模式：{{ labelBy(GRADING_MODE_OPTIONS, record.gradingMode) }} |
            分数：{{ record.score ?? '-' }} |
            置信度：{{ record.confidence ?? '-' }} |
            需复核：{{ record.needsReview ? '是' : '否' }}
          </p>
          <JsonPreview :data="record.detailJson" max-height="140px" />
          <p class="muted">评语：{{ record.reviewComment || '-' }}</p>
          <el-collapse v-if="record.llmCall">
            <el-collapse-item title="大模型调用详情">
              <p class="muted">调用ID：{{ record.llmCall.llmCallId }} | 模型：{{ record.llmCall.modelName }}</p>
              <JsonPreview :data="record.llmCall.promptText" max-height="140px" />
              <JsonPreview :data="record.llmCall.responseText" max-height="140px" />
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-card>
    </div>
  </el-drawer>

  <el-dialog v-model="gradeVisible" title="人工评分" width="520px">
    <el-form label-width="90px">
      <el-form-item label="答案ID">
        <el-input v-model="gradeForm.answerId" disabled />
      </el-form-item>
      <el-form-item label="分数">
        <el-input-number v-model="gradeForm.score" :min="0" />
      </el-form-item>
      <el-form-item label="评语">
        <el-input v-model="gradeForm.comment" type="textarea" :rows="4" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="gradeVisible = false">取消</el-button>
      <el-button type="primary" :loading="gradeLoading" @click="submitGrade">提交评分</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="handleVisible" title="处理申诉" width="88%" top="4vh" destroy-on-close>
    <div class="dialog-stack" v-loading="handleEvidenceLoading">
      <el-card class="page-card" v-if="currentAppeal">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申诉ID">{{ currentAppeal.appealId }}</el-descriptions-item>
          <el-descriptions-item label="答案ID">{{ currentAppeal.answerId }}</el-descriptions-item>
          <el-descriptions-item label="作业">
            #{{ currentAppeal.assignmentId }} {{ currentAppeal.assignmentTitle || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="学生ID">{{ currentAppeal.studentId }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ appealStatusText(currentAppeal.appealStatus) }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDateTime(currentAppeal.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="申诉理由" :span="2">{{ currentAppeal.reasonText || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <AttemptQuestionReview
        v-if="handleEvidence"
        :snapshot="handleEvidence.questionSnapshot"
        :student-answer="handleEvidence.studentAnswer"
      />

      <el-card class="page-card" v-if="(handleEvidence?.gradingRecords || []).length">
        <h3 class="card-title">已有评分记录</h3>
        <div v-for="(record, idx) in handleEvidence.gradingRecords || []" :key="idx" class="record-item">
          <p class="muted">
            模式：{{ labelBy(GRADING_MODE_OPTIONS, record.gradingMode) }} |
            分数：{{ record.score ?? '-' }} |
            置信度：{{ record.confidence ?? '-' }} |
            需复核：{{ record.needsReview ? '是' : '否' }}
          </p>
          <JsonPreview :data="record.detailJson" max-height="140px" />
          <p class="muted">评语：{{ record.reviewComment || '-' }}</p>
        </div>
      </el-card>

      <el-card class="page-card">
        <h3 class="card-title">处理结果</h3>
        <el-form label-width="100px">
          <el-form-item label="处理动作">
            <el-radio-group v-model="handleForm.action">
              <el-radio-button label="approve">通过</el-radio-button>
              <el-radio-button label="reject">驳回</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="最终分数">
            <el-input-number v-model="handleForm.finalScore" :min="0" />
          </el-form-item>
          <el-form-item label="处理说明">
            <el-input v-model="handleForm.decisionComment" type="textarea" :rows="5" />
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <template #footer>
      <el-button @click="handleVisible = false">取消</el-button>
      <el-button type="primary" :loading="handleLoading" @click="submitHandleAppeal">提交处理</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.table-pager {
  margin-top: 12px;
  justify-content: flex-end;
}

.drawer-stack,
.dialog-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-item {
  border: 1px solid #d9e4ef;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}
</style>

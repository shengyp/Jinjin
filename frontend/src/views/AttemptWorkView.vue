<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { answerApi, attemptApi } from '@/api/services'
import { formatDateTime, parseJsonSafe } from '@/utils/format'
import { QUESTION_TYPE_OPTIONS, labelBy } from '@/constants/enums'

const route = useRoute()
const router = useRouter()
const attemptId = computed(() => Number(route.params.attemptId))

const loading = ref(false)
const actionLoading = ref(false)
const questions = ref([])
const currentIndex = ref(0)

const answerInput = ref('')
const multiAnswer = ref([])
const syncingEditor = ref(false)
const assistantQuestion = ref('')
const assistantHint = ref('')
const assistantSources = ref([])
const assistantLoading = ref(false)

const deadlineAt = ref('')
const remainingSec = ref(null)
const autoSubmitting = ref(false)
let countdownTimer = null

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const currentSnapshot = computed(() => parseJsonSafe(currentQuestion.value?.snapshotJson, {}) || {})
const currentQuestionType = computed(() => Number(currentSnapshot.value.questionType || 0))
const currentOptions = computed(() => {
  const raw = Array.isArray(currentSnapshot.value.options) ? currentSnapshot.value.options : []
  if (!raw.length && currentQuestionType.value === 3) {
    return createTrueFalseOptions()
  }
  return [...raw]
})

const isSingleChoice = computed(() => [1, 3].includes(currentQuestionType.value))
const isMultiChoice = computed(() => currentQuestionType.value === 2)
const deadlineText = computed(() => (deadlineAt.value ? formatDateTime(deadlineAt.value) : '不限时'))
const remainingText = computed(() => formatRemain(remainingSec.value))

function syncEditorFromCurrent() {
  syncingEditor.value = true
  const value = currentQuestion.value?.answerContent || ''
  if (isMultiChoice.value) {
    multiAnswer.value = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    answerInput.value = ''
  } else {
    answerInput.value = value
    multiAnswer.value = []
  }
  nextTick(() => {
    syncingEditor.value = false
  })
}

function syncCurrentQuestionFromEditor() {
  if (syncingEditor.value || !currentQuestion.value) {
    return
  }
  currentQuestion.value.answerContent = buildAnswerContent()
}

watch(currentQuestion, () => {
  syncEditorFromCurrent()
  assistantQuestion.value = ''
  assistantHint.value = ''
  assistantSources.value = []
})

watch(answerInput, () => {
  syncCurrentQuestionFromEditor()
})

watch(
  multiAnswer,
  () => {
    syncCurrentQuestionFromEditor()
  },
  { deep: true },
)

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function formatRemain(value) {
  if (value == null) {
    return '不限时'
  }
  const safe = Math.max(Number(value) || 0, 0)
  const hours = String(Math.floor(safe / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0')
  const seconds = String(safe % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function deadlineTimestamp(value) {
  if (!value) {
    return NaN
  }
  return new Date(String(value).replace(' ', 'T')).getTime()
}

function refreshCountdown() {
  if (!deadlineAt.value) {
    remainingSec.value = null
    return
  }
  const diffMs = deadlineTimestamp(deadlineAt.value) - Date.now()
  remainingSec.value = Math.max(Math.floor(diffMs / 1000), 0)
  if (!autoSubmitting.value && remainingSec.value <= 3) {
    autoSubmitting.value = true
    submitWholeAttempt({ auto: true })
  }
}

function initCountdown() {
  stopCountdown()
  const meta = questions.value[0] || {}
  deadlineAt.value = meta.deadlineAt || ''
  remainingSec.value = meta.remainingSec ?? null
  autoSubmitting.value = false
  if (!deadlineAt.value) {
    return
  }
  refreshCountdown()
  countdownTimer = setInterval(refreshCountdown, 1000)
}

function answerStatusText(code) {
  if (code === 2) return '已提交'
  return '草稿'
}

function buildAnswerContent() {
  if (isMultiChoice.value) {
    return multiAnswer.value.join(',')
  }
  return answerInput.value || ''
}

function createTrueFalseOptions() {
  return [
    { optionLabel: '对', optionContent: '对' },
    { optionLabel: '错', optionContent: '错' },
  ]
}

function optionDisplayText(option) {
  if (currentQuestionType.value === 3) {
    return option.optionContent || option.optionLabel
  }
  const label = option.optionLabel || ''
  const content = option.optionContent || ''
  return label ? `${label}. ${content}` : content
}

async function loadQuestions() {
  loading.value = true
  try {
    const data = await attemptApi.questions(attemptId.value)
    questions.value = data || []
    if (questions.value.length === 0) {
      ElMessage.warning('该作答没有题目')
      return
    }
    currentIndex.value = 0
    syncEditorFromCurrent()
    initCountdown()
  } catch (error) {
    if (error?.code === 'CONFLICT' || /自动提交/.test(error?.message || '')) {
      ElMessage.warning(error.message || '作答已自动提交，请到作答记录查看结果')
      router.replace('/attempts/history')
      return
    }
    ElMessage.error(error.message || '加载题目失败')
  } finally {
    loading.value = false
  }
}

function jumpTo(index) {
  if (index < 0 || index >= questions.value.length) return
  syncCurrentQuestionFromEditor()
  currentIndex.value = index
}

async function saveAllDrafts(options = {}) {
  syncCurrentQuestionFromEditor()
  const draftQuestions = questions.value.filter((item) => item?.answerId)
  if (!draftQuestions.length) {
    if (!options.silent) {
      ElMessage.warning('当前作答没有可保存的题目')
    }
    return
  }
  actionLoading.value = true
  try {
    await Promise.all(
      draftQuestions.map((item) => answerApi.saveDraft(item.answerId, item.answerContent || '')),
    )
    draftQuestions.forEach((item) => {
      item.answerStatus = 1
    })
    if (!options.silent) {
      ElMessage.success('草稿已保存')
    }
  } catch (error) {
    if (!options.silent && !options.ignoreError) {
      ElMessage.error(error.message || '保存失败')
    }
    if (!options.ignoreError) {
      throw error
    }
  } finally {
    actionLoading.value = false
  }
}

async function submitWholeAttempt(options = {}) {
  const auto = Boolean(options.auto)
  if (actionLoading.value) {
    return
  }
  try {
    if (!auto) {
      await ElMessageBox.confirm('确认提交整份作答？提交后不可修改。', '提交确认', { type: 'warning' })
    }
    await saveAllDrafts({ silent: true, ignoreError: auto })
    actionLoading.value = true
    await attemptApi.submit(attemptId.value)
    stopCountdown()
    ElMessage.success(auto ? '已到截止时间，系统已自动提交' : '整份作答提交成功，请等待系统批改后到作答记录查看成绩')
    router.replace('/attempts/history')
  } catch (error) {
    if (error?.code === 'TIMEOUT') {
      stopCountdown()
      ElMessage.success(auto ? '系统正在自动提交，请稍后到作答记录查看成绩' : '作答已提交，系统正在批改中，请稍后到作答记录查看成绩')
      router.replace('/attempts/history')
      return
    }
    if (auto && (error?.code === 'CONFLICT' || /自动提交/.test(error?.message || ''))) {
      stopCountdown()
      router.replace('/attempts/history')
      return
    }
    if (error !== 'cancel') {
      ElMessage.error(error.message || '提交失败')
    }
  } finally {
    actionLoading.value = false
  }
}

async function askAssistant() {
  if (!currentQuestion.value) {
    return
  }
  syncCurrentQuestionFromEditor()
  assistantLoading.value = true
  assistantHint.value = ''
  assistantSources.value = []
  try {
    const data = await attemptApi.hint(attemptId.value, currentQuestion.value.attemptQuestionId, {
      question: assistantQuestion.value,
      currentAnswer: currentQuestion.value.answerContent || '',
    })
    assistantHint.value = data?.hint || '暂时没有生成提示。'
    assistantSources.value = data?.contextSources || []
  } catch (error) {
    ElMessage.error(error.message || 'AI 提示生成失败')
  } finally {
    assistantLoading.value = false
  }
}

onMounted(loadQuestions)
onUnmounted(stopCountdown)
</script>

<template>
  <div class="attempt-root">
    <el-card class="page-card nav-card">
      <h3 class="card-title">题目导航</h3>
      <div class="question-nav">
        <el-tag
          v-for="(item, idx) in questions"
          :key="item.attemptQuestionId"
          :effect="idx === currentIndex ? 'dark' : 'plain'"
          :type="item.answerStatus === 2 ? 'success' : 'info'"
          class="nav-tag"
          @click="jumpTo(idx)"
        >
          {{ idx + 1 }}. {{ answerStatusText(item.answerStatus) }}
        </el-tag>
      </div>
    </el-card>

    <el-card class="page-card" v-loading="loading">
      <template v-if="currentQuestion">
        <div class="attempt-head">
          <div>
            <h3 class="card-title">
              第 {{ currentIndex + 1 }} 题
              <el-tag type="warning" effect="plain" style="margin-left: 8px;">
                {{ labelBy(QUESTION_TYPE_OPTIONS, currentQuestionType, '未知题型') }}
              </el-tag>
              <el-tag type="success" effect="plain" style="margin-left: 8px;">
                分值 {{ currentQuestion.score || 0 }}
              </el-tag>
            </h3>
            <p class="attempt-meta">
              截止时间：{{ deadlineText }}
              <span v-if="remainingSec !== null"> | 剩余时间：{{ remainingText }}</span>
            </p>
          </div>
          <el-tag v-if="remainingSec !== null" :type="remainingSec <= 180 ? 'danger' : 'primary'" size="large">
            {{ remainingText }}
          </el-tag>
        </div>

        <el-alert
          v-if="remainingSec !== null"
          :title="autoSubmitting ? '剩余时间过短，系统正在自动提交' : '达到截止时间后系统会自动提交，超时后不能继续作答。'"
          :type="remainingSec <= 180 ? 'warning' : 'info'"
          :closable="false"
          style="margin-bottom: 14px"
        />

        <p class="question-stem">{{ currentSnapshot.stem || '-' }}</p>

        <template v-if="isSingleChoice">
          <el-radio-group v-model="answerInput" class="vertical-options">
            <el-radio
              v-for="opt in currentOptions"
              :key="opt.optionLabel"
              :label="opt.optionLabel"
            >
              {{ optionDisplayText(opt) }}
            </el-radio>
          </el-radio-group>
        </template>

        <template v-else-if="isMultiChoice">
          <el-checkbox-group v-model="multiAnswer" class="vertical-options">
            <el-checkbox
              v-for="opt in currentOptions"
              :key="opt.optionLabel"
              :label="opt.optionLabel"
            >
              {{ optionDisplayText(opt) }}
            </el-checkbox>
          </el-checkbox-group>
        </template>

        <template v-else>
          <el-input
            v-model="answerInput"
            type="textarea"
            :rows="8"
            placeholder="请输入你的答案"
          />
        </template>

        <el-divider />

        <el-card class="assistant-card" shadow="never">
          <template #header>
            <div class="assistant-head">
              <span>AI 提示助手</span>
              <el-tag type="info" effect="plain">基于本地题库上下文</el-tag>
            </div>
          </template>
          <el-input
            v-model="assistantQuestion"
            type="textarea"
            :rows="3"
            placeholder="可以描述你卡在哪里，例如：这题应该先考虑什么？我的思路哪里可能有问题？"
          />
          <div class="assistant-actions">
            <el-button type="primary" :loading="assistantLoading" @click="askAssistant">
              获取提示
            </el-button>
            <span class="assistant-note">只生成思路提示，不直接给最终答案。</span>
          </div>
          <el-alert
            v-if="assistantHint"
            class="assistant-hint"
            type="success"
            :closable="false"
          >
            <template #title>
              <div class="hint-text">{{ assistantHint }}</div>
            </template>
          </el-alert>
          <div v-if="assistantSources.length" class="assistant-sources">
            <span>检索上下文：</span>
            <el-tag v-for="source in assistantSources" :key="source" size="small" effect="plain">
              {{ source }}
            </el-tag>
          </div>
        </el-card>

        <div class="attempt-actions">
          <el-button :disabled="currentIndex === 0" @click="jumpTo(currentIndex - 1)">上一题</el-button>
          <el-button :disabled="currentIndex >= questions.length - 1" @click="jumpTo(currentIndex + 1)">下一题</el-button>
          <el-button type="info" :loading="actionLoading" @click="saveAllDrafts">保存草稿</el-button>
          <el-button type="success" :loading="actionLoading" @click="submitWholeAttempt()">提交</el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.attempt-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nav-card .card-title {
  margin-bottom: 10px;
}

.question-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nav-tag {
  cursor: pointer;
}

.attempt-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.attempt-meta {
  margin: 6px 0 0;
  color: #627d98;
}

.question-stem {
  margin: 8px 0 12px;
  white-space: pre-wrap;
  line-height: 1.7;
}

.vertical-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.assistant-card {
  margin-bottom: 16px;
  border-color: #d8e8f7;
  background: #fbfdff;
}

.assistant-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.assistant-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.assistant-note {
  color: #627d98;
  font-size: 13px;
}

.assistant-hint {
  margin-top: 12px;
}

.hint-text {
  white-space: pre-wrap;
  line-height: 1.7;
}

.assistant-sources {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
  color: #627d98;
  font-size: 13px;
}

.attempt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

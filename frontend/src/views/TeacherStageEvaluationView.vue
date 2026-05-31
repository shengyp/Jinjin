<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { stageEvaluationApi } from '@/api/services'

const loading = ref(false)
const stage = ref('month')
const studentId = ref('')
const rows = ref([])

const stageOptions = [
  { label: '近 7 天', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本学期', value: 'term' },
]

async function loadRows() {
  loading.value = true
  try {
    rows.value = await stageEvaluationApi.teacherStudents({
      stage: stage.value,
      studentId: studentId.value,
    })
  } catch (error) {
    ElMessage.error(error.message || '加载学生阶段评价失败')
  } finally {
    loading.value = false
  }
}

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`
}

onMounted(loadRows)
</script>

<template>
  <div v-loading="loading" class="teacher-stage-page">
    <section class="toolbar">
      <el-segmented v-model="stage" :options="stageOptions" @change="loadRows" />
      <div class="filters">
        <el-input v-model="studentId" clearable placeholder="学生 ID" />
        <el-button type="primary" @click="loadRows">查询</el-button>
      </div>
    </section>

    <el-alert
      type="info"
      :closable="false"
      title="阶段性学习评价模块框架"
      description="当前页面已接入基础评价结构，后续可把掌握状态超图、阶段目标达成度和学习行为序列算法补入后端服务。"
    />

    <el-card class="page-card">
      <h3 class="card-title">学生阶段评价</h3>
      <el-table :data="rows" border>
        <el-table-column prop="studentName" label="学生" min-width="130" />
        <el-table-column prop="stageName" label="阶段" width="100" />
        <el-table-column prop="overallLevel" label="综合等级" width="100" />
        <el-table-column prop="abilityScore" label="能力值" width="90" />
        <el-table-column prop="completedAttemptCount" label="作答次数" width="100" />
        <el-table-column prop="averageScore" label="平均分" width="90" />
        <el-table-column label="掌握度" width="110">
          <template #default="{ row }">{{ percent(row.masteryAverage) }}</template>
        </el-table-column>
        <el-table-column prop="summary" label="评价摘要" min-width="320" />
      </el-table>
    </el-card>

    <el-card class="page-card">
      <h3 class="card-title">评价维度明细</h3>
      <el-collapse accordion>
        <el-collapse-item v-for="row in rows" :key="row.studentId" :title="`${row.studentName} - ${row.stageName}`">
          <el-table :data="row.dimensions || []" border>
            <el-table-column prop="name" label="维度" width="120" />
            <el-table-column label="得分" width="180">
              <template #default="{ row: dim }">
                <el-progress :percentage="dim.score || 0" />
              </template>
            </el-table-column>
            <el-table-column prop="level" label="等级" width="100" />
            <el-table-column prop="description" label="说明" min-width="280" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<style scoped>
.teacher-stage-page { display: grid; gap: 16px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.filters { display: flex; align-items: center; gap: 8px; }
.filters .el-input { width: 180px; }
</style>

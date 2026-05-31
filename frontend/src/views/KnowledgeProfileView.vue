<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { learningApi } from '@/api/services'

const loading = ref(false)
const profile = ref({ weakPoints: [], mastery: [], recentBehaviors: [] })

async function loadProfile() {
  loading.value = true
  try {
    profile.value = await learningApi.profile()
  } catch (error) {
    ElMessage.error(error.message || '加载知识画像失败')
  } finally {
    loading.value = false
  }
}

function percent(value) {
  return `${Math.round((Number(value || 0)) * 100)}%`
}

onMounted(loadProfile)
</script>

<template>
  <div v-loading="loading" class="profile-page">
    <section class="profile-summary">
      <div class="summary-item">
        <strong>{{ profile.abilityScore ?? 0 }}</strong>
        <span>能力值</span>
      </div>
      <div class="summary-item">
        <strong>{{ profile.behaviorCount ?? 0 }}</strong>
        <span>学习行为</span>
      </div>
      <div class="summary-item">
        <strong>{{ Math.round((profile.studyDurationSeconds || 0) / 60) }}</strong>
        <span>学习分钟</span>
      </div>
    </section>

    <el-alert class="advice" type="success" :closable="false" :title="profile.advice || '完成练习后会生成个性化建议。'" />

    <el-card class="page-card">
      <h3 class="card-title">薄弱知识点</h3>
      <el-table :data="profile.weakPoints || []" border>
        <el-table-column prop="name" label="知识点" min-width="160" />
        <el-table-column prop="tagName" label="关联标签" min-width="140" />
        <el-table-column label="掌握度" width="160">
          <template #default="{ row }">
            <el-progress :percentage="Math.round((row.masteryValue || 0) * 100)" />
          </template>
        </el-table-column>
        <el-table-column prop="attemptCount" label="作答次数" width="100" />
      </el-table>
    </el-card>

    <el-card class="page-card">
      <h3 class="card-title">掌握度明细</h3>
      <el-table :data="profile.mastery || []" border>
        <el-table-column prop="tagName" label="标签" min-width="160" />
        <el-table-column label="掌握度" width="120">
          <template #default="{ row }">{{ percent(row.masteryValue) }}</template>
        </el-table-column>
        <el-table-column prop="correctCount" label="正确次数" width="100" />
        <el-table-column prop="attemptCount" label="作答次数" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.profile-page { display: grid; gap: 16px; }
.profile-summary { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 12px; }
.summary-item { background: #fff; border: 1px solid #e5edf5; border-radius: 8px; padding: 18px; }
.summary-item strong { display: block; font-size: 28px; color: #0b3954; }
.summary-item span { color: #5c748a; }
.advice { border-radius: 8px; }
</style>

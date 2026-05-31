<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Calendar,
  CollectionTag,
  Cpu,
  DataLine,
  Document,
  EditPen,
  Histogram,
  House,
  Management,
  Notebook,
  Reading,
  SwitchButton,
  UserFilled,
  Warning,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const menus = computed(() => {
  const base = [
    { path: '/dashboard', title: '首页', icon: House },

    { path: '/assignments/my', title: '我的作业', icon: Notebook, roles: ['STUDENT'] },
    { path: '/question-bank', title: '题库练习', icon: Reading, roles: ['STUDENT'] },
    { path: '/classes/my', title: '我的班级', icon: UserFilled, roles: ['STUDENT'] },
    { path: '/attempts/history', title: '作答记录', icon: EditPen, roles: ['STUDENT'] },
    { path: '/stats', title: '学习统计', icon: DataLine, roles: ['STUDENT'] },
    { path: '/knowledge-profile', title: '知识画像', icon: DataLine, roles: ['STUDENT'] },
    { path: '/stage-evaluation', title: '阶段评价', icon: Histogram, roles: ['STUDENT'] },
    { path: '/smart-recommendations', title: '智能推荐', icon: Cpu, roles: ['STUDENT'] },
    { path: '/personalized-practice', title: '个性化练习', icon: Reading, roles: ['STUDENT'] },
    { path: '/learning-resources', title: '学习资源', icon: Document, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
    { path: '/appeals/my', title: '我的申诉', icon: Warning, roles: ['STUDENT'] },

    { path: '/questions', title: '题目管理', icon: Reading, roles: ['TEACHER', 'ADMIN'] },
    { path: '/tags', title: '标签管理', icon: CollectionTag, roles: ['ADMIN'] },
    { path: '/papers', title: '试卷管理', icon: Document, roles: ['TEACHER', 'ADMIN'] },
    { path: '/assignments/manage', title: '作业/考试管理', icon: Calendar, roles: ['TEACHER', 'ADMIN'] },
    { path: '/classes/manage', title: '班级管理', icon: UserFilled, roles: ['TEACHER', 'ADMIN'] },
    { path: '/knowledge-points', title: '知识点管理', icon: CollectionTag, roles: ['TEACHER', 'ADMIN'] },
    { path: '/teacher/stage-evaluations', title: '学生阶段评价', icon: Histogram, roles: ['TEACHER', 'ADMIN'] },
    { path: '/knowledge-graph', title: '知识图谱抽取', icon: Cpu, roles: ['ADMIN'] },
    { path: '/teacher/review', title: '复核中心', icon: Management, roles: ['TEACHER', 'ADMIN'] },
    { path: '/llm/calls', title: '大模型调用记录', icon: Cpu, roles: ['TEACHER', 'ADMIN'] },

    { path: '/admin/users', title: '用户管理', icon: UserFilled, roles: ['ADMIN'] },
    { path: '/admin/logs', title: '系统日志', icon: Histogram, roles: ['ADMIN'] },
  ]
  return base.filter((item) => !item.roles || auth.hasAnyRole(item.roles))
})

const activeMenu = computed(() => {
  const m = menus.value.find((item) => route.path.startsWith(item.path))
  return m?.path || '/dashboard'
})

const roleDisplay = computed(() => roleText(auth.role))

function roleTagType(role) {
  const normalized = String(role || '').replace(/^ROLE_/, '').toUpperCase()
  if (normalized === 'ADMIN') return 'danger'
  if (normalized === 'TEACHER') return 'warning'
  return 'success'
}

function roleText(role) {
  const normalized = String(role || '').replace(/^ROLE_/, '').toUpperCase()
  if (normalized === 'ADMIN') return '管理员'
  if (normalized === 'TEACHER') return '教师'
  if (normalized === 'STUDENT') return '学生'
  return '未知角色'
}

async function handleLogout() {
  await auth.logout()
  router.replace('/login')
}
</script>

<template>
  <el-container class="layout-root">
    <el-aside width="240px" class="layout-aside">
      <div class="brand">
        <div class="brand-mark">题库</div>
        <div class="brand-text">
          <div>智能学习题库系统</div>
          <small>题库 + 知识画像</small>
        </div>
      </div>
      <el-menu :default-active="activeMenu" class="layout-menu" router>
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <h2>{{ route.meta?.title || '题库系统' }}</h2>
          <p>{{ roleDisplay }}</p>
        </div>
        <div class="header-right">
          <el-tag :type="roleTagType(auth.role)" effect="dark" round>{{ roleText(auth.role) }}</el-tag>
          <span class="welcome">{{ auth.displayName }}</span>
          <el-button type="danger" plain :icon="SwitchButton" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-root {
  min-height: 100vh;
  background: var(--app-bg);
}

.layout-aside {
  border-right: 1px solid var(--app-border);
  background:
    linear-gradient(135deg, rgba(79, 143, 123, 0.1) 0 12%, transparent 12% 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 250, 248, 0.94)),
    rgba(250, 252, 251, 0.94);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.layout-aside::after {
  content: '';
  position: absolute;
  inset: auto 14px 18px;
  height: 84px;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(79, 143, 123, 0.18) 1px, transparent 1px),
    linear-gradient(180deg, rgba(138, 167, 194, 0.14) 1px, transparent 1px);
  background-size: 14px 14px;
  mask-image: linear-gradient(180deg, transparent, #000 36%, transparent);
  opacity: 0.48;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 16px;
  position: relative;
  z-index: 1;
}

.brand::after {
  content: '';
  position: absolute;
  right: 16px;
  bottom: 0;
  left: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--app-border), transparent);
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent 48%),
    var(--app-primary);
  color: #fff;
  display: grid;
  place-content: center;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(79, 143, 123, 0.22);
}

.brand-text {
  font-weight: 700;
  color: var(--app-text);
}

.brand-text small {
  display: block;
  color: var(--app-text-soft);
  font-weight: 500;
  font-size: 12px;
}

.layout-menu {
  border-right: none;
  background: transparent;
  padding: 4px 10px 16px;
  position: relative;
  z-index: 1;
}

.layout-menu :deep(.el-menu-item) {
  height: 42px;
  margin: 4px 0;
  border-radius: 8px;
  color: #516660;
}

.layout-menu :deep(.el-menu-item:hover) {
  background: #f0f6f3;
  color: var(--app-primary-dark);
}

.layout-menu :deep(.el-menu-item.is-active) {
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  font-weight: 700;
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.layout-header {
  min-height: 74px;
  background:
    linear-gradient(90deg, rgba(79, 143, 123, 0.08), transparent 38%, rgba(215, 185, 140, 0.09)),
    rgba(255, 255, 255, 0.9);
  color: var(--app-text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  gap: 16px;
  border-bottom: 1px solid var(--app-border);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 3;
}

.layout-header::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, var(--app-primary), var(--app-accent), var(--app-warm));
  opacity: 0.76;
}

.header-left h2 {
  margin: 0;
  font-size: 21px;
  line-height: 1.2;
}

.header-left p {
  margin: 4px 0 0;
  color: var(--app-text-soft);
  font-size: 13px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.welcome {
  font-size: 14px;
  padding: 0 4px;
  color: #465b54;
}

.layout-main {
  background:
    linear-gradient(120deg, rgba(79, 143, 123, 0.07), transparent 34%),
    linear-gradient(180deg, rgba(233, 243, 239, 0.55), rgba(250, 252, 251, 0.85) 240px),
    var(--app-bg);
  padding: 18px;
}

@media (max-width: 900px) {
  .layout-root {
    display: block;
  }

  .layout-aside {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid var(--app-border);
  }

  .layout-menu {
    display: flex;
    overflow-x: auto;
    padding: 0 10px 10px;
  }

  .layout-menu :deep(.el-menu-item) {
    flex: 0 0 auto;
  }

  .layout-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    flex-wrap: wrap;
  }
}
</style>


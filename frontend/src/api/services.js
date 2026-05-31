import { request } from './http'

function clean(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

function send(method, url, options = {}) {
  return request({
    url,
    method,
    ...options,
  })
}

function get(url, params, options = {}) {
  return send('get', url, {
    ...(params === undefined ? {} : { params }),
    ...options,
  })
}

function query(url, params, options = {}) {
  return get(url, clean(params), options)
}

function post(url, data, options = {}) {
  return send('post', url, {
    ...(data === undefined ? {} : { data }),
    ...options,
  })
}

function put(url, data, options = {}) {
  return send('put', url, {
    ...(data === undefined ? {} : { data }),
    ...options,
  })
}

function del(url, options = {}) {
  return send('delete', url, options)
}

export const authApi = {
  register(payload) {
    return post('/api/register', payload)
  },
  login(payload) {
    return post('/api/login', payload)
  },
  logout() {
    return post('/api/logout')
  },
  me() {
    return get('/api/auth/me')
  },
}

export const tagApi = {
  list(keyword) {
    return query('/api/tags', { keyword })
  },
  tree() {
    return get('/api/tags/tree')
  },
  create(payload) {
    return post('/api/tags', payload)
  },
  update(tagId, payload) {
    return put(`/api/tags/${tagId}`, payload)
  },
  remove(tagId) {
    return del(`/api/tags/${tagId}`)
  },
}

export const questionApi = {
  search(params) {
    return query('/api/questions', params)
  },
  detail(questionId) {
    return get(`/api/questions/${questionId}`)
  },
  create(payload) {
    return post('/api/questions', payload)
  },
  update(questionId, payload) {
    return put(`/api/questions/${questionId}`, payload)
  },
  remove(questionId) {
    return del(`/api/questions/${questionId}`)
  },
  publish(questionId) {
    return post(`/api/questions/${questionId}/publish`)
  },
  submitBankReview(questionId) {
    return post(`/api/questions/${questionId}/bank-review/submit`)
  },
  cancelBankReview(questionId) {
    return post(`/api/questions/${questionId}/bank-review/cancel`)
  },
  reviewBankQuestion(questionId, payload) {
    return post(`/api/questions/${questionId}/bank-review`, payload)
  },
  generateLlmAnalysis(questionId, payload = {}) {
    return post(`/api/questions/${questionId}/analysis/llm`, payload, { timeout: 8000 })
  },
}

export const paperApi = {
  page(page = 1, size = 20) {
    return get('/api/papers', { page, size })
  },
  detail(paperId) {
    return get(`/api/papers/${paperId}`)
  },
  create(payload) {
    return post('/api/papers', payload)
  },
  update(paperId, payload) {
    return put(`/api/papers/${paperId}`, payload)
  },
  remove(paperId) {
    return del(`/api/papers/${paperId}`)
  },
  addQuestion(paperId, payload) {
    return post(`/api/papers/${paperId}/questions`, payload)
  },
  batchUpdateQuestions(paperId, payload) {
    return put(`/api/papers/${paperId}/questions/batch`, payload)
  },
  updatePaperQuestion(paperQuestionId, payload) {
    return put(`/api/papers/questions/${paperQuestionId}`, payload)
  },
  removePaperQuestion(paperQuestionId) {
    return del(`/api/papers/questions/${paperQuestionId}`)
  },
}

export const assignmentApi = {
  page(page = 1, size = 20, keyword) {
    return query('/api/assignments', { page, size, keyword })
  },
  my(status, page = 1, size = 10) {
    return query('/api/assignments/my', { status, page, size })
  },
  detail(assignmentId) {
    return get(`/api/assignments/${assignmentId}`)
  },
  create(payload) {
    return post('/api/assignments', payload)
  },
  update(assignmentId, payload) {
    return put(`/api/assignments/${assignmentId}`, payload)
  },
  remove(assignmentId) {
    return del(`/api/assignments/${assignmentId}`)
  },
  publish(assignmentId) {
    return post(`/api/assignments/${assignmentId}/publish`)
  },
  close(assignmentId) {
    return post(`/api/assignments/${assignmentId}/close`)
  },
  setTargets(assignmentId, payload) {
    return put(`/api/assignments/${assignmentId}/targets`, payload)
  },
}

export const classApi = {
  create(payload) {
    return post('/api/classes', payload)
  },
  mine() {
    return get('/api/classes/mine')
  },
  update(classId, payload) {
    return put(`/api/classes/${classId}`, payload)
  },
  remove(classId) {
    return del(`/api/classes/${classId}`)
  },
  teacherOptions() {
    return get('/api/classes/teachers')
  },
  students(classId) {
    return get(`/api/classes/${classId}/students`)
  },
  kickStudent(classId, studentId) {
    return del(`/api/classes/${classId}/students/${studentId}`)
  },
  join(classCode) {
    return post('/api/classes/join', { classCode })
  },
  my() {
    return get('/api/classes/my')
  },
}

export const attemptApi = {
  startAssignment(assignmentId) {
    return post(`/api/attempts/assignment/${assignmentId}/start`)
  },
  startPractice(payload) {
    return post('/api/attempts/practice/start', payload)
  },
  questions(attemptId) {
    return get(`/api/attempts/${attemptId}/questions`)
  },
  hint(attemptId, attemptQuestionId, payload) {
    return post(`/api/attempts/${attemptId}/questions/${attemptQuestionId}/hint`, payload, { timeout: 120000 })
  },
  submit(attemptId) {
    return post(`/api/attempts/${attemptId}/submit`, undefined, { timeout: 8000 })
  },
  result(attemptId) {
    return get(`/api/attempts/${attemptId}/result`)
  },
  my(attemptType, page = 1, size = 20) {
    return query('/api/attempts/my', { attemptType, page, size })
  },
}

export const answerApi = {
  saveDraft(answerId, answerContent) {
    return put(`/api/answers/${answerId}/draft`, { answerContent })
  },
  submit(answerId, answerContent) {
    return put(`/api/answers/${answerId}/submit`, { answerContent })
  },
}

export const statsApi = {
  wrongQuestions(params) {
    return query('/api/stats/wrong-questions', params)
  },
  resolveWrongQuestion(questionId) {
    return post(`/api/stats/wrong-questions/${questionId}/resolve`)
  },
  mastery(tagType = 1) {
    return get('/api/stats/mastery', { tagType })
  },
  ability() {
    return get('/api/stats/ability')
  },
  questionStats(params) {
    return query('/api/stats/question-stats', params)
  },
}

export const appealApi = {
  create(payload) {
    return post('/api/appeals', payload)
  },
  my(params) {
    return query('/api/appeals/my', params)
  },
}

export const teacherApi = {
  reviewAnswers(params) {
    return query('/api/teacher/review/answers', params)
  },
  answerEvidence(answerId) {
    return get(`/api/teacher/answers/${answerId}/evidence`)
  },
  manualGrade(answerId, payload) {
    return post(`/api/teacher/answers/${answerId}/grade`, payload)
  },
  llmRetry(answerId, payload) {
    return post(`/api/teacher/answers/${answerId}/llm-retry`, payload)
  },
  assignmentScores(assignmentId, page = 1, size = 10) {
    return get(`/api/teacher/assignments/${assignmentId}/scores`, { page, size })
  },
  assignmentTargets(assignmentId, page = 1, size = 10) {
    return get(`/api/teacher/assignments/${assignmentId}/targets`, { page, size })
  },
  assignmentStudentDetail(assignmentId, studentId) {
    return get(`/api/teacher/assignments/${assignmentId}/targets/${studentId}`)
  },
  appeals(params) {
    return query('/api/teacher/appeals', params)
  },
  handleAppeal(appealId, payload) {
    return post(`/api/teacher/appeals/${appealId}/handle`, payload)
  },
}

export const llmApi = {
  page(params) {
    return query('/api/llm/calls', params)
  },
  detail(llmCallId) {
    return get(`/api/llm/calls/${llmCallId}`)
  },
}

export const learningApi = {
  knowledgePoints() {
    return get('/api/learning/knowledge-points')
  },
  createKnowledgePoint(payload) {
    return post('/api/learning/knowledge-points', payload)
  },
  updateKnowledgePoint(id, payload) {
    return put(`/api/learning/knowledge-points/${id}`, payload)
  },
  removeKnowledgePoint(id) {
    return del(`/api/learning/knowledge-points/${id}`)
  },
  resources(params) {
    return query('/api/learning/resources', params)
  },
  createResource(payload) {
    return post('/api/learning/resources', payload)
  },
  updateResource(id, payload) {
    return put(`/api/learning/resources/${id}`, payload)
  },
  removeResource(id) {
    return del(`/api/learning/resources/${id}`)
  },
  recordBehavior(payload) {
    return post('/api/learning/behaviors', payload)
  },
  profile() {
    return get('/api/learning/profile')
  },
  recommendations() {
    return get('/api/learning/recommendations')
  },
  knowledgeRelations() {
    return get('/api/learning/knowledge-relations')
  },
  createKnowledgeRelation(payload) {
    return post('/api/learning/knowledge-relations', payload)
  },
  updateKnowledgeRelation(id, payload) {
    return put(`/api/learning/knowledge-relations/${id}`, payload)
  },
  extractKnowledgeGraph(payload) {
    return post('/api/learning/knowledge-graph/extract', payload, { timeout: 120000 })
  },
  extractKnowledgeGraphFile(file, payload = {}) {
    const formData = new FormData()
    formData.append('file', file)
    Object.entries(clean(payload)).forEach(([key, value]) => {
      formData.append(key, value)
    })
    return post('/api/learning/knowledge-graph/extract-file', formData, { timeout: 120000 })
  },
  removeKnowledgeRelation(id) {
    return del(`/api/learning/knowledge-relations/${id}`)
  },
  personalizedPracticePlan(params) {
    return query('/api/learning/personalized-practice/plan', params)
  },
  startPersonalizedPractice(payload) {
    return post('/api/learning/personalized-practice/start', payload)
  },
}

export const stageEvaluationApi = {
  my(params) {
    return query('/api/stage-evaluations/my', params)
  },
  teacherStudents(params) {
    return query('/api/stage-evaluations/teacher/students', params)
  },
}

export const adminApi = {
  pageUsers(page = 1, size = 20) {
    return get('/api/admin/users', { page, size })
  },
  createUser(payload) {
    return post('/api/admin/users', payload)
  },
  updateUser(userId, payload) {
    return put(`/api/admin/users/${userId}`, payload)
  },
  updateUserRole(userId, role) {
    return put(`/api/admin/users/${userId}/role`, { role })
  },
  loginLogs(params) {
    return query('/api/admin/login-logs', params)
  },
  auditLogs(params) {
    return query('/api/admin/audit-logs', params)
  },
}


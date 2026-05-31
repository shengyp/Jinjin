package com.xyz.question_bank_management_system.service;

import com.xyz.question_bank_management_system.entity.*;
import com.xyz.question_bank_management_system.mapper.*;
import com.xyz.question_bank_management_system.dto.PersonalizedPracticeRequest;
import com.xyz.question_bank_management_system.dto.PracticeStartRequest;
import com.xyz.question_bank_management_system.vo.PersonalizedPracticePlanVO;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SmartLearningService {

    private final QbKnowledgePointMapper knowledgePointMapper;
    private final QbLearningResourceMapper resourceMapper;
    private final QbLearningBehaviorMapper behaviorMapper;
    private final QbTagMasteryMapper tagMasteryMapper;
    private final QbUserAbilityMapper userAbilityMapper;

    public List<QbKnowledgePoint> knowledgePoints() {
        return knowledgePointMapper.selectAll();
    }

    public Long createKnowledgePoint(QbKnowledgePoint point) {
        if (point.getLevel() == null) point.setLevel(1);
        if (point.getSortOrder() == null) point.setSortOrder(0);
        knowledgePointMapper.insert(point);
        return point.getId();
    }

    public void updateKnowledgePoint(Long id, QbKnowledgePoint point) {
        point.setId(id);
        knowledgePointMapper.update(point);
    }

    public void deleteKnowledgePoint(Long id) {
        knowledgePointMapper.softDelete(id);
    }

    public List<QbLearningResource> resources(String keyword, Long knowledgePointId, Integer limit) {
        return resourceMapper.selectList(keyword, knowledgePointId, normalizeLimit(limit, 50));
    }

    public Long createResource(QbLearningResource resource, Long operatorId) {
        resource.setCreatedBy(operatorId);
        resourceMapper.insert(resource);
        return resource.getId();
    }

    public void updateResource(Long id, QbLearningResource resource) {
        resource.setId(id);
        resourceMapper.update(resource);
    }

    public void deleteResource(Long id) {
        resourceMapper.softDelete(id);
    }

    public Long recordBehavior(QbLearningBehavior behavior, Long userId) {
        behavior.setUserId(userId);
        behaviorMapper.insert(behavior);
        return behavior.getId();
    }

    public LearningProfile profile(Long userId) {
        List<QbTagMastery> mastery = tagMasteryMapper.selectByUserIdAndTagType(userId, null);
        List<QbKnowledgePoint> weakPoints = knowledgePointMapper.selectWeakest(userId, 6);
        QbUserAbility ability = userAbilityMapper.selectByUserId(userId);
        LearningProfile profile = new LearningProfile();
        profile.setAbilityScore(ability == null ? 0 : ability.getAbilityScore());
        profile.setBehaviorCount(behaviorMapper.countByUserId(userId));
        profile.setStudyDurationSeconds(behaviorMapper.sumDurationByUserId(userId));
        profile.setMastery(mastery);
        profile.setWeakPoints(weakPoints);
        profile.setRecentBehaviors(behaviorMapper.selectRecent(userId, 10));
        profile.setAdvice(buildAdvice(profile));
        return profile;
    }

    public LearningRecommendation recommendations(Long userId) {
        List<QbKnowledgePoint> weakPoints = knowledgePointMapper.selectWeakest(userId, 5);
        List<Long> ids = weakPoints.stream().map(QbKnowledgePoint::getId).collect(Collectors.toList());
        List<QbLearningResource> resources = ids.isEmpty()
                ? Collections.emptyList()
                : resourceMapper.selectByKnowledgePointIds(ids, 8);
        LearningRecommendation recommendation = new LearningRecommendation();
        recommendation.setWeakPoints(weakPoints);
        recommendation.setResources(resources);
        recommendation.setPlan(buildPlan(weakPoints));
        return recommendation;
    }

    public PersonalizedPracticePlanVO personalizedPracticePlan(Long userId, PersonalizedPracticeRequest request) {
        List<QbKnowledgePoint> weakPoints = knowledgePointMapper.selectWeakest(userId, 5);
        List<Long> tagIds = weakPoints.stream()
                .map(QbKnowledgePoint::getTagId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        PersonalizedPracticePlanVO plan = new PersonalizedPracticePlanVO();
        plan.setWeakPoints(weakPoints);
        plan.setTagIds(tagIds);
        plan.setMode(text(request == null ? null : request.getMode(), "adaptive"));
        plan.setTotalScore(normalizeTotalScore(request == null ? null : request.getTotalScore()));
        plan.setReason(tagIds.isEmpty()
                ? "No weak knowledge tags yet. The system will fall back to the general practice question pool."
                : "Practice will focus on weak knowledge tags from the current learner profile.");
        return plan;
    }

    public PracticeStartRequest buildPersonalizedPracticeRequest(Long userId, PersonalizedPracticeRequest request) {
        PersonalizedPracticePlanVO plan = personalizedPracticePlan(userId, request);
        PracticeStartRequest practice = new PracticeStartRequest();
        practice.setMode(plan.getMode());
        practice.setTotalScore(plan.getTotalScore());
        if (plan.getTagIds() != null && !plan.getTagIds().isEmpty()) {
            PracticeStartRequest.Scope scope = new PracticeStartRequest.Scope();
            scope.setTagIds(plan.getTagIds());
            practice.setScope(scope);
        }
        return practice;
    }

    private int normalizeLimit(Integer limit, int defaultLimit) {
        if (limit == null || limit <= 0) return defaultLimit;
        return Math.min(limit, 100);
    }

    private int normalizeTotalScore(Integer totalScore) {
        if (totalScore == null || totalScore <= 0) return 100;
        return Math.min(totalScore, 300);
    }

    private String text(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String buildAdvice(LearningProfile profile) {
        if (profile.getWeakPoints().isEmpty()) {
            return "当前暂无薄弱知识点数据，建议先完成一次题库练习或作业，系统会自动生成知识画像。";
        }
        String names = profile.getWeakPoints().stream()
                .limit(3)
                .map(QbKnowledgePoint::getName)
                .filter(StringUtils::hasText)
                .collect(Collectors.joining("、"));
        return "建议优先复习 " + names + "，先看资源，再做对应标签题目，最后回到错题记录中完成订正。";
    }

    private List<Map<String, Object>> buildPlan(List<QbKnowledgePoint> weakPoints) {
        return weakPoints.stream().limit(5).map(point -> Map.<String, Object>of(
                "knowledgePointId", point.getId(),
                "title", "复习 " + point.getName(),
                "masteryValue", point.getMasteryValue() == null ? 0 : point.getMasteryValue(),
                "actions", List.of("阅读关联资源", "完成题库练习", "订正错题并记录反思")
        )).collect(Collectors.toList());
    }

    @Data
    public static class LearningProfile {
        private Integer abilityScore;
        private Long behaviorCount;
        private Long studyDurationSeconds;
        private List<QbTagMastery> mastery;
        private List<QbKnowledgePoint> weakPoints;
        private List<QbLearningBehavior> recentBehaviors;
        private String advice;
    }

    @Data
    public static class LearningRecommendation {
        private List<QbKnowledgePoint> weakPoints;
        private List<QbLearningResource> resources;
        private List<Map<String, Object>> plan;
    }
}

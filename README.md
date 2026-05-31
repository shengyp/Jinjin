# 智能学习系统

## 系统介绍

智能学习系统是一个面向课程教学场景的 Web 教学辅助系统。系统以题库建设、作业考试、在线练习、成绩复核、学习分析和个性化推荐为核心流程，可根据实际课程内容配置题目、标签、知识点、学习资源和知识图谱关系。

系统适用于不同课程和学科的练习、测评与学习分析场景。管理员或教师可以通过标签管理、知识点管理和题目管理，维护课程内容结构和题库资源。

系统分为学生端、教师端和管理员端。不同角色登录后会进入对应的功能界面，完成课程学习、教学管理或系统维护工作。

### 界面与功能

| 角色 | 主要界面 | 功能说明 |
| --- | --- | --- |
| 学生端 | 首页、我的作业、题库练习、作答记录、学习统计、知识画像、阶段评价、智能推荐、个性化练习、学习资源、我的申诉 | 学生可以完成作业考试、进行题库练习、查看学习情况，并根据系统推荐进行针对性复习。 |
| 教师端 | 题目管理、试卷管理、作业/考试管理、班级管理、知识点管理、学习资源、学生阶段评价、复核中心、大模型调用记录 | 教师可以维护题库和试卷，发布作业考试，管理班级，查看学生学习表现，并处理复核和申诉。 |
| 管理员端 | 用户管理、系统日志、标签管理、知识点管理、知识图谱抽取、知识关系标定、大模型调用记录 | 管理员可以维护系统基础数据，管理用户和标签，抽取或人工维护知识点之间的先修关系。 |

### 核心能力

- 题库管理：支持题目新增、编辑、发布、归档、标签绑定和题库审核。
- 试卷与作业考试：支持组卷、发布作业/考试、设置班级或学生范围、查看提交情况。
- 学生在线作答：支持学生完成作业、考试和题库练习，并生成作答记录。
- 成绩复核与申诉：支持教师人工复核，学生可提交成绩申诉。
- 学习统计：基于学生作答数据统计错题、掌握度和学习表现。
- 知识画像：根据知识点和标签掌握情况展示学生学习状态。
- 智能推荐：结合薄弱知识点推荐学习资源和练习内容。
- 知识图谱抽取：支持上传课程资料，通过大语言模型抽取知识点之间的先修关系。
- 知识关系标定：管理员可手动新增、编辑和删除知识点先修关系。
- 个性化练习：根据学生薄弱知识点生成更有针对性的练习计划。

### 技术栈

- 后端：Spring Boot 3、Spring Security、MyBatis、MySQL
- 前端：Vue 3、Vite、Pinia、Vue Router、Element Plus
- 数据库：MySQL 8.x
- 大模型：通过后端配置调用通义千问、DeepSeek、ERNIE 等模型服务

## 部署使用

部署前需要准备以下环境：

- JDK 17
- Maven 3.8+
- Node.js 20.19+ 或 22.12+
- MySQL 8.x

### 数据库部署

数据库脚本位于 `backend/` 目录。当前部署只需要关注以下三个脚本：

```text
backend/database_full_init.sql
backend/database_smart_learning.sql
backend/database_knowledge_graph.sql
```

三个脚本的用途如下：

| 文件 | 用途 |
| --- | --- |
| `database_full_init.sql` | 完整数据库初始化脚本。新部署系统时优先执行这个文件。 |
| `database_smart_learning.sql` | 智能学习相关表补充脚本。仅在已有旧数据库缺少知识点、学习资源、学习行为等表时执行。 |
| `database_knowledge_graph.sql` | 知识图谱关系表补充脚本。仅在已有旧数据库缺少 `qb_knowledge_relation` 表时执行。 |

新部署时，先创建数据库：

```sql
CREATE DATABASE question_bank DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后执行完整初始化脚本：

```bash
mysql -u root -p question_bank < backend/database_full_init.sql
```

如果数据库已经存在，并且只缺少智能学习相关表，可以执行：

```bash
mysql -u root -p question_bank < backend/database_smart_learning.sql
```

如果数据库已经存在，并且只缺少知识图谱关系表，可以执行：

```bash
mysql -u root -p question_bank < backend/database_knowledge_graph.sql
```

当前系统主要使用到的智能学习相关表包括：

```text
qb_tag
qb_knowledge_point
qb_knowledge_relation
qb_learning_resource
qb_learning_behavior
qb_tag_mastery
```

### 后端配置

修改后端配置文件：

```text
backend/src/main/resources/application.properties
```

配置 MySQL 连接信息：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/question_bank?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

配置大模型密钥文件路径：

```properties
app.llm.ali.api-key-file=E:/keys/qwen_api.txt
app.llm.baidu.api-key-file=E:/keys/BaiDu_key.txt
```

密钥文件内容只需要填写对应平台的 API Key。

### 启动后端

```bash
cd backend
mvn spring-boot:run
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 打包部署

前端打包：

```bash
cd frontend
npm run build
```

打包结果位于：

```text
frontend/dist
```

后端打包：

```bash
cd backend
mvn clean package
```

运行后端 jar：

```bash
java -jar target/Question_Bank_Management_System-0.0.1-SNAPSHOT.jar
```

默认管理员初始化配置位于：

```properties
app.init.enabled=true
app.init.admin-username=admin
app.init.admin-password=admin123
```

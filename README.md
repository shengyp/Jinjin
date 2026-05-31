# 智能学习题库系统

本项目是一个面向 C 语言课程教学的智能题库与学习分析系统，包含题库管理、试卷管理、作业考试、学生作答、成绩复核、学习统计、知识画像、智能推荐、知识图谱抽取和个性化练习等功能。

## 技术栈

- 后端：Spring Boot 3、Spring Security、MyBatis、MySQL
- 前端：Vue 3、Vite、Pinia、Vue Router、Element Plus
- 数据库：MySQL 8.x
- 大模型：通过后端配置调用通义千问、DeepSeek、ERNIE 等模型服务

## 目录结构

```text
.
├── backend/                         后端 Spring Boot 项目
│   ├── src/main/java/                后端业务代码
│   ├── src/main/resources/           后端配置文件
│   ├── question_bank_full_init.sql   完整数据库初始化脚本
│   └── upgrade_*.sql                 数据库升级脚本
├── frontend/                         前端 Vue 项目
│   ├── src/                          前端源码
│   ├── public/                       静态资源
│   └── package.json                  前端依赖与脚本
└── README.md
```

## 功能模块

### 学生端

- 登录、注册
- 查看作业和考试
- 题库练习
- 作答记录
- 学习统计
- 知识画像
- 阶段评价
- 智能推荐
- 个性化练习
- 学习资源
- 成绩申诉

### 教师端

- 题目管理
- 试卷管理
- 作业/考试管理
- 班级管理
- 知识点管理
- 学习资源管理
- 学生阶段评价
- 复核中心
- 大模型调用记录

### 管理员端

- 用户管理
- 系统日志
- 标签管理
- 知识点管理
- 知识图谱抽取
- 知识关系人工标定
- 大模型调用记录

## 环境要求

- JDK 17
- Maven 3.8+
- Node.js 20.19+ 或 22.12+
- MySQL 8.x

## 数据库初始化

先创建数据库：

```sql
CREATE DATABASE question_bank DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

导入完整初始化脚本：

```bash
mysql -u root -p question_bank < backend/question_bank_full_init.sql
```

如果数据库已经存在，只需要补充新功能表，可按实际情况执行升级脚本：

```bash
mysql -u root -p question_bank < backend/upgrade_20260528_smart_learning_merge.sql
mysql -u root -p question_bank < backend/upgrade_20260529_knowledge_graph_personalized_practice.sql
```

知识图谱先修关系表为：

```text
qb_knowledge_relation
```

知识点表为：

```text
qb_knowledge_point
```

标签表为：

```text
qb_tag
```

## 后端配置

后端配置文件：

```text
backend/src/main/resources/application.properties
```

修改 MySQL 连接信息：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/question_bank?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

大模型密钥文件配置：

```properties
app.llm.ali.api-key-file=${user.home}/Desktop/qwen_api.txt
app.llm.baidu.api-key-file=${user.home}/Desktop/BaiDu_key.txt
```

如果密钥文件放在其它位置，可以改成绝对路径：

```properties
app.llm.ali.api-key-file=E:/keys/qwen_api.txt
app.llm.baidu.api-key-file=E:/keys/BaiDu_key.txt
```

密钥文件内容只需要填写 API Key 本身。

## 启动后端

```bash
cd backend
mvn spring-boot:run
```

默认后端地址：

```text
http://localhost:8080
```

## 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认前端地址：

```text
http://localhost:5173
```

如果需要同一局域网设备访问前端：

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

然后使用本机局域网 IP 访问：

```text
http://本机IP:5173
```

## 前端打包

```bash
cd frontend
npm run build
```

打包结果输出到：

```text
frontend/dist
```

## 部署说明

### 后端部署

构建后端：

```bash
cd backend
mvn clean package
```

运行生成的 jar 文件：

```bash
java -jar target/Question_Bank_Management_System-0.0.1-SNAPSHOT.jar
```

### 前端部署

执行前端打包：

```bash
cd frontend
npm run build
```

将 `frontend/dist` 目录部署到 Nginx、Apache 或其它静态资源服务器。

如果前后端分离部署，需要确保前端 API 请求地址指向后端服务地址。

## 默认管理员

初始化配置中包含开发初始化参数：

```properties
app.init.enabled=true
app.init.admin-username=admin
app.init.admin-password=admin123
```

首次部署后建议修改默认管理员密码。

## 主要数据库脚本

```text
backend/question_bank_full_init.sql
backend/upgrade_20260224_class_feature.sql
backend/upgrade_20260308_adaptive_practice_index.sql
backend/upgrade_20260406_question_bank_review_and_paper_status.sql
backend/upgrade_20260528_smart_learning_merge.sql
backend/upgrade_20260529_knowledge_graph_personalized_practice.sql
```

## 注意事项

- 不要提交真实的大模型 API Key。
- 不要提交 `frontend/node_modules/`、`frontend/dist/`、`backend/target/` 等生成目录。
- 部署到其它电脑时，需要重新配置数据库用户名、密码和大模型密钥文件路径。
- 局域网访问时，需要确保防火墙允许前端端口和后端端口访问。

# P41 Spec - AI 智能体聚合大屏

## 1. Summary

- **Project ID**: P41
- **Project Name**: AI 智能体聚合大屏
- **Goal**: 统一门户导航，集成跨项目搜索/分类筛选/状态看板
- **User Persona**: 全部用户

## 2. Scope

- **In scope**:
  - 统一门户导航
  - 集成跨项目搜索/分类筛选/状态看板
- **Out of scope**:
  - 后端代理或服务端逻辑
  - API Key 持久化存储

## 3. UX

- **Core workflow**: 用户输入 → 前端处理 → 结果展示
- **Inputs**: 搜索关键词 / 分类筛选
- **Outputs**: 项目导航列表
- **States**: empty (初始) / loading (处理中) / error (失败) / success (完成)

## 4. Functional Requirements

1. FR-1: 统一门户导航
2. FR-2: 结果可视化展示
3. FR-3: 错误状态可见提示

## 5. Non-Functional Requirements

- **Performance**: 核心任务 3 分钟内完成
- **Accessibility**: 键盘导航、aria-label、焦点可见、WCAG AA 对比度
- **Privacy**: 本地处理优先，不默认上传数据
- **Browser support**: 现代 Chromium (Chrome 110+)

## 6. Dependencies

- **Libraries/CDNs**: 无外部依赖
- **Local data**: 无

## 7. Risks & Mitigations

- **Risk**: 项目链接失效
- **Mitigation**: 定期巡检链接状态

## 8. Acceptance Criteria

- [ ] 入口卡片
- [ ] 新窗口打开
- [ ] 纯静态页面可部署 GitHub Pages
- [ ] 移动端可用
- [ ] 隐私提示清晰可见

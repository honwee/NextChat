# 考核模式前端功能实现文档

## 概述

已为面试官考核系统添加完整的前端快捷指令支持,用户可以通过输入`:exam 岗位名`等快捷指令快速启动和控制考核模式。

## 更新的文件

### 1. `/app/command.ts`
**更新内容**: 扩展了 `ChatCommands` 接口,添加了考核模式相关指令

```typescript
interface ChatCommands {
  // 原有指令
  new?: Command;
  newm?: Command;
  next?: Command;
  prev?: Command;
  clear?: Command;
  fork?: Command;
  del?: Command;

  // 新增考核模式指令
  exam?: Command;       // 启动考核模式
  train?: Command;      // 切换到训练模式
  endexam?: Command;    // 结束考核
  换一批?: Command;      // 换一批候选人
  随机?: Command;        // 随机选择候选人
  返回?: Command;        // 返回上一级
}
```

---

### 2. `/app/locales/cn.ts`
**更新内容**: 添加了考核模式指令的中文描述

```typescript
Commands: {
  // 原有指令...

  // 新增考核模式指令描述
  exam: "考核模式 - 输入 :exam 运营 启动考核",
  train: "训练模式 - 输入 :train 回到训练",
  endexam: "结束考核 - 输入 :endexam 生成报告",
  换一批: "换一批候选人",
  随机: "随机选择候选人",
  返回: "返回上一级",
}
```

**作用**:
- 当用户输入 `:` 触发指令补全时,会显示这些描述
- 帮助用户理解每个指令的用途

---

### 3. `/app/components/chat.tsx`
**更新内容**:
1. 导入了快捷指令面板组件
2. 在 `useChatCommand` 中添加了考核模式指令的处理逻辑
3. 在 `ChatActions` 组件中集成了快捷指令面板

#### 3.1 导入快捷指令组件
```typescript
import { ExamShortcutsPanel } from "./exam-shortcuts";
```

#### 3.2 指令处理逻辑
```typescript
const chatCommands = useChatCommand({
  // 原有指令...

  // 考核模式指令处理
  exam: (input) => {
    // 提取岗位名称,例如 ":exam 运营" -> "运营"
    const match = input.match(/^[:：]exam\s+(.+)/);
    const jobName = match ? match[1].trim() : "";
    const message = `/exam ${jobName}`;
    chatStore.onUserInput(message);
    setUserInput("");
  },

  train: () => {
    chatStore.onUserInput("/train");
    setUserInput("");
  },

  endexam: () => {
    chatStore.onUserInput("结束考核");
    setUserInput("");
  },

  换一批: () => {
    chatStore.onUserInput("换一批");
    setUserInput("");
  },

  随机: () => {
    chatStore.onUserInput("随机");
    setUserInput("");
  },

  返回: () => {
    chatStore.onUserInput("返回");
    setUserInput("");
  },
});
```

#### 3.3 集成快捷指令面板
在 `ChatActions` 组件的返回 JSX 中添加:
```typescript
{/* 考核模式快捷指令面板 */}
<ExamShortcutsPanel />
```

---

### 4. `/app/components/exam-shortcuts.tsx` (新建)
**文件作用**: 考核模式快捷指令面板组件

**核心功能**:
1. **可展开/收起的快捷指令面板**: 点击"快捷指令"按钮可显示/隐藏完整的指令列表
2. **分类展示**: 将指令分为三类:
   - 📋 考核控制 (exam, train, endexam等)
   - 👥 候选人选择 (换一批, 随机, 返回等)
   - ⚙️ 通用指令 (clear, new等)
3. **使用提示**: 内置使用说明,帮助用户快速上手

**组件导出**:
- `ExamShortcutsPanel`: 主面板组件
- `ExamShortcutsHint`: 简化版提示(备用,可在输入框上方显示)

**支持的快捷指令**:

| 指令 | 功能 | 类别 |
|-----|------|-----|
| `:exam 运营` | 启动考核模式(替换"运营"为目标岗位) | 考核控制 |
| `:train` | 切换到训练模式 | 考核控制 |
| `:endexam` | 结束考核并生成报告 | 考核控制 |
| `结束考核` | 结束考核(文本指令) | 考核控制 |
| `完成` | 完成考核 | 考核控制 |
| `:换一批` | 换一批候选人 | 候选人选择 |
| `:随机` | 随机选择候选人 | 候选人选择 |
| `:返回` | 返回上一级 | 候选人选择 |
| `1 / 2 / 3` | 选择难度1/2/3的候选人 | 候选人选择 |
| `:clear` | 清除上下文 | 通用指令 |
| `:new` | 新建聊天 | 通用指令 |

---

### 5. `/app/components/exam-shortcuts.module.scss` (新建)
**文件作用**: 快捷指令面板的样式文件

**设计特点**:
1. **渐变背景**: 使用紫色渐变主题 (`#667eea` → `#764ba2`)
2. **平滑动画**: 展开/收起时有滑动动画 (`slideUp`)
3. **响应式设计**: 移动端自适应宽度和高度
4. **暗色模式支持**: 自动适配系统暗色模式
5. **自定义滚动条**: 美化滚动条样式
6. **悬停效果**: 指令项悬停时有平滑的缩放和移动效果

**核心样式类**:
- `.exam-shortcuts`: 容器
- `.shortcuts-toggle`: 切换按钮
- `.shortcuts-panel`: 面板主体
- `.shortcuts-header`: 面板头部
- `.shortcuts-content`: 面板内容区
- `.shortcut-category`: 指令分类
- `.shortcut-item`: 单个指令项
- `.shortcut-command`: 指令代码展示
- `.shortcut-desc`: 指令描述
- `.shortcuts-tips`: 使用提示区域

---

## 用户使用流程

### 1. 启动考核模式
```
用户输入: :exam 运营
系统响应: 触发考核模式,展示候选人选择界面
```

### 2. 选择候选人
```
用户输入: 1  (选择难度1的候选人)
或输入: :随机  (系统随机分配)
或输入: :换一批  (重新匹配候选人)
```

### 3. 进行面试
```
用户正常提问...
候选人根据难度回答...
```

### 4. 结束考核
```
用户输入: :endexam
或输入: 结束考核
或达到60轮自动结束
系统响应: 生成考核报告
```

---

## 技术实现细节

### 指令触发机制
1. **前缀检测**: 使用 `ChatCommandPrefix` 正则 (`/^[:：]/`) 检测指令前缀
2. **指令匹配**: 在 `useChatCommand` 中注册所有指令的处理函数
3. **参数提取**: 使用正则表达式提取指令参数(如 `:exam 运营` 中的"运营")
4. **消息发送**: 将指令转换为消息发送给后端智能体

### 指令补全
当用户输入 `:` 时:
1. 触发 `onInput` 函数检测 `ChatCommandPrefix`
2. 调用 `chatCommands.search(text)` 搜索匹配的指令
3. 在输入框上方显示 `PromptHints` 提示框
4. 用户可使用上下键选择,回车确认

### 面板交互
1. **打开**: 点击"快捷指令"按钮
2. **关闭**: 点击面板右上角"×"按钮或再次点击"快捷指令"按钮
3. **定位**: 面板固定在按钮上方(`bottom: calc(100% + 12px)`)
4. **动画**: 使用 `slideUp` 关键帧动画实现平滑展开效果

---

## 优势与特点

### 1. 用户体验优化
✅ **快速启动**: 一行指令 `:exam 岗位` 即可启动考核
✅ **智能补全**: 输入 `:` 自动显示可用指令
✅ **可视化面板**: 点击查看所有指令,不需要记忆
✅ **多种方式**: 支持指令和文本两种方式(如 `:endexam` 和 `结束考核`)

### 2. 设计美观
✅ **渐变主题**: 紫色渐变配色,现代感强
✅ **平滑动画**: 所有交互都有过渡动画
✅ **响应式**: 自适应桌面和移动端
✅ **暗色模式**: 自动适配系统主题

### 3. 开发友好
✅ **模块化**: 组件独立,易于维护
✅ **类型安全**: TypeScript 类型定义完整
✅ **易扩展**: 添加新指令只需修改配置数组
✅ **命名规范**: 样式类名清晰,遵循 BEM 风格

---

## 移动端适配

### 响应式设计
```scss
@media (max-width: 600px) {
  .shortcuts-panel {
    width: 90vw;        // 宽度适应屏幕
    max-height: 70vh;   // 高度不超过屏幕70%
  }
}
```

### 触摸优化
- 按钮尺寸足够大,易于点击
- 面板滚动流畅,支持惯性滚动
- 指令项间距合理,避免误触

---

## 后续优化建议

### 1. 指令历史记录
记录用户最常用的指令,优先展示在面板顶部

### 2. 自定义快捷键
允许用户自定义键盘快捷键,例如 `Ctrl+Shift+E` 打开考核模式

### 3. 指令模板
支持带参数模板,例如 `:exam {岗位} difficulty={难度}`

### 4. 语音指令
集成语音识别,支持语音触发指令

### 5. 指令搜索
在面板中添加搜索框,快速定位指令

---

## 测试建议

### 功能测试
- [ ] 测试所有指令是否正常触发
- [ ] 测试指令补全是否准确
- [ ] 测试面板打开/关闭动画
- [ ] 测试移动端适配

### 兼容性测试
- [ ] Chrome/Edge/Safari 浏览器测试
- [ ] iOS/Android 移动端测试
- [ ] 暗色模式测试
- [ ] 不同屏幕尺寸测试

### 性能测试
- [ ] 面板打开速度 (应 <100ms)
- [ ] 指令触发响应时间 (应 <50ms)
- [ ] 动画帧率 (应保持 60fps)

---

## 总结

已成功为考核模式添加了完整的前端快捷指令支持,包括:
1. ✅ 指令系统扩展 (`command.ts`)
2. ✅ 中文本地化 (`locales/cn.ts`)
3. ✅ 指令处理逻辑 (`chat.tsx`)
4. ✅ 可视化面板组件 (`exam-shortcuts.tsx`)
5. ✅ 美观的样式设计 (`exam-shortcuts.module.scss`)

用户现在可以通过输入 `:exam 岗位名` 快速启动考核,也可以点击"快捷指令"按钮查看所有可用指令。系统提供了友好的指令补全和可视化面板,大大提升了用户体验。

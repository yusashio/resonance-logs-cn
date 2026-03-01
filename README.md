# Resonance Logs CN Yusa

本项目修改自 
https://github.com/resonance-logs/resonance-logs 
https://github.com/resonance-logs/resonance-logs-cn

感谢 https://github.com/dmlgzs/StarResonanceDamageCounter

---

## 功能介绍

### 1. 实时伤害统计 (Live Meter)
- 实时显示队伍成员的 DPS（每秒伤害）、治疗量、承受伤害数据
- 支持按技能细分查看伤害/治疗构成
- 可切换只统计 BOSS 伤害模式
- 支持副本分段统计
- 可暂停/重置战斗统计
- 透明悬浮窗口，支持置顶和点击穿透

### 2. 游戏内覆盖层 (Game Overlay)
- 角色战斗属性面板：实时显示攻击、防御、暴击等战斗属性
- Buff 监控面板：分组显示关键 Buff，支持优先级设置
- 怪物血量面板：实时显示当前目标怪物血量
- 技能冷却监控：显示技能冷却进度
- 资源面板：显示职业资源（如能量、怒气等）
- 可拖拽、可调整大小的透明窗口

### 3. 历史记录管理
- 保存战斗记录到本地数据库
- 支持按场景、BOSS、玩家筛选历史记录
- 收藏重要战斗记录
- 查看详细战斗数据和技能分析
- 支持删除和导出记录

### 4. 模组优化器 (Module Optimizer)
- 根据最新模组数据自动优化配装
- 支持 4 模组和 5 模组配置方案
- 检查 GPU 兼容性
- 提供贪心算法优化方案

### 5. 丰富的设置选项
- 覆盖层设置：透明度、缩放、位置等
- Buff 管理：搜索、优先级配置、分组管理
- 技能监控：自定义监控技能
- 配置文件管理：支持多配置切换
- 快捷键设置：全局快捷键控制
- 主题定制：自定义界面主题

---

## 构建说明

### 技术栈
- **前端**：SvelteKit 5 + TypeScript + Tailwind CSS v4
- **后端**：Rust + Tauri 2.9.3 + WinDivert
- **构建工具**：Vite + npm + Cargo
- **数据库**：SQLite

### 开发环境搭建

1. **克隆项目**
   ```bash
   git clone https://github.com/yusashio/resonance-logs-cn-yusa
   cd resonance-logs-cn-yusa
   ```

2. **安装前端依赖**
   ```bash
   npm install
   ```

3. **安装 Rust 依赖**
   ```bash
   cd src-tauri
   cargo build
   cd ..
   ```

4. **启动开发服务器**
   ```bash
   npm run tauri dev
   ```
   这将启动前端开发服务器并运行 Tauri 应用。

### 构建发布版本

1. **构建前端**
   ```bash
   npm run build
   ```

2. **构建 Tauri 应用**
   ```bash
   npm run tauri build
   ```
   构建完成后，安装包将位于 `src-tauri/target/release/bundle/` 目录。

### 常用命令

- `npm run dev` - 仅启动前端开发服务器
- `npm run build` - 仅构建前端
- `npm run check` - TypeScript 类型检查
- `npm run format` - 格式化代码
- `npm run lint` - 代码 lint 检查
- `npm run tauri dev` - 开发模式运行应用
- `npm run tauri build` - 构建发布版本

### 注意事项

- 首次运行需要管理员权限以安装 WinDivert 驱动
- WinDivert 用于捕获游戏网络数据包
- 应用使用本地 SQLite 数据库存储战斗记录

---

## 许可证

GNU Affero General Public License v3.0

# Admin Copy

这是一个静态前端预览项目，用于还原 Exness Personal Area 风格的后台界面。当前版本不接入真实接口，不会提交真实登录信息，页面数据全部来自本地 mock。

## 技术栈

- React 19
- TypeScript 6，开启 `strict`
- Vite 8
- Material UI 9
- Emotion
- lucide-react 图标
- 本地 mock store，无后端依赖

## 运行环境

建议使用以下版本：

- Node.js：`^20.19.0 || >=22.12.0`
- npm：`10+`

当前开发机器验证版本：

- Node.js：`v24.12.0`
- npm：`11.6.2`

## 安装与运行

```bash
npm install
npm run dev
```

默认开发服务会通过 Vite 启动，脚本中已配置 `--host 0.0.0.0`，本机通常访问：

```text
http://127.0.0.1:5175
```

> 运营后台 `simu-stock-admin-front` 使用 **5174**，本 C 端项目使用 **5175**，避免端口冲突。

## 构建与预览

生产构建：

```bash
npm run build
```

本地预览构建产物：

```bash
npm run preview
```

构建输出目录是 `dist/`。如果要部署到静态服务器，把 `dist/` 内的 `index.html` 和 `assets/` 上传到站点根目录即可。

## 代码结构

```text
src/
  App.tsx                  主应用入口，包含登录页、布局、路由切换、页面组件、弹窗和顶部/侧边导航
  main.tsx                 React 挂载入口
  styles.css               全局样式、布局、响应式和侧边栏样式
  i18n.ts                  多语言词典与 DOM 文案同步逻辑
  types.ts                 业务类型定义
  data/
    mockData.ts            账户、交易、通知、支付方式等模拟数据
  state/
    paStore.tsx            本地状态、reducer、业务 action 和派生数据
  theme/
    exnessTheme.ts         Material UI 主题配置
```

## 已实现范围

- 登录/开户注册静态流程
- Personal Area 主布局
- 顶部余额、语言、帮助、通知、应用、用户菜单
- 左侧菜单展开/收缩交互
- 交易账户、绩效、订单历史
- 入金、出金、交易历史、加密钱包
- 分析资讯、市场新闻
- Exness benefits、Copy Trading、Support Hub、Settings
- 多语言切换，包含 English、简体中文、Tiếng Việt、Bahasa Indonesia、Español
- 常用弹窗、toast、本地复制、模拟下载 CSV 等静态交互

## 开发注意事项

- 项目是纯静态实现，所有数据都在 `src/data/mockData.ts` 和 `src/state/paStore.tsx` 中模拟。
- 登录只切换本地状态，不会把账号或密码传到任何服务端。
- 侧边栏的展开状态在 `App.tsx` 的 `openGroups` 相关逻辑中维护；收缩态下点击分组会进入该分组首个本地页面，展开回来只保留当前路由对应的分组，避免多个子菜单串行。
- 多语言目前通过 `i18n.ts` 的词典和 DOM 同步实现。新增页面文案后，需要同步补充词典，避免切换语言时出现漏翻。
- Material UI 是主要 UI 基础，新增复杂交互时优先使用 MUI 组件，避免混入过多自定义控件导致风格漂移。
- `reference-screens/`、`.reference-chrome/`、`dist/`、`node_modules/` 和 zip 包属于本地调试或构建产物，已加入 `.gitignore`，不建议提交。
- 如果后续接真实接口，建议先拆分 `App.tsx` 中的大型页面组件，并把本地 reducer 逐步替换为 API service + query/cache 层。

## 提交建议

首次提交建议包含：

```text
.gitignore
README.md
index.html
package.json
package-lock.json
tsconfig.json
vite.config.ts
src/
```

不要提交：

```text
node_modules/
dist/
.reference-chrome/
reference-screens/
*.zip
```

## 常用命令

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务
npm run build      # 类型检查并生产构建
npm run preview    # 预览 dist 构建结果
```

# 贡献指南

感谢你对本项目的关注！本文件说明如何在本地开发、构建与提交改动。

## 📦 安装

```bash
# 安装依赖
pnpm install
```

## 🎨 使用方式

### 开发服务器

```bash
pnpm run dev
```

应用将运行在 `http://localhost:5173`

### 构建生产版本

```bash
pnpm run build
```

### 预览生产构建

```bash
pnpm run preview
```

## 📝 脚本

- `pnpm run dev` - 启动开发服务器
- `pnpm run build` - 构建生产版本
- `pnpm run preview` - 预览生产构建
- `pnpm run lint` - 运行 ESLint

## 🎯 添加更多组件

添加 shadcn/ui 组件：

```bash
pnpm exec shadcn add <component-name>
```

可用组件列表：https://ui.shadcn.com/docs/components

## 📁 项目结构

```
src/
├── components/
│   ├── ui/           # shadcn/ui 组件
│   └── ModelPriceTable.tsx
├── types/
│   └── model.ts     # TypeScript 接口定义
├── App.tsx          # 主应用组件
├── App.css          # 应用样式
├── main.tsx         # 入口文件
└── index.css        # 全局样式（Tailwind）

public/
├── models.json      # 模型价格数据
└── providers.json   # 供应商与价格页面
```

## 📊 数据格式

`models.json` 文件结构如下：

```json
{
  "updatedAt": 1739289600000,
  "models": [
    {
      "id": "model-name",
      "name": "Display Name",
      "provider": "provider-id",
      "inputPrice": 10,
      "outputPrice": 30,
      "cachedInputPrice": 5,
      "cachedOutputPrice": 15,
      "billingCurrency": "USD",
      "pricingTiers": [
        {
          "label": "输入长度 [0, 32)",
          "inputPrice": 4,
          "outputPrice": 18,
          "cachedInputPrice": 1,
          "cachedOutputPrice": 1
        }
      ]
    }
  ]
}
```

说明：
- 所有价格单位为每 1M tokens
- `pricingTiers` 可选，用于支持分层定价（如智谱 GLM-5）
- `cachedInputPrice` 和 `cachedOutputPrice` 可选，表示缓存价格

`providers.json` 文件结构如下：

```json
[
  {
    "id": "openai",
    "name": "OpenAI",
    "pricingUrl": "https://openai.com/api/pricing/",
    "region": "global",
    "description": "GPT-4, GPT-4o, GPT-3.5 等模型"
  }
]
```

## ✅ 提交前检查

- 确保能正常构建：`pnpm run build`
- 若改动涉及数据结构，请同步更新 README 中的数据格式说明

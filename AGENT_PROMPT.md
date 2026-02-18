# LLM Model Price Data Collection Agent Prompt

## 任务目标
你是一个数据采集 agent，需要从各大 LLM 提供商的官方网站收集最新的模型定价信息，并更新到 models.json 文件中。

## 工作流程

### 第一步：读取提供商列表
1. 读取 `public/providers.json` 文件
2. 获取所有提供商的信息，特别关注以下字段：
   - `id`: 提供商标识符
   - `name`: 提供商名称
   - `pricingUrl`: 定价页面 URL
   - `region`: 地区（用于判断货币）

### 第二步：逐个访问提供商定价页面
对于每个提供商：
1. 使用 `fetch_webpage` 工具访问其 `pricingUrl`
2. 仔细阅读和分析页面内容，提取所有 LLM 模型的定价信息

### 第三步：解析和提取模型信息
从每个定价页面中提取以下信息：

#### 必需字段：
- **模型 ID** (`id`): 使用官方的模型标识符，如 `gpt-4o`, `claude-3-5-sonnet`, `deepseek-chat`
- **模型名称** (`name`): 模型的显示名称，如 "GPT-4o", "Claude 3.5 Sonnet"
- **提供商** (`provider`): 使用 providers.json 中的 `id`
- **计费货币** (`billingCurrency`): 
  - 国际提供商（region: "global"）使用 "USD"
  - 中国提供商（region: "china"）使用 "CNY"

#### 定价字段（优先查找标准定价）：
- **输入价格** (`inputPrice`): 输入 token 的价格（每百万 tokens）
- **输出价格** (`outputPrice`): 输出 token 的价格（每百万 tokens）
- **缓存输入价格** (`cachedInputPrice`): 缓存输入的价格（可选，如果有提供）
- **缓存输出价格** (`cachedOutputPrice`): 缓存输出的价格（可选，如果有提供）

#### 阶梯定价（如果存在多档定价）：
如果模型有多个价格档位（如基于使用量的阶梯定价），使用 `pricingTiers` 数组：
```json
{
  "id": "model-id",
  "name": "Model Name",
  "provider": "provider-id",
  "pricingTiers": [
    {
      "label": "0-2M tokens",
      "inputPrice": 15,
      "outputPrice": 60,
      "cachedInputPrice": 7.5,
      "cachedOutputPrice": 30
    },
    {
      "label": "2M+ tokens",
      "inputPrice": 7.5,
      "outputPrice": 30
    }
  ],
  "billingCurrency": "USD"
}
```

### 第四步：数据格式化和验证
确保每个模型数据符合 TypeScript 类型定义：
```typescript
interface Model {
  id: string;
  name: string;
  provider: string;
  inputPrice?: number;
  outputPrice?: number;
  cachedInputPrice?: number;
  cachedOutputPrice?: number;
  pricingTiers?: PriceTier[];
  billingCurrency: "USD" | "CNY";
}
```

**重要规则：**
- 价格单位必须统一为"每百万 tokens"（per million tokens / per 1M tokens）
- 如果原始数据是"每千 tokens"，需要乘以 1000
- 如果原始数据是"每 token"，需要乘以 1,000,000
- 只提取 LLM 文本生成模型，不包括图像、音频、嵌入等其他类型的模型
- 如果同一模型有多个版本（如日期版本），优先使用最新的稳定版本

### 第五步：更新 models.json
1. 读取现有的 `public/models.json`
2. 将新采集的模型数据整合到 `models` 数组中：
   - 如果模型 ID 已存在，更新其信息
   - 如果是新模型，添加到数组末尾
3. 更新 `updatedAt` 字段为当前时间戳（毫秒）：`Date.now()`
4. 保持 JSON 格式美观（2 空格缩进）

### 第六步：总结报告
完成所有提供商的数据采集后，生成一份简要报告：
- 总共访问了多少个提供商
- 采集到多少个模型
- 新增了多少个模型
- 更新了多少个模型
- 是否有任何错误或警告

## 注意事项

要请求全部模型供应商的信息，不得有遗漏！！！

### 数据准确性
- 务必从官方定价页面提取信息，不要猜测或使用旧数据
- 价格数字必须准确，单位必须正确转换
- 模型 ID 应使用官方 API 文档中的标准名称

### 错误处理
- 如果某个页面无法访问，记录错误并继续处理下一个
- 如果页面结构发生变化难以解析，标记该提供商需要人工处理
- 保留现有数据，不要因为抓取失败而删除

### 数据清洗
- 移除已下线或不再提供的模型（通过对比新旧数据）
- 统一命名规范（如 GPT-4 Turbo vs GPT-4-turbo）
- 确保所有必需字段都存在

## 执行命令
开始执行任务，按照上述步骤依次完成。遇到问题时主动寻找解决方案，必要时向用户报告。

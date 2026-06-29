# 劳动合同风险审查系统 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建基于 Next.js 的本地劳动合同风险审查 Web 应用，支持 PDF/Word 上传、8 维度自动审查、RAG 对话问答。

**Architecture:** Next.js App Router 全栈应用，前端 React + TailwindCSS，后端 API Routes 处理上传/审查/对话。LanceDB 作为嵌入式向量库存储法律知识，自研轻量 RAG 引擎负责检索增强生成。LLM 层兼容 OpenAI 格式 API，可配置切换。

**Tech Stack:** Next.js 14+ (App Router), TypeScript, React 18, TailwindCSS, LanceDB, pdf-parse, mammoth, OpenAI-compatible API

## Global Constraints

- Node.js >= 18
- 所有 LLM 调用兼容 OpenAI API 格式 (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `LLM_MODEL`)
- Embedding 模型通过 API 获取（兼容 OpenAI embeddings 格式）
- 法律知识库在首次启动时通过管理界面一键构建，持久化到本地文件
- 所有代码使用 TypeScript
- 不使用 LangChain.js —— 自研轻量 RAG，减少抽象层

---

## 文件结构

```
rag合同风险审查/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.local                          # API 配置
├── data/
│   ├── knowledge/                      # 法律知识源文件 (markdown)
│   │   ├── labor-contract-law.md       # 劳动合同法全文
│   │   ├── labor-law.md                # 劳动法
│   │   ├── social-insurance-law.md     # 社会保险法
│   │   ├── judicial-interpretations.md # 司法解释
│   │   └── regulations.md              # 其他法规
│   └── lance-db/                       # LanceDB 持久化数据
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # 根布局
│   │   ├── page.tsx                    # 首页 — 合同上传
│   │   ├── report/
│   │   │   └── [id]/
│   │   │       └── page.tsx            # 风险报告页
│   │   ├── chat/
│   │   │   └── [id]/
│   │   │       └── page.tsx            # 对话审查页
│   │   ├── admin/
│   │   │   └── page.tsx                # 知识库管理页
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts            # POST 上传合同
│   │       ├── review/
│   │       │   └── [id]/
│   │       │       └── route.ts        # GET/POST 审查
│   │       ├── chat/
│   │       │   └── [id]/
│   │       │       └── route.ts        # POST 对话
│   │       ├── kb/
│   │       │   ├── route.ts            # GET 知识库状态
│   │       │   └── build/
│   │       │       └── route.ts        # POST 构建知识库
│   │       └── config/
│   │           └── route.ts            # GET/POST LLM 配置
│   ├── lib/
│   │   ├── db/
│   │   │   └── lancedb.ts              # LanceDB 客户端封装
│   │   ├── rag/
│   │   │   ├── embed.ts                # Embedding 获取
│   │   │   ├── retrieve.ts             # 向量检索
│   │   │   ├── generate.ts             # LLM 生成
│   │   │   └── index.ts                # RAG 统一接口
│   │   ├── review/
│   │   │   ├── dimensions.ts           # 8 维度定义 + prompt
│   │   │   └── pipeline.ts             # 审查管道
│   │   ├── parser/
│   │   │   ├── pdf.ts                  # PDF 解析
│   │   │   ├── word.ts                 # Word 解析
│   │   │   └── index.ts               # 统一接口
│   │   ├── splitter.ts                # 合同条款分段
│   │   ├── store.ts                    # 合同/报告存储 (JSON file)
│   │   ├── config.ts                   # LLM 配置读写
│   │   └── types.ts                    # 共享类型定义
│   └── components/
│       ├── Navbar.tsx                  # 导航栏
│       ├── FileUpload.tsx              # 拖拽上传组件
│       ├── RiskReport.tsx              # 风险报告组件
│       ├── RiskCard.tsx                # 单条风险卡片
│       ├── ChatPanel.tsx               # 对话面板
│       └── LoadingSpinner.tsx          # 加载状态
└── public/
    └── favicon.ico
```

---

### Task 1: 项目初始化与基础配置

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.env.local`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

**Produces:** 可运行的 Next.js 空项目，TypeScript + TailwindCSS 就绪

- [ ] **Step 1: 初始化 package.json**

```bash
cd /Users/sy/codes/rag合同风险审查
cat > package.json << 'EOF'
{
  "name": "contract-review-system",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "vectordb": "^0.4.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.8.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/pdf-parse": "^1.1.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
EOF
```

- [ ] **Step 2: 安装依赖**

Run: `npm install`
Expected: 依赖安装成功，无报错

- [ ] **Step 3: 创建配置文件**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

`postcss.config.js`:
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["vectordb", "pdf-parse", "mammoth"],
  },
};
module.exports = nextConfig;
```

`.env.local`:
```
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

`.gitignore`:
```
node_modules/
.next/
.env.local
data/lance-db/
data/contracts/
data/reports/
```

- [ ] **Step 4: 创建基础布局和样式**

`src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900;
}
```

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "劳动合同风险审查系统",
  description: "基于 AI 的智能合同风险审查",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

`src/components/Navbar.tsx`:
```tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg text-blue-600">
          📋 合同风险审查
        </Link>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ⚙️ 知识库管理
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 5: 创建占位首页验证运行**

`src/app/page.tsx`:
```tsx
export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold mb-4">劳动合同风险审查系统</h1>
      <p className="text-gray-500">上传合同文件，自动识别潜在风险</p>
    </div>
  );
}
```

- [ ] **Step 6: 运行项目验证**

Run: `npm run dev`
Expected: Next.js 启动成功，`http://localhost:3000` 可访问

---

### Task 2: 共享类型定义

**Files:**
- Create: `src/lib/types.ts`

**Interfaces:**
- Produces: `Contract`, `ReviewDimension`, `RiskFinding`, `ReviewReport`, `ChatMessage`, `KBStatus`

- [ ] **Step 1: 写入类型定义**

```ts
// src/lib/types.ts

/** 合同记录 */
export interface Contract {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx";
  content: string;        // 解析后的纯文本
  clauses: Clause[];      // 分段的条款
  uploadedAt: string;
}

export interface Clause {
  index: number;
  title: string;          // 条款标题（如"第七条 竞业限制"）
  content: string;
}

/** 审查维度 */
export interface ReviewDimension {
  key: string;
  name: string;
  description: string;
  prompt: string;         // 审查 prompt
}

/** 单条风险发现 */
export interface RiskFinding {
  id: string;
  dimensionKey: string;
  dimensionName: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  relatedClause: string;  // 引用原文
  legalBasis: string;     // 法律依据
  suggestion: string;     // 修改建议
}

/** 审查报告 */
export interface ReviewReport {
  id: string;
  contractId: string;
  createdAt: string;
  findings: RiskFinding[];
  summary: string;
}

/** 对话消息 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** LLM 配置 */
export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  embeddingModel: string;
}

/** 知识库状态 */
export interface KBStatus {
  built: boolean;
  documentCount: number;
  chunkCount: number;
  lastBuiltAt: string | null;
}
```

---

### Task 3: LLM 配置管理

**Files:**
- Create: `src/lib/config.ts`
- Create: `src/app/api/config/route.ts`

**Interfaces:**
- Produces: `getConfig(): LLMConfig`, `updateConfig(partial): LLMConfig`

- [ ] **Step 1: 配置读写模块**

```ts
// src/lib/config.ts
import { LLMConfig } from "./types";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), ".env.local");

export function getConfig(): LLMConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || "",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  };
}

// 简单验证：不实际调用 API，只检查配置项是否存在
export function validateConfig(config: LLMConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config.apiKey) errors.push("API Key 未设置");
  if (!config.baseUrl) errors.push("API Base URL 未设置");
  if (!config.model) errors.push("LLM 模型未设置");
  if (!config.embeddingModel) errors.push("Embedding 模型未设置");
  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 2: 配置 API**

```ts
// src/app/api/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export async function GET() {
  const config = getConfig();
  return NextResponse.json({
    ...config,
    apiKey: config.apiKey ? "***" + config.apiKey.slice(-4) : "", // 掩码
  });
}

export async function POST(req: NextRequest) {
  // 配置通过 .env.local 管理，这里只做验证
  const body = await req.json();
  const config = getConfig();
  return NextResponse.json({ status: "ok", model: config.model });
}
```

---

### Task 4: 法律知识库源文件

**Files:**
- Create: `data/knowledge/labor-contract-law.md`
- Create: `data/knowledge/labor-law.md`
- Create: `data/knowledge/social-insurance-law.md`
- Create: `data/knowledge/judicial-interpretations.md`
- Create: `data/knowledge/regulations.md`

- [ ] **Step 1: 劳动合同法全文**

`data/knowledge/labor-contract-law.md`:
```markdown
# 中华人民共和国劳动合同法

## 第一章 总则

### 第一条
为了完善劳动合同制度，明确劳动合同双方当事人的权利和义务，保护劳动者的合法权益，构建和发展和谐稳定的劳动关系，制定本法。

### 第二条
中华人民共和国境内的企业、个体经济组织、民办非企业单位等组织（以下称用人单位）与劳动者建立劳动关系，订立、履行、变更、解除或者终止劳动合同，适用本法。

## 第二章 劳动合同的订立

### 第十条
建立劳动关系，应当订立书面劳动合同。
已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。
用人单位与劳动者在用工前订立劳动合同的，劳动关系自用工之日起建立。

### 第十七条
劳动合同应当具备以下条款：
（一）用人单位的名称、住所和法定代表人或者主要负责人；
（二）劳动者的姓名、住址和居民身份证或者其他有效身份证件号码；
（三）劳动合同期限；
（四）工作内容和工作地点；
（五）工作时间和休息休假；
（六）劳动报酬；
（七）社会保险；
（八）劳动保护、劳动条件和职业危害防护；
（九）法律、法规规定应当纳入劳动合同的其他事项。
劳动合同除前款规定的必备条款外，用人单位与劳动者可以约定试用期、培训、保守秘密、补充保险和福利待遇等其他事项。

### 第十九条
劳动合同期限三个月以上不满一年的，试用期不得超过一个月；劳动合同期限一年以上不满三年的，试用期不得超过二个月；三年以上固定期限和无固定期限的劳动合同，试用期不得超过六个月。
同一用人单位与同一劳动者只能约定一次试用期。
以完成一定工作任务为期限的劳动合同或者劳动合同期限不满三个月的，不得约定试用期。
试用期包含在劳动合同期限内。劳动合同仅约定试用期的，试用期不成立，该期限为劳动合同期限。

### 第二十条
劳动者在试用期的工资不得低于本单位相同岗位最低档工资或者劳动合同约定工资的百分之八十，并不得低于用人单位所在地的最低工资标准。

### 第二十二条
用人单位为劳动者提供专项培训费用，对其进行专业技术培训的，可以与该劳动者订立协议，约定服务期。
劳动者违反服务期约定的，应当按照约定向用人单位支付违约金。违约金的数额不得超过用人单位提供的培训费用。用人单位要求劳动者支付的违约金不得超过服务期尚未履行部分所应分摊的培训费用。
用人单位与劳动者约定服务期的，不影响按照正常的工资调整机制提高劳动者在服务期期间的劳动报酬。

### 第二十三条
用人单位与劳动者可以在劳动合同中约定保守用人单位的商业秘密和与知识产权相关的保密事项。
对负有保密义务的劳动者，用人单位可以在劳动合同或者保密协议中与劳动者约定竞业限制条款，并约定在解除或者终止劳动合同后，在竞业限制期限内按月给予劳动者经济补偿。劳动者违反竞业限制约定的，应当按照约定向用人单位支付违约金。

### 第二十四条
竞业限制的人员限于用人单位的高级管理人员、高级技术人员和其他负有保密义务的人员。竞业限制的范围、地域、期限由用人单位与劳动者约定，竞业限制的约定不得违反法律、法规的规定。
在解除或者终止劳动合同后，前款规定的人员到与本单位生产或者经营同类产品、从事同类业务的有竞争关系的其他用人单位，或者自己开业生产或者经营同类产品、从事同类业务的竞业限制期限，不得超过二年。

### 第二十五条
除本法第二十二条和第二十三条规定的情形外，用人单位不得与劳动者约定由劳动者承担违约金。

### 第二十六条
下列劳动合同无效或者部分无效：
（一）以欺诈、胁迫的手段或者乘人之危，使对方在违背真实意思的情况下订立或者变更劳动合同的；
（二）用人单位免除自己的法定责任、排除劳动者权利的；
（三）违反法律、行政法规强制性规定的。
对劳动合同的无效或者部分无效有争议的，由劳动争议仲裁机构或者人民法院确认。

## 第四章 劳动合同的解除和终止

### 第三十六条
用人单位与劳动者协商一致，可以解除劳动合同。

### 第三十七条
劳动者提前三十日以书面形式通知用人单位，可以解除劳动合同。劳动者在试用期内提前三日通知用人单位，可以解除劳动合同。

### 第三十八条
用人单位有下列情形之一的，劳动者可以解除劳动合同：
（一）未按照劳动合同约定提供劳动保护或者劳动条件的；
（二）未及时足额支付劳动报酬的；
（三）未依法为劳动者缴纳社会保险费的；
（四）用人单位的规章制度违反法律、法规的规定，损害劳动者权益的；
（五）因本法第二十六条第一款规定的情形致使劳动合同无效的；
（六）法律、行政法规规定劳动者可以解除劳动合同的其他情形。
用人单位以暴力、威胁或者非法限制人身自由的手段强迫劳动者劳动的，或者用人单位违章指挥、强令冒险作业危及劳动者人身安全的，劳动者可以立即解除劳动合同，不需事先告知用人单位。

### 第三十九条
劳动者有下列情形之一的，用人单位可以解除劳动合同：
（一）在试用期间被证明不符合录用条件的；
（二）严重违反用人单位的规章制度的；
（三）严重失职，营私舞弊，给用人单位造成重大损害的；
（四）劳动者同时与其他用人单位建立劳动关系，对完成本单位的工作任务造成严重影响，或者经用人单位提出，拒不改正的；
（五）因本法第二十六条第一款第一项规定的情形致使劳动合同无效的；
（六）被依法追究刑事责任的。

### 第四十条
有下列情形之一的，用人单位提前三十日以书面形式通知劳动者本人或者额外支付劳动者一个月工资后，可以解除劳动合同：
（一）劳动者患病或者非因工负伤，在规定的医疗期满后不能从事原工作，也不能从事由用人单位另行安排的工作的；
（二）劳动者不能胜任工作，经过培训或者调整工作岗位，仍不能胜任工作的；
（三）劳动合同订立时所依据的客观情况发生重大变化，致使劳动合同无法履行，经用人单位与劳动者协商，未能就变更劳动合同内容达成协议的。

### 第四十六条
有下列情形之一的，用人单位应当向劳动者支付经济补偿：
（一）劳动者依照本法第三十八条规定解除劳动合同的；
（二）用人单位依照本法第三十六条规定向劳动者提出解除劳动合同并与劳动者协商一致解除劳动合同的；
（三）用人单位依照本法第四十条规定解除劳动合同的；
（四）用人单位依照本法第四十一条第一款规定解除劳动合同的；
（五）除用人单位维持或者提高劳动合同约定条件续订劳动合同，劳动者不同意续订的情形外，依照本法第四十四条第一项规定终止固定期限劳动合同的；
（六）依照本法第四十四条第四项、第五项规定终止劳动合同的；
（七）法律、行政法规规定的其他情形。

### 第四十七条
经济补偿按劳动者在本单位工作的年限，每满一年支付一个月工资的标准向劳动者支付。六个月以上不满一年的，按一年计算；不满六个月的，向劳动者支付半个月工资的经济补偿。
劳动者月工资高于用人单位所在直辖市、设区的市级人民政府公布的本地区上年度职工月平均工资三倍的，向其支付经济补偿的标准按职工月平均工资三倍的数额支付，向其支付经济补偿的年限最高不超过十二年。
本条所称月工资是指劳动者在劳动合同解除或者终止前十二个月的平均工资。

### 第四十八条
用人单位违反本法规定解除或者终止劳动合同，劳动者要求继续履行劳动合同的，用人单位应当继续履行；劳动者不要求继续履行劳动合同或者劳动合同已经不能继续履行的，用人单位应当依照本法第八十七条规定支付赔偿金。

### 第八十七条
用人单位违反本法规定解除或者终止劳动合同的，应当依照本法第四十七条规定的经济补偿标准的二倍向劳动者支付赔偿金。

## 第七章 法律责任

### 第八十二条
用人单位自用工之日起超过一个月不满一年未与劳动者订立书面劳动合同的，应当向劳动者每月支付二倍的工资。
用人单位违反本法规定不与劳动者订立无固定期限劳动合同的，自应当订立无固定期限劳动合同之日起向劳动者每月支付二倍的工资。
```

- [ ] **Step 2: 劳动法**

`data/knowledge/labor-law.md`:
```markdown
# 中华人民共和国劳动法

## 第四章 工作时间和休息休假

### 第三十六条
国家实行劳动者每日工作时间不超过八小时、平均每周工作时间不超过四十四小时的工时制度。

### 第三十八条
用人单位应当保证劳动者每周至少休息一日。

### 第四十一条
用人单位由于生产经营需要，经与工会和劳动者协商后可以延长工作时间，一般每日不得超过一小时；因特殊原因需要延长工作时间的，在保障劳动者身体健康的条件下延长工作时间每日不得超过三小时，但是每月不得超过三十六小时。

### 第四十四条
有下列情形之一的，用人单位应当按照下列标准支付高于劳动者正常工作时间工资的工资报酬：
（一）安排劳动者延长工作时间的，支付不低于工资的百分之一百五十的工资报酬；
（二）休息日安排劳动者工作又不能安排补休的，支付不低于工资的百分之二百的工资报酬；
（三）法定休假日安排劳动者工作的，支付不低于工资的百分之三百的工资报酬。

### 第四十五条
国家实行带薪年休假制度。
劳动者连续工作一年以上的，享受带薪年休假。具体办法由国务院规定。

## 第五章 工资

### 第四十八条
国家实行最低工资保障制度。最低工资的具体标准由省、自治区、直辖市人民政府规定，报国务院备案。
用人单位支付劳动者的工资不得低于当地最低工资标准。

### 第五十条
工资应当以货币形式按月支付给劳动者本人。不得克扣或者无故拖欠劳动者的工资。

### 第五十一条
劳动者在法定休假日和婚丧假期间以及依法参加社会活动期间，用人单位应当依法支付工资。

## 第七章 女职工和未成年工特殊保护

### 第六十二条
女职工生育享受不少于九十天的产假。

## 第九章 社会保险和福利

### 第七十二条
社会保险基金按照保险类型确定资金来源，逐步实行社会统筹。用人单位和劳动者必须依法参加社会保险，缴纳社会保险费。

### 第七十三条
劳动者在下列情形下，依法享受社会保险待遇：
（一）退休；
（二）患病、负伤；
（三）因工伤残或者患职业病；
（四）失业；
（五）生育。
劳动者死亡后，其遗属依法享受遗属津贴。
```

- [ ] **Step 3: 社会保险法**

`data/knowledge/social-insurance-law.md`:
```markdown
# 中华人民共和国社会保险法

### 第二条
国家建立基本养老保险、基本医疗保险、工伤保险、失业保险、生育保险等社会保险制度，保障公民在年老、疾病、工伤、失业、生育等情况下依法从国家和社会获得物质帮助的权利。

### 第十条
职工应当参加基本养老保险，由用人单位和职工共同缴纳基本养老保险费。

### 第二十三条
职工应当参加职工基本医疗保险，由用人单位和职工按照国家规定共同缴纳基本医疗保险费。

### 第三十三条
职工应当参加工伤保险，由用人单位缴纳工伤保险费，职工不缴纳工伤保险费。

### 第四十四条
职工应当参加失业保险，由用人单位和职工按照国家规定共同缴纳失业保险费。

### 第五十三条
职工应当参加生育保险，由用人单位按照国家规定缴纳生育保险费，职工不缴纳生育保险费。

### 第五十八条
用人单位应当自用工之日起三十日内为其职工向社会保险经办机构申请办理社会保险登记。
未办理社会保险登记的，由社会保险经办机构核定其应当缴纳的社会保险费。

### 第六十条
用人单位应当自行申报、按时足额缴纳社会保险费，非因不可抗力等法定事由不得缓缴、减免。职工应当缴纳的社会保险费由用人单位代扣代缴，用人单位应当按月将缴纳社会保险费的明细情况告知本人。

### 第六十三条
用人单位未按时足额缴纳社会保险费的，由社会保险费征收机构责令其限期缴纳或者补足。

### 第八十六条
用人单位未按时足额缴纳社会保险费的，由社会保险费征收机构责令限期缴纳或者补足，并自欠缴之日起，按日加收万分之五的滞纳金；逾期仍不缴纳的，由有关行政部门处欠缴数额一倍以上三倍以下的罚款。
```

- [ ] **Step 4: 司法解释**

`data/knowledge/judicial-interpretations.md`:
```markdown
# 最高人民法院关于审理劳动争议案件适用法律问题的解释

## 一、关于审理劳动争议案件的司法解释（一）

### 第一条
劳动者与用人单位之间发生的下列纠纷，属于劳动争议，当事人不服劳动争议仲裁机构作出的裁决，依法提起诉讼的，人民法院应予受理：
（一）劳动者与用人单位在履行劳动合同过程中发生的纠纷；
（二）劳动者与用人单位之间没有订立书面劳动合同，但已形成劳动关系后发生的纠纷；
（三）劳动者与用人单位因劳动关系是否已经解除或者终止，以及应否支付解除或者终止劳动关系经济补偿金发生的纠纷；
（四）劳动者与用人单位解除或者终止劳动关系后，请求用人单位返还其收取的劳动合同定金、保证金、抵押金、抵押物发生的纠纷，或者办理劳动者的人事档案、社会保险关系等移转手续发生的纠纷；
（五）劳动者以用人单位未为其办理社会保险手续，且社会保险经办机构不能补办导致其无法享受社会保险待遇为由，要求用人单位赔偿损失发生的纠纷；
（六）劳动者退休后，与尚未参加社会保险统筹的原用人单位因追索养老金、医疗费、工伤保险待遇和其他社会保险待遇而发生的纠纷。

### 第四十五条
用人单位有下列情形之一，迫使劳动者提出解除劳动合同的，用人单位应当支付劳动者的劳动报酬和经济补偿，并可支付赔偿金：
（一）以暴力、威胁或者非法限制人身自由的手段强迫劳动的；
（二）未按照劳动合同约定支付劳动报酬或者提供劳动条件的；
（三）克扣或者无故拖欠劳动者工资的；
（四）拒不支付劳动者延长工作时间工资报酬的；
（五）低于当地最低工资标准支付劳动者工资的。

## 二、关于审理劳动争议案件的司法解释（四）——竞业限制

### 第六条
当事人在劳动合同或者保密协议中约定了竞业限制，但未约定解除或者终止劳动合同后给予劳动者经济补偿，劳动者履行了竞业限制义务，要求用人单位按照劳动者在劳动合同解除或者终止前十二个月平均工资的30%按月支付经济补偿的，人民法院应予支持。
前款规定的月平均工资的30%低于劳动合同履行地最低工资标准的，按照劳动合同履行地最低工资标准支付。

### 第七条
当事人在劳动合同或者保密协议中约定了竞业限制和经济补偿，当事人解除劳动合同时，除另有约定外，用人单位要求劳动者履行竞业限制义务，或者劳动者履行了竞业限制义务后要求用人单位支付经济补偿的，人民法院应予支持。

### 第八条
当事人在劳动合同或者保密协议中约定了竞业限制和经济补偿，劳动合同解除或者终止后，因用人单位的原因导致三个月未支付经济补偿，劳动者请求解除竞业限制约定的，人民法院应予支持。

### 第十条
劳动者违反竞业限制约定，向用人单位支付违约金后，用人单位要求劳动者按照约定继续履行竞业限制义务的，人民法院应予支持。

## 三、关于审理劳动争议案件的司法解释（五）——工伤

### 第一条
劳动者以用人单位未为其办理工伤保险手续，且社会保险经办机构不能补办导致其无法享受工伤保险待遇为由，要求用人单位赔偿损失发生的纠纷，人民法院应予受理。

## 四、关于审理劳动争议案件适用法律问题的解释（二）

### 第四条
用人单位与劳动者约定了竞业限制条款，但未约定经济补偿的，该竞业限制条款对劳动者不具有约束力。劳动者履行了竞业限制义务的，有权要求用人单位支付经济补偿，经济补偿标准为劳动者在解除或者终止劳动合同前十二个月平均工资的30%。
```

- [ ] **Step 5: 其他法规**

`data/knowledge/regulations.md`:
```markdown
# 相关劳动法规

## 职工带薪年休假条例

### 第三条
职工累计工作已满1年不满10年的，年休假5天；已满10年不满20年的，年休假10天；已满20年的，年休假15天。
国家法定休假日、休息日不计入年休假的假期。

### 第五条
单位根据生产、工作的具体情况，并考虑职工本人意愿，统筹安排职工年休假。
年休假在1个年度内可以集中安排，也可以分段安排，一般不跨年度安排。单位因生产、工作特点确有必要跨年度安排职工年休假的，可以跨1个年度安排。
单位确因工作需要不能安排职工休年休假的，经职工本人同意，可以不安排职工休年休假。对职工应休未休的年休假天数，单位应当按照该职工日工资收入的300%支付年休假工资报酬。

## 工伤保险条例

### 第十四条
职工有下列情形之一的，应当认定为工伤：
（一）在工作时间和工作场所内，因工作原因受到事故伤害的；
（二）工作时间前后在工作场所内，从事与工作有关的预备性或者收尾性工作受到事故伤害的；
（三）在工作时间和工作场所内，因履行工作职责受到暴力等意外伤害的；
（四）患职业病的；
（五）因工外出期间，由于工作原因受到伤害或者发生事故下落不明的；
（六）在上下班途中，受到非本人主要责任的交通事故或者城市轨道交通、客运轮渡、火车事故伤害的；
（七）法律、行政法规规定应当认定为工伤的其他情形。

## 工资支付暂行规定

### 第七条
工资必须在用人单位与劳动者约定的日期支付。如遇节假日或休息日，则应提前在最近的工作日支付。工资至少每月支付一次，实行周、日、小时工资制的可按周、日、小时支付工资。

### 第九条
劳动关系双方依法解除或终止劳动合同时，用人单位应在解除或终止劳动合同时一次付清劳动者工资。

### 第十八条
各级劳动行政部门有权监察用人单位工资支付的情况。用人单位有下列侵害劳动者合法权益行为的，由劳动行政部门责令其支付劳动者工资和经济补偿，并可责令其支付赔偿金：
（一）克扣或者无故拖欠劳动者工资的；
（二）拒不支付劳动者延长工作时间工资的；
（三）低于当地最低工资标准支付劳动者工资的。

## 女职工劳动保护特别规定

### 第七条
女职工生育享受98天产假，其中产前可以休假15天；难产的，增加产假15天；生育多胞胎的，每多生育1个婴儿，增加产假15天。
女职工怀孕未满4个月流产的，享受15天产假；怀孕满4个月流产的，享受42天产假。

### 第九条
对哺乳未满1周岁婴儿的女职工，用人单位不得延长劳动时间或者安排夜班劳动。
用人单位应当在每天的劳动时间内为哺乳期女职工安排1小时哺乳时间；女职工生育多胞胎的，每多哺乳1个婴儿每天增加1小时哺乳时间。

## 最低工资规定

### 第三条
本规定所称最低工资标准，是指劳动者在法定工作时间或依法签订的劳动合同约定的工作时间内提供了正常劳动的前提下，用人单位依法应支付的最低劳动报酬。

### 第十二条
在劳动者提供正常劳动的情况下，用人单位应支付给劳动者的工资在剔除下列各项以后，不得低于当地最低工资标准：
（一）延长工作时间工资；
（二）中班、夜班、高温、低温、井下、有毒有害等特殊工作环境、条件下的津贴；
（三）法律、法规和国家规定的劳动者福利待遇等。
```

---

### Task 5: LanceDB 向量库封装

**Files:**
- Create: `src/lib/db/lancedb.ts`

**Interfaces:**
- Produces: `initDB(): Promise<void>`, `addVectors(vectors: Array<{id: string, vector: number[], metadata: any}>): Promise<void>`, `search(vector: number[], limit?: number): Promise<Array<{id: string, metadata: any, score: number}>>`, `tableExists(): Promise<boolean>`, `getStats(): Promise<{count: number}>`

- [ ] **Step 1: 实现 LanceDB 客户端**

```ts
// src/lib/db/lancedb.ts
import * as lancedb from "vectordb";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "lance-db");
const TABLE_NAME = "legal_knowledge";

let db: lancedb.Connection | null = null;
let table: lancedb.Table | null = null;

async function getDB(): Promise<lancedb.Connection> {
  if (!db) {
    db = await lancedb.connect(DB_PATH);
  }
  return db;
}

export async function tableExists(): Promise<boolean> {
  try {
    const database = await getDB();
    const tables = await database.tableNames();
    return tables.includes(TABLE_NAME);
  } catch {
    return false;
  }
}

export async function initTable(dimensions: number = 1536): Promise<lancedb.Table> {
  const database = await getDB();
  // 如果表已存在，直接打开
  const exists = await tableExists();
  if (exists) {
    table = await database.openTable(TABLE_NAME);
    return table;
  }
  // 创建新表
  table = await database.createTable(TABLE_NAME, [
    { vector: Array(dimensions).fill(0), id: "_init_", content: "", source: "" },
  ]);
  // 删除初始化行
  await table.delete('id = "_init_"');
  return table;
}

export async function addVectors(
  records: Array<{ id: string; vector: number[]; content: string; source: string }>
): Promise<void> {
  const tbl = table || (await initTable(records[0]?.vector.length || 1536));
  await tbl.add(records);
}

export async function search(
  vector: number[],
  limit: number = 5
): Promise<Array<{ id: string; content: string; source: string; score: number }>> {
  const tbl = table || (await initTable(vector.length));
  const results = await tbl.search(vector).limit(limit).execute();
  return (results as any[]).map((r) => ({
    id: r.id as string,
    content: r.content as string,
    source: r.source as string,
    score: 1 - (r._distance as number), // 转换为相似度分数
  }));
}

export async function getStats(): Promise<{ count: number }> {
  if (!table) return { count: 0 };
  const result = await table.countRows();
  return { count: result };
}
```

---

### Task 6: Embedding 与 RAG 引擎

**Files:**
- Create: `src/lib/rag/embed.ts`
- Create: `src/lib/rag/retrieve.ts`
- Create: `src/lib/rag/generate.ts`
- Create: `src/lib/rag/index.ts`

**Interfaces:**
- Consumes: `src/lib/db/lancedb.ts` (addVectors, search, tableExists, getStats), `src/lib/config.ts` (getConfig)
- Produces: `embed(texts: string[]): Promise<number[][]>`, `buildKB(docs: Array<{content: string, source: string}>): Promise<{chunkCount: number}>`, `queryRAG(question: string, context?: string): Promise<string>`

- [ ] **Step 1: Embedding 客户端**

```ts
// src/lib/rag/embed.ts
import { getConfig } from "@/lib/config";

export async function embed(texts: string[]): Promise<number[][]> {
  const config = getConfig();
  const response = await fetch(`${config.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.embeddingModel,
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.data.map((d: any) => d.embedding);
}

/** 单个文本 embedding */
export async function embedOne(text: string): Promise<number[]> {
  const results = await embed([text]);
  return results[0];
}
```

- [ ] **Step 2: 法律知识库构建**

```ts
// src/lib/rag/index.ts
import { embed } from "./embed";
import { addVectors, tableExists, getStats, search } from "@/lib/db/lancedb";
import { generateChat } from "./generate";
import crypto from "crypto";

const CHUNK_SIZE = 500; // 每个 chunk 约 500 字符

/** 将长文本切分为 chunks */
function chunkText(text: string, source: string, chunkSize = CHUNK_SIZE): Array<{
  id: string;
  content: string;
  source: string;
}> {
  const paragraphs = text.split(/\n\n+/);
  const chunks: Array<{ id: string; content: string; source: string }> = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + para).length > chunkSize && current.length > 0) {
      const hash = crypto.createHash("md5").update(current).digest("hex").slice(0, 12);
      chunks.push({ id: hash, content: current.trim(), source });
      current = para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }

  if (current.trim().length > 0) {
    const hash = crypto.createHash("md5").update(current).digest("hex").slice(0, 12);
    chunks.push({ id: hash, content: current.trim(), source });
  }

  return chunks;
}

/** 构建知识库：重头构建 */
export async function buildKnowledgeBase(
  docs: Array<{ content: string; source: string }>
): Promise<{ chunkCount: number }> {
  const allChunks: Array<{ id: string; content: string; source: string }> = [];

  for (const doc of docs) {
    const chunks = chunkText(doc.content, doc.source);
    allChunks.push(...chunks);
  }

  // 批量获取 embeddings
  const batchSize = 20;
  const vectors: Array<{ id: string; vector: number[]; content: string; source: string }> = [];

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const embeddings = await embed(batch.map((c) => c.content));
    for (let j = 0; j < batch.length; j++) {
      vectors.push({ ...batch[j], vector: embeddings[j] });
    }
  }

  // 存入 LanceDB
  await addVectors(vectors);

  return { chunkCount: vectors.length };
}

/** RAG 查询 */
export async function queryRAG(
  question: string,
  topK: number = 5
): Promise<{ answer: string; sources: Array<{ content: string; source: string }> }> {
  const { embedOne } = await import("./embed");
  const { generateChat } = await import("./generate");

  const qVector = await embedOne(question);
  const results = await search(qVector, topK);

  const sources = results.map((r) => ({ content: r.content, source: r.source }));
  const context = sources.map((s, i) => `[法条${i + 1}] (${s.source})\n${s.content}`).join("\n\n");

  const answer = await generateChat(question, context);

  return { answer, sources };
}
```

- [ ] **Step 3: LLM 生成**

```ts
// src/lib/rag/generate.ts
import { getConfig } from "@/lib/config";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateChat(
  userMessage: string,
  context?: string,
  systemPrompt?: string,
  history: ChatMessage[] = []
): Promise<string> {
  const config = getConfig();

  const messages: ChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  if (context) {
    const ctxMsg = systemPrompt
      ? `\n\n参考以下法律法规：\n\n${context}`
      : `你是一位精通中国劳动法律法规的专家。请基于以下法律条文回答问题。\n\n参考法规：\n\n${context}`;
    messages.push({ role: "system", content: ctxMsg });
  } else if (!systemPrompt) {
    messages.push({
      role: "system",
      content: "你是一位精通中国劳动法律法规的专家，请专业、准确地回答用户的问题。",
    });
  }

  messages.push(...history);
  messages.push({ role: "user", content: userMessage });

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

---

### Task 7: 文档解析器

**Files:**
- Create: `src/lib/parser/pdf.ts`
- Create: `src/lib/parser/word.ts`
- Create: `src/lib/parser/index.ts`

**Interfaces:**
- Produces: `parseDocument(fileBuffer: Buffer, fileType: 'pdf' | 'docx'): Promise<string>`

- [ ] **Step 1: PDF 解析**

```ts
// src/lib/parser/pdf.ts
import pdfParse from "pdf-parse";

export async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
```

- [ ] **Step 2: Word 解析**

```ts
// src/lib/parser/word.ts
import mammoth from "mammoth";

export async function parseWord(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
```

- [ ] **Step 3: 统一接口**

```ts
// src/lib/parser/index.ts
import { parsePDF } from "./pdf";
import { parseWord } from "./word";

export type FileType = "pdf" | "docx";

export async function parseDocument(buffer: Buffer, fileType: FileType): Promise<string> {
  if (fileType === "pdf") return parsePDF(buffer);
  if (fileType === "docx") return parseWord(buffer);
  throw new Error(`Unsupported file type: ${fileType}`);
}
```

---

### Task 8: 合同条款分段器

**Files:**
- Create: `src/lib/splitter.ts`

**Interfaces:**
- Produces: `splitClauses(text: string): Clause[]`

- [ ] **Step 1: 实现分段器**

```ts
// src/lib/splitter.ts
import { Clause } from "./types";

/** 将合同文本拆分为条款 */
export function splitClauses(text: string): Clause[] {
  // 按常见条款模式拆分：第X条、第X章、一、二、三、等
  const clausePattern = /(?:^|\n)\s*(?:第[一二三四五六七八九十百千\d]+(?:章|节|条)|[（(][一二三四五六七八九十\d]+[）)])\s*[^\n]*/g;

  const matches = text.match(clausePattern);
  if (!matches || matches.length === 0) {
    // 退而求其次：按段落拆分
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 10);
    return paragraphs.map((content, i) => ({
      index: i,
      title: `第${i + 1}条`,
      content: content.trim(),
    }));
  }

  // 以匹配位置为界拆分
  const clauses: Clause[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    const idx = text.indexOf(match, lastIndex);
    if (idx > lastIndex) {
      // 前一个条款的剩余内容
    }
    lastIndex = idx;
  }

  // 重新用正则索引拆分
  const parts: Array<{ title: string; content: string }> = [];
  let matchResult: RegExpExecArray | null;
  const regex = new RegExp(clausePattern.source, "g");
  let prevEnd = 0;
  let prevTitle = "前言";

  while ((matchResult = regex.exec(text)) !== null) {
    if (matchResult.index > prevEnd && parts.length === 0) {
      // 前言内容
      const preContent = text.slice(0, matchResult.index).trim();
      if (preContent.length > 20) {
        parts.push({ title: "前言", content: preContent });
      }
    }
    if (parts.length > 0 || prevEnd > 0) {
      const content = text.slice(prevEnd, matchResult.index).trim();
      if (content.length > 5) {
        parts[parts.length - 1].content = content;
      }
    }
    parts.push({ title: matchResult[0].trim(), content: "" });
    prevEnd = matchResult.index + matchResult[0].length;
  }

  // 最后一段
  if (prevEnd < text.length) {
    const content = text.slice(prevEnd).trim();
    if (parts.length > 0 && content.length > 5) {
      parts[parts.length - 1].content = content;
    }
  }

  return parts
    .filter((p) => p.content.length > 5)
    .map((p, i) => ({
      index: i,
      title: p.title,
      content: p.content,
    }));
}
```

---

### Task 9: 8 维度审查引擎

**Files:**
- Create: `src/lib/review/dimensions.ts`
- Create: `src/lib/review/pipeline.ts`

**Interfaces:**
- Consumes: `src/lib/types.ts` (ReviewDimension, RiskFinding, Contract), `src/lib/rag/retrieve.ts` (search), `src/lib/rag/embed.ts` (embedOne), `src/lib/rag/generate.ts` (generateChat)
- Produces: `runReview(contract: Contract): Promise<RiskFinding[]>`

- [ ] **Step 1: 维度定义**

```ts
// src/lib/review/dimensions.ts
import { ReviewDimension } from "@/lib/types";

export const REVIEW_DIMENSIONS: ReviewDimension[] = [
  {
    key: "mandatory_clauses",
    name: "法定必备条款",
    description: "检查劳动合同是否包含《劳动合同法》第十七条规定的全部必备条款",
    prompt: `你是一位劳动法专家。请审查以下劳动合同条款，检查是否包含《劳动合同法》第十七条规定的全部必备条款：
1. 用人单位名称、住所和法定代表人
2. 劳动者姓名、住址和身份证号
3. 劳动合同期限
4. 工作内容和工作地点
5. 工作时间和休息休假
6. 劳动报酬
7. 社会保险
8. 劳动保护、劳动条件和职业危害防护

请逐项检查，指出缺失的条款，并给出法律依据和修改建议。对每个发现的问题，按以下JSON格式输出：
{"findings":[{"title":"...","description":"...","severity":"high/medium/low","legalBasis":"...","suggestion":"..."}]}`,
  },
  {
    key: "probation",
    name: "试用期合规性",
    description: "检查试用期时长是否超限、试用期工资是否达标",
    prompt: `你是一位劳动法专家。请审查以下劳动合同中的试用期条款。根据《劳动合同法》第十九条和第二十条：

- 合同期3个月以上不满1年 → 试用期≤1个月
- 合同期1年以上不满3年 → 试用期≤2个月
- 3年以上固定期限/无固定期限 → 试用期≤6个月
- 不满3个月/以完成一定任务为期限 → 不得约定试用期
- 同一用人单位与同一劳动者只能约定一次试用期
- 试用期工资≥约定工资的80% 且 ≥当地最低工资标准

请检查试用期约定是否合规，按JSON格式输出发现的问题。`,
  },
  {
    key: "penalty",
    name: "违约金条款",
    description: "检查违约金约定是否超出法定范围",
    prompt: `你是一位劳动法专家。请审查以下劳动合同中的违约金条款。根据《劳动合同法》第二十二条、第二十三条和第二十五条：

法律仅允许在两种情形下约定由劳动者承担的违约金：
1. 培训服务期违约金（第二十二条）：数额不超过培训费用，按未履行服务期比例分摊
2. 竞业限制违约金（第二十三条）：仅适用于高级管理人员、高级技术人员和其他保密人员

除此之外的任何违约金条款均属违法。请逐项检查，按JSON格式输出发现的问题。`,
  },
  {
    key: "non_compete",
    name: "竞业限制合规性",
    description: "检查竞业限制人员范围、期限、经济补偿",
    prompt: `你是一位劳动法专家。请审查以下劳动合同中的竞业限制条款。根据《劳动合同法》第二十三条、第二十四条及司法解释四：

- 竞业限制人员限于高级管理人员、高级技术人员和其他负有保密义务的人员
- 竞业限制期限不得超过2年
- 竞业限制期间需按月支付经济补偿
- 未约定经济补偿的，按离职前12个月平均工资的30%（不低于最低工资标准）支付
- 因用人单位原因3个月未支付补偿，劳动者可请求解除竞业限制

请逐项检查合规性，按JSON格式输出发现的问题。`,
  },
  {
    key: "working_hours",
    name: "工时与休假",
    description: "检查工时制度、加班费、年休假等条款",
    prompt: `你是一位劳动法专家。请审查以下劳动合同中关于工作时间、加班和休假的条款。根据《劳动法》第四章：

- 每日工作≤8小时，每周≤44小时（第三十六条）
- 每周至少休息1日（第三十八条）
- 加班每日≤1小时，特殊≤3小时，每月≤36小时（第四十一条）
- 加班费：延长150%、休息日200%、法定假日300%（第四十四条）
- 连续工作1年以上享受带薪年休假（第四十五条）
- 年休假天数：1-10年5天、10-20年10天、20年以上15天

请逐项检查合规性，按JSON格式输出发现的问题。`,
  },
  {
    key: "social_insurance",
    name: "社保缴纳",
    description: "检查社保条款是否合规",
    prompt: `你是一位劳动法专家。请审查以下劳动合同中关于社会保险的条款。根据《社会保险法》：

- 用人单位应在用工之日起30日内为职工办理社保登记（第五十八条）
- 五险：养老、医疗、工伤、失业、生育（第二条）
- 养老、医疗、失业保险由单位和个人共同缴纳
- 工伤、生育保险由单位缴纳
- 缴费基数应为职工实际工资
- 不得以任何形式约定不缴或折现

请逐项检查合规性，按JSON格式输出发现的问题。`,
  },
  {
    key: "termination",
    name: "解除/终止合同",
    description: "检查解除条件、经济补偿条款是否合法",
    prompt: `你是一位劳动法专家。请审查以下劳动合同中关于解除和终止合同的条款。根据《劳动合同法》第四章：

- 协商一致可解除（第三十六条）
- 劳动者提前30日书面通知可解除，试用期提前3日（第三十七条）
- 单位过错下的劳动者解除权（第三十八条）
- 劳动者过错下的单位解除权（第三十九条）
- 无过失性辞退需提前30日通知或支付代通知金（第四十条）
- 经济补偿情形（第四十六条）：每满1年支付1个月工资
- 违法解除的赔偿金为经济补偿标准的2倍（第八十七条）

请逐项检查合规性，按JSON格式输出发现的问题。`,
  },
  {
    key: "wage_payment",
    name: "工资支付",
    description: "检查工资支付周期、最低工资、加班基数等",
    prompt: `你是一位劳动法专家。请审查以下劳动合同中关于工资支付的条款。根据《劳动法》和《工资支付暂行规定》：

- 工资应以货币形式按月支付（第五十条）
- 不得低于当地最低工资标准（第四十八条）
- 工资支付日遇节假日应提前支付（暂行规定第七条）
- 解除或终止劳动合同时应一次付清工资（暂行规定第九条）
- 加班工资计算基数应符合规定
- 最低工资不含加班费、特殊津贴和福利待遇

请逐项检查合规性，按JSON格式输出发现的问题。`,
  },
];
```

- [ ] **Step 2: 审查管道**

```ts
// src/lib/review/pipeline.ts
import { Contract, RiskFinding } from "@/lib/types";
import { REVIEW_DIMENSIONS } from "./dimensions";
import { generateChat } from "@/lib/rag/generate";
import { embedOne } from "@/lib/rag/embed";
import { search } from "@/lib/db/lancedb";
import crypto from "crypto";

function parseFindings(text: string, dimensionKey: string, dimensionName: string, contractId: string): RiskFinding[] {
  try {
    // 尝试提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*"findings"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return (parsed.findings || []).map((f: any, i: number) => ({
        id: crypto.createHash("md5").update(`${contractId}-${dimensionKey}-${i}`).digest("hex").slice(0, 12),
        dimensionKey,
        dimensionName,
        severity: f.severity || "medium",
        title: f.title || "未命名风险",
        description: f.description || "",
        relatedClause: f.relatedClause || "",
        legalBasis: f.legalBasis || "",
        suggestion: f.suggestion || "",
      }));
    }
  } catch {
    // JSON 解析失败，尝试从文本中抽取
  }
  return [];
}

export async function reviewDimension(
  contract: Contract,
  dimension: typeof REVIEW_DIMENSIONS[0]
): Promise<RiskFinding[]> {
  // 1. 为审查维度检索相关法条
  const dimVector = await embedOne(dimension.description);
  const relevantLaws = await search(dimVector, 5);

  const lawContext = relevantLaws
    .map((r, i) => `[参考法条${i + 1}] (${r.source})\n${r.content}`)
    .join("\n\n");

  // 2. 构建审查 prompt
  const userPrompt = `请审查以下劳动合同内容（部分条款）：

${contract.clauses.slice(0, 15).map((c) => `${c.title}\n${c.content}`).join("\n\n")}

如果这是全文的开头部分，请重点审查出现的内容。如果没有相关条款，请指出"未发现相关条款"。

请严格按JSON格式输出审查结果。`;

  const result = await generateChat(userPrompt, lawContext, dimension.prompt);

  return parseFindings(result, dimension.key, dimension.name, contract.id);
}

export async function runFullReview(contract: Contract): Promise<RiskFinding[]> {
  const allFindings: RiskFinding[] = [];

  // 串行审查各维度（避免 API 并发限制）
  for (const dim of REVIEW_DIMENSIONS) {
    const findings = await reviewDimension(contract, dim);
    allFindings.push(...findings);
  }

  return allFindings;
}
```

---

### Task 10: 合同与报告存储

**Files:**
- Create: `src/lib/store.ts`

**Interfaces:**
- Produces: `saveContract(contract: Contract): Promise<void>`, `getContract(id: string): Promise<Contract | null>`, `saveReport(report: ReviewReport): Promise<void>`, `getReport(id: string): Promise<ReviewReport | null>`, `getReportByContractId(contractId: string): Promise<ReviewReport | null>`

- [ ] **Step 1: 文件存储服务**

```ts
// src/lib/store.ts
import { Contract, ReviewReport } from "./types";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTRACTS_DIR = path.join(DATA_DIR, "contracts");
const REPORTS_DIR = path.join(DATA_DIR, "reports");

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

export async function saveContract(contract: Contract): Promise<void> {
  await ensureDir(CONTRACTS_DIR);
  const filePath = path.join(CONTRACTS_DIR, `${contract.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(contract, null, 2), "utf-8");
}

export async function getContract(id: string): Promise<Contract | null> {
  try {
    const filePath = path.join(CONTRACTS_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveReport(report: ReviewReport): Promise<void> {
  await ensureDir(REPORTS_DIR);
  const filePath = path.join(REPORTS_DIR, `${report.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(report, null, 2), "utf-8");
}

export async function getReport(id: string): Promise<ReviewReport | null> {
  try {
    const filePath = path.join(REPORTS_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function getReportByContractId(contractId: string): Promise<ReviewReport | null> {
  try {
    await ensureDir(REPORTS_DIR);
    const files = await fs.readdir(REPORTS_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const data = await fs.readFile(path.join(REPORTS_DIR, file), "utf-8");
        const report = JSON.parse(data);
        if (report.contractId === contractId) return report;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAllContracts(): Promise<Contract[]> {
  await ensureDir(CONTRACTS_DIR);
  try {
    const files = await fs.readdir(CONTRACTS_DIR);
    const contracts: Contract[] = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        const data = await fs.readFile(path.join(CONTRACTS_DIR, file), "utf-8");
        contracts.push(JSON.parse(data));
      }
    }
    return contracts.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch {
    return [];
  }
}
```

---

### Task 11: API 路由

**Files:**
- Create: `src/app/api/kb/build/route.ts`
- Create: `src/app/api/kb/route.ts`
- Create: `src/app/api/upload/route.ts`
- Create: `src/app/api/review/[id]/route.ts`
- Create: `src/app/api/chat/[id]/route.ts`

**Interfaces:**
- Consumes: 所有 lib 模块
- Produces: RESTful API endpoints

- [ ] **Step 1: 知识库 API**

```ts
// src/app/api/kb/route.ts
import { NextResponse } from "next/server";
import { tableExists, getStats } from "@/lib/db/lancedb";

export async function GET() {
  const exists = await tableExists();
  const stats = exists ? await getStats() : { count: 0 };
  return NextResponse.json({
    built: exists && stats.count > 0,
    chunkCount: stats.count,
  });
}
```

```ts
// src/app/api/kb/build/route.ts
import { NextResponse } from "next/server";
import { buildKnowledgeBase } from "@/lib/rag";
import fs from "fs/promises";
import path from "path";

export async function POST() {
  try {
    const kbDir = path.join(process.cwd(), "data", "knowledge");
    const files = await fs.readdir(kbDir);
    const docs: Array<{ content: string; source: string }> = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        const content = await fs.readFile(path.join(kbDir, file), "utf-8");
        docs.push({ content, source: file.replace(".md", "") });
      }
    }

    const result = await buildKnowledgeBase(docs);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 上传 API**

```ts
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseDocument, FileType } from "@/lib/parser";
import { splitClauses } from "@/lib/splitter";
import { saveContract } from "@/lib/store";
import { Contract } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未上传文件" }, { status: 400 });
    }

    // 判断文件类型
    const fileName = file.name.toLowerCase();
    let fileType: FileType;
    if (fileName.endsWith(".pdf")) fileType = "pdf";
    else if (fileName.endsWith(".docx")) fileType = "docx";
    else return NextResponse.json({ error: "仅支持 PDF 和 DOCX 格式" }, { status: 400 });

    // 解析文件
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await parseDocument(buffer, fileType);

    // 分段
    const clauses = splitClauses(content);

    const contract: Contract = {
      id: uuidv4(),
      fileName: file.name,
      fileType,
      content,
      clauses,
      uploadedAt: new Date().toISOString(),
    };

    await saveContract(contract);

    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

- [ ] **Step 3: 审查 API**

```ts
// src/app/api/review/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getContract, saveReport, getReportByContractId } from "@/lib/store";
import { runFullReview } from "@/lib/review/pipeline";
import { ReviewReport } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await getContract(params.id);
    if (!contract) {
      return NextResponse.json({ error: "合同不存在" }, { status: 404 });
    }

    // 检查是否已有报告
    const existing = await getReportByContractId(params.id);
    if (existing) {
      return NextResponse.json({ report: existing, cached: true });
    }

    const findings = await runFullReview(contract);

    const report: ReviewReport = {
      id: uuidv4(),
      contractId: contract.id,
      createdAt: new Date().toISOString(),
      findings,
      summary: generateSummary(findings),
    };

    await saveReport(report);
    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const report = await getReportByContractId(params.id);
  if (!report) {
    return NextResponse.json({ error: "报告不存在" }, { status: 404 });
  }
  const contract = await getContract(params.id);
  return NextResponse.json({ report, contract });
}

function generateSummary(findings: ReviewReport["findings"]): string {
  const high = findings.filter((f) => f.severity === "high").length;
  const medium = findings.filter((f) => f.severity === "medium").length;
  const low = findings.filter((f) => f.severity === "low").length;

  if (findings.length === 0) return "未发现明显风险，合同条款基本合规。";

  const parts = [];
  if (high > 0) parts.push(`${high} 项高风险`);
  if (medium > 0) parts.push(`${medium} 项中风险`);
  if (low > 0) parts.push(`${low} 项低风险`);
  return `共发现 ${findings.length} 项风险（${parts.join("、")}），建议重点关注高风险项并及时修改。`;
}
```

- [ ] **Step 4: 对话 API**

```ts
// src/app/api/chat/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getContract } from "@/lib/store";
import { queryRAG } from "@/lib/rag";
import { ChatMessage } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { message, history = [] } = body as {
      message: string;
      history?: ChatMessage[];
    };

    const contract = await getContract(params.id);
    if (!contract) {
      return NextResponse.json({ error: "合同不存在" }, { status: 404 });
    }

    // 将合同上下文加入问题
    const enrichedQuestion = `基于以下劳动合同内容：\n\n${contract.content.slice(0, 3000)}\n\n用户问题：${message}`;

    const result = await queryRAG(enrichedQuestion, 5);

    return NextResponse.json({
      answer: result.answer,
      sources: result.sources.slice(0, 3),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### Task 12: 前端页面与组件

**Files:**
- Create: `src/app/page.tsx` (覆盖)
- Create: `src/app/admin/page.tsx`
- Create: `src/app/report/[id]/page.tsx`
- Create: `src/app/chat/[id]/page.tsx`
- Create: `src/components/FileUpload.tsx`
- Create: `src/components/RiskReport.tsx`
- Create: `src/components/RiskCard.tsx`
- Create: `src/components/ChatPanel.tsx`
- Create: `src/components/LoadingSpinner.tsx`

- [ ] **Step 1: 首页（上传页）**

```tsx
// src/app/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";

export default function Home() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "上传失败");

      // 上传成功后跳转
      router.push(`/report/${data.contract.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">📋 劳动合同风险审查</h1>
        <p className="text-gray-500">
          上传劳动合同文件，AI 将自动扫描 8 大维度风险，并提供法律依据和修改建议
        </p>
      </div>

      <FileUpload onUpload={handleUpload} uploading={uploading} />

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-2">📌 审查维度</h2>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>✅ 法定必备条款</div>
          <div>✅ 试用期合规性</div>
          <div>✅ 违约金条款</div>
          <div>✅ 竞业限制合规</div>
          <div>✅ 工时与休假</div>
          <div>✅ 社保缴纳</div>
          <div>✅ 解除/终止合同</div>
          <div>✅ 工资支付</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: FileUpload 组件**

```tsx
// src/components/FileUpload.tsx
"use client";
import { useCallback, useState } from "react";

export default function FileUpload({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".pdf") || file.name.endsWith(".docx"))) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">正在解析合同文件...</p>
        </div>
      ) : (
        <>
          <div className="text-5xl mb-4">📄</div>
          <p className="text-lg font-medium mb-2">将合同文件拖拽到此处</p>
          <p className="text-sm text-gray-400 mb-4">支持 PDF 和 Word (.docx) 格式</p>
          <label className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
            选择文件
            <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleChange} />
          </label>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 报告页**

```tsx
// src/app/report/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReviewReport, Contract } from "@/lib/types";
import RiskReport from "@/components/RiskReport";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // 触发审查
        const res = await fetch(`/api/review/${id}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "审查失败");
        setReport(data.report);

        // 加载合同信息
        const cres = await fetch(`/api/review/${id}`);
        const cdata = await cres.json();
        if (cres.ok) setContract(cdata.contract);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner text="正在审查合同..." />;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!report) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">风险审查报告</h1>
          {contract && (
            <p className="text-sm text-gray-500 mt-1">
              {contract.fileName} · {contract.clauses.length} 条条款
            </p>
          )}
        </div>
        <button
          onClick={() => router.push(`/chat/${id}`)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          💬 深入对话
        </button>
      </div>

      <RiskReport report={report} contractId={id} />
    </div>
  );
}
```

- [ ] **Step 4: RiskReport 组件**

```tsx
// src/components/RiskReport.tsx
import { ReviewReport } from "@/lib/types";
import RiskCard from "./RiskCard";
import Link from "next/link";

export default function RiskReport({ report, contractId }: { report: ReviewReport; contractId: string }) {
  const highCount = report.findings.filter((f) => f.severity === "high").length;
  const mediumCount = report.findings.filter((f) => f.severity === "medium").length;
  const lowCount = report.findings.filter((f) => f.severity === "low").length;

  return (
    <div>
      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-blue-600">{report.findings.length}</div>
          <div className="text-sm text-gray-500">风险总数</div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-red-500">{highCount}</div>
          <div className="text-sm text-gray-500">🔴 高风险</div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-yellow-500">{mediumCount}</div>
          <div className="text-sm text-gray-500">🟡 中风险</div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-green-500">{lowCount}</div>
          <div className="text-sm text-gray-500">🟢 低风险</div>
        </div>
      </div>

      {/* 摘要 */}
      <div className="p-4 bg-white rounded-xl shadow-sm border mb-6">
        <h2 className="font-semibold mb-2">📊 审查摘要</h2>
        <p className="text-gray-600">{report.summary}</p>
      </div>

      {/* 分组详情 */}
      {["high", "medium", "low"].map((severity) => {
        const findings = report.findings.filter((f) => f.severity === severity);
        if (findings.length === 0) return null;

        const labels: Record<string, string> = { high: "🔴 高风险", medium: "🟡 中风险", low: "🟢 低风险" };
        const colors: Record<string, string> = {
          high: "border-l-red-500",
          medium: "border-l-yellow-500",
          low: "border-l-green-500",
        };

        return (
          <div key={severity} className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{labels[severity]} ({findings.length})</h3>
            <div className="space-y-3">
              {findings.map((f) => (
                <RiskCard key={f.id} finding={f} contractId={contractId} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: RiskCard 组件**

```tsx
// src/components/RiskCard.tsx
import { RiskFinding } from "@/lib/types";
import Link from "next/link";

export default function RiskCard({ finding, contractId }: { finding: RiskFinding; contractId: string }) {
  return (
    <div className={`p-4 bg-white rounded-lg shadow-sm border border-l-4 ${
      finding.severity === "high" ? "border-l-red-500" :
      finding.severity === "medium" ? "border-l-yellow-500" : "border-l-green-500"
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 mr-2">
            {finding.dimensionName}
          </span>
          <h4 className="font-medium inline">{finding.title}</h4>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{finding.description}</p>

      {finding.legalBasis && (
        <div className="text-sm mb-2">
          <span className="font-medium text-gray-700">📖 法律依据：</span>
          <span className="text-gray-600">{finding.legalBasis}</span>
        </div>
      )}

      <div className="text-sm">
        <span className="font-medium text-gray-700">💡 建议：</span>
        <span className="text-gray-600">{finding.suggestion}</span>
      </div>

      <div className="mt-3 pt-3 border-t">
        <Link
          href={`/chat/${contractId}?q=${encodeURIComponent(finding.title)}`}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          💬 深入讨论此风险 →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 对话页**

```tsx
// src/app/chat/[id]/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const initialQ = searchParams.get("q");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const hasAsked = useRef(false);

  useEffect(() => {
    if (initialQ && !hasAsked.current) {
      hasAsked.current = true;
      handleSend(initialQ);
    }
  }, [initialQ]);

  const handleSend = async (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setSending(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`/api/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      if (data.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: "抱歉，请求失败：" + e.message }]);
    } finally {
      setSending(false);
    }
  };

  return <ChatPanel messages={messages} onSend={handleSend} sending={sending} />;
}
```

- [ ] **Step 7: ChatPanel 组件**

```tsx
// src/components/ChatPanel.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/types";

export default function ChatPanel({
  messages,
  onSend,
  sending,
}: {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  sending: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">💬 合同条款深度探讨</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">💬</p>
            <p>针对合同条款或审查结果提出问题，AI 将基于劳动法规为您解答</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题..."
          className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 8: LoadingSpinner 组件**

```tsx
// src/components/LoadingSpinner.tsx
export default function LoadingSpinner({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500">{text}</p>
    </div>
  );
}
```

- [ ] **Step 9: 知识库管理页**

```tsx
// src/app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import { KBStatus } from "@/lib/types";

export default function AdminPage() {
  const [status, setStatus] = useState<KBStatus | null>(null);
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("/api/kb").then((r) => r.json()).then(setStatus);
  }, []);

  const handleBuild = async () => {
    setBuilding(true);
    setResult("");
    try {
      const res = await fetch("/api/kb/build", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult(`✅ 知识库构建完成！共 ${data.chunkCount} 个向量切片`);
        const sres = await fetch("/api/kb");
        setStatus(await sres.json());
      } else {
        setResult(`❌ 构建失败：${data.error}`);
      }
    } catch (e: any) {
      setResult(`❌ 请求失败：${e.message}`);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚙️ 知识库管理</h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="font-semibold mb-3">知识库状态</h2>
        {status ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">状态</span>
              <span className={status.built ? "text-green-600" : "text-red-500"}>
                {status.built ? "✅ 已构建" : "❌ 未构建"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">向量切片数</span>
              <span>{status.chunkCount}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">加载中...</p>
        )}
      </div>

      <button
        onClick={handleBuild}
        disabled={building}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {building ? "⏳ 正在构建知识库..." : "🔧 构建/重建知识库"}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {result}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
        <p className="font-medium mb-2">📌 说明</p>
        <p>首次使用前需要构建知识库。系统将自动读取 data/knowledge/ 目录下的法律文件，切片后生成向量并存入 LanceDB。</p>
      </div>
    </div>
  );
}
```

---

### Task 13: 最终验证与汇总

- [ ] **Step 1: 安装依赖并测试编译**

```bash
cd /Users/sy/codes/rag合同风险审查
npm install
npm run build
```

Expected: 编译无错误

- [ ] **Step 2: 启动开发服务器**

```bash
npm run dev
```

访问 `http://localhost:3000`：
- 首页正常显示
- 可以访问 /admin 知识库管理页
- 上传 PDF/Word 文件
- 查看审查报告
- 进入对话页面

- [ ] **Step 3: 确认所有文件已创建**

```bash
find src -type f | sort
```

Expected: 列出所有创建的文件

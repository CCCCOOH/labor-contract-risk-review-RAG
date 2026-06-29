// 诊断脚本：测试 DashScope API 连通性
const fs = require("fs");
const path = require("path");

// 从 .env.local 读取配置
const envContent = fs.readFileSync(path.join(__dirname, ".env.local"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const BASE = env.OPENAI_BASE_URL;
const KEY = env.OPENAI_API_KEY;
const MODEL = env.LLM_MODEL;

console.log("BASE_URL:", BASE);
console.log("MODEL:", MODEL);
console.log("API_KEY:", KEY.slice(0, 10) + "..." + KEY.slice(-4));

async function testChat() {
  const url = `${BASE}/chat/completions`;
  console.log("\n[chat] Testing:", url);

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: "你好，请回复'OK'" }],
        max_tokens: 20,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[chat] Status: ${res.status} (${elapsed}s)`);

    const text = await res.text();
    console.log("[chat] Response:", text.slice(0, 300));

    if (!res.ok) {
      console.log("[chat] FAILED - non-OK status");
    } else {
      try {
        const data = JSON.parse(text);
        console.log("[chat] Content:", data.choices?.[0]?.message?.content);
      } catch {}
    }
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[chat] ERROR after ${elapsed}s:`, err.message);
    console.log("[chat] Cause:", err.cause);
  }
}

async function testEmbed() {
  const url = `${BASE}/embeddings`;
  console.log("\n[embed] Testing:", url);

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const body = {
      model: env.EMBEDDING_MODEL || "text-embedding-v4",
      input: ["测试文本"],
      encoding_format: "float",
    };
    if (body.model === "text-embedding-v4" || body.model === "text-embedding-v3") {
      body.dimensions = 1024;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[embed] Status: ${res.status} (${elapsed}s)`);

    const text = await res.text();
    console.log("[embed] Response:", text.slice(0, 200));
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[embed] ERROR after ${elapsed}s:`, err.message);
    console.log("[embed] Cause:", err.cause);
  }
}

async function main() {
  await testEmbed();
  await testChat();
}

main().catch(console.error);

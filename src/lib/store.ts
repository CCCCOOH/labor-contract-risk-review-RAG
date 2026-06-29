import { Contract, ReviewReport, ChatSession } from "./types";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTRACTS_DIR = path.join(DATA_DIR, "contracts");
const REPORTS_DIR = path.join(DATA_DIR, "reports");
 const CHATS_DIR = path.join(DATA_DIR, "chats");

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
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
    return contracts.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  } catch {
    return [];
  }
}
 
 // ── Chat session storage ──
 
 export async function saveChatSession(session: ChatSession): Promise<void> {
   await ensureDir(CHATS_DIR);
   const filePath = path.join(CHATS_DIR, `${session.id}.json`);
   await fs.writeFile(filePath, JSON.stringify(session, null, 2), "utf-8");
 }
 
 export async function getChatSession(id: string): Promise<ChatSession | null> {
   try {
     const filePath = path.join(CHATS_DIR, `${id}.json`);
     const data = await fs.readFile(filePath, "utf-8");
     return JSON.parse(data);
   } catch {
     return null;
   }
 }
 
 export async function getChatSessionsByContract(contractId: string): Promise<ChatSession[]> {
   await ensureDir(CHATS_DIR);
   try {
     const files = await fs.readdir(CHATS_DIR);
     const sessions: ChatSession[] = [];
     for (const file of files) {
       if (file.endsWith(".json")) {
         const data = await fs.readFile(path.join(CHATS_DIR, file), "utf-8");
         const session = JSON.parse(data) as ChatSession;
         if (session.contractId === contractId) sessions.push(session);
       }
     }
     return sessions.sort(
       (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
     );
   } catch {
     return [];
   }
 }
 
 export async function deleteChatSession(id: string): Promise<void> {
   try {
     const filePath = path.join(CHATS_DIR, `${id}.json`);
     await fs.unlink(filePath);
   } catch {
     // ignore if not found
   }
 }

import { parsePDF } from "./pdf";
import { parseWord } from "./word";
import { parseDoc } from "./doc";

export type FileType = "pdf" | "docx" | "doc";

export async function parseDocument(buffer: Buffer, fileType: FileType): Promise<string> {
  if (fileType === "pdf") return parsePDF(buffer);
  if (fileType === "docx") return parseWord(buffer);
  if (fileType === "doc") return parseDoc(buffer);
  throw new Error(`Unsupported file type: ${fileType}`);
}

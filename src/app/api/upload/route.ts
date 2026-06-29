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

    const fileName = file.name.toLowerCase();
    let fileType: FileType;
    if (fileName.endsWith(".pdf")) fileType = "pdf";
    else if (fileName.endsWith(".docx")) fileType = "docx";
    else if (fileName.endsWith(".doc")) fileType = "doc";
    else return NextResponse.json({ error: "仅支持 PDF、DOCX 和 DOC 格式" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await parseDocument(buffer, fileType);

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

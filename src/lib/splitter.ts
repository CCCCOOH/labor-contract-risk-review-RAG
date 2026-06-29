import { Clause } from "./types";

export function splitClauses(text: string): Clause[] {
  const clausePattern =
    /(?:^|\n)\s*(?:第[一二三四五六七八九十百千\d]+(?:章|节|条)|[（(][一二三四五六七八九十\d]+[）)])\s*[^\n]*/g;

  let matchResult: RegExpExecArray | null;
  const parts: Array<{ title: string; content: string }> = [];
  let prevEnd = 0;

  const regex = new RegExp(clausePattern.source, "g");

  while ((matchResult = regex.exec(text)) !== null) {
    // 如果匹配不是从开头开始，说明有前言内容
    if (parts.length === 0 && matchResult.index > 0) {
      const preContent = text.slice(0, matchResult.index).trim();
      if (preContent.length > 20) {
        parts.push({ title: "前言", content: preContent });
      }
    }

    // 记录前一个 part 的内容
    if (parts.length > 0) {
      const content = text.slice(prevEnd, matchResult.index).trim();
      // 去除标题行，保留内容
      const titleLineEnd = parts[parts.length - 1].title.length;
      const bodyContent = content.length > titleLineEnd ? content.slice(titleLineEnd).trim() : "";
      if (bodyContent.length > 5) {
        parts[parts.length - 1].content = bodyContent;
      } else if (content.length > 5) {
        parts[parts.length - 1].content = content;
      }
    }

    parts.push({ title: matchResult[0].trim(), content: "" });
    prevEnd = matchResult.index + matchResult[0].length;
  }

  // 最后一个 part 的内容
  if (parts.length > 0 && prevEnd < text.length) {
    const content = text.slice(prevEnd).trim();
    if (content.length > 5) {
      parts[parts.length - 1].content = content;
    }
  }

  // 如果没有匹配到任何条款模式，按段落拆分
  if (parts.length === 0) {
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 10);
    return paragraphs.map((content, i) => ({
      index: i,
      title: `第${i + 1}条`,
      content: content.trim(),
    }));
  }

  return parts
    .filter((p) => p.content.length > 5)
    .map((p, i) => ({
      index: i,
      title: p.title,
      content: p.content,
    }));
}

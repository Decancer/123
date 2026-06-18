/**
 * 去除 HTML 标签，返回纯文本。用于从富文本内容生成摘要。
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // 去掉所有 HTML 标签
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

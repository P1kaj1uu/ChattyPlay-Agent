/**
 * Markdown 渲染
 * marked 解析 + highlight.js 代码高亮 + KaTeX 公式 + Mermaid 图表 + DOMPurify
 */
import { Marked } from 'marked'
import hljs from 'highlight.js/lib/common'
import katex from 'katex'
import DOMPurify from 'dompurify'

/** HTML 转义，避免把用户文本当作标签注入 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 用 KaTeX 渲染公式，失败时降级为原始文本 */
function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      errorColor: '#e11d48',
      strict: false,
      trust: false,
      output: 'htmlAndMathml',
    })
  } catch {
    return `<code>${escapeHtml(displayMode ? `$$${tex}$$` : `$${tex}$`)}</code>`
  }
}

/** 行内公式：$...$ 与 \(...\) */
const inlineMath = {
  name: 'inlineMath',
  level: 'inline' as const,
  start(src: string) {
    const dollar = src.indexOf('$')
    const paren = src.indexOf('\\(')
    const candidates = [dollar, paren].filter((i) => i >= 0)
    return candidates.length ? Math.min(...candidates) : undefined
  },
  tokenizer(src: string) {
    const dollar = /^\$(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)\$/.exec(src)
    if (dollar) {
      return { type: 'inlineMath', raw: dollar[0], text: dollar[1], display: false }
    }
    const paren = /^\\\(([\s\S]+?)\\\)/.exec(src)
    if (paren) {
      return { type: 'inlineMath', raw: paren[0], text: paren[1], display: false }
    }
    return undefined
  },
  renderer(token: { text: string; display: boolean }) {
    return renderMath(token.text, token.display)
  },
}

/** 块级公式：$$...$$ 与 \[...\] */
const blockMath = {
  name: 'blockMath',
  level: 'block' as const,
  start(src: string) {
    const dollar = src.indexOf('$$')
    const bracket = src.indexOf('\\[')
    const candidates = [dollar, bracket].filter((i) => i >= 0)
    return candidates.length ? Math.min(...candidates) : undefined
  },
  tokenizer(src: string) {
    const dollar = /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n+|$)/.exec(src)
    if (dollar) {
      return { type: 'blockMath', raw: dollar[0], text: dollar[1], display: true }
    }
    const bracket = /^\\\[([\s\S]+?)\\\][ \t]*(?:\n+|$)/.exec(src)
    if (bracket) {
      return { type: 'blockMath', raw: bracket[0], text: bracket[1], display: true }
    }
    return undefined
  },
  renderer(token: { text: string; display: boolean }) {
    return `<p class="md-math-block">${renderMath(token.text, token.display)}</p>`
  },
}

/** 代码块：mermaid 交给前端渲染，其余用 highlight.js 高亮 */
const marked = new Marked({
  gfm: true,
  breaks: true,
  extensions: [blockMath, inlineMath],
})

/** 预览中的标题（用于生成目录） */
export interface MarkdownHeading {
  id: string
  depth: number
  text: string
}

/** 一次 Markdown 渲染的结果 */
export interface RenderedMarkdown {
  html: string
  headings: MarkdownHeading[]
}

/** 去掉行内标签，得到目录里展示的纯文本 */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

// 标题 id 只在单次渲染内递增。renderMarkdown 是同步的，
// 所以用模块级变量收集标题不会串场，目录与正文的标题顺序天然一致。
let headingSeq = 0
let headingSink: MarkdownHeading[] | null = null

marked.use({
  renderer: {
    heading(text: string, level: number) {
      const id = `md-h-${headingSeq++}`
      if (headingSink) {
        headingSink.push({ id, depth: level, text: stripTags(text) })
      }
      return `<h${level} id="${id}">${text}</h${level}>`
    },
    code(code: string, infostring: string | undefined) {
      const lang = (infostring || '').trim().split(/\s+/)[0].toLowerCase()

      if (lang === 'mermaid') {
        // 仅输出占位容器，真正的图形由 Mermaid 在预览挂载后渲染
        return `<div class="md-mermaid" data-mermaid="${encodeURIComponent(code)}"></div>`
      }

      let highlighted: string
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
        } catch {
          highlighted = escapeHtml(code)
        }
      } else {
        try {
          highlighted = hljs.highlightAuto(code).value
        } catch {
          highlighted = escapeHtml(code)
        }
      }

      const label = lang ? `<span class="md-code-lang">${escapeHtml(lang)}</span>` : ''
      return `<div class="md-code-block">${label}<pre class="hljs"><code>${highlighted}</code></pre></div>`
    },
  },
})

/** 保留 KaTeX(MathML) 与内联样式，允许 mermaid 占位容器 */
const PURIFY_CONFIG = {
  USE_PROFILES: { html: true, svg: true, mathMl: true },
  ADD_ATTR: ['data-mermaid', 'target', 'rel'],
}

/** 把 Markdown 源码渲染为安全的 HTML，并顺带产出目录数据 */
export function renderMarkdown(source: string): RenderedMarkdown {
  const headings: MarkdownHeading[] = []
  headingSeq = 0
  headingSink = headings

  try {
    const raw = marked.parse(source ?? '', { async: false }) as string
    return {
      html: DOMPurify.sanitize(raw, PURIFY_CONFIG) as unknown as string,
      headings,
    }
  } finally {
    headingSink = null
  }
}

/** 明暗主题给 Mermaid 用的配色 */
export type ThemeMode = 'light' | 'dark'

let mermaidReady: Promise<typeof import('mermaid').default> | null = null

function loadMermaid(): Promise<typeof import('mermaid').default> {
  if (!mermaidReady) {
    mermaidReady = import('mermaid')
      .then((m) => m.default)
      .catch((err) => {
        // chunk 加载失败时允许下次重试，而不是把失败永久缓存住
        mermaidReady = null
        throw err
      })
  }
  return mermaidReady
}

/** 一次 Mermaid 渲染的结果 */
export interface RenderedDiagram {
  svg: string
  bindFunctions?: (element: Element) => void
}

// mermaid.initialize 是全局配置，只在主题变化时重设：
// 并发渲染时反复 initialize 会重置内部状态，导致部分图表渲染失败
let configuredTheme: ThemeMode | null = null

// 图表 id 必须全局唯一。mermaid 用它创建并查找临时测量容器，
// 同一毫秒内并发渲染若复用 id 会取到错误节点，这正是“有时渲染不出来”的主因
let diagramIdSeq = 0

/**
 * 把单个 Mermaid 源码渲染为 SVG
 * Mermaid 体积较大（约 700KB），按需异步加载，首次渲染会有明显延迟
 */
export async function renderMermaidToSvg(code: string, theme: ThemeMode): Promise<RenderedDiagram> {
  const mermaid = await loadMermaid()

  if (configuredTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: theme === 'dark' ? 'dark' : 'default',
      fontFamily: 'inherit',
    })
    configuredTheme = theme
  }

  const id = `mdmermaid${++diagramIdSeq}`
  try {
    const { svg, bindFunctions } = await mermaid.render(id, code)
    return {
      svg: DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, html: true } }) as unknown as string,
      bindFunctions: bindFunctions as RenderedDiagram['bindFunctions'],
    }
  } finally {
    // 渲染失败时 mermaid 可能残留临时节点，清理掉避免污染后续渲染
    document.getElementById(`d${id}`)?.remove()
    document.getElementById(id)?.remove()
  }
}

/**
 * 还原占位容器上 data-mermaid 属性里保存的 Mermaid 源码
 * 属性值写入时经过 encodeURIComponent；解码失败时退回原文，避免整轮渲染中断
 */
export function decodeMermaidSource(raw: string | null): string {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

/** 生成可独立打开的 HTML 文档（导出的样式尽量贴近预览效果） */
export function buildStandaloneHtml(title: string, bodyHtml: string, theme: ThemeMode): string {
  const katexCss = 'https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/katex.min.css'
  const hljsCss = 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css'
  const bg = theme === 'dark' ? '#1e1e21' : '#ffffff'
  const fg = theme === 'dark' ? '#e6e6e6' : '#24292f'
  const border = theme === 'dark' ? '#333338' : '#e5e7eb'
  const codeBg = theme === 'dark' ? '#2a2a2e' : '#f6f8fa'

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${katexCss}" />
<link rel="stylesheet" href="${hljsCss}" />
<style>
  body { margin: 0; padding: 40px 24px; background: ${bg}; color: ${fg};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    line-height: 1.75; font-size: 16px; }
  main { max-width: 820px; margin: 0 auto; }
  h1, h2, h3, h4 { line-height: 1.3; margin: 1.6em 0 .6em; font-weight: 600; }
  h1 { font-size: 2em; border-bottom: 1px solid ${border}; padding-bottom: .3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid ${border}; padding-bottom: .3em; }
  p, ul, ol, blockquote, table { margin: .9em 0; }
  a { color: #2563eb; }
  blockquote { border-left: 4px solid ${border}; margin-left: 0; padding: .2em 1em; color: #6b7280; }
  code { background: ${codeBg}; padding: .2em .4em; border-radius: 4px; font-size: .9em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  pre { background: ${codeBg}; padding: 14px 16px; border-radius: 8px; overflow: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid ${border}; padding: 8px 12px; text-align: left; }
  img { max-width: 100%; }
  hr { border: none; border-top: 1px solid ${border}; margin: 2em 0; }
</style>
</head>
<body>
<main>${bodyHtml}</main>
</body>
</html>`
}

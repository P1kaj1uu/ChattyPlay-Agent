import React from 'react'
import type { MarkdownHeading } from '@/utils/markdown'

interface TableOfContentsProps {
  headings: MarkdownHeading[]
  activeId: string | null
  onSelect: (id: string) => void
}

/**
 * 文档目录：层级按标题深度缩进，点击滚动到预览中的对应位置
 */
const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, activeId, onSelect }) => {
  if (!headings.length) {
    return <div className="md-toc-empty">当前文档还没有标题</div>
  }

  // 以文档里出现过的最浅层级为基准缩进，避免整篇只有 h3 时左侧留白过多
  const minDepth = headings.reduce((min, h) => Math.min(min, h.depth), 6)

  return (
    <nav className="md-toc" aria-label="文档目录">
      {headings.map((heading) => (
        <button
          key={heading.id}
          type="button"
          className={`md-toc-item${heading.id === activeId ? ' is-active' : ''}`}
          style={{ paddingLeft: 10 + (heading.depth - minDepth) * 12 }}
          onClick={() => onSelect(heading.id)}
          title={heading.text}
        >
          {heading.text || '(无标题)'}
        </button>
      ))}
    </nav>
  )
}

export default TableOfContents

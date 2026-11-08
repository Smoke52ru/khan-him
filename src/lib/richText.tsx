import React from 'react'

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
}

type LexicalDoc = {
  root?: {
    children?: LexicalNode[]
  }
}

export function RichText({ data }: { data: unknown }) {
  if (!data || typeof data !== 'object') return null
  const doc = data as LexicalDoc
  const paragraphs = doc.root?.children || []
  if (paragraphs.length === 0) return null

  return (
    <div className="space-y-3 text-stone-700">
      {paragraphs.map((node, index) => (
        <p key={index}>{renderChildren(node.children || [])}</p>
      ))}
    </div>
  )
}

function renderChildren(nodes: LexicalNode[]): React.ReactNode {
  return nodes.map((node, index) => {
    if (node.type === 'text') return <React.Fragment key={index}>{node.text}</React.Fragment>
    if (node.children) return <React.Fragment key={index}>{renderChildren(node.children)}</React.Fragment>
    return null
  })
}

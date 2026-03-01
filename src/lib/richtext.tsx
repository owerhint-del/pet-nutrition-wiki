import React from 'react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

// Lexical node types
type LexicalNode = {
  type: string
  version: number
  children?: LexicalNode[]
  text?: string
  format?: number
  tag?: string
  listType?: string
  direction?: string | null
  indent?: number
  fields?: {
    url?: string
    linkType?: string
    doc?: {
      value?: string | { slug?: string; id?: string }
      relationTo?: string
    }
    newTab?: boolean
  }
  value?: {
    id?: string
    url?: string
    alt?: string
    width?: number
    height?: number
  }
  [key: string]: unknown
}

function renderFormat(text: string, format: number): React.ReactNode {
  let result: React.ReactNode = text
  if (format & 1) result = <strong>{result}</strong>
  if (format & 2) result = <em>{result}</em>
  if (format & 4) result = <s>{result}</s>
  if (format & 8) result = <u>{result}</u>
  if (format & 16) result = <code>{result}</code>
  return result
}

function renderNode(node: LexicalNode, index: number): React.ReactNode {
  switch (node.type) {
    case 'text':
      if (node.format && node.text) {
        return <React.Fragment key={index}>{renderFormat(node.text, node.format)}</React.Fragment>
      }
      return <React.Fragment key={index}>{node.text}</React.Fragment>

    case 'linebreak':
      return <br key={index} />

    case 'paragraph':
      return <p key={index}>{node.children?.map(renderNode)}</p>

    case 'heading': {
      const Tag = (node.tag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const id = node.children
        ?.map((c) => c.text || '')
        .join('')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
      return <Tag key={index} id={id}>{node.children?.map(renderNode)}</Tag>
    }

    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return <Tag key={index}>{node.children?.map(renderNode)}</Tag>
    }

    case 'listitem':
      return <li key={index}>{node.children?.map(renderNode)}</li>

    case 'quote':
      return <blockquote key={index}>{node.children?.map(renderNode)}</blockquote>

    case 'link':
    case 'autolink': {
      const fields = node.fields
      if (fields?.linkType === 'internal' && fields.doc) {
        const docValue = fields.doc.value
        const slug = typeof docValue === 'string' ? docValue : docValue?.slug
        return (
          <a key={index} href={`/articles/${slug}`} data-internal="true">
            {node.children?.map(renderNode)}
          </a>
        )
      }
      return (
        <a
          key={index}
          href={fields?.url || '#'}
          target={fields?.newTab ? '_blank' : undefined}
          rel={fields?.newTab ? 'noopener noreferrer' : undefined}
        >
          {node.children?.map(renderNode)}
        </a>
      )
    }

    case 'upload': {
      const img = node.value
      if (img?.url) {
        return (
          <figure key={index} className="my-6">
            <img
              src={img.url}
              alt={img.alt || ''}
              width={img.width}
              height={img.height}
              className="rounded-lg"
              loading="lazy"
            />
          </figure>
        )
      }
      return null
    }

    case 'root':
      return <>{node.children?.map(renderNode)}</>

    default:
      if (node.children) {
        return <div key={index}>{node.children?.map(renderNode)}</div>
      }
      return null
  }
}

export function RichText({ content }: { content: SerializedEditorState | null | undefined }) {
  if (!content?.root) return null
  return <div className="prose prose-stone max-w-none">{renderNode(content.root as unknown as LexicalNode, 0)}</div>
}

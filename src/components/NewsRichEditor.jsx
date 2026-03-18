import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { Extension, Node } from '@tiptap/core'
import { useReducer, useRef, useState, useEffect, useCallback } from 'react'
import StarterKit from '@tiptap/starter-kit'
import LinkExt from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { supabase } from '../lib/supabase'
import './NewsRichEditor.css'

// Press Enter inside a heading → new line becomes a paragraph
const HeadingExitOnEnter = Extension.create({
  name: 'headingExitOnEnter',
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!editor.isActive('heading')) return false
        editor.chain().splitBlock().run()
        if (editor.isActive('heading')) editor.chain().setParagraph().run()
        return true
      },
    }
  },
})

// ── Resizable image NodeView ───────────────────────────

function ImageView({ node, updateAttributes, selected }) {
  const { src, alt, width, align } = node.attrs
  const startX = useRef(0)
  const startW = useRef(0)

  const onResizeStart = useCallback((e) => {
    e.preventDefault()
    startX.current = e.clientX
    startW.current = parseInt(width) || e.target.closest('.nrte-img-wrap').offsetWidth

    function onMove(e) {
      const newW = Math.max(80, startW.current + (e.clientX - startX.current))
      updateAttributes({ width: newW + 'px' })
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [width, updateAttributes])

  return (
    <NodeViewWrapper className={`nrte-img-node align-${align || 'left'}`} data-drag-handle>
      <div className={`nrte-img-wrap${selected ? ' selected' : ''}`} style={{ width: width || 'auto' }}>
        <img src={src} alt={alt || ''} draggable="false" />
        {selected && (
          <>
            <div className="nrte-img-controls">
              <button type="button" className={align === 'left' || !align ? 'active' : ''} onClick={() => updateAttributes({ align: 'left' })} title="Align left">⬅</button>
              <button type="button" className={align === 'center' ? 'active' : ''} onClick={() => updateAttributes({ align: 'center' })} title="Centre">↔</button>
              <button type="button" className={align === 'right' ? 'active' : ''} onClick={() => updateAttributes({ align: 'right' })} title="Align right">➡</button>
            </div>
            <div className="nrte-resize-handle" onMouseDown={onResizeStart} />
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      align: { default: 'left' },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },
})

const TEXT_COLORS = [
  '#000000','#374151','#6B7280','#9CA3AF',
  '#DC2626','#EA580C','#D97706','#CA8A04',
  '#16A34A','#059669','#0284C7','#2563EB',
  '#7C3AED','#9333EA','#C026D3','#DB2777',
]

const HIGHLIGHT_COLORS = [
  '#FEF08A','#BBF7D0','#BAE6FD','#FECACA',
  '#E9D5FF','#FDE68A','#D1FAE5','#DBEAFE',
  '#FCE7F3','#F3F4F6','#FFEDD5','#ECFDF5',
]

function ToolBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      className={`nrte-btn${active ? ' active' : ''}${disabled ? ' nrte-btn-disabled' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Sep() { return <span className="nrte-sep" /> }

function ColorPicker({ colors, onSelect, title, icon }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="nrte-color-wrap" ref={ref}>
      <ToolBtn onClick={() => setOpen(v => !v)} title={title}>{icon}</ToolBtn>
      {open && (
        <div className="nrte-color-popover">
          <div className="nrte-color-grid">
            {colors.map(c => (
              <button
                key={c}
                type="button"
                className="nrte-swatch"
                style={{ background: c, border: c === '#F3F4F6' ? '1px solid #d1d5db' : 'none' }}
                onClick={() => { onSelect(c); setOpen(false) }}
                title={c}
              />
            ))}
          </div>
          <button type="button" className="nrte-color-clear" onClick={() => { onSelect(null); setOpen(false) }}>
            Remove colour
          </button>
        </div>
      )}
    </div>
  )
}

// ── SVG icons ──────────────────────────────────────────

const I = {
  AlignLeft: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="6" width="10" height="2" rx="1"/>
      <rect x="1" y="10" width="14" height="2" rx="1"/><rect x="1" y="14" width="8" height="2" rx="1"/>
    </svg>
  ),
  AlignCenter: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3" y="6" width="10" height="2" rx="1"/>
      <rect x="1" y="10" width="14" height="2" rx="1"/><rect x="4" y="14" width="8" height="2" rx="1"/>
    </svg>
  ),
  AlignRight: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="5" y="6" width="10" height="2" rx="1"/>
      <rect x="1" y="10" width="14" height="2" rx="1"/><rect x="7" y="14" width="8" height="2" rx="1"/>
    </svg>
  ),
  AlignJustify: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="6" width="14" height="2" rx="1"/>
      <rect x="1" y="10" width="14" height="2" rx="1"/><rect x="1" y="14" width="14" height="2" rx="1"/>
    </svg>
  ),
  BulletList: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="2" cy="4" r="1.5"/><rect x="5" y="3" width="10" height="2" rx="1"/>
      <circle cx="2" cy="8" r="1.5"/><rect x="5" y="7" width="10" height="2" rx="1"/>
      <circle cx="2" cy="12" r="1.5"/><rect x="5" y="11" width="10" height="2" rx="1"/>
    </svg>
  ),
  OrderedList: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <text x="0" y="5" fontSize="5" fontFamily="monospace">1.</text>
      <rect x="6" y="3" width="10" height="1.8" rx="0.9"/>
      <text x="0" y="9.5" fontSize="5" fontFamily="monospace">2.</text>
      <rect x="6" y="7.5" width="10" height="1.8" rx="0.9"/>
      <text x="0" y="14" fontSize="5" fontFamily="monospace">3.</text>
      <rect x="6" y="12" width="10" height="1.8" rx="0.9"/>
    </svg>
  ),
  Image: ({ spin }) => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={spin ? { animation: 'nrte-spin 1s linear infinite' } : {}}>
      <rect x="1" y="2" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="5.5" cy="6" r="1.5"/>
      <path d="M1 11l4-3 3 3 2.5-2 3.5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
  Link: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.5 9.5a4.5 4.5 0 006.364 0l1.5-1.5a4.5 4.5 0 00-6.364-6.364L6.5 3.136" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M9.5 6.5a4.5 4.5 0 00-6.364 0l-1.5 1.5a4.5 4.5 0 006.364 6.364l1.5-1.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  Blockquote: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h4v5H4a2 2 0 01-2-2V3zm7 0h4v5h-2a2 2 0 01-2-2V3zM4 8v5h1l2-3H4zm7 0v5h1l2-3h-3z"/>
    </svg>
  ),
  Code: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 3.5L1 8l4.5 4.5 1-1L2.5 8l3.5-3.5-0.5-1zm5 0l-1 1L13 8l-3.5 3.5 1 1L15 8l-4.5-4.5z"/>
    </svg>
  ),
  CodeBlock: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 5.5L1.5 8 4 10.5m8-5L14.5 8 12 10.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    </svg>
  ),
}

// ── Main component ─────────────────────────────────────

export default function NewsRichEditor({ content = '', onUpdate, placeholder = 'Start writing your article…', minHeight = 480 }) {
  const [, rerender] = useReducer(x => x + 1, 0)
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const uploadingRef = useRef(false)

  async function uploadFile(file) {
    const ext = file.name?.split('.').pop()?.toLowerCase() || 'png'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('article-images').upload(path, file, { upsert: false })
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(path)
    return publicUrl
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      HeadingExitOnEnter,
      Underline,
      LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      ResizableImage,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    onUpdate: ({ editor }) => onUpdate?.(editor.getHTML()),
    onTransaction: rerender,
    editorProps: {
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find(item => item.type.startsWith('image/'))
        if (!imageItem || uploadingRef.current) return false
        const file = imageItem.getAsFile()
        if (!file) return false
        uploadingRef.current = true
        uploadFile(file).then(url => {
          uploadingRef.current = false
          if (url) view.dispatch(view.state.tr.replaceSelectionWith(
            view.state.schema.nodes.image.create({ src: url })
          ))
        })
        return true
      },
    },
  })

  if (!editor) return null

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', prev || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    fileRef.current.value = ''
    setUploading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('article-images').upload(path, file, { upsert: false })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(path)
      editor.chain().focus().setImage({ src: publicUrl }).run()
    } else {
      console.error('Image upload failed — check Supabase storage bucket + policies')
    }
    setUploading(false)
  }

  const headingLevel = editor.isActive('heading', { level: 1 }) ? '1'
    : editor.isActive('heading', { level: 2 }) ? '2'
    : editor.isActive('heading', { level: 3 }) ? '3'
    : '0'

  return (
    <div className="nrte-wrap">
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      <div className="nrte-toolbar">
        {/* Paragraph / Heading style */}
        <select
          className="nrte-heading-sel"
          value={headingLevel}
          onChange={e => {
            const v = e.target.value
            const { selection, doc } = editor.state
            const { $from, empty } = selection

            const applyStyle = (chain) => {
              if (v === '0') chain.setParagraph().run()
              else chain.toggleHeading({ level: Number(v) }).run()
            }

            if (!empty) {
              // Text selected — apply only to selection
              applyStyle(editor.chain().focus())
              return
            }

            const atEnd = $from.parentOffset === $from.parent.content.size
            const isEmpty = $from.parent.content.size === 0

            if (!isEmpty && atEnd) {
              // Cursor at end of non-empty block — create new block in chosen style
              editor.chain().focus().splitBlock().run()
              applyStyle(editor.chain())
            } else {
              // Empty block or cursor mid-block — change current block style
              applyStyle(editor.chain().focus())
            }
          }}
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <Sep />

        {/* Text style */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolBtn>

        <Sep />

        {/* Colour */}
        <ColorPicker
          colors={TEXT_COLORS}
          title="Text colour"
          icon={<span className="nrte-color-icon">A</span>}
          onSelect={c => c ? editor.chain().focus().setColor(c).run() : editor.chain().focus().unsetColor().run()}
        />
        <ColorPicker
          colors={HIGHLIGHT_COLORS}
          title="Highlight"
          icon={<span className="nrte-highlight-icon">H</span>}
          onSelect={c => c ? editor.chain().focus().setHighlight({ color: c }).run() : editor.chain().focus().unsetHighlight().run()}
        />

        <Sep />

        {/* Alignment */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><I.AlignLeft /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centre"><I.AlignCenter /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><I.AlignRight /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><I.AlignJustify /></ToolBtn>

        <Sep />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><I.BulletList /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><I.OrderedList /></ToolBtn>

        <Sep />

        {/* Insert */}
        <ToolBtn onClick={() => fileRef.current?.click()} title={uploading ? 'Uploading…' : 'Insert image'} disabled={uploading}>
          <I.Image spin={uploading} />
        </ToolBtn>
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link"><I.Link /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Block quote"><I.Blockquote /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">—</ToolBtn>

        <Sep />

        {/* Code */}
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code"><I.Code /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><I.CodeBlock /></ToolBtn>

        <Sep />

        {/* History */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</ToolBtn>
      </div>

      <EditorContent
        editor={editor}
        className="nrte-editor"
        style={{ '--nrte-min-height': `${minHeight}px` }}
      />
    </div>
  )
}

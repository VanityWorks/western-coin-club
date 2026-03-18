import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useReducer, useRef, useState, useCallback } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { supabase } from '../lib/supabase'
import './RichTextEditor.css'

// ── Resizable image NodeView ───────────────────────────

function ImageView({ node, updateAttributes, selected }) {
  const { src, alt, width, align } = node.attrs
  const startX = useRef(0)
  const startW = useRef(0)

  const onResizeStart = useCallback((e) => {
    e.preventDefault()
    startX.current = e.clientX
    startW.current = parseInt(width) || e.target.closest('.rte-img-wrap').offsetWidth
    function onMove(e) {
      updateAttributes({ width: Math.max(80, startW.current + (e.clientX - startX.current)) + 'px' })
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [width, updateAttributes])

  return (
    <NodeViewWrapper className={`rte-img-node align-${align || 'left'}`} data-drag-handle>
      <div className={`rte-img-wrap${selected ? ' selected' : ''}`} style={{ width: width || 'auto' }}>
        <img src={src} alt={alt || ''} draggable="false" />
        {selected && (
          <>
            <div className="rte-img-controls">
              <button type="button" className={!align || align === 'left' ? 'active' : ''} onClick={() => updateAttributes({ align: 'left' })} title="Align left">⬅</button>
              <button type="button" className={align === 'center' ? 'active' : ''} onClick={() => updateAttributes({ align: 'center' })} title="Centre">↔</button>
              <button type="button" className={align === 'right' ? 'active' : ''} onClick={() => updateAttributes({ align: 'right' })} title="Align right">➡</button>
              <span className="rte-img-divider" />
              <button type="button" onClick={() => updateAttributes({ width: null })} title="Reset size">↺</button>
            </div>
            <div className="rte-resize-handle" onMouseDown={onResizeStart} />
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}

const ResizableImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), width: { default: null }, align: { default: 'left' } }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },
})

function ToolBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      className={`rte-btn${active ? ' rte-btn-active' : ''}${disabled ? ' rte-btn-disabled' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="rte-divider" />
}

const ImageIcon = ({ spin }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
    style={spin ? { animation: 'rte-spin 1s linear infinite' } : {}}>
    <rect x="1" y="2" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="5.5" cy="6" r="1.5"/>
    <path d="M1 11l4-3 3 3 2.5-2 3.5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
  </svg>
)

export default function RichTextEditor({ content = '', onUpdate, placeholder = 'Write your post…', minHeight = 160 }) {
  const [, rerender] = useReducer(x => x + 1, 0)
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const uploadingRef = useRef(false)

  async function uploadFile(file) {
    const ext = file.name?.split('.').pop()?.toLowerCase() || 'png'
    const path = `forum/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('article-images').upload(path, file, { upsert: false })
    if (error) { console.error('Supabase storage error:', error.message, error); return null }
    const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(path)
    return publicUrl
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      ResizableImage,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML())
    },
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

  async function handleImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    fileRef.current.value = ''
    setUploading(true)
    uploadingRef.current = true
    const url = await uploadFile(file)
    uploadingRef.current = false
    setUploading(false)
    if (url) editor.chain().focus().setImage({ src: url }).run()
    else console.error('Image upload failed')
  }

  return (
    <div className="rte-wrap">
      {/* Hidden file input — on mobile this opens gallery/camera picker */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFile}
      />

      <div className="rte-toolbar">
        <div className="rte-group">
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolBtn>
        </div>
        <Divider />
        <div className="rte-group">
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolBtn>
        </div>
        <Divider />
        <div className="rte-group">
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="2" cy="4" r="1.5"/><rect x="5" y="3" width="11" height="2" rx="1"/><circle cx="2" cy="8" r="1.5"/><rect x="5" y="7" width="11" height="2" rx="1"/><circle cx="2" cy="12" r="1.5"/><rect x="5" y="11" width="11" height="2" rx="1"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><text x="0" y="5" fontSize="5" fontFamily="monospace">1.</text><rect x="6" y="3" width="10" height="1.8" rx="0.9"/><text x="0" y="9.5" fontSize="5" fontFamily="monospace">2.</text><rect x="6" y="7.5" width="10" height="1.8" rx="0.9"/><text x="0" y="14" fontSize="5" fontFamily="monospace">3.</text><rect x="6" y="12" width="10" height="1.8" rx="0.9"/></svg>
          </ToolBtn>
        </div>
        <Divider />
        <div className="rte-group">
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 4h2v4H3V4zm0 6h2v4H3v-4zm5-6h2v4H8V4zm0 6h2v4H8v-4z"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 3.5L1 8l4.5 4.5 1-1L2.5 8l3.5-3.5-0.5-1zm5 0l-1 1L13 8l-3.5 3.5 1 1L15 8l-4.5-4.5z"/></svg>
          </ToolBtn>
        </div>
        <Divider />
        <div className="rte-group">
          <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 9.5a4.5 4.5 0 006.364 0l1.5-1.5a4.5 4.5 0 00-6.364-6.364L6.5 3.136" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M9.5 6.5a4.5 4.5 0 00-6.364 0l-1.5 1.5a4.5 4.5 0 006.364 6.364l1.5-1.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          </ToolBtn>
          <ToolBtn
            onClick={() => fileRef.current?.click()}
            title={uploading ? 'Uploading…' : 'Insert image'}
            disabled={uploading}
          >
            <ImageIcon spin={uploading} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">—</ToolBtn>
        </div>
        <Divider />
        <div className="rte-group">
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</ToolBtn>
        </div>
      </div>
      <EditorContent editor={editor} className="rte-editor" style={{ '--rte-min-height': `${minHeight}px` }} />
    </div>
  )
}

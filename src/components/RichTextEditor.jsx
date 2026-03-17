import { useEditor, EditorContent } from '@tiptap/react'
import { useReducer } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import './RichTextEditor.css'

function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      className={`rte-btn${active ? ' rte-btn-active' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="rte-divider" />
}

export default function RichTextEditor({ content = '', onUpdate, placeholder = 'Write your post…', minHeight = 160 }) {
  const [, rerender] = useReducer(x => x + 1, 0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML())
    },
    // Re-render toolbar on every state change (selection, marks, etc.)
    onTransaction: rerender,
  })

  if (!editor) return null

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', prev || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="rte-wrap">
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
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M4 5.5L1.5 8 4 10.5m8-5L14.5 8 12 10.5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
          </ToolBtn>
        </div>
        <Divider />
        <div className="rte-group">
          <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 9.5a4.5 4.5 0 006.364 0l1.5-1.5a4.5 4.5 0 00-6.364-6.364L6.5 3.136" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M9.5 6.5a4.5 4.5 0 00-6.364 0l-1.5 1.5a4.5 4.5 0 006.364 6.364l1.5-1.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
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

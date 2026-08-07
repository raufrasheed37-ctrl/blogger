"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './styles.module.css'
import { blogAPI } from '@/utils/api'

const DEFAULT_TITLE = 'The quiet art of writing every single day'
const DEFAULT_SUBTITLE = 'How showing up, even when you have nothing to say, changes everything about how you create.'
const DEFAULT_CONTENT = `
  <p>When you write each day you sharpen the muscle of attention. The first words are always messy, but the practice is what matters.</p>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>
  <p>Curabitur sodales ligula in libero. Sed dignissim lacinia nunc.</p>
  <p>Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa.</p>
  <p>Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra.</p>
`

const CATEGORY_OPTIONS = ['Explore', 'Technology', 'Business', 'Culture', 'Sports', 'Entertainment']

function createDefaultDraft() {
  return {
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
    contentHtml: DEFAULT_CONTENT,
    tags: ['Writing', 'Mindfulness', 'Creativity'],
    category: 'Explore',
    visibility: 'Public — everyone',
    allowComments: true,
    featureOnProfile: false,
  }
}

function htmlToText(html) {
  if (!html) return ''
  if (typeof document === 'undefined') return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  return (wrapper.textContent || wrapper.innerText || '').replace(/\s+/g, ' ').trim()
}

function splitContentAndTags(html, fallbackTags = []) {
  if (typeof document === 'undefined') {
    return { tags: fallbackTags.length > 0 ? fallbackTags : [''], bodyHtml: html || '' }
  }

  if (!html) {
    return { tags: fallbackTags.length > 0 ? fallbackTags : [''], bodyHtml: '' }
  }

  const wrapper = document.createElement('div')
  wrapper.innerHTML = html

  const firstChild = wrapper.firstElementChild
  if (firstChild?.tagName === 'P') {
    const text = firstChild.textContent || ''
    const match = text.match(/^Tags:\s*(.*)$/i)

    if (match) {
      const tags = match[1]
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      firstChild.remove()

      return {
        tags: tags.length > 0 ? tags : [''],
        bodyHtml: wrapper.innerHTML || '',
      }
    }
  }

  return {
    tags: fallbackTags.length > 0 ? fallbackTags : [''],
    bodyHtml: html,
  }
}

function buildDraft(post) {
  const fallback = createDefaultDraft()
  const fallbackTags = Array.isArray(post?.tags) && post.tags.length > 0 ? post.tags : fallback.tags
  const { tags, bodyHtml } = splitContentAndTags(post?.content || '', fallbackTags)

  return {
    _id: post?._id || post?.id || '',
    title: post?.title || fallback.title,
    subtitle: post?.excerpt || fallback.subtitle,
    contentHtml: bodyHtml || fallback.contentHtml,
    tags: tags.length > 0 ? tags : fallback.tags,
    category: post?.category || fallback.category,
    visibility: post?.visibility || fallback.visibility,
    allowComments: typeof post?.allowComments === 'boolean' ? post.allowComments : fallback.allowComments,
    featureOnProfile: typeof post?.featureOnProfile === 'boolean' ? post.featureOnProfile : fallback.featureOnProfile,
  }
}

function getMetrics(draft) {
  const text = `${draft.title} ${draft.subtitle} ${htmlToText(draft.contentHtml)}`.trim()
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0
  const chars = text.length
  const readingTime = Math.max(1, Math.round(words / 220))

  return { words, chars, readingTime }
}

function EditorDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugParam = searchParams?.get?.('slug') || ''

  const editorRef = useRef(null)
  const originalDraftRef = useRef(createDefaultDraft())
  const lastSyncedHtmlRef = useRef('')

  const [draft, setDraft] = useState(() => createDefaultDraft())
  const [postId, setPostId] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const metrics = useMemo(() => getMetrics(draft), [draft])

  const applyFormat = useCallback((command, value = null) => {
    if (previewMode || !editorRef.current) return
    document.execCommand(command, false, value)
    setDraft((current) => ({ ...current, contentHtml: editorRef.current?.innerHTML || '' }))
    setIsDirty(true)
    setStatusMessage('Unsaved changes')
    editorRef.current.focus()
  }, [previewMode])

  const syncEditorHtml = useCallback(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML !== draft.contentHtml) {
      editorRef.current.innerHTML = draft.contentHtml
    }
  }, [draft.contentHtml])

  useEffect(() => {
    let cancelled = false

    const loadPost = async () => {
      setLoading(true)
      setError('')

      if (!slugParam) {
        const fallbackDraft = createDefaultDraft()
        originalDraftRef.current = fallbackDraft
        setDraft(fallbackDraft)
        setPostId('')
        setIsDirty(false)
        setLoading(false)
        return
      }

      try {
        const response = await blogAPI.getById(slugParam)
        const resolvedPost = response?.post || response
        const loadedDraft = buildDraft(resolvedPost)

        if (cancelled) return

        originalDraftRef.current = loadedDraft
        setDraft(loadedDraft)
        setPostId(loadedDraft._id || resolvedPost?._id || resolvedPost?.id || slugParam)
        setIsDirty(false)
        setPreviewMode(false)
        setStatusMessage('Loaded post')
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Failed to load post')
          const fallbackDraft = createDefaultDraft()
          originalDraftRef.current = fallbackDraft
          setDraft(fallbackDraft)
          setPostId('')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPost()

    return () => {
      cancelled = true
    }
  }, [slugParam])
  useEffect(() => {
    if (!previewMode && editorRef.current && draft.contentHtml !== lastSyncedHtmlRef.current) {
      editorRef.current.innerHTML = draft.contentHtml
      lastSyncedHtmlRef.current = draft.contentHtml
    }
  }, [draft.contentHtml, previewMode])

  const updateField = useCallback((field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setIsDirty(true)
    setStatusMessage('Unsaved changes')
  }, [])

  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return
    const nextHtml = editorRef.current?.innerHTML || ''
    lastSyncedHtmlRef.current = nextHtml
    setDraft((current) => ({ ...current, contentHtml: nextHtml }))
    setIsDirty(true)
    setStatusMessage('Unsaved changes')
  }, [])

  const handleAddTag = useCallback(() => {
    const nextTag = window.prompt('Add a tag')?.trim()
    if (!nextTag) return

    setDraft((current) => {
      const nextTags = Array.from(new Set([...current.tags.filter(Boolean), nextTag]))
      return { ...current, tags: nextTags }
    })
    setIsDirty(true)
    setStatusMessage('Unsaved changes')
  }, [])

  const handleRemoveTag = useCallback((tagToRemove) => {
    setDraft((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag !== tagToRemove),
    }))
    setIsDirty(true)
    setStatusMessage('Unsaved changes')
  }, [])

  const handlePreview = useCallback(() => {
    if (!editorRef.current) {
      setPreviewMode((current) => !current)
      return
    }

    const nextHtml = editorRef.current?.innerHTML || draft.contentHtml
    lastSyncedHtmlRef.current = nextHtml
    setDraft((current) => ({ ...current, contentHtml: nextHtml }))
    setPreviewMode((current) => !current)
  }, [draft.contentHtml])

  const handleDiscard = useCallback(() => {
    const confirmed = window.confirm('Discard unsaved changes?')
    if (!confirmed) return

    const resetDraft = originalDraftRef.current || createDefaultDraft()
    lastSyncedHtmlRef.current = resetDraft.contentHtml
    if (editorRef.current) {
      editorRef.current.innerHTML = resetDraft.contentHtml
    }
    setDraft(resetDraft)
    setPreviewMode(false)
    setIsDirty(false)
    setStatusMessage('Changes discarded')
    setError('')
  }, [])

  const handleSave = useCallback(async () => {
    if (!postId) {
      setError('Unable to save without a post ID.')
      return
    }

    const contentHtml = editorRef.current?.innerHTML || draft.contentHtml

    setIsSaving(true)
    setError('')

    try {
      await blogAPI.update(postId, {
  title: draft.title.trim(),
  content: contentHtml,
  excerpt: draft.subtitle.trim(),
  category: draft.category,
});
      const savedDraft = { ...draft, contentHtml }
      originalDraftRef.current = savedDraft
      lastSyncedHtmlRef.current = contentHtml
      setDraft(savedDraft)
      setIsDirty(false)
      setStatusMessage('Changes saved')
      router.push(`/blog/${slugParam || postId}`)
    } catch (saveError) {
      setError(saveError?.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }, [draft, postId])

  const canEdit = !previewMode && !loading
  const statusText = isDirty ? 'Unsaved changes' : 'Saved'

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.leftGroup}>
          <div>
            <div className={styles.logo}>Pulse.</div>
            {slugParam && <div className={styles.small}>Editing post: {slugParam}</div>}
          </div>
          <div className={styles.statusPill}>
            <span className={styles.pulseGlow} />Editing
          </div>
        </div>

        <div className={styles.rightGroup}>
          <button type="button" className={styles.ghost} onClick={handlePreview}>{previewMode ? 'Exit preview' : 'Preview'}</button>
          <button type="button" className={styles.warn} onClick={handleDiscard}>Discard</button>
          <button type="button" className={styles.primary} onClick={handleSave} disabled={isSaving}>
            {isSaving
  ? "Saving..."
  : isDirty
  ? "Save Changes"
  : "Saved"}
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {[
            { label: 'B', command: 'bold' },
            { label: 'I', command: 'italic' },
            { label: 'U', command: 'underline' },
            { label: 'S', command: 'strikeThrough' },
          ].map((button) => (
            <button
              key={button.command}
              type="button"
              className={styles.iconBtn}
              onClick={() => applyFormat(button.command)}
              disabled={!canEdit}
              aria-label={button.command}
            >
              {button.label}
            </button>
          ))}

          <div className={styles.divider} />

          {[
            { label: 'L', command: 'justifyLeft' },
            { label: 'C', command: 'justifyCenter' },
            { label: 'R', command: 'justifyRight' },
          ].map((button) => (
            <button
              key={button.command}
              type="button"
              className={styles.iconBtn}
              onClick={() => applyFormat(button.command)}
              disabled={!canEdit}
              aria-label={button.command}
            >
              {button.label}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>{previewMode ? 'Preview mode' : 'Formatting • Normal'}</div>
      </div>

      <main className={styles.mainGrid}>
        <section className={styles.editorCol}>
          {loading && <div className={styles.warning}>Loading post...</div>}
          {error && <div className={styles.warning}>{error}</div>}
          {isDirty && !loading && <div className={styles.warning}>You have unsaved changes to this post.</div>}

          <article className={styles.titleCard}>
            <input
              className={styles.titleInput}
              value={draft.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder={DEFAULT_TITLE}
              disabled={previewMode}
            />
            <textarea
              className={styles.subtitleInput}
              value={draft.subtitle}
              onChange={(event) => updateField('subtitle', event.target.value)}
              placeholder={DEFAULT_SUBTITLE}
              disabled={previewMode}
              rows={3}
            />
          </article>

          <div className={styles.contentScroll}>
            <div
              ref={editorRef}
              className={styles.contentInner}
              contentEditable={!previewMode}
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
            />
          </div>
        </section>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Tags</div>
            <div className={styles.tagsRow}>
              {draft.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button type="button" className={styles.tagRemove} onClick={() => handleRemoveTag(tag)} aria-label={`Remove ${tag}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button type="button" className={styles.addTag} onClick={handleAddTag}>+ Add tag</button>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Post settings</div>
            <label className={styles.field}>
              Category
              <select className={styles.select} value={draft.category} onChange={(event) => updateField('category', event.target.value)} disabled={previewMode}>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Visibility
              <select className={styles.select} value={draft.visibility} onChange={(event) => updateField('visibility', event.target.value)} disabled={previewMode}>
                <option>Public — everyone</option>
                <option>Private</option>
                <option>Subscribers only</option>
              </select>
            </label>
            <div className={styles.toggles}>
              {/*
              <label className={styles.toggleRow}>
                <span>Allow comments</span>
                <input
                  type="checkbox"
                  checked={draft.allowComments}
                  onChange={(event) => updateField('allowComments', event.target.checked)}
                  disabled={previewMode}
                />
              </label>
              */}
                {/*
                <label className={styles.toggleRow}>
                  <span>Feature on profile</span>
                  <input
                    type="checkbox"
                    checked={draft.featureOnProfile}
                    onChange={(event) => updateField('featureOnProfile', event.target.checked)}
                    disabled={previewMode}
                  />
                </label>
                */}
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>What changed</div>
            <div className={styles.activityItem}>Loaded draft • <span className={styles.green}>Ready to edit</span></div>
            <div className={styles.activityItem}>Status • <span className={styles.green}>{statusMessage || statusText}</span></div>
          </div>
        </aside>
      </main>

      <footer className={styles.bottomBar}>
        <div className={styles.stats}>
          {metrics.words.toLocaleString()} words • {metrics.readingTime} min read • {metrics.chars.toLocaleString()} chars
        </div>
        <div className={styles.bottomRight}>
          <div className={isDirty ? styles.unsavedFlag : styles.savedFlag}>{statusText}</div>
        </div>
      </footer>
    </div>
  )
}

export default function EditorDashboard() {
  return (
    <Suspense fallback={<div />}>
      <EditorDashboardContent />
    </Suspense>
  )
}

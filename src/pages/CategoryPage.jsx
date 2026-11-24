import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import CategoryFormModal from '../components/categories/CategoryFormModal.jsx'
import CategoryTable from '../components/categories/CategoryTable.jsx'
import DeleteCategoryDialog from '../components/categories/DeleteCategoryDialog.jsx'
import Pagination from '../components/categories/Pagination.jsx'
import { useToast } from '../components/ui/toast-context.js'
import {
  createCategory,
  deleteCategory,
  FORM_ERROR_CODES,
  getCategories,
  updateCategory,
} from '../lib/categoryService.js'

const PAGE_SIZE = 10

export default function CategoryPage() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formModal, setFormModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, perPage: PAGE_SIZE })

  const loadCategories = useCallback(async ({ silent = false, targetPage = 1 } = {}) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const result = await getCategories({ page: targetPage, perPage: PAGE_SIZE })
      setCategories(result.items)
      setMeta({
        total: result.total,
        totalPages: result.totalPages,
        perPage: result.perPage,
      })
      if (result.page !== targetPage) setPage(result.page)
      return result
    } catch (err) {
      if (!silent) setError(err.message || 'Gagal memuat daftar kategori.')
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const totalPages = Math.max(1, meta.totalPages || 1)
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const pageSize = meta.perPage || PAGE_SIZE

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      if (active) loadCategories({ targetPage: currentPage })
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [currentPage, loadCategories])

  const handleFormSubmit = async (name) => {
    const isEdit = formModal?.mode === 'edit'
    const targetPage = isEdit ? currentPage : 1

    try {
      if (isEdit) {
        await updateCategory(formModal.category.id, name)
      } else {
        await createCategory(name)
      }
      showToast(
        'success',
        isEdit
          ? 'Kategori berhasil diperbarui'
          : 'Kategori berhasil ditambahkan',
      )
      setFormModal(null)

      if (!isEdit && currentPage !== 1) {
        setPage(1)
      } else {
        await loadCategories({ silent: true, targetPage })
      }
    } catch (err) {
      if (FORM_ERROR_CODES.has(err.code)) throw err
      showToast(
        'error',
        isEdit ? 'Gagal memperbarui kategori' : 'Gagal menambahkan kategori',
      )
    }
  }

  const handleDelete = async () => {
    if (!deleting) return { ok: false }
    try {
      await deleteCategory(deleting.id)
      showToast('success', 'Kategori berhasil dihapus')
      setDeleting(null)
      await loadCategories({ silent: true, targetPage: currentPage })
      return { ok: true }
    } catch (err) {
      const message = err.message || 'Gagal menghapus kategori.'
      showToast('error', message)
      return { ok: false, error: err }
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Kategori
          </h1>
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">
            Kelola kategori produk milik Anda dan melihat jumlah produk di dalamnya.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormModal({ mode: 'create' })}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-pink-dark px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_#c2607a] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
        >
          <Plus className="size-4" />
          Tambah Kategori
        </button>
      </div>

      <section
        aria-label="Daftar kategori"
        className="mt-6 overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
      >
        <CategoryTable
          categories={categories}
          loading={loading}
          error={error}
          page={currentPage}
          pageSize={pageSize}
          onRetry={() => loadCategories({ targetPage: currentPage })}
          onAdd={() => setFormModal({ mode: 'create' })}
          onEdit={(category) => setFormModal({ mode: 'edit', category })}
          onDelete={(category) => setDeleting(category)}
        />
      </section>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={meta.total}
        pageSize={pageSize}
        onChange={setPage}
      />

      {formModal && (
        <CategoryFormModal
          key={formModal.mode === 'edit' ? formModal.category.id : 'create'}
          open
          mode={formModal.mode}
          initialName={formModal.category?.name ?? ''}
          onSubmit={handleFormSubmit}
          onClose={() => setFormModal(null)}
        />
      )}

      <DeleteCategoryDialog
        open={Boolean(deleting)}
        category={deleting}
        onSubmit={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

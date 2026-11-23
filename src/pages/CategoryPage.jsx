import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import CategoryFormModal from '../components/categories/CategoryFormModal.jsx'
import CategoryTable from '../components/categories/CategoryTable.jsx'
import DeleteCategoryDialog from '../components/categories/DeleteCategoryDialog.jsx'
import Pagination from '../components/categories/Pagination.jsx'
import { useToast } from '../components/ui/toast-context.js'
import {
  createCategory,
  deleteCategory,
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

  const loadCategories = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      setCategories(await getCategories())
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar kategori.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      if (active) loadCategories()
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [loadCategories])

  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pageCategories = useMemo(
    () =>
      categories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [categories, currentPage],
  )

  const existingNames = useMemo(
    () => categories.map((category) => category.name.toLocaleLowerCase('id-ID')),
    [categories],
  )

  const formNames = useMemo(() => {
    if (formModal?.mode !== 'edit') return existingNames
    return categories
      .filter((category) => category.id !== formModal.category.id)
      .map((category) => category.name.toLocaleLowerCase('id-ID'))
  }, [categories, existingNames, formModal])

  const handleFormSubmit = async (name) => {
    const isEdit = formModal?.mode === 'edit'
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
      if (!isEdit) setPage(1)
      await loadCategories({ silent: true })
    } catch (err) {
      if (
        err.code === 'VALIDATION' ||
        err.code === 'DUPLICATE' ||
        err.code === 'NOT_FOUND'
      ) {
        throw err
      }
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
      await loadCategories({ silent: true })
      return { ok: true }
    } catch (err) {
      showToast('error', 'Gagal menghapus kategori')
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
          categories={pageCategories}
          loading={loading}
          error={error}
          page={currentPage}
          pageSize={PAGE_SIZE}
          onRetry={() => loadCategories()}
          onAdd={() => setFormModal({ mode: 'create' })}
          onEdit={(category) => setFormModal({ mode: 'edit', category })}
          onDelete={(category) => setDeleting(category)}
        />
      </section>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={categories.length}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />

      {formModal && (
        <CategoryFormModal
          key={formModal.mode === 'edit' ? formModal.category.id : 'create'}
          open
          mode={formModal.mode}
          initialName={formModal.category?.name ?? ''}
          existingNames={formNames}
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

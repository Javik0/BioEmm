import { useState, useMemo } from 'react'
import { Product } from '@/types'
import { ProductForm, ProductList, CatalogImporter, useProducts } from '@/features/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Upload, MagnifyingGlass, Funnel, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const ITEMS_PER_PAGE = 10

export default function ProductsPage() {
  const { products, loading, error, upsertProduct, deleteProduct } = useProducts()
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [catalogImporterOpen, setCatalogImporterOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const productsList = products || []

  // Filter and Pagination Logic
  const filteredProducts = useMemo(() => {
    return productsList.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [productsList, searchTerm, categoryFilter])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter])

  const uniqueCategories = useMemo(() => {
    const categories = new Set(productsList.map(p => p.category))
    return Array.from(categories).filter(Boolean).sort()
  }, [productsList])

  const handleCreateProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      if (editingProduct) {
        await upsertProduct({
          ...productData,
          id: editingProduct.id,
          createdAt: editingProduct.createdAt
        })
        toast.success(`Producto ${productData.name} actualizado`)
        setEditingProduct(undefined)
      } else {
        const newProduct: Product = {
          ...productData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
        await upsertProduct(newProduct)
        toast.success(`Producto ${newProduct.name} agregado al inventario`)
      }
      
      setProductFormOpen(false)
    } catch (error) {
      toast.error('Error al guardar el producto')
      console.error(error)
    }
  }

  const handleImportCatalog = async (importedProducts: Omit<Product, 'id' | 'createdAt'>[]) => {
    try {
      const promises = importedProducts.map(productData => {
        const newProduct: Product = {
          ...productData,
          id: Date.now().toString() + Math.random(),
          createdAt: new Date().toISOString()
        }
        return upsertProduct(newProduct)
      })
      
      await Promise.all(promises)
      toast.success(`${importedProducts.length} productos importados correctamente`)
    } catch (error) {
      toast.error('Error al importar productos')
      console.error(error)
    }
    setCatalogImporterOpen(false)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductFormOpen(true)
  }

  const handleDeleteProduct = (productId: string) => {
    const product = productsList.find(p => p.id === productId)
    if (!product) return
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return
    
    try {
      await deleteProduct(productToDelete.id)
      toast.success('Producto eliminado')
    } catch (error) {
      toast.error('Error al eliminar el producto')
      console.error(error)
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const handleAdjustStock = () => {
    toast.info('Para ajustar stock, usa la pestaña “Inventario”.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <MagnifyingGlass className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Funnel size={16} />
                <SelectValue placeholder="Categoría" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <Button onClick={() => setCatalogImporterOpen(true)} variant="outline">
            <Upload className="mr-2" />
            Importar
          </Button>
          <Button onClick={() => {
            setEditingProduct(undefined)
            setProductFormOpen(true)
          }}>
            <Plus className="mr-2" />
            Nuevo
          </Button>
        </div>
      </div>

      <ProductList
        products={paginatedProducts}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onAdjustStock={handleAdjustStock}
      />

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        onSubmit={handleCreateProduct}
        editProduct={editingProduct}
      />

      <CatalogImporter
        open={catalogImporterOpen}
        onOpenChange={setCatalogImporterOpen}
        onImport={handleImportCatalog}
        existingProducts={productsList}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Warning size={24} weight="fill" />
              ¿Eliminar producto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el producto <strong>{productToDelete?.name}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProduct} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

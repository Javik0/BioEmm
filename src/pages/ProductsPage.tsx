import { useState } from 'react'
import { Product } from '@/types'
import { ProductForm, ProductList, CatalogImporter, useProducts } from '@/features/products'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function ProductsPage() {
  const { products, loading, error, upsertProduct, deleteProduct } = useProducts()
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [catalogImporterOpen, setCatalogImporterOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()

  const productsList = products || []

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

  const handleDeleteProduct = async (productId: string) => {
    const product = productsList.find(p => p.id === productId)
    if (!product) return

    if (confirm(`¿Eliminar producto ${product.name}?`)) {
      try {
        await deleteProduct(productId)
        toast.success('Producto eliminado')
      } catch (error) {
        toast.error('Error al eliminar el producto')
        console.error(error)
      }
    }
  }

  const handleAdjustStock = () => {
    toast.info('Para ajustar stock, usa la pestaña “Inventario”.')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={() => setCatalogImporterOpen(true)} variant="outline">
          <Upload className="mr-2" />
          Importar Catálogo
        </Button>
        <Button onClick={() => {
          setEditingProduct(undefined)
          setProductFormOpen(true)
        }}>
          <Plus className="mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <ProductList
        products={productsList}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onAdjustStock={handleAdjustStock}
      />

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
    </div>
  )
}

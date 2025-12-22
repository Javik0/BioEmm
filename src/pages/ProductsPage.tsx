import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product } from '@/types'
import { ProductForm, ProductList, CatalogImporter } from '@/features/products'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function ProductsPage() {
  const [products, setProducts] = useKV<Product[]>('bioemm-products', [])
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [catalogImporterOpen, setCatalogImporterOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()

  const productsList = products || []

  const handleCreateProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    if (editingProduct) {
      setProducts((current) =>
        (current || []).map((p) =>
          p.id === editingProduct.id
            ? { ...productData, id: editingProduct.id, createdAt: editingProduct.createdAt }
            : p
        )
      )
      toast.success(`Producto ${productData.name} actualizado`)
      setEditingProduct(undefined)
    } else {
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      setProducts((current) => [...(current || []), newProduct])
      toast.success(`Producto ${newProduct.name} agregado al inventario`)
    }
    
    setProductFormOpen(false)
  }

  const handleImportCatalog = (importedProducts: Omit<Product, 'id' | 'createdAt'>[]) => {
    const newProducts: Product[] = importedProducts.map(productData => ({
      ...productData,
      id: Date.now().toString() + Math.random(),
      createdAt: new Date().toISOString()
    }))
    
    setProducts((current) => [...(current || []), ...newProducts])
    toast.success(`${newProducts.length} productos importados correctamente`)
    setCatalogImporterOpen(false)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductFormOpen(true)
  }

  const handleDeleteProduct = (productId: string) => {
    const product = productsList.find(p => p.id === productId)
    if (!product) return

    if (confirm(`¿Eliminar producto ${product.name}?`)) {
      setProducts((current) => (current || []).filter(p => p.id !== productId))
      toast.success('Producto eliminado')
    }
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
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />

      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        onSubmit={handleCreateProduct}
        initialData={editingProduct}
      />

      <CatalogImporter
        open={catalogImporterOpen}
        onOpenChange={setCatalogImporterOpen}
        onImport={handleImportCatalog}
      />
    </div>
  )
}

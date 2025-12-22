import { useState } from 'react'
import { Product } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Package, Upload, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CatalogProduct {
  sku: string
  nombre: string
  marca: string
  tipo: string
  composicion: string
  presentacion?: string[]
  descripcion: string
}

interface CatalogImporterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (products: Omit<Product, 'id' | 'createdAt'>[]) => void
  existingProducts: Product[]
}

const INITIAL_CATALOG: CatalogProduct[] = [
  {
    sku: "ELIXIR",
    nombre: "Elixir",
    marca: "Elicitech",
    tipo: "Bioestimulante",
    composicion: "Aminoácidos libres 5%, Extracto de algas 24.65%, Azúcares reductores 9.50%",
    descripcion: "Balance Hormonal 3:2:1. Inductor de producción y metabolismo secundario."
  },
  {
    sku: "PENTAGRAM",
    nombre: "Pentagram",
    marca: "Elicitech",
    tipo: "Bioestimulante Radicular",
    composicion: "CaO 13.10%, Ácidos fúlvicos 19.65%, N Total 6.55%",
    presentacion: ["4L", "20L"],
    descripcion: "Triple acción: mejorador de suelo, inductor radicular e inductor defensivo."
  },
  {
    sku: "CUPROCITOR",
    nombre: "Cuprocitor",
    marca: "Elicitech",
    tipo: "Corrector",
    composicion: "Cobre 5.90%, Ácidos fúlvicos 13.20%, N Total 0.38%",
    presentacion: ["4L", "20L"],
    descripcion: "Protección contra hongos/bacterias y promotor de balance auxinas-citoquininas."
  },
  {
    sku: "MAGMA",
    nombre: "Magma Mg/Zn",
    marca: "Elicitech",
    tipo: "Corrector",
    composicion: "MgO 8.45%, Zn 1.82%, N 6.50%",
    presentacion: ["1L", "20L"],
    descripcion: "Síntesis de clorofila y movilización de azúcares al fruto."
  },
  {
    sku: "NANO-CA",
    nombre: "Nanocrop Calcio",
    marca: "Nanocrop",
    tipo: "Nanotecnología",
    composicion: "Nano CaO 1.57%, Aminoácidos 16.56%",
    presentacion: ["1L"],
    descripcion: "Favorece asimilación de Ca, resistencia mecánica y vida post-cosecha."
  },
  {
    sku: "NANO-ZN",
    nombre: "Nanocrop Zinc",
    marca: "Nanocrop",
    tipo: "Nanotecnología",
    composicion: "Nano ZnO 0.21%, Zn 0.17%, Aminoácidos 16.80%",
    presentacion: ["1L"],
    descripcion: "Alta eficiencia en absorción y movilidad de Zinc."
  },
  {
    sku: "NANO-MANZINC",
    nombre: "Nanocrop Manzinc",
    marca: "Nanocrop",
    tipo: "Nanotecnología",
    composicion: "Nano MnO 0.10%, Nano ZnO 0.10%, Aminoácidos 16.80%",
    presentacion: ["1L"],
    descripcion: "Corrige carencias por bloqueo de Mn y Zn."
  },
  {
    sku: "NANO-CU",
    nombre: "Nanocrop Cobre",
    marca: "Nanocrop",
    tipo: "Nanotecnología",
    composicion: "Nano CuO 0.21%, Cu 0.17%, Aminoácidos 16.80%",
    presentacion: ["1L"],
    descripcion: "Efecto fungistático y estimulación de defensas naturales."
  },
  {
    sku: "NANO-MO",
    nombre: "Nanocrop Molibdeno",
    marca: "Nanocrop",
    tipo: "Nanotecnología",
    composicion: "Nano MoO 0.21%, Mo 0.14%, Aminoácidos 16.80%",
    presentacion: ["1L"],
    descripcion: "Genera enzima Nitrato Reductasa y potencializa el Potasio."
  },
  {
    sku: "IK-NODOSUM",
    nombre: "IK Nodosum",
    marca: "Kaliter",
    tipo: "Bioestimulante",
    composicion: "Ext. Ascophyllum nodosum 20%, Ác. Algínico 3.40%, Manitol 2%",
    descripcion: "Aumenta movilización de nutrientes y desarrollo radicular."
  },
  {
    sku: "IK-CALIX",
    nombre: "IK Calix",
    marca: "Kaliter",
    tipo: "Inductor",
    composicion: "CaO 10.24%, Boro 0.55%",
    descripcion: "Corrector Ca/B. Potencia rigidez y calidad del fruto."
  },
  {
    sku: "SULKAT",
    nombre: "Sulkat",
    marca: "Kaliter",
    tipo: "Inductor",
    composicion: "K2O 36.50%, SO3 61.32%",
    descripcion: "Metaboliza N y K, promueve balance mineral."
  },
  {
    sku: "IK-KALIUM",
    nombre: "IK Kalium",
    marca: "Kaliter",
    tipo: "Inductor",
    composicion: "P2O5 44.52%, K2O 50.88%",
    descripcion: "Mejora absorción de nutrientes, calibre y homogeneidad."
  },
  {
    sku: "FLOWERDRIVE",
    nombre: "Flowerdrive",
    marca: "Kaliter",
    tipo: "Inductor",
    composicion: "Boro 9.62%, Molibdeno 4.23%",
    descripcion: "Aumenta polinización, cuajado y división celular."
  },
  {
    sku: "NOVOSAL",
    nombre: "Novosal",
    marca: "Kaliter",
    tipo: "Activador Suelo",
    composicion: "CaO 13.10%, N 6.55%, Ácidos carboxílicos",
    presentacion: ["4L", "20L"],
    descripcion: "Promotor de tejido meristemático y calidad en producción."
  },
  {
    sku: "BLENDA",
    nombre: "Blenda",
    marca: "Kaliter",
    tipo: "Corrector",
    composicion: "Zinc soluble 16.44%",
    descripcion: "Corrector Zn de absorción inmediata. Síntesis de auxinas."
  },
  {
    sku: "GB30",
    nombre: "GB30",
    marca: "Kaliter",
    tipo: "Bioestimulante",
    composicion: "N 6.90%, Carbono Orgánico 13.80%",
    descripcion: "Acción osmoprotectora (Glicina Betaína) ante estrés abiótico."
  }
]

export function CatalogImporter({ open, onOpenChange, onImport, existingProducts }: CatalogImporterProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  const existingSKUs = new Set(existingProducts.map(p => p.sku?.toUpperCase()))
  
  const availableProducts = INITIAL_CATALOG.filter(
    product => !existingSKUs.has(product.sku.toUpperCase())
  )

  const alreadyImported = INITIAL_CATALOG.filter(
    product => existingSKUs.has(product.sku.toUpperCase())
  )

  const handleToggleProduct = (sku: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sku)) {
        newSet.delete(sku)
      } else {
        newSet.add(sku)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === availableProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(availableProducts.map(p => p.sku)))
    }
  }

  const handleImport = () => {
    const productsToImport = INITIAL_CATALOG
      .filter(cp => selectedProducts.has(cp.sku))
      .map(catalogProduct => {
        const hasMultiplePresentations = catalogProduct.presentacion && catalogProduct.presentacion.length > 1
        
        return {
          name: catalogProduct.nombre,
          category: 'Bioestimulante' as const,
          unit: 'L' as const,
          currentStock: 0,
          minStock: 5,
          maxStock: hasMultiplePresentations ? 100 : 50,
          costPerUnit: undefined,
          supplier: catalogProduct.marca,
          sku: catalogProduct.sku,
          notes: `${catalogProduct.tipo}\n\nComposición: ${catalogProduct.composicion}\n\n${catalogProduct.descripcion}${
            catalogProduct.presentacion ? `\n\nPresentaciones disponibles: ${catalogProduct.presentacion.join(', ')}` : ''
          }`
        }
      })

    onImport(productsToImport)
    toast.success(`${productsToImport.length} productos importados al catálogo`)
    setSelectedProducts(new Set())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Upload size={28} className="text-primary" weight="duotone" />
            Importar Catálogo de Productos
          </DialogTitle>
          <DialogDescription>
            Catálogo inicial de productos BioEmm. Selecciona los productos que deseas agregar a tu inventario.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Total Catálogo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{INITIAL_CATALOG.length}</div>
              <p className="text-xs text-muted-foreground mt-1">productos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary">{availableProducts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">para importar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Seleccionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-accent">{selectedProducts.size}</div>
              <p className="text-xs text-muted-foreground mt-1">para agregar</p>
            </CardContent>
          </Card>
        </div>

        {availableProducts.length > 0 && (
          <div className="flex justify-between items-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedProducts.size === availableProducts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Button>
            <p className="text-sm text-muted-foreground">
              {selectedProducts.size} de {availableProducts.length} seleccionados
            </p>
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {availableProducts.length > 0 ? (
              <>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Productos Disponibles
                </h3>
                {availableProducts.map(product => (
                  <Card
                    key={product.sku}
                    className={`cursor-pointer transition-all ${
                      selectedProducts.has(product.sku)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleToggleProduct(product.sku)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <Package size={24} className="text-primary mt-0.5" weight="duotone" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-base">{product.nombre}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {product.sku}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {product.marca}
                                </Badge>
                                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                  {product.tipo}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">{product.descripcion}</p>
                          
                          <div className="text-xs text-muted-foreground">
                            <span className="font-semibold">Composición:</span> {product.composicion}
                          </div>
                          
                          {product.presentacion && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-semibold">Presentaciones:</span> {product.presentacion.join(', ')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0">
                          {selectedProducts.has(product.sku) ? (
                            <CheckCircle size={24} className="text-primary" weight="fill" />
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <CheckCircle size={48} className="mx-auto mb-4 text-primary opacity-50" weight="duotone" />
                  <p className="text-lg text-muted-foreground mb-2">Todos los productos ya están importados</p>
                  <p className="text-sm text-muted-foreground">
                    No hay productos nuevos disponibles para importar del catálogo
                  </p>
                </CardContent>
              </Card>
            )}

            {alreadyImported.length > 0 && (
              <>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6 mb-3">
                  Ya en Inventario ({alreadyImported.length})
                </h3>
                {alreadyImported.map(product => (
                  <Card key={product.sku} className="opacity-60 border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-primary" weight="fill" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{product.nombre}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {product.sku}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{product.marca}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedProducts.size === 0}
            className="bg-accent hover:bg-accent/90"
          >
            <Upload className="mr-2" size={18} weight="bold" />
            Importar {selectedProducts.size > 0 ? `(${selectedProducts.size})` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

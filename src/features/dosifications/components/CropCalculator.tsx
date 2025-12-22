import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  AGRICULTURE_TYPES, 
  APPLICATION_MODES, 
  CROP_TYPES, 
  CROP_CATEGORIES,
  AGRICULTURE_OBJECTIVES,
  AgricultureType,
  ApplicationMode,
  CropType,
  CropCategory,
  AgricultureObjective
} from '@/types'
import { MagnifyingGlass, X, Leaf, Flask, Target } from '@phosphor-icons/react'

interface CropCalculatorFilters {
  agricultureType?: AgricultureType
  applicationMode?: ApplicationMode
  cropType?: CropType
  cropCategory?: CropCategory
  objective?: AgricultureObjective
}

export function CropCalculator() {
  const [filters, setFilters] = useState<CropCalculatorFilters>({})
  const [hasSearched, setHasSearched] = useState(false)

  const handleFilterChange = (key: keyof CropCalculatorFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'Cualquiera' ? undefined : value
    }))
  }

  const handleClear = () => {
    setFilters({})
    setHasSearched(false)
  }

  const handleSearch = () => {
    setHasSearched(true)
  }

  const hasAnyFilter = Object.values(filters).some(value => value !== undefined)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 py-6">
        <h2 className="text-5xl font-bold text-primary mb-4 tracking-tight">
          Encuentra el producto que necesitas
        </h2>
        <p className="text-xl text-muted-foreground font-light">
          con nuestra Calculadora de Cultivos
        </p>
      </div>

      <Card className="border-2 border-primary/30 shadow-xl bg-gradient-to-b from-white to-primary/5">
        <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-b">
          <CardTitle className="text-2xl flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Leaf className="text-primary" size={28} weight="duotone" />
            </div>
            <span>Criterios de Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Tipo de Agricultura
              </label>
              <Select
                value={filters.agricultureType || 'Cualquiera'}
                onValueChange={(value) => handleFilterChange('agricultureType', value)}
              >
                <SelectTrigger className="h-14 text-base border-2 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cualquiera">Cualquiera</SelectItem>
                  {AGRICULTURE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Modo de Aplicación
              </label>
              <Select
                value={filters.applicationMode || 'Cualquiera'}
                onValueChange={(value) => handleFilterChange('applicationMode', value)}
              >
                <SelectTrigger className="h-14 text-base border-2 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cualquiera">Cualquiera</SelectItem>
                  {APPLICATION_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Cultivo
              </label>
              <Select
                value={filters.cropType || 'Cualquiera'}
                onValueChange={(value) => handleFilterChange('cropType', value)}
              >
                <SelectTrigger className="h-14 text-base border-2 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="Cualquiera">Cualquiera</SelectItem>
                  {CROP_TYPES.filter(crop => crop !== 'Otro').map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Tipo de Cultivo
              </label>
              <Select
                value={filters.cropCategory || 'Cualquiera'}
                onValueChange={(value) => handleFilterChange('cropCategory', value)}
              >
                <SelectTrigger className="h-14 text-base border-2 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="Cualquiera">Cualquiera</SelectItem>
                  {CROP_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Objetivo
              </label>
              <Select
                value={filters.objective || 'Cualquiera'}
                onValueChange={(value) => handleFilterChange('objective', value)}
              >
                <SelectTrigger className="h-14 text-base border-2 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="Cualquiera">Cualquiera</SelectItem>
                  {AGRICULTURE_OBJECTIVES.map((objective) => (
                    <SelectItem key={objective} value={objective}>
                      {objective}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Button
              variant="outline"
              size="lg"
              onClick={handleClear}
              disabled={!hasAnyFilter}
              className="min-w-[160px] h-14 text-base border-2"
            >
              <X className="mr-2" weight="bold" size={20} />
              Limpiar
            </Button>
            <Button
              size="lg"
              onClick={handleSearch}
              className="bg-primary hover:bg-primary/90 min-w-[160px] h-14 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <MagnifyingGlass className="mr-2" weight="bold" size={20} />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-br from-accent/5 to-accent/10">
            <div className="flex items-start justify-between">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Flask className="text-accent" size={24} weight="duotone" />
                </div>
                <span>Productos Recomendados</span>
              </CardTitle>
              {hasAnyFilter && (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {filters.agricultureType && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {filters.agricultureType}
                    </Badge>
                  )}
                  {filters.applicationMode && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {filters.applicationMode}
                    </Badge>
                  )}
                  {filters.cropType && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {filters.cropType}
                    </Badge>
                  )}
                  {filters.cropCategory && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {filters.cropCategory}
                    </Badge>
                  )}
                  {filters.objective && (
                    <Badge variant="secondary" className="text-sm flex items-center gap-1 px-3 py-1">
                      <Target size={14} />
                      {filters.objective}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="inline-block p-6 bg-primary/5 rounded-full mb-6">
                <Leaf size={64} className="text-primary opacity-70" weight="duotone" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                Catálogo en Desarrollo
              </h3>
              <p className="text-lg text-muted-foreground mb-2 max-w-2xl mx-auto">
                El catálogo completo de productos se agregará próximamente
              </p>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Esta funcionalidad mostrará los productos especializados que coincidan con los criterios seleccionados
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

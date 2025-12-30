import { collection, getDocs, query, where, addDoc, writeBatch, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import initialData from '../data/initial-data.json'
import { Product } from '@/types'

export const importDataService = {
  async importProducts() {
    const productsRef = collection(db, 'products')
    const batch = writeBatch(db)
    let operationsCount = 0
    const BATCH_SIZE = 450 // Firestore limit is 500

    const existingProductsSnapshot = await getDocs(productsRef)
    const existingProducts = new Set(existingProductsSnapshot.docs.map(d => d.data().name.toLowerCase()))

    const productsToAdd = initialData.products.filter(p => !existingProducts.has(p.name.toLowerCase()))

    console.log(`Found ${productsToAdd.length} new products to add.`)

    for (const product of productsToAdd) {
      const newProductRef = doc(productsRef)
      batch.set(newProductRef, {
        name: product.name,
        code: product.code || '',
        description: `Importado desde Excel`,
        category: 'Agroquímico', // Default category
        unit: product.unit || 'Unidad',
        price: product.price || 0,
        currentStock: 0,
        minStock: 10,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      operationsCount++

      if (operationsCount >= BATCH_SIZE) {
        await batch.commit()
        operationsCount = 0
      }
    }

    if (operationsCount > 0) {
      await batch.commit()
    }

    return productsToAdd.length
  },

  async importProtocols() {
    const protocolsRef = collection(db, 'dosification_protocols')
    
    // First, check if protocols already exist to avoid duplicates
    // We'll check by name
    const existingProtocolsSnapshot = await getDocs(protocolsRef)
    const existingNames = new Set(existingProtocolsSnapshot.docs.map(d => d.data().name))

    let addedCount = 0

    for (const protocol of initialData.protocols) {
      if (existingNames.has(protocol.name)) {
        console.log(`Protocol ${protocol.name} already exists. Skipping.`)
        continue
      }

      await addDoc(protocolsRef, {
        ...protocol,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      })
      addedCount++
    }

    return addedCount
  }
}

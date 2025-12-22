import { useState } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault()
      setBusy(true)
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password)
        toast.success('Sesión iniciada')
      } catch (err: any) {
        toast.error(err?.message || 'No se pudo iniciar sesión')
      } finally {
        setBusy(false)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-semibold text-primary">BioEmm</h1>
          <p className="text-sm text-muted-foreground mt-1">Inicia sesión para continuar</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !email || !password}>
              {busy ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="fixed bottom-3 right-3 z-[10000]">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => signOut(auth)}
          className="opacity-80 hover:opacity-100"
        >
          Cerrar sesión
        </Button>
      </div>
      {children}
    </div>
  )
}

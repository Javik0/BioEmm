import { useState } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import logoImage from '@/assets/branding/BioEmm.jpg'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
        <Card className="w-full max-w-md p-8 shadow-xl border-primary/10">
          {/* Logo principal */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-2xl shadow-primary/20">
                <img 
                  src={logoImage} 
                  alt="BioEmm Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Efecto de brillo */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
            </div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">BioEmm</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de Gestión Agrícola</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="mt-1" 
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={busy || !email || !password}>
              {busy ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            © 2026 BioEmm - Todos los derechos reservados
          </p>
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

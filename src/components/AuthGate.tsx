import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import logoImage from '@/assets/branding/BioEmm.jpg'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        {/* Theme Toggle en la esquina superior derecha */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-md p-8 shadow-xl border-primary/10">
          {/* Logo principal */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-2xl shadow-primary/20">
                <img 
                  src={logoImage} 
                  alt="BioEMS Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Efecto de brillo */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
            </div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">BioEMS</h1>
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
              <div className="relative mt-1">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlash size={18} weight="duotone" />
                  ) : (
                    <Eye size={18} weight="duotone" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={busy || !email || !password}>
              {busy ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            © 2026 BioEMS - Todos los derechos reservados
          </p>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

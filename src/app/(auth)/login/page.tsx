import Link from 'next/link'
import { LoginForm } from '@/features/auth/components'
import { Card } from '@/shared/components'

export default function LoginPage() {
  return (
    <Card header="Bienvenido de nuevo">
      <div className="space-y-6">
        <p className="text-sm font-brutal">Inicia sesión en tu cuenta</p>
        <LoginForm />
        <p className="text-center text-sm font-brutal">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="font-bold underline hover:text-brutal-pink">
            Regístrate
          </Link>
        </p>
      </div>
    </Card>
  )
}

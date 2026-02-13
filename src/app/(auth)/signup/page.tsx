import Link from 'next/link'
import { SignupForm } from '@/features/auth/components'
import { Card } from '@/shared/components'

export default function SignupPage() {
  return (
    <Card header="Crear cuenta">
      <div className="space-y-6">
        <p className="text-sm font-brutal">Comienza gratis</p>
        <SignupForm />
        <p className="text-center text-sm font-brutal">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold underline hover:text-brutal-pink">
            Inicia sesión
          </Link>
        </p>
      </div>
    </Card>
  )
}

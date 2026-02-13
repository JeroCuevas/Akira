import Link from 'next/link'
import { ForgotPasswordForm } from '@/features/auth/components'
import { Card } from '@/shared/components'

export default function ForgotPasswordPage() {
  return (
    <Card header="Restablecer contraseña">
      <div className="space-y-6">
        <p className="text-sm font-brutal">Ingresa tu correo para recibir un enlace de restablecimiento</p>
        <ForgotPasswordForm />
        <p className="text-center text-sm font-brutal">
          <Link href="/login" className="font-bold underline hover:text-brutal-pink">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </Card>
  )
}

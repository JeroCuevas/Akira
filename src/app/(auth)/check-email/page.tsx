import Link from 'next/link'
import { Card, Alert } from '@/shared/components'

export default function CheckEmailPage() {
  return (
    <Card header="Revisa tu correo">
      <div className="space-y-6 text-center">
        <Alert variant="info">
          Te hemos enviado un enlace de confirmación. Por favor revisa tu correo para completar tu registro.
        </Alert>
        <Link
          href="/login"
          className="inline-block font-bold font-brutal underline hover:text-brutal-pink"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </Card>
  )
}

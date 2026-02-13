import { UpdatePasswordForm } from '@/features/auth/components'
import { Card } from '@/shared/components'

export default function UpdatePasswordPage() {
  return (
    <Card header="Establecer nueva contraseña">
      <div className="space-y-6">
        <p className="text-sm font-brutal">Ingresa tu nueva contraseña a continuación</p>
        <UpdatePasswordForm />
      </div>
    </Card>
  )
}

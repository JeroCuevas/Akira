'use client'

import { useState } from 'react'
import { resetPassword } from '@/actions/auth'
import { Input, Button, Alert } from '@/shared/components'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await resetPassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return <Alert variant="success">Revisa tu correo para obtener el enlace de restablecimiento.</Alert>
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input label="Correo electrónico" name="email" type="email" required />

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Enviando...' : 'Enviar Enlace de Restablecimiento'}
      </Button>
    </form>
  )
}

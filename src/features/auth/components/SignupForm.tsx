'use client'

import { useState } from 'react'
import { signup } from '@/actions/auth'
import { Input, Button, Alert } from '@/shared/components'

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input label="Correo electrónico" name="email" type="email" required />
      <Input label="Contraseña" name="password" type="password" required minLength={6} />

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
      </Button>
    </form>
  )
}

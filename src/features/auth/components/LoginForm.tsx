'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/actions/auth'
import { Input, Button, Alert } from '@/shared/components'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input label="Correo electrónico" name="email" type="email" required />
      <Input label="Contraseña" name="password" type="password" required />

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>

      <p className="text-center text-sm font-brutal">
        <Link href="/forgot-password" className="underline hover:text-brutal-pink">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </form>
  )
}

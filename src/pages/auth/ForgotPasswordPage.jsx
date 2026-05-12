import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { authService } from '../../services/authService'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
      toast.success('Email de réinitialisation envoyé !')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✉️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
        <p className="text-gray-500 text-sm mb-6">
          Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
        </p>
        <Link to="/login" className="text-blue-600 font-medium hover:underline text-sm">
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Mot de passe oublié</h2>
      <p className="text-gray-500 text-sm mb-6">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Envoyer le lien
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        <Link to="/login" className="text-blue-600 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </>
  )
}

import SignInForm from '@/components/SignInForm'

export const metadata = {
  title: 'Sign In - Ebookr',
}

export default function SignInPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <SignInForm />
    </div>
  )
}

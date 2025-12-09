import dynamic from 'next/dynamic'

const DemoRunner = dynamic(() => import('@/components/DemoRunner'), { ssr: false })

export const metadata = { title: 'Demo - Ebookr' }

export default function DemoPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <DemoRunner />
    </div>
  )
}

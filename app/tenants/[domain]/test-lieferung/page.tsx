export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function TestLieferungPage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  console.log('[TEST] TestLieferungPage called')
  
  const { domain } = await params
  console.log('[TEST] Domain param:', domain)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Lieferung Page</h1>
      <p>Domain: {domain}</p>
      <p>This is a simple test page without database queries</p>
    </div>
  )
}

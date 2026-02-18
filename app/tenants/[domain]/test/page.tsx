export const dynamicParams = true

export default async function TestPage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const { domain } = await params
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page Works!</h1>
      <p>Domain: {domain}</p>
    </div>
  )
}

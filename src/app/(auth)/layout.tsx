export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="bg-brutal-yellow text-black px-4 py-2 font-bold text-3xl font-brutal inline-block border-2 border-black shadow-brutal">
            AKIRA
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

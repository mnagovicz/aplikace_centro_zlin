export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-md px-4 py-3 text-center">
          <h1 className="text-lg font-bold text-blue-900">
            OC Centro Zlín
          </h1>
          <p className="text-xs text-blue-600">Soutěžní hra</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-blue-100 py-3 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} OC Centro Zlín
      </footer>
    </div>
  );
}

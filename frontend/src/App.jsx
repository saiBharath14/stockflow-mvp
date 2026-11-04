import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center shadow-2xl sm:p-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Inventory, simplified
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">StockFlow</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
          SaaS Inventory Management System
        </p>
        <Link
          to="/"
          className="mt-10 inline-flex rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Get started
        </Link>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      <header className="border-b border-zinc-900 py-4 px-6 bg-zinc-950 flex items-center justify-between shadow-sm">
        <span className="font-extrabold text-xl text-indigo-500">Frontend Application</span>
        <nav className="flex items-center gap-4 text-sm font-semibold text-zinc-400">
          <Link to="/" className="hover:text-zinc-100 transition-colors">Home</Link>
          <Link to="/about" className="hover:text-zinc-100 transition-colors">About</Link>
          <Link to="/test" className="hover:text-zinc-100 transition-colors">Test</Link>
        </nav>
      </header>

      <main className="flex-grow p-6 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-500 bg-zinc-950">
        Scaffolded by frontendinstall
      </footer>
    </div>
  )
}
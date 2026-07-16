import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
      <h1 className="text-6xl font-black text-red-500">404</h1>
      <h2 className="text-2xl font-bold text-slate-200">Page Not Found</h2>
      <p className="text-slate-400 max-w-md text-base">
        The requested route does not exist.
      </p>
      <Link to="/" className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl transition-colors cursor-pointer">
        Go Back Home
      </Link>
    </div>
  )
}
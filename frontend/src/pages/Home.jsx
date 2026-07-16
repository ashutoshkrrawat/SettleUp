import React from 'react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-sm font-semibold">
        Tailwind CSS v4.0 Active
      </div>
      <h1 className="text-4xl font-extrabold text-slate-100">
        Home View
      </h1>
      <p className="text-slate-400 max-w-md text-base leading-relaxed">
        Your project routing structure is set up with all core folders. This is the main landing page!
      </p>
    </div>
  )
}
import React from 'react'

export default function About() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
      <h1 className="text-4xl font-extrabold text-slate-100">
        About View
      </h1>
      <p className="text-slate-400 max-w-md text-base leading-relaxed">
        This is the about page. Setup with React Router nested layout routing.
      </p>
    </div>
  )
}
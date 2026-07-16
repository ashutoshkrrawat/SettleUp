import React from 'react'

export default function Test() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
      <h1 className="text-4xl font-extrabold text-slate-100">
        Test View
      </h1>
      <p className="text-slate-400 max-w-md text-base leading-relaxed">
        Testing ground. Try click behaviors or check styling rules here.
      </p>
      <button
        onClick={() => alert('React state action works!')}
        className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md cursor-pointer"
      >
        Test Event Handler
      </button>
    </div>
  )
}
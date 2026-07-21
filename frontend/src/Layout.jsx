import React from 'react'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <main className="flex-grow flex flex-col w-full">
        <Outlet />
      </main>
    </div>
  )
}
import { Home, About, NotFound, Auth, Dashboard, GroupDetails, JoinGroup } from './pages'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from './Layout.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '',
        element: <Home />,
      },
      {
        path: 'auth',
        element: <Auth />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'group/:id',
        element: <GroupDetails />,
      },
      {
        path: 'join/:inviteCode',
        element: <JoinGroup />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
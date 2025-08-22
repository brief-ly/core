import {
  Outlet,
  createRouter,
  createRoute,
  createRootRoute,
} from '@tanstack/react-router'
import { withPageErrorBoundary } from "@/src/lib/components/errors/PageErrorBoundary";
import HomePage from "./home";
import ProfilePage from "./profile";
import { useAnalytics } from '../lib/hooks/use-analytics';

const rootRoute = createRootRoute({
  component: () => {
    useAnalytics();

    return (
      <>
        <Outlet />
      </>
    )
  },
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || '',
    }
  },
  component: function Index() {
    return withPageErrorBoundary(HomePage)({});
  },
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$id',
  component: function Profile() {
    return withPageErrorBoundary(ProfilePage)({});
  },
})

const routeTree = rootRoute.addChildren([indexRoute, profileRoute])
const router = createRouter({
  routeTree,
})
  
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default router;
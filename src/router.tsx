import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  createMemoryHistory,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

import { RootLayout } from './routes/__root';
import { NotesIndexRoute } from './routes/NotesIndexRoute';
import { NoteDetailRoute, noteContentQueryOptions } from './routes/NoteDetailRoute';
import { AgendaRoute } from './routes/AgendaRoute';
import { MeetingsRoute } from './routes/MeetingsRoute';
import { SettingsRoute } from './routes/SettingsRoute';

export interface RouterContext {
  queryClient: QueryClient;
}

// Root carries QueryClient through loader context so nested routes
// can `ensureQueryData` without hook access.
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/notes' });
  },
});

const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'notes',
  component: () => <Outlet />,
});

const notesIndexRoute = createRoute({
  getParentRoute: () => notesRoute,
  path: '/',
  component: NotesIndexRoute,
});

const noteDetailRoute = createRoute({
  getParentRoute: () => notesRoute,
  path: '$noteId',
  loader: async ({ params, context }) =>
    context.queryClient.ensureQueryData(noteContentQueryOptions(params.noteId)),
  component: NoteDetailRoute,
});

const agendaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'agenda',
  component: AgendaRoute,
});

const meetingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'meetings',
  component: MeetingsRoute,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'settings',
  component: SettingsRoute,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  notesRoute.addChildren([notesIndexRoute, noteDetailRoute]),
  agendaRoute,
  meetingsRoute,
  settingsRoute,
]);

export function createAppRouter(queryClient: QueryClient) {
  // Memory history in F1 Tauri — no address bar, URL is internal
  // state. Spec 0039 reserves hash history for a future web build.
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}

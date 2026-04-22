import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

import { RootLayout } from './routes/__root';
import { HomeRoute } from './routes/HomeRoute';
import { NotesIndexRoute } from './routes/NotesIndexRoute';
import { NoteDetailRoute, noteContentQueryOptions } from './routes/NoteDetailRoute';
import { AgendaRoute } from './routes/AgendaRoute';
import { SettingsRoute } from './routes/SettingsRoute';
import { DevMenuPreviewRoute } from './routes/DevMenuPreviewRoute';
import { DevShellPreviewRoute } from './routes/DevShellPreviewRoute';

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
  component: HomeRoute,
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

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'settings',
  component: SettingsRoute,
});

// Dev-only preview routes (stripped from prod bundle by the
// `import.meta.env.DEV` guard below). Let Playwright + humans
// visually check UI primitives without a real note.
const devMenuPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'dev/menu-preview',
  component: DevMenuPreviewRoute,
});

const devShellPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'dev/shell-preview',
  component: DevShellPreviewRoute,
});

const baseChildren = [
  indexRoute,
  notesRoute.addChildren([notesIndexRoute, noteDetailRoute]),
  agendaRoute,
  settingsRoute,
];
const routeTree = rootRoute.addChildren(
  import.meta.env.DEV
    ? [...baseChildren, devMenuPreviewRoute, devShellPreviewRoute]
    : baseChildren,
);

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

import NewsFeedPage from './(main)/page';

export default function RootPage() {
  // This file previously returned null.
  // To ensure content is displayed at the root path '/',
  // we now render the NewsFeedPage, which is defined in (main)/page.tsx
  // and is intended as the main content for the application's home.
  return <NewsFeedPage />;
}

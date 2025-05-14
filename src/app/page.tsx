// src/app/page.tsx

// This file now re-exports the default component from src/app/(main)/page.tsx.
// This ensures that when the root path ("/") is accessed, Next.js treats
// src/app/(main)/page.tsx as the page handler. Consequently, the layout
// defined in src/app/(main)/layout.tsx (which includes the AppHeader)
// will be correctly applied to the home page.

export { default } from './(main)/page';

// If src/app/(main)/page.tsx had any named exports like 'metadata' or 
// 'generateStaticParams' that should also apply to the root route,
// you could re-export them like this:
// export * from './(main)/page';

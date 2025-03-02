import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'
import type { AppRouter } from 'next-app/server/routers/_app'
import superjson from 'superjson';


export const trpc = createTRPCReact<AppRouter>({
    overrides: {
        useMutation: {
            async onSuccess(opts) {
                await opts.originalFn()
                await opts.queryClient.invalidateQueries()
            },
        },
    },
})

function getBaseUrl() {
    if (typeof window !== 'undefined')
        // browser should use relative path
        return ''
    if (process.env.VERCEL_URL)
        // reference for vercel.com
        return `https://${process.env.VERCEL_URL}`
    if (process.env.RENDER_INTERNAL_HOSTNAME)
        // reference for render.com
        return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`
    // assume localhost
    return `http://localhost:${process.env.PORT ?? 3000}`
}

// only works for nextjs client components! Support for server components is implemented in next dir
export function TRPCProvider(props: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                loggerLink({
                    enabled: () => true,
                }),
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                }),
            ],
            transformer: superjson
        }),
    )
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {props.children}
            </QueryClientProvider>
        </trpc.Provider>
    )
}

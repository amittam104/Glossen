import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import * as React from "react"
import appCss from "@/styles/app.css?url"
import { RootProvider } from "fumadocs-ui/provider/tanstack"
import { GlossenProvider } from "@/components/glossen"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Fumadocs on TanStack Start",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider>
          <GlossenProvider suggestions={["What is Fumadocs?"]}>
            <Outlet />
          </GlossenProvider>
        </RootProvider>
        <Scripts />
      </body>
    </html>
  )
}

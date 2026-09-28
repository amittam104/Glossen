import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { Logo } from "@/components/site/logo"
import { appName, gitConfig } from "./shared"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo className="size-6" />
          <span className="font-semibold tracking-tight">{appName}</span>
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}

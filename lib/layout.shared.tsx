import Image from "next/image"
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { appName, gitConfig } from "./shared"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/logo.svg"
            alt=""
            width={40}
            height={40}
            className="size-6 rounded-md"
          />
          <span className="font-semibold tracking-tight">{appName}</span>
        </>
      ),
    },
    links: [
      {
        type: "icon",
        url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
        text: "GitHub",
        label: "Glossen on GitHub",
        icon: (
          <Image
            src="/GitHub_Invertocat_Black.svg"
            alt=""
            width={16}
            height={16}
            className="dark:invert"
          />
        ),
        external: true,
      },
    ],
  }
}

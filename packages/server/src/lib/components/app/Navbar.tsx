import { useLocation } from "@tanstack/react-router";
import { Image } from "../custom/Image";
import { Connect } from "./Connect";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 gap-2 h-[var(--navbar-height)] w-full z-50 border-b bg-background flex items-center justify-between px-8">
      {/* top left */}
      <div className="flex gap-2 items-center">
        <Image src="/static/logo_2.png" alt="Briefly" className="size-12" />
        <span className="text-3xl font-bold">Briefly</span>
      </div>

      {/* top right - user dropdown */}
      <div className="flex items-center gap-4">
        <Connect />
      </div>
    </nav>
  )
}
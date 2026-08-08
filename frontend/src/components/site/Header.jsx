import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Radar } from "lucide-react";

export default function Header({ onDemo }) {
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { label: "Platform", href: "/#solution" },
    { label: "Journey", href: "/#journey" },
    { label: "Exceptions", href: "/#exceptions" },
    { label: "Dashboard", href: "/dashboard", route: true },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-ct-line/60" : "bg-transparent"
      }`}
      data-testid="site-header"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="logo-home-link">
          <div className="h-8 w-8 bg-ct-ink text-ct-orange grid place-items-center">
            <Radar className="h-4.5 w-4.5" strokeWidth={1.8} size={18} />
          </div>
          <span className="font-display font-extrabold text-[15px] tracking-tight text-ct-ink">
            Control Tower<span className="text-ct-orange">.</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) =>
            n.route ? (
              <Link key={n.label} to={n.href} className="text-sm text-ct-gray2 hover:text-ct-ink transition-colors" data-testid={`nav-${n.label.toLowerCase()}`}>
                {n.label}
              </Link>
            ) : (
              <a key={n.label} href={n.href} className="text-sm text-ct-gray2 hover:text-ct-ink transition-colors" data-testid={`nav-${n.label.toLowerCase()}`}>
                {n.label}
              </a>
            )
          )}
        </nav>

        <button
          onClick={onDemo}
          className="bg-ct-ink text-white text-sm font-medium px-5 py-2.5 hover:bg-ct-orange transition-colors duration-200"
          data-testid="header-demo-btn"
        >
          Request a Demo
        </button>
      </div>
    </header>
  );
}

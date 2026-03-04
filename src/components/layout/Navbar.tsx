'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from '@/components/auth/UserMenu';

const MOTESART_LOGO = "https://customer-assets.emergentagent.com/job_music-to-numbers/artifacts/eqmmw6fl_2316F097-7806-4D1F-AB36-BB5FF560800D.png";

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/converter', label: 'Text Converter' },
  { href: '/learn', label: 'Learn' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1e293b] bg-[rgba(2,6,23,.8)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src={MOTESART_LOGO}
              alt="Motesart"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-bold text-lg text-[#94a3b8]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Motesart Converter
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1e293b] text-white'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth / CTA */}
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}

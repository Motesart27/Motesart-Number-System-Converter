'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#1e293b] animate-pulse" />
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => signIn('google')}
          className="text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => signIn('google')}
          className="text-sm px-4 py-2 bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg font-medium transition-colors"
        >
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[#1e293b] transition-colors"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-8 h-8 rounded-full border border-[#334155]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-sm font-bold">
            {session.user?.name?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-[#1e293b]">
            <p className="text-sm font-medium text-[#e2e8f0]">{session.user?.name}</p>
            <p className="text-xs text-[#64748b]">{session.user?.email}</p>
          </div>
          <button
            onClick={() => { setIsOpen(false); signOut(); }}
            className="w-full text-left px-4 py-2 text-sm text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0] transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

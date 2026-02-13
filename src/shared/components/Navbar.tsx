'use client';

import { signout } from '@/actions/auth';

interface NavbarProps {
  userEmail?: string;
}

export function Navbar({ userEmail }: NavbarProps) {
  const handleSignOut = async () => {
    await signout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black text-white border-b-4 border-black">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="bg-brutal-yellow text-black px-3 py-1 font-bold text-xl font-brutal inline-block">
            AKIRA
          </span>
        </div>

        {userEmail && (
          <div className="flex items-center gap-4">
            <span className="font-brutal text-sm">
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-white text-black px-4 py-2 font-bold font-brutal border-2 border-white hover:bg-brutal-yellow hover:border-brutal-yellow transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

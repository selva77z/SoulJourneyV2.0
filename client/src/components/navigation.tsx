import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/firebase";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { logout } = useAuthStore();

  const navItems = [
    { href: "/", label: "Home", icon: "fas fa-home" },
    { href: "/horoscopes", label: "Horoscopes", icon: "fas fa-star" },
    { href: "/profile", label: "Profile", icon: "fas fa-user" },
  ];

  // Add admin link for admin users
  if (user?.email?.endsWith('@admin.com')) {
    navItems.push({ href: "/admin", label: "Admin", icon: "fas fa-cog" });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cosmic-midnight/95 backdrop-blur-sm border-b border-cosmic-purple/20">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cosmic-gradient rounded-full flex items-center justify-center">
            <i className="fas fa-star text-cosmic-gold"></i>
          </div>
          <span className="text-xl font-display font-semibold text-stellar-white">
            Soul Journey
          </span>
        </Link>

        {/* Navigation Items */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${location === item.href
                ? 'bg-cosmic-gold text-cosmic-midnight font-medium'
                : 'text-nebula-gray hover:text-stellar-white hover:bg-cosmic-midnight/40'
                }`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-3">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-cosmic-gold/20"
              />
            ) : (
              <div className="w-8 h-8 bg-cosmic-gradient rounded-full flex items-center justify-center">
                <i className="fas fa-user text-cosmic-gold text-sm"></i>
              </div>
            )}
            <span className="text-stellar-white text-sm">
              {user?.firstName || 'User'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-nebula-gray hover:text-stellar-white"
            onClick={async () => {
              await logout();
              setLocation("/auth");
            }}
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="text-nebula-gray hover:text-stellar-white"
          >
            <i className="fas fa-bars"></i>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation (hidden by default, would need state for toggle) */}
      <div className="md:hidden border-t border-cosmic-purple/20 bg-cosmic-midnight/95">
        <div className="container mx-auto px-6 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${location === item.href
                ? 'bg-cosmic-gold text-cosmic-midnight font-medium'
                : 'text-nebula-gray hover:text-stellar-white hover:bg-cosmic-midnight/40'
                }`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

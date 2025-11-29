import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  MessageCircle, 
  Plus, 
  Menu,
  Search
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="artisan-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="font-display text-xl font-bold text-foreground">
              ArtisanStock
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse
            </Link>
            {profile?.is_artisan && (
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
            ) : user ? (
              <>
                {profile?.is_artisan && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/create-listing">
                      <Plus className="mr-1 h-4 w-4" />
                      New Listing
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/messages">
                    <MessageCircle className="h-5 w-5" />
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.display_name || ''} 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {profile?.is_artisan && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard" className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/shop/${profile.id}`} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            My Shop
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="cursor-pointer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="terracotta" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  to="/" 
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-medium"
                >
                  Browse
                </Link>
                {user ? (
                  <>
                    {profile?.is_artisan && (
                      <>
                        <Link 
                          to="/dashboard" 
                          onClick={() => setMobileOpen(false)}
                          className="text-lg font-medium"
                        >
                          Dashboard
                        </Link>
                        <Link 
                          to="/create-listing" 
                          onClick={() => setMobileOpen(false)}
                          className="text-lg font-medium"
                        >
                          New Listing
                        </Link>
                        <Link 
                          to={`/shop/${profile.id}`} 
                          onClick={() => setMobileOpen(false)}
                          className="text-lg font-medium"
                        >
                          My Shop
                        </Link>
                      </>
                    )}
                    <Link 
                      to="/messages" 
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-medium"
                    >
                      Messages
                    </Link>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        handleSignOut();
                        setMobileOpen(false);
                      }}
                      className="mt-4"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    <Button variant="outline" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button variant="terracotta" asChild>
                      <Link to="/signup" onClick={() => setMobileOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

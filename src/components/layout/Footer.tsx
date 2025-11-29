import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream-dark/50">
      <div className="artisan-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎨</span>
              <span className="font-display text-xl font-bold text-foreground">
                ArtisanStock
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              Discover unique handcrafted goods from talented artisans around the world. 
              Every piece tells a story.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/?category=ceramics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Ceramics
                </Link>
              </li>
              <li>
                <Link to="/?category=woodwork" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Woodwork
                </Link>
              </li>
              <li>
                <Link to="/?category=textiles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Textiles
                </Link>
              </li>
            </ul>
          </div>

          {/* For Artisans */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">For Artisans</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              {/* TODO: Add Stripe integration for payments */}
              <li>
                <span className="text-sm text-muted-foreground/50">
                  Payment Setup (Coming Soon)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ArtisanStock. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-sm text-muted-foreground">Made with ❤️ for artisans</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

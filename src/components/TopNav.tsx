import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, LogOut, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationsMenu from "@/components/NotificationsMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useState } from "react";

interface TopNavProps {
  profile?: {
    avatar_url?: string;
    full_name?: string;
  } | null;
}

export default function TopNav({ profile }: TopNavProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex-shrink-0">
          <motion.span
            className="text-xl font-bold text-gradient tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          >
            NexStep
          </motion.span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects & people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-border/50 focus:bg-muted/80 transition-colors"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <Button variant="ghost" size="icon" asChild>
              <Link to="/discover">
                <Compass className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          <NotificationsMenu />
          <ThemeToggle />

          <Link to={`/profile/${user?.id}`}>
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            >
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xs font-semibold">
                  {profile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </Link>

          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <Button size="icon" variant="ghost" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </nav>
  );
}

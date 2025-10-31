import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface PortfolioHealthIndicatorProps {
  score: number;
}

const PortfolioHealthIndicator = ({ score }: PortfolioHealthIndicatorProps) => {
  const getStatus = (score: number) => {
    if (score >= 80) return { label: "Expert", color: "text-accent" };
    if (score >= 60) return { label: "Strong", color: "text-primary" };
    if (score >= 40) return { label: "Developing", color: "text-secondary" };
    return { label: "Building", color: "text-muted-foreground" };
  };

  const status = getStatus(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="glass-card shadow-card p-6 animate-scale-in">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Portfolio Health
      </h3>
      
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="text-primary" stopColor="currentColor" />
                <stop offset="50%" className="text-secondary" stopColor="currentColor" />
                <stop offset="100%" className="text-accent" stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{score}%</span>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className={`text-lg font-semibold ${status.color}`}>{status.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Keep building to level up!
          </p>
        </div>

        <div className="w-full mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profile Complete</span>
            <span className="font-medium">95%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Projects Showcase</span>
            <span className="font-medium">80%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Peer Feedback</span>
            <span className="font-medium">75%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PortfolioHealthIndicator;

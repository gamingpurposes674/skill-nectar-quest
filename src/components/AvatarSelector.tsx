import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check } from "lucide-react";

const AVATAR_SEEDS = [
  "Felix", "Aneka", "Liam", "Sophia", "Milo", "Zara",
  "Oliver", "Chloe", "Jasper", "Luna", "Kai", "Nova",
  "Aria", "Leo", "Maya", "Finn", "Sage", "River",
];

const AVATAR_STYLES = [
  "avataaars",
  "bottts",
  "fun-emoji",
];

// Generate avatar URLs from different DiceBear styles
const AVATARS = AVATAR_STYLES.flatMap((style) =>
  AVATAR_SEEDS.slice(0, style === "avataaars" ? 6 : style === "bottts" ? 6 : 6).map(
    (seed) => `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`
  )
);

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl: string | null;
  onSuccess: () => void;
}

const AvatarSelector = ({ open, onOpenChange, currentAvatarUrl, onSuccess }: AvatarSelectorProps) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSelect = async (avatarUrl: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Avatar updated!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update avatar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 py-4">
          {AVATARS.map((url) => {
            const isSelected = currentAvatarUrl === url;
            return (
              <button
                key={url}
                onClick={() => handleSelect(url)}
                disabled={saving}
                className={`relative rounded-full p-0.5 transition-all duration-200 hover:scale-110 focus:outline-none ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "hover:ring-2 hover:ring-muted-foreground/30 hover:ring-offset-1 hover:ring-offset-background"
                }`}
              >
                <Avatar className="h-14 w-14">
                  <AvatarImage src={url} alt="Avatar option" />
                </Avatar>
                {isSelected && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { AVATAR_SEEDS, AVATAR_STYLES };
export default AvatarSelector;

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, Heart, User, Smile, Laugh, Shapes } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const CATEGORIES = [
  {
    id: "cute",
    label: "Cute",
    icon: Heart,
    style: "lorelei",
    seeds: [
      "Muffin", "Cookie", "Bubbles", "Daisy", "Sprinkle", "Cupcake", "Peanut", "Biscuit",
      "Marshmallow", "Pudding", "Jellybean", "Twinkle", "Peaches", "Honey", "Cinnamon",
      "Caramel", "Mocha", "Latte", "Truffle", "Toffee",
    ],
  },
  {
    id: "basic",
    label: "Basic",
    icon: User,
    style: "avataaars",
    seeds: [
      "Felix", "Aneka", "Liam", "Sophia", "Milo", "Zara", "Oliver", "Chloe",
      "Jasper", "Luna", "Kai", "Nova", "Aria", "Leo", "Maya",
      "Finn", "Sage", "River", "Blake", "Jordan",
    ],
  },
  {
    id: "emojis",
    label: "Emojis",
    icon: Smile,
    style: "fun-emoji",
    seeds: [
      "Giggles", "Wacky", "Bonkers", "Silly", "Goofy", "Zany", "Nutty", "Quirky",
      "Cheeky", "Jolly", "Loopy", "Zippy", "Dizzy", "Fizzy", "Snappy",
      "Bouncy", "Funky", "Jazzy", "Peppy", "Sassy",
    ],
  },
  {
    id: "funny",
    label: "Funny",
    icon: Laugh,
    style: "croodles",
    seeds: [
      "Kitty", "Puppy", "Panda", "Fox", "Froggy", "Owl", "Bear", "Bunny",
      "Penguin", "Koala", "Tiger", "Lion", "Wolf", "Deer", "Raccoon",
      "Hedgehog", "Dolphin", "Parrot", "Hamster", "Squirrel",
    ],
  },
  {
    id: "abstract",
    label: "Abstract",
    icon: Shapes,
    style: "shapes",
    seeds: [
      "Prism", "Nebula", "Vortex", "Flux", "Quartz", "Pixel", "Echo", "Zenith",
      "Aurora", "Cipher", "Vertex", "Helix", "Orbit", "Neon", "Spark",
      "Crystal", "Matrix", "Pulse", "Nova", "Cosmo",
    ],
  },
];

const getAvatarUrl = (style: string, seed: string) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl: string | null;
  onSuccess: () => void;
}

const AvatarSelector = ({ open, onOpenChange, currentAvatarUrl, onSuccess }: AvatarSelectorProps) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!user || !preview) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: preview, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Avatar updated!");
      onSuccess();
      setPreview(null);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    onOpenChange(false);
  };

  const selectedUrl = preview || currentAvatarUrl;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={selectedUrl || ""} />
            </Avatar>
            <span>Choose Your Avatar</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="cute" className="flex-1 flex flex-col min-h-0 px-6 overflow-hidden">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/30 p-1 shrink-0">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5">
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-3" style={{ height: '320px', overflow: 'hidden' }}>
              <div className="h-full overflow-y-auto pr-3" style={{ maxHeight: '320px' }}>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pb-2">
                  {cat.seeds.map((seed) => {
                    const url = getAvatarUrl(cat.style, seed);
                    const isSelected = selectedUrl === url;
                    return (
                      <button
                        key={seed}
                        onClick={() => setPreview(url)}
                        disabled={saving}
                        className={`relative rounded-xl p-1.5 transition-all duration-200 hover:scale-105 focus:outline-none bg-muted/20 hover:bg-muted/40 ${
                          isSelected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10"
                            : ""
                        }`}
                      >
                        <Avatar className="h-16 w-16 mx-auto">
                          <AvatarImage src={url} alt={seed} />
                        </Avatar>
                        <p className="text-[10px] text-muted-foreground text-center mt-1 truncate">{seed}</p>
                        {isSelected && (
                          <div className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-border bg-background">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving || !preview}>
            {saving ? "Saving..." : "Confirm Avatar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;

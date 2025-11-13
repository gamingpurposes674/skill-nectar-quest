import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isGibberish } from "@/lib/textValidation";

interface AddAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddAchievementDialog = ({ open, onOpenChange, onSuccess }: AddAchievementDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setProofFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const uploadProofFile = async (): Promise<string | null> => {
    if (!proofFile || !user) return null;

    const fileExt = proofFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('achievement-proofs')
      .upload(fileName, proofFile);

    if (uploadError) {
      console.error("Error uploading proof:", uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('achievement-proofs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to add an achievement");
      return;
    }

    // Validate title (minimum 3 characters and check for gibberish)
    if (title.trim().length < 3) {
      toast.error("Title must be at least 3 characters long");
      return;
    }

    if (isGibberish(title)) {
      toast.error("Please enter a valid achievement title with meaningful words");
      return;
    }

    // Validate description (minimum 15 characters and check for gibberish)
    if (description.trim().length < 15) {
      toast.error("Description must be at least 15 characters long");
      return;
    }

    if (isGibberish(description)) {
      toast.error("Please enter a valid achievement description");
      return;
    }

    // Validate proof file is mandatory
    if (!proofFile) {
      toast.error("Upload a valid proof before submitting your achievement");
      return;
    }

    setLoading(true);

    try {
      let proofFileUrl: string | null = null;
      
      if (proofFile) {
        proofFileUrl = await uploadProofFile();
      }

      const { error } = await supabase
        .from("achievements")
        .insert({
          profile_id: user.id,
          title,
          description,
          date_achieved: date?.toISOString().split('T')[0],
          proof_file_url: proofFileUrl,
          validation_status: "approved", // Auto-approve validated achievements
        });

      if (error) throw error;

      toast.success("Achievement added successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setDate(undefined);
      setProofFile(null);
      setProofPreview(null);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding achievement:", error);
      toast.error(error.message || "Failed to add achievement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Achievement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., First Place in Science Fair"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (minimum 15 characters) *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your achievement in detail..."
              rows={3}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label>Date Achieved</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="proof_file">Upload Proof (Required) *</Label>
            <div className="mt-2">
              <input
                id="proof_file"
                type="file"
                onChange={handleProofFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                disabled={loading}
              />
              {!proofFile ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('proof_file')?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              ) : (
                <div className="border rounded-lg p-4">
                  {proofPreview ? (
                    <img src={proofPreview} alt="Proof preview" className="w-full h-32 object-cover rounded mb-2" />
                  ) : (
                    <div className="flex items-center justify-center h-32 bg-muted rounded mb-2">
                      <span className="text-sm text-muted-foreground">{proofFile.name}</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setProofFile(null);
                      setProofPreview(null);
                    }}
                    disabled={loading}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove File
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={loading}>
              {loading ? "Adding..." : "Add Achievement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAchievementDialog;

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SkillSelector from "./SkillSelector";
import { Upload, X } from "lucide-react";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  onSuccess: () => void;
}

const PROJECT_CATEGORIES = ["Coding", "Design", "Research", "Business", "Art"] as const;

const EditProjectDialog = ({ open, onOpenChange, project, onSuccess }: EditProjectDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [projectSize, setProjectSize] = useState("small");
  const [category, setCategory] = useState("Coding");
  const [status, setStatus] = useState("open");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (project && open) {
      setTitle(project.title || "");
      setDescription(project.description || "");
      setProjectLink(project.project_link || "");
      setSkills(project.required_skills || []);
      setProjectSize(project.project_size || "small");
      setCategory(project.category || "Coding");
      setStatus(project.status || "open");
      setProofPreview(project.proof_file_url || null);
      setCoverPreview(project.cover_image_url || null);
      setProofFile(null);
      setCoverFile(null);
    }
  }, [project, open]);

  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${prefix}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("project-proofs").upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("project-proofs").getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;
    if (title.trim().length < 5) { toast.error("Title must be at least 5 characters"); return; }
    if (description.trim().length < 20) { toast.error("Description must be at least 20 characters"); return; }
    if (skills.length === 0) { toast.error("Select at least one skill"); return; }

    setLoading(true);
    try {
      const updates: any = {
        title: title.trim(),
        description: description.trim(),
        project_link: projectLink || null,
        required_skills: skills,
        project_size: projectSize,
        category,
        status,
      };

      if (proofFile) {
        updates.proof_file_url = await uploadFile(proofFile, "proof");
      }
      if (coverFile) {
        updates.cover_image_url = await uploadFile(coverFile, "cover");
      }

      const { error } = await supabase.from("projects").update(updates).eq("id", project.id);
      if (error) throw error;

      toast.success("Project updated!");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
          </div>
          <div className="space-y-2">
            <Label>Project Link (Optional)</Label>
            <Input type="url" value={projectLink} onChange={(e) => setProjectLink(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Skills *</Label>
            <SkillSelector selectedSkills={skills} onChange={setSkills} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={projectSize} onValueChange={setProjectSize}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="border-2 border-dashed rounded-lg p-3">
              <Input id="edit-cover" type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
                  setCoverFile(f);
                  const r = new FileReader();
                  r.onloadend = () => setCoverPreview(r.result as string);
                  r.readAsDataURL(f);
                }}
              />
              <label htmlFor="edit-cover" className="flex items-center justify-center cursor-pointer">
                {coverPreview ? (
                  <div className="relative w-full">
                    <img src={coverPreview} alt="Cover" className="max-h-32 mx-auto rounded" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6"
                      onClick={(e) => { e.preventDefault(); setCoverFile(null); setCoverPreview(null); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">Click to upload cover image</p>
                )}
              </label>
            </div>
          </div>

          {/* Proof */}
          <div className="space-y-2">
            <Label>Proof / Photos</Label>
            <div className="border-2 border-dashed rounded-lg p-3">
              <Input id="edit-proof" type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
                  setProofFile(f);
                  if (f.type.startsWith("image/")) {
                    const r = new FileReader();
                    r.onloadend = () => setProofPreview(r.result as string);
                    r.readAsDataURL(f);
                  } else {
                    setProofPreview(null);
                  }
                }}
              />
              <label htmlFor="edit-proof" className="flex items-center justify-center cursor-pointer">
                {proofPreview ? (
                  <div className="relative w-full">
                    <img src={proofPreview} alt="Proof" className="max-h-32 mx-auto rounded" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6"
                      onClick={(e) => { e.preventDefault(); setProofFile(null); setProofPreview(null); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Click to upload proof</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gradient-primary">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;

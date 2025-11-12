import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SkillSelector from "./SkillSelector";
import { Upload, X } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userMajor?: string | null;
}

const MAJOR_SKILL_MAPPING: Record<string, string[]> = {
  "Computer Science": ["Python", "Java", "C++", "JavaScript", "React", "Node.js", "HTML", "CSS", "Machine Learning", "Data Analysis"],
  "Engineering": ["Python", "C++", "3D Modeling", "Research", "Data Analysis"],
  "Design": ["UI/UX Design", "Graphic Design", "3D Modeling", "Video Editing"],
  "Medicine": ["Research", "Data Analysis"],
  "Business": ["Business Strategy", "Marketing", "Public Speaking", "Data Analysis"],
  "Law": ["Research", "Public Speaking", "Creative Writing"],
  "Arts": ["Graphic Design", "Video Editing", "Creative Writing", "3D Modeling"],
  "Marketing": ["Marketing", "Business Strategy", "Graphic Design", "Video Editing", "Public Speaking"],
};

const CreateProjectDialog = ({ open, onOpenChange, onSuccess, userMajor }: CreateProjectDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [projectSize, setProjectSize] = useState<string>("small");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const checkSkillMajorAlignment = (): boolean => {
    if (!userMajor || !skills.length) return true;
    
    const majorSkills = MAJOR_SKILL_MAPPING[userMajor] || [];
    return skills.some(skill => majorSkills.includes(skill));
  };

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
      .from('project-proofs')
      .upload(fileName, proofFile);

    if (uploadError) {
      console.error("Error uploading proof:", uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-proofs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a project");
      return;
    }

    // Validate title (minimum 3 characters, no gibberish)
    if (title.trim().length < 3) {
      toast.error("Title must be at least 3 characters long");
      return;
    }

    // Validate description (minimum 20 characters)
    if (description.trim().length < 20) {
      toast.error("Description must be at least 20 characters long");
      return;
    }

    // Validate proof file is mandatory
    if (!proofFile) {
      toast.error("Please upload proof of work (image or document) before submitting");
      return;
    }

    // Validate at least one skill is selected
    if (skills.length === 0) {
      toast.error("Please select at least one skill from the predefined list");
      return;
    }

    // Check skill-major alignment
    if (!checkSkillMajorAlignment() && !pendingSubmit) {
      setShowMismatchDialog(true);
      return;
    }

    setLoading(true);
    setPendingSubmit(false);

    try {
      let proofFileUrl: string | null = null;
      
      if (proofFile) {
        proofFileUrl = await uploadProofFile();
      }

      const { error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          title,
          description,
          project_link: projectLink || null,
          required_skills: skills,
          project_size: projectSize,
          proof_file_url: proofFileUrl,
          status: "open"
        });

      if (error) throw error;

      toast.success("Project added successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setProjectLink("");
      setSkills([]);
      setProjectSize("small");
      setProofFile(null);
      setProofPreview(null);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMismatch = () => {
    setShowMismatchDialog(false);
    setPendingSubmit(true);
    // Trigger form submission
    const form = document.getElementById('create-project-form') as HTMLFormElement;
    form?.requestSubmit();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form id="create-project-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mobile App for Mental Health"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project and what kind of collaborators you're looking for..."
              rows={4}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="project_link">Project Link (Optional)</Label>
            <Input
              id="project_link"
              type="url"
              value={projectLink}
              onChange={(e) => setProjectLink(e.target.value)}
              placeholder="https://github.com/username/project"
              disabled={loading}
            />
          </div>

          <div>
            <Label>Required Skills *</Label>
            <SkillSelector
              selectedSkills={skills}
              onChange={setSkills}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="project_size">Project Size *</Label>
            <Select value={projectSize} onValueChange={setProjectSize} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select project size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (+1.5% progress)</SelectItem>
                <SelectItem value="medium">Medium (+1.5% progress)</SelectItem>
                <SelectItem value="major">Major (+5% progress)</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showMismatchDialog} onOpenChange={setShowMismatchDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Project-Major Mismatch</AlertDialogTitle>
          <AlertDialogDescription>
            This project doesn't seem related to your selected major ({userMajor}). Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmMismatch}>
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default CreateProjectDialog;

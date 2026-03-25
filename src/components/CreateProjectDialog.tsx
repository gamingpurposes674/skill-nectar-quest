import { useState, useEffect } from "react";
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
import CollaborationOptInDialog from "./CollaborationOptInDialog";
import ProjectHelperDialog from "./ProjectHelperDialog";
import { Upload, X, Sparkles } from "lucide-react";
import { isGibberish, checkMajorRelevance } from "@/lib/textValidation";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userMajor?: string | null;
  userGrade?: string | null;
  userSkills?: string[] | null;
  existingProjects?: any[];
  portfolioGaps?: string[];
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

const PROJECT_CATEGORIES = ["Coding", "Design", "Research", "Business", "Art"] as const;

const CreateProjectDialog = ({ open, onOpenChange, onSuccess, userMajor, userGrade, userSkills, existingProjects, portfolioGaps }: CreateProjectDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [projectSize, setProjectSize] = useState<string>("small");
  const [category, setCategory] = useState<string>("Coding");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [showNoProofDialog, setShowNoProofDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [showCollabOptIn, setShowCollabOptIn] = useState(false);
  const [createdProjectTitle, setCreatedProjectTitle] = useState("");
  const [showProjectHelper, setShowProjectHelper] = useState(false);

  // Build user profile for AI helper
  const userProfile = {
    grade: userGrade || null,
    major: userMajor || null,
    skills: userSkills || [],
    existingProjects: existingProjects?.length || 0,
    existingProjectTypes: existingProjects?.map(p => p.project_size) || [],
    portfolioGaps: portfolioGaps || [],
    hasResearch: existingProjects?.some(p => p.required_skills?.includes("Research")) || false,
    hasCollaborative: existingProjects?.some(p => p.collaborator_id) || false,
    hasLongTerm: existingProjects?.some(p => p.project_size === "major") || false,
  };

  const handleUseIdea = (project: { title: string; description: string; skills: string[]; size: string }) => {
    setTitle(project.title);
    setDescription(project.description);
    setSkills(project.skills);
    setProjectSize(project.size);
  };

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

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverFile || !user) return null;

    const fileExt = coverFile.name.split('.').pop();
    const fileName = `${user.id}/cover_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('project-proofs')
      .upload(fileName, coverFile);

    if (uploadError) {
      console.error("Error uploading cover:", uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-proofs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image must be less than 5MB");
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    // Title validation - minimum 5 characters, at least 2 real words
    if (title.trim().length < 5) {
      toast.error("Invalid project title. Please use a clear, meaningful title.");
      return;
    }

    if (isGibberish(title)) {
      toast.error("Invalid project title. Please use a clear, meaningful title.");
      return;
    }

    // Description validation - minimum 20 characters, meaningful content
    if (description.trim().length < 20) {
      toast.error("Please provide a meaningful project description (at least 20 characters).");
      return;
    }

    if (isGibberish(description)) {
      toast.error("Please provide a meaningful project description.");
      return;
    }

    if (skills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }

    // If no proof file, show friendly warning but allow proceeding
    if (!proofFile && !pendingSubmit) {
      setShowNoProofDialog(true);
      setPendingSubmit(true);
      return;
    }

    // Check major-skill alignment
    if (!pendingSubmit && !checkSkillMajorAlignment()) {
      setShowMismatchDialog(true);
      setPendingSubmit(true);
      return;
    }

    await submitProject();
  };

  const submitProject = async () => {
    setLoading(true);
    try {
      const proofUrl = proofFile ? await uploadProofFile() : null;

      const coverUrl = await uploadCoverImage();

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          title,
          description,
          project_link: projectLink || null,
          required_skills: skills,
          project_size: projectSize,
          proof_file_url: proofUrl,
          cover_image_url: coverUrl,
          category,
          validation_status: "approved",
          status: "open"
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Project created successfully!");
      
      setCreatedProjectId(newProject.id);
      setCreatedProjectTitle(title);
      setShowCollabOptIn(true);
      
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setLoading(false);
      setPendingSubmit(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setProjectLink("");
    setSkills([]);
    setProjectSize("small");
    setCategory("Coding");
    setProofFile(null);
    setProofPreview(null);
    setCoverFile(null);
    setCoverPreview(null);
    setPendingSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>

          {/* AI Project Helper Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
            onClick={() => setShowProjectHelper(true)}
          >
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            Not sure where to start?
          </Button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Enter a meaningful project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project in detail (min 20 characters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-link">Project Link (Optional)</Label>
              <Input
                id="project-link"
                type="url"
                placeholder="https://github.com/..."
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Skills *</Label>
              <SkillSelector
                selectedSkills={skills}
                onChange={setSkills}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-size">Project Size *</Label>
                <Select value={projectSize} onValueChange={setProjectSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (+1.5%)</SelectItem>
                    <SelectItem value="medium">Medium (+3%)</SelectItem>
                    <SelectItem value="major">Major (+5%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-image">Cover Image (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-3">
                <Input
                  id="cover-image"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
                <label htmlFor="cover-image" className="flex items-center justify-center cursor-pointer">
                  {coverPreview ? (
                    <div className="relative w-full">
                      <img src={coverPreview} alt="Cover preview" className="max-h-32 mx-auto rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={(e) => { e.preventDefault(); setCoverFile(null); setCoverPreview(null); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">Click to upload a cover image</p>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">Proof Upload (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleProofFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="proof"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {proofPreview ? (
                    <div className="relative w-full">
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setProofFile(null);
                          setProofPreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : proofFile ? (
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      <span>{proofFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setProofFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload proof (max 5MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Major Mismatch Warning Dialog */}
      <AlertDialog open={showMismatchDialog} onOpenChange={setShowMismatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This project doesn't match your major</AlertDialogTitle>
            <AlertDialogDescription>
              This project doesn't seem related to your selected major "{userMajor}". Continue anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingSubmit(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowMismatchDialog(false);
              submitProject();
            }}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Proof Warning Dialog */}
      <AlertDialog open={showNoProofDialog} onOpenChange={setShowNoProofDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Heads up!</AlertDialogTitle>
            <AlertDialogDescription>
              Adding proof of your work is important for your portfolio. If this is a new project, make sure to edit and add it later!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingSubmit(false);
            }}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowNoProofDialog(false);
              submitProject();
            }}>
              Continue Without Proof
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Collaboration Opt-In Dialog */}
      {createdProjectId && (
        <CollaborationOptInDialog
          open={showCollabOptIn}
          projectId={createdProjectId}
          projectTitle={createdProjectTitle}
          onClose={() => {
            setShowCollabOptIn(false);
            setCreatedProjectId(null);
            onOpenChange(false);
          }}
        />
      )}

      {/* AI Project Helper Dialog */}
      <ProjectHelperDialog
        open={showProjectHelper}
        onOpenChange={setShowProjectHelper}
        userProfile={userProfile}
        onUseIdea={handleUseIdea}
      />
    </>
  );
};

export default CreateProjectDialog;

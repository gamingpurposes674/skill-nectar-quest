import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PREDEFINED_SKILLS = [
  "Python", "Java", "C++", "HTML", "CSS", "JavaScript", "React",
  "Node.js", "Django", "Flask", "UI/UX Design", "Graphic Design",
  "Public Speaking", "Data Analysis", "Machine Learning", "AI",
  "Video Editing", "3D Modeling", "Business Strategy", "Marketing",
  "Writing", "Photography", "Content Creation", "Social Media",
  "SQL", "MongoDB", "Firebase", "AWS", "Docker", "Git",
  "TypeScript", "Vue.js", "Angular", "Swift", "Kotlin",
  "Project Management", "Leadership", "Communication", "Research",
  "Problem Solving", "Critical Thinking", "Teamwork"
].sort();

interface SkillSelectorProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  disabled?: boolean;
}

const SkillSelector = ({ selectedSkills, onChange, disabled }: SkillSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSkills = PREDEFINED_SKILLS.filter(
    skill =>
      skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedSkills.includes(skill)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      onChange([...selectedSkills, skill]);
      setSearchTerm("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    onChange(selectedSkills.filter(s => s !== skill));
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search and select skills..."
          disabled={disabled}
        />
        
        {showDropdown && filteredSkills.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredSkills.map((skill) => (
              <div
                key={skill}
                onClick={() => {
                  handleAddSkill(skill);
                  setShowDropdown(false);
                }}
                className={cn(
                  "px-4 py-2 cursor-pointer hover:bg-accent transition-colors flex items-center justify-between",
                  "text-sm"
                )}
              >
                <span>{skill}</span>
                <Check className="h-4 w-4 text-primary" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((skill) => (
          <Badge key={skill} variant="secondary" className="gap-1 pl-3 pr-2">
            {skill}
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill)}
              disabled={disabled}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default SkillSelector;

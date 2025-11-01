import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GraduationCap } from "lucide-react";

export const PREDEFINED_MAJORS = [
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biomedical Engineering",
  "Aerospace Engineering",
  "Graphic Design",
  "Industrial Design",
  "Interior Design",
  "Fashion Design",
  "UI/UX Design",
  "Medicine",
  "Nursing",
  "Pharmacy",
  "Dentistry",
  "Physical Therapy",
  "Law",
  "Criminal Justice",
  "Political Science",
  "Business Administration",
  "Marketing",
  "Finance",
  "Accounting",
  "Economics",
  "Management",
  "Psychology",
  "Sociology",
  "Education",
  "Communications",
  "Journalism",
  "Film & Media Studies",
  "Architecture",
  "Environmental Science",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Statistics"
].sort();

interface MajorSelectorProps {
  value: string;
  onChange: (major: string) => void;
  disabled?: boolean;
}

const MajorSelector = ({ value, onChange, disabled }: MajorSelectorProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredMajors = PREDEFINED_MAJORS.filter(major =>
    major.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Label htmlFor="major">Desired Major / Stream</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="major"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value || "Select your desired major..."}
            <GraduationCap className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex flex-col">
            <div className="p-2 border-b">
              <Input
                placeholder="Search majors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="max-h-[300px] overflow-auto">
              {filteredMajors.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No majors found
                </div>
              ) : (
                filteredMajors.map((major) => (
                  <button
                    key={major}
                    onClick={() => {
                      onChange(major);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    {major}
                  </button>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MajorSelector;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PREDEFINED_SKILLS = [
  "Python", "Java", "C++", "HTML", "CSS", "JavaScript", "React",
  "Node.js", "Django", "Flask", "UI/UX Design", "Graphic Design",
  "Public Speaking", "Data Analysis", "Machine Learning", "AI",
  "Video Editing", "3D Modeling", "Business Strategy", "Marketing",
  "Writing", "Photography", "Content Creation", "Social Media",
  "SQL", "MongoDB", "Firebase", "AWS", "Docker", "Git",
  "TypeScript", "Vue.js", "Angular", "Swift", "Kotlin",
  "Project Management", "Leadership", "Communication", "Research",
  "Problem Solving", "Critical Thinking", "Teamwork"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are NexStep's AI Project Advisor. You help high school students create meaningful, college-portfolio-worthy projects.

USER PROFILE:
- Grade: ${userProfile.grade || 'Not specified'}
- Major/Dream Major: ${userProfile.major || 'Not specified'}
- Current Skills: ${userProfile.skills?.join(', ') || 'None listed'}
- Existing Projects: ${userProfile.existingProjects?.length || 0} projects
- Existing Project Types: ${userProfile.existingProjectTypes?.join(', ') || 'None'}
- Portfolio Gaps: ${userProfile.portfolioGaps?.join(', ') || 'None identified'}
- Has Research Project: ${userProfile.hasResearch ? 'Yes' : 'No'}
- Has Collaborative Project: ${userProfile.hasCollaborative ? 'Yes' : 'No'}
- Has Long-term Project: ${userProfile.hasLongTerm ? 'Yes' : 'No'}

AVAILABLE SKILLS TO SUGGEST FROM: ${PREDEFINED_SKILLS.join(', ')}

RULES:
1. All project suggestions must be realistic for the student's grade level
2. Never suggest vague or filler projects
3. Suggestions must directly address portfolio gaps
4. Always suggest skills from the AVAILABLE SKILLS list only
5. Be clear, helpful, and serious - no motivational fluff
6. Keep responses concise and actionable
7. When suggesting a project, always include: title, problem it solves, skills gained, solo/collaborative, expected outcome
8. For younger students (9th-10th), suggest simpler, foundational projects
9. For older students (11th-12th), suggest more complex, impactful projects
10. Always prioritize projects that fill the student's identified portfolio gaps

For initial suggestions, format EXACTLY like this JSON array (return ONLY valid JSON, no markdown):
{
  "type": "suggestions",
  "message": "Brief greeting and what you analyzed",
  "projects": [
    {
      "title": "Project Title",
      "problem": "What problem it solves",
      "skills": ["Skill1", "Skill2"],
      "collaborative": true/false,
      "outcome": "Expected outcome (website, app, paper, etc.)",
      "size": "small/medium/major",
      "proofSuggestion": "Suggested proof of work"
    }
  ],
  "followUp": "Want me to refine one, generate a roadmap, or suggest collaborators?"
}

For conversational responses, format like this:
{
  "type": "chat",
  "message": "Your response here"
}

If user wants to use an idea, provide:
{
  "type": "project",
  "title": "Final project title",
  "description": "Detailed description (at least 50 words)",
  "skills": ["Skill1", "Skill2"],
  "size": "small/medium/major",
  "proofSuggestion": "Suggested proof of work"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in project-helper:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Text validation utilities for project submissions

// Common filler words/phrases to reject
const FILLER_PHRASES = [
  'i dont know', 'i don\'t know', 'idk', 'dont know', 'dunno',
  'blah blah', 'xyz', 'test test', 'asdf', 'qwerty'
];

export const isGibberish = (text: string): boolean => {
  if (!text || text.trim().length === 0) return true;
  
  const lowerText = text.toLowerCase().trim();
  
  // Check for filler phrases
  if (FILLER_PHRASES.some(phrase => lowerText === phrase || lowerText.includes(phrase))) {
    return true;
  }
  
  // Check for repeated characters (5+ times: "aaaaa", "hjjjjjj")
  const repeatedPattern = /(.)\1{4,}/;
  if (repeatedPattern.test(text)) return true;
  
  // Check if text is mostly numbers
  const numbers = (text.match(/\d/g) || []).length;
  if (numbers / text.length > 0.5) return true;
  
  // Split into words
  const words = text.trim().split(/\s+/);
  
  // Filter valid words (at least 2 chars, contains at least one vowel)
  const validWords = words.filter(word => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (cleanWord.length < 2) return false;
    return /[aeiou]/i.test(cleanWord);
  });
  
  // Accept if at least 2 valid words (e.g., "Website Building", "Robotics Project")
  if (validWords.length < 2) return true;
  
  // Check consonant-to-vowel ratio (gibberish has unusual ratios)
  const consonants = (text.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
  const vowels = (text.match(/[aeiou]/gi) || []).length;
  
  // Reject if no vowels or too many consonants
  if (vowels === 0 || (vowels > 0 && consonants / vowels > 6)) return true;
  
  return false;
};

export const checkMajorRelevance = (
  projectSkills: string[],
  userMajor: string | null
): boolean => {
  if (!userMajor) return true; // No major set, skip check
  
  const majorKeywords: Record<string, string[]> = {
    'Computer Science': ['python', 'java', 'javascript', 'react', 'node', 'machine learning', 'data analysis', 'html', 'css', 'c++'],
    'Engineering': ['python', 'c++', 'machine learning', 'data analysis', 'research', '3d modeling'],
    'Design': ['ui/ux design', 'graphic design', 'video editing', '3d modeling', 'photography', 'creative writing'],
    'Business': ['business strategy', 'marketing', 'public speaking', 'research'],
    'Arts': ['creative writing', 'photography', 'video editing', 'graphic design', 'ui/ux design'],
    'Science': ['research', 'data analysis', 'python', 'machine learning'],
  };
  
  // Find matching major category
  const majorCategory = Object.keys(majorKeywords).find(key => 
    userMajor.toLowerCase().includes(key.toLowerCase())
  );
  
  if (!majorCategory) return true; // Unknown major, skip check
  
  const relevantSkills = majorKeywords[majorCategory];
  
  // Check if at least one project skill matches major-related skills
  return projectSkills.some(skill => 
    relevantSkills.some(relevant => 
      skill.toLowerCase().includes(relevant.toLowerCase()) ||
      relevant.toLowerCase().includes(skill.toLowerCase())
    )
  );
};

// Text validation utilities for project submissions

export const isGibberish = (text: string): boolean => {
  if (!text || text.trim().length === 0) return true;
  
  // Check for repeated characters (e.g., "aaaaa", "asdfgh")
  const repeatedPattern = /(.)\1{4,}/;
  if (repeatedPattern.test(text)) return true;
  
  // Check for random keyboard sequences
  const keyboardSequences = [
    'asdf', 'qwer', 'zxcv', 'hjkl', 'uiop',
    'dfgh', 'jklm', 'erty', 'tyui'
  ];
  const lowerText = text.toLowerCase();
  if (keyboardSequences.some(seq => lowerText.includes(seq))) return true;
  
  // Check for minimum number of valid words (at least 3)
  const words = text.trim().split(/\s+/);
  const validWords = words.filter(word => {
    // A valid word has at least 2 characters and contains vowels
    if (word.length < 2) return false;
    return /[aeiou]/i.test(word);
  });
  
  if (validWords.length < 3) return true;
  
  // Check consonant-to-vowel ratio (gibberish usually has unusual ratios)
  const consonants = (text.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
  const vowels = (text.match(/[aeiou]/gi) || []).length;
  
  if (vowels === 0 || consonants / vowels > 5) return true;
  
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

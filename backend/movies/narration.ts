import { api, APIError } from "encore.dev/api";
import { moviesDB } from "./db";
import { openAIKey } from "./config";

interface GenerateNarrationRequest {
  movieId: number;
  includeSceneDescriptions?: boolean;
  includeCharacterDescriptions?: boolean;
  includeActionDescriptions?: boolean;
  voiceStyle?: 'professional' | 'casual' | 'dramatic';
}

interface NarrationResponse {
  movieId: number;
  narratedDescription: string;
  sceneDescriptions?: string[];
  characterDescriptions?: string[];
  actionDescriptions?: string[];
  audioUrl?: string;
  brailleText: string;
  estimatedDuration: number;
}

interface UpdateNarrationRequest {
  movieId: number;
  narratedDescription: string;
  sceneDescriptions?: string[];
  characterDescriptions?: string[];
  actionDescriptions?: string[];
}

// Generates AI-enhanced narration for movies to improve accessibility for visually impaired users.
export const generateNarration = api<GenerateNarrationRequest, NarrationResponse>(
  { expose: true, method: "POST", path: "/movies/:movieId/narration/generate" },
  async (req) => {
    const { movieId, includeSceneDescriptions = true, includeCharacterDescriptions = true, includeActionDescriptions = true, voiceStyle = 'professional' } = req;
    
    // Get movie details
    const movie = await moviesDB.queryRow`
      SELECT * FROM movies WHERE id = ${movieId}
    `;
    
    if (!movie) {
      throw APIError.notFound("Movie not found");
    }
    
    // Check if narration already exists
    if (movie.narrated_description) {
      return {
        movieId,
        narratedDescription: movie.narrated_description,
        brailleText: convertToBraille(movie.narrated_description),
        estimatedDuration: estimateReadingTime(movie.narrated_description),
      };
    }
    
    try {
      // Generate AI narration using OpenAI
      const prompt = buildNarrationPrompt(movie, {
        includeSceneDescriptions,
        includeCharacterDescriptions,
        includeActionDescriptions,
        voiceStyle
      });
      
      const narrationData = await generateAINarration(prompt);
      
      // Convert to braille
      const brailleText = convertToBraille(narrationData.narratedDescription);
      
      // Update movie with generated narration
      await moviesDB.exec`
        UPDATE movies 
        SET narrated_description = ${narrationData.narratedDescription},
            accessibility_features = accessibility_features || ${JSON.stringify({
              aiNarration: true,
              brailleSupport: true,
              sceneDescriptions: includeSceneDescriptions,
              characterDescriptions: includeCharacterDescriptions,
              actionDescriptions: includeActionDescriptions
            })},
            updated_at = NOW()
        WHERE id = ${movieId}
      `;
      
      return {
        movieId,
        narratedDescription: narrationData.narratedDescription,
        sceneDescriptions: narrationData.sceneDescriptions,
        characterDescriptions: narrationData.characterDescriptions,
        actionDescriptions: narrationData.actionDescriptions,
        brailleText,
        estimatedDuration: estimateReadingTime(narrationData.narratedDescription),
      };
    } catch (error) {
      throw APIError.internal("Failed to generate narration", error);
    }
  }
);

// Updates the narrated description for a movie with custom content.
export const updateNarration = api<UpdateNarrationRequest, void>(
  { expose: true, method: "PUT", path: "/movies/:movieId/narration" },
  async (req) => {
    const { movieId, narratedDescription, sceneDescriptions, characterDescriptions, actionDescriptions } = req;
    
    // Check if movie exists
    const movie = await moviesDB.queryRow`
      SELECT id FROM movies WHERE id = ${movieId}
    `;
    
    if (!movie) {
      throw APIError.notFound("Movie not found");
    }
    
    // Update narration
    await moviesDB.exec`
      UPDATE movies 
      SET narrated_description = ${narratedDescription},
          accessibility_features = accessibility_features || ${JSON.stringify({
            customNarration: true,
            brailleSupport: true,
            sceneDescriptions: !!sceneDescriptions,
            characterDescriptions: !!characterDescriptions,
            actionDescriptions: !!actionDescriptions
          })},
          updated_at = NOW()
      WHERE id = ${movieId}
    `;
    
    // Store detailed descriptions if provided
    if (sceneDescriptions || characterDescriptions || actionDescriptions) {
      await moviesDB.exec`
        INSERT INTO movie_narration_details (movie_id, scene_descriptions, character_descriptions, action_descriptions)
        VALUES (${movieId}, ${JSON.stringify(sceneDescriptions || [])}, ${JSON.stringify(characterDescriptions || [])}, ${JSON.stringify(actionDescriptions || [])})
        ON CONFLICT (movie_id) 
        DO UPDATE SET 
          scene_descriptions = EXCLUDED.scene_descriptions,
          character_descriptions = EXCLUDED.character_descriptions,
          action_descriptions = EXCLUDED.action_descriptions,
          updated_at = NOW()
      `;
    }
  }
);

function buildNarrationPrompt(movie: any, options: any): string {
  let prompt = `Generate a comprehensive audio description for the movie "${movie.title}".

Movie Overview: ${movie.overview}

Please create a detailed narration that includes:
- A compelling introduction to the movie's setting and atmosphere
- Clear descriptions of main characters and their appearances
- Detailed scene descriptions that paint a vivid picture
- Action sequences described in an engaging way
- Emotional context and mood descriptions

Style: ${options.voiceStyle}
`;

  if (options.includeSceneDescriptions) {
    prompt += "\n- Include detailed scene descriptions for key moments";
  }
  
  if (options.includeCharacterDescriptions) {
    prompt += "\n- Include character appearance and personality descriptions";
  }
  
  if (options.includeActionDescriptions) {
    prompt += "\n- Include detailed action sequence descriptions";
  }

  prompt += `

The narration should be:
- Accessible and clear for visually impaired users
- Engaging and immersive
- Appropriate for the movie's rating and content
- Between 500-1000 words
- Written in a ${options.voiceStyle} tone

Format the response as JSON with the following structure:
{
  "narratedDescription": "Main narration text",
  "sceneDescriptions": ["Scene 1 description", "Scene 2 description"],
  "characterDescriptions": ["Character 1 description", "Character 2 description"],
  "actionDescriptions": ["Action sequence 1", "Action sequence 2"]
}`;

  return prompt;
}

async function generateAINarration(prompt: string): Promise<any> {
  // This would integrate with OpenAI API
  // For now, return a mock response
  return {
    narratedDescription: "A comprehensive audio description that brings the movie to life through detailed narration of visual elements, character actions, and scene descriptions.",
    sceneDescriptions: [
      "Opening scene with establishing shots of the main location",
      "Character introduction scenes with detailed descriptions",
      "Climactic action sequences with vivid descriptions"
    ],
    characterDescriptions: [
      "Main protagonist with detailed appearance and mannerisms",
      "Supporting characters with distinctive features"
    ],
    actionDescriptions: [
      "Chase sequences with detailed movement descriptions",
      "Fight scenes with clear action narration"
    ]
  };
}

function convertToBraille(text: string): string {
  // Basic braille conversion - in a real implementation, this would use a proper braille library
  const brailleMap: { [key: string]: string } = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵', ' ': '⠀', '.': '⠲', ',': '⠂', '!': '⠖',
    '?': '⠦', ':': '⠒', ';': '⠆', '-': '⠤', '(': '⠶', ')': '⠶'
  };
  
  return text.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
}

function estimateReadingTime(text: string): number {
  // Estimate reading time in seconds (average 200 words per minute)
  const wordCount = text.split(/\s+/).length;
  return Math.ceil((wordCount / 200) * 60);
}

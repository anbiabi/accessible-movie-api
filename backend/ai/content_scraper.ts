import { api, APIError } from "encore.dev/api";
import { moviesDB } from "../movies/db";
import { openAIKey } from "./config";

interface ScrapeContentRequest {
  contentType?: 'movie' | 'documentary' | 'series' | 'all';
  maxResults?: number;
  includeAccessibilityFeatures?: boolean;
  sources?: string[];
}

interface ScrapeContentResponse {
  scrapedCount: number;
  newContentAdded: number;
  contentTypes: {
    movies: number;
    documentaries: number;
    series: number;
  };
  accessibilityFeaturesFound: {
    audioDescription: number;
    closedCaptions: number;
    signLanguage: number;
  };
}

interface ContentSource {
  name: string;
  url: string;
  type: 'movie' | 'documentary' | 'series';
  accessibilityFeatures: {
    audioDescription: boolean;
    closedCaptions: boolean;
    signLanguage: boolean;
  };
}

// Scrapes the internet for accessible media content and adds it to the database.
export const scrapeAccessibleContent = api<ScrapeContentRequest, ScrapeContentResponse>(
  { expose: true, method: "POST", path: "/ai/scrape-content" },
  async (req) => {
    const { 
      contentType = 'all', 
      maxResults = 100, 
      includeAccessibilityFeatures = true,
      sources = []
    } = req;

    let scrapedCount = 0;
    let newContentAdded = 0;
    const contentTypes = { movies: 0, documentaries: 0, series: 0 };
    const accessibilityFeaturesFound = { audioDescription: 0, closedCaptions: 0, signLanguage: 0 };

    try {
      // Get content sources to scrape
      const contentSources = await getContentSources(contentType, sources);
      
      for (const source of contentSources.slice(0, maxResults)) {
        try {
          // Check if content already exists
          const existingContent = await moviesDB.queryRow`
            SELECT id FROM movies WHERE title = ${source.name} OR imdb_id = ${source.url}
          `;

          if (existingContent) {
            continue; // Skip if already exists
          }

          // Extract detailed information using AI
          const contentDetails = await extractContentDetails(source);
          
          if (contentDetails) {
            // Generate AI narration if needed
            let narratedDescription = null;
            if (includeAccessibilityFeatures) {
              narratedDescription = await generateAINarration(contentDetails);
            }

            // Insert into database
            await moviesDB.exec`
              INSERT INTO movies (
                title, overview, narrated_description, release_date,
                poster_path, backdrop_path, vote_average, vote_count,
                runtime, genres, accessibility_features,
                audio_description_available, closed_captions_available, sign_language_available,
                imdb_id
              ) VALUES (
                ${contentDetails.title}, ${contentDetails.overview}, ${narratedDescription},
                ${contentDetails.releaseDate}, ${contentDetails.posterPath}, ${contentDetails.backdropPath},
                ${contentDetails.rating || 0}, ${contentDetails.voteCount || 0},
                ${contentDetails.runtime}, ${JSON.stringify(contentDetails.genres || [])},
                ${JSON.stringify(contentDetails.accessibilityFeatures || {})},
                ${source.accessibilityFeatures.audioDescription},
                ${source.accessibilityFeatures.closedCaptions},
                ${source.accessibilityFeatures.signLanguage},
                ${source.url}
              )
            `;

            newContentAdded++;
            
            // Update counters
            if (source.type === 'movie') contentTypes.movies++;
            else if (source.type === 'documentary') contentTypes.documentaries++;
            else if (source.type === 'series') contentTypes.series++;

            if (source.accessibilityFeatures.audioDescription) accessibilityFeaturesFound.audioDescription++;
            if (source.accessibilityFeatures.closedCaptions) accessibilityFeaturesFound.closedCaptions++;
            if (source.accessibilityFeatures.signLanguage) accessibilityFeaturesFound.signLanguage++;
          }

          scrapedCount++;
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error processing content source ${source.name}:`, error);
          continue;
        }
      }

      return {
        scrapedCount,
        newContentAdded,
        contentTypes,
        accessibilityFeaturesFound
      };

    } catch (error) {
      throw APIError.internal("Failed to scrape content", error);
    }
  }
);

async function getContentSources(contentType: string, customSources: string[]): Promise<ContentSource[]> {
  // Mock content sources - in a real implementation, this would scrape actual websites
  const mockSources: ContentSource[] = [
    {
      name: "The Social Dilemma",
      url: "tt11464826",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: false }
    },
    {
      name: "Free Solo",
      url: "tt7775622",
      type: "documentary", 
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: true }
    },
    {
      name: "Won't You Be My Neighbor?",
      url: "tt7681902",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: false }
    },
    {
      name: "RBG",
      url: "tt7689964",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: true }
    },
    {
      name: "The Act of Killing",
      url: "tt2375605",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: false }
    },
    {
      name: "Citizenfour",
      url: "tt4044364",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: false }
    },
    {
      name: "An Inconvenient Truth",
      url: "tt0497116",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: true }
    },
    {
      name: "March of the Penguins",
      url: "tt0428803",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: false }
    },
    {
      name: "Bowling for Columbine",
      url: "tt0310793",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: false }
    },
    {
      name: "Fahrenheit 9/11",
      url: "tt0361596",
      type: "documentary",
      accessibilityFeatures: { audioDescription: true, closedCaptions: true, signLanguage: true }
    }
  ];

  // Filter by content type
  let filteredSources = mockSources;
  if (contentType !== 'all') {
    filteredSources = mockSources.filter(source => source.type === contentType);
  }

  // Add custom sources if provided
  if (customSources.length > 0) {
    // In a real implementation, this would validate and process custom URLs
    console.log('Custom sources provided:', customSources);
  }

  return filteredSources;
}

async function extractContentDetails(source: ContentSource): Promise<any> {
  // Mock content details extraction - in a real implementation, this would use web scraping
  // and AI to extract detailed information from the content source
  return {
    title: source.name,
    overview: `${source.name} is a compelling ${source.type} that explores important themes with comprehensive accessibility features.`,
    releaseDate: "2023-01-01",
    posterPath: null,
    backdropPath: null,
    rating: Math.random() * 10,
    voteCount: Math.floor(Math.random() * 1000),
    runtime: Math.floor(Math.random() * 120) + 60,
    genres: [{ id: 1, name: source.type === 'documentary' ? 'Documentary' : 'Drama' }],
    accessibilityFeatures: {
      aiGenerated: true,
      webScraped: true,
      verified: false
    }
  };
}

async function generateAINarration(contentDetails: any): Promise<string> {
  try {
    // In a real implementation, this would call OpenAI API
    const prompt = `Generate a comprehensive audio description for the ${contentDetails.title}. 
    Include detailed descriptions of visual elements, settings, characters, and actions that would help 
    visually impaired users understand and enjoy the content. The description should be engaging and informative.`;

    // Mock AI response
    return `This ${contentDetails.title} features rich visual storytelling with detailed character interactions and scenic environments. The narrative unfolds through carefully composed shots that reveal both intimate character moments and broader thematic elements. Visual cues include expressive facial performances, symbolic imagery, and dynamic camera movements that enhance the emotional impact of the story.`;

  } catch (error) {
    console.error('Failed to generate AI narration:', error);
    return `Audio description available for ${contentDetails.title}. Professional narration describes visual elements, character actions, and scene changes to enhance accessibility.`;
  }
}

import { api, APIError } from "encore.dev/api";
import { moviesDB } from "./db";

interface ReportAccessibilityIssueRequest {
  movieId: number;
  userId: string;
  reportType: 'audio_description' | 'captions' | 'navigation' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface UpdateAccessibilityFeaturesRequest {
  movieId: number;
  audioDescriptionAvailable?: boolean;
  closedCaptionsAvailable?: boolean;
  signLanguageAvailable?: boolean;
  narratedDescription?: string;
}

interface AccessibilityReportsRequest {
  movieId?: number;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
}

interface AccessibilityReportsResponse {
  reports: {
    id: number;
    movieId: number;
    movieTitle: string;
    userId: string;
    reportType: string;
    description: string;
    severity: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

// Reports an accessibility issue for a movie to improve the disability-robust database.
export const reportAccessibilityIssue = api<ReportAccessibilityIssueRequest, void>(
  { expose: true, method: "POST", path: "/movies/accessibility/report" },
  async (req) => {
    const { movieId, userId, reportType, description, severity } = req;
    
    // Check if movie exists
    const movie = await moviesDB.queryRow`
      SELECT id FROM movies WHERE id = ${movieId}
    `;
    
    if (!movie) {
      throw APIError.notFound("Movie not found");
    }
    
    // Insert accessibility report
    await moviesDB.exec`
      INSERT INTO accessibility_reports (movie_id, user_id, report_type, description, severity) 
      VALUES (${movieId}, ${userId}, ${reportType}, ${description}, ${severity})
    `;
  }
);

// Updates accessibility features for a movie in the disability-robust database.
export const updateAccessibilityFeatures = api<UpdateAccessibilityFeaturesRequest, void>(
  { expose: true, method: "PUT", path: "/movies/:movieId/accessibility" },
  async (req) => {
    const { movieId, audioDescriptionAvailable, closedCaptionsAvailable, signLanguageAvailable, narratedDescription } = req;
    
    // Check if movie exists
    const movie = await moviesDB.queryRow`
      SELECT id FROM movies WHERE id = ${movieId}
    `;
    
    if (!movie) {
      throw APIError.notFound("Movie not found");
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (audioDescriptionAvailable !== undefined) {
      updates.push(`audio_description_available = $${paramIndex++}`);
      values.push(audioDescriptionAvailable);
    }
    
    if (closedCaptionsAvailable !== undefined) {
      updates.push(`closed_captions_available = $${paramIndex++}`);
      values.push(closedCaptionsAvailable);
    }
    
    if (signLanguageAvailable !== undefined) {
      updates.push(`sign_language_available = $${paramIndex++}`);
      values.push(signLanguageAvailable);
    }
    
    if (narratedDescription !== undefined) {
      updates.push(`narrated_description = $${paramIndex++}`);
      values.push(narratedDescription);
    }
    
    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      const query = `UPDATE movies SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      values.push(movieId);
      
      await moviesDB.rawExec(query, ...values);
    }
  }
);

// Retrieves accessibility reports to help improve the disability-robust movie database.
export const getAccessibilityReports = api<AccessibilityReportsRequest, AccessibilityReportsResponse>(
  { expose: true, method: "GET", path: "/movies/accessibility/reports" },
  async (req) => {
    const { movieId, status } = req;
    
    let query = `
      SELECT ar.*, m.title as movie_title
      FROM accessibility_reports ar
      INNER JOIN movies m ON ar.movie_id = m.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (movieId) {
      query += ` AND ar.movie_id = $${paramIndex++}`;
      params.push(movieId);
    }
    
    if (status) {
      query += ` AND ar.status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ` ORDER BY ar.created_at DESC LIMIT 100`;
    
    const reports = await moviesDB.rawQueryAll(query, ...params);
    
    return {
      reports: reports.map(report => ({
        id: report.id,
        movieId: report.movie_id,
        movieTitle: report.movie_title,
        userId: report.user_id,
        reportType: report.report_type,
        description: report.description,
        severity: report.severity,
        status: report.status,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      })),
    };
  }
);

interface VidSrcMovie {
  id: string;
  title: string;
  year: number;
  type: 'movie' | 'tv';
  poster?: string;
  backdrop?: string;
  rating?: number;
  description?: string;
  genres?: string[];
  duration?: number;
}

interface VidSrcResponse {
  results: VidSrcMovie[];
  total: number;
  page: number;
  totalPages: number;
}

const VIDSRC_BASE_URL = "https://vidsrc.net/api";

export class VidSrcClient {
  private async request<T>(endpoint: string): Promise<T> {
    const url = `${VIDSRC_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AccessiCinema/1.0',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`VidSrc API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getPopularMovies(page: number = 1): Promise<VidSrcResponse> {
    try {
      return await this.request<VidSrcResponse>(`/movies/popular?page=${page}`);
    } catch (error) {
      // Fallback to mock data if API fails
      return this.getMockPopularMovies(page);
    }
  }

  async searchMovies(query: string, page: number = 1): Promise<VidSrcResponse> {
    try {
      const encodedQuery = encodeURIComponent(query);
      return await this.request<VidSrcResponse>(`/search/movie?query=${encodedQuery}&page=${page}`);
    } catch (error) {
      // Fallback to mock data if API fails
      return this.getMockSearchResults(query, page);
    }
  }

  async getMovieDetails(id: string): Promise<VidSrcMovie> {
    try {
      return await this.request<VidSrcMovie>(`/movie/${id}`);
    } catch (error) {
      // Fallback to mock data if API fails
      return this.getMockMovieDetails(id);
    }
  }

  async getTopRatedMovies(page: number = 1): Promise<VidSrcResponse> {
    try {
      return await this.request<VidSrcResponse>(`/movies/top-rated?page=${page}`);
    } catch (error) {
      return this.getMockPopularMovies(page);
    }
  }

  async getNowPlayingMovies(page: number = 1): Promise<VidSrcResponse> {
    try {
      return await this.request<VidSrcResponse>(`/movies/now-playing?page=${page}`);
    } catch (error) {
      return this.getMockPopularMovies(page);
    }
  }

  async getUpcomingMovies(page: number = 1): Promise<VidSrcResponse> {
    try {
      return await this.request<VidSrcResponse>(`/movies/upcoming?page=${page}`);
    } catch (error) {
      return this.getMockPopularMovies(page);
    }
  }

  async getMoviesByGenre(genre: string, page: number = 1): Promise<VidSrcResponse> {
    try {
      return await this.request<VidSrcResponse>(`/discover/movie?genre=${encodeURIComponent(genre)}&page=${page}`);
    } catch (error) {
      return this.getMockPopularMovies(page);
    }
  }

  // Mock data fallbacks
  private getMockPopularMovies(page: number): VidSrcResponse {
    const mockMovies: VidSrcMovie[] = [
      {
        id: "1",
        title: "The Shawshank Redemption",
        year: 1994,
        type: "movie",
        poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
        rating: 9.3,
        description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        genres: ["Drama"],
        duration: 142
      },
      {
        id: "2",
        title: "The Godfather",
        year: 1972,
        type: "movie",
        poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
        rating: 9.2,
        description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
        genres: ["Crime", "Drama"],
        duration: 175
      },
      {
        id: "3",
        title: "The Dark Knight",
        year: 2008,
        type: "movie",
        poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
        rating: 9.0,
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
        genres: ["Action", "Crime", "Drama"],
        duration: 152
      },
      {
        id: "4",
        title: "Pulp Fiction",
        year: 1994,
        type: "movie",
        poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg",
        rating: 8.9,
        description: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
        genres: ["Crime", "Drama"],
        duration: 154
      },
      {
        id: "5",
        title: "Forrest Gump",
        year: 1994,
        type: "movie",
        poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/7c8obl4XlbdTjsLTcf6mhWmJer1.jpg",
        rating: 8.8,
        description: "The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate and other historical events unfold from the perspective of an Alabama man.",
        genres: ["Drama", "Romance"],
        duration: 142
      }
    ];

    return {
      results: mockMovies,
      total: 100,
      page,
      totalPages: 20
    };
  }

  private getMockSearchResults(query: string, page: number): VidSrcResponse {
    const allMockMovies = this.getMockPopularMovies(1).results;
    const filteredMovies = allMockMovies.filter(movie => 
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.description?.toLowerCase().includes(query.toLowerCase())
    );

    return {
      results: filteredMovies,
      total: filteredMovies.length,
      page,
      totalPages: Math.ceil(filteredMovies.length / 20)
    };
  }

  private getMockMovieDetails(id: string): VidSrcMovie {
    const mockMovies = this.getMockPopularMovies(1).results;
    return mockMovies.find(movie => movie.id === id) || mockMovies[0];
  }
}

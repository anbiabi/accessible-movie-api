import { SQLDatabase } from "encore.dev/storage/sqldb";

export const moviesDB = new SQLDatabase("movies", {
  migrations: "./migrations",
});

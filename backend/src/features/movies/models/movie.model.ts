import mongoose, { Schema } from "mongoose";

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    year: { type: Number, min: 1888 },
    plot: { type: String, default: "" },
    genres: { type: [String], default: [] },
  },
  {
    collection: "movies",
    strict: false,
    versionKey: false,
  },
);

const sampleMflixDb = mongoose.connection.useDb("sample_mflix", { useCache: true });

export const Movie = sampleMflixDb.models.Movie || sampleMflixDb.model("Movie", movieSchema);

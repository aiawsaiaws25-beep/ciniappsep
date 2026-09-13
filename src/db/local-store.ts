import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "crypto";

export interface DBData {
  users: any[];
  genres: any[];
  movies: any[];
  movieGenres: any[];
  cinemas: any[];
  auditoriums: any[];
  seats: any[];
  showtimes: any[];
  showtimeSeats: any[];
  bookings: any[];
  bookingItems: any[];
  payments: any[];
  tickets: any[];
  auditLogs: any[];
}

const DATA_FILE = path.join(process.cwd(), ".local_data.json");

function getInitialData(): DBData {
  const adminPasswordHash = bcrypt.hashSync("Admin123!", 10);
  const userPasswordHash = bcrypt.hashSync("User123!", 10);

  const adminId = "a1111111-1111-1111-1111-111111111111";
  const demoUserId = "u2222222-2222-2222-2222-222222222222";

  const users = [
    {
      id: adminId,
      email: "admin@cinebook.com",
      passwordHash: adminPasswordHash,
      fullName: "Alexander Cross (Admin)",
      role: "ADMIN",
      phone: "+1 (555) 019-2834",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: demoUserId,
      email: "user@cinebook.com",
      passwordHash: userPasswordHash,
      fullName: "Sophia Vance",
      role: "USER",
      phone: "+1 (555) 839-1029",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const genres = [
    { id: "g1", name: "Sci-Fi", slug: "sci-fi" },
    { id: "g2", name: "Action", slug: "action" },
    { id: "g3", name: "Adventure", slug: "adventure" },
    { id: "g4", name: "Drama", slug: "drama" },
    { id: "g5", name: "Thriller", slug: "thriller" },
    { id: "g6", name: "Animation", slug: "animation" },
  ];

  const movies = [
    {
      id: "m1",
      title: "Dune: Part Two",
      slug: "dune-part-two",
      synopsis:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      durationMins: 166,
      releaseDate: new Date("2024-03-01T00:00:00Z").toISOString(),
      ageRating: "PG-13",
      language: "English",
      director: "Denis Villeneuve",
      cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
      formats: ["2D", "3D", "IMAX", "DOLBY_ATMOS"],
      ratingScore: 92,
      isFeatured: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m2",
      title: "Oppenheimer",
      slug: "oppenheimer",
      synopsis:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
      posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
      durationMins: 180,
      releaseDate: new Date("2023-07-21T00:00:00Z").toISOString(),
      ageRating: "R",
      language: "English",
      director: "Christopher Nolan",
      cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
      formats: ["2D", "IMAX"],
      ratingScore: 94,
      isFeatured: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m3",
      title: "Interstellar: 10th Anniversary IMAX",
      slug: "interstellar-imax",
      synopsis:
        "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft to find a new planet for humans.",
      posterUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      durationMins: 169,
      releaseDate: new Date("2024-09-01T00:00:00Z").toISOString(),
      ageRating: "PG-13",
      language: "English",
      director: "Christopher Nolan",
      cast: ["Matthew McConaughey", "Anne Hathaway"],
      formats: ["IMAX", "DOLBY_ATMOS"],
      ratingScore: 96,
      isFeatured: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "Cyberpunk: Neon Genesis",
      id: "m4",
      slug: "cyberpunk-neon-genesis",
      synopsis:
        "In a rain-slicked mega-city ruled by artificial intelligences, a rogue netrunner unearths a digital relic capable of resetting the global grid.",
      posterUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      durationMins: 132,
      releaseDate: new Date("2024-12-05T00:00:00Z").toISOString(),
      ageRating: "R",
      language: "English",
      director: "Karin Sato",
      cast: ["Ken Watanabe", "Ana de Armas"],
      formats: ["2D", "3D", "IMAX", "DOLBY_ATMOS"],
      ratingScore: 88,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const movieGenres = [
    { movieId: "m1", genreId: "g1" },
    { movieId: "m1", genreId: "g3" },
    { movieId: "m2", genreId: "g4" },
    { movieId: "m2", genreId: "g5" },
    { movieId: "m3", genreId: "g1" },
    { movieId: "m4", genreId: "g1" },
  ];

  const cinemas = [
    {
      id: "c1",
      name: "CineBook Grand Luxe Downtown",
      slug: "cinebook-grand-luxe-downtown",
      address: "742 Broadway Ave, Suite 100",
      city: "New York",
      state: "NY",
      postalCode: "10003",
      phone: "+1 (212) 555-0182",
      imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&q=80",
      amenities: ["IMAX with Laser", "Dolby Atmos", "Recliner Seats", "VIP Champagne Lounge"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "c2",
      name: "CineBook Metropolis IMAX",
      slug: "cinebook-metropolis-imax",
      address: "6801 Hollywood Blvd",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90028",
      phone: "+1 (323) 555-0144",
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&q=80",
      amenities: ["IMAX 70mm", "Dolby Cinema", "Valet Parking"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const auditoriums = [
    { id: "a1", cinemaId: "c1", name: "Auditorium 1 - IMAX Grand", screenType: "IMAX", totalSeats: 48, isActive: true, createdAt: new Date().toISOString() },
    { id: "a2", cinemaId: "c1", name: "Auditorium 2 - Dolby Luxe", screenType: "DOLBY_ATMOS", totalSeats: 40, isActive: true, createdAt: new Date().toISOString() },
    { id: "a3", cinemaId: "c2", name: "Auditorium 1 - IMAX Laser", screenType: "IMAX", totalSeats: 48, isActive: true, createdAt: new Date().toISOString() },
  ];

  const seats: any[] = [];
  const showtimes: any[] = [];
  const showtimeSeats: any[] = [];

  // Create Seats for each Auditorium (Rows A-F, Seats 1-8)
  for (const aud of auditoriums) {
    const rows = ["A", "B", "C", "D", "E", "F"];
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const rowLabel = rows[rIdx];
      for (let sNum = 1; sNum <= 8; sNum++) {
        const isVip = rIdx >= 4;
        const isAcc = rIdx === 0 && (sNum === 1 || sNum === 8);
        const seatType = isAcc ? "ACCESSIBLE" : isVip ? "VIP" : "STANDARD";
        const priceMultiplierCents = isVip ? 350 : 0;
        const seatId = `seat_${aud.id}_${rowLabel}_${sNum}`;

        seats.push({
          id: seatId,
          auditoriumId: aud.id,
          rowLabel,
          seatNumber: sNum,
          seatType,
          priceMultiplierCents,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Create Showtimes for the next 7 days
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const showDate = new Date(today);
    showDate.setDate(today.getDate() + dayOffset);

    const hours = [14, 18, 21];
    for (let hIdx = 0; hIdx < hours.length; hIdx++) {
      for (let mIdx = 0; mIdx < movies.length; mIdx++) {
        const movie = movies[mIdx];
        const aud = auditoriums[mIdx % auditoriums.length];
        const stId = `st_${dayOffset}_${hIdx}_${movie.id}_${aud.id}`;

        const startTime = new Date(showDate);
        startTime.setHours(hours[hIdx], 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + movie.durationMins + 20);

        showtimes.push({
          id: stId,
          movieId: movie.id,
          auditoriumId: aud.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          basePriceCents: aud.screenType === "IMAX" ? 1850 : 1500,
          format: aud.screenType === "IMAX" ? "IMAX 3D" : "2D",
          language: "English",
          isActive: true,
          createdAt: new Date().toISOString(),
        });

        // Add showtime seats
        const audSeats = seats.filter((s) => s.auditoriumId === aud.id);
        for (const s of audSeats) {
          showtimeSeats.push({
            id: `ss_${stId}_${s.id}`,
            showtimeId: stId,
            seatId: s.id,
            status: "AVAILABLE",
            heldUntil: null,
            bookingId: null,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return {
    users,
    genres,
    movies,
    movieGenres,
    cinemas,
    auditoriums,
    seats,
    showtimes,
    showtimeSeats,
    bookings: [],
    bookingItems: [],
    payments: [],
    tickets: [],
    auditLogs: [],
  };
}

class LocalDatabase {
  private data: DBData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DBData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn("Could not read local data file, re-initializing:", e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DBData) {
    try {
      const payload = dataToSave || this.data;
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write local database file:", e);
    }
  }

  public getData(): DBData {
    return this.data;
  }

  public persist() {
    this.saveData();
  }
}

export const localDB = new LocalDatabase();

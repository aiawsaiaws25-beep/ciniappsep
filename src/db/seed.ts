import { db } from "./index";
import {
  users,
  genres,
  movies,
  movieGenres,
  cinemas,
  auditoriums,
  seats,
  showtimes,
  showtimeSeats,
} from "./schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🎬 Starting CineBook Database Seeding...");

  // 1. Seed Users (Admin & Standard)
  console.log("👤 Seeding Users...");
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const userPasswordHash = await bcrypt.hash("User123!", 10);

  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@cinebook.com",
      passwordHash: adminPasswordHash,
      fullName: "Alexander Cross (Admin)",
      role: "ADMIN",
      phone: "+1 (555) 019-2834",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: "ADMIN", fullName: "Alexander Cross (Admin)" },
    })
    .returning();

  const [demoUser] = await db
    .insert(users)
    .values({
      email: "user@cinebook.com",
      passwordHash: userPasswordHash,
      fullName: "Sophia Vance",
      role: "USER",
      phone: "+1 (555) 839-1029",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { fullName: "Sophia Vance" },
    })
    .returning();

  console.log(`✅ Admin (${adminUser.email}) and Demo User (${demoUser.email}) created.`);

  // 2. Seed Genres
  console.log("🏷️ Seeding Genres...");
  const genreList = [
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Action", slug: "action" },
    { name: "Adventure", slug: "adventure" },
    { name: "Drama", slug: "drama" },
    { name: "Thriller", slug: "thriller" },
    { name: "Animation", slug: "animation" },
    { name: "Horror", slug: "horror" },
    { name: "Mystery", slug: "mystery" },
  ];

  const seededGenres: Record<string, string> = {};
  for (const g of genreList) {
    const [inserted] = await db
      .insert(genres)
      .values(g)
      .onConflictDoUpdate({ target: genres.slug, set: { name: g.name } })
      .returning();
    seededGenres[g.slug] = inserted.id;
  }
  console.log(`✅ ${Object.keys(seededGenres).length} genres ready.`);

  // 3. Seed Movies
  console.log("🎞️ Seeding Blockbuster Movies...");
  const movieList = [
    {
      title: "Dune: Part Two",
      slug: "dune-part-two",
      synopsis:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.",
      posterUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
      backdropUrl:
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      durationMins: 166,
      releaseDate: new Date("2024-03-01T00:00:00Z"),
      ageRating: "PG-13",
      language: "English",
      director: "Denis Villeneuve",
      cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem", "Austin Butler"],
      formats: ["2D", "3D", "IMAX", "DOLBY_ATMOS"],
      ratingScore: 92,
      isFeatured: true,
      genreSlugs: ["sci-fi", "adventure", "drama"],
    },
    {
      title: "Oppenheimer",
      slug: "oppenheimer",
      synopsis:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, exploring the deep moral dilemma that reshaped human history.",
      posterUrl:
        "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80",
      backdropUrl:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
      durationMins: 180,
      releaseDate: new Date("2023-07-21T00:00:00Z"),
      ageRating: "R",
      language: "English",
      director: "Christopher Nolan",
      cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"],
      formats: ["2D", "IMAX", "70MM"],
      ratingScore: 94,
      isFeatured: true,
      genreSlugs: ["drama", "thriller"],
    },
    {
      title: "Interstellar: 10th Anniversary IMAX",
      slug: "interstellar-imax",
      synopsis:
        "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
      posterUrl:
        "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&q=80",
      backdropUrl:
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      durationMins: 169,
      releaseDate: new Date("2024-09-01T00:00:00Z"),
      ageRating: "PG-13",
      language: "English",
      director: "Christopher Nolan",
      cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
      formats: ["IMAX", "DOLBY_ATMOS", "70MM"],
      ratingScore: 96,
      isFeatured: true,
      genreSlugs: ["sci-fi", "adventure", "drama"],
    },
    {
      title: "Spider-Man: Beyond the Spider-Verse",
      slug: "spider-man-beyond-spider-verse",
      synopsis:
        "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence when heroes clash on how to handle a new threat.",
      posterUrl:
        "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&q=80",
      backdropUrl:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
      durationMins: 140,
      releaseDate: new Date("2025-01-15T00:00:00Z"),
      ageRating: "PG",
      language: "English",
      director: "Joaquim Dos Santos, Kemp Powers",
      cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Daniel Kaluuya"],
      formats: ["2D", "3D", "IMAX"],
      ratingScore: 95,
      isFeatured: false,
      genreSlugs: ["animation", "action", "adventure"],
    },
    {
      title: "Gladiator II",
      slug: "gladiator-ii",
      synopsis:
        "Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome.",
      posterUrl:
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80",
      backdropUrl:
        "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=4rgYUipGJNo",
      durationMins: 148,
      releaseDate: new Date("2024-11-22T00:00:00Z"),
      ageRating: "R",
      language: "English",
      director: "Ridley Scott",
      cast: ["Paul Mescal", "Pedro Pascal", "Denzel Washington", "Connie Nielsen"],
      formats: ["2D", "IMAX", "DOLBY_ATMOS"],
      ratingScore: 89,
      isFeatured: false,
      genreSlugs: ["action", "drama", "adventure"],
    },
    {
      title: "Cyberpunk: Neon Genesis",
      slug: "cyberpunk-neon-genesis",
      synopsis:
        "In a rain-slicked mega-city ruled by artificial intelligences and augmented syndicates, a rogue netrunner unearths a digital relic capable of resetting the global consciousness grid.",
      posterUrl:
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
      backdropUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      durationMins: 132,
      releaseDate: new Date("2024-12-05T00:00:00Z"),
      ageRating: "R",
      language: "English",
      director: "Karin Sato",
      cast: ["Ken Watanabe", "Ana de Armas", "Dev Patel", "Hiroyuki Sanada"],
      formats: ["2D", "3D", "IMAX", "DOLBY_ATMOS"],
      ratingScore: 88,
      isFeatured: false,
      genreSlugs: ["sci-fi", "action", "thriller"],
    },
  ];

  const seededMovies: Array<{ id: string; title: string; duration: number }> = [];

  for (const m of movieList) {
    const { genreSlugs, ...movieData } = m;
    const [inserted] = await db
      .insert(movies)
      .values(movieData)
      .onConflictDoUpdate({
        target: movies.slug,
        set: {
          title: movieData.title,
          synopsis: movieData.synopsis,
          posterUrl: movieData.posterUrl,
          backdropUrl: movieData.backdropUrl,
          durationMins: movieData.durationMins,
          ratingScore: movieData.ratingScore,
          isFeatured: movieData.isFeatured,
        },
      })
      .returning();

    seededMovies.push({ id: inserted.id, title: inserted.title, duration: inserted.durationMins });

    // Link movie genres
    for (const gSlug of genreSlugs) {
      const gId = seededGenres[gSlug];
      if (gId) {
        await db
          .insert(movieGenres)
          .values({ movieId: inserted.id, genreId: gId })
          .onConflictDoNothing();
      }
    }
  }
  console.log(`✅ ${seededMovies.length} movies seeded.`);

  // 4. Seed Cinemas
  console.log("🏢 Seeding Cinemas & Auditoriums...");
  const cinemaList = [
    {
      name: "CineBook Grand Luxe Downtown",
      slug: "cinebook-grand-luxe-downtown",
      address: "742 Broadway Ave, Suite 100",
      city: "New York",
      state: "NY",
      postalCode: "10003",
      phone: "+1 (212) 555-0182",
      imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&q=80",
      amenities: ["IMAX with Laser", "Dolby Atmos", "Recliner Seats", "VIP Champagne Lounge", "Gourmet Dine-In"],
    },
    {
      name: "CineBook Metropolis IMAX",
      slug: "cinebook-metropolis-imax",
      address: "6801 Hollywood Blvd",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90028",
      phone: "+1 (323) 555-0144",
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&q=80",
      amenities: ["IMAX 70mm", "Dolby Cinema", "Ultra-HD Barco Laser", "Valet Parking"],
    },
    {
      name: "CineBook Starlight Pavilion",
      slug: "cinebook-starlight-pavilion",
      address: "220 Michigan Ave",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      phone: "+1 (312) 555-0199",
      imageUrl: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=1000&q=80",
      amenities: ["VIP Recliner Beds", "Laser Ultra", "Cocktail Bar", "Dolby Atmos"],
    },
  ];

  for (const c of cinemaList) {
    const [insertedCinema] = await db
      .insert(cinemas)
      .values(c)
      .onConflictDoUpdate({
        target: cinemas.slug,
        set: { name: c.name, amenities: c.amenities, imageUrl: c.imageUrl },
      })
      .returning();

    // Create 3 auditoriums per cinema
    const auds = [
      { name: "Auditorium 1 - IMAX Grand", screenType: "IMAX" as const, totalSeats: 64 },
      { name: "Auditorium 2 - Dolby Cinema", screenType: "DOLBY_ATMOS" as const, totalSeats: 48 },
      { name: "Auditorium 3 - Luxe Recliner", screenType: "VIP_LUXE" as const, totalSeats: 36 },
    ];

    for (const aud of auds) {
      let insertedAud;
      const existingAud = await db.query.auditoriums.findFirst({
        where: sql`cinema_id = ${insertedCinema.id} AND name = ${aud.name}`,
      });

      if (!existingAud) {
        [insertedAud] = await db
          .insert(auditoriums)
          .values({
            cinemaId: insertedCinema.id,
            name: aud.name,
            screenType: aud.screenType,
            totalSeats: aud.totalSeats,
          })
          .returning();
      } else {
        insertedAud = existingAud;
      }

      // 5. Seed physical seats for this auditorium if not present
      const existingSeats = await db.query.seats.findMany({
        where: sql`auditorium_id = ${insertedAud.id}`,
      });

      const seatIdsCreated: Array<{ id: string; rowLabel: string; seatNumber: number }> = [];

      if (existingSeats.length === 0) {
        const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
        const seatsPerRow = 8; // 64 seats total

        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const rowLabel = rows[rIdx];
          const isVipRow = rIdx >= 5; // Rows F, G, H are VIP / Recliner
          const isAccessibleRow = rIdx === 0; // Row A is Accessible

          for (let sNum = 1; sNum <= seatsPerRow; sNum++) {
            let seatType: "STANDARD" | "VIP" | "RECLINER" | "ACCESSIBLE" = "STANDARD";
            let priceMultiplierCents = 0;

            if (isAccessibleRow && (sNum === 1 || sNum === 8)) {
              seatType = "ACCESSIBLE";
              priceMultiplierCents = 0;
            } else if (isVipRow) {
              seatType = aud.screenType === "VIP_LUXE" ? "RECLINER" : "VIP";
              priceMultiplierCents = 350; // +$3.50 for VIP
            }

            const [newSeat] = await db
              .insert(seats)
              .values({
                auditoriumId: insertedAud.id,
                rowLabel,
                seatNumber: sNum,
                seatType,
                priceMultiplierCents,
              })
              .returning();

            seatIdsCreated.push({
              id: newSeat.id,
              rowLabel: newSeat.rowLabel,
              seatNumber: newSeat.seatNumber,
            });
          }
        }
      } else {
        existingSeats.forEach((s: any) =>
          seatIdsCreated.push({ id: s.id, rowLabel: s.rowLabel, seatNumber: s.seatNumber })
        );
      }

      // 6. Seed Showtimes for the next 7 days for each movie
      const today = new Date();
      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const showDate = new Date(today);
        showDate.setDate(today.getDate() + dayOffset);

        // Schedule 2 showtimes per auditorium per day
        const showHours = [14, 18, 21]; // 2:00 PM, 6:00 PM, 9:00 PM

        for (let idx = 0; idx < showHours.length; idx++) {
          const movie = seededMovies[(dayOffset + idx) % seededMovies.length];
          const startTime = new Date(showDate);
          startTime.setHours(showHours[idx], 0, 0, 0);

          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + movie.duration + 20); // +20 min trailers

          const basePriceCents = aud.screenType === "IMAX" ? 1850 : aud.screenType === "VIP_LUXE" ? 2200 : 1500;

          // Check if showtime already exists
          const existingShowtime = await db.query.showtimes.findFirst({
            where: sql`auditorium_id = ${insertedAud.id} AND start_time = ${startTime}`,
          });

          let showtimeRecord = existingShowtime;
          if (!existingShowtime) {
            [showtimeRecord] = await db
              .insert(showtimes)
              .values({
                movieId: movie.id,
                auditoriumId: insertedAud.id,
                startTime,
                endTime,
                basePriceCents,
                format: aud.screenType === "IMAX" ? "IMAX 3D" : aud.screenType === "VIP_LUXE" ? "Dolby Atmos" : "2D",
                language: "English",
              })
              .returning();

            // Populate showtime_seats for this showtime
            if (showtimeRecord && seatIdsCreated.length > 0) {
              const showtimeSeatsPayload = seatIdsCreated.map((s) => ({
                showtimeId: showtimeRecord!.id,
                seatId: s.id,
                status: "AVAILABLE" as const,
              }));

              await db.insert(showtimeSeats).values(showtimeSeatsPayload).onConflictDoNothing();
            }
          }
        }
      }
    }
  }

  console.log("🎉 CineBook Database Seeding Completed Successfully!");
}

seed()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => {
    console.log("Done.");
  });

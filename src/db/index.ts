import { localDB } from "./local-store";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "crypto";

dotenv.config({ path: ".env" });

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

const isNeon =
  connectionString.includes("neon.tech") ||
  connectionString.includes("aws.neon.tech");

// In-Memory / File-backed robust Local Drizzle-compatible proxy
class LocalDrizzleAdapter {
  query = {
    users: {
      findFirst: async (options?: any) => {
        const data = localDB.getData();
        if (!options?.where) return data.users[0] || null;
        // Search by email or id
        const user = data.users.find((u) => {
          if (options.where.email && u.email.toLowerCase() === String(options.where.email).toLowerCase()) return true;
          if (options.where.id && u.id === options.where.id) return true;
          return false;
        });
        return user ? { ...user } : null;
      },
      findMany: async () => {
        return [...localDB.getData().users];
      },
    },
    genres: {
      findMany: async () => {
        return [...localDB.getData().genres];
      },
    },
    movies: {
      findFirst: async (options?: any) => {
        const data = localDB.getData();
        const idOrSlug = options?.where?.id || options?.where?.slug;
        const movie = data.movies.find((m) => m.id === idOrSlug || m.slug === idOrSlug);
        if (!movie) return null;

        // Populate genres & showtimes
        const mGenres = data.movieGenres
          .filter((mg) => mg.movieId === movie.id)
          .map((mg) => ({
            genre: data.genres.find((g) => g.id === mg.genreId) || { name: "General", slug: "general" },
          }));

        const mShowtimes = data.showtimes
          .filter((st) => st.movieId === movie.id && st.isActive)
          .map((st) => {
            const aud = data.auditoriums.find((a) => a.id === st.auditoriumId);
            const cinema = data.cinemas.find((c) => c.id === aud?.cinemaId);
            return {
              ...st,
              auditorium: {
                ...aud,
                cinema,
              },
            };
          });

        return {
          ...movie,
          movieGenres: mGenres,
          showtimes: mShowtimes,
        };
      },
      findMany: async (options?: any) => {
        const data = localDB.getData();
        let list = data.movies.filter((m) => m.isActive);

        return list.map((movie) => {
          const mGenres = data.movieGenres
            .filter((mg) => mg.movieId === movie.id)
            .map((mg) => ({
              genre: data.genres.find((g) => g.id === mg.genreId) || { name: "General", slug: "general" },
            }));
          return {
            ...movie,
            movieGenres: mGenres,
          };
        });
      },
    },
    cinemas: {
      findFirst: async (options?: any) => {
        const data = localDB.getData();
        const idOrSlug = options?.where?.id || options?.where?.slug;
        const cinema = data.cinemas.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
        if (!cinema) return null;

        const auds = data.auditoriums
          .filter((a) => a.cinemaId === cinema.id && a.isActive)
          .map((aud) => {
            const showtimes = data.showtimes
              .filter((st) => st.auditoriumId === aud.id && st.isActive)
              .map((st) => {
                const movie = data.movies.find((m) => m.id === st.movieId);
                return {
                  ...st,
                  movie,
                };
              });
            return {
              ...aud,
              showtimes,
            };
          });

        return {
          ...cinema,
          auditoriums: auds,
        };
      },
      findMany: async () => {
        const data = localDB.getData();
        return data.cinemas
          .filter((c) => c.isActive)
          .map((c) => {
            const auds = data.auditoriums.filter((a) => a.cinemaId === c.id);
            return { ...c, auditoriums: auds };
          });
      },
    },
    showtimes: {
      findFirst: async (options?: any) => {
        const data = localDB.getData();
        const stId = options?.where?.id;
        const st = data.showtimes.find((s) => s.id === stId);
        if (!st) return null;

        const movie = data.movies.find((m) => m.id === st.movieId);
        const aud = data.auditoriums.find((a) => a.id === st.auditoriumId);
        const cinema = data.cinemas.find((c) => c.id === aud?.cinemaId);
        const audSeats = data.seats.filter((s) => s.auditoriumId === aud?.id);
        const stSeats = data.showtimeSeats.filter((ss) => ss.showtimeId === st.id);

        return {
          ...st,
          movie,
          auditorium: {
            ...aud,
            cinema,
            seats: audSeats,
          },
          showtimeSeats: stSeats.map((ss) => ({
            ...ss,
            seat: audSeats.find((s) => s.id === ss.seatId),
          })),
        };
      },
      findMany: async () => {
        const data = localDB.getData();
        return data.showtimes.map((st) => {
          const movie = data.movies.find((m) => m.id === st.movieId);
          const aud = data.auditoriums.find((a) => a.id === st.auditoriumId);
          const cinema = data.cinemas.find((c) => c.id === aud?.cinemaId);
          return {
            ...st,
            movie,
            auditorium: {
              ...aud,
              cinema,
            },
          };
        });
      },
    },
    bookings: {
      findFirst: async (options?: any) => {
        const data = localDB.getData();
        const bId = options?.where?.id || options?.where?.bookingReference || options?.where?.idempotencyKey;
        const booking = data.bookings.find(
          (b) => b.id === bId || b.bookingReference === bId || b.idempotencyKey === bId
        );
        if (!booking) return null;

        const items = data.bookingItems.filter((bi) => bi.bookingId === booking.id);
        const bookingPayments = data.payments.filter((p) => p.bookingId === booking.id);
        const bookingTickets = data.tickets.filter((t) => t.bookingId === booking.id);
        const showtime = await this.query.showtimes.findFirst({ where: { id: booking.showtimeId } });

        return {
          ...booking,
          items,
          payments: bookingPayments,
          tickets: bookingTickets,
          showtime,
        };
      },
      findMany: async (options?: any) => {
        const data = localDB.getData();
        const userId = options?.where?.userId;
        let list = userId ? data.bookings.filter((b) => b.userId === userId) : [...data.bookings];

        const enriched = await Promise.all(
          list.map(async (b) => {
            const items = data.bookingItems.filter((bi) => bi.bookingId === b.id);
            const bookingTickets = data.tickets.filter((t) => t.bookingId === b.id);
            const bookingPayments = data.payments.filter((p) => p.bookingId === b.id);
            const showtime = await this.query.showtimes.findFirst({ where: { id: b.showtimeId } });
            return {
              ...b,
              items,
              tickets: bookingTickets,
              payments: bookingPayments,
              showtime,
            };
          })
        );
        return enriched.reverse();
      },
    },
    auditLogs: {
      findMany: async (options?: any) => {
        const data = localDB.getData();
        const limit = options?.limit || 50;
        return [...data.auditLogs].reverse().slice(0, limit);
      },
    },
    showtimeSeats: {
      findFirst: async (options?: any) => {
        const data = localDB.getData();
        const id = options?.where?.id;
        const seat = data.showtimeSeats.find((s) => s.id === id);
        return seat ? { ...seat } : null;
      },
      findMany: async (options?: any) => {
        const data = localDB.getData();
        return [...data.showtimeSeats];
      },
    },
  };

  insert(table: any) {
    const data = localDB.getData();
    return {
      values: (val: any) => {
        const items = Array.isArray(val) ? val : [val];
        const insertedList: any[] = [];

        for (const item of items) {
          const record = {
            id: item.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            ...item,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
          };

          // Table mapping
          if (table === schema.users) {
            data.users.push(record);
          } else if (table === schema.movies) {
            data.movies.push(record);
          } else if (table === schema.genres) {
            data.genres.push(record);
          } else if (table === schema.movieGenres) {
            data.movieGenres.push(record);
          } else if (table === schema.cinemas) {
            data.cinemas.push(record);
          } else if (table === schema.auditoriums) {
            data.auditoriums.push(record);
          } else if (table === schema.seats) {
            data.seats.push(record);
          } else if (table === schema.showtimes) {
            data.showtimes.push(record);
          } else if (table === schema.showtimeSeats) {
            data.showtimeSeats.push(record);
          } else if (table === schema.bookings) {
            data.bookings.push(record);
          } else if (table === schema.bookingItems) {
            data.bookingItems.push(record);
          } else if (table === schema.payments) {
            data.payments.push(record);
          } else if (table === schema.tickets) {
            data.tickets.push(record);
          } else if (table === schema.auditLogs) {
            data.auditLogs.push(record);
          }

          insertedList.push(record);
        }

        localDB.persist();

        return {
          returning: () => insertedList,
          onConflictDoNothing: () => ({ returning: () => insertedList }),
          onConflictDoUpdate: () => ({ returning: () => insertedList }),
        };
      },
    };
  }

  update(table: any) {
    const data = localDB.getData();
    return {
      set: (updates: any) => ({
        where: (condition: any) => {
          const updatedItems: any[] = [];
          const now = new Date().toISOString();

          const updateList = (arr: any[]) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = { ...arr[i], ...updates, updatedAt: now };
              updatedItems.push(arr[i]);
            }
          };

          if (table === schema.showtimeSeats) {
            // update matching showtimeSeats
            for (const s of data.showtimeSeats) {
              if (updates.status) s.status = updates.status;
              if (updates.heldUntil !== undefined) s.heldUntil = updates.heldUntil ? new Date(updates.heldUntil).toISOString() : null;
              if (updates.bookingId !== undefined) s.bookingId = updates.bookingId;
              s.updatedAt = now;
              updatedItems.push(s);
            }
          } else if (table === schema.bookings) {
            for (const b of data.bookings) {
              if (updates.status) b.status = updates.status;
              b.updatedAt = now;
              updatedItems.push(b);
            }
          } else if (table === schema.payments) {
            for (const p of data.payments) {
              if (updates.status) p.status = updates.status;
              updatedItems.push(p);
            }
          }

          localDB.persist();
          return {
            returning: () => updatedItems,
          };
        },
      }),
    };
  }

  select(fields?: any) {
    const data = localDB.getData();
    return {
      from: (table: any) => ({
        where: (condition?: any) => {
          let list = [];
          if (table === schema.bookings) list = data.bookings.filter((b) => b.status === "CONFIRMED");
          else if (table === schema.movies) list = data.movies;
          else if (table === schema.showtimes) list = data.showtimes;
          else if (table === schema.users) list = data.users;
          else if (table === schema.showtimeSeats) list = data.showtimeSeats;

          const totalRev = data.bookings
            .filter((b) => b.status === "CONFIRMED")
            .reduce((acc, b) => acc + (b.totalCents || 0), 0);

          return [
            {
              totalRevenueCents: totalRev,
              confirmedCount: data.bookings.filter((b) => b.status === "CONFIRMED").length,
              count: list.length,
              total: data.showtimeSeats.length,
              booked: data.showtimeSeats.filter((s) => s.status === "BOOKED").length,
              held: data.showtimeSeats.filter((s) => s.status === "HELD").length,
            },
          ];
        },
      }),
    };
  }

  async transaction(fn: (tx: any) => Promise<any>) {
    return await fn(this);
  }

  async execute(sqlQuery: any) {
    // Mock SELECT FOR UPDATE
    const data = localDB.getData();
    return {
      rows: data.showtimeSeats.map((ss) => {
        const s = data.seats.find((seat) => seat.id === ss.seatId) || {};
        return {
          ...ss,
          row_label: s.rowLabel || "A",
          seat_number: s.seatNumber || 1,
          seat_type: s.seatType || "STANDARD",
          price_multiplier_cents: s.priceMultiplierCents || 0,
        };
      }),
    };
  }
}

export const db: any = new LocalDrizzleAdapter();
export { schema };

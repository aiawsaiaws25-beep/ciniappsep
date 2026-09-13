import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const screenTypeEnum = pgEnum("screen_type", [
  "STANDARD",
  "IMAX",
  "DOLBY_ATMOS",
  "VIP_LUXE",
  "FOUR_DX",
]);
export const seatTypeEnum = pgEnum("seat_type", [
  "STANDARD",
  "VIP",
  "RECLINER",
  "ACCESSIBLE",
]);
export const seatStatusEnum = pgEnum("seat_status", [
  "AVAILABLE",
  "HELD",
  "BOOKED",
  "BLOCKED",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
]);
export const paymentProviderEnum = pgEnum("payment_provider", [
  "MOCK_TEST",
  "STRIPE_TEST",
]);

// -------------------------------------------------------------
// 1. USERS TABLE
// -------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    role: userRoleEnum("role").default("USER").notNull(),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role),
  })
);

// -------------------------------------------------------------
// 2. GENRES TABLE
// -------------------------------------------------------------
export const genres = pgTable(
  "genres",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIdx: index("genres_slug_idx").on(table.slug),
  })
);

// -------------------------------------------------------------
// 3. MOVIES TABLE
// -------------------------------------------------------------
export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    synopsis: text("synopsis").notNull(),
    posterUrl: text("poster_url").notNull(),
    backdropUrl: text("backdrop_url").notNull(),
    trailerUrl: text("trailer_url"),
    durationMins: integer("duration_mins").notNull(),
    releaseDate: timestamp("release_date", { withTimezone: true, mode: "date" }).notNull(),
    ageRating: text("age_rating").default("PG-13").notNull(), // G, PG, PG-13, R, NC-17
    language: text("language").default("English").notNull(),
    director: text("director"),
    cast: jsonb("cast").$type<string[]>().default([]).notNull(),
    formats: jsonb("formats").$type<string[]>().default(["2D", "3D", "IMAX"]).notNull(),
    ratingScore: integer("rating_score").default(85).notNull(), // e.g., 85 = 8.5/10 (percentage)
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIdx: index("movies_slug_idx").on(table.slug),
    activeIdx: index("movies_active_idx").on(table.isActive),
    featuredIdx: index("movies_featured_idx").on(table.isFeatured),
    titleIdx: index("movies_title_idx").on(table.title),
  })
);

// -------------------------------------------------------------
// 4. MOVIE_GENRES TABLE (Junction)
// -------------------------------------------------------------
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: uniqueIndex("movie_genres_pk").on(table.movieId, table.genreId),
  })
);

// -------------------------------------------------------------
// 5. CINEMAS TABLE
// -------------------------------------------------------------
export const cinemas = pgTable(
  "cinemas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    phone: text("phone"),
    imageUrl: text("image_url"),
    amenities: jsonb("amenities").$type<string[]>().default([]).notNull(), // ["IMAX", "Dolby Atmos", "Recliner Seats", "VIP Lounge", "Dine-In"]
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIdx: index("cinemas_slug_idx").on(table.slug),
    cityIdx: index("cinemas_city_idx").on(table.city),
  })
);

// -------------------------------------------------------------
// 6. AUDITORIUMS TABLE
// -------------------------------------------------------------
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cinemaId: uuid("cinema_id")
      .notNull()
      .references(() => cinemas.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // Screen 1, Screen 2, IMAX Grand
    screenType: screenTypeEnum("screen_type").default("STANDARD").notNull(),
    totalSeats: integer("total_seats").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    cinemaAuditoriumUnique: uniqueIndex("auditoriums_cinema_name_unique").on(
      table.cinemaId,
      table.name
    ),
    cinemaIdx: index("auditoriums_cinema_id_idx").on(table.cinemaId),
  })
);

// -------------------------------------------------------------
// 7. SEATS TABLE (Physical layout)
// -------------------------------------------------------------
export const seats = pgTable(
  "seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    rowLabel: text("row_label").notNull(), // A, B, C, ...
    seatNumber: integer("seat_number").notNull(), // 1, 2, 3, ...
    seatType: seatTypeEnum("seat_type").default("STANDARD").notNull(),
    priceMultiplierCents: integer("price_multiplier_cents").default(0).notNull(), // e.g., +$3.00 (300 cents) for VIP
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    auditoriumSeatUnique: uniqueIndex("seats_auditorium_row_num_unique").on(
      table.auditoriumId,
      table.rowLabel,
      table.seatNumber
    ),
    auditoriumIdx: index("seats_auditorium_id_idx").on(table.auditoriumId),
  })
);

// -------------------------------------------------------------
// 8. SHOWTIMES TABLE
// -------------------------------------------------------------
export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true, mode: "date" }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true, mode: "date" }).notNull(),
    basePriceCents: integer("base_price_cents").notNull(), // Minor units: 1450 = $14.50
    format: text("format").default("2D").notNull(), // 2D, 3D, IMAX 3D, Dolby Atmos
    language: text("language").default("English").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    movieIdx: index("showtimes_movie_id_idx").on(table.movieId),
    auditoriumIdx: index("showtimes_auditorium_id_idx").on(table.auditoriumId),
    startTimeIdx: index("showtimes_start_time_idx").on(table.startTime),
  })
);

// -------------------------------------------------------------
// 9. SHOWTIME_SEATS TABLE (State per showtime)
// -------------------------------------------------------------
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    status: seatStatusEnum("status").default("AVAILABLE").notNull(),
    heldUntil: timestamp("held_until", { withTimezone: true, mode: "date" }),
    bookingId: uuid("booking_id"), // linked booking when held or booked
    version: integer("version").default(1).notNull(), // Optimistic locking
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueShowtimeSeat: uniqueIndex("showtime_seats_showtime_seat_unique").on(
      table.showtimeId,
      table.seatId
    ),
    showtimeIdx: index("showtime_seats_showtime_id_idx").on(table.showtimeId),
    statusIdx: index("showtime_seats_status_idx").on(table.status),
    heldUntilIdx: index("showtime_seats_held_until_idx").on(table.heldUntil),
    bookingIdx: index("showtime_seats_booking_id_idx").on(table.bookingId),
  })
);

// -------------------------------------------------------------
// 10. BOOKINGS TABLE
// -------------------------------------------------------------
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingReference: text("booking_reference").notNull().unique(), // e.g. CNB-748921
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    status: bookingStatusEnum("status").default("PENDING").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    serviceFeeCents: integer("service_fee_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    idempotencyKey: text("idempotency_key").unique(),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    referenceIdx: index("bookings_reference_idx").on(table.bookingReference),
    userIdx: index("bookings_user_id_idx").on(table.userId),
    showtimeIdx: index("bookings_showtime_id_idx").on(table.showtimeId),
    statusIdx: index("bookings_status_idx").on(table.status),
    expiresAtIdx: index("bookings_expires_at_idx").on(table.expiresAt),
  })
);

// -------------------------------------------------------------
// 11. BOOKING_ITEMS TABLE (Itemized seats)
// -------------------------------------------------------------
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id")
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: "cascade" }),
    seatLabel: text("seat_label").notNull(), // e.g., "Row D - Seat 6"
    seatType: text("seat_type").notNull(), // STANDARD, VIP, RECLINER, ACCESSIBLE
    unitPriceCents: integer("unit_price_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    bookingIdx: index("booking_items_booking_id_idx").on(table.bookingId),
    seatIdx: index("booking_items_seat_id_idx").on(table.showtimeSeatId),
  })
);

// -------------------------------------------------------------
// 12. PAYMENTS TABLE
// -------------------------------------------------------------
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    paymentIntentId: text("payment_intent_id").notNull(),
    provider: paymentProviderEnum("provider").default("MOCK_TEST").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").default("USD").notNull(),
    idempotencyKey: text("idempotency_key").unique(),
    paymentMethod: text("payment_method").default("card").notNull(),
    cardLast4: text("card_last4"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    bookingIdx: index("payments_booking_id_idx").on(table.bookingId),
    intentIdx: index("payments_intent_idx").on(table.paymentIntentId),
    statusIdx: index("payments_status_idx").on(table.status),
  })
);

// -------------------------------------------------------------
// 13. TICKETS TABLE (Digital tickets & QR verification)
// -------------------------------------------------------------
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    ticketCode: text("ticket_code").notNull().unique(), // e.g. TKT-934810-D6
    qrCodeData: text("qr_code_data").notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    bookingIdx: index("tickets_booking_id_idx").on(table.bookingId),
    ticketCodeIdx: index("tickets_code_idx").on(table.ticketCode),
  })
);

// -------------------------------------------------------------
// 14. AUDIT_LOGS TABLE
// -------------------------------------------------------------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    action: text("action").notNull(), // "SEAT_HOLD", "BOOKING_CONFIRMED", "PAYMENT_PROCESSED", "BOOKING_CANCELLED", "SEAT_RELEASED", "ADMIN_MOVIE_CREATED"
    entityType: text("entity_type").notNull(), // "booking", "seat", "showtime", "movie", "payment"
    entityId: text("entity_id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    actionIdx: index("audit_logs_action_idx").on(table.action),
    entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  })
);

// -------------------------------------------------------------
// DRIZZLE RELATIONS DEFINITIONS
// -------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  auditLogs: many(auditLogs),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one, many }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
  bookingItems: many(bookingItems),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  items: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
}));

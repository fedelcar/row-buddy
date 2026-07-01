import {
  boolean,
  date,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { SESSION_TYPES, SIDES, TEST_TYPES } from "@/lib/domain";

export { SESSION_TYPES, SIDES, TEST_TYPES, TEST_DISTANCES } from "@/lib/domain";
export type { SessionType, Side, TestType } from "@/lib/domain";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ageGroup: text("age_group"),
  side: text("side", { enum: SIDES }),
  weightClass: text("weight_class"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  type: text("type", { enum: SESSION_TYPES }).notNull(),
  distanceMeters: integer("distance_meters"),
  durationSeconds: integer("duration_seconds"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionResults = pgTable("session_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  athleteId: integer("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  timeSeconds: real("time_seconds"),
  splitSeconds: real("split_seconds"),
  strokeRate: integer("stroke_rate"),
  notes: text("notes"),
});

export const ergTests = pgTable("erg_tests", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  testType: text("test_type", { enum: TEST_TYPES }).notNull(),
  /** Total time for distance tests; 1800 for 30min tests. */
  timeSeconds: real("time_seconds").notNull(),
  /** Meters covered — fixed for distance tests, the result for 30min. */
  distanceMeters: integer("distance_meters").notNull(),
  /** Average pace per 500m, derived at insert so ranking is one column. */
  splitSeconds: real("split_seconds").notNull(),
  strokeRate: integer("stroke_rate"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Athlete = typeof athletes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionResult = typeof sessionResults.$inferSelect;
export type ErgTest = typeof ergTests.$inferSelect;

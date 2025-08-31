import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON stored as text in SQLite
    expire: text("expire").notNull(), // ISO string
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: text("created_at"), // ISO string
  updatedAt: text("updated_at"), // ISO string
});

// Birth data table for astrology calculations
export const birthData = sqliteTable("birth_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  gender: text("gender"),
  birthDate: text("birth_date").notNull(), // YYYY-MM-DD - maps to actual database column
  birthTime: text("birth_time").notNull(), // HH:MM:SS - maps to actual database column
  birthPlace: text("birth_place").notNull(), // maps to actual database column
  state: text("state"),
  country: text("country"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timezone: text("timezone"),
  
  // Additional KP astrology fields
  motherName: text("mother_name"),
  fatherName: text("father_name"),
  gotra: text("gotra"),
  rectifiedTime: text("rectified_time"),
  givenTime: text("given_time"),
  ayanamsa: text("ayanamsa"),
  dayOfWeek: text("day_of_week"),
  sunRise: text("sun_rise"),
  sunSet: text("sun_set"),
  
  // KP specific fields
  tithi: text("tithi"),
  star: text("star"),
  starPada: integer("star_pada"),
  rasi: text("rasi"),
  lagna: text("lagna"),
  lagnaDegreesMinutes: text("lagna_degrees_minutes"),
  hora: text("hora"),
  yogam: text("yogam"),
  karana: text("karana"),
  dasaBalance: text("dasa_balance"),

  year: integer("year"),
  month: integer("month"),
  day: integer("day"),
  createdAt: text("created_at"), // ISO string - maps to actual database column
  updatedAt: text("updated_at"), // ISO string
});

// Astrology charts table
export const charts = sqliteTable("charts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  birthDataId: integer("birth_data_id").notNull().references(() => birthData.id),
  chartType: text("chart_type").notNull(), // 'raasi', 'navamsa', 'd10', 'd60', 'bhava', etc.
  chartData: text("chart_data").notNull(), // JSON stored as text
  kpData: text("kp_data"), // JSON stored as text
  aiInterpretation: text("ai_interpretation"),
  createdAt: text("created_at"), // ISO string
  updatedAt: text("updated_at"), // ISO string
});

// User profiles for matching
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  interests: text("interests"), // JSON array stored as text
  astrologyTags: text("astrology_tags"), // JSON array stored as text
  isVisible: integer("is_visible", { mode: 'boolean' }),
  createdAt: text("created_at"), // ISO string
  updatedAt: text("updated_at"), // ISO string
});

// Compatibility matches
export const matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  matchedUserId: text("matched_user_id").notNull().references(() => users.id),
  compatibilityScore: real("compatibility_score").notNull(),
  matchData: text("match_data").notNull(), // JSON stored as text
  status: text("status"), // pending, liked, passed, mutual
  createdAt: text("created_at"), // ISO string
  updatedAt: text("updated_at"), // ISO string
});

// AI interpretations and insights
export const interpretations = sqliteTable("interpretations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chartId: integer("chart_id").notNull().references(() => charts.id),
  interpretationType: text("interpretation_type").notNull(), // general, compatibility, transit, etc.
  interpretation: text("interpretation").notNull(),
  confidence: real("confidence"),
  createdAt: text("created_at"), // ISO string
});

// Admin settings and configurations
export const adminSettings = sqliteTable("admin_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value").notNull(), // JSON stored as text
  description: text("description"),
  createdAt: text("created_at"), // ISO string
  updatedAt: text("updated_at"), // ISO string
});

// Relations (same as PostgreSQL version)
export const usersRelations = relations(users, ({ many }) => ({
  birthData: many(birthData),
  charts: many(charts),
  profiles: many(profiles),
  matches: many(matches),
}));

export const birthDataRelations = relations(birthData, ({ one, many }) => ({
  user: one(users, { fields: [birthData.userId], references: [users.id] }),
  charts: many(charts),
}));

export const chartsRelations = relations(charts, ({ one, many }) => ({
  user: one(users, { fields: [charts.userId], references: [users.id] }),
  birthData: one(birthData, { fields: [charts.birthDataId], references: [birthData.id] }),
  interpretations: many(interpretations),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, { fields: [matches.userId], references: [users.id] }),
  matchedUser: one(users, { fields: [matches.matchedUserId], references: [users.id] }),
}));

export const interpretationsRelations = relations(interpretations, ({ one }) => ({
  chart: one(charts, { fields: [interpretations.chartId], references: [charts.id] }),
}));

// Insert schemas
export const insertBirthDataSchema = createInsertSchema(birthData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChartSchema = createInsertSchema(charts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterpretationSchema = createInsertSchema(interpretations).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type BirthData = typeof birthData.$inferSelect;
export type InsertBirthData = z.infer<typeof insertBirthDataSchema>;
export type Chart = typeof charts.$inferSelect;
export type InsertChart = z.infer<typeof insertChartSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Interpretation = typeof interpretations.$inferSelect;
export type InsertInterpretation = z.infer<typeof insertInterpretationSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;

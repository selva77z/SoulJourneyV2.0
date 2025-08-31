import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Birth data table for astrology calculations
export const birthData = pgTable("birth_data", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  gender: varchar("gender", { length: 10 }),
  birthDate: date("birth_date").notNull(),
  birthTime: time("birth_time").notNull(),
  birthPlace: varchar("birth_place").notNull(),
  state: varchar("state"),
  country: varchar("country"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  timezone: varchar("timezone").notNull(),
  
  // Additional KP astrology fields
  motherName: varchar("mother_name"),
  fatherName: varchar("father_name"),
  gotra: varchar("gotra"),
  rectifiedTime: time("rectified_time"),
  givenTime: time("given_time"),
  ayanamsa: varchar("ayanamsa"),
  dayOfWeek: varchar("day_of_week"),
  sunRise: time("sun_rise"),
  sunSet: time("sun_set"),
  
  // KP specific fields
  tithi: varchar("tithi"),
  star: varchar("star"),
  starPada: integer("star_pada"),
  rasi: varchar("rasi"),
  lagna: varchar("lagna"),
  lagnaDegreesMinutes: varchar("lagna_degrees_minutes"),
  hora: varchar("hora"),
  yogam: varchar("yogam"),
  karana: varchar("karana"),
  dasaBalance: varchar("dasa_balance"),

  
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Astrology charts table
export const charts = pgTable("charts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  birthDataId: integer("birth_data_id").notNull().references(() => birthData.id),
  chartType: varchar("chart_type").notNull(), // 'raasi', 'navamsa', 'd10', 'd60', 'bhava', etc.
  chartData: jsonb("chart_data").notNull(), // Houses, planets, aspects, etc.
  kpData: jsonb("kp_data"), // KP specific calculations
  aiInterpretation: text("ai_interpretation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles for matching
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  displayName: varchar("display_name").notNull(),
  bio: text("bio"),
  interests: text("interests").array(),
  astrologyTags: text("astrology_tags").array(),
  compatibilityTag: varchar("compatibility_tag"), // Main matching tag (red, green, blue, etc.)
  hiddenFilters: jsonb("hidden_filters"), // Admin-defined hidden matching criteria
  isVisible: boolean("is_visible").default(true),
  mobileAppId: varchar("mobile_app_id"), // For mobile app integration
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mobile app integration table
export const mobileUsers = pgTable("mobile_users", {
  id: serial("id").primaryKey(),
  mobileAppId: varchar("mobile_app_id").notNull().unique(),
  deviceId: varchar("device_id"),
  name: varchar("name").notNull(),
  birthDate: date("birth_date").notNull(),
  birthTime: time("birth_time").notNull(),
  birthPlace: varchar("birth_place").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  timezone: varchar("timezone"),
  isProcessed: boolean("is_processed").default(false),
  webUserId: varchar("web_user_id").references(() => users.id),
  assignedTag: varchar("assigned_tag"), // Tag assigned after processing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tag assignment rules (admin configurable)
export const tagRules = pgTable("tag_rules", {
  id: serial("id").primaryKey(),
  ruleName: varchar("rule_name").notNull(),
  ruleDescription: text("rule_description"),
  conditions: jsonb("conditions").notNull(), // KP-based conditions for tag assignment
  assignedTag: varchar("assigned_tag").notNull(),
  priority: integer("priority").default(0), // Higher priority rules are evaluated first
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tag visibility matrix (who can see whom)
export const tagVisibility = pgTable("tag_visibility", {
  id: serial("id").primaryKey(),
  fromTag: varchar("from_tag").notNull(),
  toTag: varchar("to_tag").notNull(),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compatibility matches
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  matchedUserId: varchar("matched_user_id").notNull().references(() => users.id),
  compatibilityScore: decimal("compatibility_score", { precision: 5, scale: 2 }).notNull(),
  matchData: jsonb("match_data").notNull(), // Detailed compatibility analysis
  status: varchar("status").default("pending"), // pending, liked, passed, mutual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI interpretations and insights
export const interpretations = pgTable("interpretations", {
  id: serial("id").primaryKey(),
  chartId: integer("chart_id").notNull().references(() => charts.id),
  interpretationType: varchar("interpretation_type").notNull(), // general, compatibility, transit, etc.
  interpretation: text("interpretation").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin settings and configurations
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
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

export const mobileUsersRelations = relations(mobileUsers, ({ one }) => ({
  webUser: one(users, { fields: [mobileUsers.webUserId], references: [users.id] }),
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

export const insertMobileUserSchema = createInsertSchema(mobileUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTagRuleSchema = createInsertSchema(tagRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTagVisibilitySchema = createInsertSchema(tagVisibility).omit({
  id: true,
  createdAt: true,
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
export type MobileUser = typeof mobileUsers.$inferSelect;
export type InsertMobileUser = z.infer<typeof insertMobileUserSchema>;
export type TagRule = typeof tagRules.$inferSelect;
export type InsertTagRule = z.infer<typeof insertTagRuleSchema>;
export type TagVisibility = typeof tagVisibility.$inferSelect;
export type InsertTagVisibility = z.infer<typeof insertTagVisibilitySchema>;

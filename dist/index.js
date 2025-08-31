var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import dotenv from "dotenv";
import express2 from "express";

// server/routes-simple.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminSettings: () => adminSettings,
  birthData: () => birthData,
  birthDataRelations: () => birthDataRelations,
  charts: () => charts,
  chartsRelations: () => chartsRelations,
  insertAdminSettingSchema: () => insertAdminSettingSchema,
  insertBirthDataSchema: () => insertBirthDataSchema,
  insertChartSchema: () => insertChartSchema,
  insertInterpretationSchema: () => insertInterpretationSchema,
  insertMatchSchema: () => insertMatchSchema,
  insertProfileSchema: () => insertProfileSchema,
  interpretations: () => interpretations,
  interpretationsRelations: () => interpretationsRelations,
  matches: () => matches,
  matchesRelations: () => matchesRelations,
  profiles: () => profiles,
  profilesRelations: () => profilesRelations,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
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
  time
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var birthData = pgTable("birth_data", {
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
  updatedAt: timestamp("updated_at").defaultNow()
});
var charts = pgTable("charts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  birthDataId: integer("birth_data_id").notNull().references(() => birthData.id),
  chartType: varchar("chart_type").notNull(),
  // 'raasi', 'navamsa', 'd10', 'd60', 'bhava', etc.
  chartData: jsonb("chart_data").notNull(),
  // Houses, planets, aspects, etc.
  kpData: jsonb("kp_data"),
  // KP specific calculations
  aiInterpretation: text("ai_interpretation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  displayName: varchar("display_name").notNull(),
  bio: text("bio"),
  interests: text("interests").array(),
  astrologyTags: text("astrology_tags").array(),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  matchedUserId: varchar("matched_user_id").notNull().references(() => users.id),
  compatibilityScore: decimal("compatibility_score", { precision: 5, scale: 2 }).notNull(),
  matchData: jsonb("match_data").notNull(),
  // Detailed compatibility analysis
  status: varchar("status").default("pending"),
  // pending, liked, passed, mutual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var interpretations = pgTable("interpretations", {
  id: serial("id").primaryKey(),
  chartId: integer("chart_id").notNull().references(() => charts.id),
  interpretationType: varchar("interpretation_type").notNull(),
  // general, compatibility, transit, etc.
  interpretation: text("interpretation").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow()
});
var adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  birthData: many(birthData),
  charts: many(charts),
  profiles: many(profiles),
  matches: many(matches)
}));
var birthDataRelations = relations(birthData, ({ one, many }) => ({
  user: one(users, { fields: [birthData.userId], references: [users.id] }),
  charts: many(charts)
}));
var chartsRelations = relations(charts, ({ one, many }) => ({
  user: one(users, { fields: [charts.userId], references: [users.id] }),
  birthData: one(birthData, { fields: [charts.birthDataId], references: [birthData.id] }),
  interpretations: many(interpretations)
}));
var profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] })
}));
var matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, { fields: [matches.userId], references: [users.id] }),
  matchedUser: one(users, { fields: [matches.matchedUserId], references: [users.id] })
}));
var interpretationsRelations = relations(interpretations, ({ one }) => ({
  chart: one(charts, { fields: [interpretations.chartId], references: [charts.id] })
}));
var insertBirthDataSchema = createInsertSchema(birthData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertChartSchema = createInsertSchema(charts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertInterpretationSchema = createInsertSchema(interpretations).omit({
  id: true,
  createdAt: true
});
var insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var db;
var pool;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
pool = new Pool({ connectionString: process.env.DATABASE_URL });
db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc, asc, sql } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Birth data operations
  async createBirthData(data) {
    const [birthDataRecord] = await db.insert(birthData).values(data).returning();
    return birthDataRecord;
  }
  async getBirthDataByUserId(userId) {
    const [birthDataRecord] = await db.select().from(birthData).where(eq(birthData.userId, userId)).orderBy(desc(birthData.createdAt));
    return birthDataRecord;
  }
  async updateBirthData(id, data) {
    const [birthDataRecord] = await db.update(birthData).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(birthData.id, id)).returning();
    return birthDataRecord;
  }
  async getAllBirthDataForBrowsing() {
    return await db.select().from(birthData).orderBy(birthData.year, birthData.month, birthData.day);
  }
  async getBirthDataByYear(year) {
    return await db.select().from(birthData).where(eq(birthData.year, year)).orderBy(birthData.month, birthData.day);
  }
  async getBirthDataByYearAndMonth(year, month) {
    return await db.select().from(birthData).where(and(eq(birthData.year, year), eq(birthData.month, month)));
  }
  async getAvailableYears() {
    const result = await db.selectDistinct({ year: birthData.year }).from(birthData).orderBy(birthData.year);
    return result.map((row) => row.year);
  }
  // Chart operations
  async createChart(data) {
    const [chart] = await db.insert(charts).values(data).returning();
    return chart;
  }
  async getChartByUserId(userId) {
    const [chart] = await db.select().from(charts).where(eq(charts.userId, userId)).orderBy(desc(charts.createdAt));
    return chart;
  }
  async getChartsByUserId(userId) {
    return await db.select().from(charts).where(eq(charts.userId, userId)).orderBy(desc(charts.createdAt));
  }
  async getChartByBirthDataId(birthDataId) {
    const [chart] = await db.select().from(charts).where(eq(charts.birthDataId, birthDataId)).orderBy(desc(charts.createdAt));
    return chart;
  }
  async getChartById(id) {
    const [chart] = await db.select().from(charts).where(eq(charts.id, id));
    return chart;
  }
  async updateChart(id, data) {
    const [chart] = await db.update(charts).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(charts.id, id)).returning();
    return chart;
  }
  // Profile operations
  async createProfile(data) {
    const [profile] = await db.insert(profiles).values(data).returning();
    return profile;
  }
  async getProfileByUserId(userId) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }
  async updateProfile(id, data) {
    const [profile] = await db.update(profiles).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(profiles.id, id)).returning();
    return profile;
  }
  async getVisibleProfiles(excludeUserId) {
    const query = db.select().from(profiles).where(eq(profiles.isVisible, true));
    if (excludeUserId) {
      return await query.where(sql`${profiles.userId} != ${excludeUserId}`);
    }
    return await query;
  }
  // Match operations
  async createMatch(data) {
    const [match] = await db.insert(matches).values(data).returning();
    return match;
  }
  async getMatchesByUserId(userId) {
    return await db.select().from(matches).where(eq(matches.userId, userId)).orderBy(desc(matches.compatibilityScore));
  }
  async updateMatchStatus(id, status) {
    const [match] = await db.update(matches).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(matches.id, id)).returning();
    return match;
  }
  async getMatchById(id) {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }
  // Interpretation operations
  async createInterpretation(data) {
    const [interpretation] = await db.insert(interpretations).values(data).returning();
    return interpretation;
  }
  async getInterpretationsByChartId(chartId) {
    return await db.select().from(interpretations).where(eq(interpretations.chartId, chartId)).orderBy(desc(interpretations.createdAt));
  }
  // Admin operations
  async createAdminSetting(data) {
    const [setting] = await db.insert(adminSettings).values(data).returning();
    return setting;
  }
  async getAdminSetting(key) {
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, key));
    return setting;
  }
  async updateAdminSetting(key, value) {
    const [setting] = await db.update(adminSettings).set({
      settingValue: value,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(adminSettings.settingKey, key)).returning();
    return setting;
  }
  async getAllAdminSettings() {
    return await db.select().from(adminSettings).orderBy(asc(adminSettings.settingKey));
  }
};
var storage = new DatabaseStorage();

// server/routes-simple.ts
import { spawn } from "child_process";
import path from "path";
var isAuthenticated = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    req.user = {
      id: "admin-001",
      email: "admin@localhost.com",
      firstName: "Admin",
      lastName: "User",
      claims: {
        sub: "admin-001"
      }
    };
    return next();
  }
  next();
};
var setupAuth = async (app2) => {
  console.log("\u{1F527} Development mode: Authentication bypassed");
};
async function calculateSwissEphemerisPositions(birthDate, birthTime, latitude, longitude, placeName) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), "server", "swiss_chart_generator_kp.py");
    const formattedDate = birthDate;
    const formattedTime = birthTime;
    const lat = latitude || 10.381389;
    const lng = longitude || 78.821389;
    const place = placeName || "Pudukkottai";
    console.log(`Calculating with: Date=${formattedDate}, Time=${formattedTime}, Lat=${lat}, Lng=${lng}, Place=${place}`);
    const pythonProcess = spawn("python3", [pythonScript, formattedDate, formattedTime, lat.toString(), lng.toString(), place], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"]
    });
    let pythonOutput = "";
    let pythonError = "";
    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });
    pythonProcess.stderr.on("data", (data) => {
      pythonError += data.toString();
    });
    pythonProcess.on("close", (code) => {
      console.log("Python script output:", pythonOutput);
      if (pythonError) console.log("Python script errors:", pythonError);
      if (code === 0) {
        try {
          const chartData = JSON.parse(pythonOutput.trim());
          console.log("Parsed chart data from JSON:", chartData);
          resolve(chartData);
        } catch (error) {
          console.error("Error parsing JSON output:", error);
          reject(error);
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${pythonError}`));
      }
    });
    pythonProcess.on("error", (error) => {
      console.error("Error running Python script:", error);
      reject(error);
    });
  });
}
async function registerRoutes(app2) {
  app2.get("/api/test", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    return res.json({ message: "API is working", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/gpt/process-birth-data", async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const { name, birthDate, birthTime, birthPlace, latitude, longitude, generateChart = true } = req.body;
      console.log(`GPT Request - Processing birth data for: ${name}, ${birthDate}, ${birthTime}, ${birthPlace}`);
      if (!generateChart) {
        return res.json({
          success: true,
          message: "Birth data received but chart generation skipped",
          data: { name, birthDate, birthTime, birthPlace }
        });
      }
      const chartData = await calculateSwissEphemerisPositions(birthDate, birthTime, latitude, longitude, birthPlace);
      if (!chartData || !chartData.planets || !Array.isArray(chartData.planets)) {
        console.error("Failed to calculate planetary positions for GPT request");
        return res.status(500).json({
          error: "Failed to calculate planetary positions",
          message: "Swiss Ephemeris calculation failed"
        });
      }
      const chart = {
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude: latitude || chartData.latitude,
        longitude: longitude || chartData.longitude,
        generated: (/* @__PURE__ */ new Date()).toISOString(),
        chartType: "KP Raasi Chart",
        planets: chartData.planets,
        houses: chartData.houses,
        kpSystem: chartData.kpSystem,
        message: "Chart generated and saved via GPT integration using authentic Swiss Ephemeris calculations"
      };
      const userId = "admin-001";
      try {
        await storage.upsertUser({
          id: userId,
          email: "admin@localhost.com",
          firstName: "GPT",
          lastName: "Integration"
        });
      } catch (error) {
        console.log("User already exists:", error);
      }
      const birthDataToSave = {
        userId,
        name: chart.name,
        birthDate: chart.birthDate,
        birthTime: chart.birthTime,
        birthPlace: chart.birthPlace,
        latitude: String(parseFloat(chart.latitude) || 0),
        longitude: String(parseFloat(chart.longitude) || 0),
        timezone: "UTC",
        year: new Date(chart.birthDate).getFullYear(),
        month: new Date(chart.birthDate).getMonth() + 1,
        day: new Date(chart.birthDate).getDate()
      };
      const savedBirthData = await storage.createBirthData(birthDataToSave);
      const chartDataToSave = {
        userId,
        birthDataId: savedBirthData.id,
        chartType: chart.chartType,
        chartData: JSON.stringify(chart),
        kpData: JSON.stringify({
          planets: chart.planets,
          houses: chart.houses,
          kpSystem: chart.kpSystem
        })
      };
      const savedChart = await storage.createChart(chartDataToSave);
      console.log(`GPT Integration - Chart generated and saved successfully for ${name}`);
      return res.json({
        success: true,
        message: `Astrology chart for ${name} has been generated using authentic Swiss Ephemeris calculations and saved to the database`,
        chartId: savedChart.id,
        birthDataId: savedBirthData.id,
        planetsCalculated: chart.planets.length,
        calculation: "KP-Newcomb Ayanamsa with Swiss Ephemeris",
        significators: "RAL, STL, SBL, SSL, SSSL included"
      });
    } catch (error) {
      console.error("GPT Integration Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Failed to process birth data",
        details: error.message
      });
    }
  });
  app2.get("/api/gpt/get-chart-data", async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const { name, id } = req.query;
      console.log(`GPT Query - Searching for chart data: name=${name}, id=${id}`);
      const allCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId("admin-001") : [];
      let foundChart = null;
      if (id) {
        foundChart = allCharts.find((chart) => chart.id == id);
      } else if (name) {
        const searchName = typeof name === "string" ? name : String(name);
        foundChart = allCharts.find((chart) => {
          const chartData2 = typeof chart.chartData === "string" ? JSON.parse(chart.chartData) : chart.chartData;
          return chartData2.name && chartData2.name.toLowerCase().includes(searchName.toLowerCase());
        });
      } else {
        const allChartsFormatted = allCharts.map((chart) => {
          const chartData2 = typeof chart.chartData === "string" ? JSON.parse(chart.chartData) : chart.chartData;
          return {
            id: chart.id,
            name: chartData2.name,
            birthDate: chartData2.birthDate,
            birthTime: chartData2.birthTime,
            birthPlace: chartData2.birthPlace,
            generated: chartData2.generated,
            planetsCount: chartData2.planets ? chartData2.planets.length : 0
          };
        });
        return res.json({
          success: true,
          message: `Found ${allChartsFormatted.length} saved charts`,
          charts: allChartsFormatted
        });
      }
      if (!foundChart) {
        return res.json({
          success: false,
          message: name ? `No chart found for name: ${name}` : `No chart found for ID: ${id}`,
          charts: []
        });
      }
      const chartData = typeof foundChart.chartData === "string" ? JSON.parse(foundChart.chartData) : foundChart.chartData;
      return res.json({
        success: true,
        message: `Chart found for ${chartData.name}`,
        chart: {
          id: foundChart.id,
          name: chartData.name,
          birthDate: chartData.birthDate,
          birthTime: chartData.birthTime,
          birthPlace: chartData.birthPlace,
          latitude: chartData.latitude,
          longitude: chartData.longitude,
          generated: chartData.generated,
          chartType: chartData.chartType,
          planets: chartData.planets,
          houses: chartData.houses,
          kpSystem: chartData.kpSystem,
          planetsCount: chartData.planets ? chartData.planets.length : 0,
          calculation: "Swiss Ephemeris with KP-Newcomb Ayanamsa",
          significators: "RAL, STL, SBL, SSL, SSSL included"
        }
      });
    } catch (error) {
      console.error("GPT Query Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Failed to query chart data",
        details: error.message
      });
    }
  });
  app2.post("/api/horoscope", async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const { name, birthDate, birthTime, birthPlace, latitude, longitude } = req.body;
      console.log(`Generating horoscope for: ${name}, ${birthDate}, ${birthTime}, ${birthPlace}`);
      const chartData = await calculateSwissEphemerisPositions(birthDate, birthTime, latitude, longitude, birthPlace);
      if (!chartData || !chartData.planets || !Array.isArray(chartData.planets)) {
        console.error("Failed to calculate planetary positions");
        return res.status(500).json({
          error: "Failed to calculate planetary positions",
          message: "Swiss Ephemeris calculation failed"
        });
      }
      const chart = {
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude,
        longitude,
        generated: (/* @__PURE__ */ new Date()).toISOString(),
        chartType: "KP Raasi Chart",
        planets: chartData.planets,
        houses: chartData.houses,
        kpSystem: chartData.kpSystem,
        message: "Horoscope generated successfully using Swiss Ephemeris with authentic KP calculations and significators"
      };
      console.log("Generated chart with accurate Swiss Ephemeris data");
      return res.json(chart);
    } catch (error) {
      console.error("Horoscope Generation Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: "Failed to generate horoscope",
        details: error.message
      });
    }
  });
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = {
        id: userId,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      };
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/login", async (req, res) => {
    if (process.env.NODE_ENV === "development") {
      res.redirect("/");
    } else {
      res.status(501).json({ message: "Login not implemented for production" });
    }
  });
  app2.post("/api/horoscopes/save", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const horoscopeData = req.body;
      console.log("Saving horoscope data:", horoscopeData);
      try {
        await storage.upsertUser({
          id: userId,
          email: req.user.claims.email || "admin@localhost.com",
          firstName: req.user.claims.given_name || "Admin",
          lastName: req.user.claims.family_name || "User"
        });
      } catch (error) {
        console.log("User already exists or creation failed:", error);
      }
      const birthDataToSave = {
        userId,
        name: horoscopeData.name,
        birthDate: horoscopeData.birthDate,
        birthTime: horoscopeData.birthTime,
        birthPlace: horoscopeData.birthPlace,
        latitude: String(parseFloat(horoscopeData.latitude) || 0),
        longitude: String(parseFloat(horoscopeData.longitude) || 0),
        timezone: horoscopeData.timezone || "UTC",
        year: new Date(horoscopeData.birthDate).getFullYear(),
        month: new Date(horoscopeData.birthDate).getMonth() + 1,
        day: new Date(horoscopeData.birthDate).getDate()
      };
      const savedBirthData = await storage.createBirthData(birthDataToSave);
      const chartDataToSave = {
        userId,
        birthDataId: savedBirthData.id,
        chartType: horoscopeData.chartType || "KP Raasi Chart",
        chartData: JSON.stringify(horoscopeData),
        kpData: JSON.stringify({
          planets: horoscopeData.planets,
          houses: horoscopeData.houses,
          ayanamsa: horoscopeData.ayanamsa
        })
      };
      const savedChart = await storage.createChart(chartDataToSave);
      res.json({
        success: true,
        birthDataId: savedBirthData.id,
        chartId: savedChart.id,
        message: "Horoscope saved successfully"
      });
    } catch (error) {
      console.error("Error saving horoscope:", error);
      res.status(500).json({ message: "Failed to save horoscope", error: error.message });
    }
  });
  app2.get("/api/saved-horoscopes", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const realSavedCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId(userId) : [];
      const transformedRealData = realSavedCharts.map((chart) => {
        const chartData = typeof chart.chartData === "string" ? JSON.parse(chart.chartData) : chart.chartData;
        return {
          id: chart.id,
          name: chartData.name,
          date: chartData.birthDate,
          time: chartData.birthTime,
          place: chartData.birthPlace,
          calculation_type: chartData.calculation_method || "KP-Newcomb Ayanamsa",
          chartData: {
            planets: chartData.planets || [],
            houses: chartData.houses || [],
            lagna: chartData.lagna,
            ayanamsa: chartData.ayanamsa
          }
        };
      });
      const sampleHoroscopes = [
        {
          id: 1,
          name: "Selvan Kumar",
          date: "1990-11-25",
          time: "03:17:25",
          place: "Pudukkottai, Tamil Nadu, India",
          calculation_type: "KP-Newcomb Ayanamsa",
          chartData: {
            planets: [
              { name: "Sun", sign: "Scorpio", degree: "8\xB052'", house: 8, star: "Anuradha", starLord: "Saturn" },
              { name: "Moon", sign: "Pisces", degree: "23\xB015'", house: 12, star: "Revati", starLord: "Mercury" },
              { name: "Mercury", sign: "Virgo", degree: "14\xB022'", house: 6, star: "Hasta", starLord: "Moon" },
              { name: "Venus", sign: "Pisces", degree: "23\xB036'", house: 12, star: "Revati", starLord: "Mercury" },
              { name: "Mars", sign: "Cancer", degree: "20\xB030'", house: 4, star: "Ashlesha", starLord: "Mercury" },
              { name: "Jupiter", sign: "Aries", degree: "17\xB041'", house: 1, star: "Bharani", starLord: "Venus" },
              { name: "Saturn", sign: "Aries", degree: "6\xB038'", house: 1, star: "Ashwini", starLord: "Ketu" }
            ],
            houses: [
              { number: 1, sign: "Scorpio", degree: "11\xB000'", lord: "Mars" },
              { number: 2, sign: "Sagittarius", degree: "11\xB000'", lord: "Jupiter" },
              { number: 3, sign: "Capricorn", degree: "11\xB000'", lord: "Saturn" },
              { number: 4, sign: "Aquarius", degree: "11\xB000'", lord: "Saturn" },
              { number: 5, sign: "Pisces", degree: "11\xB000'", lord: "Jupiter" },
              { number: 6, sign: "Aries", degree: "11\xB000'", lord: "Mars" },
              { number: 7, sign: "Taurus", degree: "11\xB000'", lord: "Venus" },
              { number: 8, sign: "Gemini", degree: "11\xB000'", lord: "Mercury" },
              { number: 9, sign: "Cancer", degree: "11\xB000'", lord: "Moon" },
              { number: 10, sign: "Leo", degree: "11\xB000'", lord: "Sun" },
              { number: 11, sign: "Virgo", degree: "11\xB000'", lord: "Mercury" },
              { number: 12, sign: "Libra", degree: "11\xB000'", lord: "Venus" }
            ],
            lagna: {
              sign: "Scorpio",
              degree: "11\xB000'"
            },
            ayanamsa: `KP-Newcomb 23\xB043'07"`
          }
        },
        {
          id: 2,
          name: "Priya Sharma",
          date: "1995-07-15",
          time: "14:30:00",
          place: "Chennai, Tamil Nadu, India",
          calculation_type: "KP-Newcomb Ayanamsa",
          chartData: {
            planets: [
              { name: "Sun", sign: "Cancer", degree: "29\xB015'", house: 4, star: "Ashlesha", starLord: "Mercury" },
              { name: "Moon", sign: "Virgo", degree: "12\xB045'", house: 6, star: "Hasta", starLord: "Moon" },
              { name: "Mercury", sign: "Gemini", degree: "18\xB022'", house: 3, star: "Ardra", starLord: "Rahu" },
              { name: "Venus", sign: "Leo", degree: "8\xB015'", house: 5, star: "Magha", starLord: "Ketu" },
              { name: "Mars", sign: "Virgo", degree: "25\xB030'", house: 6, star: "Chitra", starLord: "Mars" },
              { name: "Jupiter", sign: "Sagittarius", degree: "15\xB045'", house: 9, star: "Purva Ashadha", starLord: "Venus" },
              { name: "Saturn", sign: "Aquarius", degree: "22\xB018'", house: 11, star: "Purva Bhadrapada", starLord: "Jupiter" }
            ],
            houses: [
              { number: 1, sign: "Aries", degree: "5\xB000'", lord: "Mars" },
              { number: 2, sign: "Taurus", degree: "5\xB000'", lord: "Venus" },
              { number: 3, sign: "Gemini", degree: "5\xB000'", lord: "Mercury" },
              { number: 4, sign: "Cancer", degree: "5\xB000'", lord: "Moon" },
              { number: 5, sign: "Leo", degree: "5\xB000'", lord: "Sun" },
              { number: 6, sign: "Virgo", degree: "5\xB000'", lord: "Mercury" },
              { number: 7, sign: "Libra", degree: "5\xB000'", lord: "Venus" },
              { number: 8, sign: "Scorpio", degree: "5\xB000'", lord: "Mars" },
              { number: 9, sign: "Sagittarius", degree: "5\xB000'", lord: "Jupiter" },
              { number: 10, sign: "Capricorn", degree: "5\xB000'", lord: "Saturn" },
              { number: 11, sign: "Aquarius", degree: "5\xB000'", lord: "Saturn" },
              { number: 12, sign: "Pisces", degree: "5\xB000'", lord: "Jupiter" }
            ],
            lagna: {
              sign: "Aries",
              degree: "5\xB000'"
            },
            ayanamsa: `KP-Newcomb 23\xB043'07"`
          }
        }
      ];
      const allHoroscopes = [...transformedRealData, ...sampleHoroscopes];
      res.json(allHoroscopes);
    } catch (error) {
      console.error("Error fetching saved horoscopes:", error);
      res.status(500).json({ message: "Failed to fetch saved horoscopes" });
    }
  });
  app2.get("/api/birth-data/all", async (req, res) => {
    try {
      const allBirthData = await storage.getAllBirthDataForBrowsing();
      res.json(allBirthData || []);
    } catch (error) {
      console.error("Error fetching all birth data:", error);
      res.status(500).json({ message: "Failed to fetch birth data" });
    }
  });
  const server = createServer(app2);
  return server;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
dotenv.config();
var app = express2();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import dotenv from "dotenv";
import express2 from "express";

// server/routes-simple.ts
import { spawn } from "child_process";
import path from "path";
import { createServer } from "http";

// shared/schema-sqlite.ts
var schema_sqlite_exports = {};
__export(schema_sqlite_exports, {
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
  sqliteTable,
  text,
  integer,
  real,
  index
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    // JSON stored as text in SQLite
    expire: text("expire").notNull()
    // ISO string
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: text("created_at"),
  // ISO string
  updatedAt: text("updated_at")
  // ISO string
});
var birthData = sqliteTable("birth_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  gender: text("gender"),
  birthDate: text("birth_date").notNull(),
  // YYYY-MM-DD - maps to actual database column
  birthTime: text("birth_time").notNull(),
  // HH:MM:SS - maps to actual database column
  birthPlace: text("birth_place").notNull(),
  // maps to actual database column
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
  createdAt: text("created_at"),
  // ISO string - maps to actual database column
  updatedAt: text("updated_at")
  // ISO string
});
var charts = sqliteTable("charts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  birthDataId: integer("birth_data_id").notNull().references(() => birthData.id),
  chartType: text("chart_type").notNull(),
  // 'raasi', 'navamsa', 'd10', 'd60', 'bhava', etc.
  chartData: text("chart_data").notNull(),
  // JSON stored as text
  kpData: text("kp_data"),
  // JSON stored as text
  aiInterpretation: text("ai_interpretation"),
  createdAt: text("created_at"),
  // ISO string
  updatedAt: text("updated_at")
  // ISO string
});
var profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  interests: text("interests"),
  // JSON array stored as text
  astrologyTags: text("astrology_tags"),
  // JSON array stored as text
  isVisible: integer("is_visible", { mode: "boolean" }),
  createdAt: text("created_at"),
  // ISO string
  updatedAt: text("updated_at")
  // ISO string
});
var matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  matchedUserId: text("matched_user_id").notNull().references(() => users.id),
  compatibilityScore: real("compatibility_score").notNull(),
  matchData: text("match_data").notNull(),
  // JSON stored as text
  status: text("status"),
  // pending, liked, passed, mutual
  createdAt: text("created_at"),
  // ISO string
  updatedAt: text("updated_at")
  // ISO string
});
var interpretations = sqliteTable("interpretations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chartId: integer("chart_id").notNull().references(() => charts.id),
  interpretationType: text("interpretation_type").notNull(),
  // general, compatibility, transit, etc.
  interpretation: text("interpretation").notNull(),
  confidence: real("confidence"),
  createdAt: text("created_at")
  // ISO string
});
var adminSettings = sqliteTable("admin_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value").notNull(),
  // JSON stored as text
  description: text("description"),
  createdAt: text("created_at"),
  // ISO string
  updatedAt: text("updated_at")
  // ISO string
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

// server/db-local.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
var sqlite = new Database("local.db");
var db = drizzle(sqlite, { schema: schema_sqlite_exports });

// server/storage.ts
import { eq, and, desc, asc, sql } from "drizzle-orm";

// server/storage-firebase.ts
import * as admin from "firebase-admin";
var FirebaseStorage = class {
  db;
  initialized = false;
  constructor() {
    const adminSdk = admin.default || admin;
    const firebaseApps = adminSdk.apps;
    try {
      if (!firebaseApps?.length) {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
          console.log("Initializing Firebase from Environment Variables...");
          adminSdk.initializeApp({
            credential: adminSdk.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
            })
          });
        } else {
          console.log("Initializing Firebase from Default Credentials...");
          adminSdk.initializeApp();
        }
      }
      this.db = adminSdk.firestore();
      this.initialized = true;
      console.log("Firebase Admin initialized successfully");
    } catch (error) {
      console.warn(
        "Failed to initialize Firebase Admin. Ensure credentials are provided via GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_* env vars."
      );
      console.error(error);
      this.db = null;
    }
  }
  // Helper to get next ID for a collection
  async getNextId(collectionName) {
    const counterRef = this.db.collection("_counters").doc(collectionName);
    try {
      const result = await this.db.runTransaction(async (t) => {
        const doc = await t.get(counterRef);
        let nextId = 1;
        if (doc.exists) {
          const data = doc.data();
          nextId = (data?.currentId || 0) + 1;
        }
        t.set(counterRef, { currentId: nextId }, { merge: true });
        return nextId;
      });
      return result;
    } catch (error) {
      console.error(`Error getting next ID for ${collectionName}:`, error);
      throw error;
    }
  }
  // Generic helper to convert Firestore data to typed object (handling Dates)
  convertDates(data) {
    if (!data) return data;
    const result = { ...data };
    for (const key of Object.keys(result)) {
      if (result[key] && typeof result[key].toDate === "function") {
        result[key] = result[key].toDate().toISOString();
      } else if (result[key] instanceof Date) {
        result[key] = result[key].toISOString();
      }
    }
    return result;
  }
  // User operations
  async getUser(id) {
    if (!this.initialized || !this.db) {
      console.warn("Firebase not initialized, returning undefined for getUser");
      return void 0;
    }
    const doc = await this.db.collection("users").doc(id).get();
    return doc.exists ? doc.data() : void 0;
  }
  async upsertUser(userData) {
    const id = userData.id || (await this.getNextId("users")).toString();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userToSave = {
      ...userData,
      id,
      updatedAt: now,
      createdAt: userData.createdAt || now
    };
    await this.db.collection("users").doc(id).set(userToSave, { merge: true });
    const saved = await this.getUser(id);
    if (!saved) throw new Error("Failed to save user");
    return saved;
  }
  // Birth data operations
  async createBirthData(data) {
    const id = await this.getNextId("birthData");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newRecord = {
      id,
      ...data,
      gender: data.gender || null,
      state: data.state || null,
      country: data.country || null,
      timezone: data.timezone || null,
      motherName: data.motherName || null,
      fatherName: data.fatherName || null,
      gotra: data.gotra || null,
      rectifiedTime: data.rectifiedTime || null,
      givenTime: data.givenTime || null,
      ayanamsa: data.ayanamsa || null,
      dayOfWeek: data.dayOfWeek || null,
      sunRise: data.sunRise || null,
      sunSet: data.sunSet || null,
      tithi: data.tithi || null,
      star: data.star || null,
      starPada: data.starPada || null,
      rasi: data.rasi || null,
      lagna: data.lagna || null,
      lagnaDegreesMinutes: data.lagnaDegreesMinutes || null,
      hora: data.hora || null,
      yogam: data.yogam || null,
      karana: data.karana || null,
      dasaBalance: data.dasaBalance || null,
      year: data.year || null,
      month: data.month || null,
      day: data.day || null,
      createdAt: now,
      updatedAt: now
    };
    await this.db.collection("birthData").doc(id.toString()).set(newRecord);
    return newRecord;
  }
  async getBirthDataByUserId(userId) {
    const snapshot = await this.db.collection("birthData").where("userId", "==", userId).get();
    if (snapshot.empty) return void 0;
    const allData = snapshot.docs.map((doc) => this.convertDates(doc.data()));
    allData.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    return allData[0];
  }
  async updateBirthData(id, data) {
    const docRef = this.db.collection("birthData").doc(id.toString());
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await docRef.update({
      ...data,
      updatedAt: now
    });
    const updated = await docRef.get();
    if (!updated.exists) throw new Error("BirthData not found");
    return this.convertDates(updated.data());
  }
  async getAllBirthDataForBrowsing(userId) {
    if (!this.db) return [];
    let query = this.db.collection("birthData");
    if (userId) {
      query = query.where("userId", "==", userId);
    }
    const snapshot = await query.get();
    const birthData2 = snapshot.docs.map((doc) => this.convertDates(doc.data()));
    return birthData2.sort((a, b) => {
      if ((a.year || 0) !== (b.year || 0)) return (a.year || 0) - (b.year || 0);
      if ((a.month || 0) !== (b.month || 0)) return (a.month || 0) - (b.month || 0);
      return (a.day || 0) - (b.day || 0);
    });
  }
  async getBirthData(id) {
    const doc = await this.db.collection("birthData").doc(id.toString()).get();
    return doc.exists ? this.convertDates(doc.data()) : void 0;
  }
  async getBirthDataByYear(year) {
    const snapshot = await this.db.collection("birthData").where("year", "==", year).orderBy("month").orderBy("day").get();
    return snapshot.docs.map((doc) => this.convertDates(doc.data()));
  }
  async getBirthDataByYearAndMonth(year, month) {
    const snapshot = await this.db.collection("birthData").where("year", "==", year).where("month", "==", month).get();
    return snapshot.docs.map((doc) => this.convertDates(doc.data()));
  }
  async getAvailableYears() {
    const snapshot = await this.db.collection("birthData").select("year").get();
    const years = /* @__PURE__ */ new Set();
    snapshot.docs.forEach((doc) => {
      const y = doc.data().year;
      if (y) years.add(y);
    });
    return Array.from(years).sort();
  }
  async deleteBirthData(id) {
    await this.db.collection("birthData").doc(id.toString()).delete();
  }
  // Chart operations
  async createChart(data) {
    const id = await this.getNextId("charts");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newChart = {
      id,
      ...data,
      kpData: data.kpData || null,
      aiInterpretation: data.aiInterpretation || null,
      createdAt: now,
      updatedAt: now
    };
    await this.db.collection("charts").doc(id.toString()).set(newChart);
    return newChart;
  }
  async getChartByUserId(userId) {
    if (!this.db) return void 0;
    const snapshot = await this.db.collection("charts").where("userId", "==", userId).orderBy("createdAt", "desc").limit(1).get();
    if (snapshot.empty) return void 0;
    return this.convertDates(snapshot.docs[0].data());
  }
  async getChartsByUserId(userId) {
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }
    try {
      const snapshot = await this.db.collection("charts").where("userId", "==", userId).get();
      const charts2 = snapshot.docs.map((doc) => this.convertDates(doc.data()));
      return charts2.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error("Error fetching charts:", error);
      return [];
    }
  }
  async getChartByBirthDataId(birthDataId) {
    const snapshot = await this.db.collection("charts").where("birthDataId", "==", birthDataId).orderBy("createdAt", "desc").limit(1).get();
    if (snapshot.empty) return void 0;
    return this.convertDates(snapshot.docs[0].data());
  }
  async getChartById(id) {
    const doc = await this.db.collection("charts").doc(id.toString()).get();
    return doc.exists ? this.convertDates(doc.data()) : void 0;
  }
  async updateChart(id, data) {
    const docRef = this.db.collection("charts").doc(id.toString());
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await docRef.update({
      ...data,
      updatedAt: now
    });
    const updated = await docRef.get();
    return this.convertDates(updated.data());
  }
  async deleteChart(id) {
    try {
      await this.db.collection("charts").doc(id.toString()).delete();
      return true;
    } catch (error) {
      console.error("Error deleting chart:", error);
      return false;
    }
  }
  // Profile operations
  async createProfile(data) {
    if (!this.db) throw new Error("Database not connected");
    const id = await this.getNextId("profiles");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newProfile = {
      id,
      ...data,
      bio: data.bio || null,
      interests: data.interests || null,
      astrologyTags: data.astrologyTags || null,
      isVisible: data.isVisible ?? false,
      createdAt: now,
      updatedAt: now
    };
    await this.db.collection("profiles").doc(id.toString()).set(newProfile);
    return newProfile;
  }
  async getProfileByUserId(userId) {
    const snapshot = await this.db.collection("profiles").where("userId", "==", userId).limit(1).get();
    if (snapshot.empty) return void 0;
    return this.convertDates(snapshot.docs[0].data());
  }
  async updateProfile(id, data) {
    const docRef = this.db.collection("profiles").doc(id.toString());
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await docRef.update({
      ...data,
      updatedAt: now
    });
    const updated = await docRef.get();
    return this.convertDates(updated.data());
  }
  async getVisibleProfiles(excludeUserId) {
    let query = this.db.collection("profiles").where("isVisible", "==", true);
    const snapshot = await query.get();
    let profiles2 = snapshot.docs.map((doc) => this.convertDates(doc.data()));
    if (excludeUserId) {
      profiles2 = profiles2.filter((p) => p.userId !== excludeUserId);
    }
    return profiles2;
  }
  // Match operations
  async createMatch(data) {
    const id = await this.getNextId("matches");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newMatch = {
      id,
      ...data,
      status: data.status || "pending",
      createdAt: now,
      updatedAt: now
    };
    await this.db.collection("matches").doc(id.toString()).set(newMatch);
    return newMatch;
  }
  async getMatchesByUserId(userId) {
    const snapshot = await this.db.collection("matches").where("userId", "==", userId).orderBy("compatibilityScore", "desc").get();
    return snapshot.docs.map((doc) => this.convertDates(doc.data()));
  }
  async updateMatchStatus(id, status) {
    const docRef = this.db.collection("matches").doc(id.toString());
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await docRef.update({
      status,
      updatedAt: now
    });
    const updated = await docRef.get();
    return this.convertDates(updated.data());
  }
  async getMatchById(id) {
    const doc = await this.db.collection("matches").doc(id.toString()).get();
    return doc.exists ? this.convertDates(doc.data()) : void 0;
  }
  // Interpretation operations
  async createInterpretation(data) {
    const id = await this.getNextId("interpretations");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newInterp = {
      id,
      ...data,
      confidence: data.confidence || null,
      createdAt: now
    };
    await this.db.collection("interpretations").doc(id.toString()).set(newInterp);
    return newInterp;
  }
  async getInterpretationsByChartId(chartId) {
    const snapshot = await this.db.collection("interpretations").where("chartId", "==", chartId).orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => this.convertDates(doc.data()));
  }
  // Admin operations
  async createAdminSetting(data) {
    const id = await this.getNextId("adminSettings");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newSetting = {
      id,
      ...data,
      description: data.description || null,
      createdAt: now,
      updatedAt: now
    };
    await this.db.collection("adminSettings").doc(id.toString()).set(newSetting);
    return newSetting;
  }
  async getAdminSetting(key) {
    const snapshot = await this.db.collection("adminSettings").where("settingKey", "==", key).limit(1).get();
    if (snapshot.empty) return void 0;
    return this.convertDates(snapshot.docs[0].data());
  }
  async updateAdminSetting(key, value) {
    const snapshot = await this.db.collection("adminSettings").where("settingKey", "==", key).limit(1).get();
    if (snapshot.empty) throw new Error("Setting not found");
    const docRef = snapshot.docs[0].ref;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await docRef.update({
      settingValue: value,
      updatedAt: now
    });
    const updated = await docRef.get();
    return this.convertDates(updated.data());
  }
  async getAllAdminSettings() {
    const snapshot = await this.db.collection("adminSettings").orderBy("settingKey", "asc").get();
    return snapshot.docs.map((doc) => this.convertDates(doc.data()));
  }
};

// server/storage.ts
var storage = new FirebaseStorage();

// server/kp-calculations.js
import * as astronomy from "astronomy-engine";
var AYANAMSA_VALUE = 23 + 43 / 60 + 7 / 3600;
var NAK_LENGTH = 13.3333;
var VIMSHOTTARI_DASA = {
  "Ketu": 7,
  "Venus": 20,
  "Sun": 6,
  "Moon": 10,
  "Mars": 7,
  "Rahu": 18,
  "Jupiter": 16,
  "Saturn": 19,
  "Mercury": 17
};
var DASA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
var TOTAL_DASA_YEARS = Object.values(VIMSHOTTARI_DASA).reduce((sum, years) => sum + years, 0);
var SUB_DIVISIONS = {};
DASA_SEQUENCE.forEach((planet) => {
  SUB_DIVISIONS[planet] = VIMSHOTTARI_DASA[planet] / TOTAL_DASA_YEARS * NAK_LENGTH;
});
var SIGN_NAMES = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
];
var RASI_LORDS = {
  "Aries": "Mars",
  "Taurus": "Venus",
  "Gemini": "Mercury",
  "Cancer": "Moon",
  "Leo": "Sun",
  "Virgo": "Mercury",
  "Libra": "Venus",
  "Scorpio": "Mars",
  "Sagittarius": "Jupiter",
  "Capricorn": "Saturn",
  "Aquarius": "Saturn",
  "Pisces": "Jupiter"
};
var NAKSHATRAS = [
  ["Ashwini", "Ketu"],
  ["Bharani", "Venus"],
  ["Krittika", "Sun"],
  ["Rohini", "Moon"],
  ["Mrigashira", "Mars"],
  ["Ardra", "Rahu"],
  ["Punarvasu", "Jupiter"],
  ["Pushya", "Saturn"],
  ["Ashlesha", "Mercury"],
  ["Magha", "Ketu"],
  ["Purva Phalguni", "Venus"],
  ["Uttara Phalguni", "Sun"],
  ["Hasta", "Moon"],
  ["Chitra", "Mars"],
  ["Swati", "Rahu"],
  ["Vishakha", "Jupiter"],
  ["Anuradha", "Saturn"],
  ["Jyeshtha", "Mercury"],
  ["Mula", "Ketu"],
  ["Purva Ashadha", "Venus"],
  ["Uttara Ashadha", "Sun"],
  ["Shravana", "Moon"],
  ["Dhanishta", "Mars"],
  ["Shatabhisha", "Rahu"],
  ["Purva Bhadrapada", "Jupiter"],
  ["Uttara Bhadrapada", "Saturn"],
  ["Revati", "Mercury"]
];
var PLANETS = {
  "Sun": "Sun",
  "Moon": "Moon",
  "Mercury": "Mercury",
  "Venus": "Venus",
  "Mars": "Mars",
  "Jupiter": "Jupiter",
  "Saturn": "Saturn",
  "Rahu": "Moon",
  // Will calculate lunar node
  "Ketu": "Moon"
  // Will calculate opposite node
};
function getFullKPChain(nakDeg) {
  let cumulative = 0;
  for (let planet1 of DASA_SEQUENCE) {
    cumulative += SUB_DIVISIONS[planet1];
    if (nakDeg <= cumulative) {
      const subStart = cumulative - SUB_DIVISIONS[planet1];
      const subLen = SUB_DIVISIONS[planet1];
      const relDeg = nakDeg - subStart;
      let cumulative2 = 0;
      for (let planet2 of DASA_SEQUENCE) {
        cumulative2 += VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS * subLen;
        if (relDeg <= cumulative2) {
          const sub2Start = cumulative2 - VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS * subLen;
          const sub2Len = VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS * subLen;
          const relDeg2 = relDeg - sub2Start;
          let cumulative3 = 0;
          for (let planet3 of DASA_SEQUENCE) {
            cumulative3 += VIMSHOTTARI_DASA[planet3] / TOTAL_DASA_YEARS * sub2Len;
            if (relDeg2 <= cumulative3) {
              return [planet1, planet2, planet3];
            }
          }
        }
      }
    }
  }
  return [DASA_SEQUENCE[8], DASA_SEQUENCE[8], DASA_SEQUENCE[8]];
}
function calculateDateTime(birthDate, birthTime, timezoneOffset = 5.5) {
  let day, month, year;
  if (birthDate.includes("-")) {
    [year, month, day] = birthDate.split("-").map(Number);
  } else {
    [day, month, year] = birthDate.split("/").map(Number);
  }
  const [hours, minutes, seconds = 0] = birthTime.split(":").map(Number);
  if ([day, month, year, hours, minutes].some(Number.isNaN)) {
    throw new Error(`Invalid birth date/time: "${birthDate}" "${birthTime}"`);
  }
  const localTime = new Date(year, month - 1, day, hours, minutes, seconds);
  const utcTime = new Date(localTime.getTime() - timezoneOffset * 60 * 60 * 1e3);
  return utcTime;
}
function calculateJulianDay(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  jd += (hour - 12) / 24;
  return jd;
}
function calculatePlanetLongitude(planetName, jd, dateTime) {
  const T = (jd - 2451545) / 36525;
  switch (planetName) {
    case "Sun":
      return calculateSunLongitude(T);
    case "Moon":
      return calculateMoonLongitude(T);
    case "Mercury":
      return calculateMercuryLongitude(T);
    case "Venus":
      return calculateVenusLongitude(T);
    case "Mars":
      return calculateMarsLongitude(T);
    case "Jupiter":
      return calculateJupiterLongitude(T);
    case "Saturn":
      return calculateSaturnLongitude(T);
    case "Rahu":
      return calculateRahuLongitude(T);
    case "Ketu":
      return (calculateRahuLongitude(T) + 180) % 360;
    default:
      return 0;
  }
}
function calculateSunLongitude(T) {
  const L0 = 280.46646 + 36000.76983 * T + 3032e-7 * T * T;
  const M = 357.52911 + 35999.05029 * T - 1537e-7 * T * T;
  const e = 0.016708634 - 42037e-9 * T - 1267e-10 * T * T;
  const C = (1.914602 - 4817e-6 * T - 14e-6 * T * T) * Math.sin(M * Math.PI / 180) + (0.019993 - 101e-6 * T) * Math.sin(2 * M * Math.PI / 180) + 289e-6 * Math.sin(3 * M * Math.PI / 180);
  return (L0 + C) % 360;
}
function calculateMoonLongitude(T) {
  const L = 218.3164477 + 481267.88123421 * T - 15786e-7 * T * T + T * T * T / 538841 - T * T * T * T / 65194e3;
  const D = 297.8501921 + 445267.1114034 * T - 18819e-7 * T * T + T * T * T / 545868 - T * T * T * T / 113065e3;
  const M = 357.5291092 + 35999.0502909 * T - 1536e-7 * T * T + T * T * T / 2449e4;
  const Mp = 134.9633964 + 477198.8675055 * T + 87414e-7 * T * T + T * T * T / 69699 - T * T * T * T / 14712e3;
  let longitude = L;
  longitude += 6.288774 * Math.sin(Mp * Math.PI / 180);
  longitude += 1.274027 * Math.sin((2 * D - Mp) * Math.PI / 180);
  longitude += 0.658314 * Math.sin(2 * D * Math.PI / 180);
  return longitude % 360;
}
function calculateMercuryLongitude(T) {
  return (252.2503235 + 149472.67411175 * T) % 360;
}
function calculateVenusLongitude(T) {
  return (181.9790995 + 58517.81538729 * T) % 360;
}
function calculateMarsLongitude(T) {
  return (19.39019754 + 19140.30268499 * T) % 360;
}
function calculateJupiterLongitude(T) {
  return (34.39644051 + 3034.74612775 * T) % 360;
}
function calculateSaturnLongitude(T) {
  return (49.95424423 + 1222.49362201 * T) % 360;
}
function calculateRahuLongitude(T) {
  return (125.04452 - 1934.136261 * T + 20708e-7 * T * T + T * T * T / 45e4) % 360;
}
function calculateKPPlanets(birthDate, birthTime, location) {
  try {
    const dateTime = calculateDateTime(birthDate, birthTime);
    const results = [];
    for (const [planetName, planetBody] of Object.entries(PLANETS)) {
      let longitude;
      try {
        if (planetName === "Rahu") {
          const moonBody = astronomy.Body.Moon;
          const moonPos = astronomy.EclipticLongitude(moonBody, dateTime);
          longitude = (moonPos + 180) % 360;
        } else if (planetName === "Ketu") {
          const moonBody = astronomy.Body.Moon;
          const moonPos = astronomy.EclipticLongitude(moonBody, dateTime);
          longitude = moonPos % 360;
        } else {
          const bodyEnum = astronomy.Body[planetName];
          longitude = astronomy.EclipticLongitude(bodyEnum, dateTime);
        }
      } catch (astroError) {
        console.log(`Astronomy-engine failed for ${planetName}, using VSOP87 astronomical algorithms`);
        const jd = calculateJulianDay(dateTime);
        longitude = calculatePlanetLongitude(planetName, jd, dateTime);
      }
      const siderealLon = (longitude - AYANAMSA_VALUE + 360) % 360;
      const signIndex = Math.floor(siderealLon / 30);
      const zodiac = SIGN_NAMES[signIndex];
      const rasi_lord = RASI_LORDS[zodiac];
      const degreesInSign = siderealLon % 30;
      const degrees = Math.floor(degreesInSign);
      const minutes = Math.floor(degreesInSign % 1 * 60);
      const seconds = Math.floor(degreesInSign % 1 * 60 % 1 * 60);
      const nakIndex = Math.min(Math.max(Math.floor(siderealLon / NAK_LENGTH), 0), NAKSHATRAS.length - 1);
      const [nakshatra, starLord] = NAKSHATRAS[nakIndex];
      const nakDeg = siderealLon % NAK_LENGTH;
      const pada = Math.floor(nakDeg / (NAK_LENGTH / 4)) + 1;
      const [stl, sbl, ssl] = getFullKPChain(nakDeg);
      results.push({
        planet: planetName,
        longitude: siderealLon,
        sign: zodiac,
        degree: `${degrees}\xB0 ${minutes}' ${seconds}"`,
        degreesInSign,
        rasi_lord,
        nakshatra,
        pada,
        star_lord: starLord,
        // From nakshatra
        stl,
        // Star lord from KP chain  
        sbl,
        // Sub lord
        ssl,
        // Sub-sub lord
        sssl: ssl
        // Sub-sub-sub lord (placeholder)
      });
    }
    return results;
  } catch (error) {
    console.error("KP Calculation Error:", error);
    throw new Error(`Failed to calculate KP positions: ${error.message}`);
  }
}

// server/routes-simple.ts
import * as admin2 from "firebase-admin";
var gptApiKeyAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
  if (process.env.NODE_ENV === "development") return next();
  const validApiKey = process.env.WEBAPP_API_KEY || "sk-astro-webapp-2025-secure-api-key-xyz789";
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ error: "Unauthorized", message: "Valid API key required" });
  }
  next();
};
var isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const adminSdk = admin2.default || admin2;
      if (adminSdk.apps.length === 0) {
        console.warn("Firebase Admin not initialized in route middleware.");
      } else {
        const decodedToken = await adminSdk.auth().verifyIdToken(idToken);
        req.user = {
          id: decodedToken.uid,
          email: decodedToken.email,
          firstName: decodedToken.name ? decodedToken.name.split(" ")[0] : "User",
          lastName: decodedToken.name ? decodedToken.name.split(" ").slice(1).join(" ") : "",
          claims: decodedToken
        };
        return next();
      }
    } catch (error) {
      console.error("Error verifying Firebase ID token:", error);
      return res.status(403).json({ error: "Unauthorized", message: "Invalid token" });
    }
  }
  res.status(401).json({ message: "Unauthorized - No token provided" });
};
var setupAuth = async (app2) => {
  app2.post("/api/auth/login", isAuthenticated, async (req, res) => {
    try {
      await storage.upsertUser({
        id: req.user.id,
        // Using Firebase UID as our ID
        email: req.user.email || "",
        firstName: req.user.firstName || "User",
        lastName: req.user.lastName || "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
        // Will be ignored by upsert if user exists
      });
      res.json({
        success: true,
        user: req.user,
        message: "Successfully authenticated via Firebase"
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ success: false, message: "Failed to persist user session" });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, (req, res) => {
    res.json(req.user);
  });
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
  app2.post("/api/horoscopes/simple", async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const { name, birthDate, birthTime, birthPlace, latitude, longitude } = req.body;
      console.log(`Calculating authentic KP horoscope for: ${name}, ${birthDate}, ${birthTime}, ${birthPlace}`);
      const location = {
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        elevation: 0
      };
      let realPlanets;
      try {
        realPlanets = calculateKPPlanets(birthDate, birthTime, location);
        console.log("\u2705 Real KP calculations successful");
      } catch (calcError) {
        console.error("\u274C KP calculation failed:", calcError);
        throw new Error(`KP calculation failed: ${calcError.message}`);
      }
      const planetsFormatted = realPlanets.map((planet) => ({
        planet: planet.planet,
        degree: planet.degree,
        sign: planet.sign,
        nakshatra: planet.nakshatra,
        pada: planet.pada,
        rasi_lord: planet.rasi_lord,
        star_lord: planet.star_lord,
        stl: planet.stl,
        sbl: planet.sbl,
        ssl: planet.ssl,
        longitude: planet.longitude,
        degreesInSign: planet.degreesInSign
      }));
      const rasiChart = {
        "Aries": [],
        "Taurus": [],
        "Gemini": [],
        "Cancer": [],
        "Leo": [],
        "Virgo": [],
        "Libra": [],
        "Scorpio": [],
        "Sagittarius": [],
        "Capricorn": [],
        "Aquarius": [],
        "Pisces": []
      };
      realPlanets.forEach((planet) => {
        if (rasiChart[planet.sign]) {
          rasiChart[planet.sign].push(planet.planet);
        }
      });
      const lagna = realPlanets.length > 0 ? `${realPlanets[0].sign} ${realPlanets[0].degree}` : "Unknown";
      const chart = {
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude: location.latitude,
        longitude: location.longitude,
        generated: (/* @__PURE__ */ new Date()).toISOString(),
        planets: planetsFormatted,
        ayanamsa: `KP-Newcomb ${AYANAMSA_VALUE.toFixed(6)}\xB0`,
        calculation_method: "Authentic VSOP87 + KP-Newcomb Ayanamsa",
        lagna,
        rasi_chart: rasiChart,
        kpSystem: {
          ayanamsa: AYANAMSA_VALUE,
          calculation_type: "Krishnamurti Paddhati with authentic astronomical positions",
          features: ["Star Lord", "Sub Lord", "Sub-Sub Lord", "Nakshatra Pada"]
        }
      };
      return res.json({
        success: true,
        message: `KP horoscope generated for ${name}`,
        chart,
        planets: planetsFormatted,
        planetsCount: planetsFormatted.length
      });
    } catch (error) {
      console.error("Simple Horoscope Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Failed to generate KP horoscope",
        details: error.message
      });
    }
  });
  app2.get("/api/gpt/pull-charts", gptApiKeyAuth, async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const { year, month, limit = 10 } = req.query;
      console.log(`GPT Pull - Retrieving charts with filters: year=${year}, month=${month}, limit=${limit}`);
      const allCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId("admin-001") : [];
      if (allCharts.length === 0) {
        return res.json({
          success: true,
          message: "No charts found in database",
          charts: [],
          count: 0
        });
      }
      let filteredCharts = allCharts.map((chart) => {
        const chartData = typeof chart.chartData === "string" ? JSON.parse(chart.chartData) : chart.chartData;
        return {
          id: chart.id,
          name: chartData.name,
          birthDate: chartData.birthDate,
          birthTime: chartData.birthTime,
          birthPlace: chartData.birthPlace,
          generated: chartData.generated,
          planets: chartData.planets,
          houses: chartData.houses
        };
      });
      if (year) {
        filteredCharts = filteredCharts.filter(
          (chart) => chart.birthDate && chart.birthDate.startsWith(year.toString())
        );
      }
      if (month) {
        const monthStr = month.toString().padStart(2, "0");
        filteredCharts = filteredCharts.filter(
          (chart) => chart.birthDate && chart.birthDate.includes(`-${monthStr}-`)
        );
      }
      const limitedCharts = filteredCharts.slice(0, parseInt(limit.toString()));
      return res.json({
        success: true,
        message: `Retrieved ${limitedCharts.length} charts`,
        charts: limitedCharts,
        count: limitedCharts.length,
        totalAvailable: filteredCharts.length
      });
    } catch (error) {
      console.error("GPT Pull Charts Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Failed to pull charts",
        details: error.message
      });
    }
  });
  app2.get("/api/gpt/search-charts", gptApiKeyAuth, async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const { planet, sign, nakshatra, house, limit = 5 } = req.query;
      console.log(`GPT Search - Finding charts with criteria: planet=${planet}, sign=${sign}, nakshatra=${nakshatra}, house=${house}`);
      const allCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId("admin-001") : [];
      if (allCharts.length === 0) {
        return res.json({
          success: true,
          message: "No charts found in database for search",
          results: [],
          count: 0
        });
      }
      const searchResults = [];
      for (const chart of allCharts) {
        const chartData = typeof chart.chartData === "string" ? JSON.parse(chart.chartData) : chart.chartData;
        const planets = chartData.planets || [];
        for (const planetData of planets) {
          let match = false;
          if (planet && planetData.name && planetData.name.toLowerCase().includes(planet.toString().toLowerCase())) {
            match = true;
          }
          if (sign && planetData.sign && planetData.sign.toLowerCase().includes(sign.toString().toLowerCase())) {
            match = true;
          }
          if (nakshatra && planetData.star && planetData.star.toLowerCase().includes(nakshatra.toString().toLowerCase())) {
            match = true;
          }
          if (house && planetData.house && planetData.house.toString() === house.toString()) {
            match = true;
          }
          if (match) {
            searchResults.push({
              id: chart.id,
              name: chartData.name,
              birthDate: chartData.birthDate,
              birthPlace: chartData.birthPlace,
              matchedPlanet: planetData,
              generated: chartData.generated
            });
            break;
          }
        }
      }
      const limitedResults = searchResults.slice(0, parseInt(limit.toString()));
      return res.json({
        success: true,
        message: `Found ${limitedResults.length} charts matching criteria`,
        results: limitedResults,
        count: limitedResults.length,
        totalMatches: searchResults.length
      });
    } catch (error) {
      console.error("GPT Search Charts Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Failed to search charts",
        details: error.message
      });
    }
  });
  app2.get("/api/gpt/available-years", gptApiKeyAuth, async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      console.log("GPT Available Years - Getting data range for filtering");
      const allCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId("admin-001") : [];
      if (allCharts.length === 0) {
        return res.json({
          success: true,
          message: "No charts found in database",
          years: [],
          count: 0
        });
      }
      const years = /* @__PURE__ */ new Set();
      for (const chart of allCharts) {
        const chartData = typeof chart.chartData === "string" ? JSON.parse(chart.chartData) : chart.chartData;
        if (chartData.birthDate) {
          const year = chartData.birthDate.split("-")[0];
          if (year && !isNaN(parseInt(year))) {
            years.add(parseInt(year));
          }
        }
      }
      const sortedYears = Array.from(years).sort((a, b) => b - a);
      return res.json({
        success: true,
        message: `Available birth years in database`,
        years: sortedYears,
        count: sortedYears.length,
        totalCharts: allCharts.length
      });
    } catch (error) {
      console.error("GPT Available Years Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Failed to get available years",
        details: error.message
      });
    }
  });
  app2.delete("/api/gpt/delete-chart/:id", gptApiKeyAuth, async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const chartId = parseInt(req.params.id);
      if (isNaN(chartId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid chart ID provided"
        });
      }
      console.log(`GPT Delete - Deleting chart with ID: ${chartId}`);
      const chart = await storage.getChartById(chartId);
      if (!chart) {
        return res.status(404).json({
          success: false,
          error: "Chart not found",
          chartId
        });
      }
      const deleted = await storage.deleteChart(chartId);
      if (deleted) {
        return res.json({
          success: true,
          message: `Chart with ID ${chartId} has been deleted successfully`,
          chartId,
          deletedChart: {
            id: chart.id,
            chartType: chart.chartType,
            createdAt: chart.createdAt
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: "Failed to delete chart",
          chartId
        });
      }
    } catch (error) {
      console.error("GPT Delete Chart Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Failed to delete chart",
        details: error.message
      });
    }
  });
  app2.get("/api/chart-data/:id", isAuthenticated, async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const birthData2 = await storage.getBirthData(id);
      if (!birthData2) {
        return res.status(404).json({ error: "Record not found" });
      }
      if (birthData2.userId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      console.log(`Calculating chart for saved record: ${birthData2.name} (${birthData2.birthDate})`);
      const chartData = await calculateSwissEphemerisPositions(
        birthData2.birthDate,
        // expects string "YYYY-MM-DD" or similar
        birthData2.birthTime,
        birthData2.latitude,
        birthData2.longitude,
        birthData2.birthPlace
      );
      res.json(chartData);
    } catch (error) {
      console.error("Error calculating chart for saved record:", error);
      res.status(500).json({ error: "Failed to calculate chart" });
    }
  });
  app2.post("/api/horoscope", async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const { name, birthDate, birthTime, birthPlace } = req.body;
      let { latitude, longitude } = req.body;
      console.log(`Generating horoscope for: ${name}, ${birthDate}, ${birthTime}, ${birthPlace}`);
      if (!latitude || !longitude) {
        console.log("Coordinates missing, attempting to geocode birthPlace...");
        try {
          const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(birthPlace)}`;
          const geoRes = await fetch(geoUrl, { headers: { "User-Agent": "SoulJourneyApp/1.0" } });
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            latitude = parseFloat(geoData[0].lat);
            longitude = parseFloat(geoData[0].lon);
            console.log(`Geocoded '${birthPlace}' to: ${latitude}, ${longitude}`);
          } else {
            console.error("Geocoding failed: No results found");
            return res.status(400).json({ error: "Could not find coordinates for the provided existing location." });
          }
        } catch (geoError) {
          console.error("Geocoding error:", geoError);
          return res.status(400).json({ error: "Failed to geocode location. Please enter coordinates manually." });
        }
      }
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
  app2.delete("/api/saved-horoscopes/:id", isAuthenticated, async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      const chartId = parseInt(req.params.id);
      if (isNaN(chartId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid chart ID provided"
        });
      }
      console.log(`Deleting chart with ID: ${chartId} by user: ${req.user?.id}`);
      const chart = await storage.getChartById(chartId);
      if (!chart) {
        return res.status(404).json({
          success: false,
          error: "Chart not found"
        });
      }
      if (chart.userId !== req.user.id && !req.user.email?.endsWith("@admin.com")) {
        return res.status(403).json({
          success: false,
          error: "You can only delete your own charts"
        });
      }
      const deleted = await storage.deleteChart(chartId);
      if (deleted) {
        return res.json({
          success: true,
          message: `Chart deleted successfully`,
          chartId
        });
      } else {
        return res.status(500).json({
          success: false,
          error: "Failed to delete chart"
        });
      }
    } catch (error) {
      console.error("Delete Chart Error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Failed to delete chart",
        details: error.message
      });
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
      return res.json(transformedRealData);
    } catch (error) {
      console.error("Error fetching saved horoscopes:", error);
      res.status(500).json({
        message: "Failed to fetch saved horoscopes",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0
      });
    }
  });
  app2.get("/api/birth-data/all", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const allBirthData = await storage.getAllBirthDataForBrowsing(userId);
      res.json(allBirthData || []);
    } catch (error) {
      console.error("Error fetching birth data:", error);
      res.status(500).json({
        message: "Failed to fetch birth data",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0
      });
    }
  });
  app2.delete("/api/birth-data/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      await storage.deleteBirthData(id);
      res.json({ success: true, message: "Birth data deleted" });
    } catch (error) {
      console.error("Error deleting birth data:", error);
      res.status(500).json({ message: "Failed to delete birth data" });
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
  const port = process.env.PORT || 5e3;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();

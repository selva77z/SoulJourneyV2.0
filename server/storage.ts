import {
  users,
  birthData,
  charts,
  profiles,
  matches,
  interpretations,
  adminSettings,
  type User,
  type UpsertUser,
  type BirthData,
  type InsertBirthData,
  type Chart,
  type InsertChart,
  type Profile,
  type InsertProfile,
  type Match,
  type InsertMatch,
  type Interpretation,
  type InsertInterpretation,
  type AdminSetting,
  type InsertAdminSetting,
} from "@shared/schema-sqlite";
import { db } from "./db-local";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Birth data operations
  createBirthData(data: InsertBirthData): Promise<BirthData>;
  getBirthDataByUserId(userId: string): Promise<BirthData | undefined>;
  updateBirthData(id: number, data: Partial<InsertBirthData>): Promise<BirthData>;
  getAllBirthDataForBrowsing(userId?: string): Promise<BirthData[]>;
  getBirthData(id: number): Promise<BirthData | undefined>;
  getBirthDataByYear(year: number): Promise<BirthData[]>;
  getBirthDataByYearAndMonth(year: number, month: number): Promise<BirthData[]>;
  getAvailableYears(): Promise<number[]>;
  deleteBirthData(id: number): Promise<void>;

  // Chart operations
  createChart(data: InsertChart): Promise<Chart>;
  getChartByUserId(userId: string): Promise<Chart | undefined>;
  getChartsByUserId(userId: string): Promise<Chart[]>;
  getChartByBirthDataId(birthDataId: number): Promise<Chart | undefined>;
  getChartById(id: number): Promise<Chart | undefined>;
  updateChart(id: number, data: Partial<InsertChart>): Promise<Chart>;
  deleteChart(id: number): Promise<boolean>;

  // Profile operations
  createProfile(data: InsertProfile): Promise<Profile>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  updateProfile(id: number, data: Partial<InsertProfile>): Promise<Profile>;
  getVisibleProfiles(excludeUserId?: string): Promise<Profile[]>;

  // Match operations
  createMatch(data: InsertMatch): Promise<Match>;
  getMatchesByUserId(userId: string): Promise<Match[]>;
  updateMatchStatus(id: number, status: string): Promise<Match>;
  getMatchById(id: number): Promise<Match | undefined>;

  // Interpretation operations
  createInterpretation(data: InsertInterpretation): Promise<Interpretation>;
  getInterpretationsByChartId(chartId: number): Promise<Interpretation[]>;

  // Admin operations
  createAdminSetting(data: InsertAdminSetting): Promise<AdminSetting>;
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  updateAdminSetting(key: string, value: any): Promise<AdminSetting>;
  getAllAdminSettings(): Promise<AdminSetting[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Birth data operations
  async createBirthData(data: InsertBirthData): Promise<BirthData> {
    const [birthDataRecord] = await db
      .insert(birthData)
      .values(data)
      .returning();
    return birthDataRecord;
  }

  async getBirthData(id: number): Promise<BirthData | undefined> {
    const [birthDataRecord] = await db
      .select()
      .from(birthData)
      .where(eq(birthData.id, id));
    return birthDataRecord;
  }

  async getBirthDataByUserId(userId: string): Promise<BirthData | undefined> {
    const [birthDataRecord] = await db
      .select()
      .from(birthData)
      .where(eq(birthData.userId, userId))
      .orderBy(desc(birthData.createdAt));
    return birthDataRecord;
  }

  async updateBirthData(id: number, data: Partial<InsertBirthData>): Promise<BirthData> {
    const [birthDataRecord] = await db
      .update(birthData)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(birthData.id, id))
      .returning();
    return birthDataRecord;
  }

  async getAllBirthDataForBrowsing(userId?: string): Promise<BirthData[]> {
    let query = db.select().from(birthData);
    if (userId) {
      query = query.where(eq(birthData.userId, userId));
    }
    return await query.orderBy(birthData.year, birthData.month, birthData.day);
  }

  async getBirthDataByYear(year: number): Promise<BirthData[]> {
    return await db.select().from(birthData).where(eq(birthData.year, year)).orderBy(birthData.month, birthData.day);
  }

  async getBirthDataByYearAndMonth(year: number, month: number): Promise<BirthData[]> {
    return await db.select().from(birthData).where(and(eq(birthData.year, year), eq(birthData.month, month)));
  }

  async getAvailableYears(): Promise<number[]> {
    const result = await db.selectDistinct({ year: birthData.year }).from(birthData).orderBy(birthData.year);
    return result.map((row: { year: number }) => row.year);
  }

  async deleteBirthData(id: number): Promise<void> {
    await db.delete(birthData).where(eq(birthData.id, id));
  }

  // Chart operations
  async createChart(data: InsertChart): Promise<Chart> {
    const [chart] = await db
      .insert(charts)
      .values(data)
      .returning();
    return chart;
  }

  async getChartByUserId(userId: string): Promise<Chart | undefined> {
    const [chart] = await db
      .select()
      .from(charts)
      .where(eq(charts.userId, userId))
      .orderBy(desc(charts.createdAt));
    return chart;
  }

  async getChartsByUserId(userId: string): Promise<Chart[]> {
    return await db
      .select()
      .from(charts)
      .where(eq(charts.userId, userId))
      .orderBy(desc(charts.createdAt));
  }

  async getChartByBirthDataId(birthDataId: number): Promise<Chart | undefined> {
    const [chart] = await db
      .select()
      .from(charts)
      .where(eq(charts.birthDataId, birthDataId))
      .orderBy(desc(charts.createdAt));
    return chart;
  }

  async getChartById(id: number): Promise<Chart | undefined> {
    const [chart] = await db
      .select()
      .from(charts)
      .where(eq(charts.id, id));
    return chart;
  }

  async updateChart(id: number, data: Partial<InsertChart>): Promise<Chart> {
    const [chart] = await db
      .update(charts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(charts.id, id))
      .returning();
    return chart;
  }

  async deleteChart(id: number): Promise<boolean> {
    try {
      await db
        .delete(charts)
        .where(eq(charts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting chart:', error);
      return false;
    }
  }

  // Profile operations
  async createProfile(data: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(data)
      .returning();
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async updateProfile(id: number, data: Partial<InsertProfile>): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return profile;
  }

  async getVisibleProfiles(excludeUserId?: string): Promise<Profile[]> {
    const query = db
      .select()
      .from(profiles)
      .where(eq(profiles.isVisible, true));

    if (excludeUserId) {
      return await query.where(sql`${profiles.userId} != ${excludeUserId}`);
    }

    return await query;
  }

  // Match operations
  async createMatch(data: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(data)
      .returning();
    return match;
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .where(eq(matches.userId, userId))
      .orderBy(desc(matches.compatibilityScore));
  }

  async updateMatchStatus(id: number, status: string): Promise<Match> {
    const [match] = await db
      .update(matches)
      .set({ status, updatedAt: new Date() })
      .where(eq(matches.id, id))
      .returning();
    return match;
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, id));
    return match;
  }

  // Interpretation operations
  async createInterpretation(data: InsertInterpretation): Promise<Interpretation> {
    const [interpretation] = await db
      .insert(interpretations)
      .values(data)
      .returning();
    return interpretation;
  }

  async getInterpretationsByChartId(chartId: number): Promise<Interpretation[]> {
    return await db
      .select()
      .from(interpretations)
      .where(eq(interpretations.chartId, chartId))
      .orderBy(desc(interpretations.createdAt));
  }

  // Admin operations
  async createAdminSetting(data: InsertAdminSetting): Promise<AdminSetting> {
    const [setting] = await db
      .insert(adminSettings)
      .values(data)
      .returning();
    return setting;
  }

  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, key));
    return setting;
  }

  async updateAdminSetting(key: string, value: any): Promise<AdminSetting> {
    const [setting] = await db
      .update(adminSettings)
      .set({
        settingValue: value,
        updatedAt: new Date()
      })
      .where(eq(adminSettings.settingKey, key))
      .returning();
    return setting;
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return await db
      .select()
      .from(adminSettings)
      .orderBy(asc(adminSettings.settingKey));
  }
}

import { FirebaseStorage } from "./storage-firebase";

// Choose the data layer based on whether Firebase credentials are available.
// Locally (no credentials) we use the SQLite-backed DatabaseStorage so the app
// runs with no external setup. When Firebase credentials are provided — either
// FIREBASE_* env vars or Google Application Default Credentials
// (GOOGLE_APPLICATION_CREDENTIALS / cloud metadata) — we use Firestore.
const hasFirebaseCreds =
  (!!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY) ||
  !!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  !!process.env.USE_FIREBASE;

export const storage: IStorage = hasFirebaseCreds
  ? new FirebaseStorage()
  : new DatabaseStorage();

console.log(
  `[storage] Using ${hasFirebaseCreds ? "Firebase/Firestore" : "SQLite (local.db)"} data layer`
);


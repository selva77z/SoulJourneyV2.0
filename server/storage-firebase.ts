
import * as admin from "firebase-admin";
import {
    User,
    UpsertUser,
    BirthData,
    InsertBirthData,
    Chart,
    InsertChart,
    Profile,
    InsertProfile,
    Match,
    InsertMatch,
    Interpretation,
    InsertInterpretation,
    AdminSetting,
    InsertAdminSetting,
} from "@shared/schema-sqlite";
import { IStorage } from "./storage";

export class FirebaseStorage implements IStorage {
    private db: admin.firestore.Firestore;
    private initialized: boolean = false;

    constructor() {
        // Attempt to initialize Firebase Admin
        const adminSdk = (admin as any).default || admin;
        const firebaseApps = adminSdk.apps;
        try {
            if (!firebaseApps?.length) {
                if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
                    console.log("Initializing Firebase from Environment Variables...");
                    adminSdk.initializeApp({
                        credential: adminSdk.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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
            // Fallback to avoid immediate crash, but methods will fail
            this.db = null as any;
        }
    }

    // Helper to get next ID for a collection
    private async getNextId(collectionName: string): Promise<number> {
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
    private convertDates<T>(data: any): T {
        if (!data) return data;
        const result = { ...data };

        // Convert common date fields from string/Timestamp to Date object or compatible string
        // The SQLite schema expects ISO strings for dates usually, but let's check what the app expects
        // The schema-sqlite says: createdAt: text("created_at"), so expecting string.
        // But Drizzle usually handles Date <-> String. 
        // Types say: createdAt: string | null.

        // We'll keep them as they are if they are strings.
        // If they are Firestore Timestamps, convert to ISO string.

        for (const key of Object.keys(result)) {
            if (result[key] instanceof admin.firestore.Timestamp) {
                result[key] = result[key].toDate().toISOString();
            }
        }
        return result as T;
    }

    // User operations
    async getUser(id: string): Promise<User | undefined> {
        if (!this.initialized || !this.db) {
            console.warn("Firebase not initialized, returning undefined for getUser");
            return undefined;
        }
        const doc = await this.db.collection("users").doc(id).get();
        return doc.exists ? (doc.data() as User) : undefined;
    }

    async upsertUser(userData: UpsertUser): Promise<User> {
        const id = userData.id || (await this.getNextId("users")).toString();
        const now = new Date().toISOString();

        const userToSave = {
            ...userData,
            id,
            updatedAt: now,
            createdAt: (userData as any).createdAt || now,
        };

        await this.db.collection("users").doc(id).set(userToSave, { merge: true });

        // Fetch specifically to return ensuring full object
        const saved = await this.getUser(id);
        if (!saved) throw new Error("Failed to save user");
        return saved;
    }

    // Birth data operations
    async createBirthData(data: InsertBirthData): Promise<BirthData> {
        const id = await this.getNextId("birthData");
        const now = new Date().toISOString();

        const newRecord: BirthData = {
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
            updatedAt: now,
        };

        await this.db.collection("birthData").doc(id.toString()).set(newRecord);
        return newRecord;
    }

    async getBirthDataByUserId(userId: string): Promise<BirthData | undefined> {
        const snapshot = await this.db
            .collection("birthData")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        return this.convertDates<BirthData>(snapshot.docs[0].data());
    }

    async updateBirthData(id: number, data: Partial<InsertBirthData>): Promise<BirthData> {
        const docRef = this.db.collection("birthData").doc(id.toString());
        const now = new Date().toISOString();

        await docRef.update({
            ...data,
            updatedAt: now
        });

        const updated = await docRef.get();
        if (!updated.exists) throw new Error("BirthData not found");
        return this.convertDates<BirthData>(updated.data());
    }

    async getAllBirthDataForBrowsing(userId?: string): Promise<BirthData[]> {
        if (!this.db) return [];
        let query: admin.firestore.Query = this.db.collection("birthData");
        if (userId) {
            query = query.where("userId", "==", userId);
        }
        // Note: complex ordering needs index in Firestore. 
        // We'll skip complex ordering for now or handle in memory if data is small.
        // Or just order by createdAt.
        const snapshot = await query.orderBy("year").orderBy("month").orderBy("day").get();

        return snapshot.docs.map(doc => this.convertDates<BirthData>(doc.data()));
    }

    async getBirthData(id: number): Promise<BirthData | undefined> {
        const doc = await this.db.collection("birthData").doc(id.toString()).get();
        return doc.exists ? this.convertDates<BirthData>(doc.data()) : undefined;
    }

    async getBirthDataByYear(year: number): Promise<BirthData[]> {
        const snapshot = await this.db
            .collection("birthData")
            .where("year", "==", year)
            .orderBy("month")
            .orderBy("day")
            .get();
        return snapshot.docs.map(doc => this.convertDates<BirthData>(doc.data()));
    }

    async getBirthDataByYearAndMonth(year: number, month: number): Promise<BirthData[]> {
        const snapshot = await this.db
            .collection("birthData")
            .where("year", "==", year)
            .where("month", "==", month)
            .get();
        return snapshot.docs.map(doc => this.convertDates<BirthData>(doc.data()));
    }

    async getAvailableYears(): Promise<number[]> {
        // Firestore doesn't facilitate SELECT DISTINCT well.
        // This is expensive on Firestore as it reads all docs.
        // Better to maintain a separate aggregation, but for now:
        const snapshot = await this.db.collection("birthData").select("year").get();
        const years = new Set<number>();
        snapshot.docs.forEach(doc => {
            const y = doc.data().year;
            if (y) years.add(y);
        });
        return Array.from(years).sort();
    }

    async deleteBirthData(id: number): Promise<void> {
        await this.db.collection("birthData").doc(id.toString()).delete();
    }

    // Chart operations
    async createChart(data: InsertChart): Promise<Chart> {
        const id = await this.getNextId("charts");
        const now = new Date().toISOString();

        const newChart: Chart = {
            id,
            ...data,
            kpData: data.kpData || null,
            aiInterpretation: data.aiInterpretation || null,
            createdAt: now,
            updatedAt: now,
        };

        await this.db.collection("charts").doc(id.toString()).set(newChart);
        return newChart;
    }

    async getChartByUserId(userId: string): Promise<Chart | undefined> {
        if (!this.db) return undefined;
        const snapshot = await this.db
            .collection("charts")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        return this.convertDates<Chart>(snapshot.docs[0].data());
    }

    async getChartsByUserId(userId: string): Promise<Chart[]> {
        const snapshot = await this.db
            .collection("charts")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map(doc => this.convertDates<Chart>(doc.data()));
    }

    async getChartByBirthDataId(birthDataId: number): Promise<Chart | undefined> {
        const snapshot = await this.db
            .collection("charts")
            .where("birthDataId", "==", birthDataId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        return this.convertDates<Chart>(snapshot.docs[0].data());
    }

    async getChartById(id: number): Promise<Chart | undefined> {
        const doc = await this.db.collection("charts").doc(id.toString()).get();
        return doc.exists ? this.convertDates<Chart>(doc.data()) : undefined;
    }

    async updateChart(id: number, data: Partial<InsertChart>): Promise<Chart> {
        const docRef = this.db.collection("charts").doc(id.toString());
        const now = new Date().toISOString();

        await docRef.update({
            ...data,
            updatedAt: now
        });

        const updated = await docRef.get();
        return this.convertDates<Chart>(updated.data());
    }

    async deleteChart(id: number): Promise<boolean> {
        try {
            await this.db.collection("charts").doc(id.toString()).delete();
            return true;
        } catch (error) {
            console.error("Error deleting chart:", error);
            return false;
        }
    }

    // Profile operations
    async createProfile(data: InsertProfile): Promise<Profile> {
        if (!this.db) throw new Error("Database not connected");
        const id = await this.getNextId("profiles");
        const now = new Date().toISOString();

        const newProfile: Profile = {
            id,
            ...data,
            bio: data.bio || null,
            interests: data.interests || null,
            astrologyTags: data.astrologyTags || null,
            isVisible: data.isVisible ?? false,
            createdAt: now,
            updatedAt: now,
        };

        await this.db.collection("profiles").doc(id.toString()).set(newProfile);
        return newProfile;
    }

    async getProfileByUserId(userId: string): Promise<Profile | undefined> {
        const snapshot = await this.db
            .collection("profiles")
            .where("userId", "==", userId)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        return this.convertDates<Profile>(snapshot.docs[0].data());
    }

    async updateProfile(id: number, data: Partial<InsertProfile>): Promise<Profile> {
        const docRef = this.db.collection("profiles").doc(id.toString());
        const now = new Date().toISOString();

        await docRef.update({
            ...data,
            updatedAt: now
        });

        const updated = await docRef.get();
        return this.convertDates<Profile>(updated.data());
    }

    async getVisibleProfiles(excludeUserId?: string): Promise<Profile[]> {
        let query = this.db.collection("profiles").where("isVisible", "==", true);
        // Note: "not equals" queries can be tricky in Firestore. 
        // We'll filter in memory if needed, or query and filter.

        const snapshot = await query.get();
        let profiles = snapshot.docs.map(doc => this.convertDates<Profile>(doc.data()));

        if (excludeUserId) {
            profiles = profiles.filter(p => p.userId !== excludeUserId);
        }
        return profiles;
    }

    // Match operations
    async createMatch(data: InsertMatch): Promise<Match> {
        const id = await this.getNextId("matches");
        const now = new Date().toISOString();

        const newMatch: Match = {
            id,
            ...data,
            status: data.status || "pending",
            createdAt: now,
            updatedAt: now,
        };

        await this.db.collection("matches").doc(id.toString()).set(newMatch);
        return newMatch;
    }

    async getMatchesByUserId(userId: string): Promise<Match[]> {
        const snapshot = await this.db
            .collection("matches")
            .where("userId", "==", userId)
            .orderBy("compatibilityScore", "desc")
            .get();
        return snapshot.docs.map(doc => this.convertDates<Match>(doc.data()));
    }

    async updateMatchStatus(id: number, status: string): Promise<Match> {
        const docRef = this.db.collection("matches").doc(id.toString());
        const now = new Date().toISOString();

        await docRef.update({
            status,
            updatedAt: now
        });

        const updated = await docRef.get();
        return this.convertDates<Match>(updated.data());
    }

    async getMatchById(id: number): Promise<Match | undefined> {
        const doc = await this.db.collection("matches").doc(id.toString()).get();
        return doc.exists ? this.convertDates<Match>(doc.data()) : undefined;
    }

    // Interpretation operations
    async createInterpretation(data: InsertInterpretation): Promise<Interpretation> {
        const id = await this.getNextId("interpretations");
        const now = new Date().toISOString();

        const newInterp: Interpretation = {
            id,
            ...data,
            confidence: data.confidence || null,
            createdAt: now,
        };

        await this.db.collection("interpretations").doc(id.toString()).set(newInterp);
        return newInterp;
    }

    async getInterpretationsByChartId(chartId: number): Promise<Interpretation[]> {
        const snapshot = await this.db
            .collection("interpretations")
            .where("chartId", "==", chartId)
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map(doc => this.convertDates<Interpretation>(doc.data()));
    }

    // Admin operations
    async createAdminSetting(data: InsertAdminSetting): Promise<AdminSetting> {
        const id = await this.getNextId("adminSettings");
        const now = new Date().toISOString();

        const newSetting: AdminSetting = {
            id,
            ...data,
            description: data.description || null,
            createdAt: now,
            updatedAt: now,
        };

        await this.db.collection("adminSettings").doc(id.toString()).set(newSetting);
        return newSetting;
    }

    async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
        const snapshot = await this.db
            .collection("adminSettings")
            .where("settingKey", "==", key)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        return this.convertDates<AdminSetting>(snapshot.docs[0].data());
    }

    async updateAdminSetting(key: string, value: any): Promise<AdminSetting> {
        const snapshot = await this.db
            .collection("adminSettings")
            .where("settingKey", "==", key)
            .limit(1)
            .get();

        if (snapshot.empty) throw new Error("Setting not found");

        const docRef = snapshot.docs[0].ref;
        const now = new Date().toISOString();

        await docRef.update({
            settingValue: value,
            updatedAt: now
        });

        const updated = await docRef.get();
        return this.convertDates<AdminSetting>(updated.data());
    }

    async getAllAdminSettings(): Promise<AdminSetting[]> {
        const snapshot = await this.db
            .collection("adminSettings")
            .orderBy("settingKey", "asc")
            .get();
        return snapshot.docs.map(doc => this.convertDates<AdminSetting>(doc.data()));
    }
}

import type { Express } from "express";
import { db } from "./db";
import { mobileUsers, users, profiles, birthData, charts, tagRules, tagVisibility } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { spawn } from 'child_process';
import path from 'path';
import { z } from "zod";

// Mobile user registration schema
const mobileUserSchema = z.object({
  mobileAppId: z.string().min(1),
  deviceId: z.string().optional(),
  name: z.string().min(1),
  birthDate: z.string(), // YYYY-MM-DD
  birthTime: z.string(), // HH:MM
  birthPlace: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
});

// Tag assignment based on KP calculations
async function assignTagBasedOnKP(kpData: any): Promise<string> {
  try {
    // Get all active tag rules ordered by priority
    const rules = await db.select()
      .from(tagRules)
      .where(eq(tagRules.isActive, true))
      .orderBy(desc(tagRules.priority));

    for (const rule of rules) {
      const conditions = rule.conditions as any;
      
      // Example KP-based conditions evaluation
      if (evaluateKPConditions(kpData, conditions)) {
        return rule.assignedTag;
      }
    }

    // Default tag if no rules match
    return 'general';
  } catch (error) {
    console.error('Error assigning tag:', error);
    return 'general';
  }
}

// Evaluate KP conditions (you can expand this based on your specific rules)
function evaluateKPConditions(kpData: any, conditions: any): boolean {
  try {
    // Example conditions:
    // - Moon sign
    // - Ascendant sign
    // - Specific planetary positions
    // - Dasha periods
    // - Star/Nakshatra
    
    if (conditions.moonSign && kpData.moonSign !== conditions.moonSign) {
      return false;
    }
    
    if (conditions.ascendant && kpData.ascendant !== conditions.ascendant) {
      return false;
    }
    
    if (conditions.star && kpData.star !== conditions.star) {
      return false;
    }
    
    // Add more complex KP-based logic here
    return true;
  } catch (error) {
    console.error('Error evaluating KP conditions:', error);
    return false;
  }
}

// Calculate KP chart using existing Python script
async function calculateKPChart(birthData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'ultimate_kp_system.py');
    const args = [
      birthData.name,
      birthData.birthDate,
      birthData.birthTime,
      birthData.birthPlace,
      birthData.latitude?.toString() || '0',
      birthData.longitude?.toString() || '0'
    ];

    const pythonProcess = spawn('python3', [pythonScript, ...args]);
    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const kpData = JSON.parse(result);
          resolve(kpData);
        } catch (parseError) {
          reject(new Error(`Failed to parse KP data: ${parseError}`));
        }
      } else {
        reject(new Error(`Python script failed: ${error}`));
      }
    });
  });
}

export function registerMobileRoutes(app: Express) {
  // Mobile user registration endpoint
  app.post('/api/mobile/register', async (req, res) => {
    try {
      const validatedData = mobileUserSchema.parse(req.body);
      
      // Check if mobile user already exists
      const existingUser = await db.select()
        .from(mobileUsers)
        .where(eq(mobileUsers.mobileAppId, validatedData.mobileAppId))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          error: 'Mobile user already exists',
          mobileAppId: validatedData.mobileAppId
        });
      }

      // Insert mobile user
      const [newMobileUser] = await db.insert(mobileUsers).values({
        mobileAppId: validatedData.mobileAppId,
        deviceId: validatedData.deviceId,
        name: validatedData.name,
        birthDate: validatedData.birthDate,
        birthTime: validatedData.birthTime,
        birthPlace: validatedData.birthPlace,
        latitude: validatedData.latitude?.toString(),
        longitude: validatedData.longitude?.toString(),
        timezone: validatedData.timezone,
        isProcessed: false,
      }).returning();

      res.json({
        success: true,
        mobileUser: newMobileUser,
        message: 'Mobile user registered successfully. Processing will begin shortly.'
      });

      // Process in background
      processNewMobileUser(newMobileUser.id);

    } catch (error) {
      console.error('Mobile registration error:', error);
      res.status(400).json({
        error: 'Invalid request data',
        details: error instanceof z.ZodError ? error.errors : error
      });
    }
  });

  // Check mobile user status
  app.get('/api/mobile/status/:mobileAppId', async (req, res) => {
    try {
      const { mobileAppId } = req.params;

      const mobileUser = await db.select()
        .from(mobileUsers)
        .where(eq(mobileUsers.mobileAppId, mobileAppId))
        .limit(1);

      if (mobileUser.length === 0) {
        return res.status(404).json({ error: 'Mobile user not found' });
      }

      const user = mobileUser[0];
      
      res.json({
        mobileAppId: user.mobileAppId,
        isProcessed: user.isProcessed,
        assignedTag: user.assignedTag,
        webUserId: user.webUserId,
        status: user.isProcessed ? 'processed' : 'pending'
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get compatible users for mobile app
  app.get('/api/mobile/matches/:mobileAppId', async (req, res) => {
    try {
      const { mobileAppId } = req.params;

      // Get mobile user
      const mobileUser = await db.select()
        .from(mobileUsers)
        .where(and(
          eq(mobileUsers.mobileAppId, mobileAppId),
          eq(mobileUsers.isProcessed, true)
        ))
        .limit(1);

      if (mobileUser.length === 0) {
        return res.status(404).json({ error: 'Mobile user not found or not processed yet' });
      }

      const userTag = mobileUser[0].assignedTag;
      if (!userTag) {
        return res.json({ matches: [] });
      }

      // Get visible tags for this user's tag
      const visibleTags = await db.select()
        .from(tagVisibility)
        .where(and(
          eq(tagVisibility.fromTag, userTag),
          eq(tagVisibility.isVisible, true)
        ));

      const visibleTagList = visibleTags.map(v => v.toTag);

      // Get matching users (excluding self)
      const matchingUsers = await db.select({
        mobileAppId: mobileUsers.mobileAppId,
        name: mobileUsers.name,
        assignedTag: mobileUsers.assignedTag,
        createdAt: mobileUsers.createdAt,
      })
      .from(mobileUsers)
      .where(and(
        eq(mobileUsers.isProcessed, true),
        // Only show users with compatible tags
        // For now, same tag users can see each other
        eq(mobileUsers.assignedTag, userTag)
      ))
      // Exclude self
      .where(eq(mobileUsers.mobileAppId, mobileAppId))
      .orderBy(desc(mobileUsers.createdAt));

      res.json({
        userTag,
        matches: matchingUsers.filter(u => u.mobileAppId !== mobileAppId)
      });

    } catch (error) {
      console.error('Matches error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Background processing function
  async function processNewMobileUser(mobileUserId: number) {
    try {
      const mobileUser = await db.select()
        .from(mobileUsers)
        .where(eq(mobileUsers.id, mobileUserId))
        .limit(1);

      if (mobileUser.length === 0) return;

      const user = mobileUser[0];

      // Calculate KP chart
      const kpData = await calculateKPChart({
        name: user.name,
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthPlace: user.birthPlace,
        latitude: parseFloat(user.latitude || '0'),
        longitude: parseFloat(user.longitude || '0')
      });

      // Assign tag based on KP calculations
      const assignedTag = await assignTagBasedOnKP(kpData);

      // Update mobile user
      await db.update(mobileUsers)
        .set({
          assignedTag,
          isProcessed: true,
          updatedAt: new Date()
        })
        .where(eq(mobileUsers.id, mobileUserId));

      console.log(`Mobile user ${user.mobileAppId} processed with tag: ${assignedTag}`);

    } catch (error) {
      console.error('Error processing mobile user:', error);
    }
  }
}
import type { Express } from "express";
import { db } from "./db";
import { tagRules, tagVisibility, mobileUsers, profiles, adminSettings } from "@shared/schema";
import { eq, desc, asc, and, or, count } from "drizzle-orm";
import { z } from "zod";

// Admin authentication middleware (simplified for development)
const isAdmin = (req: any, res: any, next: any) => {
  // In production, implement proper admin authentication
  if (process.env.NODE_ENV === 'development') {
    req.isAdmin = true;
    return next();
  }
  
  // Check if user has admin privileges
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Tag rule schema
const tagRuleSchema = z.object({
  ruleName: z.string().min(1),
  ruleDescription: z.string().optional(),
  conditions: z.object({
    moonSign: z.string().optional(),
    ascendant: z.string().optional(),
    star: z.string().optional(),
    rasi: z.string().optional(),
    // Add more KP-based conditions as needed
  }),
  assignedTag: z.string().min(1),
  priority: z.number().default(0),
  isActive: z.boolean().default(true),
});

// Tag visibility schema
const tagVisibilitySchema = z.object({
  fromTag: z.string().min(1),
  toTag: z.string().min(1),
  isVisible: z.boolean().default(true),
});

export function registerAdminRoutes(app: Express) {
  // Get all tag rules
  app.get('/api/admin/tag-rules', isAdmin, async (req, res) => {
    try {
      const rules = await db.select()
        .from(tagRules)
        .orderBy(desc(tagRules.priority), asc(tagRules.ruleName));

      res.json({ rules });
    } catch (error) {
      console.error('Error fetching tag rules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create new tag rule
  app.post('/api/admin/tag-rules', isAdmin, async (req, res) => {
    try {
      const validatedData = tagRuleSchema.parse(req.body);

      const [newRule] = await db.insert(tagRules).values({
        ruleName: validatedData.ruleName,
        ruleDescription: validatedData.ruleDescription,
        conditions: validatedData.conditions,
        assignedTag: validatedData.assignedTag,
        priority: validatedData.priority,
        isActive: validatedData.isActive,
      }).returning();

      res.json({ success: true, rule: newRule });
    } catch (error) {
      console.error('Error creating tag rule:', error);
      res.status(400).json({
        error: 'Invalid request data',
        details: error instanceof z.ZodError ? error.errors : error
      });
    }
  });

  // Update tag rule
  app.put('/api/admin/tag-rules/:id', isAdmin, async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      const validatedData = tagRuleSchema.partial().parse(req.body);

      const [updatedRule] = await db.update(tagRules)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(tagRules.id, ruleId))
        .returning();

      if (!updatedRule) {
        return res.status(404).json({ error: 'Tag rule not found' });
      }

      res.json({ success: true, rule: updatedRule });
    } catch (error) {
      console.error('Error updating tag rule:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  });

  // Delete tag rule
  app.delete('/api/admin/tag-rules/:id', isAdmin, async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id);

      const deletedRule = await db.delete(tagRules)
        .where(eq(tagRules.id, ruleId))
        .returning();

      if (deletedRule.length === 0) {
        return res.status(404).json({ error: 'Tag rule not found' });
      }

      res.json({ success: true, message: 'Tag rule deleted' });
    } catch (error) {
      console.error('Error deleting tag rule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get tag visibility matrix
  app.get('/api/admin/tag-visibility', isAdmin, async (req, res) => {
    try {
      const visibility = await db.select()
        .from(tagVisibility)
        .orderBy(asc(tagVisibility.fromTag), asc(tagVisibility.toTag));

      // Get all unique tags
      const allTags = new Set<string>();
      visibility.forEach(v => {
        allTags.add(v.fromTag);
        allTags.add(v.toTag);
      });

      // Also get tags from mobile users and profiles
      const mobileUserTags = await db.select({ tag: mobileUsers.assignedTag })
        .from(mobileUsers)
        .where(eq(mobileUsers.isProcessed, true));

      const profileTags = await db.select({ tag: profiles.compatibilityTag })
        .from(profiles);

      mobileUserTags.forEach(t => t.tag && allTags.add(t.tag));
      profileTags.forEach(t => t.tag && allTags.add(t.tag));

      res.json({
        visibility,
        availableTags: Array.from(allTags).sort()
      });
    } catch (error) {
      console.error('Error fetching tag visibility:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Set tag visibility
  app.post('/api/admin/tag-visibility', isAdmin, async (req, res) => {
    try {
      const validatedData = tagVisibilitySchema.parse(req.body);

      // Check if visibility rule already exists
      const existing = await db.select()
        .from(tagVisibility)
        .where(and(
          eq(tagVisibility.fromTag, validatedData.fromTag),
          eq(tagVisibility.toTag, validatedData.toTag)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing rule
        const [updated] = await db.update(tagVisibility)
          .set({ isVisible: validatedData.isVisible })
          .where(and(
            eq(tagVisibility.fromTag, validatedData.fromTag),
            eq(tagVisibility.toTag, validatedData.toTag)
          ))
          .returning();

        res.json({ success: true, visibility: updated });
      } else {
        // Create new rule
        const [newVisibility] = await db.insert(tagVisibility).values({
          fromTag: validatedData.fromTag,
          toTag: validatedData.toTag,
          isVisible: validatedData.isVisible,
        }).returning();

        res.json({ success: true, visibility: newVisibility });
      }
    } catch (error) {
      console.error('Error setting tag visibility:', error);
      res.status(400).json({
        error: 'Invalid request data',
        details: error instanceof z.ZodError ? error.errors : error
      });
    }
  });

  // Get mobile users statistics
  app.get('/api/admin/mobile-users/stats', isAdmin, async (req, res) => {
    try {
      const totalUsers = await db.select({ count: count() })
        .from(mobileUsers);

      const processedUsers = await db.select({ count: count() })
        .from(mobileUsers)
        .where(eq(mobileUsers.isProcessed, true));

      const pendingUsers = await db.select({ count: count() })
        .from(mobileUsers)
        .where(eq(mobileUsers.isProcessed, false));

      // Get tag distribution
      const tagDistribution = await db.select({
        tag: mobileUsers.assignedTag,
        count: count()
      })
      .from(mobileUsers)
      .where(eq(mobileUsers.isProcessed, true))
      .groupBy(mobileUsers.assignedTag);

      res.json({
        totalUsers: totalUsers[0]?.count || 0,
        processedUsers: processedUsers[0]?.count || 0,
        pendingUsers: pendingUsers[0]?.count || 0,
        tagDistribution: tagDistribution.filter(t => t.tag !== null)
      });
    } catch (error) {
      console.error('Error fetching mobile user stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get mobile users list
  app.get('/api/admin/mobile-users', isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const users = await db.select()
        .from(mobileUsers)
        .orderBy(desc(mobileUsers.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db.select({ count: count() })
        .from(mobileUsers);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total: totalCount[0]?.count || 0,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching mobile users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Manually assign tag to mobile user
  app.put('/api/admin/mobile-users/:id/tag', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { assignedTag } = req.body;

      if (!assignedTag || typeof assignedTag !== 'string') {
        return res.status(400).json({ error: 'Valid assignedTag is required' });
      }

      const [updatedUser] = await db.update(mobileUsers)
        .set({
          assignedTag,
          isProcessed: true,
          updatedAt: new Date()
        })
        .where(eq(mobileUsers.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: 'Mobile user not found' });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating mobile user tag:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reprocess mobile user (recalculate chart and assign tag)
  app.post('/api/admin/mobile-users/:id/reprocess', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Reset processing status
      const [updatedUser] = await db.update(mobileUsers)
        .set({
          isProcessed: false,
          assignedTag: null,
          updatedAt: new Date()
        })
        .where(eq(mobileUsers.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: 'Mobile user not found' });
      }

      res.json({
        success: true,
        message: 'Mobile user queued for reprocessing',
        user: updatedUser
      });

      // Trigger background processing
      // processNewMobileUser(userId); // This would need to be imported from mobile-routes.ts
    } catch (error) {
      console.error('Error reprocessing mobile user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get admin dashboard data
  app.get('/api/admin/dashboard', isAdmin, async (req, res) => {
    try {
      // Get basic stats
      const [totalMobileUsers] = await db.select({ count: count() })
        .from(mobileUsers);

      const [processedMobileUsers] = await db.select({ count: count() })
        .from(mobileUsers)
        .where(eq(mobileUsers.isProcessed, true));

      const [totalRules] = await db.select({ count: count() })
        .from(tagRules);

      const [activeRules] = await db.select({ count: count() })
        .from(tagRules)
        .where(eq(tagRules.isActive, true));

      // Recent mobile users
      const recentUsers = await db.select({
        id: mobileUsers.id,
        name: mobileUsers.name,
        assignedTag: mobileUsers.assignedTag,
        isProcessed: mobileUsers.isProcessed,
        createdAt: mobileUsers.createdAt
      })
      .from(mobileUsers)
      .orderBy(desc(mobileUsers.createdAt))
      .limit(10);

      res.json({
        stats: {
          totalMobileUsers: totalMobileUsers.count,
          processedMobileUsers: processedMobileUsers.count,
          pendingMobileUsers: totalMobileUsers.count - processedMobileUsers.count,
          totalRules: totalRules.count,
          activeRules: activeRules.count
        },
        recentUsers
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
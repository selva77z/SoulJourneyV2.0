import type { Express } from "express";
import { db } from "./db";
import { charts, interpretations, birthData, users, mobileUsers } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI interpretation request schema
const aiInterpretationSchema = z.object({
  chartId: z.number().optional(),
  mobileAppId: z.string().optional(),
  interpretationType: z.enum(['general', 'compatibility', 'transit', 'career', 'relationship']).default('general'),
  customPrompt: z.string().optional(),
});

// Custom GPT input schema
const customGPTSchema = z.object({
  userInput: z.string().min(1),
  context: z.object({
    chartData: z.any().optional(),
    birthData: z.any().optional(),
    userProfile: z.any().optional(),
  }).optional(),
});

export function registerAIRoutes(app: Express) {
  // Generate AI interpretation for a chart
  app.post('/api/ai/interpret', async (req, res) => {
    try {
      const validatedData = aiInterpretationSchema.parse(req.body);
      
      let chartData: any = null;
      let birthDataInfo: any = null;

      // Get chart data either by chartId or mobileAppId
      if (validatedData.chartId) {
        const chart = await db.select()
          .from(charts)
          .innerJoin(birthData, eq(charts.birthDataId, birthData.id))
          .where(eq(charts.id, validatedData.chartId))
          .limit(1);

        if (chart.length === 0) {
          return res.status(404).json({ error: 'Chart not found' });
        }

        chartData = chart[0].charts.chartData;
        birthDataInfo = chart[0].birth_data;
      } else if (validatedData.mobileAppId) {
        const mobileUser = await db.select()
          .from(mobileUsers)
          .where(and(
            eq(mobileUsers.mobileAppId, validatedData.mobileAppId),
            eq(mobileUsers.isProcessed, true)
          ))
          .limit(1);

        if (mobileUser.length === 0) {
          return res.status(404).json({ error: 'Mobile user not found or not processed' });
        }

        // For mobile users, we'll use their basic data
        birthDataInfo = mobileUser[0];
      } else {
        return res.status(400).json({ error: 'Either chartId or mobileAppId is required' });
      }

      // Generate AI interpretation
      const interpretation = await generateAIInterpretation(
        chartData,
        birthDataInfo,
        validatedData.interpretationType,
        validatedData.customPrompt
      );

      // Save interpretation if we have a chart
      if (validatedData.chartId) {
        await db.insert(interpretations).values({
          chartId: validatedData.chartId,
          interpretationType: validatedData.interpretationType,
          interpretation: interpretation,
          confidence: 0.85, // You can implement confidence scoring
        });
      }

      res.json({
        success: true,
        interpretation,
        interpretationType: validatedData.interpretationType
      });

    } catch (error) {
      console.error('AI interpretation error:', error);
      res.status(400).json({
        error: 'Invalid request data',
        details: error instanceof z.ZodError ? error.errors : error
      });
    }
  });

  // Custom GPT interaction endpoint
  app.post('/api/ai/custom-gpt', async (req, res) => {
    try {
      const validatedData = customGPTSchema.parse(req.body);

      const response = await processCustomGPTRequest(
        validatedData.userInput,
        validatedData.context
      );

      res.json({
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Custom GPT error:', error);
      res.status(400).json({
        error: 'Invalid request data',
        details: error instanceof z.ZodError ? error.errors : error
      });
    }
  });

  // Get interpretation history for a chart
  app.get('/api/ai/interpretations/:chartId', async (req, res) => {
    try {
      const chartId = parseInt(req.params.chartId);

      const chartInterpretations = await db.select()
        .from(interpretations)
        .where(eq(interpretations.chartId, chartId))
        .orderBy(desc(interpretations.createdAt));

      res.json({
        chartId,
        interpretations: chartInterpretations
      });

    } catch (error) {
      console.error('Error fetching interpretations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Batch process AI interpretations for mobile users
  app.post('/api/ai/batch-interpret', async (req, res) => {
    try {
      const { mobileAppIds, interpretationType = 'general' } = req.body;

      if (!Array.isArray(mobileAppIds) || mobileAppIds.length === 0) {
        return res.status(400).json({ error: 'mobileAppIds array is required' });
      }

      const results = [];

      for (const mobileAppId of mobileAppIds) {
        try {
          const mobileUser = await db.select()
            .from(mobileUsers)
            .where(and(
              eq(mobileUsers.mobileAppId, mobileAppId),
              eq(mobileUsers.isProcessed, true)
            ))
            .limit(1);

          if (mobileUser.length > 0) {
            const interpretation = await generateAIInterpretation(
              null,
              mobileUser[0],
              interpretationType
            );

            results.push({
              mobileAppId,
              success: true,
              interpretation
            });
          } else {
            results.push({
              mobileAppId,
              success: false,
              error: 'User not found or not processed'
            });
          }
        } catch (error) {
          results.push({
            mobileAppId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        results,
        processed: results.length
      });

    } catch (error) {
      console.error('Batch interpretation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Generate AI interpretation using OpenAI
async function generateAIInterpretation(
  chartData: any,
  birthDataInfo: any,
  interpretationType: string,
  customPrompt?: string
): Promise<string> {
  try {
    const systemPrompt = `You are an expert KP (Krishnamurti Paddhati) astrologer with deep knowledge of Vedic astrology. 
    You provide accurate, insightful, and personalized interpretations based on birth data and chart information.
    
    Focus on:
    - KP system principles and sub-lords
    - Planetary positions and their significance
    - Dasha periods and their effects
    - Practical life guidance
    - Compatibility analysis when relevant
    
    Keep interpretations positive, constructive, and actionable.`;

    let userPrompt = '';

    if (customPrompt) {
      userPrompt = customPrompt;
    } else {
      switch (interpretationType) {
        case 'general':
          userPrompt = `Provide a general KP astrology interpretation for this person:
          Birth Data: ${JSON.stringify(birthDataInfo)}
          ${chartData ? `Chart Data: ${JSON.stringify(chartData)}` : ''}
          
          Include insights about personality, strengths, challenges, and general life guidance.`;
          break;

        case 'compatibility':
          userPrompt = `Analyze compatibility factors for this person based on their KP chart:
          Birth Data: ${JSON.stringify(birthDataInfo)}
          ${chartData ? `Chart Data: ${JSON.stringify(chartData)}` : ''}
          
          Focus on relationship compatibility, ideal partner traits, and relationship guidance.`;
          break;

        case 'career':
          userPrompt = `Provide career and professional guidance based on this KP chart:
          Birth Data: ${JSON.stringify(birthDataInfo)}
          ${chartData ? `Chart Data: ${JSON.stringify(chartData)}` : ''}
          
          Include suitable career paths, professional strengths, and timing for career moves.`;
          break;

        case 'relationship':
          userPrompt = `Analyze relationship patterns and romantic life based on this KP chart:
          Birth Data: ${JSON.stringify(birthDataInfo)}
          ${chartData ? `Chart Data: ${JSON.stringify(chartData)}` : ''}
          
          Focus on love life, marriage timing, and relationship dynamics.`;
          break;

        default:
          userPrompt = `Provide a KP astrology interpretation for this person:
          Birth Data: ${JSON.stringify(birthDataInfo)}
          ${chartData ? `Chart Data: ${JSON.stringify(chartData)}` : ''}`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate interpretation at this time.';

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI interpretation');
  }
}

// Process custom GPT requests
async function processCustomGPTRequest(
  userInput: string,
  context?: any
): Promise<string> {
  try {
    const systemPrompt = `You are a specialized KP astrology assistant integrated into a web application. 
    You help users understand their astrological charts, compatibility, and provide guidance based on KP principles.
    
    You have access to user's birth data and chart information when available.
    Always provide helpful, accurate, and personalized responses.
    
    If the user asks questions outside of astrology, gently redirect them back to astrological topics.`;

    let contextInfo = '';
    if (context?.chartData) {
      contextInfo += `User's Chart Data: ${JSON.stringify(context.chartData)}\n`;
    }
    if (context?.birthData) {
      contextInfo += `User's Birth Data: ${JSON.stringify(context.birthData)}\n`;
    }
    if (context?.userProfile) {
      contextInfo += `User's Profile: ${JSON.stringify(context.userProfile)}\n`;
    }

    const userPrompt = `${contextInfo}\nUser Question: ${userInput}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at this time. Please try again.';

  } catch (error) {
    console.error('Custom GPT processing error:', error);
    throw new Error('Failed to process custom GPT request');
  }
}
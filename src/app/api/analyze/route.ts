import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

/**
 * GET /api/analyze
 * Fetches cached AI insight for today without invoking Gemini.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: cachedInsight, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('snapshot_date', today)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to query cached insights', details: error.message },
        { status: 500 }
      );
    }

    if (!cachedInsight) {
      return NextResponse.json(
        { cached: false, message: 'No insight cached for today' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...(cachedInsight.analysis as object),
      cached: true,
      snapshot_date: cachedInsight.snapshot_date,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analyze
 * Body: { forceRefresh?: boolean }
 * Returns cached insight if available for today, unless forceRefresh is true.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    let forceRefresh = false;
    try {
      const body = await req.json();
      if (typeof body?.forceRefresh === 'boolean') {
        forceRefresh = body.forceRefresh;
      }
    } catch {
      // Body may be empty, default forceRefresh to false
    }

    // 1. Check cache first to avoid unneeded Gemini token burn & latency
    if (!forceRefresh) {
      const { data: cachedInsight } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('snapshot_date', today)
        .maybeSingle();

      if (cachedInsight && cachedInsight.analysis) {
        return NextResponse.json({
          ...(cachedInsight.analysis as object),
          cached: true,
          snapshot_date: cachedInsight.snapshot_date,
        });
      }
    }

    // 2. Fetch active habits and past 30 days of logs
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .split('T')[0];

    const [habitsResult, logsResult] = await Promise.all([
      supabase.from('habits').select('*').eq('is_active', true),
      supabase.from('habit_logs').select('*').gte('log_date', thirtyDaysAgo),
    ]);

    if (habitsResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch habits', details: habitsResult.error.message },
        { status: 500 }
      );
    }

    if (logsResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch habit logs', details: logsResult.error.message },
        { status: 500 }
      );
    }

    const habits = habitsResult.data || [];
    const logs = logsResult.data || [];

    // 3. Call Gemini with Structured JSON Schema
    const prompt = `
      Analyze this 30-day user habit tracking data. Identify behavioral friction, failure correlations, and concrete micro-actions.
      Active Habits: ${JSON.stringify(habits)}
      Past Logs: ${JSON.stringify(logs)}
    `;

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallConsistencyScore: { type: Type.INTEGER },
            primaryBottleneck: { type: Type.STRING },
            bottleneckDescription: { type: Type.STRING },
            suggestedTweaks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  habitTitle: { type: Type.STRING },
                  action: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                },
                required: ['habitTitle', 'action', 'rationale'],
              },
            },
          },
          required: [
            'overallConsistencyScore',
            'primaryBottleneck',
            'suggestedTweaks',
          ],
        },
      },
    });

    if (!response.text) {
      return NextResponse.json(
        { error: 'Empty response from AI analysis model' },
        { status: 502 }
      );
    }

    const parsedAnalysis = JSON.parse(response.text);

    // 4. Cache the output in public.ai_insights
    const { error: upsertError } = await supabase.from('ai_insights').upsert(
      {
        user_id: user.id,
        snapshot_date: today,
        analysis: parsedAnalysis,
      },
      {
        onConflict: 'user_id,snapshot_date',
      }
    );

    if (upsertError) {
      console.error('Failed to cache AI insight:', upsertError.message);
    }

    return NextResponse.json({
      ...parsedAnalysis,
      cached: false,
      snapshot_date: today,
    });
  } catch (error: any) {
    console.error('Error in analyze API route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

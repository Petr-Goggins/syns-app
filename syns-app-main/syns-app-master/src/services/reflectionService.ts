interface ReflectionResult {
  plan: string;
  iterations: number;
  status: 'success' | 'failed' | 'partial';
  changes: string[];
  statusMessages: string[];
}

interface AIResponse {
  content: string;
  role: 'generator' | 'critic' | 'refactor';
}

const SYSTEM_PROMPTS = {
  generator: `You are an expert fitness coach and workout plan generator. Generate a detailed workout plan based on the user's profile and goals.

Your plan should include:
- Weekly schedule (days of the week)
- Exercises for each day with sets, reps, and rest periods
- Warm-up and cool-down routines
- Progression guidelines

Follow these principles:
1. Linear micro-periodization 3:1 - 3 loading weeks, 1 deload week
2. Frequency split by training level - beginners 3 days, intermediate 4, advanced 5-6
3. Alternate planes and vectors - push → pull → squat → hinge
4. Double progression - fixed rep range, increase weight at upper bound
5. Volume dose by working sets - 10-12 for beginners, 15-20 for advanced
6. Prioritize compound multi-joint movements - 70% of program
7. Autoregulation via RIR - beginners RIR 3-4, intermediate RIR 2-3, advanced RIR 1-2
8. Balance push-pull 1:1 horizontally, 1:1.5 vertically
9. Adapt exercises to available equipment
10. Consider menstrual cycle phases for women - follicular → high intensity, luteal → reduce
11. Minimal warm-up and mandatory cool-down
12. Recovery protocol - sleep, nutrition, rest days
13. Rule "simple to complex" - beginners start with bodyweight
14. Practicality and timing - 45-75 minute workouts

Return ONLY the workout plan in JSON format with this structure:
{
  "weeklySchedule": [
    {
      "day": 1,
      "focus": "chest/triceps",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-12",
          "rest": 90,
          "rpe": 7
        }
      ],
      "warmup": [...],
      "cooldown": [...]
    }
  ],
  "deloadWeek": {...},
  "progression": "..."
}`,

  critic: `You are a critical fitness expert reviewing workout plans for safety, scientific accuracy, and effectiveness.

Review the generated workout plan and check for:
1. Safety issues - dangerous exercise combinations, insufficient rest, unrealistic weights
2. Scientific accuracy -是否符合运动科学原理, proper volume distribution, recovery time
3. Practicality - can this be done with the user's equipment and time constraints?
4. Individualization - does this match the user's level, goals, and limitations?

Provide specific feedback on what needs to be fixed. Be constructive but critical.

Return your critique in JSON format:
{
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "category": "safety" | "science" | "practicality" | "individualization",
      "description": "What's wrong",
      "suggestion": "How to fix it"
    }
  ],
  "overallScore": 1-10,
  "approved": boolean
}`,

  refactor: `You are a fitness plan refactored. Take the original plan and the critic's feedback to create an improved version.

Apply all the critic's suggestions while maintaining the core structure and principles.
Ensure the plan remains:
- Safe and scientifically sound
- Practical for the user's situation
- Aligned with their goals and level

Return the improved plan in the same JSON format as the generator.`
};

export async function generatePlanWithReflection(
  userProfile: any,
  userContext: string,
  apiKey: string
): Promise<ReflectionResult> {
  const maxIterations = 3;
  const statusMessages: string[] = [];
  const changes: string[] = [];
  
  statusMessages.push('Генерирую план...');
  
  let currentPlan: any = null;
  let iteration = 0;
  let approved = false;
  
  while (iteration < maxIterations && !approved) {
    iteration++;
    
    // Step 1: Generate or Refactor
    if (iteration === 1) {
      statusMessages.push('Генерирую план...');
      currentPlan = await callAI(SYSTEM_PROMPTS.generator, userContext, apiKey);
    } else {
      statusMessages.push('Исправляю план...');
      const criticFeedback = await callAI(SYSTEM_PROMPTS.critic, JSON.stringify(currentPlan), apiKey);
      currentPlan = await callAI(
        SYSTEM_PROMPTS.refactor,
        `Original plan: ${JSON.stringify(currentPlan)}\nCritic feedback: ${JSON.stringify(criticFeedback)}`,
        apiKey
      );
      changes.push(`Iteration ${iteration}: Applied critic feedback`);
    }
    
    // Step 2: Critique (skip on last iteration)
    if (iteration < maxIterations) {
      statusMessages.push('Проверяю план...');
      const critique = await callAI(SYSTEM_PROMPTS.critic, JSON.stringify(currentPlan), apiKey);
      
      if (critique.approved) {
        approved = true;
        statusMessages.push('Проверка пройдена!');
      } else {
        statusMessages.push('Обнаружены проблемы, исправляю...');
        changes.push(`Found ${critique.issues?.length || 0} issues to fix`);
      }
    }
  }
  
  statusMessages.push('Готово!');
  
  return {
    plan: JSON.stringify(currentPlan, null, 2),
    iterations: iteration,
    status: approved ? 'success' : iteration === maxIterations ? 'partial' : 'failed',
    changes,
    statusMessages
  };
}

async function callAI(systemPrompt: string, userMessage: string, apiKey: string): Promise<any> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.href,
        'X-Title': 'Ascend Fitness App'
      },
      body: JSON.stringify({
        model: 'poolside/laguna-s-2.1:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(content);
    } catch {
      // If not JSON, return as text
      return { content, raw: true };
    }
  } catch (error) {
    console.error('AI call failed:', error);
    throw error;
  }
}

export type { ReflectionResult };

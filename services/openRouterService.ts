export interface SymptomAnalysisRequest {
  symptoms: string;
  trimester: string;
  additionalContext?: string;
}

export interface SymptomAnalysisResponse {
  validation: string;
  safetyRating: 'Green' | 'Amber' | 'Red';
  explanation: string;
  action: string;
  medicalNote: string;
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

class OpenRouterService {
  private apiKey: string | null = null;
  private baseURL = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    // Initialize API key from environment or localStorage
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string | null {
    // Try to get API key from various sources
    const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (envKey) return envKey;

    const storedKey = localStorage.getItem('openrouter_api_key');
    if (storedKey) return storedKey;

    return null;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('openrouter_api_key', apiKey);
  }

  public hasApiKey(): boolean {
    return !!this.apiKey;
  }

  public clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem('openrouter_api_key');
  }

  private getMedicalPrompt(symptoms: string, trimester: string): string {
    return `You are a medical AI assistant specializing in pregnancy symptom analysis. Analyze the following symptoms for a patient in ${trimester} trimester:

Symptoms: "${symptoms}"

Provide a structured analysis with the following format:
1. Validation: A compassionate, validating statement acknowledging their symptoms
2. Safety Rating: Rate as "Green" (mild/common), "Amber" (moderate concern/monitor), or "Red" (urgent/seek immediate care)
3. Explanation: Medical context about what these symptoms might indicate in pregnancy
4. Action Step: Specific, immediate guidance on what to do
5. Medical Note: Clear guidance on when to contact their healthcare provider

IMPORTANT GUIDELINES:
- Always prioritize safety - when in doubt, recommend professional medical consultation
- Be clear about what requires immediate attention vs what can wait
- Include specific red flags that warrant emergency care
- Maintain a supportive but medically responsible tone
- Consider the trimester context in your analysis
- Never give definitive diagnoses - always recommend professional consultation for concerns

Respond in JSON format with these exact keys: validation, safetyRating, explanation, action, medicalNote`;
  }

  async analyzeSymptoms(request: SymptomAnalysisRequest): Promise<SymptomAnalysisResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured. Please add your API key in settings.');
    }

    try {
      const prompt = this.getMedicalPrompt(request.symptoms, request.trimester);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Nestly Pregnancy Symptom Analyzer'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData: OpenRouterError = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response received from AI service');
      }

      // Parse the JSON response
      let analysis: SymptomAnalysisResponse;
      try {
        analysis = JSON.parse(content);
      } catch (parseError) {
        // If JSON parsing fails, extract from markdown or plain text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid response format from AI service');
        }
      }

      // Validate response structure
      const requiredFields = ['validation', 'safetyRating', 'explanation', 'action', 'medicalNote'];
      for (const field of requiredFields) {
        if (!(field in analysis)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate safety rating
      if (!['Green', 'Amber', 'Red'].includes(analysis.safetyRating)) {
        throw new Error('Invalid safety rating in response');
      }

      return analysis;

    } catch (error) {
      console.error('OpenRouter API Error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to analyze symptoms. Please try again.');
    }
  }

  // Test connection with a simple request
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const openRouterService = new OpenRouterService();

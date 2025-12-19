
export interface Calculation {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export type CalculatorMode = 'standard' | 'ai';

export interface AIResponse {
  answer: string;
  explanation: string[];
  steps?: string[];
}

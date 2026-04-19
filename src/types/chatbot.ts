export interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ChatContext;
}

export interface ChatContext {
  churnRate?: number;
  highRiskCount?: number;
  mediumRiskCount?: number;
  lowRiskCount?: number;
  topDrivers?: string[];
  actions?: { title: string; id: string }[];
  segments?: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  chartData?: {
    type: string;
    feature?: string;
    value?: number;
    segment?: string;
    description?: string;
  };
}
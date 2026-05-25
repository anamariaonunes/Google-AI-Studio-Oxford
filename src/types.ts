export interface MeetingFile {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'pptx' | 'other';
  status: 'Extracting' | 'Completed' | 'Extraction Failed';
  extractedText: string;
}

export interface MeetingDecision {
  decision: string;
  owner: string;
  deadline: string;
}

export interface MeetingRiskItem {
  risk: string;
  impact: string;
  severity: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

export interface MeetingTalkingPoints {
  internal: string[];
  stakeholder_client: string[];
  leadership: string[];
}

export interface MeetingNextStepItem {
  action_item: string;
  owner: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface MeetingIntelligence {
  key_takeaways: string[];
  meeting_summary: string[];
  decisions: MeetingDecision[];
  risks_concerns: MeetingRiskItem[];
  talking_points: MeetingTalkingPoints;
  next_steps: MeetingNextStepItem[];
  open_questions: string[];
  follow_up_message: string;
}

export interface MeetingBatch {
  id: string;
  title: string;
  createdAt: string;
  lastUpdated: string;
  status: 'Extracting' | 'Processing' | 'Completed' | 'Draft' | 'Needs Review' | 'Extraction Failed';
  files: MeetingFile[];
  intelligence?: MeetingIntelligence;
  folder?: string;
}

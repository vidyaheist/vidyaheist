
export type QuestionOption = {
  id: string;
  text: string;
};

export type QuestionType = {
  id: string;
  text: string;
  options: QuestionOption[];
  correctAnswerId: string;
  topic: string | null;
  subject?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TestSeriesType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  subject: string | null;
  numberOfTests?: number | null;
  durationPerTest?: number | null;
  questions?: QuestionType[];
  data_ai_hint?: string | null;
  createdBy?: string | null;
  createdAt?: any; 
  updatedAt?: any; 
};

export type UserAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  isAnswered: boolean;
  visited: boolean;
};

export type ExamPhase = 'instructions' | 'taking' | 'summary' | 'review' | 'loading' | 'error';

export type AdminOptionType = {
  id: string;
  text: string;
};

export type AdminQuestionType = {
  id: string;
  text: string;
  topic: string | null;
  subject: string | null;
  options: AdminOptionType[];
  correctAnswerId: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TestSeriesFullType = TestSeriesType & {
  questions?: AdminQuestionType[];
};

export type PurchaseType = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  seriesId: string;
  seriesName: string;
  amount: number;
  utr: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: any;
};

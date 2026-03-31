
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
  imageUrl?: string | null;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type TestType = {
  id: string;
  name: string;
  duration: number;
  order: number;
  createdAt?: any;
  updatedAt?: any;
  questions?: QuestionType[];
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
  data_ai_hint?: string | null;
  createdBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  tests?: TestType[];
};

export type UserAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  isAnswered: boolean;
  visited: boolean;
  explanation?: string; // Persistent AI-generated explanation
};

export type ExamPhase = 'instructions' | 'taking' | 'summary' | 'review' | 'loading' | 'error';

export type AdminOptionType = {
  id: string;
  text: string;
};

export type AdminQuestionType = QuestionType;

export type TestSeriesFullType = TestSeriesType & {
  tests?: TestType[];
  questions?: QuestionType[]; // Fallback for flattened legacy checks
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

export type TestResult = {
  id: string;
  userId: string;
  userName: string;
  testId: string;
  testName: string;
  seriesId: string;
  score: number;
  totalQuestions: number;
  timeTaken: number; // in seconds
  answers: { questionId: string; selectedOptionId: string | null }[];
  createdAt: any;
};

export type ExamProgress = {
  userId: string;
  testId: string;
  testName: string;
  answers: { questionId: string; selectedOptionId: string | null; isMarkedForReview: boolean }[];
  timeLeft: number;
  updatedAt: any;
};

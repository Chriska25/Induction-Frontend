export interface Section {
  id: string;
  title: string;
  subtitle: string;
  content: ContentItem[];
}

export interface ContentItem {
  type: 'paragraph' | 'heading' | 'list' | 'steps' | 'checklist' | 'faq' | 'image';
  text?: string;
  items?: string[] | FAQItem[];
  src?: string;
  alt?: string;
  caption?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  timeLimit?: number; // seconds
}

export interface QuizData {
  title: string;
  instructions: string;
  timeLimit?: number; // in minutes
  questions: QuizQuestion[];
}

export interface CertificateData {
  title: string;
  subtitle: string;
  successMessage: string;
  logoText: string;
  leftLogoUrl?: string;
  rightLogoUrl?: string;
  signatureName?: string;
  signatureTitle?: string;
  signatureImage?: string;
  partnerLogos?: string[];
}

export interface ContentData {
  appTitle: string;
  sections: Section[];
  quiz: QuizData;
  certificate: CertificateData;
}

export interface RegistrationData {
  fullName: string;
  jobTitle: string;
  organization: string;
  email: string;
  city: string;
  registeredAt: string;
  id: string;
  role?: string;
}

export interface ActivityData {
  registrationId?: string;
  fullName: string;
  type: 'quiz';
  score: number;
  completedAt: string;
}

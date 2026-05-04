export type CaptureContentType = 'text' | 'voice' | 'link' | 'image' | 'email';
export type CaptureSource = 'app' | 'email' | 'shortcut' | 'bookmarklet' | 'sms' | 'ifttt';
export type ClassificationStatus = 'pending' | 'classified' | 'needs_review';
export type ModuleName = 'mind' | 'flow' | 'body' | 'hub';
export type PARACategory = 'projects' | 'areas' | 'resources' | 'archives';
export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface CaptureItem {
  id: string;
  userId: string;
  content: string;
  contentType: CaptureContentType;
  capturedAt: Date;
  source: CaptureSource;
  classificationStatus: ClassificationStatus;
  classifiedAs?: {
    module: ModuleName;
    type: string;
    confidence: number;
  };
  tags: string[];
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  area?: string;
  deadline: Date;
  status: ProjectStatus;
  tasks: string[];
}

export interface KnowledgeItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  paraCategory: PARACategory;
  tags: string[];
  lastAccessedAt: Date;
  relatedProjectIds?: string[];
}

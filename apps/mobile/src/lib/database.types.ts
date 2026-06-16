import type {
  Profile,
  Nurse,
  Family,
  Booking,
  CareRequest,
  CareRequestApplication,
  IncidentReport,
  UserBlock,
  Availability,
  Message,
  Review,
  UserRole,
  VerificationStatus,
  BookingStatus,
  Shift,
  ProviderType,
  PatientCondition,
  BudgetRange,
  CareRequestStatus,
  ApplicationStatus,
  IncidentReportStatus,
} from '@hanapkalinga/shared/types';

export type {
  Profile,
  Nurse,
  Family,
  Booking,
  CareRequest,
  CareRequestApplication,
  IncidentReport,
  UserBlock,
  Availability,
  Message,
  Review,
  UserRole,
  VerificationStatus,
  BookingStatus,
  Shift,
  ProviderType,
  PatientCondition,
  BudgetRange,
  CareRequestStatus,
  ApplicationStatus,
  IncidentReportStatus,
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      nurses: {
        Row: Nurse;
        Insert: Omit<Nurse, 'verification_status' | 'verified_at'>;
        Update: Partial<Omit<Nurse, 'id'>>;
      };
      families: {
        Row: Family;
        Insert: Omit<Family, 'id'>;
        Update: Partial<Omit<Family, 'id'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'status'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
      care_requests: {
        Row: CareRequest;
        Insert: Omit<CareRequest, 'id' | 'created_at' | 'updated_at' | 'status'>;
        Update: Partial<Omit<CareRequest, 'id' | 'created_at'>>;
      };
      care_request_applications: {
        Row: CareRequestApplication;
        Insert: Omit<CareRequestApplication, 'id' | 'created_at' | 'status'>;
        Update: Partial<Omit<CareRequestApplication, 'id' | 'created_at'>>;
      };
      availability: {
        Row: Availability;
        Insert: Omit<Availability, 'id'>;
        Update: Partial<Omit<Availability, 'id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: Partial<Omit<Review, 'id' | 'created_at'>>;
      };
      incident_reports: {
        Row: IncidentReport;
        Insert: Omit<IncidentReport, 'id' | 'created_at' | 'status' | 'reviewed_at' | 'admin_notes'>;
        Update: Partial<Omit<IncidentReport, 'id' | 'created_at'>>;
      };
      user_blocks: {
        Row: UserBlock;
        Insert: Omit<UserBlock, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}

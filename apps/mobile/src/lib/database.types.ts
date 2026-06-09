import type {
  Profile,
  Nurse,
  Family,
  Booking,
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
} from '@hanapkalinga/shared/types';

export type {
  Profile,
  Nurse,
  Family,
  Booking,
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
    };
  };
}

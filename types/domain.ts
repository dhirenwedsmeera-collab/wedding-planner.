export type UserRole = "admin" | "family" | "volunteer";
export type WeddingSide = "bride" | "groom" | "both";

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "not_started" | "in_progress" | "waiting" | "blocked" | "completed" | "cancelled";

export type BookingStatus = "not_booked" | "enquired" | "negotiating" | "booked" | "confirmed" | "cancelled";
export type BookingCategory =
  | "makeup_artist" | "clothes_tailor" | "decoration" | "catering" | "photographer"
  | "videographer" | "mehendi_artist" | "dj_sound" | "lighting" | "transportation"
  | "venue" | "flowers" | "jeweler" | "invitation_printing" | "accommodation" | "other";

export type RsvpStatus = "pending" | "confirmed" | "declined" | "no_response";
export type GuestCategory = "family" | "friend" | "vip";
export type VendorCategory =
  | "photographer" | "decorator" | "catering" | "makeup" | "mehendi_artist"
  | "dj" | "venue" | "flowers" | "jeweler" | "other";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  side: WeddingSide | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface WeddingEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  color_theme: string;
  icon: string | null;
  is_archived: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  event_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completion_pct: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignees?: Profile[];
}

export interface ShoppingItem {
  id: string;
  event_id: string | null;
  name: string;
  category: string;
  quantity: number;
  budget: number;
  actual_price: number | null;
  store: string | null;
  is_purchased: boolean;
  assigned_to: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface BudgetLine {
  id: string;
  event_id: string | null;
  category: string;
  planned_amount: number;
  notes: string | null;
}

export interface Expense {
  id: string;
  budget_line_id: string | null;
  event_id: string | null;
  description: string;
  amount: number;
  paid_to: string | null;
  paid_by: string | null;
  expense_date: string;
  receipt_url: string | null;
}

export interface Guest {
  id: string;
  full_name: string;
  category: GuestCategory;
  side: WeddingSide;
  phone: string | null;
  email: string | null;
  rsvp_status: RsvpStatus;
  invitation_sent: boolean;
  food_preference: string | null;
  plus_ones: number;
  notes: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  phone: string | null;
  email: string | null;
  advance_paid: number;
  balance_due: number;
  rating: number | null;
  notes: string | null;
}

export interface Booking {
  id: string;
  vendor_name: string;
  category: BookingCategory;
  event_id: string | null;
  status: BookingStatus;
  booking_date: string | null;
  contract_signed: boolean;
  advance_paid: number;
  balance_due: number;
  final_payment_due: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  trial_scheduled_at: string | null;
  fitting_dates: string[] | null;
  notes: string | null;
  contract_url: string | null;
  created_at: string;
  updated_at: string;
}

export const BOOKING_LEAD_TIME_DAYS: Record<BookingCategory, number> = {
  venue: 270, catering: 270,
  photographer: 240, videographer: 240,
  decoration: 180, jeweler: 180,
  accommodation: 150,
  dj_sound: 120, mehendi_artist: 120, lighting: 120, clothes_tailor: 120,
  makeup_artist: 105,
  transportation: 90, invitation_printing: 90, other: 90,
  flowers: 60,
};

export const BOOKING_CATEGORY_LABELS: Record<BookingCategory, string> = {
  makeup_artist: "Makeup Artist",
  clothes_tailor: "Wedding Clothes / Tailor",
  decoration: "Decoration",
  catering: "Food Catering",
  photographer: "Photographer",
  videographer: "Videographer",
  mehendi_artist: "Mehendi Artist",
  dj_sound: "DJ / Sound",
  lighting: "Lighting",
  transportation: "Transportation",
  venue: "Venue",
  flowers: "Flowers",
  jeweler: "Jeweler",
  invitation_printing: "Invitation Cards Printing",
  accommodation: "Accommodation / Guest Hotel",
  other: "Others",
};

export interface WeddingSettings {
  id: boolean;
  wedding_date: string | null;
  wedding_date_is_confirmed: boolean;
  registry_wedding_date: string | null;
  notes: string | null;
}

export type DecisionStatus = "pending" | "decided";

export interface KeyDecision {
  id: string;
  label: string;
  status: DecisionStatus;
  answer: string | null;
  category: string | null;
  sort_order: number;
}

export type SectionItemStatus = "needed" | "sorted";

export interface EventSection {
  id: string;
  event_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface EventSectionItem {
  id: string;
  section_id: string;
  label: string;
  status: SectionItemStatus;
  assigned_to: string | null;
  notes: string | null;
  sort_order: number;
  created_by: string | null;
}

export const EVENT_GRADIENTS: Record<string, string> = {
  mehendi: "bg-mehendi-gradient",
  haldi: "bg-haldi-gradient",
  nikah: "bg-nikah-gradient",
  reception: "bg-reception-gradient",
  emerald: "bg-emerald-gold",
};

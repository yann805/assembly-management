export type RoleName = 'GENERAL_TREASURY' | 'ASSEMBLY_LEADER' | 'ASSEMBLY_TREASURER';

export interface UserRole {
  name: RoleName;
  assemblyId?: string;
  assemblyName?: string;
}

export interface User {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  roles: UserRole[];
  member?: {
    id: string;
    fullName: string;
  } | null;
}

export interface ManagedUser extends Omit<User, 'roles'> {
  createdAt: string;
  roleAssignments: Array<{
    role: { name: RoleName; description?: string | null };
    assembly: { id: string; name: string } | null;
  }>;
}

export interface MemberFidelity {
  memberId: string;
  totalMonths: number;
  titheFidelity: {
    monthsWithTithe: Array<{ month: number; year: number; amount: number }>;
    monthsWithoutTithe: Array<{ month: number; year: number }>;
    rate: number;
    cumulated: number;
  };
  offeringFidelity: {
    monthsWithOffering: Array<{ month: number; year: number; amount: number }>;
    monthsWithoutOffering: Array<{ month: number; year: number }>;
    rate: number;
    cumulated: number;
  };
  summary: { totalCumulated: number; globalFidelityRate: number };
}

export interface AssemblyMemberContributionStats {
  membershipId: string;
  memberId: string;
  memberName: string;
  memberStatus: 'ACTIVE' | 'INACTIVE';
  membershipStatus: 'ACTIVE' | 'INACTIVE';
  totalTithes: number;
  totalOfferings: number;
  totalAmount: number;
  totalMonths: number;
  globalFidelityRate: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Assembly {
  id: string;
  name: string;
  location?: string;
  description?: string;
  creationDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  memberships?: any[];
  responsibilities?: any[];
  _count?: { memberships: number };
}

export interface Member {
  id: string;
  fullName: string;
  gender?: 'M' | 'F' | null;
  dateOfBirth?: string | null;
  conversionDate?: string | null;
  waterBaptismDate?: string | null;
  holySpiritBaptismDate?: string | null;
  profession?: string | null;
  arrivalDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  contacts?: MemberContact[];
  memberships?: Array<{ assembly: Assembly; status: string }>;
  maritalStatus?: { id: string; name: string } | null;
  filiere?: { id: string; name: string } | null;
  level?: { id: string; name: string } | null;
  user?: { id: string; email: string | null; isActive: boolean } | null;
}

export interface MemberContact {
  id: string;
  contactValue: string;
  contactType: 'PHONE' | 'EMAIL' | 'ADDRESS';
  isPrimary: boolean;
}

export interface OfferingCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  _count?: { allocations: number };
}

export interface ContributionAllocation {
  id: string;
  categoryId: string;
  amount: number;
  category?: OfferingCategory;
}

export interface Contribution {
  id: string;
  membershipId: string;
  paymentDate: string;
  titheAmount: number;
  offeringAmount: number;
  totalAmount: number;
  recordedBy: string;
  note?: string;
  allocations: ContributionAllocation[];
  membership?: { member: Member; assembly: Assembly };
  recorder?: { id: string; fullName: string };
}

export interface MonthlyReport {
  id: string;
  assemblyId: string;
  month: number;
  year: number;
  totalTithes: number;
  totalOfferings: number;
  totalAmount: number;
  totalMembers: number;
  activeMembers?: number;
  contributingMembers: number;
  submittedBy: string;
  submittedAt?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'CONFIRMED';
  createdAt: string;
  assembly?: Assembly;
  submitter?: { id: string; fullName: string };
  categoryTotals?: Array<{
    id: string;
    categoryId?: string;
    categoryNameSnapshot: string;
    totalAmount: number;
    category?: OfferingCategory | null;
  }>;
  confirmations?: Array<{
    id: string;
    confirmedBy: string;
    reportedAmount: number;
    receivedAmount: number;
    confirmedAt: string;
    notes?: string;
    confirmer?: { fullName: string };
  }>;
}

export interface DashboardData {
  scope: 'general' | 'treasurer' | 'none';
  filters?: { assemblyId?: string; month?: number; year?: number };
  indicators: {
    totalAssemblies?: number;
    activeAssemblies?: number;
    totalMembers: number;
    totalTreasurers?: number;
    totalLeaders?: number;
    newMembers?: number;
    activeMembers?: number;
    contributionsCount: number;
    totalTithes: number;
    totalOfferings: number;
    totalAmount: number;
    reportsSubmitted?: number;
    reportsConfirmed?: number;
    confirmedReceivedAmount?: number;
  };
  categoryStats?: Array<{ id: string; name: string; total: number }>;
  monthlyStats?: Array<{
    month: number;
    newMembers: number;
    tithes: number;
    offerings: number;
    total: number;
  }>;
  assemblyStats?: Array<{
    id: string;
    name: string;
    status: string;
    activeMembers: number;
    totalAmount: number;
  }>;
  recentReports?: MonthlyReport[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

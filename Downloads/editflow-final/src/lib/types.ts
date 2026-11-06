export type ProjectStatus =
  | "New Request"
  | "Pending"
  | "In Progress"
  | "Awaiting Client Feedback"
  | "Revision Requested"
  | "Completed"
  | "On Hold"
  | "Cancelled";

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Paid"
  | "Partially Paid"
  | "Overdue";

export type Priority = "Normal" | "Urgent";

export type Client = {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  createdAt: string;
};

export type Project = {
  id: string;
  projectId: string;
  clientName: string;
  companyName?: string;
  email: string;
  phone?: string;
  projectName: string;
  description: string;
  requirements: string;
  driveLink: string;
  referenceLink?: string;
  expectedDuration: string;
  rawFootageDuration?: string;
  estimatedPrice?: number;
  calculatedPrice?: number;
  manualPriceOverride?: number | null;
  videoFormat: string;
  editingType: string;
  requiredDeliverables: string;
  expectedDeliveryDate: string;
  priority: Priority;
  submissionDate: string;
  status: ProjectStatus;
  adminNotes: string;
  billingMonth: string;
  finalAmount: number;
  billable: boolean;
  isTrial?: boolean;
  paid?: boolean;
  paidAt?: string;
  finalDurationSeconds?: number;
  createdAt: string;
  updatedAt: string;
};

export type PricingSettings = {
  id: string;
  twoMinuteBaseRate: number;
  baseDurationSeconds?: number;
  fourMinuteReferenceRate: number;
  perSecondIncrementalRate: number;
  minimumCharge: number;
  additionalServiceCharges: number;
  discounts: number;
  taxRate: number;
  updatedAt: string;
};

export type InvoiceLineItem = {
  id: string;
  projectId: string;
  projectName: string;
  durationSeconds: number;
  durationText?: string;
  price: number;
  rateSnapshot: PricingSettings;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  billingMonth: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  notes: string;
  subtotal: number;
  adjustments: number;
  tax: number;
  total: number;
  paymentReceived: number;
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: "project" | "invoice" | "payment" | "deadline" | "alert";
  createdAt: string;
  read: boolean;
};

export type ActivityLog = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};

export type AppData = {
  clients: Client[];
  projects: Project[];
  pricingSettings: PricingSettings;
  invoices: Invoice[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
};

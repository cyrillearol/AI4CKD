import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("doctor"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: varchar("gender", { length: 10 }).notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  medicalHistory: jsonb("medical_history").$type<string[]>().default([]),
  ckdStage: integer("ckd_stage").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const consultations = pgTable("consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  creatinine: decimal("creatinine", { precision: 4, scale: 2 }),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  systolicBP: integer("systolic_bp"),
  diastolicBP: integer("diastolic_bp"),
  notes: text("notes"),
  doctorName: text("doctor_name").notNull().default("Dr. Kouakou"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  consultationId: varchar("consultation_id").references(() => consultations.id),
  type: varchar("type", { length: 50 }).notNull(), // 'creatinine', 'blood_pressure', 'weight_loss'
  severity: varchar("severity", { length: 20 }).notNull(), // 'critical', 'high', 'warning'
  message: text("message").notNull(),
  value: text("value").notNull(),
  threshold: text("threshold").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertThresholds = pgTable("alert_thresholds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  type: varchar("type", { length: 50 }).notNull(),
  criticalValue: decimal("critical_value", { precision: 10, scale: 2 }),
  highValue: decimal("high_value", { precision: 10, scale: 2 }),
  warningValue: decimal("warning_value", { precision: 10, scale: 2 }),
  isGlobal: boolean("is_global").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  consultations: many(consultations),
  alerts: many(alerts),
  thresholds: many(alertThresholds),
}));

export const consultationsRelations = relations(consultations, ({ one, many }) => ({
  patient: one(patients, {
    fields: [consultations.patientId],
    references: [patients.id],
  }),
  alerts: many(alerts),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  patient: one(patients, {
    fields: [alerts.patientId],
    references: [patients.id],
  }),
  consultation: one(consultations, {
    fields: [alerts.consultationId],
    references: [consultations.id],
  }),
}));

export const alertThresholdsRelations = relations(alertThresholds, ({ one }) => ({
  patient: one(patients, {
    fields: [alertThresholds.patientId],
    references: [patients.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.string().transform((str) => new Date(str)),
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertAlertThresholdSchema = createInsertSchema(alertThresholds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlertThreshold = z.infer<typeof insertAlertThresholdSchema>;

// Extended types with relations
export type PatientWithRelations = Patient & {
  consultations: Consultation[];
  alerts: Alert[];
  thresholds: AlertThreshold[];
};

export type AlertWithPatient = Alert & {
  patient: Patient;
  consultation?: Consultation;
};

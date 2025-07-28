import { patients, consultations, alerts, alertThresholds, type Patient, type InsertPatient, type Consultation, type InsertConsultation, type Alert, type InsertAlert, type AlertThreshold, type InsertAlertThreshold, type PatientWithRelations, type AlertWithPatient } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Patients
  getPatient(id: string): Promise<Patient | undefined>;
  getPatients(): Promise<Patient[]>;
  getPatientWithRelations(id: string): Promise<PatientWithRelations | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient>;

  // Consultations
  getConsultation(id: string): Promise<Consultation | undefined>;
  getConsultations(): Promise<Consultation[]>;
  getConsultationsByPatientId(patientId: string): Promise<Consultation[]>;
  getRecentConsultations(limit?: number): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;

  // Alerts
  getAlert(id: string): Promise<Alert | undefined>;
  getAlerts(): Promise<AlertWithPatient[]>;
  getUnreadAlerts(): Promise<AlertWithPatient[]>;
  getAlertsByPatientId(patientId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<Alert>;

  // Alert Thresholds
  getAlertThresholds(): Promise<AlertThreshold[]>;
  getPatientThresholds(patientId: string): Promise<AlertThreshold[]>;
  getGlobalThresholds(): Promise<AlertThreshold[]>;
  createOrUpdateThreshold(threshold: InsertAlertThreshold): Promise<AlertThreshold>;

  // Statistics
  getPatientStats(): Promise<{
    totalPatients: number;
    todayConsultations: number;
    activeAlerts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatientWithRelations(id: string): Promise<PatientWithRelations | undefined> {
    const patient = await this.getPatient(id);
    if (!patient) return undefined;

    const patientConsultations = await this.getConsultationsByPatientId(id);
    const patientAlerts = await this.getAlertsByPatientId(id);
    const patientThresholds = await this.getPatientThresholds(id);

    return {
      ...patient,
      consultations: patientConsultations,
      alerts: patientAlerts,
      thresholds: patientThresholds,
    };
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values({
      ...patient,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newPatient;
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient> {
    const updateData = { ...patient, updatedAt: new Date() };
    const [updatedPatient] = await db
      .update(patients)
      .set(updateData)
      .where(eq(patients.id, id))
      .returning();
    return updatedPatient;
  }

  async getConsultation(id: string): Promise<Consultation | undefined> {
    const [consultation] = await db.select().from(consultations).where(eq(consultations.id, id));
    return consultation || undefined;
  }

  async getConsultations(): Promise<Consultation[]> {
    return await db.select().from(consultations).orderBy(desc(consultations.date));
  }

  async getConsultationsByPatientId(patientId: string): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.date));
  }

  async getRecentConsultations(limit = 10): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .orderBy(desc(consultations.date))
      .limit(limit);
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [newConsultation] = await db.insert(consultations).values(consultation).returning();
    return newConsultation;
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async getAlerts(): Promise<AlertWithPatient[]> {
    const result = await db
      .select({
        alert: alerts,
        patient: patients,
        consultation: consultations,
      })
      .from(alerts)
      .leftJoin(patients, eq(alerts.patientId, patients.id))
      .leftJoin(consultations, eq(alerts.consultationId, consultations.id))
      .orderBy(desc(alerts.createdAt));

    return result.map(({ alert, patient, consultation }) => ({
      ...alert,
      patient: patient!,
      consultation: consultation || undefined,
    }));
  }

  async getUnreadAlerts(): Promise<AlertWithPatient[]> {
    const result = await db
      .select({
        alert: alerts,
        patient: patients,
        consultation: consultations,
      })
      .from(alerts)
      .leftJoin(patients, eq(alerts.patientId, patients.id))
      .leftJoin(consultations, eq(alerts.consultationId, consultations.id))
      .where(eq(alerts.isRead, false))
      .orderBy(desc(alerts.createdAt));

    return result.map(({ alert, patient, consultation }) => ({
      ...alert,
      patient: patient!,
      consultation: consultation || undefined,
    }));
  }

  async getAlertsByPatientId(patientId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.patientId, patientId))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async markAlertAsRead(id: string): Promise<Alert> {
    const [updatedAlert] = await db
      .update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }

  async getAlertThresholds(): Promise<AlertThreshold[]> {
    return await db.select().from(alertThresholds).orderBy(alertThresholds.type);
  }

  async getPatientThresholds(patientId: string): Promise<AlertThreshold[]> {
    return await db
      .select()
      .from(alertThresholds)
      .where(eq(alertThresholds.patientId, patientId))
      .orderBy(alertThresholds.type);
  }

  async getGlobalThresholds(): Promise<AlertThreshold[]> {
    return await db
      .select()
      .from(alertThresholds)
      .where(eq(alertThresholds.isGlobal, true))
      .orderBy(alertThresholds.type);
  }

  async createOrUpdateThreshold(threshold: InsertAlertThreshold): Promise<AlertThreshold> {
    const existing = await db
      .select()
      .from(alertThresholds)
      .where(
        and(
          eq(alertThresholds.type, threshold.type),
          threshold.patientId 
            ? eq(alertThresholds.patientId, threshold.patientId)
            : eq(alertThresholds.isGlobal, true)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(alertThresholds)
        .set({ ...threshold, updatedAt: new Date() })
        .where(eq(alertThresholds.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(alertThresholds).values(threshold).returning();
      return created;
    }
  }

  async getPatientStats(): Promise<{
    totalPatients: number;
    todayConsultations: number;
    activeAlerts: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatientsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients);

    const [todayConsultationsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(consultations)
      .where(and(
        gte(consultations.date, today),
        lte(consultations.date, tomorrow)
      ));

    const [activeAlertsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(eq(alerts.isRead, false));

    return {
      totalPatients: totalPatientsResult.count,
      todayConsultations: todayConsultationsResult.count,
      activeAlerts: activeAlertsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();

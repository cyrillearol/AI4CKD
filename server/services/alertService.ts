import { storage } from "../storage";
import { type Consultation, type InsertAlert } from "@shared/schema";

interface AlertRule {
  type: string;
  checkFunction: (consultation: Consultation, previousConsultations: Consultation[]) => Promise<InsertAlert | null>;
}

class AlertService {
  private rules: AlertRule[] = [
    {
      type: "creatinine",
      checkFunction: this.checkCreatinine.bind(this),
    },
    {
      type: "blood_pressure",
      checkFunction: this.checkBloodPressure.bind(this),
    },
    {
      type: "weight_loss",
      checkFunction: this.checkWeightLoss.bind(this),
    },
  ];

  async checkAndCreateAlerts(consultation: Consultation): Promise<void> {
    const previousConsultations = await storage.getConsultationsByPatientId(consultation.patientId);
    
    for (const rule of this.rules) {
      const alert = await rule.checkFunction(consultation, previousConsultations);
      if (alert) {
        await storage.createAlert(alert);
      }
    }
  }

  private async checkCreatinine(consultation: Consultation, previousConsultations: Consultation[]): Promise<InsertAlert | null> {
    if (!consultation.creatinine) return null;

    const thresholds = await this.getThresholds("creatinine", consultation.patientId);
    const creatinineValue = parseFloat(consultation.creatinine);

    if (thresholds.criticalValue && creatinineValue >= parseFloat(thresholds.criticalValue)) {
      return {
        patientId: consultation.patientId,
        consultationId: consultation.id,
        type: "creatinine",
        severity: "critical",
        message: `Créatinine critique: ${creatinineValue} mg/dL (seuil: ${thresholds.criticalValue})`,
        value: creatinineValue.toString(),
        threshold: thresholds.criticalValue,
      };
    }

    if (thresholds.highValue && creatinineValue >= parseFloat(thresholds.highValue)) {
      return {
        patientId: consultation.patientId,
        consultationId: consultation.id,
        type: "creatinine",
        severity: "high",
        message: `Créatinine élevée: ${creatinineValue} mg/dL (seuil: ${thresholds.highValue})`,
        value: creatinineValue.toString(),
        threshold: thresholds.highValue,
      };
    }

    return null;
  }

  private async checkBloodPressure(consultation: Consultation, previousConsultations: Consultation[]): Promise<InsertAlert | null> {
    if (!consultation.systolicBP || !consultation.diastolicBP) return null;

    const systolic = consultation.systolicBP;
    const diastolic = consultation.diastolicBP;

    // Check against standard hypertension thresholds
    if (systolic >= 180 || diastolic >= 110) {
      return {
        patientId: consultation.patientId,
        consultationId: consultation.id,
        type: "blood_pressure",
        severity: "critical",
        message: `Tension artérielle critique: ${systolic}/${diastolic} mmHg`,
        value: `${systolic}/${diastolic}`,
        threshold: "180/110",
      };
    }

    if (systolic >= 160 || diastolic >= 100) {
      return {
        patientId: consultation.patientId,
        consultationId: consultation.id,
        type: "blood_pressure",
        severity: "high",
        message: `Tension artérielle élevée: ${systolic}/${diastolic} mmHg`,
        value: `${systolic}/${diastolic}`,
        threshold: "160/100",
      };
    }

    return null;
  }

  private async checkWeightLoss(consultation: Consultation, previousConsultations: Consultation[]): Promise<InsertAlert | null> {
    if (!consultation.weight || previousConsultations.length === 0) return null;

    const currentWeight = parseFloat(consultation.weight);
    const sortedConsultations = previousConsultations
      .filter(c => c.weight)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedConsultations.length === 0) return null;

    const previousWeight = parseFloat(sortedConsultations[0].weight!);
    const weightDifference = previousWeight - currentWeight;
    
    // Check for significant weight loss (more than 2kg in recent consultation)
    if (weightDifference >= 2) {
      const daysDifference = Math.ceil((new Date(consultation.date).getTime() - new Date(sortedConsultations[0].date).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference <= 14) { // Within 2 weeks
        return {
          patientId: consultation.patientId,
          consultationId: consultation.id,
          type: "weight_loss",
          severity: daysDifference <= 7 ? "critical" : "high",
          message: `Perte de poids rapide: -${weightDifference.toFixed(1)}kg en ${daysDifference} jours`,
          value: (-weightDifference).toString(),
          threshold: "-2kg/14jours",
        };
      }
    }

    return null;
  }

  private async getThresholds(type: string, patientId: string) {
    const patientThresholds = await storage.getPatientThresholds(patientId);
    const globalThresholds = await storage.getGlobalThresholds();
    
    const patientThreshold = patientThresholds.find(t => t.type === type);
    const globalThreshold = globalThresholds.find(t => t.type === type);
    
    return patientThreshold || globalThreshold || { criticalValue: null, highValue: null, warningValue: null };
  }
}

export const alertService = new AlertService();

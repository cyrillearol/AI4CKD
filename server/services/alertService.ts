import { storage } from "../storage";
import { type Consultation, type InsertAlert } from "@shared/schema";
import { randomUUID } from "crypto";

class AlertService {
  async checkAndCreateAlerts(consultation: Consultation): Promise<void> {
    console.log("Checking alerts for consultation:", consultation.id);
    
    try {
      // Create default thresholds if none exist
      await this.ensureDefaultThresholds();
      
      // Get thresholds
      const thresholds = await storage.getGlobalThresholds();
      console.log("Available thresholds:", thresholds);
      
      // Check creatinine levels
      if (consultation.creatinine) {
        const creatinineValue = parseFloat(consultation.creatinine.toString());
        console.log("Checking creatinine:", creatinineValue);
        
        // Use default thresholds if none configured
        let severity: string | null = null;
        let thresholdValue: string = '';
        
        if (creatinineValue >= 3.0) {
          severity = 'critical';
          thresholdValue = '3.0';
        } else if (creatinineValue >= 2.0) {
          severity = 'high';
          thresholdValue = '2.0';
        } else if (creatinineValue >= 1.3) {
          severity = 'warning';
          thresholdValue = '1.3';
        }
        
        if (severity) {
          console.log(`Creating creatinine alert with severity: ${severity}`);
          await this.createAlert({
            patientId: consultation.patientId,
            consultationId: consultation.id,
            type: 'creatinine',
            severity,
            message: `Niveau de créatinine ${severity === 'critical' ? 'critique' : severity === 'high' ? 'élevé' : 'anormal'}: ${creatinineValue} mg/dL`,
            value: creatinineValue.toString(),
            threshold: `>${thresholdValue} mg/dL`,
          });
        }
      }
      
      // Check blood pressure
      if (consultation.systolicBP && consultation.diastolicBP) {
        const systolicBP = consultation.systolicBP;
        const diastolicBP = consultation.diastolicBP;
        console.log("Checking BP:", systolicBP, "/", diastolicBP);
        
        let severity: string | null = null;
        let thresholdValue: string = '';
        
        // Check systolic BP with default thresholds
        if (systolicBP >= 180) {
          severity = 'critical';
          thresholdValue = '180';
        } else if (systolicBP >= 160) {
          severity = 'high';  
          thresholdValue = '160';
        } else if (systolicBP >= 140) {
          severity = 'warning';
          thresholdValue = '140';
        }
        
        if (severity) {
          console.log(`Creating BP alert with severity: ${severity}`);
          await this.createAlert({
            patientId: consultation.patientId,
            consultationId: consultation.id,
            type: 'blood_pressure',
            severity,
            message: `Tension artérielle ${severity === 'critical' ? 'critique' : severity === 'high' ? 'élevée' : 'anormale'}: ${systolicBP}/${diastolicBP} mmHg`,
            value: `${systolicBP}/${diastolicBP}`,
            threshold: `>${thresholdValue} mmHg systolique`,
          });
        }
      }
    } catch (error) {
      console.error("Error in checkAndCreateAlerts:", error);
      throw error;
    }
  }

  private async ensureDefaultThresholds(): Promise<void> {
    const existingThresholds = await storage.getGlobalThresholds();
    
    if (existingThresholds.length === 0) {
      console.log("Creating default thresholds...");
      
      // Create default creatinine thresholds
      await storage.createOrUpdateThreshold({
        type: 'creatinine',
        criticalValue: '3.0',
        highValue: '2.0', 
        warningValue: '1.3',
        isGlobal: true,
      });
      
      // Create default blood pressure thresholds
      await storage.createOrUpdateThreshold({
        type: 'blood_pressure',
        criticalValue: '180',
        highValue: '160',
        warningValue: '140',
        isGlobal: true,
      });
    }
  }

  private async createAlert(alertData: Omit<InsertAlert, 'id' | 'createdAt'>): Promise<void> {
    const alert = {
      id: randomUUID(),
      ...alertData,
      createdAt: new Date(),
    };
    
    console.log("Creating alert:", alert);
    await storage.createAlert(alert);
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

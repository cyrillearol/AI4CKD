import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { insertPatientSchema, insertConsultationSchema, insertAlertThresholdSchema } from "@shared/schema";
import { alertService } from "./services/alertService";
// import { pdfService } from "./services/pdfService";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  // Patients routes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatientWithRelations(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, validatedData);
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      await storage.deletePatient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Consultations routes
  app.get("/api/consultations", async (req, res) => {
    try {
      const consultations = await storage.getConsultations();
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consultations" });
    }
  });

  app.get("/api/consultations/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const consultations = await storage.getRecentConsultations(limit);
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent consultations" });
    }
  });

  app.post("/api/consultations", async (req, res) => {
    try {
      console.log("Received consultation data:", req.body);
      
      // Custom validation for consultation
      const consultationData = {
        id: randomUUID(),
        patientId: req.body.patientId,
        creatinine: req.body.creatinine,
        weight: req.body.weight,
        systolicBP: req.body.systolicBP,
        diastolicBP: req.body.diastolicBP,
        notes: req.body.notes || "",
        doctorName: req.body.doctorName,
        date: new Date(),
        createdAt: new Date(),
      };

      console.log("Processed consultation data:", consultationData);
      
      const consultation = await storage.createConsultation(consultationData);
      
      // Check for alerts after creating consultation
      try {
        await alertService.checkAndCreateAlerts(consultation);
      } catch (alertError) {
        console.warn("Alert generation failed:", alertError);
      }
      
      res.status(201).json(consultation);
    } catch (error) {
      console.error("Consultation creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid consultation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create consultation", error: String(error) });
    }
  });

  app.put("/api/consultations/:id", async (req, res) => {
    try {
      const consultationData = {
        patientId: req.body.patientId,
        creatinine: req.body.creatinine,
        weight: req.body.weight,
        systolicBP: req.body.systolicBP,
        diastolicBP: req.body.diastolicBP,
        notes: req.body.notes || "",
        doctorName: req.body.doctorName,
        updatedAt: new Date(),
      };

      const consultation = await storage.updateConsultation(req.params.id, consultationData);
      res.json(consultation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update consultation", error: String(error) });
    }
  });

  app.delete("/api/consultations/:id", async (req, res) => {
    try {
      await storage.deleteConsultation(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete consultation" });
    }
  });

  // Alerts routes
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlertsWithPatients();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des alertes" });
    }
  });

  app.get("/api/alerts/unread", async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlertsWithPatients();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des alertes" });
    }
  });

  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      await storage.markAlertAsRead(req.params.id);
      res.json({ message: "Alerte marquée comme lue" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'alerte" });
    }
  });

  // Alert thresholds routes
  app.get("/api/thresholds", async (req, res) => {
    try {
      const thresholds = await storage.getGlobalThresholds();
      res.json(thresholds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch thresholds" });
    }
  });

  app.get("/api/thresholds/:patientId", async (req, res) => {
    try {
      const thresholds = await storage.getPatientThresholds(req.params.patientId);
      res.json(thresholds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient thresholds" });
    }
  });

  app.post("/api/thresholds", async (req, res) => {
    try {
      const validatedData = insertAlertThresholdSchema.parse(req.body);
      const threshold = await storage.createOrUpdateThreshold(validatedData);
      res.json(threshold);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid threshold data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create/update threshold" });
    }
  });

  // Patient consultations
  app.get("/api/patients/:id/consultations", async (req, res) => {
    try {
      const consultations = await storage.getConsultationsByPatientId(req.params.id);
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient consultations" });
    }
  });

  // Patient alerts
  app.get("/api/patients/:id/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlertsByPatientId(req.params.id);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient alerts" });
    }
  });

  // PDF generation route
  app.get("/api/patients/:id/pdf", async (req, res) => {
    try {
      const patient = await storage.getPatientWithRelations(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Generate beautiful PDF report using PDFKit
      const PDFDocument = require('pdfkit');
      
      // Get consultations and alerts for this patient
      const consultations = await storage.getConsultationsByPatientId(patient.id);
      const alerts = await storage.getAlertsByPatientId(patient.id);
      
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${patient.firstName}-${patient.lastName}.pdf"`);
      
      doc.pipe(res);
      
      // Header with logo placeholder and title
      doc.fontSize(24)
         .fillColor('#2563eb')
         .text('RAPPORT MÉDICAL AI4CKD', 50, 50, { align: 'center' });
      
      doc.fontSize(14)
         .fillColor('#6b7280')
         .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 50, 85, { align: 'center' });
      
      // Patient Information Section
      let yPosition = 130;
      
      doc.fontSize(18)
         .fillColor('#1f2937')
         .text('INFORMATIONS PATIENT', 50, yPosition);
      
      // Add a line under the title
      doc.moveTo(50, yPosition + 25)
         .lineTo(550, yPosition + 25)
         .strokeColor('#e5e7eb')
         .stroke();
      
      yPosition += 40;
      
      // Patient details in a table-like format
      const patientInfo = [
        ['Nom complet:', `${patient.firstName} ${patient.lastName}`],
        ['Date de naissance:', new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')],
        ['Genre:', patient.gender],
        ['Téléphone:', patient.phone || 'Non renseigné'],
        ['Email:', patient.email || 'Non renseigné'],
        ['Adresse:', patient.address || 'Non renseignée'],
        ['Contact d\'urgence:', patient.emergencyContact || 'Non renseigné'],
        ['Stade MRC:', patient.ckdStage ? `Stade ${patient.ckdStage}` : 'Non défini']
      ];
      
      patientInfo.forEach(([label, value]) => {
        doc.fontSize(11)
           .fillColor('#374151')
           .text(label, 50, yPosition, { continued: true, width: 150 })
           .fillColor('#1f2937')
           .text(value, 200, yPosition);
        yPosition += 20;
      });
      
      // Consultations Section
      yPosition += 20;
      doc.fontSize(18)
         .fillColor('#1f2937')
         .text(`HISTORIQUE DES CONSULTATIONS (${consultations.length})`, 50, yPosition);
      
      doc.moveTo(50, yPosition + 25)
         .lineTo(550, yPosition + 25)
         .strokeColor('#e5e7eb')
         .stroke();
      
      yPosition += 40;
      
      if (consultations.length === 0) {
        doc.fontSize(11)
           .fillColor('#6b7280')
           .text('Aucune consultation enregistrée', 50, yPosition);
        yPosition += 30;
      } else {
        consultations.forEach((consultation, index) => {
          // Check if we need a new page
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          // Consultation header
          doc.fontSize(14)
             .fillColor('#059669')
             .text(`Consultation ${index + 1} - ${new Date(consultation.date).toLocaleDateString('fr-FR')}`, 50, yPosition);
          
          yPosition += 20;
          
          // Consultation details
          const consultationInfo = [
            ['Médecin:', consultation.doctorName],
            ['Créatinine:', `${consultation.creatinine} mg/dL`],
            ['Poids:', `${consultation.weight} kg`],
            ['Tension artérielle:', `${consultation.systolicBP}/${consultation.diastolicBP} mmHg`]
          ];
          
          consultationInfo.forEach(([label, value]) => {
            doc.fontSize(10)
               .fillColor('#374151')
               .text(label, 70, yPosition, { continued: true, width: 120 })
               .fillColor('#1f2937')
               .text(value, 190, yPosition);
            yPosition += 15;
          });
          
          if (consultation.notes) {
            doc.fontSize(10)
               .fillColor('#374151')
               .text('Notes:', 70, yPosition, { continued: true, width: 120 })
               .fillColor('#1f2937')
               .text(consultation.notes, 190, yPosition, { width: 350 });
            yPosition += Math.ceil(consultation.notes.length / 60) * 15;
          }
          
          yPosition += 15;
        });
      }
      
      // Alerts Section
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      
      yPosition += 10;
      doc.fontSize(18)
         .fillColor('#1f2937')
         .text(`ALERTES MÉDICALES (${alerts.length})`, 50, yPosition);
      
      doc.moveTo(50, yPosition + 25)
         .lineTo(550, yPosition + 25)
         .strokeColor('#e5e7eb')
         .stroke();
      
      yPosition += 40;
      
      if (alerts.length === 0) {
        doc.fontSize(11)
           .fillColor('#6b7280')
           .text('Aucune alerte active', 50, yPosition);
      } else {
        alerts.forEach((alert, index) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          // Alert severity color
          let alertColor = '#6b7280';
          if (alert.severity === 'critical') alertColor = '#dc2626';
          else if (alert.severity === 'high') alertColor = '#ea580c';
          else if (alert.severity === 'warning') alertColor = '#d97706';
          
          doc.fontSize(12)
             .fillColor(alertColor)
             .text(`${alert.severity.toUpperCase()} - ${alert.type}`, 50, yPosition);
          
          yPosition += 18;
          
          doc.fontSize(10)
             .fillColor('#374151')
             .text('Message:', 70, yPosition, { continued: true, width: 80 })
             .fillColor('#1f2937')
             .text(alert.message, 150, yPosition, { width: 400 });
          
          yPosition += 15;
          
          doc.fontSize(10)
             .fillColor('#374151')
             .text('Valeur:', 70, yPosition, { continued: true, width: 80 })
             .fillColor('#1f2937')
             .text(`${alert.value} (seuil: ${alert.threshold})`, 150, yPosition);
          
          yPosition += 15;
          
          doc.fontSize(9)
             .fillColor('#6b7280')
             .text(`Créée le ${new Date(alert.createdAt).toLocaleDateString('fr-FR')} à ${new Date(alert.createdAt).toLocaleTimeString('fr-FR')}`, 70, yPosition);
          
          yPosition += 25;
        });
      }
      
      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#9ca3af')
           .text(`Page ${i + 1} sur ${pageCount} - Rapport généré par AI4CKD`, 50, 750, { align: 'center' });
      }
      
      doc.end();
    } catch (error) {
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  // Statistics route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getPatientStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

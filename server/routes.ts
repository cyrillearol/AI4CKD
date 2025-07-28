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

  // PDF generation route
  app.get("/api/patients/:id/pdf", async (req, res) => {
    try {
      const patient = await storage.getPatientWithRelations(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Generate simple PDF report
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${patient.firstName}-${patient.lastName}.pdf"`);
      
      // Simple PDF content
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(Rapport Medical - ${patient.firstName} ${patient.lastName}) Tj
0 -20 Td
(Stade MRC: ${patient.ckdStage}) Tj
0 -20 Td
(Date de naissance: ${new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}) Tj
0 -20 Td
(Genre: ${patient.gender}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000526 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;
      
      res.send(Buffer.from(pdfContent));
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

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertConsultationSchema, insertAlertThresholdSchema } from "@shared/schema";
import { alertService } from "./services/alertService";
// import { pdfService } from "./services/pdfService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const validatedData = insertConsultationSchema.parse(req.body);
      const consultation = await storage.createConsultation(validatedData);
      
      // Check for alerts after creating consultation
      await alertService.checkAndCreateAlerts(consultation);
      
      res.status(201).json(consultation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid consultation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create consultation" });
    }
  });

  // Alerts routes
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/unread", async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread alerts" });
    }
  });

  app.patch("/api/alerts/:id/read", async (req, res) => {
    try {
      const alert = await storage.markAlertAsRead(req.params.id);
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark alert as read" });
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

      // Temporarily disabled PDF generation
      res.status(503).json({ message: "PDF generation temporarily unavailable" });
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

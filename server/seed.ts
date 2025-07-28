import { storage } from "./storage";

export async function seedDatabase() {
  try {
    console.log("Seeding database with demo data...");

    // Create demo patients
    const patient1 = await storage.createPatient({
      firstName: "Marie",
      lastName: "Kouadio",
      dateOfBirth: new Date("1965-03-15"),
      gender: "Féminin",
      phone: "+225 07 12 34 56 78",
      email: "marie.kouadio@email.com",
      address: "Abidjan, Cocody",
      emergencyContact: "Jean Kouadio - 07 23 45 67 89",
      medicalHistory: ["Diabète type 2", "Hypertension artérielle", "Néphropathie diabétique"],
      ckdStage: 3,
    });

    const patient2 = await storage.createPatient({
      firstName: "Kofi",
      lastName: "Asante", 
      dateOfBirth: new Date("1958-11-22"),
      gender: "Masculin",
      phone: "+225 05 98 76 54 32",
      email: "kofi.asante@email.com",
      address: "Abidjan, Treichville",
      emergencyContact: "Ama Asante - 05 87 65 43 21",
      medicalHistory: ["Glomérulonéphrite chronique", "Anémie"],
      ckdStage: 4,
    });

    const patient3 = await storage.createPatient({
      firstName: "Fatou",
      lastName: "Diallo",
      dateOfBirth: new Date("1972-07-08"),
      gender: "Féminin", 
      phone: "+225 01 23 45 67 89",
      email: "fatou.diallo@email.com",
      address: "Abidjan, Marcory",
      emergencyContact: "Ibrahim Diallo - 01 34 56 78 90",
      medicalHistory: ["Polykystose rénale", "Hypertension"],
      ckdStage: 2,
    });

    // Create demo consultations
    const consultation1 = await storage.createConsultation({
      patientId: patient1.id,
      date: new Date(),
      creatinine: "2.8",
      weight: "68.5",
      systolicBP: 165,
      diastolicBP: 95,
      notes: "Patient présente une aggravation de la fonction rénale. Créatinine en hausse significative.",
      doctorName: "Dr. Kouakou",
    });

    const consultation2 = await storage.createConsultation({
      patientId: patient2.id,
      date: new Date(),
      creatinine: "3.2",
      weight: "72.1",
      systolicBP: 185,
      diastolicBP: 110,
      notes: "Tension artérielle critique. Ajustement du traitement antihypertenseur recommandé.",
      doctorName: "Dr. Kouakou",
    });

    const consultation3 = await storage.createConsultation({
      patientId: patient3.id,
      date: new Date(),
      creatinine: "1.8",
      weight: "65.2",
      systolicBP: 140,
      diastolicBP: 85,
      notes: "Évolution stable. Continuer le traitement actuel et surveillance rapprochée.",
      doctorName: "Dr. Kouakou",
    });

    // Create global alert thresholds
    await storage.createOrUpdateThreshold({
      type: "creatinine",
      criticalValue: "2.5",
      highValue: "2.0",
      warningValue: "1.5",
      isGlobal: true,
    });

    await storage.createOrUpdateThreshold({
      type: "blood_pressure",
      criticalValue: "180",
      highValue: "160",
      warningValue: "140",
      isGlobal: true,
    });

    await storage.createOrUpdateThreshold({
      type: "weight_loss",
      criticalValue: "3.0",
      highValue: "2.0",
      warningValue: "1.0",
      isGlobal: true,
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
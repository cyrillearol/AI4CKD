import { type PatientWithRelations } from "@shared/schema";
import PDFDocument from "pdfkit";

class PDFService {
  async generatePatientReport(patient: PatientWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc.fontSize(20).text('AI4CKD - Rapport Médical', { align: 'center' });
        doc.moveDown();

        // Patient Information
        doc.fontSize(16).text('INFORMATIONS PATIENT', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(12);
        doc.text(`Nom: ${patient.firstName} ${patient.lastName}`);
        doc.text(`Date de naissance: ${new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}`);
        doc.text(`Sexe: ${patient.gender}`);
        doc.text(`Stade MRC: ${patient.ckdStage}`);
        if (patient.phone) doc.text(`Téléphone: ${patient.phone}`);
        if (patient.email) doc.text(`Email: ${patient.email}`);
        if (patient.address) doc.text(`Adresse: ${patient.address}`);
        doc.moveDown();

        // Medical History
        if (patient.medicalHistory && patient.medicalHistory.length > 0) {
          doc.fontSize(16).text('ANTÉCÉDENTS MÉDICAUX', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          patient.medicalHistory.forEach(history => {
            doc.text(`• ${history}`);
          });
          doc.moveDown();
        }

        // Consultations
        if (patient.consultations.length > 0) {
          doc.fontSize(16).text('HISTORIQUE DES CONSULTATIONS', { underline: true });
          doc.moveDown(0.5);
          
          patient.consultations.slice(0, 10).forEach((consultation, index) => {
            doc.fontSize(12);
            doc.text(`Consultation ${index + 1} - ${new Date(consultation.date).toLocaleDateString('fr-FR')}`, { underline: true });
            
            if (consultation.creatinine) {
              doc.text(`Créatinine: ${consultation.creatinine} mg/dL`);
            }
            if (consultation.weight) {
              doc.text(`Poids: ${consultation.weight} kg`);
            }
            if (consultation.systolicBP && consultation.diastolicBP) {
              doc.text(`Tension artérielle: ${consultation.systolicBP}/${consultation.diastolicBP} mmHg`);
            }
            if (consultation.notes) {
              doc.text(`Notes: ${consultation.notes}`);
            }
            doc.text(`Médecin: ${consultation.doctorName}`);
            doc.moveDown(0.5);
          });
          doc.moveDown();
        }

        // Clinical Summary
        doc.fontSize(16).text('RÉSUMÉ CLINIQUE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);

        if (patient.consultations.length > 0) {
          const latestConsultation = patient.consultations.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          doc.text('Dernières valeurs:');
          if (latestConsultation.creatinine) {
            doc.text(`• Créatinine: ${latestConsultation.creatinine} mg/dL`);
          }
          if (latestConsultation.weight) {
            doc.text(`• Poids: ${latestConsultation.weight} kg`);
          }
          if (latestConsultation.systolicBP && latestConsultation.diastolicBP) {
            doc.text(`• Tension: ${latestConsultation.systolicBP}/${latestConsultation.diastolicBP} mmHg`);
          }
          doc.moveDown();
        }

        // Alerts Summary
        if (patient.alerts.length > 0) {
          doc.fontSize(16).text('RÉSUMÉ DES ALERTES', { underline: true });
          doc.moveDown(0.5);
          
          const criticalAlerts = patient.alerts.filter(a => a.severity === 'critical').length;
          const highAlerts = patient.alerts.filter(a => a.severity === 'high').length;
          const warningAlerts = patient.alerts.filter(a => a.severity === 'warning').length;
          
          doc.fontSize(12);
          doc.text(`Alertes critiques: ${criticalAlerts}`);
          doc.text(`Alertes élevées: ${highAlerts}`);
          doc.text(`Alertes d'avertissement: ${warningAlerts}`);
          doc.moveDown();

          // Recent alerts
          const recentAlerts = patient.alerts
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

          if (recentAlerts.length > 0) {
            doc.text('Alertes récentes:');
            recentAlerts.forEach(alert => {
              doc.text(`• ${alert.message} (${new Date(alert.createdAt).toLocaleDateString('fr-FR')})`);
            });
          }
          doc.moveDown();
        }

        // Recommendations
        doc.fontSize(16).text('RECOMMANDATIONS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        
        const hasHighCreatinine = patient.consultations.some(c => 
          c.creatinine && parseFloat(c.creatinine) > 2.0
        );
        const hasHighBP = patient.consultations.some(c => 
          c.systolicBP && c.systolicBP > 140
        );

        if (hasHighCreatinine) {
          doc.text('• Surveillance rapprochée de la fonction rénale');
          doc.text('• Ajustement posologique des médicaments si nécessaire');
        }
        if (hasHighBP) {
          doc.text('• Contrôle strict de la tension artérielle');
          doc.text('• Évaluation du traitement antihypertenseur');
        }
        doc.text('• Suivi nutritionnel adapté au stade de la MRC');
        doc.text('• Éducation thérapeutique du patient');
        doc.moveDown();

        // Footer
        doc.fontSize(10);
        doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')} par AI4CKD`, {
          align: 'center'
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const pdfService = new PDFService();

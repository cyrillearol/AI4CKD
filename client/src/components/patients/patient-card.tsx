import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Patient } from "@shared/schema";

interface PatientCardProps {
  patient: Patient;
  showDetails?: boolean;
}

const stageColors = {
  1: "bg-green-100 text-green-800",
  2: "bg-yellow-100 text-yellow-800", 
  3: "bg-orange-100 text-orange-800",
  4: "bg-red-100 text-red-800",
  5: "bg-red-200 text-red-900",
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-medical-blue",
    "bg-medical-green", 
    "bg-purple-500",
    "bg-indigo-500",
    "bg-pink-500",
  ];
  const index = name.length % colors.length;
  return colors[index];
};

const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const downloadPDF = async (patientId: string, patientName: string) => {
  try {
    const response = await fetch(`/api/patients/${patientId}/pdf`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${patientName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
};

export default function PatientCard({ patient, showDetails = false }: PatientCardProps) {
  const initials = getInitials(patient.firstName, patient.lastName);
  const avatarColor = getAvatarColor(patient.firstName + patient.lastName);
  const age = calculateAge(patient.dateOfBirth);
  const fullName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-10 h-10 text-white rounded-full flex items-center justify-center font-semibold text-sm",
          avatarColor
        )}>
          {initials}
        </div>
        <div>
          <p className="font-medium text-gray-900">{fullName}</p>
          <p className="text-sm text-gray-500">
            ID: {patient.id.slice(0, 8)}...
          </p>
          {showDetails && (
            <>
              <p className="text-xs text-gray-400">
                {age} ans • {patient.gender}
              </p>
              {patient.phone && (
                <p className="text-xs text-gray-400">{patient.phone}</p>
              )}
            </>
          )}
          <p className="text-xs text-gray-400">
            Créé: {new Date(patient.createdAt.toString()).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge className={cn(
          "text-xs",
          stageColors[patient.ckdStage as keyof typeof stageColors] || stageColors[1]
        )}>
          Stade {patient.ckdStage}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="text-medical-blue hover:text-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            downloadPDF(patient.id, fullName);
          }}
        >
          <FileText className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

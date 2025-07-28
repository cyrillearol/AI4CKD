import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAlertThresholdSchema, type InsertAlertThreshold, type AlertThreshold } from "@shared/schema";
import { X } from "lucide-react";
import { z } from "zod";

interface ThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const thresholdFormSchema = z.object({
  creatinineCritical: z.number().min(0).optional(),
  creatinineHigh: z.number().min(0).optional(),
  systolicMax: z.number().min(0).optional(),
  diastolicMax: z.number().min(0).optional(),
  weightLossWeekly: z.number().min(0).optional(),
  weightLossMonthly: z.number().min(0).optional(),
});

type ThresholdFormData = z.infer<typeof thresholdFormSchema>;

export default function ThresholdModal({ isOpen, onClose }: ThresholdModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: thresholds = [] } = useQuery<AlertThreshold[]>({
    queryKey: ["/api/thresholds"],
    enabled: isOpen,
  });

  const form = useForm<ThresholdFormData>({
    resolver: zodResolver(thresholdFormSchema),
    defaultValues: {
      creatinineCritical: 2.5,
      creatinineHigh: 2.0,
      systolicMax: 160,
      diastolicMax: 100,
      weightLossWeekly: 1.0,
      weightLossMonthly: 3.0,
    },
  });

  // Load existing thresholds
  useEffect(() => {
    if (thresholds.length > 0) {
      const creatinineThreshold = thresholds.find(t => t.type === "creatinine");
      const bpThreshold = thresholds.find(t => t.type === "blood_pressure");
      const weightThreshold = thresholds.find(t => t.type === "weight_loss");

      form.reset({
        creatinineCritical: creatinineThreshold?.criticalValue ? parseFloat(creatinineThreshold.criticalValue) : 2.5,
        creatinineHigh: creatinineThreshold?.highValue ? parseFloat(creatinineThreshold.highValue) : 2.0,
        systolicMax: bpThreshold?.criticalValue ? parseFloat(bpThreshold.criticalValue) : 160,
        diastolicMax: bpThreshold?.highValue ? parseFloat(bpThreshold.highValue) : 100,
        weightLossWeekly: weightThreshold?.highValue ? parseFloat(weightThreshold.highValue) : 1.0,
        weightLossMonthly: weightThreshold?.criticalValue ? parseFloat(weightThreshold.criticalValue) : 3.0,
      });
    }
  }, [thresholds, form]);

  const updateThresholdsMutation = useMutation({
    mutationFn: async (data: ThresholdFormData) => {
      const promises = [];

      // Creatinine thresholds
      if (data.creatinineCritical !== undefined || data.creatinineHigh !== undefined) {
        promises.push(
          apiRequest("POST", "/api/thresholds", {
            type: "creatinine",
            criticalValue: data.creatinineCritical?.toString(),
            highValue: data.creatinineHigh?.toString(),
            isGlobal: true,
          })
        );
      }

      // Blood pressure thresholds
      if (data.systolicMax !== undefined || data.diastolicMax !== undefined) {
        promises.push(
          apiRequest("POST", "/api/thresholds", {
            type: "blood_pressure",
            criticalValue: data.systolicMax?.toString(),
            highValue: data.diastolicMax?.toString(),
            isGlobal: true,
          })
        );
      }

      // Weight loss thresholds
      if (data.weightLossWeekly !== undefined || data.weightLossMonthly !== undefined) {
        promises.push(
          apiRequest("POST", "/api/thresholds", {
            type: "weight_loss",
            highValue: data.weightLossWeekly?.toString(),
            criticalValue: data.weightLossMonthly?.toString(),
            isGlobal: true,
          })
        );
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/thresholds"] });
      toast({
        title: "Seuils mis à jour",
        description: "Les seuils d'alerte ont été mis à jour avec succès.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ThresholdFormData) => {
    updateThresholdsMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Configuration des Seuils d'Alerte</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Créatinine (mg/dL)</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Seuil Critique</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register("creatinineCritical", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Seuil Élevé</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register("creatinineHigh", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Tension Artérielle</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Systolique Max</Label>
                  <Input
                    type="number"
                    {...form.register("systolicMax", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Diastolique Max</Label>
                  <Input
                    type="number"
                    {...form.register("diastolicMax", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-4">Perte de Poids</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Perte Max (kg/semaine)</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...form.register("weightLossWeekly", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600">Perte Max (kg/mois)</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...form.register("weightLossMonthly", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-medical-blue hover:bg-blue-700"
              disabled={updateThresholdsMutation.isPending}
            >
              {updateThresholdsMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

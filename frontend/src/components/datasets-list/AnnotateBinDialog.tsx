import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { fetchAiModels, fetchTrainings } from "@/services/AiModelsServices";
import AiModel, { Training } from "@/@types/ai-model";

interface AnnotateDialogProps {
  categoryId: string;
  datasetId: string;
  datasetSerialNumber: string;
}

const AnnotateDialog = ({ categoryId, datasetId, datasetSerialNumber }: AnnotateDialogProps) => {
  const [annotationMethod, setAnnotationMethod] = useState<"manual" | "model">("manual");
  const [aiModels, setAiModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch AI models for the dataset's category
    const loadAiModels = async () => {
      await fetchAiModels(categoryId, setAiModels);
    };
    loadAiModels();
  }, [categoryId]);

    
  const handleModelSelect = async (modelId: string) => {
    setSelectedModel(modelId);
    setTrainings([]); // Reset trainings when a new model is selected
    setSelectedTraining(null); // Reset selected training

    // Fetch trainings for the selected model
    const data = await fetchTrainings(modelId);
    if (data) {
      setTrainings(data.filter((training) => training.training_status !== "error"));
    }
  };

  const handleStartAnnotation = () => {
    if (annotationMethod === "manual") {
      navigate(`/annoter_bin/${datasetId}`, {
        state: {
          datasetId,
          datasetSerialNumber,
        },
      });
      window.location.reload();
    } else if (annotationMethod === "model") {
      if (!selectedModel || !selectedTraining) {
        toast({
          variant: "destructive",
          title: "Sélectionner un modèle et une version entraînée",
          description: "Veuillez sélectionner un modèle et une version entraînée pour l'annotation.",
        });
        return;
      }

      const token = sessionStorage.getItem("token") || "";
      const url = `${import.meta.env.VITE_WEB_SOCKET_URL}ws/annotation/notifications/?token=${encodeURIComponent(
        token
      )}&dataset_id=${encodeURIComponent(datasetId)}&model_id=${encodeURIComponent(selectedModel)}&training_id=${encodeURIComponent(selectedTraining)}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        ws.send(JSON.stringify({ datasetId, modelId: selectedModel, trainingId: selectedTraining }));
        toast({
          title: "Annotation commencée",
          description: "L'annotation avec le modèle a commencé avec succès.",
          className: "text-green-700",
        });
      };

      ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        setTimeout(() => {
          toast({
            title: "Notification d'annotation",
            description: `Données bien reçues: ${data.message}`,
          });
        }, 5000);
      };

      ws.onclose = () => {
        toast({
          title: "Annotation terminée",
          description: "L'annotation a été terminée avec succès.",
          className: "text-green-700",
        });
      };

      ws.onerror = (error) => {
        toast({
          title: "Erreur d'annotation",
          description: `Une erreur s'est produite lors de l'annotation. ${error}`,
          className: "text-red-700",
        });
      };
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="hover:cursor-pointer">Annoter Binaire</span>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choisir une méthode d'annotation binaire du dataset {datasetSerialNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={annotationMethod} onValueChange={(value) => setAnnotationMethod(value as "manual" | "model")}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Annotation manuelle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="model" id="model" />
                <Label htmlFor="model">Annotation avec un modèle</Label>
              </div>
            </div>
          </RadioGroup>

          {annotationMethod === "model" && (
            <>
              <div className="space-y-2">
                <Label>Sélectionner un modèle</Label>
                <select
                  value={selectedModel || ""}
                  onChange={(e) => handleModelSelect(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="" disabled>
                    -- Sélectionner un modèle --
                  </option>
                  {aiModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.serialNumber}. {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedModel && (
                <div className="space-y-2">
                  <Label>Sélectionner une version entraînée</Label>
                  <select
                    value={selectedTraining || ""}
                    onChange={(e) => setSelectedTraining(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="" disabled>
                      -- Sélectionner une version entraînée --
                    </option>
                    {trainings
                      .filter((training) => training.training_status === "entraîné") // Filtrer les trainings avec "training_status" == "entraîné"
                      .map((training, idx) => (
                        <option key={training.id} value={training.id}>
                          {idx + 1}. {training.type} {training.training_status} le {new Date(training.updated_at).toLocaleString()}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleStartAnnotation}>Commencer l'annotation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnotateDialog;
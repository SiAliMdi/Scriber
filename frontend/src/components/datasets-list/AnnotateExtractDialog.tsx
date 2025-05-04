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
import { Prompt } from "@/@types/prompt";
import { fetchPrompts } from "@/services/PromptsServices";

interface AnnotateExtractDialogProps {
  categoryId: string;
  datasetId: string;
  datasetSerialNumber: string;
}

const AnnotateExtractDialog = ({ categoryId, datasetId, datasetSerialNumber }: AnnotateExtractDialogProps) => {
  const [annotationMethod, setAnnotationMethod] = useState<"manual" | "model">("manual");
  const [aiModel, setAiModel] = useState<"Llama-3.1-8B" | "Ministral-8B-Instruct-2410">("Ministral-8B-Instruct-2410");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrompts(categoryId, setPrompts);
  }, [categoryId]);

  const handleStartAnnotation = () => {
    if (annotationMethod === "manual") {
      navigate(`/annoter_ext/${datasetId}`, {
        state: {
          datasetId,
          datasetSerialNumber,
        },
      });
      window.location.reload();
    } else if (annotationMethod === "model" && aiModel) {
      const token = sessionStorage.getItem("token") || "";
      console.log("Token:", token);
      // Note: Update the path to point to the new extract annotation endpoint
      const url = `${import.meta.env.VITE_WEB_SOCKET_URL}ws/extract_annotation/notifications/?token=${encodeURIComponent(
        token
      )}&dataset_id=${encodeURIComponent(datasetId)}&model_id=${encodeURIComponent(aiModel)}&prompt_id=${encodeURIComponent(selectedPrompt?.id || "vide")}`;
      const ws = new WebSocket(url);
      
      console.log("Token: 2 ", token);
      ws.onopen = () => {
        const payload = { datasetId, modelId: aiModel, prompt: selectedPrompt };
        ws.send(JSON.stringify(payload));
        toast({
          title: "Annotation extractive commencée",
          description: `L'annotation avec ${aiModel} a commencé avec succès.`,
          className: "text-green-700",
        });
      };

      ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        setTimeout(() => {
          toast({
            title: "Notification d'extraction",
            description: `Message reçu : ${data.message}`,
          });
        }, 5000);
      };

      ws.onclose = () => {
        
        window.dispatchEvent(new CustomEvent("extract-annotation-finished", {
          detail: { message: "L'annotation a terminé avec succès." }
        }));

        toast({
          title: "Annotation extractive terminée",
          description: "L'annotation a terminé avec succès.",
          className: "text-green-700",
        });
      };

      ws.onerror = (error) => {
        toast({
          title: "Erreur d'annotation extractive",
          description: `Erreur lors de l'annotation extractive. ${error}`,
          className: "text-red-700",
        });
      };
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="hover:cursor-pointer block">Annotation pour extraction</span>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choisir une méthode d'annotation extractive pour le dataset {datasetSerialNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={annotationMethod} onValueChange={(value) => setAnnotationMethod(value as "manual" | "model")}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 hover:cursor-pointer">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Annotation manuelle</Label>
              </div>
              <div className="flex items-center space-x-2 hover:cursor-pointer">
                <RadioGroupItem value="model" id="model" />
                <Label htmlFor="model">Annotation avec un LLM</Label>
              </div>
            </div>
          </RadioGroup>

          {annotationMethod === "model" && (
            <>
              <div className="space-y-2">
                <Label>Sélectionner un LLM</Label>
                <select
                  value={aiModel || ""}
                  onChange={(e) => setAiModel(e.target.value as "Llama-3.1-8B" | "Ministral-8B-Instruct-2410")}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="" disabled>
                    -- Sélectionner un LLM --
                  </option>
                  <option key={"Ministral-8B-Instruct-2410"} value={"Ministral-8B-Instruct-2410"}>
                    Ministral-8B-Instruct-2410
                  </option>
                  <option key={"Llama-3.1-8B"} value={"Llama-3.1-8B"}>
                    Llama-3.1-8B
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sélectionner un prompt</Label>
                <select
                  value={selectedPrompt?.id || ""}
                  onChange={(e) => {
                    const promptId = e.target.value;
                    if (!promptId) {
                      setSelectedPrompt(null);
                    } else {
                      const prompt = prompts.find((p) => p.id === promptId) || null;
                      setSelectedPrompt(prompt);
                    }
                  }}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="" key="vide">
                    -- Sélectionner un prompt --
                  </option>
                  {prompts.map((prompt) => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.serialNumber}- {prompt.prompt.length > 35 ? prompt.prompt.slice(0, 35) + "..." : prompt.prompt}
                    </option>
                  ))}
                </select>
              </div>
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

export default AnnotateExtractDialog;
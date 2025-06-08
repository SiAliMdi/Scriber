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
import { fetchExtractiveUsersWithAnnotations, fetchExtractiveModelsWithAnnotations } from "@/services/ExtractiveAnnotationServices";
import { User } from "@/@types/user";
// import AiModel from "@/@types/ai-model";

interface ExtValidationDialogProps {
  datasetId: string;
  datasetSerialNumber:  number | undefined;
  // categoryId: string;
}

const ExtValidationDialog = ({ datasetId, datasetSerialNumber }: ExtValidationDialogProps) => {
  const [validationMethod, setValidationMethod] = useState<"manual" | "model">("manual");
  const [users, setUsers] = useState<User[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (validationMethod === "manual") {
      fetchExtractiveUsersWithAnnotations(datasetId).then(setUsers);
    } else if (validationMethod === "model") {
      fetchExtractiveModelsWithAnnotations(datasetId).then(setModels);
    }
  }, [validationMethod, datasetId]);

  const handleStartValidation = () => {
    if (validationMethod === "manual") {
      if (!selectedUser) {
        toast({
          variant: "destructive",
          title: "Sélectionner un utilisateur",
          description: "Veuillez sélectionner un utilisateur pour valider les annotations manuelles.",
        });
        return;
      }
      navigate(`/validate_extractive/${datasetId}`, {
        state: {
          datasetId,
          datasetSerialNumber,
          selectedUser,
          selectedModel: null,
        },
      });
    } else if (validationMethod === "model") {
      if (!selectedModel) {
        toast({
          variant: "destructive",
          title: "Sélectionner un modèle",
          description: "Veuillez sélectionner un modèle pour valider les annotations par modèle.",
        });
        return;
      }
      navigate(`/validate_llm_extractive/${datasetId}`, {
        state: {
          datasetId,
          datasetSerialNumber,
          selectedUser: null,
          selectedModel,
        },
      });
    }
    window.location.reload();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="hover:cursor-pointer block">Valider les annotations extractives</span>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choisir une méthode de validation pour le dataset {datasetSerialNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={validationMethod} onValueChange={(value) => setValidationMethod(value as "manual" | "model")}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Validation des annotations manuelles</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="model" id="model" />
                <Label htmlFor="model">Validation des annotations par modèle</Label>
              </div>
            </div>
          </RadioGroup>

          {validationMethod === "manual" && (
            <div className="space-y-2">
              <Label>Sélectionner un utilisateur</Label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="" disabled>
                  -- Sélectionner un utilisateur --
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email.split("@")[0]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {validationMethod === "model" && (
            <div className="space-y-2">
              <Label>Sélectionner un modèle</Label>
              <select
                value={selectedModel || ""}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="" disabled>
                  -- Sélectionner un modèle --
                </option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleStartValidation}>Commencer la validation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExtValidationDialog;
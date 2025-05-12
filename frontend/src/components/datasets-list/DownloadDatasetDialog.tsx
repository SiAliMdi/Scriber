import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { fetchExtractiveModelsWithAnnotations, fetchExtractiveUsersWithAnnotations, fetchTextDecisionsWithAnnotations } from "@/services/ExtractiveAnnotationServices";
import { saveDownloadLog } from "@/services/DownloadServices";
import { User } from "@/@types/user";
import AiModel, { Training } from "@/@types/ai-model";
import { fetchBinDecisionsWithAnnotations, fetchTrainedModelsForDataset, fetchUsersWithAnnotations } from "@/services/ValidationServices";
import { Decision } from "@/@types/decision";
import { BinaryAnnotation, TextAnnotation } from "@/@types/annotations";
import { fetchDecisionsWithLLMExtractions } from "@/services/LLMServices";

interface DownloadDatasetDialogProps {
  datasetId: string;
  datasetName: string;
}

const DownloadDatasetDialog = ({ datasetId, datasetName }: DownloadDatasetDialogProps) => {
  const [open, setOpen] = useState(false);
  const [downloadType, setDownloadType] = useState<"decisions" | "annotations">("decisions");
  const [annotationType, setAnnotationType] = useState<"binary" | "extractive">("binary");
  const [annotationSource, setAnnotationSource] = useState<"manual" | "model">("manual");

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [binAnnotations, setBinAnnotations] = useState<BinaryAnnotation[]>([]);
  const [manExtAnnotations, setManExtAnnotations] = useState<Record<string, TextAnnotation[]>>({});

  const [usersBin, setUsersBin] = useState<User[]>([]);
  const [selectedBinUser, setselectedBinUser] = useState<string>("");
  const [modelsBin, setModelsBin] = useState<AiModel[]>([]);
  const [trainedModelsBin, setTrainedModelsBin] = useState<Training[]>([]);
  const [selectedBinModel, setSelectedBinModel] = useState<string>("");

  const [usersLLM, setUsersLLM] = useState<User[]>([]);
  const [llms, setllms] = useState<string[]>([]);
  const [selectedUserLLM, setSelectedUserLLM] = useState<string>("");
  const [selectedLLM, setSelectedLLM] = useState<string>("");
  const [totalAnnotations, settotalAnnotations] = useState<Record<string, number>>( {});

  useEffect(() => {
    fetchUsersWithAnnotations(datasetId).then(setUsersBin);
    fetchTrainedModelsForDataset(datasetId).then((data) => {
      setModelsBin(data.models);
      setTrainedModelsBin(data.trained_models);
    });
    fetchExtractiveUsersWithAnnotations(datasetId).then(setUsersLLM);
    fetchExtractiveModelsWithAnnotations(datasetId).then(setllms);
  }, [datasetId]);

  const handleDownload = async () => {
    let fileName = `${datasetName}_`;
    let data: any[] = [];

    if (downloadType === "annotations") {
      if (annotationType === "binary") {
        if (annotationSource === "manual") {
          // Fetch binary manual annotations for selected user
          await fetchBinDecisionsWithAnnotations(
            datasetId,
            selectedBinUser,
            selectedBinModel,
            setDecisions,
            setBinAnnotations,

          );
          data = decisions.map((decision: any) => {
            const anns = binAnnotations.filter((a: any) => a.decisionId === decision.id);
            return {
              ...decision,
              annotations: anns.map(({ decisionId, ...rest }: any) => rest),
            };
          });
          fileName += `bin_manual_${selectedBinUser}_`;
        } else {
          // Fetch binary model annotations for selected model
          await fetchBinDecisionsWithAnnotations(
            datasetId,
            selectedBinUser,
            selectedBinModel,
            setDecisions,
            setBinAnnotations
          );
          data = decisions.map((decision: any) => {
            const anns = binAnnotations.filter((a: any) => a.decisionId === decision.id);
            return {
              ...decision,
              annotations: anns.map(({ decisionId, ...rest }: any) => rest),
            };
          });
          fileName += `bin_model_${selectedBinModel}_`;
        }
      } else if (annotationType === "extractive") {
        if (annotationSource === "manual") {
          // Fetch manual extractive annotations for selected user
          await fetchTextDecisionsWithAnnotations(
            datasetId,
            setDecisions,
            setManExtAnnotations,
            settotalAnnotations,
          );
          console.log("decisions", decisions);
          data = decisions.map((decision: any) => {
            const anns = (manExtAnnotations[decision.id] || []);
            return {
              ...decision,
              annotations: anns.map(
                ({ decisionId, ...rest }: any) => {
                  console.log("rest", rest);
                  return rest}

              ),
            };
          });
          fileName += `extractive_manual_${selectedUserLLM}_`;
        } else {
          // Fetch LLM/model extractive annotations for selected model
          const decisionsWithExtractions = await fetchDecisionsWithLLMExtractions(
            datasetId,
            selectedLLM
          );
          data = decisionsWithExtractions.map((item: any) => ({
            ...item.decision,
            extraction: item.extraction,
          }));
          fileName += `extractive_llm_${selectedLLM}_`;
        }
      }
    } else {
      // Decisions only
      await fetchTextDecisionsWithAnnotations(datasetId,
        setDecisions,
        () => { },
        () => { }
      );
      data = decisions;
      fileName += `decisions_`;
    }

    fileName += `${data.length}_${new Date().toISOString().slice(0, 10)}.json`;

    // Download JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    // Log the download
    await saveDownloadLog(datasetId, fileName);

    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span className="hover:cursor-pointer">Télécharger le dataset</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Télécharger le dataset {datasetName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={downloadType} onValueChange={val => setDownloadType(val as "decisions" | "annotations")}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decisions" id="decisions" />
                <Label htmlFor="decisions">Décisions seulement</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="annotations" id="annotations" />
                <Label htmlFor="annotations">Décisions avec annotations</Label>
              </div>
            </div>
          </RadioGroup>

          {downloadType === "annotations" && (
            <>
              <RadioGroup value={annotationType} onValueChange={val => setAnnotationType(val as "binary" | "extractive")}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="binary" id="binary" />
                    <Label htmlFor="binary">Annotations binaires</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="extractive" id="extractive" />
                    <Label htmlFor="extractive">Annotations extractives</Label>
                  </div>
                </div>
              </RadioGroup>

              {annotationType === "binary" &&
                (
                  <RadioGroup value={annotationSource} onValueChange={val => setAnnotationSource(val as "manual" | "model")}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual">Manuelles</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="model" id="model" />
                        <Label htmlFor="model">Modèle</Label>
                      </div>
                    </div>
                  </RadioGroup>)}

              {annotationType === "extractive" &&
                (
                  <RadioGroup value={annotationSource} onValueChange={val => setAnnotationSource(val as "manual" | "model")}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual">Manuelles</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="model" id="model" />
                        <Label htmlFor="model">LLM</Label>
                      </div>
                    </div>
                  </RadioGroup>)}

              {annotationSource === "model" && annotationType === "binary" && (
                <div className="space-y-2">
                  <Label>Sélectionner un modèle</Label>
                  <select
                    value={selectedBinModel}
                    onChange={(e) => setSelectedBinModel(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="" disabled>
                      -- Sélectionner un modèle --
                    </option>
                    {trainedModelsBin
                      .map((model) => (
                        <option key={model.id} value={model.id}>
                          {modelsBin
                            .find((m) => m.id === model.modelId)?.name || "Unknown Model"} - {model.type} -{" "}
                          {new Date(model.updated_at).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {annotationSource === "manual" && annotationType === "binary" && (
                <div className="space-y-2">
                  <Label>Sélectionner un utilisateur</Label>
                  <select
                    value={selectedBinUser}
                    onChange={(e) =>
                      {return setselectedBinUser(e.target.value)}}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="" disabled>
                      -- Sélectionner un utilisateur --
                    </option>
                    {usersBin.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email.split("@")[0]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {annotationSource === "manual" && annotationType === "extractive" && (
                <div className="space-y-2">
                  <Label>Sélectionner un utilisateur</Label>
                  <select
                    value={selectedUserLLM}
                    onChange={(e) => setSelectedUserLLM(
                      e.target.value
                    )}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="" disabled>
                      -- Sélectionner un utilisateur --
                    </option>
                    {usersLLM
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email.split("@")[0]}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {annotationSource === "model" && annotationType === "extractive" && (
                <div className="space-y-2">
                  <Label>Sélectionner un modèle</Label>
                  <select
                    value={selectedLLM || ""}
                    onChange={(e) => setSelectedLLM(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="" disabled>
                      -- Sélectionner un modèle --
                    </option>
                    {llms
                      .map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                  </select>
                </div>
              )}

            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleDownload}>Télécharger</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadDatasetDialog;
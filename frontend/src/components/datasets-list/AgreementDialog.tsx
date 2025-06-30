import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, TrendingUp, Users, Calculator } from "lucide-react";
import { fetchBinaryAgreement, fetchExtractiveAgreement } from "@/services/AgreementServices";

export interface AgreementMetrics {
  num_annotators?: number;
  num_decisions?: number;
  annotators?: string[];
  average_pairwise_kappa?: number;
  fleiss_kappa?: number;
  krippendorff_alpha?: number;
  agreement_percentage?: number;
  average_pairwise_jaccard?: number;
  average_pairwise_overlap?: number;
  average_exact_match_rate?: number;
  pairwise_details?: Record<string, any>;
  error?: string;
  annotator_type?: string;
}

export interface AgreementResults {
  human_annotators: AgreementMetrics;
  model_annotators: AgreementMetrics;
  human_vs_model: AgreementMetrics;
  overall: AgreementMetrics;
}

const AgreementDialog = ({ datasetId, datasetName }: { datasetId: string; datasetName: string }) => {
  const [open, setOpen] = useState(false);
  const [annotationType, setAnnotationType] = useState<"binary" | "extractive">("binary");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AgreementResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreementData = () => {
    if (annotationType === "binary") {
      fetchBinaryAgreement(datasetId, setResults, setLoading, setError);
      console.log("Fetching binary agreement metrics for dataset:", results);
    } else {
      console.log("Fetching extractive agreement metrics for dataset:", results);
      fetchExtractiveAgreement(datasetId, setResults, setLoading, setError);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAgreementData();
    }
  }, [open, annotationType]);

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return (num * 100).toFixed(2) + "%";
  };

  const formatKappa = (kappa: number | undefined): string => {
    if (kappa === undefined || kappa === null) return "N/A";
    return kappa.toFixed(3);
  };

  const getKappaInterpretation = (kappa: number | undefined): { level: string; color: string } => {
    if (kappa === undefined || kappa === null) return { level: "N/A", color: "gray" };

    if (kappa < 0) return { level: "Pauvre", color: "red" };
    if (kappa < 0.2) return { level: "Faible", color: "orange" };
    if (kappa < 0.4) return { level: "Acceptable", color: "yellow" };
    if (kappa < 0.6) return { level: "Modéré", color: "blue" };
    if (kappa < 0.8) return { level: "Substantiel", color: "green" };
    return { level: "Excellent", color: "emerald" };
  };

  const MetricsCard = ({ title, metrics, icon }: { title: string; metrics: AgreementMetrics; icon: React.ReactNode }) => {
    if (metrics?.error) {
      return (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            {icon}
            <CardTitle className="text-sm font-medium ml-2">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{metrics.error}</p>
          </CardContent>
        </Card>
      );
    }

    if (!metrics || typeof metrics.num_annotators !== "number") {
      return (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            {icon}
            <CardTitle className="text-sm font-medium ml-2">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
          </CardContent>
        </Card>
      );
    }

    const kappaInterpretation = getKappaInterpretation(metrics.average_pairwise_kappa);

    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          {icon}
          <div className="ml-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-xs">
              {metrics.num_annotators || 0} annotateurs • {metrics.num_decisions || 0} décisions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Accord Simple</Label>
              <div className="text-lg font-bold">
                {metrics.agreement_percentage !== undefined ? formatNumber(metrics.agreement_percentage / 100) : "N/A"}
              </div>
            </div>
            {annotationType === "binary" ? (
              <div>
                <Label className="text-xs font-medium">Kappa Moyen</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">{formatKappa(metrics.average_pairwise_kappa)}</span>
                  {metrics.average_pairwise_kappa !== undefined && (
                    <Badge variant="outline" className={`text-${kappaInterpretation.color}-600 border-${kappaInterpretation.color}-200`}>
                      {kappaInterpretation.level}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs font-medium">Jaccard Moyen</Label>
                <div className="text-lg font-bold">{formatNumber(metrics.average_pairwise_jaccard)}</div>
              </div>
            )}
          </div>

          {/* Additional metrics for binary annotations */}
          {annotationType === "binary" && (
            <div className="grid grid-cols-2 gap-4">
              {metrics.fleiss_kappa !== undefined && (
                <div>
                  <Label className="text-xs font-medium">Fleiss' Kappa</Label>
                  <div className="text-sm font-medium">{formatKappa(metrics.fleiss_kappa)}</div>
                </div>
              )}
              {metrics.krippendorff_alpha !== undefined && (
                <div>
                  <Label className="text-xs font-medium">Krippendorff's α</Label>
                  <div className="text-sm font-medium">{formatKappa(metrics.krippendorff_alpha)}</div>
                </div>
              )}
            </div>
          )}

          {/* Additional metrics for extractive annotations */}
          {annotationType === "extractive" && (
            <div className="grid grid-cols-2 gap-4">
              {metrics.average_pairwise_overlap !== undefined && (
                <div>
                  <Label className="text-xs font-medium">Chevauchement Moyen</Label>
                  <div className="text-sm font-medium">{formatNumber(metrics.average_pairwise_overlap)}</div>
                </div>
              )}
              {metrics.average_exact_match_rate !== undefined && (
                <div>
                  <Label className="text-xs font-medium">Correspondance Exacte</Label>
                  <div className="text-sm font-medium">{formatNumber(metrics.average_exact_match_rate)}</div>
                </div>
              )}
            </div>
          )}

          {/* Annotators list */}
          {metrics.annotators && metrics.annotators.length > 0 && (
            <div>
              <Label className="text-xs font-medium">Annotateurs</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {metrics.annotators.slice(0, 5).map((annotator, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {String(annotator).slice(0, 8)}...
                  </Badge>
                ))}
                {metrics.annotators.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{metrics.annotators.length - 5} autres
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span className="hover:cursor-pointer">Métriques d'accord</span>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Métriques d'accord inter-annotateurs - {datasetName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Annotation Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Type d'annotations</Label>
            <RadioGroup value={annotationType} onValueChange={(val) => setAnnotationType(val as "binary" | "extractive")} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="binary" id="binary" />
                <Label htmlFor="binary" className="text-sm">Annotations binaires</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="extractive" id="extractive" />
                <Label htmlFor="extractive" className="text-sm">Annotations extractives</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Calcul des métriques d'accord...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results && !loading && !error && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricsCard title="Annotateurs Humains" metrics={results.human_annotators} icon={<Users className="h-4 w-4 text-blue-600" />} />
                <MetricsCard title="Annotateurs Modèles" metrics={results.model_annotators} icon={<Calculator className="h-4 w-4 text-purple-600" />} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricsCard title="Humains vs Modèles" metrics={results.human_vs_model} icon={<TrendingUp className="h-4 w-4 text-green-600" />} />
                <MetricsCard title="Accord Global" metrics={results.overall} icon={<TrendingUp className="h-4 w-4 text-orange-600" />} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgreementDialog;
import React, { useEffect, useRef, useState } from "react";
import BasePage from "./BasePage";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { deleteDatasetDecisions, fetchBinDecisionsWithAnnotations } from "@/services/BinaryAnnotationServices";
import { fetchLabels } from "@/services/LabelsServices";
import { Decision } from "@/@types/decision";
import { BinaryAnnotation } from "@/@types/annotations";
import { Label as LabelType } from "@/@types/label";
import LabelsDialog from "@/components/annotation-forms/extractive/LabelsDialog";


const ExtractiveAnnotationPage: React.FC = () => {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [annotations, setAnnotations] = useState<Record<string, BinaryAnnotation[]>>({});

    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
    const [checkedDecisions, setCheckedDecisions] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const location = useLocation();
    const datasetId = location.state?.datasetId;

    const [labels, setLabels] = useState<LabelType[]>();//location.state?.labels
    const [currentLabel, setCurrentLabel] = useState<LabelType>({ id: "", label: "", color: "" });//labels[0] ??
    const [isDialogOpen, setIsDialogOpen] = useState(false)


    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const decisionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const selectedIndex = selectedDecision ? decisions.findIndex((d) => d.id === selectedDecision.id) + 1 : 0;
    const totalDecisions = decisions.length;

    useEffect(() => {

        if (datasetId) {
            fetchBinDecisionsWithAnnotations(datasetId, setDecisions, setAnnotations)
                .then(() => {
                    setLoading(false);

                    if (decisions.length > 0) {
                        setSelectedDecision(decisions[0]);
                    }
                    fetchLabels(datasetId, setLabels);
                })
                .catch((err) => {
                    setError("Erreur lors de la récupération des décisions. " + err);
                    setLoading(false);
                });
        } else {
            setError("Aucun datasetId trouvé.");
            setLoading(false);
        }
    }, [datasetId]);

    useEffect(() => {
        fetchLabels(datasetId, setLabels);
    }
        , [labels]);

    useEffect(() => {
        if (decisions.length > 0) {
            setSelectedDecision(decisions[0]);
        }
    }, [decisions]);

    useEffect(() => {
        if (selectedDecision) {
            scrollToSelectedDecision(decisions.findIndex((d) => d.id === selectedDecision.id));
        }
    }, [selectedDecision]);

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "ArrowLeft") {
            goToPreviousDecision();
        }
        if (event.key === "ArrowRight") {
            goToNextDecision();
        }
        if (event.key === "ArrowUp") {
            goToPreviousDecision();
        }
        if (event.key === "ArrowDown") {
            goToNextDecision();
        }
        /*if (event.key === " ") {
        const currentIndex = decisions.findIndex((d) => d.id === selectedDecision.id);
        const nextIndex = (currentIndex + 10) % decisions.length;
        setSelectedDecision(decisions[nextIndex]);
        scrollToSelectedDecision(currentIndex);
        }*/
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedDecision]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && currentLabel) {
            const range = selection.getRangeAt(0);

            // Create a span element to wrap the selected text
            const span = document.createElement("span");
            span.style.backgroundColor = currentLabel.color;
            span.textContent = selection.toString();
            span.title = currentLabel.label; // Add tooltip displaying the label

            // Allow deletion: on double-click, remove the span and restore plain text
            span.addEventListener("dblclick", () => {
                const parent = span.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(span.textContent || ""), span);
                }
            });

            // Replace the selected text with our colored span
            range.deleteContents();
            range.insertNode(span);
            selection.removeAllRanges();
        }
    };


    // Tri alphabétique des niveaux
    /* const sortedDecisions = [...decisions].sort((a, b) =>
        a.j_date.localeCompare(b.j_date)
    ); */

    const handleDeleteSelected = () => {
        const remainingDecisions = decisions.filter((d) => !checkedDecisions[d.id] ?? false);
        setDecisions(remainingDecisions);
        deleteDatasetDecisions(datasetId, Object.keys(checkedDecisions).filter((key) => checkedDecisions[key]));
        setCheckedDecisions({});
        if (selectedDecision && !remainingDecisions.some((d) => d.id === selectedDecision.id)) {
            setSelectedDecision(remainingDecisions.length ? remainingDecisions[0] : null);
        }
    };

    if (loading) return <div className="p-4 text-center mt-10"><strong>Chargement des décisions...</strong> </div>;
    if (error) return <div className="p-4 text-red-500 text-center mt-10"><strong>{error}</strong> </div>;

    const scrollToSelectedDecision = (index: number) => {
        if (decisionRefs.current[index]) {
            decisionRefs.current[index]?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    };

    const goToPreviousDecision = () => {
        setTimeout(() => {
            if (!selectedDecision || decisions.length === 0) return;

            const currentIndex = decisions.findIndex((d) => d.id === selectedDecision.id);
            const prevIndex = (currentIndex - 1 + decisions.length) % decisions.length; // Loop back to last if at first
            setSelectedDecision(decisions[prevIndex]);

            // Scroll to selected decision
            scrollToSelectedDecision(prevIndex);
        }, 500);
    };

    const goToNextDecision = () => {
        setTimeout(() => {
            if (!selectedDecision || decisions.length === 0) return;

            const currentIndex = decisions.findIndex((d) => d.id === selectedDecision.id);
            const nextIndex = (currentIndex + 1) % decisions.length; // Loop to first after last
            setSelectedDecision(decisions[nextIndex]);

            // Scroll to selected decision
            scrollToSelectedDecision(nextIndex);
        }, 500);
    };


    return (
        <div className="h-screen flex flex-col">
            <BasePage />

            <div className="flex flex-1 overflow-hidden">
                {/* Panneau latéral simplifié */}
                <div className="w-64 border-r flex flex-col">
                    <div className="p-2 border-b flex items-center justify-between">
                        <span className="text-sm">
                            {decisions.findIndex(d => d.id === selectedDecision?.id) + 1}/{decisions.length}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteSelected}
                            disabled={Object.values(checkedDecisions).every((v) => !v)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-2 overflow-auto" ref={scrollAreaRef}>
                        {decisions.map((decision, idx) => (
                            <div
                                key={decision.id}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-2 text-sm ${selectedDecision?.id === decision.id ? "bg-blue-50" : ""
                                    } ${annotations[decision.id]?.length ? "text-green-600 font-medium" : "text-gray-500"
                                    }`}
                                onClick={() => setSelectedDecision(decision)}
                                ref={(el) => (decisionRefs.current[idx] = el)}
                            >
                                <Checkbox
                                    checked={checkedDecisions[decision.id]}
                                    onCheckedChange={checked =>
                                        setCheckedDecisions(prev => ({
                                            ...prev,
                                            [decision.id]: !!checked
                                        }))
                                    }
                                />
                                <p className="break-words">
                                    <strong>{idx + 1}.</strong> {decision.j_juridiction}-{decision.j_ville}-{decision.j_date}-{decision.j_rg}
                                </p>
                            </div>
                        ))}
                    </ScrollArea>
                </div>

                {/* Panneau principal optimisé */}
                {selectedDecision && (
                    <Card className="flex-1 flex flex-col m-4">
                        <CardContent className="flex-1 overflow-auto p-2">
                            <div className="relative h-full">
                                {/* Fixed Labels Panel */}

                                <div className="sticky top-0 bg-white z-10 p-2 border-b flex items-center">
                                    <div >
                                        <Settings
                                            className="h-6 w-6 cursor-pointer mr-4"
                                            onClick={() => setIsDialogOpen(true)}
                                        />

                                        <LabelsDialog
                                            open={isDialogOpen}
                                            onOpenChange={setIsDialogOpen}
                                            labels={labels}
                                            setLabels={setLabels}
                                            datasetId={datasetId}
                                            datasetSerialNumber={location.state?.datasetSerialNumber}
                                        />
                                    </div>
                                    {/* {<LabelsDialog {...{ row } as LabelsDialogProps<TData>}  />} */}
                                    <div className="flex space-x-2 overflow-x-auto">
                                        {labels.map((label, index) => (
                                            <button
                                                key={index}
                                                style={{ backgroundColor: label.color }}
                                                onClick={() => setCurrentLabel(label)}
                                                className={`px-3 py-1 rounded border transition-colors duration-200 whitespace-nowrap 
                                            ${currentLabel && currentLabel.id === label.id ? "border-blue-500 shadow-lg font-bold" : "border-transparent"}`}
                                            >
                                                {label.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Decision Text Area with margin to leave space for the fixed panel */}
                                <div
                                    className="mt-16 decision-text whitespace-pre-wrap overflow-auto"
                                    onMouseUp={handleTextSelection}
                                >
                                    {selectedDecision.j_texte}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ExtractiveAnnotationPage;
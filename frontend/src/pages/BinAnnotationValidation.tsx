import React, { useEffect, useState, useRef } from "react";
import BasePage from "./BasePage";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { deleteDatasetDecisions } from "@/services/BinaryAnnotationServices";
import { fetchBinDecisionsWithAnnotations, updateBinaryAnnotation } from "@/services/ValidationServices";
import { Decision } from "@/@types/decision";
import { BinaryAnnotation } from "@/@types/annotations";

const BinAnnotationValidation: React.FC = () => {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [annotations, setAnnotations] = useState<BinaryAnnotation[]>([]);
    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
    const [checkedDecisions, setCheckedDecisions] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [validatedCount, setValidatedCount] = useState(0);
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState<string>("");

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const decisionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const location = useLocation();
    const datasetId = location.state?.datasetId;

    useEffect(() => {
        const state = location.state;
        if (state) {
            setSelectedUser(state.selectedUser);
            setSelectedModel(state.selectedModel);
        }
    }, [location.state]);

    useEffect(() => {
        const state = location.state;
        console.log("State from location:", state);
        if (datasetId && (state.selectedUser || state.selectedModel)) {
            setLoading(true);
            fetchBinDecisionsWithAnnotations(datasetId, selectedUser, selectedModel, setDecisions, setAnnotations);
            setLoading(false);
        }
    }, [location.state, datasetId, selectedUser, selectedModel]);

    useEffect(() => {
        if (decisions.length > 0 && !selectedDecision) {
            setSelectedDecision(decisions[0]);
        }
    }, [decisions, selectedDecision]);

    const selectedIndex = selectedDecision ? decisions.findIndex((d) => d.id === selectedDecision.id) + 1 : 0;
    const totalDecisions = decisions.length;

    // Function to handle annotation toggle
    const toggleAnnotation = () => {
        if (!selectedDecision) return;
        const currentAnnotation = getUserAnnotation(selectedDecision.id);
        const newAnnotation = currentAnnotation === 1 ? 0 : 1;
        handleAnnotationChange(selectedDecision.id, newAnnotation);
    };

    // Function to handle keypress
    const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
            case "c":
                toggleAnnotation();
                break;
            case "ArrowLeft":
                goToPreviousDecision();
                break;
            case "ArrowRight":
                goToNextDecision();
                break;
            case "ArrowUp":
                goToPreviousDecision();
                break;  
            case "ArrowDown":
                goToNextDecision();
                break;
            case "v":
                if (selectedDecision) {
                    handleAnnotationChange(selectedDecision.id!, 
                        getUserAnnotation(selectedDecision.id)
                    );
                }
                break;
            case "Enter":
                if (selectedDecision) {
                    handleAnnotationChange(selectedDecision.id!, 
                        getUserAnnotation(selectedDecision.id)
                    );
                }
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedDecision, annotations]);

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


    const handleValidation = (decisionId: string) => {
        const annotation = annotations.find((ann) => ann.decisionId === decisionId);
        const state = annotation?.state;
        const label = annotation?.label;
        const annotationId = annotation?.id;
        console.log("annotation id", annotationId);
        console.log("annotation state", state);
        console.log("annotation label", label);
        updateBinaryAnnotation(annotationId, state, label);
        /* setAnnotations((prev) =>
            prev.map((annotation) =>
                annotation.id === annotationId ? { ...annotation, state } : annotation
            )
        ); */
        if (state === "validated" || state === "corrected") {
            setValidatedCount((prev) => prev + 1);
        }
    };

    useEffect(() => {
        const decisionId = selectedDecision?.id;
        if (decisionId) {
            const annotation = annotations.find((ann) => ann.decisionId === decisionId);
            if (annotation) {
                updateBinaryAnnotation(annotation.id, annotation.state, annotation.label);
            }
        }
    }, [annotations])

    const handleAnnotationChange = (decisionId: string, value: number) => {
        let newState: "validated" | "corrected" | "annotated" = "annotated";
        setAnnotations((prev) => {
            const otherAnnotations = prev.filter((ann) => ann.decisionId !== decisionId);
            const existingAnnotation = prev.find((ann) => ann.decisionId === decisionId);
            if (!existingAnnotation) {
                console.log("annotation non existante", value);
                newState = "annotated";
            } else {
                console.log("annotation existante", existingAnnotation);
                newState = existingAnnotation.label === value.toString() ? "validated" : "corrected";
            }
            return [...otherAnnotations, { ...existingAnnotation, label: value.toString(), state: newState }];
        });
        handleValidation(decisionId);
        /* updateBinaryAnnotation(annotations.find((ann) => ann.decisionId === decisionId)?.id ?? ""
            , value.toString()); */
        goToNextDecision();
    };

    const getUserAnnotation = (decisionId: string | undefined): number => {
        if (!decisionId) return 0;
        return parseInt(annotations.find((ann) => ann.decisionId === decisionId)?.label ?? "0", 10);
    };

    const isAnnotated = (decisionId: string | undefined) => {
        if (!decisionId) return false;
        return annotations.some((ann) => ann.decisionId === decisionId);
    };

    const handleCheckDecision = (decisionId: string | undefined) => {
        if (!decisionId) return;
        setCheckedDecisions((prev) => ({
            ...prev,
            [decisionId]: !prev[decisionId],
        }));
    };

    const handleDeleteSelected = () => {
        const remainingDecisions = decisions.filter((d) => !checkedDecisions[d.id] ?? false);
        setDecisions(remainingDecisions);
        deleteDatasetDecisions(datasetId, Object.keys(checkedDecisions).filter((key) => checkedDecisions[key]));
        setCheckedDecisions({});
        if (selectedDecision && !remainingDecisions.some((d) => d.id === selectedDecision.id)) {
            setSelectedDecision(remainingDecisions.length ? remainingDecisions[0] : null);
        }
    };


    const getAnnotationStateColor = (state: string) => {
        switch (state) {
            case "validated":
                return "bg-green-100";
            case "corrected":
                return "bg-yellow-100";
            case "annotated":
                return "bg-blue-100";
            default:
                return "bg-gray-100";
        }
    };

    if (loading) return <p className="text-center mt-10"> <strong>Chargement des décisions...</strong> </p>;
    if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

    return (
        <div className="h-screen w-screen flex flex-col">
            <div className="h-[7.5%]">
                <BasePage />
            </div>

            <div className="flex h-[90%]">
                <div className="w-[15vw] max-w-[15vw] border-r border-gray-300 flex flex-col">
                    <div className="flex items-center max-h-10 justify-evenly p-1 border-b bg-white">
                        <span>
                            1: {decisions.filter((d) => getUserAnnotation(d.id) === 1).length}
                        </span>
                        <span>
                            0: {decisions.filter((d) => getUserAnnotation(d.id) === 0).length}
                        </span>

                        <span className="text-sm font-medium text-gray-600">
                            {selectedIndex} / {totalDecisions}
                        </span>
                        <Button variant="outline" size="sm" onClick={handleDeleteSelected} disabled={Object.values(checkedDecisions).every((v) => !v)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-2 overflow-auto" ref={scrollAreaRef}>
                        {decisions.map((decision, idx) => (
                            <div
                                key={decision.id}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-2 text-sm 
                                ${selectedDecision?.id === decision.id ? "bg-blue-300" : getAnnotationStateColor(
                                    isAnnotated(decision.id) ? annotations.find((ann) => ann.decisionId === decision.id)?.state : "annotated"
                                )} 
                                hover:bg-gray-100`}
                                ref={(el) => (decisionRefs.current[idx] = el)}
                                onClick={() => {
                                    console.log("Selected decision +++:", decision);
                                    setSelectedDecision(decision);
                                }}
                            >
                                <Checkbox
                                    checked={checkedDecisions[decision.id]}
                                    onCheckedChange={() => handleCheckDecision(decision.id)}
                                />
                                <p className="break-words">
                                    <strong>{idx + 1}.</strong> {decision.j_juridiction}-{decision.j_ville}-{decision.j_date}-{decision.j_rg}
                                </p>
                            </div>
                        ))}
                    </ScrollArea>
                </div>

                <div className="flex flex-col flex-1 h-full">
                    {selectedDecision && (
                        <Card className="h-full flex flex-col">
                            <CardContent className="p-4 flex-1 flex flex-col overflow-auto">
                                <div className="whitespace-pre-wrap text-gray-800 text-sm flex-1 overflow-y-auto border-b pb-4 pr-4">
                                    {selectedDecision.j_texte}
                                </div>

                                <div className="pt-4 overflow-y-auto">
                                    <Label className="text-sm font-medium">Annotation</Label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <Checkbox
                                            id="annotate"
                                            checked={getUserAnnotation(selectedDecision.id) === 1}
                                            onCheckedChange={(checked) => {
                                                handleAnnotationChange(selectedDecision.id!, checked ? 1 : 0)
                                            }}
                                        />
                                        <Label htmlFor="annotate">✅ Positive (1) / 🔲 Négative (0)</Label>
                                    </div>

                                    {/* Affichage de l'annotation sélectionnée */}
                                    {/*<div className="mt-4 p-2 bg-gray-100 rounded-md">
                                        <strong>Annotation actuelle :</strong> {getUserAnnotation(selectedDecision.id) === 1 ? "Positive (1)" : "Négative (0)"}
                                    </div>*/}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BinAnnotationValidation;

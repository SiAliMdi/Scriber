import React, { useEffect, useRef, useState } from "react";
import BasePage from "./BasePage";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Trash2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { fetchTextDecisionsWithAnnotations, createAnnotation, deleteAnnotation, deleteExtractiveDatasetDecisions, validateDecisionAnnotations } from "@/services/ExtractiveAnnotationServices";
import { fetchLabels } from "@/services/LabelsServices";
import { Decision } from "@/@types/decision";
import { TextAnnotation } from "@/@types/annotations";
import { Label as LabelType } from "@/@types/label";
import LabelsDialog from "@/components/annotation-forms/extractive/LabelsDialog";

const ExtractiveAnnotationValidation: React.FC = () => {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [annotations, setAnnotations] = useState<Record<string, TextAnnotation[]>>({});
    const [totalAnnotationCounts, setTotalAnnotationCounts] = useState<Record<string, number>>({});
    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
    const [checkedDecisions, setCheckedDecisions] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [labels, setLabels] = useState<LabelType[]>([]);
    const [currentLabel, setCurrentLabel] = useState<LabelType | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const location = useLocation();
    const datasetId = location.state?.datasetId;

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const decisionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Fetch data on mount
    useEffect(() => {
        if (datasetId) {
            fetchTextDecisionsWithAnnotations(datasetId, setDecisions, setAnnotations, setTotalAnnotationCounts)
                .then(() => {
                    setLoading(false);
                    // Set initial selected decision explicitly after data is fetched
                    if (decisions.length > 0) {
                        setSelectedDecision(decisions[0]);
                    }
                    fetchLabels(datasetId, setLabels);
                })
                .catch((err) => {
                    setError("Error fetching decisions: " + err);
                    setLoading(false);
                });
        } else {
            setError("No datasetId found.");
            setLoading(false);
        }
    }, [datasetId]);

    // Update selectedDecision when decisions change
    useEffect(() => {
        if (decisions.length > 0 && !selectedDecision) {
            setSelectedDecision(decisions[0]);
        }
    }, [decisions, selectedDecision]);

    // Set initial label when labels are fetched
    useEffect(() => {
        if (labels.length > 0 && !currentLabel) {
            setCurrentLabel(labels[0]);
        }
    }, [labels, currentLabel]);

    useEffect(() => {
        if (!selectedDecision) return;

        // Clear existing content
        const container = document.querySelector('.decision-text');
        if (!container) return;

        // Create a document fragment to build our content
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        const text = selectedDecision.j_texte || "";
        const decisionAnnotations = annotations[selectedDecision.id] || [];

        // Sort annotations by start offset
        const sortedAnnotations = [...decisionAnnotations].sort((a, b) => a.start_offset - b.start_offset);

        // Rebuild text with annotations
        sortedAnnotations.forEach(annotation => {
            // Add text before the annotation
            if (annotation.start_offset > lastIndex) {
                fragment.appendChild(document.createTextNode(
                    text.slice(lastIndex, annotation.start_offset)

                ));
            }

            // Create annotation span
            const span = document.createElement("span");
            span.style.backgroundColor = labels.find(l => l.id === annotation.label)?.color || "yellow";
            span.textContent = text.slice(annotation.start_offset, annotation.end_offset);
            span.title = labels.find(l => l.id === annotation.label)?.label || "Annotation";

            // Add double-click handler
            span.addEventListener("dblclick", () => handleAnnotationDelete(span, annotation.id));
            fragment.appendChild(span);

            lastIndex = annotation.end_offset;
        });

        // Add remaining text after last annotation
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        // Replace container content
        container.innerHTML = "";
        container.appendChild(fragment);

    }, [selectedDecision, annotations, labels]);

    const handleAnnotationDelete = (span: HTMLSpanElement, annotationId: string) => {
        deleteAnnotation(annotationId)
            .then(() => {
                // Replace span with text content
                const textNode = document.createTextNode(span.textContent || "");
                span.parentNode?.replaceChild(textNode, span);

                setAnnotations(prev => ({
                    ...prev,
                    [selectedDecision?.id]: prev[selectedDecision?.id].filter(a => a.id !== annotationId),
                }));

                setTotalAnnotationCounts(prev => ({
                    ...prev,
                    [currentLabel!.id]: (prev[currentLabel!.id] || 0) - 1,
                }));
            })
            .catch(console.error);
    };

    // Handle text selection and annotation creation/deletion
    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount || !currentLabel || !selectedDecision) return;

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        if (selectedText.trim().length === 0) return;

        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(document.querySelector('.decision-text')!);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const startOffset = preSelectionRange.toString().length;
        const endOffset = startOffset + selectedText.length;

        // Check for overlap with existing annotations
        const existingAnnotations = annotations[selectedDecision.id] || [];
        const overlappingAnnotation = existingAnnotations.find(ann =>
            ann.start_offset < endOffset && ann.end_offset > startOffset
        );
        if (overlappingAnnotation) {
            // Delete the overlapping annotation and ignore the new one
            deleteAnnotation(overlappingAnnotation.id)
                .then(() => {
                    setAnnotations(prev => ({
                        ...prev,
                        [selectedDecision.id]: prev[selectedDecision.id].filter(a => a.id !== overlappingAnnotation.id),
                    }));
                    // Decrement the counter for the label of the removed annotation
                    setTotalAnnotationCounts(prev => ({
                        ...prev,
                        [overlappingAnnotation.label]: (prev[overlappingAnnotation.label] || 0) - 1,
                    }));

                    // Remove the span from DOM
                    const spans = document.querySelectorAll('.decision-text span');
                    spans.forEach(span => {
                        const spanStart = parseInt(span.getAttribute('data-start') || "0");
                        const spanEnd = parseInt(span.getAttribute('data-end') || "0");
                        if (spanStart === overlappingAnnotation.start_offset &&
                            spanEnd === overlappingAnnotation.end_offset) {
                            span.outerHTML = span.textContent || "";
                        }
                    });
                })
                .catch(console.error);
            return;
        }

        // Create new annotation
        const span = document.createElement("span");
        span.style.backgroundColor = currentLabel.color || "yellow";
        span.textContent = selectedText;
        span.title = currentLabel.label;
        span.setAttribute('data-start', startOffset.toString());
        span.setAttribute('data-end', endOffset.toString());

        range.deleteContents();
        range.insertNode(span);
        selection.removeAllRanges();

        const annotationData = {
            text: selectedText,
            start_offset: startOffset,
            end_offset: endOffset,
            label: currentLabel.id,
            decision: selectedDecision.id,
        };

        createAnnotation(annotationData)
            .then((newAnnotation) => {
                setAnnotations(prev => ({
                    ...prev,
                    [selectedDecision.id]: [...(prev[selectedDecision.id] || []), newAnnotation],
                }));
                setTotalAnnotationCounts(prev => ({
                    ...prev,
                    [currentLabel.id]: (prev[currentLabel.id] || 0) + 1,
                }));

                span.addEventListener("dblclick", () =>
                    handleAnnotationDelete(span, newAnnotation.id)
                );
            })
            .catch(console.error);
    };

    // Validate all annotations for the selected decision
    const handleValidateDecision = async () => {
        if (!selectedDecision) return;
        const anns = annotations[selectedDecision.id] || [];
        if (anns.length === 0) return;
        try {
            await validateDecisionAnnotations(selectedDecision.id);
            // Update local state
            setAnnotations(prev => ({
                ...prev,
                [selectedDecision.id]: prev[selectedDecision.id].map(a => ({ ...a, state: "validated" })),
            }));
            // Move to next decision
            goToNextDecision();
        } catch (err) {
            console.error("Validation failed", err);
        }
    };

    // Helper to determine decision color
    const getDecisionStateColor = (decisionId: string) => {
        const anns = annotations[decisionId] || [];
        for (const ann of anns) {
            console.log("Annotation state:", ann.state); // Debug log
        }
        if (anns.length === 0) return "bg-gray-100";
        if (anns.every(a => a.state === "validated")) return "bg-green-100";
        return "bg-blue-100";
    };


    const handleDeleteSelected = () => {
        const decisionIdsToDelete = Object.keys(checkedDecisions).filter((key) => checkedDecisions[key]);

        deleteExtractiveDatasetDecisions(datasetId, decisionIdsToDelete)
            .then(() => {
                const remainingDecisions = decisions.filter((d) => !checkedDecisions[d.id]);
                setDecisions(remainingDecisions);
                setCheckedDecisions({});
                if (selectedDecision && !remainingDecisions.some((d) => d.id === selectedDecision.id)) {
                    setSelectedDecision(remainingDecisions.length ? remainingDecisions[0] : null);
                }
            })
            .catch((error) => {
                console.error("Deletion failed:", error);
            });
    };

    // Handle decision click from the left panel
    const handleDecisionClick = (decision: Decision) => {
        console.log("Selected decision:", decision); // Debug log
        setSelectedDecision(decision);
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedDecision, decisions]);


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
    };

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

    if (loading) return <div className="p-4 text-center mt-10"><strong>Chargement des décisions...</strong></div>;
    if (error) return <div className="p-4 text-red-500 text-center mt-10"><strong>{error}</strong></div>;

    return (
        <div className="h-screen flex flex-col">
            <BasePage />
            <div className="flex flex-1 overflow-hidden">
                {/* Decisions Panel */}
                <div className="w-64 border-r flex flex-col">
                    <div className="p-2 border-b flex items-center justify-between">
                        <span className="text-sm">
                            {decisions.findIndex(d => d.id === selectedDecision?.id) + 1}/{decisions.length}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleValidateDecision}
                                disabled={
                                    !selectedDecision ||
                                    !(annotations[selectedDecision.id]?.length > 0) ||
                                    annotations[selectedDecision.id]?.every(a => a.state === "validated")
                                }
                                title="Valider la décision"
                            >
                                {"Validate "} <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteSelected}
                                disabled={!Object.values(checkedDecisions).some(v => v)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-2 overflow-auto" ref={scrollAreaRef}>
                        {decisions.map((decision, idx) => (
                            <div
                                key={decision.id}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-2 text-sm ${selectedDecision?.id === decision.id ? "bg-blue-50" : ""} ${getDecisionStateColor(decision.id)}`}
                                onClick={() => handleDecisionClick(decision)}
                                ref={(el) => (decisionRefs.current[idx] = el)}
                            >
                                <Checkbox
                                    checked={checkedDecisions[decision.id] || false}
                                    onCheckedChange={(checked) =>
                                        setCheckedDecisions(prev => ({
                                            ...prev,
                                            [decision.id]: !!checked
                                        }))
                                    }
                                />
                                <p className="break-words">
                                    <strong>{idx + 1}.</strong> {decision.j_juridiction}-{decision.j_ville}-{decision.j_date}-{decision.j_rg}
                                    {annotations[decision.id]?.length > 0 && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                            {annotations[decision.id].length} annotation(s)
                                        </span>
                                    )}
                                </p>
                            </div>
                        ))}
                    </ScrollArea>
                </div>

                {/* Main Panel */}
                <Card className="flex-1 flex flex-col m-4">
                    <CardContent className="flex flex-col h-full p-0">
                        {/* Headers Container */}
                        <div className="sticky top-0 z-20 bg-white">
                            {/* Total Annotation Counts */}
                            <div className="p-2 border-b flex justify-start">
                                <h3 className="text-lg font-semibold mr-8">Total des annotations</h3>
                                <div className="flex space-x-4">
                                    {labels.map((label) => (
                                        <div key={label.id} className="flex items-center">
                                            <span className="mr-2" style={{ color: label.color }}>●</span>
                                            <span>{label.label}: {totalAnnotationCounts[label.id] || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Labels and Settings */}
                            <div className="p-2 border-b flex items-center">
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
                                <div className="flex space-x-2 overflow-x-auto">
                                    {labels.map((label) => (
                                        <button
                                            key={label.id}
                                            style={{ backgroundColor: label.color }}
                                            onClick={() => setCurrentLabel(label)}
                                            className={`px-3 py-1 rounded border transition-colors duration-200 whitespace-nowrap ${currentLabel?.id === label.id ? "border-blue-500 shadow-lg font-bold" : "border-transparent"
                                                }`}
                                        >
                                            {label.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Decision Text */}
                        <ScrollArea className="flex-1 p-2">
                            {selectedDecision ? (
                                <div
                                    className="decision-text whitespace-pre-wrap"
                                    onMouseUp={handleTextSelection}
                                    dangerouslySetInnerHTML={{ __html: selectedDecision.j_texte || "Aucun texte disponible." }}
                                />
                            ) : (
                                <div className="p-4 text-center">Sélectionnez une décision pour en afficher le texte.</div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ExtractiveAnnotationValidation;
import React, { useEffect, useRef, useState } from "react";
import BasePage from "./BasePage";
import { Card, CardContent } from "@/components/ui/card";
import { Menu } from 'lucide-react';
import { useLocation } from "react-router-dom";
import { fetchDecisionsWithLLMExtractions, DecisionWithExtraction, saveExtractionValidation, deleteLLMDatasetDecisions } from "@/services/LLMServices";
import { JsonEditor } from 'json-edit-react';
import { jsonrepair } from 'jsonrepair'
import { JSONObject } from "@/@types/prompt";


const LLMAnnotationValidation: React.FC = () => {
    const [decisionsWithExtractions, setDecisionsWithExtractions] = useState<DecisionWithExtraction[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDecisionsPanel, setShowDecisionsPanel] = useState(false);
    const [checkedDecisions, setCheckedDecisions] = useState<Record<string, boolean>>({});
    // For editing JSON
    const [editedJson, setEditedJson] = useState<JSONObject>();

    // Draggable hamburger button state
    const [btnPos, setBtnPos] = useState({ x: 16, y: 16 });
    const [dragging, setDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const location = useLocation();
    const datasetId = location.state?.datasetId;

    useEffect(() => {
        if (datasetId && location.state?.selectedModel) {
            setLoading(true);
            fetchDecisionsWithLLMExtractions(datasetId, location.state.selectedModel)
                .then(data => {
                    setDecisionsWithExtractions(data);
                    const firstExtraction = data[0]?.extraction;
                    setEditedJson(
                        typeof firstExtraction?.llm_json_result === "string"
                            ? JSON.parse(jsonrepair(firstExtraction.llm_json_result))
                            : firstExtraction?.llm_json_result || {}
                    );
                })
                .catch((err) => setError("Error fetching LLM extractions: " + err))
                .finally(() => setLoading(false));
        }
    }, [datasetId, location.state?.selectedModel]);

    // Update editedJson when selection changes
    useEffect(() => {
        const selected = decisionsWithExtractions[selectedIndex];
        setEditedJson(
            typeof selected?.extraction?.llm_json_result === "string"
                ? JSON.parse(jsonrepair(selected.extraction.llm_json_result))
                : selected?.extraction?.llm_json_result || {}
        );
    }, [selectedIndex, decisionsWithExtractions]);

    // Draggable handlers
    const handleDragStart = (e: React.MouseEvent) => {
        setDragging(true);
        dragOffset.current = {
            x: e.clientX - btnPos.x,
            y: e.clientY - btnPos.y,
        };
        document.body.style.userSelect = "none";
    };

    const handleDrag = (e: MouseEvent) => {
        if (!dragging) return;
        setBtnPos({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y,
        });
    };

        const handleDeleteSelected = async () => {
        const decisionIdsToDelete = Object.keys(checkedDecisions).filter((key) => checkedDecisions[key]);
        if (!decisionIdsToDelete.length) return;
        try {
            await deleteLLMDatasetDecisions(
                datasetId,
                decisionIdsToDelete,
                location.state.selectedModel
            );
            // Remove deleted decisions from state
            const remaining = decisionsWithExtractions.filter(
                d => !decisionIdsToDelete.includes(d.decision.id || "")
            );
            setDecisionsWithExtractions(remaining);
            setCheckedDecisions({});
            // Adjust selectedIndex if needed
            setSelectedIndex(prev => {
                if (remaining.length === 0) return 0;
                if (prev >= remaining.length) return remaining.length - 1;
                return prev;
            });
        } catch (error) {
            alert("Erreur lors de la suppression des décisions.");
        }
    };

    const handleDragEnd = () => {
        setDragging(false);
        document.body.style.userSelect = "";
    };

    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", handleDrag);
            window.addEventListener("mouseup", handleDragEnd);
        } else {
            window.removeEventListener("mousemove", handleDrag);
            window.removeEventListener("mouseup", handleDragEnd);
        }
        return () => {
            window.removeEventListener("mousemove", handleDrag);
            window.removeEventListener("mouseup", handleDragEnd);
        };
    }, [dragging]);

    // Handle 'v' key for validation and move to next decision
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Validate and move to next on 'v'
            if (e.key === 'v' || e.key === 'V') {
                const selected = decisionsWithExtractions[selectedIndex];
                if (selected && selected.extraction) {
                    try {
                        await saveExtractionValidation(
                            selected.extraction.id,
                            editedJson as JSONObject,
                            "validated"
                        );
                        setDecisionsWithExtractions(prev =>
                            prev.map((item, idx) =>
                                idx === selectedIndex
                                    ? {
                                        ...item,
                                        extraction: item.extraction
                                            ? {
                                                ...item.extraction,
                                                llm_json_result: JSON.stringify(editedJson),
                                                state: "validated"
                                            }
                                            : null
                                    }
                                    : item
                            )
                        );
                        setSelectedIndex(prev =>
                            prev + 1 < decisionsWithExtractions.length ? prev + 1 : 0
                        );
                    } catch (err) {
                        alert("Erreur lors de la validation de l'annotation LLM.");
                    }
                }
            }
            // Next decision: right or up arrow
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                setSelectedIndex(prev =>
                    prev + 1 < decisionsWithExtractions.length ? prev + 1 : 0
                );
            }
            // Previous decision: left or down arrow
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                setSelectedIndex(prev =>
                    prev - 1 >= 0 ? prev - 1 : decisionsWithExtractions.length - 1
                );
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [decisionsWithExtractions, selectedIndex, editedJson]);

    if (loading) return <div className="p-4 text-center mt-10"><strong>Chargement des décisions...</strong></div>;
    if (error) return <div className="p-4 text-red-500 text-center mt-10"><strong>{error}</strong></div>;

    const selected = decisionsWithExtractions[selectedIndex];

    // Helper for coloring
    function getDecisionColor(item: DecisionWithExtraction, idx: number) {
        if (idx === selectedIndex) return "bg-blue-100";
        if (item.extraction?.state === "validated") return "bg-green-100";
        return "bg-gray-50";
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <BasePage />
            <div className="flex-1 flex relative overflow-hidden">
                {/* Draggable Hamburger Button */}
                <button
                    className="fixed z-20 bg-white border rounded-md p-2 shadow hover:bg-gray-100 cursor-move"
                    style={{
                        top: btnPos.y,
                        left: btnPos.x,
                        transition: dragging ? "none" : "top 0.2s, left 0.2s",
                    }}
                    onMouseDown={handleDragStart}
                    onClick={() => setShowDecisionsPanel((prev) => !prev)}
                    title={showDecisionsPanel ? "Masquer la liste des décisions" : "Afficher la liste des décisions"}
                    type="button"
                >
                    <Menu className="w-6 h-6" />
                </button>
                {/* Panels */}
                {showDecisionsPanel && (
                    <div className="w-64 border-r flex flex-col bg-white z-10 h-full">
                        {/* Indicator line and Trash Icon */}
                        <div className="w-full flex items-center justify-between text-xs py-1 bg-gray-100 border-b sticky top-0 z-10 px-2">
                            <span>
                                {decisionsWithExtractions.length > 0
                                    ? `Décision ${selectedIndex + 1} / ${decisionsWithExtractions.length}`
                                    : "Aucune décision"}
                            </span>
                            <button
                                className={`ml-2 p-1 rounded ${Object.values(checkedDecisions).some(Boolean) ? "text-red-600 hover:bg-red-100" : "text-gray-400 cursor-not-allowed"}`}
                                disabled={!Object.values(checkedDecisions).some(Boolean)}
                                title="Supprimer les décisions sélectionnées"
                                onClick={handleDeleteSelected}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {decisionsWithExtractions.map((item, idx) => (
                                <div
                                    key={item.decision.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-2 text-sm ${getDecisionColor(item, idx)}`}
                                    onClick={() => setSelectedIndex(idx)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checkedDecisions[item.decision.id || ""] || false}
                                        onChange={e =>
                                            setCheckedDecisions(prev => ({
                                                ...prev,
                                                [item.decision.id || ""]: e.target.checked
                                            }))
                                        }
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <p className="break-words">
                                        <strong>{idx + 1}.</strong> {item.decision.j_juridiction}-{item.decision.j_ville}-{item.decision.j_date}-{item.decision.j_rg}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Decision Text Panel */}
                <div className="w-1/2 flex flex-col h-full overflow-hidden">
                    <Card className="flex-1 flex flex-col h-full overflow-hidden">
                        <CardContent className="flex-1 flex flex-col h-full overflow-hidden p-0">
                            <div className="flex-1 overflow-y-auto p-4">
                                {selected ? (
                                    <div
                                        className="decision-text whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: selected.decision.j_texte || "Aucun texte disponible." }}
                                    />
                                ) : (
                                    <div className="p-4 text-center">Sélectionnez une décision pour en afficher le texte.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* LLM Annotations Panel */}
                <div className="w-1/2 min-w-0 border-l flex flex-col bg-gray-50 h-full overflow-hidden">
                    <h3 className="text-lg font-semibold mb-2 p-2">Annotations LLM extraites</h3>
                    <div className="flex-1 overflow-y-auto p-2">
                        {selected && selected.extraction && selected.extraction.llm_json_result ? (
                            <div className="h-full w-full">
                                <JsonEditor
                                    data={editedJson}
                                    setData={(data) => setEditedJson(data as JSONObject)}
                                    /* onChange={
                                        (newData) => {
                                            setEditedJson(newData);
                                        }
                                    } */
                                    className="h-full w-full"

                                />
                            </div>
                        ) : (
                            <div className="text-gray-500">Aucune annotation LLM trouvée pour cette décision.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LLMAnnotationValidation;
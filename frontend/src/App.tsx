import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Users from './pages/Users'
import './index.css'
import RegisterPage from './pages/RegisterPage'
import React, { useEffect } from 'react'
import CategoriesPage from './pages/CategoriesPage'
import DatasetsPage from './pages/DatasetsPage'
import ModelsPage from './pages/ModelsPage'
import PromptsPage from './pages/PromptsPage'
import SearchPage from './pages/SearchPage'
import BinaryAnnotationPage from './pages/BinaryAnnotationPage'
import ExtractiveAnnotationPage from './pages/ExtractiveAnnotationPage'
import BinAnnotationValidation from './pages/BinAnnotationValidation'
import { useToast } from "@/components/ui/use-toast"; // adjust import as needed
import ExtractiveAnnotationValidation from './pages/ExtractiveAnnotationValidation'
import LLMAnnotationValidation from './pages/LLMAnnotationValidation'

const  App: React.FC = () => {
    const { toast } = useToast();

    useEffect(() => {
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent;
            toast({
                title: "Fin d'annotation extractive",
                description: customEvent.detail?.message || "L'annotation extractive est terminée.",
                className: "text-green-700",
            });
        };
        window.addEventListener("extract-annotation-finished", handler);
        return () => window.removeEventListener("extract-annotation-finished", handler);
    }, [toast]);

    return (
        <div className="App">
            <Router>
                <Routes>
                
                    <Route path="/" element={<SearchPage/>} /> 
                    <Route path='/users' element={<Users/>}/>
                
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path='/register' element={<RegisterPage/>}/>
                    <Route path='/categories' element={<CategoriesPage/>}/>
                    <Route path='/datasets/:id' element={<DatasetsPage/>}/>
                    <Route path='/models/:id' element={<ModelsPage/>}/>
                    <Route path='/prompts/:id' element={<PromptsPage/>}/>
                    <Route path='/annoter_bin/:id' element={<BinaryAnnotationPage/>}/>
                    <Route path='/annoter_ext/:id' element={<ExtractiveAnnotationPage/>}/>
                    <Route path='/validate/:datasetId' element={<BinAnnotationValidation/>}/>
                    <Route path='/validate_extractive/:datasetId' element={<ExtractiveAnnotationValidation/>}/>
                    <Route path='/validate_llm_extractive/:datasetId' element={<LLMAnnotationValidation/>}/>
                </Routes>
            </Router>
            
        </div>
    );
}

export default App;
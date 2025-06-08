import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Users from './pages/Users'
import './index.css'
import RegisterPage from './pages/RegisterPage'
import React, { useEffect } from 'react'
import { useToast } from "@/components/ui/use-toast"; // adjust import as needed
import CategoriesPage from './pages/CategoriesPage'
import ModelsPage from './pages/ModelsPage'
import PromptsPage from './pages/PromptsPage'
import SearchPage from './pages/SearchPage'
import BinaryAnnotationPage from './pages/BinaryAnnotationPage'
import BinAnnotationValidation from './pages/BinAnnotationValidation'
import ExtractiveAnnotationValidation from './pages/ExtractiveAnnotationValidation'
import ExtractiveAnnotationPage from './pages/ExtractiveAnnotationPage'
import DatasetsPage from './pages/DatasetsPage'
import LLMAnnotationValidation from './pages/LLMAnnotationValidation'
/* import { lazy, Suspense } from 'react';
const ExtractiveAnnotationPage = lazy(() => import('./pages/ExtractiveAnnotationPage'));
const LLMAnnotationValidation = lazy(() => import('./pages/LLMAnnotationValidation'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const PromptsPage = lazy(() => import('./pages/PromptsPage'));
const DatasetsPage = lazy(() => import('./pages/DatasetsPage'));
const ModelsPage = lazy(() => import('./pages/ModelsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BinaryAnnotationPage = lazy(() => import('./pages/BinaryAnnotationPage'));
const BinAnnotationValidation = lazy(() => import('./pages/BinAnnotationValidation'));
const ExtractiveAnnotationValidation = lazy(() => import('./pages/ExtractiveAnnotationValidation')); */



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
                
                    <Route path="/" element={ <SearchPage/> } /> 
                    <Route path='/users' element={<Users/>}/>
                
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path='/register' element={<RegisterPage/>}/>
                    <Route path='/categories' element={ <CategoriesPage/> }/>
                    <Route path='/datasets/:id'  element={ <DatasetsPage/> }/>
                    <Route path='/models/:id' element={ <ModelsPage/> }/>
                    <Route path='/prompts/:id' element={<PromptsPage/> }/>
                    <Route path='/annoter_bin/:id' element={ <BinaryAnnotationPage/> }/>
                    <Route path='/annoter_ext/:id'  element={ <ExtractiveAnnotationPage/> } />
                    <Route path='/validate/:datasetId' element={<BinAnnotationValidation/> }/>
                    <Route path='/validate_extractive/:datasetId' element={ <ExtractiveAnnotationValidation/> }/>
                    <Route path='/validate_llm_extractive/:datasetId'  element={ <LLMAnnotationValidation/> }/>
                </Routes>
            </Router>
            
        </div>
    );
}

export default App;
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import BasePage from './pages/BasePage'
import LoginPage from './pages/LoginPage'
import Users from './pages/Users'
import './index.css'
import RegisterPage from './pages/RegisterPage'
import React from 'react'
import CategoriesPage from './pages/CategoriesPage'
import DatasetsPage from './pages/DatasetsPage'
import ModelsPage from './pages/ModelsPage'
import PromptsPage from './pages/PromptsPage'
import SearchPage from './pages/SearchPage'
import BinaryAnnotationPage from './pages/BinaryAnnotationPage'
import ExtractiveAnnotationPage from './pages/ExtractiveAnnotationPage'


const  App: React.FC = () => {
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
                </Routes>
            </Router>
            
        </div>
    );
}

export default App;
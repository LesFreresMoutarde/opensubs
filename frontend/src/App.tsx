import React, {useEffect} from 'react';
import {Route, Routes} from "react-router-dom";
import Portal from "./components/Portal";
import FakeflixApp from "./components/FakeflixApp";
import SpooftifyApp from "./components/SpooftifyApp";
import ErrorPage from "./components/ErrorPage";
import OpenSubsApp from "./components/OpenSubsApp";
import {initializeApp} from "firebase/app";
import {firebaseConfig} from "./firebaseConfig";

function App() {

    useEffect(() => {
        initializeApp(firebaseConfig);
    }, []);

    return (
        <>
            <Routes>
                <Route path="/" element={<Portal/>}/>
                <Route path="/fakeflix/*" element={<FakeflixApp/>}/>
                <Route path="/spooftify/*" element={<SpooftifyApp/>}/>
                <Route path="/opensubs/*" element={<OpenSubsApp/>}/>
                <Route path="*" element={<ErrorPage/>}/>
            </Routes>
        </>
    );
}

export default App;
